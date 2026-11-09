import fs from 'fs';
import {
  shopifyGql,
  pickProductsForSubCollection,
  renderProductGrid,
  renderQuickTakeawaysBox,
  renderFaqSchema,
  renderHowToSchema
} from './article_builder_base.mjs';

const STATE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\blog_refresh_cursor_state.json';
const TRACKER_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\blog_content_tracker.md';
const KEYWORD_QUEUE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\transactional_keyword_queue.json';
const keywordQueue = fs.existsSync(KEYWORD_QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'))
  : { bySubCollection: {} };

function getQueuedKeywordEnrichmentForArticle(productType, themeTag) {
  const allClusters = Object.values(keywordQueue.bySubCollection || {}).flat();
  const matching = allClusters
    .filter(c => c.productType === productType && c.themeTag === themeTag)
    .sort((a, b) => (b.scores?.compositeOpportunityScore || b.opportunityScore || 0) - (a.scores?.compositeOpportunityScore || a.opportunityScore || 0));

  const topCluster = matching[0] || allClusters.find(c => c.productType === productType) || null;
  if (!topCluster) return { modifiers: [], faqs: [], subCollectionUrl: '/collections/all', subCollectionAnchor: productType };

  return {
    modifiers: (topCluster.secondaryLongTailModifiers || []).slice(0, 3),
    faqs: (topCluster.buyerFaqQuestions || []).slice(0, 2),
    subCollectionUrl: topCluster.subCollectionUrl || `/collections/${topCluster.subCollectionHandle}`,
    subCollectionAnchor: topCluster.collectionAnchorText || `${themeTag} ${productType}`
  };
}

function inferSubstrateAndTheme(title, handle) {
  const lower = `${title} ${handle}`.toLowerCase();
  let productType = 'Canvas Wall Art';
  if (/desk|mouse|setup|keyboard|monitor|office|gaming/.test(lower)) productType = 'Desk Mats';
  else if (/blanket|throw|fleece|snug|hygge|cozy|bed/.test(lower)) productType = 'Throw Blankets';
  else if (/cushion|pillow|sofa|couch/.test(lower)) productType = 'Cushion Covers';
  else if (/bath|shower|vanity|spa|ensuite/.test(lower)) productType = 'Bath Mats';
  else if (/hoodie|sweatshirt|streetwear/.test(lower)) productType = 'Hoodies';
  else if (/t-shirt|tee|shirt|apparel/.test(lower)) productType = 'Graphic T-Shirts';

  let themeTag = 'Sci-Fi & Cyberpunk';
  if (/japan|samurai|sakura|ukiyo|anime|zen|koi/.test(lower)) themeTag = 'Japanese & Asian Art';
  else if (/star wars|jedi|sith|vader|skywalker|mandalorian|falcon|space|galaxy|nebula|cosmic|astronaut/.test(lower)) themeTag = 'Space & Cosmic';
  else if (/fantasy|dragon|myth|gothic|witch|wizard|lotr|ring|knight/.test(lower)) themeTag = 'Fantasy & Mythology';
  else if (/\b(botanical|floral|flower|monstera|fern|eucalyptus|garden|leaf|leaves|plant|herbarium|bloom|peony)\b/.test(lower)) themeTag = 'Botanical & Floral';
  else if (/\b(travel|city|cities|tokyo|paris|london|new york|nyc|rome|venice|amalfi|santorini|kyoto|lisbon|barcelona|architecture|skyline|map|street)\b/.test(lower)) themeTag = 'World Travel & Cities';
  else if (/nature|mountain|forest|landscape|alpine|coastal|ocean/.test(lower)) themeTag = 'Nature & Landscapes';
  else if (/animal|wildlife|cat|dog|wolf|lion|highland/.test(lower)) themeTag = 'Animals & Wildlife';
  else if (/retro|vintage|synthwave|80s|70s|mid-century/.test(lower)) themeTag = 'Retro & Vintage';
  else if (/abstract|minimalist|bauhaus|geometric|modern/.test(lower)) themeTag = 'Abstract & Geometric';

  return { productType, themeTag };
}

function generateTailoredFaqsForArticle(title, productType, themeTag = 'Sci-Fi & Cyberpunk') {
  const cleanTitle = title.replace(/\s*\(\d{4}\).*$/, '').trim();
  const enrichment = getQueuedKeywordEnrichmentForArticle(productType, themeTag);
  const discoveredFaqs = enrichment.faqs.map(f => ({
    question: f.question,
    answer: `${f.answerHint} Explore our full <a href="${enrichment.subCollectionUrl}">${enrichment.subCollectionAnchor}</a> collection or preview exact room proportions in our interactive size visualizer at printswithpassion.com/pages/desk-size-visualizer.`
  }));
  const baselineFaqs = [
    {
      question: `What dimensions and sizes are recommended for ${cleanTitle}?`,
      answer: `For balanced architectural proportions across UK, US, and European interiors, measure your primary furniture width first and select a ${productType.toLowerCase()} span covering 60% to 75% of the desk or sofa width. Use our interactive CM & Inch Desk & Wall Art Size Visualizer at printswithpassion.com/pages/desk-size-visualizer to preview exact proportions.`
    },
    {
      question: `How do I care for and maintain Prints With Passion studio editions?`,
      answer: `Our 4mm high-density natural rubber desk mats, double-sided linen-feel cushion covers, and 300gsm coral fleece throws can be spot-cleaned with a damp microfiber cloth or machine-washed on a gentle 30°C cold cycle and air-dried flat. Our 400gsm stretched canvases use 100-year UV archival inks that never require glass framing.`
    },
    {
      question: `Is tracked shipping included across the UK, US, Canada, and Europe?`,
      answer: `Yes—every Prints With Passion order is custom-produced at our nearest regional print studio in the UK, USA, Canada, EU, or Australia and includes 100% Free Tracked Delivery with a 30-day return guarantee.`
    }
  ];
  return [...discoveredFaqs, ...baselineFaqs].slice(0, 4);
}

function generateHowToStepsForArticle(title, productType) {
  const cleanTitle = title.replace(/\s*\(\d{4}\).*$/, '').trim();
  return {
    name: `How to Style & Size ${cleanTitle} (${productType})`,
    description: `Step-by-step architectural sizing and styling guide for ${cleanTitle} using dual Metric (cm) and Imperial (inch) proportions.`,
    steps: [
      {
        name: 'Measure Your Primary Desk, Wall, or Sofa Span (CM & Inches)',
        text: 'Measure the full width of your desk, sofa, or bed frame in centimetres (cm) or inches and multiply by 0.65 to 0.75 to find your ideal focal span.'
      },
      {
        name: `Select Your Coordinated ${productType} & Smart Sub-Collection Motif`,
        text: `Choose a studio edition from our curated ${productType} sub-collections that echoes two dominant accent colours in your room.`
      },
      {
        name: 'Pair with Matching 4K Digital Wallpapers & Interactive Sizing Tools',
        text: 'Download a matching CC-BY 4.0 4K desktop wallpaper from printswithpassion.com/pages/free-4k-wallpapers and verify clearances in our interactive visualizer.'
      }
    ]
  };
}

async function main() {
  let state = { afterCursor: null, totalRefreshed: 0, history: [], pass7Upgraded: false };
  if (fs.existsSync(STATE_PATH)) {
    try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch {}
  }
  if (!state.pass7Upgraded) {
    state.afterCursor = null;
    state.pass7Upgraded = true;
  }

  const res = await shopifyGql(`
    query GetArticlesBatch($cursor: String) {
      articles(first: 25, after: $cursor, sortKey: PUBLISHED_AT, reverse: false) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          handle
          title
          body
          summary
        }
      }
    }
  `, { cursor: state.afterCursor });

  const conn = res?.data?.articles;
  const nodes = conn?.nodes || [];
  let refreshedCount = 0;
  const refreshedHandles = [];

  for (const art of nodes) {
    if (refreshedCount >= 4) break;
    const body = art.body || '';
    const hasFaqSchema = body.includes('"@type":"FAQPage"') || body.includes('"@type": "FAQPage"');
    const hasStudioBrief = body.includes('EDITORIAL STUDIO BRIEF');
    const hasShoppableGrid = body.includes('Shop Studio Edition →') || body.includes('Explore Curated ');
    const hasHowToSchema = body.includes('"@type":"HowTo"') || body.includes('"@type": "HowTo"');

    if (!hasFaqSchema || !hasStudioBrief || !hasShoppableGrid || !hasHowToSchema) {
      const { productType, themeTag } = inferSubstrateAndTheme(art.title, art.handle);
      let updatedBody = body;

      if (!hasStudioBrief) {
        const enrichment = getQueuedKeywordEnrichmentForArticle(productType, themeTag);
        const kwFocusHtml = enrichment.modifiers.length
          ? `<strong>High-Intent Setup Specs Covered:</strong> Optimized for <em>${enrichment.modifiers.slice(0, 2).join('</em> &amp; <em>')}</em> — browse all matching <a href="${enrichment.subCollectionUrl}" style="color:#1B3B8B;text-decoration:underline;font-weight:600;">${enrichment.subCollectionAnchor}</a>.`
          : `<strong>Archival Studio Materials:</strong> Custom-printed on 4mm natural rubber desk mats, 400gsm FSC pine stretched canvas, and 300gsm plush coral fleece (<a href="/pages/ai-catalog-directory" style="color:#1B3B8B;text-decoration:underline;font-weight:600;">Full 58-Collection Directory</a>).`;
        const takeawaysBox = renderQuickTakeawaysBox(
          `Quick Takeaways: ${art.title.slice(0, 68)}`,
          [
            `<strong>Dual Metric &amp; Imperial Proportions:</strong> Match 60%–75% of your desk or sofa span using our <a href="/pages/desk-size-visualizer" style="color:#1B3B8B;text-decoration:underline;font-weight:600;">Interactive CM &amp; Inch Size Visualizer</a>.`,
            kwFocusHtml,
            `<strong>Global Tracked Fulfillment:</strong> 100% Free Tracked UK, US, CA, AU &amp; EU Delivery included on every studio order, plus matching <a href="/pages/free-4k-wallpapers" style="color:#1B3B8B;text-decoration:underline;font-weight:600;">Free 4K Wallpapers (CC-BY 4.0)</a>.`
          ]
        );
        updatedBody = takeawaysBox + '\n' + updatedBody;
      }

      if (!hasShoppableGrid) {
        const recommendedHandles = pickProductsForSubCollection(productType, themeTag, 4);
        const shoppableSection = `\n<section class="pwp-refreshed-shoppable-showcase" style="margin:32px 0;padding-top:20px;border-top:1px solid #DEDAD0;">
  <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:1.65rem;color:#111110;margin:0 0 10px;">Curated ${themeTag} ${productType} &amp; Studio Editions</h2>
  <p style="color:#33312E;font-size:0.95rem;line-height:1.7;margin:0 0 16px;">Explore bespoke, studio-grade ${productType.toLowerCase()} inspired by this guide—custom-printed with 100% Free Tracked UK, US, CA, AU &amp; EU Delivery:</p>
  ${renderProductGrid(recommendedHandles)}
</section>\n`;
        updatedBody = updatedBody + shoppableSection;
      }

      if (!hasFaqSchema) {
        const faqs = generateTailoredFaqsForArticle(art.title, productType, themeTag);
        updatedBody = updatedBody + '\n' + renderFaqSchema(faqs);
      }

      if (!hasHowToSchema) {
        const howTo = generateHowToStepsForArticle(art.title, productType);
        updatedBody = updatedBody + '\n' + renderHowToSchema(howTo.name, howTo.description, howTo.steps);
      }

      const upd = await shopifyGql(`
        mutation RefreshArticle($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle }
            userErrors { field message }
          }
        }
      `, {
        id: art.id,
        article: { body: updatedBody }
      });

      if (upd?.data?.articleUpdate?.article) {
        refreshedCount++;
        refreshedHandles.push(art.handle);
      }
    }
  }

  state.afterCursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
  state.totalRefreshed = (state.totalRefreshed || 0) + refreshedCount;
  state.lastRun = new Date().toISOString();
  state.history = [...(state.history || []).slice(-30), { date: state.lastRun.slice(0, 10), refreshedHandles }];
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');

  // Sync progress line directly into blog_content_tracker.md (Refinement 6)
  if (fs.existsSync(TRACKER_PATH)) {
    try {
      let tracker = fs.readFileSync(TRACKER_PATH, 'utf8');
      const statusLine = `- **Historical Blog Rich-Snippet & Shoppable Grid Refresh Progress:** **\`${state.totalRefreshed}\` Historical Articles Upgraded with Studio Brief + 4-Product Shoppable Grid + Smart Sub-Collection Pills + \`FAQPage\`/\`HowTo\` JSON-LD (Latest Batch: \`${refreshedHandles.join('`, `')}\` — Last Run: \`${state.lastRun}\`)**`;
      if (tracker.includes('Historical Blog Rich-Snippet & Shoppable Grid Refresh Progress:')) {
        tracker = tracker.replace(/- \*\*Historical Blog Rich-Snippet & Shoppable Grid Refresh Progress:\*\*[^\n]+/, statusLine);
      } else {
        const lines = tracker.split('\n');
        lines.splice(3, 0, statusLine);
        tracker = lines.join('\n');
      }
      fs.writeFileSync(TRACKER_PATH, tracker, 'utf8');
    } catch {}
  }

  console.log(`Upgraded ${refreshedCount} historical /blogs/news/ articles with Studio Brief + Shoppable Product Grid + Smart Sub-Collection Pills + FAQPage & HowTo JSON-LD (${refreshedHandles.join(', ')}). Cumulative refreshed: ${state.totalRefreshed}.`);
}

main().catch(console.error);
