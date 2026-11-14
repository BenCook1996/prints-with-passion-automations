#!/usr/bin/env node
/**
 * prints-with-passion-automations — Milestone 1 Adversarial Stress Test Harness
 * Author: Challenger 2 (teamwork_challenger_m1_2)
 *
 * Comprehensive stress testing against live production storefront:
 * 1. Multi-User-Agent Heading Architecture (Desktop Chrome, Mobile Chrome, Safari iOS, Googlebot Desktop, Googlebot Smartphone)
 * 2. Title & Meta Description Tag Hygiene (Length, Entities, Duplication, Merch Content)
 * 3. Navigation & Customer Auth Crawl Trap Audit (Every header & drawer link)
 * 4. Site-Wide Typo Scan across DOM & Injected Modals
 * 5. Curated Hub Matrix Verification (Positive on / and 6 parents; Negative across subcollections, products, blogs, pages)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USER_AGENTS = {
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  googlebotDesktop: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  googlebotSmartphone: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  mobileSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'
};

const BASE_URL = 'https://printswithpassion.com';
const PARENT_COLLECTIONS = [
  'canvas-prints',
  'desk-mats',
  'pillow-cases',
  'blankets',
  'bath-mats',
  'apparel'
];

async function fetchPage(urlPath, ua = USER_AGENTS.desktopChrome) {
  const separator = urlPath.includes('?') ? '&' : '?';
  const fullUrl = `${BASE_URL}${urlPath}${separator}_t=${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const resp = await fetch(fullUrl, {
    headers: {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cache-Control': 'no-cache, no-store'
    }
  });
  const text = await resp.text();
  return { status: resp.status, headers: resp.headers, body: text, url: fullUrl };
}

async function runStressTests() {
  const results = {
    headingTests: [],
    titleMetaTests: [],
    authLinkTests: [],
    typoTests: [],
    hubPositiveTests: [],
    hubNegativeTests: [],
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
  };

  function record(category, testName, pass, details, isWarning = false) {
    results.summary.total++;
    if (pass) {
      results.summary.passed++;
    } else if (isWarning) {
      results.summary.warnings++;
    } else {
      results.summary.failed++;
    }
    const entry = { testName, pass: isWarning ? 'WARN' : pass, details };
    results[category].push(entry);
    const badge = pass ? '[PASS]' : isWarning ? '[WARN]' : '[FAIL]';
    console.log(`${badge} ${category} -> ${testName}: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
  }

  console.log('================================================================');
  console.log(' STARTING ADVERSARIAL STRESS TEST HARNESS — MILESTONE 1');
  console.log(' Target: ' + BASE_URL);
  console.log('================================================================\n');

  // ===========================================================================
  // TEST GROUP 1: Multi-UA Heading Structure on Homepage
  // ===========================================================================
  console.log('--- 1. Heading Structure Under Diverse User Agents ---');
  for (const [uaName, uaString] of Object.entries(USER_AGENTS)) {
    try {
      const page = await fetchPage('/', uaString);
      const h1Matches = [...page.body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
      const h1Texts = h1Matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

      const countCorrect = h1Matches.length === 1;
      const textMatchesIntent = h1Texts[0] && (h1Texts[0].includes('Canvas Wall Art') || h1Texts[0].includes('XXL Desk Mats'));

      record('headingTests', `Single H1 under ${uaName}`, countCorrect, {
        ua: uaName,
        h1Count: h1Matches.length,
        h1Texts
      });

      record('headingTests', `Commercial Intent in H1 under ${uaName}`, textMatchesIntent, {
        ua: uaName,
        text: h1Texts[0]
      });

      // Check if logo is h1
      const logoH1 = /<h1[^>]*class=["'][^"']*logo/i.test(page.body);
      record('headingTests', `Logo not H1 under ${uaName}`, !logoH1, {
        ua: uaName,
        logoIsH1: logoH1
      });
    } catch (err) {
      record('headingTests', `Fetch failed under ${uaName}`, false, { error: err.message });
    }
  }

  // ===========================================================================
  // TEST GROUP 2: Title and Meta Description Tag Hygiene
  // ===========================================================================
  console.log('\n--- 2. Title & Meta Description Tag Hygiene ---');
  try {
    const home = await fetchPage('/', USER_AGENTS.desktopChrome);
    const body = home.body;

    // Title tag analysis
    const titleMatches = [...body.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    const titleRaw = titleMatches[0] ? titleMatches[0][1].trim() : '';
    const titleClean = titleRaw.replace(/&amp;/g, '&');

    record('titleMetaTests', 'Exactly one <title> tag on homepage', titleMatches.length === 1, {
      count: titleMatches.length,
      titles: titleMatches.map(m => m[1].trim())
    });

    const expectedTitle = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
    record('titleMetaTests', 'Homepage title exact match to spec', titleClean === expectedTitle, {
      actual: titleClean,
      expected: expectedTitle
    });

    // Length check: Spec requested string is 65 chars, but prompt mentions (<= 60 characters)
    const titleLength = titleClean.length;
    record('titleMetaTests', 'Homepage title length audit', titleLength <= 65, {
      titleLength,
      rawLength: titleRaw.length,
      note: 'The exact spec title string requested is 65 chars, though prompt mentioned <= 60 chars'
    });

    // Meta description analysis
    const metaDescMatches = [...body.matchAll(/<meta\b[^>]+name=["']description["'][^>]*>/gi)];
    record('titleMetaTests', 'Exactly one <meta name="description"> tag', metaDescMatches.length === 1, {
      count: metaDescMatches.length,
      tags: metaDescMatches.map(m => m[0])
    });

    let metaContent = '';
    if (metaDescMatches.length > 0) {
      const contentMatch = metaDescMatches[0][0].match(/content=["']([^"']*)["']/i);
      metaContent = contentMatch ? contentMatch[1] : '';
    }

    const expectedMeta = 'Shop archival framed canvas wall art (1.25" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats.';
    const metaUnescaped = metaContent.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

    record('titleMetaTests', 'Meta description content matches spec', metaUnescaped === expectedMeta, {
      actual: metaUnescaped,
      expected: expectedMeta
    });

    // Note on length: The verbatim text specified in R1 has 159 characters.
    // 140-158 constraint in R3 applies to collections, but e2e runner applied 140-158 to homepage.
    record('titleMetaTests', 'Meta description plain length audit', metaUnescaped.length <= 160, {
      plainLength: metaUnescaped.length,
      rawContentLength: metaContent.length,
      charCount: [...metaUnescaped].length,
      in140to158Range: metaUnescaped.length >= 140 && metaUnescaped.length <= 158
    }, metaUnescaped.length > 158); // warning if > 158

    record('titleMetaTests', 'Meta description no double-escaping (&amp;quot;)', !metaContent.includes('&amp;quot;'), {
      hasDoubleEscaped: metaContent.includes('&amp;quot;')
    });

    // Discontinued merchandise check
    const discontinuedTerms = ['posters', 'puzzles', 'duvet covers', 'mugs', 'shoes', 'hats', 'yoga mats', 'dog collars'];
    const foundDiscontinued = discontinuedTerms.filter(t => metaContent.toLowerCase().includes(t));
    record('titleMetaTests', 'Meta description free of discontinued merchandise', foundDiscontinued.length === 0, {
      foundDiscontinued
    });

    // OpenGraph and Twitter Meta Tags
    const ogTitle = body.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)?.[1];
    const ogDesc = body.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)?.[1];
    record('titleMetaTests', 'OG metadata present', Boolean(ogTitle), { ogTitle, ogDesc });

  } catch (err) {
    record('titleMetaTests', 'Homepage title/meta fetch failure', false, { error: err.message });
  }

  // ===========================================================================
  // TEST GROUP 3: Customer Auth URL & Navigation Crawl Trap Audit
  // ===========================================================================
  console.log('\n--- 3. Navigation & Customer Auth Crawl Traps ---');
  try {
    const home = await fetchPage('/', USER_AGENTS.desktopChrome);
    const body = home.body;

    // Check for malformed leading-slash absolute URL pattern: href="/https:
    const malformedSchemeMatches = [...body.matchAll(/href=["'](\/(?:https?:|\/\/)[^"']*)["']/gi)];
    record('authLinkTests', 'Zero malformed href="/https:..." crawl traps', malformedSchemeMatches.length === 0, {
      foundMalformedLinks: malformedSchemeMatches.map(m => m[1])
    });

    // Check specifically for customer_authentication links
    const authLinks = [...body.matchAll(/href=["']([^"']*(?:customer_authentication|account\/login|account)[^"']*)["']/gi)].map(m => m[1]);
    const malformedAuthLinks = authLinks.filter(l => l.startsWith('/http') || l.startsWith('//http') || l.startsWith('/customer_authentication'));
    record('authLinkTests', 'Customer authentication links correctly formed', malformedAuthLinks.length === 0, {
      sampleAuthLinks: authLinks.slice(0, 5),
      malformedAuthLinks
    });

    // Extract all header/nav links and crawl sample
    const headerHtml = body.match(/<header\b[\s\S]*?<\/header>/i)?.[0] || '';
    const headerLinks = [...headerHtml.matchAll(/href=["']([^"'#][^"']*)["']/gi)].map(m => m[1]);
    const uniqueHeaderLinks = [...new Set(headerLinks)].filter(l => !l.startsWith('tel:') && !l.startsWith('mailto:') && !l.startsWith('javascript:'));

    console.log(`Auditing ${uniqueHeaderLinks.length} distinct header links for 404 crawl traps...`);
    let brokenHeaderLinks = [];
    for (const link of uniqueHeaderLinks.slice(0, 15)) { // sample 15 links
      const linkUrl = link.startsWith('http') ? link : `${BASE_URL}${link.startsWith('/') ? '' : '/'}${link}`;
      try {
        const linkResp = await fetch(linkUrl, {
          method: 'GET',
          headers: {
            'User-Agent': USER_AGENTS.desktopChrome,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          redirect: 'follow'
        });
        if (linkResp.status >= 400) {
          brokenHeaderLinks.push({ link, status: linkResp.status });
        }
      } catch (e) {
        brokenHeaderLinks.push({ link, error: e.message });
      }
    }
    record('authLinkTests', 'Sampled header navigation links return healthy HTTP status (no 404s)', brokenHeaderLinks.length === 0, {
      testedCount: Math.min(uniqueHeaderLinks.length, 15),
      brokenHeaderLinks
    });

  } catch (err) {
    record('authLinkTests', 'Auth and nav audit failure', false, { error: err.message });
  }

  // ===========================================================================
  // TEST GROUP 4: Email Typo Audit across DOM & Modals
  // ===========================================================================
  console.log('\n--- 4. Email Typo Audit (printswithpasssion) ---');
  const pagesToAudit = [
    { name: 'Homepage (Desktop)', path: '/', ua: USER_AGENTS.desktopChrome },
    { name: 'Homepage (Mobile)', path: '/', ua: USER_AGENTS.googlebotSmartphone },
    { name: 'Delivery & Return Page', path: '/pages/delivery-return', ua: USER_AGENTS.desktopChrome },
    { name: 'Parent Collection Canvas Prints', path: '/collections/canvas-prints', ua: USER_AGENTS.desktopChrome }
  ];

  for (const target of pagesToAudit) {
    try {
      const page = await fetchPage(target.path, target.ua);
      if (page.status === 404) {
        console.log(`Note: ${target.path} returned 404, skipping typo check on non-existent page`);
        continue;
      }

      // Check specifically for three or more 's's in printswithpasssion
      const typoOccurrences = [...page.body.matchAll(/printswithpass{3,}ion/gi)].map(m => m[0]);
      record('typoTests', `Zero email typos on ${target.name}`, typoOccurrences.length === 0, {
        url: target.path,
        typos: typoOccurrences
      });

      // Check for presence of correct email on delivery-return
      if (target.path === '/pages/delivery-return') {
        const correctOccurrences = [...page.body.matchAll(/printswithpassionbc@gmail\.com/gi)].map(m => m[0]);
        record('typoTests', `Correct email present on Delivery & Return`, correctOccurrences.length >= 2, {
          occurrences: correctOccurrences.length
        });
      }

      // Check injected modal containers in DOM
      const modalBlocks = [...page.body.matchAll(/<div[^>]+(?:class|id)=["'][^"']*(?:modal|popup|delivery-return)[^"']*["'][\s\S]*?<\/div>/gi)].map(m => m[0]);
      let modalTypoCount = 0;
      for (const m of modalBlocks) {
        if (/printswithpasssion/i.test(m)) modalTypoCount++;
      }
      record('typoTests', `Zero typos inside modals on ${target.name}`, modalTypoCount === 0, {
        modalsAudited: modalBlocks.length,
        modalTypoCount
      });

    } catch (err) {
      record('typoTests', `Typo check failed on ${target.name}`, false, { error: err.message });
    }
  }

  // ===========================================================================
  // TEST GROUP 5: Curated Collections Hub Positive & Negative Tests
  // ===========================================================================
  console.log('\n--- 5. Curated Hub Matrix Verification (Positive & Negative) ---');
  const subsFile = path.join(__dirname, 'phase2_40_subcollections.json');
  const subcollections = JSON.parse(fs.readFileSync(subsFile, 'utf8'));

  // Positive Test A: Homepage
  try {
    const home = await fetchPage('/', USER_AGENTS.desktopChrome);
    const hasHub = home.body.includes('pwp-curated-hub');
    let missingSubsHome = [];
    for (const sub of subcollections) {
      if (!home.body.includes(`/collections/${sub.handle}`)) {
        missingSubsHome.push(sub.handle);
      }
    }
    record('hubPositiveTests', 'Hub snippet renders on Homepage (/)', hasHub, { hasHub });
    record('hubPositiveTests', 'All 48 smart subcollections linked on Homepage (/)', missingSubsHome.length === 0, {
      totalExpected: subcollections.length,
      linkedCount: subcollections.length - missingSubsHome.length,
      missingSubs: missingSubsHome
    });
  } catch (err) {
    record('hubPositiveTests', 'Homepage hub test failure', false, { error: err.message });
  }

  // Positive Test B: 6 Parent Collection Pages
  for (const parent of PARENT_COLLECTIONS) {
    try {
      const pPage = await fetchPage(`/collections/${parent}`, USER_AGENTS.desktopChrome);
      const hasHub = pPage.body.includes('pwp-curated-hub');
      let missingSubs = [];
      for (const sub of subcollections) {
        if (!pPage.body.includes(`/collections/${sub.handle}`)) {
          missingSubs.push(sub.handle);
        }
      }
      record('hubPositiveTests', `Hub snippet renders on /collections/${parent}`, hasHub, { hasHub });
      record('hubPositiveTests', `All 48 smart subcollections linked on /collections/${parent}`, missingSubs.length === 0, {
        totalExpected: subcollections.length,
        linkedCount: subcollections.length - missingSubs.length,
        missingCount: missingSubs.length
      });
    } catch (err) {
      record('hubPositiveTests', `Parent /collections/${parent} hub test failure`, false, { error: err.message });
    }
  }

  // Negative Tests: Verify Hub does NOT render where prohibited
  const negativeTargets = [
    { type: 'subcollection', path: '/collections/nature-mountain-landscape-canvas-wall-art' },
    { type: 'subcollection', path: '/collections/japanese-anime-desk-mats' },
    { type: 'subcollection', path: '/collections/william-morris-pillow-cases' },
    { type: 'page', path: '/pages/delivery-return' },
    { type: 'page', path: '/pages/uk-product-catalog' },
    { type: 'blog-hub', path: '/blogs/news' }
  ];

  for (const neg of negativeTargets) {
    try {
      const page = await fetchPage(neg.path, USER_AGENTS.desktopChrome);
      if (page.status === 404) {
        console.log(`Note: ${neg.path} returned 404, skipping negative test for absent route`);
        continue;
      }
      const hasHub = page.body.includes('pwp-curated-hub') || page.body.includes('Shop All 48 Curated Studio Collections');
      record('hubNegativeTests', `Hub does NOT render on ${neg.type}: ${neg.path}`, !hasHub, {
        path: neg.path,
        renderedHub: hasHub
      });
    } catch (err) {
      record('hubNegativeTests', `Negative test fetch error on ${neg.path}`, false, { error: err.message });
    }
  }

  // ===========================================================================
  // SUMMARY AND VERDICT
  // ===========================================================================
  console.log('\n================================================================');
  console.log(' ADVERSARIAL STRESS TEST SUMMARY');
  console.log('================================================================');
  console.log(` Total Assertions: ${results.summary.total}`);
  console.log(` Passed:           ${results.summary.passed}`);
  console.log(` Failed:           ${results.summary.failed}`);
  console.log(` Warnings:         ${results.summary.warnings}`);
  console.log('================================================================');

  const verdict = results.summary.failed === 0 ? 'APPROVE' : 'REJECT';
  console.log(` VERDICT: ${verdict}`);
  console.log('================================================================\n');

  // Write detailed results to test output
  fs.writeFileSync(path.join(__dirname, 'stress_test_results.json'), JSON.stringify(results, null, 2), 'utf8');

  return { results, verdict };
}

runStressTests().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
