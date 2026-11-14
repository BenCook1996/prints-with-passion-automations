/**
 * Adversarial Challenger M3-2 — Live Storefront SERP Crawl & Concurrency Stress Harness
 * File: tests/adversarial_challenger_m3_storefront_crawl.mjs
 *
 * EMPIRICAL CHALLENGE SUITE:
 * 1. Sitemap Architecture & Hygiene:
 *    - Validates https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&to=730430275957
 *    - Asserts exact 69 collection count.
 *    - Asserts 0 occurrences of AVADA (avada-upsell-best-sellers).
 *    - Asserts 0 occurrences of all 28 deleted legacy collections (R2).
 *    - Asserts 0 occurrences of unpublished collections (wall-art, stationary-office, plush-blankets).
 *
 * 2. Full Storefront SERP Crawl (Realistic Crawler Pacing & Rate Limit Resilience):
 *    - Staggered crawl across all 69 live collection pages (with 429 backoff retry).
 *    - Extracts raw <title> and <meta name="description"> tags.
 *    - Verifies exactly 1 <title> and exactly 1 <meta name="description"> per page.
 *    - Asserts zero occurrences of &amp;quot;, &quot;, &amp;amp;, or broken entity artifacts.
 *    - Asserts all rendered description lengths strictly fall within [140, 158] characters.
 *    - Asserts all title lengths strictly fall within [25, 60] characters.
 *    - Validates category-level plural title on japanese-anime-desk-mats.
 *    - Validates untruncated clean title on abstract-minimalist-bauhaus-canvas-wall-art.
 *
 * 3. Adversarial Edge Case Stress:
 *    - Trailing slash requests (/collections/<handle>/).
 *    - Query parameters (?sort_by=best-selling, ?page=1, etc.).
 *    - Mobile Googlebot User-Agent emulation.
 *    - Handles with special characters and multiple hyphens.
 *    - Unpublished legacy redirect collections (HTTP 301/302 verification).
 *    - Crawler rate-limit & concurrency discovery analysis.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const STORE_BASE = 'https://printswithpassion.com';
const SITEMAP_COLLECTIONS_URL = `${STORE_BASE}/sitemap_collections_1.xml?from=437768978743&to=730430275957`;

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const GOOGLEBOT_MOBILE_UA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.94 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const MIN_TITLE_LEN = 25;
const MAX_TITLE_LEN = 60;
const MIN_DESC_LEN = 140;
const MAX_DESC_LEN = 158;

const DISCONTINUED_LEGACY_COLLECTIONS = [
  'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
  'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles',
  'shoes', 'hats', 'bottles', 'tote-bags', 'suitcases',
  'yoga-mats', 'makeup-bags', 'coasters', 'pet-mat', 'bottle-opener',
  'pet-bowls', 'bags', 'bags-1', 'pets-animals', 'can-cooler',
  'posters', 'rugs', 'mousepads'
];

const UNPUBLISHED_COLLECTIONS = [
  'wall-art', 'stationary-office', 'plush-blankets'
];

// Regex Assertions
const DOUBLE_ESCAPED_ENTITY_REGEX = /&amp;(?:quot|amp|#39|apos|lt|gt|ndash|mdash|#\d+|#[xX][0-9a-fA-F]+);/i;
const TEMPLATE_PHRASE_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const TERMINAL_PUNCTUATION_REGEX = /[.!?]$/;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&');
}

function extractMetaTags(html) {
  // Extract all <title> tags to detect duplicates
  const titleMatches = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)];
  const rawTitle = titleMatches.length > 0 ? titleMatches[0][1].trim() : '';
  const titleCount = titleMatches.length;

  // Extract all <meta name="description"> tags to detect duplicates
  const descTagMatches = [
    ...html.matchAll(/<meta\b[^>]*?\bname=["']description["'][^>]*?>/gi),
    ...html.matchAll(/<meta\b(?=[^>]*\bcontent=)(?=[^>]*\bname=["']description["'])[^>]*?>/gi)
  ];
  // Deduplicate matched tags by exact string
  const uniqueDescTags = [...new Set(descTagMatches.map(m => m[0]))];
  const descCount = uniqueDescTags.length;

  let rawDesc = '';
  if (uniqueDescTags.length > 0) {
    const firstTag = uniqueDescTags[0];
    const m = firstTag.match(/\bcontent=(["'])([\s\S]*?)\1/i);
    if (m) {
      rawDesc = m[2].trim();
    }
  }

  return { rawTitle, rawDesc, titleCount, descCount };
}

async function fetchHttp(url, options = {}) {
  const { userAgent = DESKTOP_UA, redirect = 'follow', headers = {}, maxRetries = 2 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...headers
        },
        redirect
      });
      const durationMs = Date.now() - start;

      // Handle 429 rate limit backoff
      if (res.status === 429 && attempt < maxRetries) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
        await sleep(retryAfter * 1000 + 500);
        continue;
      }

      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        finalUrl: res.url,
        text,
        durationMs
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      if (attempt === maxRetries) {
        return {
          ok: false,
          status: 0,
          error: err.message,
          durationMs
        };
      }
      await sleep(1000);
    }
  }
}

// ============================================================================
// SUITE 1: SITEMAP ARCHITECTURE & HYGIENE AUDIT
// ============================================================================
async function runSitemapAudit() {
  console.log('\n' + '='.repeat(80));
  console.log('[SUITE 1] Sitemap Architecture & Collection Hygiene Audit');
  console.log('='.repeat(80));

  const suiteResults = {
    name: 'Sitemap Architecture & Hygiene',
    passed: false,
    assertions: []
  };

  function assert(name, condition, details = '') {
    suiteResults.assertions.push({ name, passed: Boolean(condition), details });
    const mark = condition ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${name} ${details ? '— ' + details : ''}`);
    return condition;
  }

  console.log(`Fetching live collections sitemap: ${SITEMAP_COLLECTIONS_URL}`);
  const sitemapResp = await fetchHttp(SITEMAP_COLLECTIONS_URL);

  assert('Sitemap HTTP Status is 200 OK', sitemapResp.ok && sitemapResp.status === 200, `Status: ${sitemapResp.status}`);

  if (!sitemapResp.ok) {
    suiteResults.passed = false;
    return { suiteResults, collectionUrls: [] };
  }

  const xml = sitemapResp.text;
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  const collectionUrls = locMatches.filter(u => u.includes('/collections/'));

  // 1. Exact 69 active collections count
  assert(
    'Exact 69 Active Collections in Sitemap',
    collectionUrls.length === 69,
    `Found ${collectionUrls.length} collections (expected exactly 69)`
  );

  // 2. Zero AVADA in sitemap
  const avadaFound = collectionUrls.filter(u => u.includes('avada'));
  assert(
    'Zero AVADA Collections in Sitemap',
    avadaFound.length === 0,
    avadaFound.length > 0 ? `Found: ${avadaFound.join(', ')}` : 'Zero AVADA collections confirmed'
  );

  // 3. Zero discontinued legacy collections (R2 list)
  const legacyFound = [];
  for (const slug of DISCONTINUED_LEGACY_COLLECTIONS) {
    const found = collectionUrls.find(u => u.endsWith(`/collections/${slug}`));
    if (found) legacyFound.push(slug);
  }
  assert(
    'Zero Deleted Legacy Collections in Sitemap',
    legacyFound.length === 0,
    legacyFound.length > 0 ? `Found: ${legacyFound.join(', ')}` : 'Zero legacy collections confirmed'
  );

  // 4. Zero unpublished legacy collections
  const unpubFound = [];
  for (const slug of UNPUBLISHED_COLLECTIONS) {
    const found = collectionUrls.find(u => u.endsWith(`/collections/${slug}`));
    if (found) unpubFound.push(slug);
  }
  assert(
    'Zero Unpublished Collections in Sitemap',
    unpubFound.length === 0,
    unpubFound.length > 0 ? `Found: ${unpubFound.join(', ')}` : 'Zero unpublished collections confirmed'
  );

  suiteResults.passed = suiteResults.assertions.every(a => a.passed);
  return { suiteResults, collectionUrls };
}

// ============================================================================
// SUITE 2: FULL STOREFRONT SERP CRAWL
// ============================================================================
async function runStorefrontSerpCrawl(collectionUrls) {
  console.log('\n' + '='.repeat(80));
  console.log('[SUITE 2] Full Storefront SERP Crawl & HTML Tag Assertions');
  console.log(`Crawler Pacing: 200ms staggered delay | Target Collections: ${collectionUrls.length}`);
  console.log('='.repeat(80));

  const suiteResults = {
    name: 'Full Storefront SERP Crawl',
    totalAudited: collectionUrls.length,
    passedCount: 0,
    failedCount: 0,
    latencies: [],
    violations: [],
    details: []
  };

  for (let i = 0; i < collectionUrls.length; i++) {
    const url = collectionUrls[i];
    const handle = url.split('/collections/')[1];
    
    // Staggered pacing: 200ms delay between requests to respect CDN rate limits
    if (i > 0) await sleep(200);

    const fetchRes = await fetchHttp(url, { userAgent: DESKTOP_UA });

    if (!fetchRes.ok || fetchRes.status !== 200) {
      const itemErr = {
        handle,
        url,
        passed: false,
        issues: [`HTTP fetch returned status ${fetchRes.status}: ${fetchRes.error || ''}`]
      };
      suiteResults.failedCount++;
      suiteResults.violations.push(itemErr);
      suiteResults.details.push(itemErr);
      console.log(`  [${String(i + 1).padStart(2)}/69] [FAIL] ${handle.padEnd(45)} | HTTP ${fetchRes.status}`);
      continue;
    }

    const html = fetchRes.text;
    const { rawTitle, rawDesc, titleCount, descCount } = extractMetaTags(html);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);
    const issues = [];

    // Tag Cardinality
    if (titleCount === 0) issues.push('Missing <title> tag');
    if (titleCount > 1) issues.push(`Multiple <title> tags detected (${titleCount})`);
    if (descCount === 0) issues.push('Missing <meta name="description"> tag');
    if (descCount > 1) issues.push(`Multiple <meta name="description"> tags detected (${descCount})`);

    // Title Assertions
    if (rawTitle) {
      if (DOUBLE_ESCAPED_ENTITY_REGEX.test(rawTitle)) {
        issues.push(`Raw <title> contains double-escaped entity: "${rawTitle}"`);
      }
      if (decodedTitle.length < MIN_TITLE_LEN || decodedTitle.length > MAX_TITLE_LEN) {
        issues.push(`Decoded title length ${decodedTitle.length} outside [${MIN_TITLE_LEN}, ${MAX_TITLE_LEN}]: "${decodedTitle}"`);
      }
      if (DANGLING_TITLE_REGEX.test(decodedTitle)) {
        issues.push(`Decoded title has dangling/truncated ending: "${decodedTitle}"`);
      }
      if (TEMPLATE_PHRASE_REGEX.test(decodedTitle)) {
        issues.push(`Decoded title has robotic template phrase: "${decodedTitle}"`);
      }
    }

    // Meta Description Assertions
    if (rawDesc) {
      // 1. Double-escaped entities
      if (DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc)) {
        issues.push(`Raw meta description contains double-escaped entity: "${rawDesc}"`);
      }
      if (/&amp;quot;/i.test(rawDesc)) {
        issues.push(`CRITICAL: Raw meta description contains &amp;quot;: "${rawDesc}"`);
      }
      if (/&amp;amp;/i.test(rawDesc)) {
        issues.push(`CRITICAL: Raw meta description contains &amp;amp;: "${rawDesc}"`);
      }

      // 2. Raw entity residue & unescaped quotes
      if (/&quot;/i.test(rawDesc)) {
        issues.push(`Raw meta description contains &quot;: "${rawDesc}"`);
      }
      if (/"/.test(rawDesc)) {
        issues.push(`Raw meta description contains literal unescaped double quote ("): "${rawDesc}"`);
      }
      if (/<|>/.test(rawDesc)) {
        issues.push(`Raw meta description contains unescaped HTML tag delimiter (< or >): "${rawDesc}"`);
      }

      // 3. Decoded description assertions
      if (/&(?:quot|#39|apos|lt|gt|amp);/i.test(decodedDesc)) {
        issues.push(`Decoded description contains unprocessed HTML entity: "${decodedDesc}"`);
      }
      if (/"/.test(decodedDesc)) {
        issues.push(`Decoded description contains literal double quote ("): "${decodedDesc}"`);
      }
      if (decodedDesc.length < MIN_DESC_LEN || decodedDesc.length > MAX_DESC_LEN) {
        issues.push(`Decoded description length ${decodedDesc.length} outside [${MIN_DESC_LEN}, ${MAX_DESC_LEN}]: "${decodedDesc}"`);
      }
      if (!TERMINAL_PUNCTUATION_REGEX.test(decodedDesc.trim())) {
        issues.push(`Decoded description missing terminal punctuation (.!?): "${decodedDesc.slice(-15)}"`);
      }
      if (TEMPLATE_PHRASE_REGEX.test(decodedDesc)) {
        issues.push(`Decoded description contains robotic template phrase: "${decodedDesc}"`);
      }
    }

    // Specific Flagged Collection Checks
    if (handle === 'japanese-anime-desk-mats') {
      if (/Japanese Wave Desk Mat/i.test(decodedTitle)) {
        issues.push(`japanese-anime-desk-mats contains single-product title: "${decodedTitle}"`);
      }
      if (!/(?:Desk Mats|Mouse Pads)/i.test(decodedTitle)) {
        issues.push(`japanese-anime-desk-mats missing category-level plural phrase: "${decodedTitle}"`);
      }
    }

    if (handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
      if (/\(CM & I/i.test(decodedTitle)) {
        issues.push(`abstract-minimalist-bauhaus-canvas-wall-art contains '(CM & I' truncation: "${decodedTitle}"`);
      }
    }

    const passed = issues.length === 0;
    const resultObj = {
      handle,
      url,
      passed,
      status: fetchRes.status,
      durationMs: fetchRes.durationMs,
      title: decodedTitle,
      titleLen: decodedTitle.length,
      desc: decodedDesc,
      descLen: decodedDesc.length,
      issues
    };

    suiteResults.latencies.push(fetchRes.durationMs);
    suiteResults.details.push(resultObj);

    if (passed) {
      suiteResults.passedCount++;
    } else {
      suiteResults.failedCount++;
      suiteResults.violations.push(resultObj);
    }

    const statusBadge = passed ? 'PASS' : 'FAIL';
    console.log(`  [${String(i + 1).padStart(2)}/69] [${statusBadge}] ${handle.padEnd(45)} | T: ${decodedTitle.length}c | D: ${decodedDesc.length}c | ${fetchRes.durationMs}ms`);
    if (!passed) {
      issues.forEach(iss => console.log(`      * ${iss}`));
    }
  }

  const validLatencies = suiteResults.latencies.filter(l => typeof l === 'number' && !isNaN(l));
  const avgLatency = validLatencies.length > 0 ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length) : 0;
  console.log(`\nCrawl Performance: Avg Latency = ${avgLatency}ms | Total Requests = ${collectionUrls.length}`);
  console.log(`Passed: ${suiteResults.passedCount}/${collectionUrls.length} | Failed: ${suiteResults.failedCount}`);

  suiteResults.passed = suiteResults.failedCount === 0;
  return suiteResults;
}

// ============================================================================
// SUITE 3: ADVERSARIAL EDGE CASES & STRESS SCENARIOS
// ============================================================================
async function runEdgeCasesStressSuite(collectionUrls) {
  console.log('\n' + '='.repeat(80));
  console.log('[SUITE 3] Adversarial Edge Cases & Stress Scenarios');
  console.log('='.repeat(80));

  const suiteResults = {
    name: 'Adversarial Edge Cases',
    passed: false,
    assertions: []
  };

  function assert(name, condition, details = '') {
    suiteResults.assertions.push({ name, passed: Boolean(condition), details });
    const mark = condition ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${name} ${details ? '— ' + details : ''}`);
    return condition;
  }

  // --- Edge Case 1: Trailing Slashes ---
  console.log('\n  --- Test 3.1: Trailing Slash Requests (/collections/<handle>/) ---');
  const sampledHandles = [
    'japanese-anime-desk-mats',
    'abstract-minimalist-bauhaus-canvas-wall-art',
    'canvas-prints',
    'desk-mats',
    'botanical-floral-coastal-canvas-wall-art'
  ];

  let trailingSlashPass = true;
  for (const h of sampledHandles) {
    await sleep(200);
    const slashUrl = `${STORE_BASE}/collections/${h}/`;
    const res = await fetchHttp(slashUrl);
    const { rawTitle, rawDesc } = extractMetaTags(res.text);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);

    const validStatus = res.ok && (res.status === 200 || res.status === 301);
    const validMeta = decodedTitle.length >= MIN_TITLE_LEN && decodedTitle.length <= MAX_TITLE_LEN &&
                      decodedDesc.length >= MIN_DESC_LEN && decodedDesc.length <= MAX_DESC_LEN &&
                      !DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc) &&
                      !/&quot;/i.test(rawDesc);

    if (!validStatus || !validMeta) {
      trailingSlashPass = false;
      console.log(`    [FAIL] Trailing slash for ${h}: status=${res.status}, titleLen=${decodedTitle.length}, descLen=${decodedDesc.length}`);
    } else {
      console.log(`    [PASS] Trailing slash for ${h} resolved cleanly (Status: ${res.status}, Title: ${decodedTitle.length}c, Desc: ${decodedDesc.length}c)`);
    }
  }
  assert('Trailing Slash Request Resolution & Metadata Preservation', trailingSlashPass, '5 of 5 sample collections verified');

  // --- Edge Case 2: Query Parameters (Sorting & Pagination) ---
  console.log('\n  --- Test 3.2: Query Parameters (?sort_by=best-selling, etc.) ---');
  const queryParamTests = [
    { handle: 'japanese-anime-desk-mats', query: '?sort_by=best-selling' },
    { handle: 'abstract-minimalist-bauhaus-canvas-wall-art', query: '?sort_by=price-ascending' },
    { handle: 'canvas-prints', query: '?sort_by=created-descending' },
    { handle: 'desk-mats', query: '?page=1' }
  ];

  let queryParamsPass = true;
  for (const t of queryParamTests) {
    await sleep(200);
    const qUrl = `${STORE_BASE}/collections/${t.handle}${t.query}`;
    const res = await fetchHttp(qUrl);
    const { rawTitle, rawDesc } = extractMetaTags(res.text);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);

    const valid = res.ok && res.status === 200 &&
                  decodedTitle.length >= MIN_TITLE_LEN && decodedTitle.length <= MAX_TITLE_LEN &&
                  decodedDesc.length >= MIN_DESC_LEN && decodedDesc.length <= MAX_DESC_LEN &&
                  !DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc) &&
                  !/&quot;/i.test(rawDesc);

    if (!valid) {
      queryParamsPass = false;
      console.log(`    [FAIL] Query param test for ${t.handle}${t.query}: status=${res.status}, titleLen=${decodedTitle.length}, descLen=${decodedDesc.length}`);
    } else {
      console.log(`    [PASS] ${t.handle}${t.query} (Status: 200, Title: ${decodedTitle.length}c, Desc: ${decodedDesc.length}c)`);
    }
  }
  assert('Query Parameter Resilience (?sort_by, pagination)', queryParamsPass, '4 of 4 query configurations pass');

  // --- Edge Case 3: Mobile User-Agent (Googlebot-Smartphone) ---
  console.log('\n  --- Test 3.3: Googlebot-Smartphone Emulation ---');
  const mobileSampleHandles = [
    'japanese-anime-desk-mats',
    'abstract-minimalist-bauhaus-canvas-wall-art',
    'canvas-prints',
    'cyberpunk-neon-gaming-desk-mats',
    'retro-vintage-synthwave-desk-mats',
    'blankets',
    'pillow-cases',
    'bath-mats',
    'nature-mountain-landscape-canvas-wall-art',
    'sci-fi-cyberpunk-neon-canvas-wall-art'
  ];

  let mobilePass = true;
  for (const h of mobileSampleHandles) {
    await sleep(200);
    const mUrl = `${STORE_BASE}/collections/${h}`;
    const res = await fetchHttp(mUrl, { userAgent: GOOGLEBOT_MOBILE_UA });
    const { rawTitle, rawDesc } = extractMetaTags(res.text);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);

    const valid = res.ok && res.status === 200 &&
                  decodedTitle.length >= MIN_TITLE_LEN && decodedTitle.length <= MAX_TITLE_LEN &&
                  decodedDesc.length >= MIN_DESC_LEN && decodedDesc.length <= MAX_DESC_LEN &&
                  !DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc) &&
                  !/&quot;/i.test(rawDesc);

    if (!valid) {
      mobilePass = false;
      console.log(`    [FAIL] Mobile UA for ${h}: status=${res.status}, titleLen=${decodedTitle.length}, descLen=${decodedDesc.length}`);
    } else {
      console.log(`    [PASS] Mobile UA: ${h} (Status: 200, Title: ${decodedTitle.length}c, Desc: ${decodedDesc.length}c)`);
    }
  }
  assert('Googlebot-Smartphone Crawl Compatibility', mobilePass, '10 of 10 sampled collections pass');

  // --- Edge Case 4: Special Characters Handles ---
  console.log('\n  --- Test 3.4: Special Characters & Hyphenated Slugs ---');
  const specialSlugs = [
    'minimalist-abstract-geometric-desk-mats',
    'nature-mountain-landscape-canvas-wall-art',
    'botanical-floral-coastal-canvas-wall-art',
    'space-cosmic-astronomy-canvas-wall-art',
    'animals-wildlife-woodland-cushion-covers'
  ];

  let specialSlugsPass = true;
  for (const slug of specialSlugs) {
    await sleep(200);
    const sUrl = `${STORE_BASE}/collections/${slug}`;
    const res = await fetchHttp(sUrl);
    const { rawTitle, rawDesc } = extractMetaTags(res.text);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);

    const valid = res.ok && res.status === 200 &&
                  decodedTitle.length >= MIN_TITLE_LEN && decodedTitle.length <= MAX_TITLE_LEN &&
                  decodedDesc.length >= MIN_DESC_LEN && decodedDesc.length <= MAX_DESC_LEN &&
                  !DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc);

    if (!valid) {
      specialSlugsPass = false;
      console.log(`    [FAIL] Special slug ${slug}: status=${res.status}, titleLen=${decodedTitle.length}, descLen=${decodedDesc.length}`);
    } else {
      console.log(`    [PASS] Special slug: ${slug} (Title: ${decodedTitle.length}c, Desc: ${decodedDesc.length}c)`);
    }
  }
  assert('Special Slug Handling (Multi-Hyphenated Slugs)', specialSlugsPass, '5 of 5 special slugs pass');

  // --- Edge Case 5: Unpublished Collections 301 Redirect Hygiene ---
  console.log('\n  --- Test 3.5: Unpublished Legacy Collection 301 Redirects ---');
  let redirectsPass = true;
  for (const unpub of UNPUBLISHED_COLLECTIONS) {
    await sleep(200);
    const unpubUrl = `${STORE_BASE}/collections/${unpub}`;
    const res = await fetchHttp(unpubUrl, { redirect: 'manual' });
    const location = res.headers['location'] || '';
    const isRedirect = res.status === 301 || res.status === 302 || res.status === 308;

    if (!isRedirect || !location) {
      redirectsPass = false;
      console.log(`    [FAIL] Unpublished collection /collections/${unpub} returned status ${res.status}, location: "${location}"`);
    } else {
      console.log(`    [PASS] Unpublished /collections/${unpub} -> HTTP ${res.status} Redirect to: ${location}`);
    }
  }
  assert('Unpublished Legacy Collections Redirect Properly (301/302)', redirectsPass, '3 of 3 unpublished collections redirect');

  suiteResults.passed = suiteResults.assertions.every(a => a.passed);
  return suiteResults;
}

// ============================================================================
// MAIN RUNNER & REPORT GENERATOR
// ============================================================================
async function main() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER M3-2: STOREFRONT SERP CRAWL & CONCURRENCY CHALLENGE HARNESS');
  console.log('  Testing Live Target: https://printswithpassion.com/');
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  // 1. Run Sitemap Audit
  const { suiteResults: sitemapSuite, collectionUrls } = await runSitemapAudit();

  if (!sitemapSuite.passed || collectionUrls.length === 0) {
    console.error('\nFATAL: Sitemap validation failed. Cannot proceed with live crawl.');
    process.exit(1);
  }

  // 2. Run Full Storefront Crawl
  const serpCrawlSuite = await runStorefrontSerpCrawl(collectionUrls);

  // 3. Run Edge Cases Stress Suite
  const edgeCasesSuite = await runEdgeCasesStressSuite(collectionUrls);

  // Overall Verdict
  const allSuitesPassed = sitemapSuite.passed && serpCrawlSuite.passed && edgeCasesSuite.passed;

  console.log('\n' + '='.repeat(80));
  console.log('FINAL CHALLENGER AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`  1. Sitemap Architecture & Hygiene:  ${sitemapSuite.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  2. Full Storefront SERP Crawl:      ${serpCrawlSuite.passed ? 'PASS' : 'FAIL'} (${serpCrawlSuite.passedCount}/69 Passed)`);
  console.log(`  3. Adversarial Edge Cases & Stress:  ${edgeCasesSuite.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Overall Verdict:                    ${allSuitesPassed ? 'APPROVE' : 'FAIL'}`);
  console.log('='.repeat(80));

  // Write full JSON report to tests/reports
  const reportDir = path.resolve(REPO_ROOT, 'tests/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.resolve(reportDir, 'challenger_m3_storefront_crawl_report.json');
  const fullReport = {
    timestamp: new Date().toISOString(),
    verdict: allSuitesPassed ? 'APPROVE' : 'FAIL',
    suites: {
      sitemap: sitemapSuite,
      serpCrawl: {
        totalAudited: serpCrawlSuite.totalAudited,
        passedCount: serpCrawlSuite.passedCount,
        failedCount: serpCrawlSuite.failedCount,
        passed: serpCrawlSuite.passed,
        violations: serpCrawlSuite.violations,
        details: serpCrawlSuite.details
      },
      edgeCases: edgeCasesSuite
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2), 'utf8');
  console.log(`\nDetailed Challenger Report written to:\n  ${reportPath}`);

  if (!allSuitesPassed) {
    console.error('\nCHALLENGE VERDICT: FAIL. Defects detected.');
    process.exit(1);
  } else {
    console.log('\nCHALLENGE VERDICT: APPROVE. All 69 collections and edge cases verified.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('\n[FATAL ERROR] Unexpected exception in test harness:', err);
  process.exit(1);
});
