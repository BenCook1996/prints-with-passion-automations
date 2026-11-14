import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const THEME_ID = '177936466293';
const SHOP_DOMAIN = 'bencook96store.myshopify.com';

async function getAdminToken() {
  const localCfg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.shopify_token.json'), 'utf8'));
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: localCfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: localCfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function runIndependentReview() {
  const report = {
    timestamp: new Date().toISOString(),
    liveChecks: {},
    apiChecks: {},
    edgeCaseChecks: {},
    discrepancies: []
  };

  const ts = Date.now();
  console.log('=== PRINTS WITH PASSION — INDEPENDENT M1 REVIEW SUITE ===\n');

  // 1. LIVE HOMEPAGE VERIFICATION
  console.log('[1/5] Testing Live Homepage (https://printswithpassion.com/)...');
  const homeRes = await fetch(`https://printswithpassion.com/?_rev=${ts}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReviewBot/2.0' }
  });
  report.liveChecks.homepageStatus = homeRes.status;
  const homeHtml = await homeRes.text();

  // Title check
  const titleMatch = homeHtml.match(/<title>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';
  report.liveChecks.homepageTitle = {
    raw: rawTitle,
    length: rawTitle.length,
    exactMatch: rawTitle === 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion',
    under60Chars: rawTitle.length <= 60
  };
  console.log(`- Title: "${rawTitle}" (length: ${rawTitle.length}, <=60: ${rawTitle.length <= 60})`);
  if (rawTitle.length > 60) {
    report.discrepancies.push({
      item: 'Homepage Title Length',
      severity: 'MAJOR',
      detail: `Title length is ${rawTitle.length} chars (exceeds 60-char SERP boundary limit requested in R1 / SCOPE.md)`
    });
  }

  // Meta description check
  const metaMatch = homeHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const rawMeta = metaMatch ? metaMatch[1].trim() : '';
  report.liveChecks.homepageMetaDescription = {
    raw: rawMeta,
    length: rawMeta.length,
    containsQuotEntity: rawMeta.includes('&quot;'),
    containsAmpEntity: rawMeta.includes('&amp;'),
    within140to158: rawMeta.length >= 140 && rawMeta.length <= 158,
    merchandiseClean: !/(?:posters|puzzles|duvet covers|makeup bags|t-shirts)/i.test(rawMeta)
  };
  console.log(`- Meta Description: "${rawMeta.slice(0, 80)}..." (length: ${rawMeta.length}, entities: quot=${rawMeta.includes('&quot;')}, amp=${rawMeta.includes('&amp;')})`);
  if (rawMeta.includes('&quot;')) {
    report.discrepancies.push({
      item: 'Homepage Meta Description HTML Entities',
      severity: 'MAJOR',
      detail: `Meta description contains unescaped entity '&quot;' (raw length ${rawMeta.length} exceeds 158 max SERP limit)`
    });
  }

  // H1 Check
  const h1Matches = [...homeHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  report.liveChecks.h1Count = h1Matches.length;
  report.liveChecks.h1Texts = h1Matches;
  console.log(`- H1 count: ${h1Matches.length}, content: "${h1Matches[0] || ''}"`);
  if (h1Matches.length !== 1) {
    report.discrepancies.push({
      item: 'Homepage H1 Count',
      severity: 'CRITICAL',
      detail: `Expected strictly 1 H1 on homepage, found ${h1Matches.length}`
    });
  }

  // Logo tag check
  const logoH1Match = homeHtml.match(/<h1[^>]*class=["'][^"']*logo[^"']*["']/i);
  report.liveChecks.logoTagIsH1 = !!logoH1Match;
  console.log(`- Logo rendered as H1: ${!!logoH1Match}`);
  if (logoH1Match) {
    report.discrepancies.push({
      item: 'Header Logo Tag',
      severity: 'CRITICAL',
      detail: 'Header logo badge is still rendering as an <h1> tag'
    });
  }

  // Auth URLs check
  const malformedAuthMatches = [...homeHtml.matchAll(/href=["']\/https:\/\/printswithpassion\.com\/customer_authentication/gi)];
  report.liveChecks.malformedAuthCount = malformedAuthMatches.length;
  console.log(`- Malformed auth URLs: ${malformedAuthMatches.length}`);
  if (malformedAuthMatches.length > 0) {
    report.discrepancies.push({
      item: 'Customer Auth Link',
      severity: 'CRITICAL',
      detail: `Found ${malformedAuthMatches.length} malformed auth links starting with '/https://'`
    });
  }

  // Contact email typo on homepage
  const homeTypoMatches = [...homeHtml.matchAll(/printswithpasssion/gi)];
  report.liveChecks.homepageEmailTypoCount = homeTypoMatches.length;
  console.log(`- Homepage email typos (printswithpasssion): ${homeTypoMatches.length}`);

  // Curated hub on homepage
  const homeHubClass = homeHtml.includes('class="pwp-curated-hub') || homeHtml.includes('class="pwp-curated-collections-hub');
  report.liveChecks.homepageHubRendered = homeHubClass;
  console.log(`- Hub rendered on Homepage: ${homeHubClass}`);

  // 2. LIVE DELIVERY & RETURN PAGE
  console.log('\n[2/5] Testing Live /pages/delivery-return...');
  const delivRes = await fetch(`https://printswithpassion.com/pages/delivery-return?_rev=${ts}`);
  const delivHtml = await delivRes.text();
  const delivTypoMatches = [...delivHtml.matchAll(/printswithpasssion/gi)];
  const delivCorrectMatches = [...delivHtml.matchAll(/printswithpassionbc@gmail\.com/gi)];
  report.liveChecks.deliveryReturnStatus = delivRes.status;
  report.liveChecks.deliveryReturnTypoCount = delivTypoMatches.length;
  report.liveChecks.deliveryReturnCorrectCount = delivCorrectMatches.length;
  console.log(`- Status: ${delivRes.status}, Typos: ${delivTypoMatches.length}, Correct email occurrences: ${delivCorrectMatches.length}`);
  if (delivTypoMatches.length > 0) {
    report.discrepancies.push({
      item: 'Delivery-Return Email Typo',
      severity: 'CRITICAL',
      detail: `Found ${delivTypoMatches.length} occurrences of typo on /pages/delivery-return`
    });
  }

  // 3. PARENT & SUB-COLLECTION HUBS
  console.log('\n[3/5] Testing Parent Collections and Sub-Collection Isolation...');
  const parents = ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel'];
  const subsFile = path.join(REPO_ROOT, 'phase2_40_subcollections.json');
  const subs = JSON.parse(fs.readFileSync(subsFile, 'utf8'));

  report.liveChecks.parentCollections = {};
  for (const p of parents) {
    const res = await fetch(`https://printswithpassion.com/collections/${p}?_rev=${ts}`);
    const html = await res.text();
    const hasHub = html.includes('pwp-curated-hub');
    let foundSubs = 0;
    for (const s of subs) {
      if (html.includes(`/collections/${s.handle}`)) foundSubs++;
    }
    report.liveChecks.parentCollections[p] = {
      status: res.status,
      hubPresent: hasHub,
      subCollectionsFound: foundSubs,
      totalSubCollections: subs.length
    };
    console.log(`- /collections/${p}: HTTP ${res.status}, Hub: ${hasHub}, Sub-collections: ${foundSubs}/${subs.length}`);
    if (!hasHub) {
      report.discrepancies.push({
        item: `Hub Missing on Parent Collection /collections/${p}`,
        severity: 'CRITICAL',
        detail: `Curated collections hub missing on parent collection ${p}`
      });
    }
    if (foundSubs !== subs.length) {
      report.discrepancies.push({
        item: `Missing Sub-Collections on /collections/${p}`,
        severity: 'MAJOR',
        detail: `Only ${foundSubs}/${subs.length} sub-collections linked on /collections/${p}`
      });
    }
  }

  // Negative checks: Sub-collections and other pages
  const negativeHandles = [
    'nature-mountain-landscape-canvas-wall-art',
    'japanese-anime-desk-mats',
    'botanical-floral-garden-cushion-covers'
  ];
  report.liveChecks.subCollectionNegativeChecks = {};
  for (const sh of negativeHandles) {
    const res = await fetch(`https://printswithpassion.com/collections/${sh}?_rev=${ts}`);
    const html = await res.text();
    const hasHub = html.includes('pwp-curated-hub');
    report.liveChecks.subCollectionNegativeChecks[sh] = {
      status: res.status,
      hubPresent: hasHub,
      pass: !hasHub
    };
    console.log(`- Negative check /collections/${sh}: Hub present = ${hasHub} (Expected: false)`);
    if (hasHub) {
      report.discrepancies.push({
        item: `Hub Leaking to Sub-Collection /collections/${sh}`,
        severity: 'CRITICAL',
        detail: `Curated hub rendered unexpectedly on individual sub-collection ${sh}`
      });
    }
  }

  // 4. ADMIN API INSPECTION
  console.log('\n[4/5] Testing Shopify Admin API & Theme Assets...');
  const token = await getAdminToken();

  // Page 703779766645 GraphQL
  const pageGqlRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({
      query: `query {
        page(id: "gid://shopify/Page/703779766645") {
          id
          title
          handle
          updatedAt
          body
        }
      }`
    })
  });
  const pageGqlData = await pageGqlRes.json();
  const page = pageGqlData.data?.page;
  const pageTypos = (page?.body.match(/printswithpasssion/g) || []).length;
  const pageCorrect = (page?.body.match(/printswithpassionbc@gmail\.com/g) || []).length;
  report.apiChecks.page703779766645 = {
    title: page?.title,
    handle: page?.handle,
    updatedAt: page?.updatedAt,
    typosInBody: pageTypos,
    correctInBody: pageCorrect
  };
  console.log(`- Page 703779766645: Handle="${page?.handle}", UpdatedAt=${page?.updatedAt}, Typos=${pageTypos}, Correct=${pageCorrect}`);

  // Theme Assets
  const assetKeys = [
    'snippets/head.liquid',
    'sections/header.liquid',
    'templates/index.json',
    'snippets/pwp-curated-collections-hub.liquid',
    'layout/theme.liquid'
  ];
  report.apiChecks.themeAssets = {};
  for (const k of assetKeys) {
    const assetRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=${encodeURIComponent(k)}`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    const assetData = await assetRes.json();
    const val = assetData.asset?.value || '';
    report.apiChecks.themeAssets[k] = {
      size: val.length,
      updatedAt: assetData.asset?.updated_at
    };
    console.log(`- Asset ${k}: Size=${val.length}, UpdatedAt=${assetData.asset?.updated_at}`);
  }

  // Shop customer_email check
  const shopRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/shop.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const shopData = await shopRes.json();
  report.apiChecks.shopSettings = {
    email: shopData.shop?.email,
    customer_email: shopData.shop?.customer_email,
    hasTypo: (shopData.shop?.customer_email || '').includes('printswithpasssion')
  };
  console.log(`- Shop contact email setting: "${shopData.shop?.customer_email}" (has typo: ${report.apiChecks.shopSettings.hasTypo})`);
  if (report.apiChecks.shopSettings.hasTypo) {
    report.discrepancies.push({
      item: 'Shop Admin Customer Email Setting',
      severity: 'MINOR',
      detail: `Shopify shop.customer_email still contains typo "${shopData.shop?.customer_email}" (requires Admin UI Store details update)`
    });
  }

  // 5. CSS & HTML INTEGRITY CHECKS
  console.log('\n[5/5] Checking Hub CSS & Class Naming Integrity...');
  const hubAssetRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=snippets/pwp-curated-collections-hub.liquid`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const hubAssetData = await hubAssetRes.json();
  const hubContent = hubAssetData.asset?.value || '';
  const hasE2eClass = hubContent.includes('pwp-curated-collections-hub');
  report.edgeCaseChecks.hubHasE2eClass = hasE2eClass;
  console.log(`- Hub snippet has 'pwp-curated-collections-hub' class: ${hasE2eClass}`);
  if (!hasE2eClass) {
    report.discrepancies.push({
      item: 'Hub Snippet CSS Class Mismatch with Test Runner',
      severity: 'MAJOR',
      detail: `Hub snippet uses class 'pwp-curated-hub' instead of 'pwp-curated-collections-hub', causing E2E test runner failure in T1-F05-01 / T2-F05-03`
    });
  }

  console.log('\n=== INDEPENDENT REVIEW SUMMARY ===');
  console.log(`Total Discrepancies Found: ${report.discrepancies.length}`);
  for (const d of report.discrepancies) {
    console.log(`[${d.severity}] ${d.item}: ${d.detail}`);
  }

  // Save detailed report
  fs.writeFileSync(path.join(REPO_ROOT, 'tests/reports/independent_review_m1_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('\nSaved full report to tests/reports/independent_review_m1_report.json');

  return report;
}

runIndependentReview().catch(err => {
  console.error('Review failed with error:', err);
  process.exit(1);
});
