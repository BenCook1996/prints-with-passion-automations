import fs from 'fs';

const authPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const GRAPHQL_URL = 'https://admin.shopify.com/api/shopify/bpcprints';
const KEYWORD_QUEUE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\transactional_keyword_queue.json';

const keywordQueue = fs.existsSync(KEYWORD_QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'))
  : { bySubCollection: {} };

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': auth.shopifyCookie,
      'x-csrf-token': auth.shopifyCsrf,
      'Origin': 'https://admin.shopify.com',
      'Referer': 'https://admin.shopify.com/store/bpcprints'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) console.error('GQL Errors:', JSON.stringify(json.errors));
  return json.data;
}

function getTopClusterForCollection(handle) {
  const entry = keywordQueue?.bySubCollection?.[handle];
  if (Array.isArray(entry) && entry.length > 0) {
    return entry.find(c => c.status === 'queued') || entry[0];
  }
  return entry || null;
}

function build3RuleCopyForCollection(col) {
  const h = (col.handle || '').toLowerCase();
  const rawTitle = (col.title || '').replace(/\s*\|.*$/, '').trim();
  const cluster = getTopClusterForCollection(col.handle);

  let verb = 'Upgrade';
  let specShort = '4mm XXL Desk Mats & Pine Canvas';
  let problemSolved = 'Ditch cramped mousepads & bare walls';
  let bullet1 = '4mm Stitched Neoprene & 1.25" Kiln-Dried Pine';
  let bullet2 = 'Exact Metric (cm) & Imperial (inch) Sizing';

  if (h.includes('desk-mat') || h.includes('mouse')) {
    verb = 'Upgrade';
    specShort = '4mm XXL (90x40cm / 80x30cm)';
    problemSolved = 'Ditch cramped, curling 2mm mousepads';
    bullet1 = '4mm Dense Neoprene + 360° Anti-Fray Stitching';
    bullet2 = 'Sized for IKEA Karlby, Secretlab & 65%–100% Keyboards';
  } else if (h.includes('canvas') || h.includes('wall-art') || h.includes('print')) {
    verb = 'Transform';
    specShort = '1.25" Pine Frame (8x10"–24x36")';
    problemSolved = 'Eliminate blank-wall echo & poster glare';
    bullet1 = 'Matte Museum Cotton-Poly Canvas on 1.25" Pine Bars';
    bullet2 = 'Arrives Ready to Hang Out of the Box (Zero Glare)';
  } else if (h.includes('cushion') || h.includes('pillow')) {
    verb = 'Elevate';
    specShort = 'Soft Velvet (45x45cm / 18x18")';
    problemSolved = 'Refresh dull sofas & reading chairs instantly';
    bullet1 = 'Double-Sided Archival Sublimation + Hidden Zipper';
    bullet2 = 'Machine-Washable 30°C Gentle Studio Fabric';
  } else if (h.includes('blanket') || h.includes('throw')) {
    verb = 'Style';
    specShort = '300 GSM Fleece (50x60" / 60x80")';
    problemSolved = 'Add plush warmth & gallery color to beds or sofas';
    bullet1 = '300 GSM Anti-Pill Coral Fleece & Sherpa Weave';
    bullet2 = 'Generous Couch & Queen/King Bed Throw Proportions';
  } else if (h.includes('bath-mat') || h.includes('bath')) {
    verb = 'Refresh';
    specShort = 'Memory Foam (60x40cm / 24x16")';
    problemSolved = 'Step onto cushioned, non-slip studio comfort';
    bullet1 = 'High-Density Memory Foam Core + Non-Slip SBR Backing';
    bullet2 = 'Fast-Drying Microfiber Top & Fade-Proof Ink';
  } else if (h.includes('hoodie') || h.includes('sweatshirt')) {
    verb = 'Claim';
    specShort = 'Heavyweight 310 GSM (S–3XL)';
    problemSolved = 'Skip thin, shrinking fast-fashion prints';
    bullet1 = '310 GSM Ring-Spun Cotton-Fleece Blend';
    bullet2 = 'Crack-Resistant Archival DTG Studio Artwork';
  } else if (h.includes('t-shirt') || h.includes('shirt') || h.includes('apparel')) {
    verb = 'Wear';
    specShort = 'Heavyweight Cotton (S–3XL)';
    problemSolved = 'Upgrade to breathable, gallery-grade graphic tees';
    bullet1 = '100% Combed Ring-Spun Cotton Studio Fit';
    bullet2 = 'High-Definition Archival DTG Pigment Print';
  }

  const kwHighlight = cluster?.shortAnchor || cluster?.primaryKeyword || `${rawTitle} (${specShort})`;

  // Rule 2: Front-Load Strongest Copy in SEO Title (word-boundary safe)
  const cleanShortTitle = rawTitle
    .replace(/\b(Collection|Extended|Art)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*$/, '')
    .trim();
  let seoTitle = `${cleanShortTitle} — ${specShort} | Free Shipping`;
  if (seoTitle.length > 65) {
    seoTitle = `${cleanShortTitle} | ${specShort}`;
  }
  if (seoTitle.length > 65) {
    const wordSafe = cleanShortTitle.slice(0, 44).replace(/\s+\S*$/, '').replace(/[,&-]+$/, '').trim();
    seoTitle = `${wordSafe} | Free Shipping`;
  }

  // Rule 1, 2, 3 in Meta Description (<= 155 chars)
  let seoDescription = `${verb} your space with ${rawTitle} (${specShort}). ${problemSolved}. Save 15% on 2+ items (Code: STUDIO15) + Free Tracked Shipping.`;
  if (seoDescription.length > 158) {
    seoDescription = `${verb} with ${rawTitle} (${specShort}). ${problemSolved}. 15% Off 2+ (STUDIO15) + Free Tracked Shipping.`;
  }

  const faqItems = (cluster?.buyerFaqQuestions && cluster.buyerFaqQuestions.length >= 2)
    ? cluster.buyerFaqQuestions.slice(0, 2).map(q => ({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${q.answerHint} All ${rawTitle} orders include 100% Free Tracked UK, US, CA, AU & EU Shipping and 15% Off 2+ items with code STUDIO15.`
        }
      }))
    : [
        {
          "@type": "Question",
          "name": `What sizes and materials are included in the ${rawTitle} collection?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Our ${rawTitle} studio editions feature ${bullet1} with ${bullet2}. Preview exact desk and wall proportions in our Interactive Size Visualizer at printswithpassion.com/pages/desk-size-visualizer.`
          }
        },
        {
          "@type": "Question",
          "name": `Does ${rawTitle} include free tracked delivery and multi-item bundle savings?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Yes. Every order includes 100% Free Tracked UK, US, CA, AU & EU Shipping plus 15% OFF any 2+ items storewide using checkout code STUDIO15.`
          }
        }
      ];

  const faqSchemaObj = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems
  };

  // Editorial Gallery Minimalist design tokens (#F6F4EF Warm Studio Alabaster, #111110 Gallery Ink Black, #C85A32 Burnished Terracotta, #DEDAD0 Border Stone, 0px radius)
  const heroBannerHtml = `<!-- PWP_INPAGES_3RULE_HERO_START -->
<script type="application/ld+json">${JSON.stringify(faqSchemaObj)}</script>
<div class="pwp-inpages-3rule-hero" style="margin:0 0 18px;padding:14px 18px;background:#F6F4EF;border:1px solid #DEDAD0;border-left:4px solid #C85A32;border-radius:0px;font-size:13.5px;line-height:1.55;color:#111110;">
  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;">
    <div>
      <strong style="color:#C85A32;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;">✓ ${problemSolved}:</strong>
      <strong style="color:#111110;"> ${bullet1}</strong> • ${bullet2} • <span style="color:#52525B;">Top Spec: <em>${kwHighlight}</em></span> • <strong>Save 15% on Any 2+ Items (Code: <span style="color:#C85A32;">STUDIO15</span>) + Free Tracked UK/US/CA/EU Shipping</strong>.
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a href="/pages/desk-size-visualizer" style="background:#111110;color:#FFF !important;padding:6px 12px;border-radius:0px;font-size:12px;font-weight:700;text-decoration:none !important;letter-spacing:0.03em;">Size Visualizer →</a>
      <a href="/pages/desk-setup-hardware-compatibility-guide" style="background:#FFF;color:#111110 !important;border:1px solid #DEDAD0;padding:6px 12px;border-radius:0px;font-size:12px;font-weight:600;text-decoration:none !important;">Hardware Fit Guide →</a>
    </div>
  </div>
</div>
<!-- PWP_INPAGES_3RULE_HERO_END -->`;

  return { seoTitle, seoDescription, heroBannerHtml, kwHighlight };
}

async function main() {
  console.log('=== [Step 5] Running Automation 12: Inpages 3-Rule Ad Copy, Keyword Queue & FAQPage SERP CTR Optimizer Across All Curated Collections ===');
  const data = await shopifyGraphQL(`
    query ListCols {
      collections(first: 100) {
        nodes {
          id
          handle
          title
          productsCount
          descriptionHtml
          seo { title description }
        }
      }
    }
  `);

  const collections = (data?.collections?.nodes || []).filter(
    c => c.handle !== 'avada-upsell-best-sellers' && ((c.productsCount || 0) > 0)
  );
  console.log(`  Found ${collections.length} active non-empty collections to optimize.`);

  const experimentsLog = [];
  let updatedCount = 0;

  for (const col of collections) {
    const { seoTitle, seoDescription, heroBannerHtml, kwHighlight } = build3RuleCopyForCollection(col);
    let descHtml = col.descriptionHtml || '';
    const existingHeroRegex = /<!-- PWP_INPAGES_3RULE_HERO_START -->[\s\S]*?<!-- PWP_INPAGES_3RULE_HERO_END -->\s*/;
    if (existingHeroRegex.test(descHtml)) {
      descHtml = descHtml.replace(existingHeroRegex, heroBannerHtml + '\n');
    } else {
      descHtml = heroBannerHtml + '\n' + descHtml;
    }

    const res = await shopifyGraphQL(`
      mutation UpdCollectionCopy($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle seo { title description } }
          userErrors { field message }
        }
      }
    `, {
      input: {
        id: col.id,
        descriptionHtml: descHtml,
        seo: {
          title: seoTitle,
          description: seoDescription
        }
      }
    });

    if (res?.collectionUpdate?.collection) {
      updatedCount++;
      experimentsLog.push({
        handle: col.handle,
        title: col.title,
        productsCount: col.productsCount || 0,
        keywordFocus: kwHighlight,
        previousSeoTitle: col.seo?.title || null,
        newSeoTitle: seoTitle,
        previousSeoDescription: col.seo?.description || null,
        newSeoDescription: seoDescription,
        updatedAt: new Date().toISOString()
      });
    } else {
      console.warn(`  Warning updating ${col.handle}:`, res?.collectionUpdate?.userErrors);
    }
  }

  const outPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\ctr_copy_experiments.json';
  fs.writeFileSync(outPath, JSON.stringify({
    framework: 'Inpages 3-Rule Copywriting + Transactional Keyword Queue + FAQPage JSON-LD + Editorial Gallery 0px Tokens',
    lastRunAt: new Date().toISOString(),
    totalCollectionsUpdated: updatedCount,
    collections: experimentsLog
  }, null, 2), 'utf8');

  console.log(`  Successfully updated ${updatedCount}/${collections.length} collections and saved baseline to ${outPath}`);
}

main().catch(console.error);
