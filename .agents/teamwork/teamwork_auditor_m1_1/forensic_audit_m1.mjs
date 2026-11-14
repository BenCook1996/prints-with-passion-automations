/**
 * Independent Forensic Integrity Audit Script for Milestone 1
 * Written by Forensic Auditor (teamwork_auditor_m1_1)
 *
 * Verifies Phase 1 Homepage & Theme SEO Overhaul both statically and dynamically.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const THEME_ID = '177936466293';
const SHOP_DOMAIN = 'bencook96store.myshopify.com';
const STOREFRONT_URL = 'https://printswithpassion.com';

const results = {
  staticChecks: {},
  remoteThemeChecks: {},
  adminApiChecks: {},
  storefrontChecks: {},
  adversarialChecks: {},
  verdict: 'PENDING',
  failures: []
};

function recordCheck(category, name, passed, details) {
  results[category][name] = { passed, details };
  if (!passed) {
    results.failures.push(`[${category}] ${name}: ${details}`);
    console.error(`❌ FAIL: [${category}] ${name}: ${details}`);
  } else {
    console.log(`✅ PASS: [${category}] ${name} - ${details}`);
  }
}

async function getAccessToken() {
  const tokenPath = path.join(REPO_ROOT, '.shopify_token.json');
  if (!fs.existsSync(tokenPath)) {
    throw new Error(`.shopify_token.json not found at ${tokenPath}`);
  }
  const localCfg = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
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

async function getThemeAsset(token, key) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  if (!res.ok) throw new Error(`Failed to get asset ${key}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.asset?.value;
}

async function runGraphQL(token, query, variables = {}) {
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`GraphQL failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  return data.data;
}

async function main() {
  console.log('=== STARTING INDEPENDENT FORENSIC AUDIT (MILESTONE 1) ===\n');

  // Load sub-collections catalog
  const subcolPath = path.join(REPO_ROOT, 'phase2_40_subcollections.json');
  if (!fs.existsSync(subcolPath)) {
    throw new Error('phase2_40_subcollections.json missing');
  }
  const subcollections = JSON.parse(fs.readFileSync(subcolPath, 'utf8'));
  console.log(`Loaded ${subcollections.length} sub-collections from phase2_40_subcollections.json\n`);

  // ==========================================
  // PHASE 1: STATIC SOURCE CODE INSPECTION
  // ==========================================
  console.log('--- Phase 1: Static Code Inspection ---');

  // Check 1.1: Local snippets/head.liquid
  const headPath = path.join(REPO_ROOT, 'snippets', 'head.liquid');
  const headContent = fs.readFileSync(headPath, 'utf8');
  const headHasIndexOverride = headContent.includes("template.name == 'index'") &&
    headContent.includes('<title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>');
  recordCheck('staticChecks', 'snippets/head.liquid title & meta override', headHasIndexOverride,
    headHasIndexOverride ? 'Found index template override block' : 'Missing index template override block');

  // Check 1.2: Local sections/header.liquid
  const headerPath = path.join(REPO_ROOT, 'sections', 'header.liquid');
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  const headerLogoDemoted = headerContent.includes("assign main_logo_tag = 'div'");
  recordCheck('staticChecks', 'sections/header.liquid logo demotion', headerLogoDemoted,
    headerLogoDemoted ? "main_logo_tag set to 'div' on index" : "main_logo_tag not set to 'div'");

  const headerAuthFixed = !headerContent.includes('href="/{%- if customer -%}{{ routes.account_url }}');
  recordCheck('staticChecks', 'sections/header.liquid auth link leading slash removed', headerAuthFixed,
    headerAuthFixed ? 'Leading slash cleanly removed' : 'Leading slash still present');

  // Check 1.3: Local templates/index.json
  const indexPath = path.join(REPO_ROOT, 'templates', 'index.json');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const indexHeroCommercial = indexContent.includes('Archival Framed Canvas Wall Art &amp; XXL Desk Mats');
  recordCheck('staticChecks', 'templates/index.json commercial H1 headline', indexHeroCommercial,
    indexHeroCommercial ? 'Commercial keywords present in hero H1' : 'Hero H1 lacks commercial keywords');

  // Check 1.4: Local snippets/pwp-curated-collections-hub.liquid
  const hubPath = path.join(REPO_ROOT, 'snippets', 'pwp-curated-collections-hub.liquid');
  const hubExists = fs.existsSync(hubPath);
  const hubContent = hubExists ? fs.readFileSync(hubPath, 'utf8') : '';
  let hubAllSubsPresent = hubExists;
  if (hubExists) {
    for (const sub of subcollections) {
      if (!hubContent.includes(`/collections/${sub.handle}`)) {
        hubAllSubsPresent = false;
        break;
      }
    }
  }
  recordCheck('staticChecks', 'snippets/pwp-curated-collections-hub.liquid contains all 48 subs', hubAllSubsPresent,
    hubAllSubsPresent ? `Hub contains all ${subcollections.length} sub-collections` : 'Hub missing one or more sub-collections');

  // Check 1.5: Local layout/theme.liquid integration
  const themePath = path.join(REPO_ROOT, 'layout', 'theme.liquid');
  const themeContent = fs.readFileSync(themePath, 'utf8');
  const themeHubIntegrated = themeContent.includes("render 'pwp-curated-collections-hub'") &&
    themeContent.includes("template.name == 'index' or collection.handle == 'canvas-prints'");
  recordCheck('staticChecks', 'layout/theme.liquid hub render guard', themeHubIntegrated,
    themeHubIntegrated ? 'Hub rendered on index and 6 parent collections' : 'Hub render guard incorrect or missing');

  // ==========================================
  // PHASE 2: REMOTE SHOPIFY THEME ASSET INSPECTION
  // ==========================================
  console.log('\n--- Phase 2: Remote Shopify Theme Asset Inspection (Theme 177936466293) ---');
  let token;
  try {
    token = await getAccessToken();
    console.log('Successfully acquired OAuth2 access token.');
  } catch (err) {
    recordCheck('remoteThemeChecks', 'OAuth2 token acquisition', false, err.message);
  }

  if (token) {
    // 2.1 Remote snippets/head.liquid
    try {
      const remoteHead = await getThemeAsset(token, 'snippets/head.liquid');
      const remoteHeadOk = remoteHead.includes("template.name == 'index'") &&
        remoteHead.includes('<title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>');
      recordCheck('remoteThemeChecks', 'Remote snippets/head.liquid deployed', remoteHeadOk,
        remoteHeadOk ? `Size ${remoteHead.length} bytes, contains index title override` : 'Missing title override on remote');
    } catch (err) {
      recordCheck('remoteThemeChecks', 'Remote snippets/head.liquid fetch', false, err.message);
    }

    // 2.2 Remote sections/header.liquid
    try {
      const remoteHeader = await getThemeAsset(token, 'sections/header.liquid');
      const remoteHeaderOk = remoteHeader.includes("assign main_logo_tag = 'div'") &&
        !remoteHeader.includes('href="/{%- if customer -%}{{ routes.account_url }}');
      recordCheck('remoteThemeChecks', 'Remote sections/header.liquid deployed', remoteHeaderOk,
        remoteHeaderOk ? `Size ${remoteHeader.length} bytes, logo demoted and auth URL fixed` : 'Remote header fixes missing');
    } catch (err) {
      recordCheck('remoteThemeChecks', 'Remote sections/header.liquid fetch', false, err.message);
    }

    // 2.3 Remote templates/index.json
    try {
      const remoteIndex = await getThemeAsset(token, 'templates/index.json');
      const remoteIndexOk = remoteIndex.includes('Archival Framed Canvas Wall Art &amp; XXL Desk Mats');
      recordCheck('remoteThemeChecks', 'Remote templates/index.json deployed', remoteIndexOk,
        remoteIndexOk ? `Size ${remoteIndex.length} bytes, contains commercial hero H1` : 'Remote index.json missing commercial H1');
    } catch (err) {
      recordCheck('remoteThemeChecks', 'Remote templates/index.json fetch', false, err.message);
    }

    // 2.4 Remote snippets/pwp-curated-collections-hub.liquid
    try {
      const remoteHub = await getThemeAsset(token, 'snippets/pwp-curated-collections-hub.liquid');
      let remoteHubSubs = true;
      for (const sub of subcollections) {
        if (!remoteHub.includes(`/collections/${sub.handle}`)) {
          remoteHubSubs = false;
          break;
        }
      }
      recordCheck('remoteThemeChecks', 'Remote snippets/pwp-curated-collections-hub.liquid deployed', remoteHubSubs,
        remoteHubSubs ? `Size ${remoteHub.length} bytes, all 48 sub-collections verified` : 'Remote hub snippet missing sub-collections');
    } catch (err) {
      recordCheck('remoteThemeChecks', 'Remote snippets/pwp-curated-collections-hub.liquid fetch', false, err.message);
    }

    // 2.5 Remote layout/theme.liquid
    try {
      const remoteTheme = await getThemeAsset(token, 'layout/theme.liquid');
      const remoteThemeOk = remoteTheme.includes("render 'pwp-curated-collections-hub'");
      recordCheck('remoteThemeChecks', 'Remote layout/theme.liquid deployed', remoteThemeOk,
        remoteThemeOk ? `Size ${remoteTheme.length} bytes, hub rendering active` : 'Remote theme.liquid missing hub render');
    } catch (err) {
      recordCheck('remoteThemeChecks', 'Remote layout/theme.liquid fetch', false, err.message);
    }

    // ==========================================
    // PHASE 3: SHOPIFY ADMIN API (PAGE 703779766645)
    // ==========================================
    console.log('\n--- Phase 3: Shopify Admin API Inspection (Page/703779766645) ---');
    try {
      const pageGql = `query {
        page(id: "gid://shopify/Page/703779766645") {
          id
          title
          handle
          body
          updatedAt
        }
      }`;
      const pageData = await runGraphQL(token, pageGql);
      const pageBody = pageData?.page?.body || '';
      const typoOccurrences = (pageBody.match(/printswithpasssion/gi) || []).length;
      const correctOccurrences = (pageBody.match(/printswithpassionbc@gmail\.com/gi) || []).length;
      const pageClean = typoOccurrences === 0 && correctOccurrences >= 2;
      recordCheck('adminApiChecks', 'Page 703779766645 delivery-return email typo', pageClean,
        `Typos: ${typoOccurrences}, Correct emails: ${correctOccurrences}, updatedAt: ${pageData?.page?.updatedAt}`);
    } catch (err) {
      recordCheck('adminApiChecks', 'Page 703779766645 query', false, err.message);
    }

    // 3.2 Verify sub-collections in Shopify Admin API
    try {
      const sampleCheckQuery = `query {
        c1: collectionByHandle(handle: "nature-mountain-landscape-canvas-wall-art") { id title }
        c2: collectionByHandle(handle: "japanese-anime-desk-mats") { id title }
        c3: collectionByHandle(handle: "botanical-floral-garden-cushion-covers") { id title }
        c4: collectionByHandle(handle: "nature-mountain-cabin-throw-blankets") { id title }
        c5: collectionByHandle(handle: "coastal-ocean-botanical-bath-mats") { id title }
        c6: collectionByHandle(handle: "nature-mountain-graphic-hoodies") { id title }
      }`;
      const sampleData = await runGraphQL(token, sampleCheckQuery);
      const allExist = !!(sampleData.c1?.id && sampleData.c2?.id && sampleData.c3?.id && sampleData.c4?.id && sampleData.c5?.id && sampleData.c6?.id);
      recordCheck('adminApiChecks', 'Smart sub-collections exist in Admin catalog', allExist,
        allExist ? 'Sample sub-collections confirmed active in Shopify DB' : 'One or more sub-collections missing from Shopify DB');
    } catch (err) {
      recordCheck('adminApiChecks', 'Sub-collection DB catalog check', false, err.message);
    }
  }

  // ==========================================
  // PHASE 4: DYNAMIC LIVE STOREFRONT VALIDATION
  // ==========================================
  console.log('\n--- Phase 4: Dynamic Live Storefront Validation ---');
  const cacheBuster = `_auditor=${Date.now()}`;

  // 4.1 Homepage Validation
  let liveMeta = '';
  try {
    const homeUrl = `${STOREFRONT_URL}/?${cacheBuster}`;
    const homeRes = await fetch(homeUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ForensicAuditor/1.0' }
    });
    recordCheck('storefrontChecks', 'Homepage HTTP 200 OK', homeRes.status === 200, `Status code: ${homeRes.status}`);

    const homeHtml = await homeRes.text();

    // Title
    const titleMatch = homeHtml.match(/<title>([^<]+)<\/title>/i);
    const liveTitle = titleMatch ? titleMatch[1].trim() : '';
    const expectedTitle = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
    const titlePass = liveTitle === expectedTitle;
    recordCheck('storefrontChecks', 'Homepage <title> exact match', titlePass,
      `Live: "${liveTitle}" (Length: ${liveTitle.length}) | Expected: "${expectedTitle}"`);

    // Meta Description
    const metaMatch = homeHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    liveMeta = metaMatch ? metaMatch[1].trim() : '';
    const metaPass = liveMeta.includes('Shop archival framed canvas wall art') &&
      liveMeta.includes('XXL stitched gaming desk mats') &&
      !liveMeta.includes('posters') &&
      !liveMeta.includes('puzzles') &&
      !liveMeta.includes('&amp;quot;');
    recordCheck('storefrontChecks', 'Homepage <meta name="description">', metaPass,
      `Live: "${liveMeta}" (Length: ${liveMeta.length})`);

    // H1 Count & Content
    const h1Matches = [...homeHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h1Texts = h1Matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const h1Single = h1Matches.length === 1;
    const h1Commercial = h1Single && h1Texts[0].includes('Canvas Wall Art');
    recordCheck('storefrontChecks', 'Homepage strictly single semantic H1', h1Single,
      `Found ${h1Matches.length} H1 tags: [${h1Texts.join(' | ')}]`);
    recordCheck('storefrontChecks', 'Homepage H1 commercial keywords', h1Commercial,
      `H1 text: "${h1Texts[0] || 'NONE'}"`);

    // Header Logo Badge Tag
    const logoTagH1 = homeHtml.match(/<h1[^>]*class=["'][^"']*logo/i);
    const logoTagDiv = homeHtml.match(/<div[^>]*class=["'][^"']*header__logo/i);
    recordCheck('storefrontChecks', 'Homepage logo demoted to div (not h1)', !logoTagH1 && !!logoTagDiv,
      logoTagH1 ? 'Logo is still rendered as H1' : 'Logo rendered as div');

    // Customer Authentication Links
    const malformedAuthLinks = [...homeHtml.matchAll(/href=["']\/https:\/\/printswithpassion\.com\/customer_authentication/gi)];
    recordCheck('storefrontChecks', 'Homepage customer auth links valid', malformedAuthLinks.length === 0,
      `Found ${malformedAuthLinks.length} malformed auth links`);

    // Site-wide Typo Absence on Homepage
    const homeTypoCount = (homeHtml.match(/printswithpasssion/gi) || []).length;
    recordCheck('storefrontChecks', 'Homepage email typo absent', homeTypoCount === 0,
      `Found ${homeTypoCount} occurrences of typo on /`);

    // Hub Directory on Homepage
    const hubOnHome = homeHtml.includes('pwp-curated-hub');
    let homeMissingSubs = 0;
    if (hubOnHome) {
      for (const s of subcollections) {
        if (!homeHtml.includes(`/collections/${s.handle}`)) homeMissingSubs++;
      }
    }
    recordCheck('storefrontChecks', 'Homepage 48 curated collections hub present', hubOnHome && homeMissingSubs === 0,
      hubOnHome ? `Hub rendered, ${subcollections.length - homeMissingSubs}/${subcollections.length} sub-collections present` : 'Hub not rendered on /');

  } catch (err) {
    recordCheck('storefrontChecks', 'Homepage fetch & evaluation', false, err.message);
  }

  // 4.2 /pages/delivery-return Validation
  try {
    const delivRes = await fetch(`${STOREFRONT_URL}/pages/delivery-return?${cacheBuster}`);
    recordCheck('storefrontChecks', '/pages/delivery-return HTTP 200 OK', delivRes.status === 200, `Status code: ${delivRes.status}`);
    const delivHtml = await delivRes.text();
    const delivTypos = (delivHtml.match(/printswithpasssion/gi) || []).length;
    const delivCorrect = (delivHtml.match(/printswithpassionbc@gmail\.com/gi) || []).length;
    recordCheck('storefrontChecks', '/pages/delivery-return typo cured', delivTypos === 0 && delivCorrect >= 2,
      `Typos: ${delivTypos}, Correct email occurrences: ${delivCorrect}`);
  } catch (err) {
    recordCheck('storefrontChecks', '/pages/delivery-return fetch', false, err.message);
  }

  // 4.3 Parent Collections Hub Validation (All 6 parent collections)
  const parents = ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel'];
  for (const parent of parents) {
    try {
      const pRes = await fetch(`${STOREFRONT_URL}/collections/${parent}?${cacheBuster}`);
      const pHtml = await pRes.text();
      const pHubPresent = pHtml.includes('pwp-curated-hub');
      let pMissing = 0;
      if (pHubPresent) {
        for (const s of subcollections) {
          if (!pHtml.includes(`/collections/${s.handle}`)) pMissing++;
        }
      }
      const parentOk = pRes.status === 200 && pHubPresent && pMissing === 0;
      recordCheck('storefrontChecks', `/collections/${parent} hub directory`, parentOk,
        `Status ${pRes.status}, Hub present: ${pHubPresent}, Sub-collections present: ${subcollections.length - pMissing}/${subcollections.length}`);
    } catch (err) {
      recordCheck('storefrontChecks', `/collections/${parent} fetch`, false, err.message);
    }
  }

  // 4.4 Negative Check on Sub-Collection (Hub should NOT be rendered)
  try {
    const subRes = await fetch(`${STOREFRONT_URL}/collections/nature-mountain-landscape-canvas-wall-art?${cacheBuster}`);
    const subHtml = await subRes.text();
    const subHasHub = subHtml.includes('pwp-curated-hub');
    recordCheck('storefrontChecks', 'Negative check: sub-collection excludes hub', !subHasHub,
      subHasHub ? 'Hub unexpectedly rendered on sub-collection' : 'Hub correctly suppressed on sub-collection');
  } catch (err) {
    recordCheck('storefrontChecks', 'Negative check fetch', false, err.message);
  }

  // ==========================================
  // PHASE 5: ADVERSARIAL STRESS-TESTING
  // ==========================================
  console.log('\n--- Phase 5: Adversarial Stress-Testing ---');

  // Adversarial Check 5.1: Sub-Collection Reachability (Sample 6 sub-collections, 1 per category, with rate-limit retry)
  const sampleSubs = [
    'nature-mountain-landscape-canvas-wall-art',
    'japanese-anime-desk-mats',
    'botanical-floral-garden-cushion-covers',
    'nature-mountain-cabin-throw-blankets',
    'coastal-ocean-botanical-bath-mats',
    'nature-mountain-graphic-hoodies'
  ];

  let sampleNon200Count = 0;
  for (const sHandle of sampleSubs) {
    let status = 0;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await new Promise(r => setTimeout(r, 1500 * attempt));
      try {
        const res = await fetch(`${STOREFRONT_URL}/collections/${sHandle}?_auditor_sample=${Date.now()}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
        });
        status = res.status;
        if (status === 200) break;
        if (status === 429) {
          console.log(`Cloudflare edge rate-limited /collections/${sHandle} (429) - backing off (attempt ${attempt}/3)...`);
        }
      } catch (err) {
        console.error(`Attempt ${attempt} fetch error for ${sHandle}: ${err.message}`);
      }
    }
    if (status !== 200) {
      sampleNon200Count++;
      console.error(`Sample sub-collection /collections/${sHandle} non-200 status: ${status}`);
    } else {
      console.log(`Sample sub-collection /collections/${sHandle} status: 200 OK`);
    }
  }
  recordCheck('adversarialChecks', 'Sub-collection reachability sampling (6 categories)', sampleNon200Count === 0,
    `Sampled 6 sub-collections across all 6 categories, non-200 responses: ${sampleNon200Count}`);

  // Adversarial Check 5.2: Entity Escaping Stress-Test
  const rawMetaContent = liveMeta || '';
  const hasDoubleAmp = rawMetaContent.includes('&amp;amp;') || rawMetaContent.includes('&amp;quot;') || rawMetaContent.includes('&amp;#39;');
  recordCheck('adversarialChecks', 'Meta description free of double-escaped entities', !hasDoubleAmp,
    hasDoubleAmp ? 'Found double-escaped entities in meta description' : 'Clean entity encoding verified');

  // Adversarial Check 5.3: Duplicate Canonical or Roboted Index
  try {
    const homeRes = await fetch(`${STOREFRONT_URL}/?${cacheBuster}`);
    const homeHtml = await homeRes.text();
    const robotsNoindex = homeHtml.match(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i);
    const canonicalMatch = homeHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    const canonicalOk = canonicalMatch && (canonicalMatch[1] === 'https://printswithpassion.com/' || canonicalMatch[1] === 'https://printswithpassion.com');
    recordCheck('adversarialChecks', 'Homepage indexable & canonical URL valid', !robotsNoindex && !!canonicalOk,
      `Noindex: ${!!robotsNoindex}, Canonical: ${canonicalMatch ? canonicalMatch[1] : 'NONE'}`);
  } catch (err) {
    recordCheck('adversarialChecks', 'Robots & canonical check', false, err.message);
  }

  // ==========================================
  // FINAL VERDICT DETERMINATION
  // ==========================================
  console.log('\n==================================================');
  if (results.failures.length === 0) {
    results.verdict = 'CLEAN';
    console.log('FINAL AUDIT VERDICT: CLEAN');
    console.log('All forensic integrity checks passed with 0 violations.');
  } else {
    results.verdict = 'INTEGRITY VIOLATION';
    console.log(`FINAL AUDIT VERDICT: INTEGRITY VIOLATION (${results.failures.length} failures detected)`);
    for (const f of results.failures) {
      console.log(` - ${f}`);
    }
  }
  console.log('==================================================\n');

  // Save audit log to file
  const reportPath = path.join(__dirname, 'audit_evidence.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved detailed evidence to: ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
