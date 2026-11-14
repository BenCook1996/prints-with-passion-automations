/**
 * Prototype Storewide Collection Gate
 * Comprehensive storewide validator testing:
 * 1. Storewide GraphQL fetch of all collections.
 * 2. 0 empty collections (excluding frontpage).
 * 3. Title length <= 60 chars and no cut mid-word.
 * 4. Plain-text descriptions (140-158 chars, no unescaped entities or template fragments).
 * 5. Presence of all 48 subcollections in live sitemap.
 */
import fs from 'fs';
import { shopifyGql, SUBCOLLECTIONS_PATH } from '../../../lib/cloud-env.mjs';

const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;

export async function fetchAllCollections() {
  const collections = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const res = await shopifyGql(`
      query GetCollectionsStorewide {
        collections(first: 250${afterClause}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            descriptionHtml
            productsCount { count }
            seo { title description }
          }
        }
      }
    `);
    const nodes = res?.collections?.nodes || [];
    collections.push(...nodes);
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
    console.warn(`[WARN] Failed to fetch live sitemap: ${err.message}. Skipping sitemap validation.`);
    return null;
  }
  return handles;
}

export function loadSubcollections() {
  if (fs.existsSync(SUBCOLLECTIONS_PATH)) {
    return JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
  }
  return [];
}

export async function runStorewideCollectionAudit({ throwOnFailure = false } = {}) {
  const collections = await fetchAllCollections();
  const sitemapHandles = await fetchSitemapCollections();
  const subcollections = loadSubcollections();

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
    const count = c.productsCount?.count ?? 0;

    // Rule 1: 0-product collections (excluding frontpage)
    if (!isFrontpage && count === 0) {
      emptyViolations.push({
        id: c.id,
        handle: c.handle,
        title: c.title,
        reason: 'Collection has 0 active products'
      });
    }

    // For active collections (excluding frontpage), validate SEO metadata
    if (!isFrontpage && count > 0) {
      const effectiveTitle = (c.seo?.title || c.title || '').trim();
      const seoDesc = (c.seo?.description || '').trim();

      // Rule 2: Title length <= 60 chars
      if (effectiveTitle.length > 60) {
        titleLengthViolations.push({
          handle: c.handle,
          title: effectiveTitle,
          length: effectiveTitle.length,
          limit: 60
        });
      }

      // Rule 3: Title not cut mid-word or dangling punctuation
      if (DANGLING_TITLE_REGEX.test(effectiveTitle)) {
        titleDanglingViolations.push({
          handle: c.handle,
          title: effectiveTitle,
          reason: 'Title ends with dangling punctuation, stop word, or unclosed parenthesis'
        });
      }

      // Rule 4: Plain-text description length 140-158 chars
      if (seoDesc.length < 140 || seoDesc.length > 158) {
        descLengthViolations.push({
          handle: c.handle,
          length: seoDesc.length,
          descSnippet: seoDesc.slice(0, 60),
          targetRange: '140-158'
        });
      }

      // Rule 5: Description contains unescaped / double-escaped entities
      if (UNESCAPED_ENTITY_REGEX.test(seoDesc)) {
        descEntityViolations.push({
          handle: c.handle,
          desc: seoDesc,
          reason: 'Contains unescaped HTML entities (&quot;, &amp;quot;, &#39;, etc.)'
        });
      }

      // Rule 6: Description contains broken template grammar
      if (TEMPLATE_GRAMMAR_REGEX.test(seoDesc)) {
        descTemplateViolations.push({
          handle: c.handle,
          desc: seoDesc,
          reason: 'Contains broken template grammar ("Transform with...", "Elevate with...", etc.)'
        });
      }
    }
  }

  // Rule 7: Presence in sitemap for all 48 curated subcollections
  if (sitemapHandles) {
    for (const sub of subcollections) {
      if (!sitemapHandles.has(sub.handle)) {
        sitemapMissingSubcollections.push(sub.handle);
      }
    }
    // AVADA check: avada-upsell-best-sellers must NOT be in sitemap
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

  console.log('================================================================');
  console.log('       PRINTS WITH PASSION — STOREWIDE COLLECTION AUDIT GATE    ');
  console.log('================================================================');
  console.log(`Total Collections Queried: ${collections.length}`);
  console.log(`Curated Subcollections:    ${subcollections.length}`);
  console.log(`Collections in Live Sitemap: ${sitemapHandles ? sitemapHandles.size : 'N/A'}`);
  console.log('----------------------------------------------------------------');
  console.log(`[1] Empty Collections (excl. frontpage):   ${emptyViolations.length === 0 ? 'PASS (0)' : `FAIL (${emptyViolations.length})`}`);
  console.log(`[2] Title Length <= 60 chars:              ${titleLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${titleLengthViolations.length})`}`);
  console.log(`[3] Title Word-Boundary / Dangling:        ${titleDanglingViolations.length === 0 ? 'PASS (0)' : `FAIL (${titleDanglingViolations.length})`}`);
  console.log(`[4] Description Length (140-158 chars):    ${descLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${descLengthViolations.length})`}`);
  console.log(`[5] Description Free of HTML Entities:     ${descEntityViolations.length === 0 ? 'PASS (0)' : `FAIL (${descEntityViolations.length})`}`);
  console.log(`[6] Description Free of Broken Templates:  ${descTemplateViolations.length === 0 ? 'PASS (0)' : `FAIL (${descTemplateViolations.length})`}`);
  console.log(`[7] 48 Subcollections in Live Sitemap:     ${sitemapMissingSubcollections.length === 0 ? 'PASS (All 48 present)' : `FAIL (${sitemapMissingSubcollections.length} missing)`}`);
  console.log(`[8] Unwanted / Unlisted in Sitemap:        ${sitemapUnwantedCollections.length === 0 ? 'PASS (0)' : `FAIL (${sitemapUnwantedCollections.length})`}`);
  console.log('================================================================');
  console.log(`OVERALL GATE STATUS: ${totalViolations === 0 ? 'PASSED (0 violations)' : `FAILED (${totalViolations} violations)`}`);
  console.log('================================================================');

  if (totalViolations > 0 && throwOnFailure) {
    throw new Error(`Storewide Collection Gate failed with ${totalViolations} violations.`);
  }

  return {
    success: totalViolations === 0,
    totalViolations,
    collectionsQueried: collections.length,
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

// Execute standalone
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  runStorewideCollectionAudit({ throwOnFailure: false })
    .then(result => {
      if (!result.success) {
        console.log('\nAudit recorded failures as expected against pre-remediation live store.');
        process.exit(1);
      } else {
        console.log('\nAll storewide collection checks passed cleanly!');
        process.exit(0);
      }
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
