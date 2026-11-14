import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const USER_AGENTS = {
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  googlebotDesktop: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  googlebotMobile: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

const PARENT_COLLECTIONS = [
  'canvas-prints',
  'desk-mats',
  'pillow-cases',
  'blankets',
  'bath-mats',
  'apparel'
];

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function runEmpiricalStressTest() {
  const results = {
    timestamp: new Date().toISOString(),
    testsRun: 0,
    testsPassed: 0,
    testsFailed: 0,
    failures: [],
    details: {}
  };

  function assert(condition, message, metadata = {}) {
    results.testsRun++;
    if (!condition) {
      results.testsFailed++;
      results.failures.push({ message, metadata });
      console.error(`[FAIL] ${message}`, metadata);
    } else {
      results.testsPassed++;
      console.log(`[PASS] ${message}`);
    }
  }

  const cacheBuster = `?_challenger_ts=${Date.now()}`;
  console.log('====================================================');
  console.log('CHALLENGER 1 EMPIRICAL ADVERSARIAL STRESS TEST SUITE');
  console.log('====================================================\n');

  // =========================================================================
  // TEST 1: Heading Structure Across Multiple User Agents & Viewports
  // =========================================================================
  console.log('--- TEST 1: Heading Structure Across Multiple User-Agents ---');
  results.details.headings = {};

  for (const [uaName, uaString] of Object.entries(USER_AGENTS)) {
    const url = `https://printswithpassion.com/${cacheBuster}&ua=${uaName}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': uaString } });
    assert(res.status === 200, `Homepage HTTP 200 with ${uaName} (Status: ${res.status})`);

    const html = await res.text();
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h1Texts = h1Matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

    results.details.headings[uaName] = {
      h1Count: h1Matches.length,
      h1Texts
    };

    assert(
      h1Matches.length === 1,
      `Homepage has strictly 1 H1 under ${uaName} (Found: ${h1Matches.length})`,
      { uaName, h1Texts }
    );

    if (h1Matches.length > 0) {
      const h1Text = h1Texts[0];
      assert(
        h1Text.includes('Canvas Wall Art') && h1Text.includes('XXL Desk Mats'),
        `H1 under ${uaName} contains commercial keywords ("Canvas Wall Art" & "XXL Desk Mats")`,
        { h1Text }
      );
      assert(
        !h1Text.includes('class="logo') && !h1Text.includes('pwp-gallery-logo-wrap'),
        `H1 under ${uaName} is not the logo badge`,
        { h1Text }
      );
    }

    // Check for logo heading tags
    const logoAsH1 = /<h1[^>]*class="[^"]*logo[^"]*"[^>]*>/i.test(html);
    assert(!logoAsH1, `Decorative logo badge is NOT rendered as <h1> under ${uaName}`);
  }

  // =========================================================================
  // TEST 2: Title and Meta Tags Integrity
  // =========================================================================
  console.log('\n--- TEST 2: Title and Meta Tags Storefront Verification ---');
  const homeRes = await fetchWithTimeout(`https://printswithpassion.com/${cacheBuster}`, {
    headers: { 'User-Agent': USER_AGENTS.desktopChrome }
  });
  const homeHtml = await homeRes.text();

  // 2.1 Duplicate <title> detection across whole document
  const allTitles = [...homeHtml.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map(m => m[1].trim());
  results.details.titles = allTitles;
  assert(allTitles.length === 1, `Homepage has strictly 1 <title> tag in entire HTML (Found: ${allTitles.length})`, { allTitles });

  const activeTitle = allTitles[0] || '';
  const expectedTitle = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
  assert(
    activeTitle === expectedTitle,
    `Homepage title exactly matches expected specification: "${expectedTitle}"`,
    { actual: activeTitle, length: activeTitle.length }
  );

  // Check title length
  console.log(`[INFO] Homepage title length: ${activeTitle.length} characters`);
  assert(activeTitle.length <= 65, `Title length is within search snippet display limits (Length: ${activeTitle.length})`);

  // 2.2 Meta Description tag checks
  const metaDescRegex = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/gi;
  const metaDescMatches = [...homeHtml.matchAll(metaDescRegex)];
  const allMetaDescs = metaDescMatches.map(m => (m[1] || m[2] || '').trim());
  results.details.metaDescriptions = allMetaDescs;

  assert(allMetaDescs.length === 1, `Homepage has strictly 1 <meta name="description"> tag in entire HTML (Found: ${allMetaDescs.length})`, { allMetaDescs });

  const activeDesc = allMetaDescs[0] || '';
  console.log(`[INFO] Meta description: "${activeDesc}" (Length: ${activeDesc.length})`);

  assert(
    activeDesc.length >= 140 && activeDesc.length <= 165,
    `Meta description length is between 140 and 165 characters (Length: ${activeDesc.length})`,
    { length: activeDesc.length }
  );

  assert(
    !activeDesc.includes('&amp;quot;'),
    'Meta description has no double-escaped quote entities (&amp;quot;)'
  );
  assert(
    !activeDesc.includes('&amp;amp;'),
    'Meta description has no double-escaped ampersand entities (&amp;amp;)'
  );

  const discontinuedKeywords = ['posters', 'puzzles', 'duvet covers', 'makeup bags', 'phone cases', 'yoga mats', 'dog collars'];
  const foundDiscontinued = discontinuedKeywords.filter(kw => activeDesc.toLowerCase().includes(kw));
  assert(
    foundDiscontinued.length === 0,
    `Meta description contains zero discontinued legacy product categories (Found: ${foundDiscontinued.join(', ') || 'none'})`,
    { foundDiscontinued }
  );

  assert(
    activeDesc.toLowerCase().includes('canvas wall art') && activeDesc.toLowerCase().includes('desk mats'),
    'Meta description highlights core active product catalog (canvas wall art & desk mats)'
  );

  // Canonical tag check
  const canonicalMatch = homeHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const canonicalHref = canonicalMatch?.[1] || '';
  assert(
    canonicalHref === 'https://printswithpassion.com/' || canonicalHref === 'https://printswithpassion.com',
    `Canonical tag correctly points to root homepage (Found: ${canonicalHref})`
  );

  // Robots tag check (Homepage must be indexable)
  const robotsMatch = homeHtml.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
  const robotsContent = robotsMatch?.[1] || '';
  assert(
    !robotsContent.includes('noindex'),
    `Homepage robots meta does not contain 'noindex' (Found: "${robotsContent || 'none'}")`
  );

  // =========================================================================
  // TEST 3: Auth & Header Navigation Links (404 Crawl Trap Elimination)
  // =========================================================================
  console.log('\n--- TEST 3: Customer Auth & Navigation Link Verification ---');

  // Search for any malformed auth link
  const malformedRegex = /href=["'](\/https?:\/\/[^"']+)["']/gi;
  const malformedMatches = [...homeHtml.matchAll(malformedRegex)].map(m => m[1]);
  assert(
    malformedMatches.length === 0,
    `Zero malformed leading-slash absolute links in entire homepage DOM (Found: ${malformedMatches.length})`,
    { malformedMatches }
  );

  // Find all auth links
  const authLinksRegex = /<a[^>]+href=["']([^"']*(?:account|customer_authentication|login|register)[^"']*)["'][^>]*>/gi;
  const authLinks = [...homeHtml.matchAll(authLinksRegex)].map(m => m[1]);
  console.log(`[INFO] Found ${authLinks.length} auth-related links on homepage`);
  results.details.authLinks = authLinks;

  for (const link of authLinks) {
    let fullUrl = link;
    if (link.startsWith('/')) {
      fullUrl = `https://printswithpassion.com${link}`;
    }
    try {
      const authRes = await fetchWithTimeout(fullUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENTS.desktopChrome },
        redirect: 'manual'
      });
      // Acceptable statuses: 200, 301, 302, 303, 307 (Shopify redirects auth to customer accounts)
      const validStatus = [200, 301, 302, 303, 307, 308].includes(authRes.status);
      assert(
        validStatus,
        `Auth link ${link} responds with valid status ${authRes.status} (Not 404)`,
        { link, status: authRes.status }
      );
    } catch (err) {
      assert(false, `Auth link ${link} fetch error: ${err.message}`, { link });
    }
  }

  // =========================================================================
  // TEST 4: Email Typo Search (`printswithpasssion`)
  // =========================================================================
  console.log('\n--- TEST 4: Email Typo Storewide Sweep ---');

  const pagesToCheck = [
    { name: 'Homepage', url: `https://printswithpassion.com/${cacheBuster}` },
    { name: 'Delivery & Return Page', url: `https://printswithpassion.com/pages/delivery-return${cacheBuster}` },
    { name: 'Canvas Prints Collection', url: `https://printswithpassion.com/collections/canvas-prints${cacheBuster}` },
    { name: 'Desk Mats Collection', url: `https://printswithpassion.com/collections/desk-mats${cacheBuster}` },
    { name: 'Apparel Collection', url: `https://printswithpassion.com/collections/apparel${cacheBuster}` }
  ];

  for (const page of pagesToCheck) {
    const res = await fetchWithTimeout(page.url, {
      headers: { 'User-Agent': USER_AGENTS.desktopChrome }
    });
    const html = await res.text();
    const typos = [...html.matchAll(/printswithpasssion/gi)];
    assert(
      typos.length === 0,
      `Zero occurrences of typo 'printswithpasssion' on ${page.name} (Found: ${typos.length})`,
      { page: page.name, url: page.url, typoCount: typos.length }
    );

    if (page.name === 'Delivery & Return Page') {
      const correctEmailCount = [...html.matchAll(/printswithpassionbc@gmail\.com/gi)].length;
      assert(
        correctEmailCount >= 2,
        `Correct email 'printswithpassionbc@gmail.com' found ${correctEmailCount} times on ${page.name}`,
        { correctEmailCount }
      );
    }
  }

  // =========================================================================
  // TEST 5: Curated Studio Collections Hub Snippet (Positive Verification)
  // =========================================================================
  console.log('\n--- TEST 5: Curated Studio Hub Directory Positive Verification ---');

  const subcollectionsPath = path.join(projectRoot, 'phase2_40_subcollections.json');
  assert(fs.existsSync(subcollectionsPath), `Reference catalog exists: phase2_40_subcollections.json`);

  const subcollectionsData = JSON.parse(fs.readFileSync(subcollectionsPath, 'utf8'));
  const all48Handles = subcollectionsData.map(s => s.handle);
  assert(all48Handles.length === 48, `Reference catalog contains exactly 48 smart sub-collections (Found: ${all48Handles.length})`);

  const hubHostPages = [
    { name: 'Homepage (/)', url: `https://printswithpassion.com/${cacheBuster}` },
    ...PARENT_COLLECTIONS.map(p => ({
      name: `Parent Collection /collections/${p}`,
      url: `https://printswithpassion.com/collections/${p}${cacheBuster}`
    }))
  ];

  for (const host of hubHostPages) {
    const res = await fetchWithTimeout(host.url, {
      headers: { 'User-Agent': USER_AGENTS.desktopChrome }
    });
    assert(res.status === 200, `${host.name} returns HTTP 200`);
    const html = await res.text();

    // Check hub section is present
    const hasHub = html.includes('pwp-curated-hub');
    assert(hasHub, `${host.name} contains the Curated Collections Hub snippet (pwp-curated-hub)`);

    // Verify all 48 sub-collections are linked
    let missingHandles = [];
    for (const handle of all48Handles) {
      if (!html.includes(`/collections/${handle}`)) {
        missingHandles.push(handle);
      }
    }

    assert(
      missingHandles.length === 0,
      `${host.name} links to all 48 smart sub-collections (Missing: ${missingHandles.length})`,
      { host: host.name, missingHandles: missingHandles.slice(0, 5) }
    );

    // Verify all 6 parent collections are linked
    let missingParents = [];
    for (const parent of PARENT_COLLECTIONS) {
      if (!html.includes(`/collections/${parent}`)) {
        missingParents.push(parent);
      }
    }
    assert(
      missingParents.length === 0,
      `${host.name} links to all 6 parent categories (Missing: ${missingParents.length})`,
      { host: host.name, missingParents }
    );
  }

  // =========================================================================
  // TEST 6: Curated Studio Hub Link Health (Verify all 48 Sub-collections HTTP 200)
  // =========================================================================
  console.log('\n--- TEST 6: HTTP Status Verification Across All 48 Sub-collections ---');
  let healthySubcollections = 0;
  let unhealthySubcollections = [];

  // Paced requests to prevent rate limiting (4 concurrent requests)
  const batchSize = 6;
  for (let i = 0; i < all48Handles.length; i += batchSize) {
    const batch = all48Handles.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (handle) => {
        const url = `https://printswithpassion.com/collections/${handle}`;
        try {
          const res = await fetchWithTimeout(url, {
            method: 'HEAD',
            headers: { 'User-Agent': USER_AGENTS.desktopChrome }
          });
          if (res.status === 200) {
            healthySubcollections++;
          } else {
            unhealthySubcollections.push({ handle, status: res.status });
          }
        } catch (err) {
          unhealthySubcollections.push({ handle, error: err.message });
        }
      })
    );
    // Pacing delay 200ms
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`[INFO] Sub-collection HTTP verification: ${healthySubcollections}/48 returned HTTP 200`);
  assert(
    healthySubcollections === 48,
    `All 48 smart sub-collection landing pages return HTTP 200 OK (Unhealthy: ${unhealthySubcollections.length})`,
    { unhealthySubcollections }
  );

  // =========================================================================
  // TEST 7: Curated Studio Hub Snippet (Negative Verification)
  // =========================================================================
  console.log('\n--- TEST 7: Curated Studio Hub Negative Conditions Verification ---');

  const negativeTestCases = [
    // 6 Sub-collections (1 from each parent)
    { name: 'Canvas Subcollection (nature)', url: 'https://printswithpassion.com/collections/nature-mountain-landscape-canvas-wall-art' },
    { name: 'Desk Mat Subcollection (anime)', url: 'https://printswithpassion.com/collections/japanese-anime-desk-mats' },
    { name: 'Cushion Subcollection (botanical)', url: 'https://printswithpassion.com/collections/botanical-floral-garden-cushion-covers' },
    { name: 'Blanket Subcollection (cabin)', url: 'https://printswithpassion.com/collections/nature-mountain-cabin-throw-blankets' },
    { name: 'Bath Mat Subcollection (coastal)', url: 'https://printswithpassion.com/collections/coastal-ocean-botanical-bath-mats' },
    { name: 'Apparel Subcollection (tees)', url: 'https://printswithpassion.com/collections/japanese-anime-graphic-t-shirts' },
    // General collection
    { name: 'General Collections All (/collections/all)', url: 'https://printswithpassion.com/collections/all' },
    // Static Page
    { name: 'Static Page (/pages/delivery-return)', url: 'https://printswithpassion.com/pages/delivery-return' },
    // Cart page
    { name: 'Cart Page (/cart)', url: 'https://printswithpassion.com/cart' }
  ];

  for (const testCase of negativeTestCases) {
    const res = await fetchWithTimeout(`${testCase.url}${cacheBuster}`, {
      headers: { 'User-Agent': USER_AGENTS.desktopChrome }
    });
    const html = await res.text();
    const hasHub = html.includes('pwp-curated-hub');
    assert(
      !hasHub,
      `Negative test: Hub snippet does NOT render on ${testCase.name} (Has hub: ${hasHub})`,
      { url: testCase.url, hasHub }
    );
  }

  // =========================================================================
  // TEST 8: Heading Structure on Parent Collections
  // =========================================================================
  console.log('\n--- TEST 8: Heading Structure on Parent Collection Pages ---');
  for (const parent of PARENT_COLLECTIONS) {
    const url = `https://printswithpassion.com/collections/${parent}${cacheBuster}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENTS.desktopChrome } });
    const html = await res.text();
    const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
    const h1Texts = h1Matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

    assert(
      h1Matches.length === 1,
      `Parent collection /collections/${parent} has strictly 1 H1 (Found: ${h1Matches.length})`,
      { parent, h1Texts }
    );

    // Verify hub section heading is H2 (not H1)
    const hubHeadingMatch = html.match(/<h2[^>]*id=["']pwp-curated-hub-heading["'][^>]*>([\s\S]*?)<\/h2>/i);
    assert(
      !!hubHeadingMatch,
      `Hub section heading on /collections/${parent} uses semantic <h2>`,
      { parent }
    );
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n====================================================');
  console.log('CHALLENGE SUMMARY VERDICT:');
  console.log(`Total Assertions Run:   ${results.testsRun}`);
  console.log(`Total Assertions Passed: ${results.testsPassed}`);
  console.log(`Total Assertions Failed: ${results.testsFailed}`);
  console.log('====================================================');

  const verdict = results.testsFailed === 0 ? 'APPROVE' : 'REJECT';
  console.log(`FINAL VERDICT: ${verdict}`);

  const reportPath = path.join(__dirname, 'challenger_m1_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Detailed report written to: ${reportPath}`);

  if (results.testsFailed > 0) {
    process.exit(1);
  }
}

runEmpiricalStressTest().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
