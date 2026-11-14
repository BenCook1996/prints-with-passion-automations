/**
 * Challenger M3-1: Independent Empirical Stress Oracle & Invariant Verifier
 * File: tests/challenger_m3_stress_oracle.mjs
 *
 * Adversarially challenges live collection SEO metadata directly against:
 * 1. Shopify Admin GraphQL API (2025-01) - Source of Truth
 * 2. Production Storefront (https://printswithpassion.com) - Rendered Reality
 *
 * Strict Invariants Tested:
 * - Boundaries: title <= 60 chars (and >= 25 chars), description in [140, 158] chars
 * - Uniqueness: Exactly 0 duplicate titles and 0 duplicate descriptions across the catalog
 * - Entity Purity:
 *     * In Admin API: zero literal double quotes ("), zero '&quot;', zero '&amp;quot;', zero raw '&amp;', zero unescaped '<' or '>'
 *     * On Storefront: zero '&amp;quot;', zero '&amp;amp;', zero literal double quotes in meta description
 * - Commercial Intent & Category Semantics:
 *     * /collections/japanese-anime-desk-mats: Category-level desk mats (plural), not single-product title or model dimensions
 *     * Zero single-product model dimensions (e.g. 900x400x4mm, 35.4"x15.7", 1.25" Pine Frame) in collection titles
 * - Clean & Untruncated:
 *     * /collections/abstract-minimalist-bauhaus-canvas-wall-art: Clean title with zero '(CM & I' truncation
 *     * No dangling endings (- , | & ( etc.)
 *     * Descriptions must have terminal punctuation (. ! ?)
 *     * Zero template clichés ('Transform with...', 'Elevate with...', etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL, SHOP_DOMAIN, REPO_ROOT } from '../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_BASE = 'https://printswithpassion.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const TITLE_MIN_LEN = 25;
const TITLE_MAX_LEN = 60;
const DESC_MIN_LEN = 140;
const DESC_MAX_LEN = 158;
const STOREFRONT_PACING_MS = 350;

const TEMPLATE_CLICHE_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const SINGLE_PRODUCT_SPEC_IN_TITLE_REGEX = /\b(?:\d+x\d+x\d+mm|\d+\.?\d*["'”]\s*x\s*\d+\.?\d*["'”]|1\.25["'”]\s*Pine)\b/i;
const TERMINAL_PUNCTUATION_REGEX = /[.!?]$/;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GraphQL Query to fetch all collections with SEO fields
const GET_ALL_COLLECTIONS_QUERY = `
  query ChallengerGetAllCollections($cursor: String) {
    collections(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        productsCount {
          count
        }
        seo {
          title
          description
        }
        updatedAt
      }
    }
  }
`;

async function fetchLiveAdminCollections() {
  const allNodes = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await shopifyGraphQL(GET_ALL_COLLECTIONS_QUERY, { cursor });
    if (!res || !res.collections) {
      throw new Error('Challenger failed to retrieve collections from Shopify Admin GraphQL API');
    }
    allNodes.push(...(res.collections.nodes || []));
    hasNextPage = res.collections.pageInfo?.hasNextPage || false;
    cursor = res.collections.pageInfo?.endCursor || null;
  }

  return allNodes;
}

async function fetchStorefrontWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      });
      const text = await res.text();
      // If Cloudflare 429 rate limit or challenge, retry after backoff
      if (res.status === 429 || text.includes('Verifying your connection')) {
        if (attempt < maxRetries) {
          const backoff = attempt * 1500;
          await sleep(backoff);
          continue;
        }
      }
      return { status: res.status, text, finalUrl: res.url };
    } catch (err) {
      if (attempt < maxRetries) {
        await sleep(attempt * 1000);
        continue;
      }
      throw err;
    }
  }
}

function extractStorefrontMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';

  let rawDesc = '';
  const m1 = html.match(/<meta\b[^>]*?\bname=["']description["'][^>]*?\bcontent=(["'])(.*?)\1/i);
  if (m1) {
    rawDesc = m1[2].trim();
  } else {
    const m2 = html.match(/<meta\b[^>]*?\bcontent=(["'])(.*?)\1[^>]*?\bname=["']description["']/i);
    if (m2) {
      rawDesc = m2[2].trim();
    }
  }

  return { rawTitle, rawDesc };
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

async function main() {
  console.log('='.repeat(80));
  console.log('  CHALLENGER M3-1: INDEPENDENT EMPIRICAL STRESS ORACLE');
  console.log('  Adversarial Testing of Live Collection SEO Metadata');
  console.log(`  Shopify Admin API: ${SHOP_DOMAIN} (2025-01)`);
  console.log(`  Target Storefront: ${STORE_BASE}`);
  console.log('='.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    adminSummary: {
      totalCollections: 0,
      activeCollectionsAudited: 0,
      passedCollections: 0,
      failedCollections: 0,
      violations: []
    },
    uniquenessSummary: {
      titleCollisions: [],
      descCollisions: []
    },
    specificCollectionChecks: {},
    storefrontSummary: {
      totalAudited: 0,
      passedCount: 0,
      failedCount: 0,
      violations: []
    },
    redirectSummary: {
      audited: 0,
      passed: 0,
      failed: 0,
      issues: []
    },
    overallVerdict: 'PENDING'
  };

  // ==========================================================================
  // PART 1: Direct Shopify Admin GraphQL API Query & Invariant Stress Test
  // ==========================================================================
  console.log('\n[Phase 1] Querying Shopify Admin GraphQL API for ALL Collections...');
  const adminCollections = await fetchLiveAdminCollections();
  results.adminSummary.totalCollections = adminCollections.length;
  console.log(`  Retrieved ${adminCollections.length} total collections from Admin API.`);

  // Active collections in catalog: productsCount > 0 OR curated active handle
  const activeCollections = adminCollections.filter(c => {
    const pCount = c.productsCount?.count ?? 0;
    return pCount > 0 || ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel'].includes(c.handle);
  });

  results.adminSummary.activeCollectionsAudited = activeCollections.length;
  console.log(`  Identified ${activeCollections.length} active catalog collections for deep invariant testing.`);

  // Maps for global catalog uniqueness testing
  const titleToCollections = new Map();
  const descToCollections = new Map();

  for (const c of activeCollections) {
    const handle = c.handle;
    const gId = c.id;
    const title = (c.seo?.title || '').trim();
    const desc = (c.seo?.description || '').trim();
    const colViolations = [];

    // --- Boundary Tests ---
    if (!title) {
      colViolations.push({ rule: 'TITLE_MISSING', message: 'Custom seo.title is null or empty' });
    } else {
      if (title.length > TITLE_MAX_LEN) {
        colViolations.push({
          rule: 'TITLE_LENGTH_EXCEEDED',
          message: `Title length ${title.length} > ${TITLE_MAX_LEN} chars: "${title}"`
        });
      }
      if (title.length < TITLE_MIN_LEN) {
        colViolations.push({
          rule: 'TITLE_TOO_SHORT',
          message: `Title length ${title.length} < ${TITLE_MIN_LEN} chars: "${title}"`
        });
      }
    }

    if (!desc) {
      colViolations.push({ rule: 'DESC_MISSING', message: 'Custom seo.description is null or empty' });
    } else {
      if (desc.length > DESC_MAX_LEN) {
        colViolations.push({
          rule: 'DESC_LENGTH_EXCEEDED',
          message: `Description length ${desc.length} > ${DESC_MAX_LEN} chars: "${desc}"`
        });
      }
      if (desc.length < DESC_MIN_LEN) {
        colViolations.push({
          rule: 'DESC_LENGTH_SUBCEEDED',
          message: `Description length ${desc.length} < ${DESC_MIN_LEN} chars: "${desc}"`
        });
      }
    }

    // --- Entity Purity Tests in Admin Data ---
    // Strictly zero literal double quotes (") in description
    if (/"/.test(desc)) {
      colViolations.push({
        rule: 'DESC_LITERAL_DOUBLE_QUOTE',
        message: `Description contains forbidden literal double quote ("): "${desc}"`
      });
    }

    // Zero &quot; or &amp;quot; in title or description
    if (/&quot;/i.test(title)) {
      colViolations.push({ rule: 'TITLE_HTML_QUOT_ENTITY', message: `Title contains &quot;: "${title}"` });
    }
    if (/&quot;/i.test(desc)) {
      colViolations.push({ rule: 'DESC_HTML_QUOT_ENTITY', message: `Description contains &quot;: "${desc}"` });
    }

    // Zero &amp; in Admin DB (Admin DB stores plain string; &amp; indicates double-escaped encoding in DB)
    if (/&amp;/i.test(title)) {
      colViolations.push({ rule: 'TITLE_RAW_AMP_ENTITY', message: `Title contains literal &amp; entity: "${title}"` });
    }
    if (/&amp;/i.test(desc)) {
      colViolations.push({ rule: 'DESC_RAW_AMP_ENTITY', message: `Description contains literal &amp; entity: "${desc}"` });
    }

    // Zero HTML tags
    if (/[<>]/.test(title) || /[<>]/.test(desc)) {
      colViolations.push({ rule: 'HTML_TAG_DETECTED', message: 'HTML tag < or > detected in SEO fields' });
    }

    // Zero escaped apostrophes
    if (/&(?:apos|#39);/i.test(title) || /&(?:apos|#39);/i.test(desc)) {
      colViolations.push({ rule: 'ESCAPED_APOS_ENTITY', message: 'Apostrophe entity artifact detected' });
    }

    // --- Cleanliness & Truncation Tests ---
    if (DANGLING_TITLE_REGEX.test(title)) {
      colViolations.push({ rule: 'DANGLING_TITLE_ENDING', message: `Title ends with dangling token: "${title}"` });
    }

    if (!TERMINAL_PUNCTUATION_REGEX.test(desc)) {
      colViolations.push({
        rule: 'DESC_MISSING_TERMINAL_PUNCTUATION',
        message: `Description does not end with terminal punctuation: "${desc.slice(-15)}"`
      });
    }

    // Zero robotic template clichés
    if (TEMPLATE_CLICHE_REGEX.test(title) || TEMPLATE_CLICHE_REGEX.test(desc)) {
      colViolations.push({ rule: 'TEMPLATE_CLICHE_DETECTED', message: 'Robotic template cliché phrase detected' });
    }

    // Commercial Intent: Check for single-product model dimension specs
    if (SINGLE_PRODUCT_SPEC_IN_TITLE_REGEX.test(title)) {
      colViolations.push({
        rule: 'SINGLE_PRODUCT_SPEC_IN_TITLE',
        message: `Collection title contains single-product model spec: "${title}"`
      });
    }

    // Track for uniqueness
    if (title) {
      if (!titleToCollections.has(title)) titleToCollections.set(title, []);
      titleToCollections.get(title).push(handle);
    }
    if (desc) {
      if (!descToCollections.has(desc)) descToCollections.set(desc, []);
      descToCollections.get(desc).push(handle);
    }

    // --- Specific Flagged Collections Checks ---
    if (handle === 'japanese-anime-desk-mats') {
      const isPluralCategory = /(?:Desk Mats|Mouse Pads)/i.test(title) && !/Japanese Wave Desk Mat/i.test(title);
      const isDeskMatDesc = /desk mat/i.test(desc);
      const noSingleProductModel = !/900x400/i.test(title) && !/35\.4/i.test(title);
      const isCompliant = isPluralCategory && isDeskMatDesc && noSingleProductModel && colViolations.length === 0;

      results.specificCollectionChecks.japaneseAnimeDeskMats = {
        handle,
        title,
        titleLength: title.length,
        description: desc,
        descLength: desc.length,
        isPluralCategory,
        isDeskMatDesc,
        noSingleProductModel,
        pass: isCompliant
      };
      if (!isCompliant) {
        colViolations.push({
          rule: 'JAPANESE_ANIME_INTENT_VIOLATION',
          message: `japanese-anime-desk-mats failed category-level commercial intent invariant: "${title}"`
        });
      }
    }

    if (handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
      const hasTruncation = /\(CM & I/i.test(title) || /\(CM/i.test(title);
      const isCompliant = !hasTruncation && colViolations.length === 0;

      results.specificCollectionChecks.abstractBauhausWallArt = {
        handle,
        title,
        titleLength: title.length,
        description: desc,
        descLength: desc.length,
        hasTruncation,
        pass: isCompliant
      };
      if (!isCompliant) {
        colViolations.push({
          rule: 'ABSTRACT_BAUHAUS_TRUNCATED',
          message: `abstract-minimalist-bauhaus-canvas-wall-art title contains truncation artifact: "${title}"`
        });
      }
    }

    if (colViolations.length === 0) {
      results.adminSummary.passedCollections++;
    } else {
      results.adminSummary.failedCollections++;
      results.adminSummary.violations.push({
        handle,
        id: gId,
        title,
        desc,
        violations: colViolations
      });
    }
  }

  // Check Uniqueness
  for (const [titleStr, handles] of titleToCollections.entries()) {
    if (handles.length > 1) {
      results.uniquenessSummary.titleCollisions.push({ title: titleStr, handles });
    }
  }
  for (const [descStr, handles] of descToCollections.entries()) {
    if (handles.length > 1) {
      results.uniquenessSummary.descCollisions.push({ description: descStr, handles });
    }
  }

  console.log(`  Admin Collections Audited: ${results.adminSummary.activeCollectionsAudited}`);
  console.log(`  Passed Invariants:         ${results.adminSummary.passedCollections}`);
  console.log(`  Failed Invariants:         ${results.adminSummary.failedCollections}`);
  console.log(`  Title Collisions:          ${results.uniquenessSummary.titleCollisions.length}`);
  console.log(`  Description Collisions:    ${results.uniquenessSummary.descCollisions.length}`);

  // ==========================================================================
  // PART 2: Live Storefront HTML Extraction & SERP Integrity Challenge
  // ==========================================================================
  console.log('\n[Phase 2] Probing Live Production Storefront HTML for Active Collections...');

  // Fetch collections sitemap to get live storefront URLs
  const sitemapIndexResp = await fetchStorefrontWithRetry(`${STORE_BASE}/sitemap.xml`);
  const locMatches = [...sitemapIndexResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const colSitemapUrl = locMatches.find(u => u.includes('sitemap_collections'));

  if (!colSitemapUrl) {
    throw new Error('Challenger failed to find sitemap_collections in sitemap.xml');
  }

  const colSitemapResp = await fetchStorefrontWithRetry(colSitemapUrl);
  const liveUrls = [...colSitemapResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  results.storefrontSummary.totalAudited = liveUrls.length;
  console.log(`  Discovered ${liveUrls.length} active collection URLs in live sitemap.`);

  for (let i = 0; i < liveUrls.length; i++) {
    const url = liveUrls[i];
    const handle = url.split('/collections/')[1];
    await sleep(STOREFRONT_PACING_MS);

    const resp = await fetchStorefrontWithRetry(url);
    const { rawTitle, rawDesc } = extractStorefrontMeta(resp.text);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);
    const sfViolations = [];

    // HTTP 200
    if (resp.status !== 200) {
      sfViolations.push(`HTTP status returned ${resp.status}`);
    }

    // Title checks
    if (!rawTitle) {
      sfViolations.push('Missing <title> tag');
    } else {
      if (/&amp;quot;/i.test(rawTitle)) sfViolations.push(`Raw title contains &amp;quot;: "${rawTitle}"`);
      if (/&amp;amp;/i.test(rawTitle)) sfViolations.push(`Raw title contains &amp;amp;: "${rawTitle}"`);
      if (decodedTitle.length > TITLE_MAX_LEN) sfViolations.push(`Decoded title length ${decodedTitle.length} > ${TITLE_MAX_LEN}`);
      if (decodedTitle.length < TITLE_MIN_LEN) sfViolations.push(`Decoded title length ${decodedTitle.length} < ${TITLE_MIN_LEN}`);
      if (DANGLING_TITLE_REGEX.test(decodedTitle)) sfViolations.push(`Title has dangling ending: "${decodedTitle}"`);
    }

    // Meta Description checks
    if (!rawDesc) {
      sfViolations.push('Missing <meta name="description"> tag');
    } else {
      // Strictly ZERO &amp;quot;
      if (/&amp;quot;/i.test(rawDesc)) {
        sfViolations.push(`STOREFRONT DEFECT: &amp;quot; rendered in meta description: "${rawDesc}"`);
      }
      if (/&amp;amp;/i.test(rawDesc)) {
        sfViolations.push(`STOREFRONT DEFECT: &amp;amp; rendered in meta description: "${rawDesc}"`);
      }
      if (/[<>]/.test(rawDesc)) {
        sfViolations.push(`STOREFRONT DEFECT: HTML tags in meta description: "${rawDesc}"`);
      }
      // Zero literal double quotes
      if (/"/.test(decodedDesc)) {
        sfViolations.push(`STOREFRONT DEFECT: Literal quote (") in meta description: "${decodedDesc}"`);
      }
      // Length boundary [140, 158]
      if (decodedDesc.length < DESC_MIN_LEN || decodedDesc.length > DESC_MAX_LEN) {
        sfViolations.push(`STOREFRONT DEFECT: Description length ${decodedDesc.length} out of [${DESC_MIN_LEN}, ${DESC_MAX_LEN}]: "${decodedDesc}"`);
      }
      if (!TERMINAL_PUNCTUATION_REGEX.test(decodedDesc)) {
        sfViolations.push(`STOREFRONT DEFECT: Missing terminal punctuation: "${decodedDesc.slice(-15)}"`);
      }
    }

    if (sfViolations.length === 0) {
      results.storefrontSummary.passedCount++;
    } else {
      results.storefrontSummary.failedCount++;
      results.storefrontSummary.violations.push({
        handle,
        url,
        violations: sfViolations,
        rawTitle,
        rawDesc,
        decodedTitle,
        decodedDesc
      });
    }
  }

  console.log(`  Storefront Collections Audited: ${results.storefrontSummary.totalAudited}`);
  console.log(`  Passed Storefront Checks:       ${results.storefrontSummary.passedCount}`);
  console.log(`  Failed Storefront Checks:       ${results.storefrontSummary.failedCount}`);

  // ==========================================================================
  // PART 3: Legacy Unpublished Collections Redirect Hygiene
  // ==========================================================================
  console.log('\n[Phase 3] Auditing Unpublished Legacy Redirects...');
  const redirectHandles = ['wall-art', 'stationary-office', 'plush-blankets'];
  results.redirectSummary.audited = redirectHandles.length;

  for (const rHandle of redirectHandles) {
    const rUrl = `${STORE_BASE}/collections/${rHandle}`;
    await sleep(STOREFRONT_PACING_MS);
    const rResp = await fetchStorefrontWithRetry(rUrl);
    if (rResp.finalUrl === rUrl && rResp.status === 200) {
      const msg = `Unpublished collection ${rHandle} did NOT redirect (HTTP 200 at ${rUrl})`;
      results.redirectSummary.failed++;
      results.redirectSummary.issues.push(msg);
      console.error(`  [FAIL] ${msg}`);
    } else {
      results.redirectSummary.passed++;
      console.log(`  [PASS] /collections/${rHandle} redirects to ${rResp.finalUrl} (HTTP ${rResp.status})`);
    }
  }

  // ==========================================================================
  // PART 4: Final Evaluation & Verdict Determination
  // ==========================================================================
  const totalFailures = results.adminSummary.failedCollections +
    results.uniquenessSummary.titleCollisions.length +
    results.uniquenessSummary.descCollisions.length +
    results.storefrontSummary.failedCount +
    results.redirectSummary.failed;

  const isJapaneseAnimeCompliant = results.specificCollectionChecks.japaneseAnimeDeskMats?.pass === true;
  const isAbstractBauhausCompliant = results.specificCollectionChecks.abstractBauhausWallArt?.pass === true;

  const allSpecificPassed = isJapaneseAnimeCompliant && isAbstractBauhausCompliant;

  if (totalFailures === 0 && allSpecificPassed) {
    results.overallVerdict = 'APPROVE';
  } else {
    results.overallVerdict = 'FAIL';
  }

  console.log('\n' + '='.repeat(80));
  console.log(`  FINAL VERDICT: ${results.overallVerdict}`);
  console.log(`  Total Invariant Violations: ${totalFailures}`);
  console.log(`  Japanese Anime Desk Mats Compliant: ${isJapaneseAnimeCompliant ? 'YES' : 'NO'}`);
  console.log(`  Bauhaus Canvas Wall Art Compliant:  ${isAbstractBauhausCompliant ? 'YES' : 'NO'}`);
  console.log('='.repeat(80));

  // Write results JSON file
  const reportPath = path.resolve(REPO_ROOT, 'challenger_m3_stress_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nDetailed stress test report written to: ${reportPath}`);

  if (results.overallVerdict === 'APPROVE') {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n[FATAL ERROR in Challenger Oracle]:', err);
  process.exit(1);
});
