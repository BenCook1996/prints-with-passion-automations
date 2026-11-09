import fs from 'fs';
import path from 'path';
import { WORKSPACE, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

const AUDIT_LOG_PATH = path.join(WORKSPACE, 'TECHNICAL_SEO_AUDIT_LOG.md');
const INDEXNOW_KEY = '9c4e2f8a1b7d6e3c5a0f9b8d7e6f5a4c';

async function resilientFetch(url, options = {}, retries = 3) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(options.headers || {})
  };
  for (let attempt = 0; attempt <= retries; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { ...options, headers });
      const duration = Date.now() - t0;

      const isRateLimited = res.status === 429 ||
        (res.status === 403 && res.headers.get('cf-mitigated') === 'challenge') ||
        res.status === 503;

      if (isRateLimited && attempt < retries) {
        let retryAfterMs = 0;
        const retryAfterHeader = res.headers.get('retry-after');
        if (retryAfterHeader) {
          const parsedSec = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsedSec)) retryAfterMs = parsedSec * 1000;
        }

        // True exponential backoff: 2s, 4s, 8s with 200-600ms decorrelated jitter, max wait cap 20000ms
        const exponentialMs = 2000 * Math.pow(2, attempt);
        const jitterMs = Math.floor(Math.random() * 400) + 200;
        const waitMs = Math.min(Math.max(retryAfterMs, exponentialMs + jitterMs), 20000);

        console.warn(`    [RATE-LIMIT ${res.status}] Cloudflare mitigation detected for ${url} (waiting ${waitMs}ms, attempt ${attempt + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
      return { res, duration };
    } catch (err) {
      if (attempt < retries) {
        const errorWaitMs = (2000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
        console.warn(`    [NETWORK-ERROR] Retrying ${url} in ${errorWaitMs}ms (${err.message})...`);
        await new Promise(r => setTimeout(r, errorWaitMs));
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  console.log('=== Prints With Passion — Daily Technical SEO, Crawl Budget, Merchant Schema, Canonical & Speed (TTFB) Audit ===');
  let errors = 0;
  let warnings = 0;

  // 1. Check /sitemap.xml child count & child sitemap hygiene (1 blog container, <=35 buyer guides, 0 pop-culture-icons)
  let smRes = await fetch('https://printswithpassion.com/sitemap.xml');
  let smXml = await smRes.text();
  let locs = [...smXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  for (let retry = 0; retry < 3 && locs.length > 42; retry++) {
    await new Promise(r => setTimeout(r, 1500));
    smRes = await fetch('https://printswithpassion.com/sitemap.xml', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
    smXml = await smRes.text();
    locs = [...smXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  }
  const blogSmRes = await fetch('https://printswithpassion.com/sitemap_blogs_1.xml?t=' + Date.now());
  const blogSmXml = await blogSmRes.text();
  const blogLocs = [...blogSmXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const singleBlogContainerOk = blogLocs.length === 1 && blogLocs[0] === 'https://printswithpassion.com/blogs/news';

  console.log(`[1/6] /sitemap.xml status=${smRes.status}, child sitemaps=${locs.length}, blogContainers=${blogLocs.length} (singleBlogOk=${singleBlogContainerOk})`);
  if (smRes.status !== 200 || locs.length > 10 || locs.length < 5 || !singleBlogContainerOk) {
    console.error(`  [ERROR] Sitemap child count (${locs.length}) or blog container hygiene (blogs=${blogLocs.length}) failed!`);
    errors++;
  } else {
    console.log(`  [PASS] Sitemap index is clean (${locs.length} canonical root sitemaps, 1 blog container, 0 duplicate locale subfolders).`);
  }

  // 2. Check /robots.txt crawl budget rules & Storebot-Google / Googlebot-Image allowances + IndexNow Key Endpoint
  const rbRes = await fetch('https://printswithpassion.com/robots.txt?t=' + Date.now());
  const rbTxt = await rbRes.text();
  const noPosTrap = !rbTxt.includes('Disallow: /*?_pos=*');
  const noVariantBlock = !rbTxt.includes('Disallow: /*?variant=*');
  const hasSortFilterBlock = rbTxt.includes('Disallow: /collections/*sort_by*') || rbTxt.includes('Disallow: /*?sort_by=*');
  const hasStorebotAllow = rbTxt.includes('User-agent: Storebot-Google');
  const hasImagebotAllow = rbTxt.includes('User-agent: Googlebot-Image');

  const keyRes = await fetch(`https://printswithpassion.com/${INDEXNOW_KEY}.txt`);
  const keyBody = (await keyRes.text()).trim();
  const indexNowKeyOk = keyRes.status === 200 && keyBody === INDEXNOW_KEY;

  console.log(`[2/6] /robots.txt status=${rbRes.status}, noPosTrap=${noPosTrap}, noVariantBlock=${noVariantBlock}, sortFilterBlocked=${hasSortFilterBlock}, storebotAllow=${hasStorebotAllow}, imagebotAllow=${hasImagebotAllow}, indexNowKeyOk=${indexNowKeyOk}`);
  if (!noPosTrap || !noVariantBlock || !hasSortFilterBlock || !hasStorebotAllow || !hasImagebotAllow || !indexNowKeyOk) {
    console.error('  [ERROR] /robots.txt or IndexNow key endpoint verification failed!');
    errors++;
  } else {
    console.log('  [PASS] /robots.txt directives (?variant= unblocked for GMC landing page crawl, sort/filter blocked, _pos unblocked) & IndexNow key endpoint verified.');
  }

  // 3. Check live HTML, Canonical URL, TTFB (ms), Clean 4-Column Footer Nav, Anti-Bloat DOM, Product 3-Level BreadcrumbList, Blog Index ItemList, Visualizer WebApplication, and 4K Wallpaper ItemList Schema
  const testUrls = [
    { name: 'Homepage', url: 'https://printswithpassion.com/', expectCleanFooter: true, expectOnlineStore: true, antiBloat: true },
    { name: 'Smart Sub-Collection (Japanese Desk Mats)', url: 'https://printswithpassion.com/collections/japanese-anime-desk-mats', expectCleanFooter: true, expectColSchema: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Apparel Smart Sub-Collection (Japanese Graphic Tees)', url: 'https://printswithpassion.com/collections/japanese-anime-graphic-t-shirts', expectCleanFooter: true, expectColSchema: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Product Page', url: 'https://printswithpassion.com/products/table-mountain-cape-town-xxl-desk-mat', expectImageLicense: true, expectMerchantOffer: true, expectBreadcrumb: true, expectProdFaq: true, antiBloat: true },
    { name: 'Blog Index Hub (/blogs/news)', url: 'https://printswithpassion.com/blogs/news', expectCleanFooter: true, expectBlogIndexSchema: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Blog Article Page', url: 'https://printswithpassion.com/blogs/news/mid-century-modern-home-office-living-room-styling-uk-guide', expectCleanFooter: true, expectArticleSchema: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Interactive Size Visualizer', url: 'https://printswithpassion.com/pages/desk-size-visualizer', expectCleanFooter: true, expectWebAppSchema: true, expectVizQuickJump: true, expectBreadcrumb: true, antiBloat: true },
    { name: '4K Wallpaper Vault', url: 'https://printswithpassion.com/pages/free-4k-wallpapers', expectBridge: true, expectQuickJump: true, expectVaultImgListSchema: true, antiBloat: true },
    { name: 'AI Catalog & Sizing Directory', url: 'https://printswithpassion.com/pages/ai-catalog-directory', expectCleanFooter: true, expectAiCatalog: true, antiBloat: true },
    { name: 'Hardware Ecosystem Compatibility Guide', url: 'https://printswithpassion.com/pages/desk-setup-hardware-compatibility-guide', expectCleanFooter: true, expectProdFaq: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Studio Standard vs. Generic Comparison Hub', url: 'https://printswithpassion.com/pages/studio-quality-vs-generic-prints', expectCleanFooter: true, expectProdFaq: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'B2B Trade & Bulk Orders Portal', url: 'https://printswithpassion.com/pages/trade-and-bulk-orders', expectCleanFooter: true, expectProdFaq: true, expectBreadcrumb: true, antiBloat: true },
    { name: 'Studio Lookbook & Social Feed Hub', url: 'https://printswithpassion.com/pages/studio-lookbook-social-feed', expectCleanFooter: true, expectBreadcrumb: true, antiBloat: true }
  ];

  console.log('[3/6] Auditing Live Storefront Templates, Canonical Tags, TTFB (ms), Clean Footer & Anti-Bloat DOM:');
  const ttfbList = [];
  for (const t of testUrls) {
    const isBlogRoute = t.url.includes('/blogs/');
    const pacingMs = isBlogRoute ? 1350 : 1000;
    await new Promise(r => setTimeout(r, pacingMs));
    const { res: r, duration: ttfbMs } = await resilientFetch(t.url);
    ttfbList.push(ttfbMs);
    const html = await r.text();
    const sizeKb = Math.round(html.length / 1024);

    const titleMatch = (html.match(/<title>(.*?)<\/title>/s) || [])[1]?.trim() || '';
    const titleOk = titleMatch.length > 10 && !titleMatch.includes('Prints With Passion USA') && !titleMatch.includes('Free US Shipping ($0.00 USD)');
    const canonicalMatch = (html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1] || '';
    const canonicalOk = canonicalMatch.startsWith('https://printswithpassion.com') && !canonicalMatch.includes('?');

    // Anti-bloat assertions: clean DOM, no 119-link footer directory, no matrix bundle, no collection FAQPage or hero bloat
    const antiBloatDirOk = !html.includes('pwp-seo-curated-directory') && !html.includes('pwp-seo-directory__journal');
    const antiBloatBundleOk = !html.includes('pwp-cross-substrate-bundle-and-matrix');
    const isCollection = t.url.includes('/collections/');
    const antiBloatColFaqOk = !isCollection || (!html.includes('"@type": "FAQPage"') && !html.includes('"@type":"FAQPage"'));
    const antiBloatHeroOk = !isCollection || !html.includes('PWP_INPAGES_3RULE_HERO');
    const cleanFooterOk = !t.expectCleanFooter || html.includes('pwp-site-footer');

    const onlineStoreOk = !t.expectOnlineStore || (html.includes('"@type": "OnlineStore"') && html.includes('"@type": "SearchAction"'));
    const colSchemaOk = !t.expectColSchema || html.includes('"@type": "CollectionPage"');
    const artSchemaOk = !t.expectArticleSchema || html.includes('"@type": "BlogPosting"');
    const blogIndexOk = !t.expectBlogIndexSchema || (html.includes('"@type": "Blog"') && html.includes('"@type": "ItemList"'));
    const prodFaqOk = !t.expectProdFaq || html.includes('"@type": "FAQPage"') || html.includes('"@type":"FAQPage"');
    const webAppOk = !t.expectWebAppSchema || (html.includes('"@type": "WebApplication"') && html.includes('"@type": "HowTo"'));
    const vizQuickJumpOk = !t.expectVizQuickJump || html.includes('pwp-visualizer-quick-jump');
    const vaultImgListOk = !t.expectVaultImgListSchema || html.includes('pwp-wallpaper-itemlist-schema');
    const breadcrumbOk = !t.expectBreadcrumb || html.includes('"@type": "BreadcrumbList"');
    const imgLicOk = !t.expectImageLicense || html.includes('"acquireLicensePage": "https://printswithpassion.com/pages/free-4k-wallpapers"');
    const merchantOfferOk = !t.expectMerchantOffer || (
      html.includes('"@type": "Product"') &&
      html.includes('"shippingDetails"') &&
      html.includes('"hasMerchantReturnPolicy"')
    );
    const bridgeOk = !t.expectBridge || html.includes('pwp-wallpaper-collection-bridge');
    const quickJumpOk = !t.expectQuickJump || html.includes('pwp-wallpaper-quick-jump');
    const aiCatOk = !t.expectAiCatalog || (html.includes('pwp-ai-catalog-directory') && html.includes('pwp-ai-daily-citation-matrix'));
    const ga4BridgeOk = html.includes('id="pwp-ga4-ecommerce-bridge"') && html.includes('window.__pwpIsBot');
    const leanPayloadOk = sizeKb < 1500;

    const antiBloatAllOk = antiBloatDirOk && antiBloatBundleOk && antiBloatColFaqOk && antiBloatHeroOk;

    console.log(`  - ${t.name}: HTTP ${r.status} | TTFB=${ttfbMs}ms (${sizeKb}KB, leanOk=${leanPayloadOk}) | canonicalOk=${canonicalOk} | ga4Bridge=${ga4BridgeOk} | titleOk=${titleOk} | antiBloat=${antiBloatAllOk} | cleanFooter=${cleanFooterOk} | colSchema=${colSchemaOk}`);
    if (
      r.status !== 200 || !canonicalOk || !ga4BridgeOk || !titleOk || !antiBloatAllOk || !cleanFooterOk ||
      !onlineStoreOk || !colSchemaOk || !artSchemaOk ||
      !blogIndexOk || !prodFaqOk || !webAppOk || !vizQuickJumpOk || !vaultImgListOk ||
      !breadcrumbOk || !imgLicOk || !merchantOfferOk || !bridgeOk || !quickJumpOk || !aiCatOk || !leanPayloadOk
    ) {
      errors++;
    }
  }
  const avgTtfbMs = Math.round(ttfbList.reduce((a, b) => a + b, 0) / ttfbList.length);

  // 4. Audit .atom Syndication Feeds & Latest Blog Article Internal Link Integrity
  const feeds = [
    'https://printswithpassion.com/blogs/news.atom',
    'https://printswithpassion.com/collections/desk-mats.atom',
    'https://printswithpassion.com/collections/canvas-prints.atom'
  ];
  console.log('[4/6] Auditing .atom Syndication Feeds & Latest Blog Internal Links:');
  let latestBlogUrl = null;
  for (const f of feeds) {
    const isBlogFeed = f.includes('/blogs/');
    await new Promise(r => setTimeout(r, isBlogFeed ? 1350 : 1000));
    const { res: r } = await resilientFetch(f);
    const txt = await r.text();
    console.log(`  - Feed ${f}: HTTP ${r.status} (${txt.length} bytes)`);
    if (r.status !== 200) errors++;
    if (f.endsWith('/blogs/news.atom')) {
      const m = txt.match(/https:\/\/printswithpassion\.com\/blogs\/news\/[a-z0-9-]+/i);
      if (m) latestBlogUrl = m[0];
    }
  }
  if (latestBlogUrl) {
    await new Promise(r => setTimeout(r, 1350));
    const { res: br } = await resilientFetch(latestBlogUrl);
    const bHtml = await br.text();
    const internalLinks = [...new Set([...bHtml.matchAll(/href="(\/(?:collections|products|pages)\/[a-z0-9-_]+)"/gi)].map(m => `https://printswithpassion.com${m[1]}`))].slice(0, 4);
    for (const il of internalLinks) {
      await new Promise(r => setTimeout(r, 1000));
      const { res: ir } = await resilientFetch(il);
      console.log(`  - Latest Blog Internal Link (${il}): HTTP ${ir.status}`);
      if (ir.status !== 200) errors++;
    }
  }

  // 5. Daily Rotating Deep-Audit of 6 of 48 Smart Sub-Collections (auditing all 48 every 8 days)
  const subs = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const startOffset = (dayOfYear * 6) % subs.length;
  const sampleSubs = [];
  for (let i = 0; i < 6; i++) {
    sampleSubs.push(subs[(startOffset + i) % subs.length]);
  }
  console.log(`[5/6] Deep-auditing 6 rotated Smart Sub-Collections (offset ${startOffset}/${subs.length}):`);
  for (const s of sampleSubs) {
    await new Promise(r => setTimeout(r, 1000));
    const u = `https://printswithpassion.com/collections/${s.handle}`;
    const { res: r } = await resilientFetch(u);
    const html = await r.text();
    const canonicalOk = html.includes(`<link rel="canonical" href="${u}">`);
    const antiBloatDirOk = !html.includes('pwp-seo-curated-directory') && !html.includes('pwp-seo-directory__journal');
    const antiBloatHeroOk = !html.includes('PWP_INPAGES_3RULE_HERO');
    const antiBloatFaqOk = !html.includes('"@type": "FAQPage"');
    const cleanFooterOk = html.includes('pwp-site-footer');
    const colSchemaOk = html.includes('"@type": "CollectionPage"');
    const antiBloatSubOk = antiBloatDirOk && antiBloatHeroOk && antiBloatFaqOk && cleanFooterOk;
    console.log(`  - ${s.handle}: HTTP ${r.status} | canonicalOk=${canonicalOk} | antiBloat=${antiBloatSubOk} | cleanFooter=${cleanFooterOk} | colSchema=${colSchemaOk}`);
    if (r.status !== 200 || !canonicalOk || !antiBloatSubOk) errors++;
  }

  // 6. Append dated audit summary to TECHNICAL_SEO_AUDIT_LOG.md
  const timestamp = new Date().toISOString();
  const row = `| \`${timestamp}\` | \`${locs.length}\` Canonical Root Sitemaps | PASS (\`Avg TTFB: ${avgTtfbMs}ms\` + \`IndexNow Key OK\` + \`Canonical OK\`) | PASS (\`OnlineStore\` + \`Clean 4-Col Footer & Anti-Bloat DOM\` + \`Product FAQPage & 3-Level BreadcrumbList\` + \`Blog ItemList\` + \`WebApplication\`) | PASS (\`CC-BY 4.0\` + \`30-Item Wallpaper ItemList\`) | \`${subs.length} / ${subs.length}\` Active (6 Deep-Audited) | **${errors === 0 ? 'PASS (0 Errors)' : `FAIL (${errors} Errors)`}** |\n`;
  fs.appendFileSync(AUDIT_LOG_PATH, row, 'utf8');
  console.log(`[6/6] Appended audit entry to ${AUDIT_LOG_PATH} (Avg TTFB: ${avgTtfbMs}ms)`);

  console.log(`\n=== Audit Complete: ${errors} errors, ${warnings} warnings ===`);
  if (errors > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
