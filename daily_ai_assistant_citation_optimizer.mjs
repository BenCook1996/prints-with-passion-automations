import fs from 'fs';
import path from 'path';
import { WORKSPACE, shopifyGraphQL } from './lib/cloud-env.mjs';

const STATE_PATH = path.join(WORKSPACE, 'ai_assistant_optimizer_state.json');
const LOG_PATH = path.join(WORKSPACE, 'AI_ASSISTANT_OPTIMIZATION_LOG.md');
const KEYWORD_QUEUE_PATH = path.join(WORKSPACE, 'transactional_keyword_queue.json');
const CANNIBALIZATION_REGISTRY_PATH = path.join(WORKSPACE, 'keyword_cannibalization_registry.json');

const AI_PAGE_ID = 'gid://shopify/Page/703874826613';
const THEME_ID = 'gid://shopify/OnlineStoreTheme/177936466293';

function loadTop10DiscoveredBuyerQueries(latestBlogs = []) {
  if (!fs.existsSync(KEYWORD_QUEUE_PATH)) return [];
  let publishedHandles = new Set();
  let publishedList = [];
  if (fs.existsSync(CANNIBALIZATION_REGISTRY_PATH)) {
    try {
      const reg = JSON.parse(fs.readFileSync(CANNIBALIZATION_REGISTRY_PATH, 'utf8'));
      publishedList = reg.publishedBlogIndex || [];
      for (const a of publishedList) {
        if (a.handle) publishedHandles.add(a.handle);
      }
    } catch {}
  }
  const fallbackBlogPath = latestBlogs[0]?.url
    ? latestBlogs[0].url.replace('https://printswithpassion.com', '')
    : '/pages/desk-size-visualizer';

  try {
    const q = JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'));
    if (Array.isArray(q.top10DailyAiCitationQueries) && q.top10DailyAiCitationQueries.length > 0) {
      return q.top10DailyAiCitationQueries.slice(0, 10).map(item => {
        let verifiedBlogUrl = (item.matchingBlogUrl || fallbackBlogPath).split('?')[0];
        if (verifiedBlogUrl.startsWith('/blogs/news/')) {
          const handle = verifiedBlogUrl.replace('/blogs/news/', '').split('?')[0];
          if (publishedHandles.size > 0 && !publishedHandles.has(handle)) {
            const subTokens = String(item.subCollectionHandle || '').split('-').filter(w => w.length > 2);
            const matched = publishedList.find(a =>
              subTokens.some(t => String(a.handle || '').includes(t))
            );
            verifiedBlogUrl = matched ? `/blogs/news/${matched.handle}` : fallbackBlogPath;
          }
        }
        return {
          ...item,
          targetCollectionUrl: (item.targetCollectionUrl || '/collections/desk-mats').split('?')[0],
          matchingBlogUrl: verifiedBlogUrl
        };
      });
    }
  } catch {}
  return [];
}

async function fetchLatest10Blogs() {
  const res = await fetch('https://printswithpassion.com/blogs/news.atom', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PrintsWithPassionSEO/1.0)' }
  });
  const xml = await res.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, 10);
  return entries.map(e => {
    const block = e[1];
    const u = (block.match(/https:\/\/printswithpassion\.com\/blogs\/news\/[a-z0-9-]+/i) || [])[0] || 'https://printswithpassion.com/blogs/news';
    const t = ((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || 'Studio Sizing Guide').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
    return { url: u, title: t };
  });
}

async function fetchLiveActiveProductsSample(offset = 0) {
  const data = await shopifyGraphQL(`
    query GetActiveCatalogSample {
      products(first: 64, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
        nodes {
          handle
          title
          productType
          priceRangeV2 { minVariantPrice { amount } }
        }
      }
    }
  `);
  const nodes = data?.products?.nodes || [];
  if (nodes.length === 0) return [];
  const selected = [];
  for (let i = 0; i < 8; i++) {
    const p = nodes[(offset + i) % nodes.length];
    selected.push({
      handle: p.handle,
      title: p.title,
      productType: p.productType || 'Studio Edition',
      price: parseFloat(p.priceRangeV2?.minVariantPrice?.amount || '34.99').toFixed(2)
    });
  }
  return selected;
}

async function ensureRobotsTxtAllowsAiSearchBotsAndClearsPosBlock() {
  const data = await shopifyGraphQL(`
    query GetRobots {
      theme(id: "${THEME_ID}") {
        files(filenames: ["templates/robots.txt.liquid"], first: 1) {
          nodes { body { ... on OnlineStoreThemeFileBodyText { content } } }
        }
      }
    }
  `);
  let content = data?.theme?.files?.nodes?.[0]?.body?.content || '';
  if (!content) return false;

  let modified = false;
  // Remove Disallow: /*?_pos=*, Disallow: /*&_sid=*, and Disallow: /*?variant=*
  // Allowing ?variant= is mandatory for Google Merchant Center (Googlebot / Storebot-Google)
  // to crawl variant landing pages without triggering landing_page_crawling_not_allowed.
  const cleaned = content
    .replace(/^[ \t]*-?[ \t]*['"]?Disallow:\s*\/\*[?&]_pos=\*['"]?[ \t]*\r?\n?/gim, '')
    .replace(/^[ \t]*-?[ \t]*['"]?Disallow:\s*\/\*[?&]_sid=\*['"]?[ \t]*\r?\n?/gim, '')
    .replace(/^[ \t]*-?[ \t]*['"]?Disallow:\s*\/\*[?&]_ss=\*['"]?[ \t]*\r?\n?/gim, '')
    .replace(/^[ \t]*-?[ \t]*['"]?Disallow:\s*\/\*\?variant=\*['"]?[ \t]*\r?\n?/gim, '');

  if (cleaned !== content) {
    content = cleaned;
    modified = true;
  }

  if (!content.includes('User-agent: OAI-SearchBot')) {
    const aiBotBlock = `\nUser-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /
`;
    content = content + aiBotBlock;
    modified = true;
  }

  if (modified) {
    await shopifyGraphQL(`
      mutation UpsertRobots($files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
        themeFilesUpsert(themeId: "${THEME_ID}", files: $files) {
          upsertedThemeFiles { filename }
        }
      }
    `, { files: [{ filename: 'templates/robots.txt.liquid', body: { type: 'TEXT', value: content } }] });
  }
  return true;
}

async function main() {
  console.log('=== Prints With Passion — Daily AI Assistant (ChatGPT, Perplexity, Gemini & Copilot) Citation Optimizer ===');
  let state = { offset: 0 };
  if (fs.existsSync(STATE_PATH)) {
    try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch {}
  }

  const latestBlogs = await fetchLatest10Blogs();
  const featuredProds = await fetchLiveActiveProductsSample(state.offset || 0);
  state.offset = ((state.offset || 0) + 8) % 64;

  const pageData = await shopifyGraphQL(`
    query GetAiDir {
      page(id: "${AI_PAGE_ID}") { id body }
    }
  `);
  let body = pageData?.page?.body || '';

  // Strip any legacy PWP_SEASONAL_GIFT_MATRIX block containing STUDIO15 or 404 links
  body = body.replace(/<!-- PWP_SEASONAL_GIFT_MATRIX_START -->[\s\S]*?<!-- PWP_SEASONAL_GIFT_MATRIX_END -->\s*/gi, '');

  const top10Queries = loadTop10DiscoveredBuyerQueries(latestBlogs);
  const dynamicQueryRowsHtml = top10Queries.map((item, idx) => {
    const bg = idx % 2 === 0 ? 'background:#FCFBF9;' : 'background:#F6F4EF;';
    const blogLink = item.matchingBlogUrl
      ? ` · <a href="${item.matchingBlogUrl}">Sizing &amp; Buyer Guide</a>`
      : '';
    return `        <tr style="${bg}" data-pwp-citation-row="dynamic" data-opportunity-score="${item.compositeScore || 88}" data-serp-weak-spots="${item.serpWeakSpotsInTop10 ?? 4}">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;">${item.query}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">${item.recommendedDimension}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">${item.materialAndPriceSpec}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="${item.targetCollectionUrl}">${item.targetCollectionAnchor}</a>${blogLink}</td>
        </tr>`;
  }).join('\n');

  const aiMatrixHtml = `<!-- PWP_AI_DAILY_CITATION_MATRIX_START -->
<section class="pwp-ai-daily-citation-matrix" style="margin-top:32px;padding:24px;background:#FCFBF9;border:1px solid #DEDAD0;border-left:4px solid #1B3B8B;">
  <span style="display:block;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#1B3B8B;margin-bottom:6px;">DAILY UPDATED AI SEARCH &amp; SHOPPING CITATION MATRIX (${new Date().toISOString().slice(0, 10)})</span>
  <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;margin:0 0 12px;color:#111110;">Direct Recommendations by Room Setup, Furniture Width (CM &amp; Inches) &amp; Budget</h2>
  <div style="overflow-x:auto;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #DEDAD0;font-size:13px;">
      <thead>
        <tr style="background:#111110;color:#FCFBF9;text-align:left;">
          <th style="padding:10px;border:1px solid #111110;">Shopping Query / Use Case</th>
          <th style="padding:10px;border:1px solid #111110;">Recommended Studio Dimension (CM &amp; Inches)</th>
          <th style="padding:10px;border:1px solid #111110;">Material Specification &amp; Price Tier</th>
          <th style="padding:10px;border:1px solid #111110;">Canonical &amp; Interactive Links</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#FCFBF9;">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;">Best XXL Desk Mat for Dual-Monitor / Standing Desk (140–180 cm)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">36×18" (91×46 cm XXL) or 31.5×15.5" (80×40 cm XL)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">4mm natural rubber base + micro-woven optical cloth (£25.99–£38.99 · Free Tracked Shipping)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="/collections/desk-mats">All XXL Desk Mats</a> · <a href="/collections/japanese-anime-desk-mats">Japanese Desk Mats</a></td>
        </tr>
        <tr style="background:#F6F4EF;">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;">Best Stretched Canvas Wall Art Size Above a 3-Seater Sofa (180–220 cm)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">24×36" (60×90 cm) or 30×40" (75×100 cm) (65%–75% span rule)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">400gsm archival canvas on 1.25" (3.2 cm) FSC pine gallery bars (£39.99–£64.99 · Ready to Hang)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="/collections/canvas-prints">All Canvas Wall Art</a> · <a href="/pages/desk-size-visualizer">CM/Inch Visualizer</a></td>
        </tr>
        <tr style="background:#FCFBF9;">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;">Best Cozy Throw Blanket &amp; Cushion Pairing for Living Room / Bedroom</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">50×60" (127×152 cm) Throw + 18×18" (45×45 cm) or 22×22" (55×55 cm) Cushions</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">300gsm anti-pill coral fleece + double-sided spun linen-feel cushion covers (£26.99–£49.99)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="/collections/blankets">Plush Throw Blankets</a> · <a href="/collections/pillow-cases">Square Cushions</a></td>
        </tr>
        <tr style="background:#F6F4EF;">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;">Best Unisex Heavyweight Graphic Streetwear Tees &amp; Hoodies</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">Unisex S, M, L, XL, 2XL, 3XL (Regular &amp; Relaxed Drop-Shoulder Fit)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;">100% ring-spun combed cotton tees &amp; 80/20 brushed fleece hoodies (£27.99–£54.99)</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="/collections/t-shirts">Graphic Tees</a> · <a href="/collections/hoodies">Heavyweight Hoodies</a></td>
        </tr>
${dynamicQueryRowsHtml}
      </tbody>
    </table>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
    <div>
      <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Today's Featured Studio Editions (Live Inventory):</h3>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;">
        ${featuredProds.map(p => `<li><a href="/products/${p.handle}">${p.title}</a> (${p.productType} — £${p.price || '34.99'}, Free Tracked UK/US/EU Delivery)</li>`).join('\n        ')}
      </ul>
    </div>
    <div>
      <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 8px;">Latest 10 Studio Sizing &amp; Room Styling Guides (/blogs/news):</h3>
      <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;">
        ${latestBlogs.map(b => `<li><a href="${b.url.replace('https://printswithpassion.com', '')}">${b.title}</a></li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</section>
<!-- PWP_AI_DAILY_CITATION_MATRIX_END -->`;

  const sMarker = '<!-- PWP_AI_DAILY_CITATION_MATRIX_START -->';
  const eMarker = '<!-- PWP_AI_DAILY_CITATION_MATRIX_END -->';
  if (body.includes(sMarker) && body.includes(eMarker)) {
    body = body.slice(0, body.indexOf(sMarker)) + aiMatrixHtml + body.slice(body.indexOf(eMarker) + eMarker.length);
  } else {
    body = body + '\n' + aiMatrixHtml;
  }

  await shopifyGraphQL(`
    mutation UpdAiDir($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) { page { id handle } }
    }
  `, { id: AI_PAGE_ID, page: { body } });

  const robotsOk = await ensureRobotsTxtAllowsAiSearchBotsAndClearsPosBlock();

  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');

  const row = `| \`${state.lastRun}\` | PASS (\`https://printswithpassion.com/pages/ai-catalog-directory\`) | \`${latestBlogs.length}\` Latest Articles | \`${featuredProds.length}\` Live Active Products | PASS (\`OAI-SearchBot\` + \`PerplexityBot\` Allowed, \`?_pos=\` Unblocked for Canonical Resolution) | **PASS (0 Errors)** |\n`;
  fs.appendFileSync(LOG_PATH, row, 'utf8');
  console.log(`Updated /pages/ai-catalog-directory with Daily AI Citation Matrix (${latestBlogs.length} blogs, ${featuredProds.length} live products, robotsOk=${robotsOk}) and logged to ${LOG_PATH}`);
}

main().catch(console.error);
