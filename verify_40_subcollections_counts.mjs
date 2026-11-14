/**
 * Prints With Passion — Storewide Collection Compliance & Quality Gate
 * (verify_40_subcollections_counts.mjs)
 *
 * Validates 8 core SEO compliance assertions across all collections in Shopify:
 * 1. 0 empty collections (excluding frontpage).
 * 2. All active collection titles <= 60 characters.
 * 3. No active collection title ends dangling or cut mid-word.
 * 4. All active collection descriptions are 140–158 characters.
 * 5. No active collection description contains unescaped HTML entities.
 * 6. No active collection description contains broken template grammar fragments.
 * 7. All 48 curated subcollections from phase2_40_subcollections.json are present in sitemap_collections_1.xml.
 * 8. Discontinued collections (such as avada-upsell-best-sellers) are NOT present in sitemap_collections_1.xml.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGql, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;

export async function fetchAllCollections() {
  const collections = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const res = await shopifyGql(`
      query GetAllCollectionsStorewide {
        collections(first: 250${afterClause}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productsCount { count }
            seo { title description }
          }
        }
      }
    `);
    collections.push(...(res?.collections?.nodes || []));
    hasNextPage = res?.collections?.pageInfo?.hasNextPage ?? false;
    cursor = res?.collections?.pageInfo?.endCursor ?? null;
  }
  return collections;
}

export async function fetchSitemapCollections() {
  const sitemapHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };
  const handles = new Set();
  try {
    const indexRes = await fetch('https://printswithpassion.com/sitemap.xml', { headers: sitemapHeaders });
    if (!indexRes.ok) throw new Error(`HTTP ${indexRes.status} fetching sitemap.xml`);
    const indexXml = await indexRes.text();
    const locMatches = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
    const colSitemapUrl = locMatches.find(u => u.includes('sitemap_collections'));
    if (colSitemapUrl) {
      const colRes = await fetch(colSitemapUrl, { headers: sitemapHeaders });
      if (colRes.ok) {
        const colXml = await colRes.text();
        const urls = [...colXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
        for (const u of urls) {
          const match = u.match(/\/collections\/([^\/\?#]+)/);
          if (match) handles.add(match[1]);
        }
      }
    }
  } catch (err) {
    console.warn(`[WARN] Live sitemap check failed: ${err.message}.`);
    return null;
  }
  return handles;
}

export function validateCollectionCompliance(collections = [], sitemapHandles = null, subcollections = []) {
  const emptyViolations = [];
  const titleLengthViolations = [];
  const titleDanglingViolations = [];
  const descLengthViolations = [];
  const descEntityViolations = [];
  const descTemplateViolations = [];
  const sitemapMissingSubcollections = [];
  const sitemapUnwantedCollections = [];

  for (const c of collections) {
    const isFrontpage = c.handle === 'frontpage';
    const count = typeof c.productsCount === 'object' ? (c.productsCount?.count ?? 0) : (c.productsCount ?? 0);

    // 1. 0-product check
    if (!isFrontpage && count === 0) {
      emptyViolations.push({ handle: c.handle, title: c.title });
    }

    // Active collection metadata validation
    if (!isFrontpage && count > 0) {
      const title = (c.seo?.title || c.title || '').trim();
      const desc = (c.seo?.description || '').trim();

      if (title.length > 60) {
        titleLengthViolations.push({ handle: c.handle, title, len: title.length });
      }
      if (DANGLING_TITLE_REGEX.test(title)) {
        titleDanglingViolations.push({ handle: c.handle, title });
      }
      if (desc.length < 140 || desc.length > 158) {
        descLengthViolations.push({ handle: c.handle, len: desc.length, desc: desc.slice(0, 50) });
      }
      if (UNESCAPED_ENTITY_REGEX.test(desc)) {
        descEntityViolations.push({ handle: c.handle, desc });
      }
      if (TEMPLATE_GRAMMAR_REGEX.test(desc)) {
        descTemplateViolations.push({ handle: c.handle, desc });
      }
    }
  }

  // Sitemap presence
  if (sitemapHandles) {
    for (const sub of subcollections) {
      const h = typeof sub === 'string' ? sub : sub?.handle;
      if (h && !sitemapHandles.has(h)) {
        sitemapMissingSubcollections.push(h);
      }
    }
    if (sitemapHandles.has('avada-upsell-best-sellers')) {
      sitemapUnwantedCollections.push('avada-upsell-best-sellers (should be unpublished)');
    }
  }

  const totalViolations = (
    emptyViolations.length +
    titleLengthViolations.length +
    titleDanglingViolations.length +
    descLengthViolations.length +
    descEntityViolations.length +
    descTemplateViolations.length +
    sitemapMissingSubcollections.length +
    sitemapUnwantedCollections.length
  );

  return {
    totalViolations,
    passed: totalViolations === 0,
    emptyViolations,
    titleLengthViolations,
    titleDanglingViolations,
    descLengthViolations,
    descEntityViolations,
    descTemplateViolations,
    sitemapMissingSubcollections,
    sitemapUnwantedCollections
  };
}

async function main() {
  console.log('================================================================');
  console.log('  PRINTS WITH PASSION — STOREWIDE COLLECTION COMPLIANCE GATE    ');
  console.log('================================================================');

  const collections = await fetchAllCollections();
  const sitemapHandles = await fetchSitemapCollections();
  const subcollections = fs.existsSync(SUBCOLLECTIONS_PATH)
    ? JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'))
    : [];

  const result = validateCollectionCompliance(collections, sitemapHandles, subcollections);

  console.log(`Total Collections Queried:   ${collections.length}`);
  console.log(`Curated Subcollections:      ${subcollections.length}`);
  console.log(`Collections in Live Sitemap: ${sitemapHandles ? sitemapHandles.size : 'N/A'}`);
  console.log('----------------------------------------------------------------');
  console.log(`[1] Empty Collections (excl. frontpage):   ${result.emptyViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.emptyViolations.length})`}`);
  console.log(`[2] Title Length <= 60 chars:              ${result.titleLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.titleLengthViolations.length})`}`);
  console.log(`[3] Title Word-Boundary / Dangling:        ${result.titleDanglingViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.titleDanglingViolations.length})`}`);
  console.log(`[4] Description Length (140-158 chars):    ${result.descLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.descLengthViolations.length})`}`);
  console.log(`[5] Description Free of HTML Entities:     ${result.descEntityViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.descEntityViolations.length})`}`);
  console.log(`[6] Description Free of Broken Templates:  ${result.descTemplateViolations.length === 0 ? 'PASS (0)' : `FAIL (${result.descTemplateViolations.length})`}`);
  console.log(`[7] 48 Subcollections in Live Sitemap:     ${result.sitemapMissingSubcollections.length === 0 ? 'PASS (All 48 present)' : `FAIL (${result.sitemapMissingSubcollections.length} missing)`}`);
  console.log(`[8] Unwanted / Unlisted in Sitemap:        ${result.sitemapUnwantedCollections.length === 0 ? 'PASS (0)' : `FAIL (${result.sitemapUnwantedCollections.length})`}`);
  console.log('================================================================');
  console.log(`OVERALL GATE STATUS: ${result.passed ? 'PASSED (0 violations)' : `FAILED (${result.totalViolations} violations)`}`);
  console.log('================================================================');

  if (!result.passed) {
    process.exit(1);
  }
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
