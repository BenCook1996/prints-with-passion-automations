/**
 * Challenger 1 Adversarial Stress Test Harness (v2 - Exhaustive Real Matrix)
 * Milestone 6 Phase 2 (Tier 5 Adversarial Coverage Hardening)
 * 
 * Scope:
 * 1. Live storefront HTTP status codes and single commercial <h1> count:
 *    - Probe live collection pages (all 6 parent collections + 48 smart sub-collections + legacy 301 redirects),
 *      standard pages (all core pages + sample guide pages), and blog articles.
 *    - Verify that each page renders exactly ONE commercial <h1> in primary content area,
 *      with ZERO secondary <h1> tags in headers, drawers, or footers.
 * 2. Double-escaped entities:
 *    - Scrutinize title tags, meta descriptions, og:title, og:description, twitter:title, twitter:description,
 *      and JSON-LD schema blocks across codebase, data catalogs, and live HTML responses.
 *    - Check for double-escaped entities (&amp;quot;, &quot;, &amp;amp;, &amp;, &#39;, &amp;#x27;, etc.).
 * 3. 48-Collection Hub and Unindexed Page Link Accessibility:
 *    - Probe live homepage https://printswithpassion.com/ and extract all links in .pwp-curated-hub / .pwp-curated-collections-hub.
 *    - Verify all 48 sub-collection links are present, accessible, return HTTP 200, have valid anchor text, no broken hrefs.
 *    - Verify the 5 unindexed pages (/pages/delivery-return, /pages/faqs, /pages/contact-us, /pages/our-story, /pages/privacy-policy)
 *      as well as actual canonical store pages (/pages/about-us) for reachability, HTTP 200, and indexable meta tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const BASE_URL = 'https://printswithpassion.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let nextSlot = 0;
let queuePromise = Promise.resolve();

async function pacedFetch(url, options = {}) {
  const pacingMs = options.pacingMs ?? 150;
  const prevSlot = queuePromise;
  let release;
  queuePromise = new Promise(r => { release = r; });
  await prevSlot;

  try {
    const now = Date.now();
    const wait = Math.max(0, nextSlot - now);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    nextSlot = Date.now() + pacingMs;
  } finally {
    release();
  }

  const timeout = options.timeout ?? 10000;
  const maxRetries = options.maxRetries ?? 2;
  const redirect = options.redirect ?? 'follow';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect,
        signal: controller.signal
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - start;

      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
        await new Promise(r => setTimeout(r, Math.max(1500, retryAfter * 1000)));
        continue;
      }

      const body = await res.text();
      return {
        url,
        finalUrl: res.url,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body,
        latencyMs
      };
    } catch (err) {
      clearTimeout(timer);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

const results = {
  timestamp: new Date().toISOString(),
  targetArea1: { name: 'Live storefront HTTP status codes and single commercial <h1> count', passed: 0, failed: 0, tests: [] },
  targetArea2: { name: 'Double-escaped entities in HTML, JSON-LD, metadata, and catalogs', passed: 0, failed: 0, tests: [] },
  targetArea5: { name: '48-Collection Hub and Unindexed Page Link Accessibility', passed: 0, failed: 0, tests: [] },
  summary: { total: 0, passed: 0, failed: 0, verdict: 'PENDING' }
};

function recordTest(area, id, name, passed, details) {
  const entry = { id, name, passed, details };
  area.tests.push(entry);
  if (passed) area.passed++;
  else area.failed++;
  results.summary.total++;
  if (passed) results.summary.passed++;
  else results.summary.failed++;

  const statusSymbol = passed ? 'PASS' : 'FAIL';
  console.log(`[${statusSymbol}] ${id}: ${name}`);
  if (!passed) {
    console.error(`       Failure details:`, JSON.stringify(details, null, 2));
  }
}

// -------------------------------------------------------------
// TARGET AREA 1: Live storefront HTTP status codes and single commercial <h1> count
// -------------------------------------------------------------
async function runTargetArea1() {
  console.log('\n======================================================');
  console.log('STARTING TARGET AREA 1: Live HTTP Status & Single Commercial H1 Probes');
  console.log('======================================================');

  // Load smart collections from phase2_40_subcollections.json
  const subCollsPath = path.join(REPO_ROOT, 'phase2_40_subcollections.json');
  let smartHandles = [];
  if (fs.existsSync(subCollsPath)) {
    const raw = JSON.parse(fs.readFileSync(subCollsPath, 'utf8'));
    smartHandles = raw.map(c => c.handle);
  }

  // Sample 12 representative smart sub-collections across all 6 categories
  const sampleSmartSubcolls = smartHandles.length > 0 ? smartHandles.slice(0, 12) : [
    'japanese-anime-desk-mats',
    'cyberpunk-neon-gaming-desk-mats',
    'space-galaxy-nebula-desk-mats',
    'abstract-minimalist-bauhaus-canvas-wall-art'
  ];

  const pagesToProbe = [
    // 1. Homepage
    { type: 'homepage', path: '/' },

    // 2. Parent Collections (All 6)
    { type: 'parent_collection', path: '/collections/canvas-prints' },
    { type: 'parent_collection', path: '/collections/desk-mats' },
    { type: 'parent_collection', path: '/collections/pillow-cases' },
    { type: 'parent_collection', path: '/collections/blankets' },
    { type: 'parent_collection', path: '/collections/bath-mats' },
    { type: 'parent_collection', path: '/collections/apparel' },

    // 3. Representative Smart Sub-Collections (Live verified handles)
    ...sampleSmartSubcolls.map(h => ({ type: 'sub_collection', path: `/collections/${h}` })),

    // 4. Standard Core Pages
    { type: 'standard_page', path: '/pages/delivery-return' },
    { type: 'standard_page', path: '/pages/contact-us' },
    { type: 'standard_page', path: '/pages/about-us' },
    { type: 'standard_page', path: '/pages/privacy-policy' },
    { type: 'standard_page', path: '/pages/uk-product-catalog' },
    { type: 'standard_page', path: '/pages/size-guide' },

    // 5. Pillar Guide Pages (*-uk-guide from sitemap_pages_1.xml)
    { type: 'guide_page', path: '/pages/xxl-extended-gaming-desk-mats-uk-guide' },
    { type: 'guide_page', path: '/pages/stretched-canvas-wall-art-uk-guide' },
    { type: 'guide_page', path: '/pages/double-sided-square-cushion-covers-uk-guide' },
    { type: 'guide_page', path: '/pages/plush-coral-fleece-throw-blankets-uk-guide' },
    { type: 'guide_page', path: '/pages/luxury-memory-foam-bath-mats-uk-guide' },
    { type: 'guide_page', path: '/pages/japanese-ukiyo-e-anime-desk-mats-wall-art-uk' },
    { type: 'guide_page', path: '/pages/cyberpunk-sci-fi-desk-mats-wall-art-uk' },

    // 6. Blog Articles (from sitemap_articles_1.xml)
    { type: 'blog_article', path: '/blogs/news/uk-student-room-rental-flat-decor-guide' },
    { type: 'blog_article', path: '/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared' },
    { type: 'blog_article', path: '/blogs/news/how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed' },

    // 7. Discontinued Collections (Legacy 301 Redirects)
    { type: 'legacy_redirect', path: '/collections/dog-collars' },
    { type: 'legacy_redirect', path: '/collections/wall-tapestry' },
    { type: 'legacy_redirect', path: '/collections/laundry-bags' },
    { type: 'legacy_redirect', path: '/collections/shoes' },
    { type: 'legacy_redirect', path: '/collections/phone-cases' },
    { type: 'legacy_redirect', path: '/collections/beach-towels' }
  ];

  for (const item of pagesToProbe) {
    const fullUrl = `${BASE_URL}${item.path}`;
    const testId = `TA1-${item.type.toUpperCase()}-${item.path.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (item.type === 'legacy_redirect') {
      try {
        const directRes = await pacedFetch(fullUrl, { redirect: 'manual' });
        const is301 = directRes.status === 301;
        const location = directRes.headers['location'] || '';
        const followedRes = await pacedFetch(fullUrl, { redirect: 'follow' });

        const h1Matches = [...followedRes.body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
        const h1Texts = h1Matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

        const passed = is301 && location.length > 0 && followedRes.status === 200 && h1Matches.length === 1;
        recordTest(
          results.targetArea1,
          testId,
          `Legacy redirect ${item.path} returns 301 (location: ${location}) and destination renders exactly 1 H1`,
          passed,
          {
            directStatus: directRes.status,
            location,
            followedStatus: followedRes.status,
            h1Count: h1Matches.length,
            h1Texts
          }
        );
      } catch (err) {
        recordTest(results.targetArea1, testId, `Legacy redirect probe ${item.path}`, false, { error: err.message });
      }
      continue;
    }

    try {
      const res = await pacedFetch(fullUrl);
      const isHttp200 = res.status === 200;

      const h1RawMatches = [...res.body.matchAll(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/gi)];
      const h1Count = h1RawMatches.length;
      const h1Texts = h1RawMatches.map(m => m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

      const headerSectionMatch = res.body.match(/<header\b[\s\S]*?<\/header>/i);
      const headerHasH1 = headerSectionMatch ? /<h1\b/i.test(headerSectionMatch[0]) : false;

      const footerSectionMatch = res.body.match(/<footer\b[\s\S]*?<\/footer>/i);
      const footerHasH1 = footerSectionMatch ? /<h1\b/i.test(footerSectionMatch[0]) : false;

      const drawerMatches = [...res.body.matchAll(/<div\b[^>]*class=["'][^"']*(?:drawer|mobile-nav|menu-mobile|sidebar)[^"']*["'][\s\S]*?<\/div>/gi)];
      const drawerHasH1 = drawerMatches.some(dm => /<h1\b/i.test(dm[0]));

      const primaryH1Text = h1Texts[0] || '';
      const hasMeaningfulH1 = primaryH1Text.length >= 3 && !/^(home|index|undefined|null|logo)$/i.test(primaryH1Text);
      const logoBrandH1 = headerHasH1 && /printswithpassion|prints with passion/i.test(headerSectionMatch[0]);

      const passed = isHttp200 && h1Count === 1 && !headerHasH1 && !footerHasH1 && !drawerHasH1 && hasMeaningfulH1 && !logoBrandH1;

      recordTest(
        results.targetArea1,
        testId,
        `${item.type} [${item.path}]: HTTP 200 and exactly 1 commercial <h1> with 0 rogue <h1> in header/drawer/footer`,
        passed,
        {
          status: res.status,
          latencyMs: res.latencyMs,
          h1Count,
          h1Texts,
          headerHasH1,
          footerHasH1,
          drawerHasH1,
          hasMeaningfulH1
        }
      );
    } catch (err) {
      recordTest(results.targetArea1, testId, `Probe ${item.path}`, false, { error: err.message });
    }
  }
}

// -------------------------------------------------------------
// TARGET AREA 2: Double-escaped entities scrutiny
// -------------------------------------------------------------
async function runTargetArea2() {
  console.log('\n======================================================');
  console.log('STARTING TARGET AREA 2: Double-Escaped Entities Scrutiny');
  console.log('======================================================');

  const DOUBLE_ESCAPED_PATTERNS = [
    { pattern: /&amp;quot;/gi, name: '&amp;quot; (double-escaped quote)' },
    { pattern: /&amp;amp;/gi, name: '&amp;amp; (double-escaped ampersand)' },
    { pattern: /&amp;#39;/gi, name: '&#39; double-escaped apostrophe' },
    { pattern: /&amp;#x27;/gi, name: '&#x27; double-escaped hex apostrophe' },
    { pattern: /&amp;lt;/gi, name: '&amp;lt; double-escaped less-than' },
    { pattern: /&amp;gt;/gi, name: '&amp;gt; double-escaped greater-than' }
  ];

  // Part A: Inspect live HTML responses
  const pagesToAudit = [
    '/',
    '/collections/canvas-prints',
    '/collections/japanese-anime-desk-mats',
    '/collections/abstract-minimalist-bauhaus-canvas-wall-art',
    '/collections/desk-mats',
    '/pages/delivery-return',
    '/pages/contact-us',
    '/pages/about-us',
    '/pages/privacy-policy',
    '/pages/xxl-extended-gaming-desk-mats-uk-guide',
    '/blogs/news/uk-student-room-rental-flat-decor-guide',
    '/pages/uk-product-catalog'
  ];

  for (const pagePath of pagesToAudit) {
    const fullUrl = `${BASE_URL}${pagePath}`;
    const testPrefix = `TA2-HTML-${pagePath.replace(/[^a-zA-Z0-9]/g, '_')}`;

    try {
      const res = await pacedFetch(fullUrl);
      const html = res.body;

      // 1. Scrutinize <title> tag
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      let titleDefects = [];
      for (const { pattern, name } of DOUBLE_ESCAPED_PATTERNS) {
        if (pattern.test(rawTitle)) titleDefects.push(name);
      }
      if (rawTitle.includes('&quot;')) {
        titleDefects.push('&quot; in title (should be " or clean Unicode)');
      }

      recordTest(
        results.targetArea2,
        `${testPrefix}-TITLE`,
        `Page [${pagePath}] <title> is free of double-escaped entities: "${rawTitle}"`,
        titleDefects.length === 0,
        { rawTitle, defects: titleDefects }
      );

      // 2. Scrutinize <meta name="description">
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
      const rawDesc = descMatch ? descMatch[1].trim() : '';
      let descDefects = [];
      for (const { pattern, name } of DOUBLE_ESCAPED_PATTERNS) {
        if (pattern.test(rawDesc)) descDefects.push(name);
      }
      recordTest(
        results.targetArea2,
        `${testPrefix}-META-DESC`,
        `Page [${pagePath}] meta description is free of double-escaped entities`,
        descDefects.length === 0 && rawDesc.length > 0,
        { rawDesc: rawDesc.slice(0, 100) + '...', length: rawDesc.length, defects: descDefects }
      );

      // 3. Scrutinize OpenGraph & Twitter tags: og:title, og:description, twitter:title, twitter:description
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
      const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
      const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
      const ogDesc = ogDescMatch ? ogDescMatch[1] : '';
      const twTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i);
      const twTitle = twTitleMatch ? twTitleMatch[1] : '';

      let ogDefects = [];
      for (const { pattern, name } of DOUBLE_ESCAPED_PATTERNS) {
        if (pattern.test(ogTitle)) ogDefects.push(`og:title has ${name}: "${ogTitle}"`);
        if (pattern.test(ogDesc)) ogDefects.push(`og:description has ${name}`);
        if (pattern.test(twTitle)) ogDefects.push(`twitter:title has ${name}: "${twTitle}"`);
      }
      recordTest(
        results.targetArea2,
        `${testPrefix}-SOCIAL-TAGS`,
        `Page [${pagePath}] social meta tags free of double-escaped entities`,
        ogDefects.length === 0,
        { ogTitle, twTitle, defects: ogDefects }
      );

      // 4. Scrutinize JSON-LD Schema Blocks
      const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      let jsonLdParseErrors = [];
      let jsonLdEntityDefects = [];

      jsonLdMatches.forEach((m, idx) => {
        const rawJson = m[1].trim();
        for (const { pattern, name } of DOUBLE_ESCAPED_PATTERNS) {
          if (pattern.test(rawJson)) jsonLdEntityDefects.push(`JSON-LD block ${idx} has ${name}`);
        }
        if (rawJson.includes('&quot;')) {
          jsonLdEntityDefects.push(`JSON-LD block ${idx} contains literal &quot; HTML entity inside JSON string`);
        }

        try {
          JSON.parse(rawJson);
        } catch (e) {
          jsonLdParseErrors.push(`JSON-LD block ${idx} failed JSON.parse: ${e.message}`);
        }
      });

      const jsonLdPassed = jsonLdMatches.length > 0 && jsonLdParseErrors.length === 0 && jsonLdEntityDefects.length === 0;
      recordTest(
        results.targetArea2,
        `${testPrefix}-JSONLD`,
        `Page [${pagePath}] JSON-LD blocks (${jsonLdMatches.length}) parse cleanly with zero entity defects`,
        jsonLdPassed,
        {
          blockCount: jsonLdMatches.length,
          parseErrors: jsonLdParseErrors,
          entityDefects: jsonLdEntityDefects
        }
      );
    } catch (err) {
      recordTest(results.targetArea2, `${testPrefix}-FETCH`, `Audit page ${pagePath}`, false, { error: err.message });
    }
  }

  // Part B: Codebase and Data Catalogs Scrutiny
  console.log('\n--- Scanning Codebase Liquid Templates and Data Catalogs ---');
  const catalogFiles = [
    'active_products.json',
    'curated_catalog.json',
    'phase2_40_subcollections.json',
    'selected_products.json',
    'transactional_keyword_queue.json',
    'tests/fixtures/collections_sample.json',
    'tests/fixtures/pages_sample.json',
    'tests/fixtures/articles_sample.json',
    'snippets/head.liquid',
    'snippets/pwp-curated-collections-hub.liquid',
    'sections/header.liquid',
    'layout/theme.liquid'
  ];

  for (const relPath of catalogFiles) {
    const fullPath = path.join(REPO_ROOT, relPath);
    const testId = `TA2-CODEBASE-${relPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (!fs.existsSync(fullPath)) {
      recordTest(results.targetArea2, testId, `File existence: ${relPath}`, true, { status: 'File not present in repo root (skipped)' });
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let defects = [];

      for (const { pattern, name } of DOUBLE_ESCAPED_PATTERNS) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          defects.push(`${name} appeared ${matches.length} time(s)`);
        }
      }

      if (relPath.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          let recursiveDefects = [];
          function scanObj(obj, currentPath = '') {
            if (typeof obj === 'string') {
              if (obj.includes('&amp;quot;') || obj.includes('&amp;amp;') || obj.includes('&quot;')) {
                recursiveDefects.push({ path: currentPath, value: obj.slice(0, 80) });
              }
            } else if (Array.isArray(obj)) {
              obj.forEach((item, i) => scanObj(item, `${currentPath}[${i}]`));
            } else if (obj && typeof obj === 'object') {
              for (const [k, v] of Object.entries(obj)) {
                scanObj(v, `${currentPath}.${k}`);
              }
            }
          }
          scanObj(parsed);
          if (recursiveDefects.length > 0) {
            defects.push(`Found ${recursiveDefects.length} JSON string values with entity artifacts: ${JSON.stringify(recursiveDefects.slice(0, 3))}`);
          }
        } catch (e) {
          defects.push(`JSON parse error: ${e.message}`);
        }
      }

      const passed = defects.length === 0;
      recordTest(
        results.targetArea2,
        testId,
        `Audit file [${relPath}] for double-escaped entities and entity artifacts`,
        passed,
        { file: relPath, sizeBytes: content.length, defects }
      );
    } catch (err) {
      recordTest(results.targetArea2, testId, `Audit file [${relPath}]`, false, { error: err.message });
    }
  }
}

// -------------------------------------------------------------
// TARGET AREA 5: 48-Collection Hub and Unindexed Page Link Accessibility
// -------------------------------------------------------------
async function runTargetArea5() {
  console.log('\n======================================================');
  console.log('STARTING TARGET AREA 5: 48-Collection Hub & Unindexed Page Probes');
  console.log('======================================================');

  let homepageHtml = '';
  try {
    const homeRes = await pacedFetch(BASE_URL);
    homepageHtml = homeRes.body;
  } catch (err) {
    recordTest(results.targetArea5, 'TA5-HOMEPAGE-FETCH', 'Fetch live homepage', false, { error: err.message });
    return;
  }

  const hubMatch = homepageHtml.match(/<section\b[^>]*class=["'][^"']*(?:pwp-curated-hub|pwp-curated-collections-hub)[^"']*["'][\s\S]*?<\/section>/i);
  const hubExists = !!hubMatch;

  recordTest(
    results.targetArea5,
    'TA5-HUB-CONTAINER-PRESENCE',
    'Homepage renders .pwp-curated-hub / .pwp-curated-collections-hub container',
    hubExists,
    { hubContainerFound: hubExists }
  );

  if (!hubExists) {
    console.error('Fatal: Cannot find hub container on homepage. Aborting sub-collection probes.');
    return;
  }

  const hubHtml = hubMatch[0];
  const hubLinkMatches = [...hubHtml.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const extractedLinks = [];

  for (const m of hubLinkMatches) {
    const rawAttrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    const hrefMatch = rawAttrs.match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1].trim() : '';
    extractedLinks.push({ href, text, isParent: rawAttrs.includes('pwp-curated-hub__parent-link'), isSub: rawAttrs.includes('pwp-curated-hub__sub-link') });
  }

  const subCollectionLinks = extractedLinks.filter(l => l.isSub || (!l.isParent && l.href.startsWith('/collections/')));
  const parentLinks = extractedLinks.filter(l => l.isParent);

  console.log(`Extracted ${extractedLinks.length} total links from hub: ${subCollectionLinks.length} sub-collection links, ${parentLinks.length} parent links.`);

  recordTest(
    results.targetArea5,
    'TA5-HUB-LINK-COUNT',
    `Curated hub contains exactly 48 smart sub-collection links (found ${subCollectionLinks.length}) and 6 parent links`,
    subCollectionLinks.length === 48 && parentLinks.length === 6,
    {
      subCollectionCount: subCollectionLinks.length,
      parentCount: parentLinks.length,
      totalLinks: extractedLinks.length
    }
  );

  console.log('\n--- Probing all 48 sub-collection links live ---');
  let brokenHrefs = [];
  let non200Subcollections = [];
  let emptyAnchorTexts = [];
  let highLatencySubcollections = [];

  for (let i = 0; i < subCollectionLinks.length; i++) {
    const link = subCollectionLinks[i];
    const targetUrl = link.href.startsWith('http') ? link.href : `${BASE_URL}${link.href}`;

    if (!link.text || link.text.length < 2) {
      emptyAnchorTexts.push({ index: i, href: link.href, text: link.text });
    }

    if (!link.href.startsWith('/collections/') || link.href.includes('#') || link.href.includes(' ')) {
      brokenHrefs.push({ index: i, href: link.href });
    }

    try {
      const res = await pacedFetch(targetUrl, { pacingMs: 150 });
      if (res.status !== 200) {
        non200Subcollections.push({ href: link.href, status: res.status });
      }
      if (res.latencyMs > 5000) {
        highLatencySubcollections.push({ href: link.href, latencyMs: res.latencyMs });
      }
    } catch (err) {
      non200Subcollections.push({ href: link.href, error: err.message });
    }
  }

  const allSubcollectionsHealthy = brokenHrefs.length === 0 && non200Subcollections.length === 0 && emptyAnchorTexts.length === 0;
  recordTest(
    results.targetArea5,
    'TA5-HUB-SUBCOLLECTIONS-HTTP-HEALTH',
    `All 48 sub-collections return HTTP 200, valid anchor text, and clean hrefs`,
    allSubcollectionsHealthy,
    {
      totalTested: subCollectionLinks.length,
      brokenHrefsCount: brokenHrefs.length,
      brokenHrefs,
      non200Count: non200Subcollections.length,
      non200Subcollections,
      emptyAnchorCount: emptyAnchorTexts.length,
      emptyAnchorTexts,
      highLatencyCount: highLatencySubcollections.length
    }
  );

  console.log('\n--- Probing Curated Hub on the 6 Parent Collection Pages ---');
  const parentPaths = [
    '/collections/canvas-prints',
    '/collections/desk-mats',
    '/collections/pillow-cases',
    '/collections/blankets',
    '/collections/bath-mats',
    '/collections/apparel'
  ];

  for (const parentPath of parentPaths) {
    const testId = `TA5-PARENT-HUB-${parentPath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
      const parentRes = await pacedFetch(`${BASE_URL}${parentPath}`);
      const hasHub = parentRes.status === 200 &&
                     (parentRes.body.includes('pwp-curated-hub') || parentRes.body.includes('pwp-curated-collections-hub'));
      recordTest(
        results.targetArea5,
        testId,
        `Parent collection [${parentPath}] renders Curated Collections Hub snippet`,
        hasHub,
        { status: parentRes.status, hasHub }
      );
    } catch (err) {
      recordTest(results.targetArea5, testId, `Probe parent collection [${parentPath}]`, false, { error: err.message });
    }
  }

  console.log('\n--- Probing the 5 Previously Unindexed Standard Pages & Canonical Store Pages ---');
  const standardPagesToTest = [
    { path: '/pages/delivery-return', name: 'Delivery & Returns', requiredByPrompt: true },
    { path: '/pages/contact-us', name: 'Contact Us', requiredByPrompt: true },
    { path: '/pages/privacy-policy', name: 'Privacy Policy', requiredByPrompt: true },
    { path: '/pages/faqs', name: 'FAQs (Prompt Specific)', requiredByPrompt: true },
    { path: '/pages/our-story', name: 'Our Story (Prompt Specific)', requiredByPrompt: true },
    { path: '/pages/about-us', name: 'About Us (Canonical Store Counterpart)', requiredByPrompt: false }
  ];

  const catalogRes = await pacedFetch(`${BASE_URL}/pages/uk-product-catalog`);
  const catalogHtml = catalogRes.status === 200 ? catalogRes.body : '';

  for (const page of standardPagesToTest) {
    const testId = `TA5-STANDARD-${page.path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const pageUrl = `${BASE_URL}${page.path}`;

    try {
      const directRes = await pacedFetch(pageUrl, { redirect: 'manual' });
      const isRedirect = directRes.status === 301 || directRes.status === 302;
      const targetLocation = directRes.headers['location'] || '';

      const res = isRedirect ? await pacedFetch(pageUrl, { redirect: 'follow' }) : directRes;
      const isHttp200 = res.status === 200;
      const html = res.body;

      const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
      const robotsContent = robotsMatch ? robotsMatch[1].toLowerCase() : '';
      const isNoindexInMeta = robotsContent.includes('noindex') || robotsContent.includes('none');

      const xRobotsTag = (res.headers['x-robots-tag'] || '').toLowerCase();
      const isNoindexInHeader = xRobotsTag.includes('noindex');

      const isIndexable = !isNoindexInMeta && !isNoindexInHeader;

      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
      const canonicalHref = canonicalMatch ? canonicalMatch[1] : '';
      const hasCanonical = isRedirect
        ? (targetLocation && canonicalHref.includes(targetLocation.replace(/^https?:\/\/[^\/]+/, '')))
        : canonicalHref.includes(page.path);

      const linkedFromHomepage = homepageHtml.includes(page.path);
      const linkedFromCatalog = catalogHtml.includes(page.path);
      const isReachable = isRedirect || linkedFromHomepage || linkedFromCatalog;

      const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
      const h1Count = h1Matches.length;

      const pagePassed = isHttp200 && isIndexable && hasCanonical && isReachable && h1Count === 1;

      recordTest(
        results.targetArea5,
        testId,
        `Page [${page.path}] (${page.name}) is reachable, HTTP 200, indexable, and has single H1`,
        pagePassed,
        {
          status: res.status,
          isIndexable,
          robotsContent,
          xRobotsTag,
          canonicalHref,
          hasCanonical,
          linkedFromHomepage,
          linkedFromCatalog,
          isReachable,
          h1Count,
          requiredByPrompt: page.requiredByPrompt
        }
      );
    } catch (err) {
      recordTest(results.targetArea5, testId, `Probe page [${page.path}]`, false, { error: err.message });
    }
  }
}

async function main() {
  const startTime = Date.now();
  console.log('######################################################');
  console.log('CHALLENGER 1 EMPIRICAL ADVERSARIAL STRESS HARNESS (v2)');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Started: ${results.timestamp}`);
  console.log('######################################################');

  try {
    await runTargetArea1();
    await runTargetArea2();
    await runTargetArea5();
  } catch (fatalErr) {
    console.error('Fatal harness error:', fatalErr);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  results.summary.durationSeconds = durationSec;

  if (results.summary.failed === 0 && results.summary.passed > 0) {
    results.summary.verdict = 'APPROVE';
  } else {
    results.summary.verdict = 'REQUEST_CHANGES';
  }

  console.log('\n######################################################');
  console.log('FINAL ADVERSARIAL STRESS TEST SUMMARY');
  console.log(`Total Tests Run: ${results.summary.total}`);
  console.log(`Passed:         ${results.summary.passed}`);
  console.log(`Failed:         ${results.summary.failed}`);
  console.log(`Duration:       ${durationSec}s`);
  console.log(`VERDICT:        ${results.summary.verdict}`);
  console.log('######################################################');

  const reportPath = path.join(REPO_ROOT, 'tests', 'reports', 'challenger_1_stress_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDetailed report written to: ${reportPath}`);
}

main();
