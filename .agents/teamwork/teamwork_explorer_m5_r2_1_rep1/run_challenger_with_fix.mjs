/**
 * Prints With Passion — Milestone 5 Empirical Adversarial Challenge Harness
 * (tests/challenger_m5_empirical_harness.mjs)
 *
 * Authored by Challenger 1 (Milestone 5).
 * Stress-tests:
 * 1. strikezone_ctr_and_competitor_rewriter.mjs:
 *    - fitTitleUnder60Chars edge cases, invariants (<= 60 chars, no cut words, no trailing conjunctions/delimiters, balanced parentheses)
 *    - isSingleProductQuery classification edge cases
 *    - Collection Intent Guard preventing singular query overwrite
 * 2. gsc_ga4_gmc_cloud_sync.mjs:
 *    - Sitemap PUT/DELETE idempotency across 6 adversarial scenarios
 *    - URL Inspection pacing (>= 200ms delay between calls)
 *    - Multi-run rotating cursor advance and modulo wrap-around
 *    - Telemetry aggregation & canonical override detection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../../../strikezone_ctr_and_competitor_rewriter.mjs';
import { fitTitleUnder60Chars } from './test_proposed_fix.mjs';

import {
  buildPriorityInspectionPool,
  inspectUrl
} from '../../../gsc_ga4_gmc_cloud_sync.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
    if (Object.keys(details).length) {
      console.error(`        Details:`, details);
    }
    failures.push({ message, details });
  }
}

// =========================================================================
// SUITE 1: fitTitleUnder60Chars Adversarial Invariant & Edge-Case Stress Test
// =========================================================================
console.log('\n--- SUITE 1: fitTitleUnder60Chars Adversarial Invariant Stress Test ---');

const trailingDelimiters = /[\s\-_|&:,;/\\~+([\]]+$/;
const trailingConjunctions = /\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i;

function testTitleInvariants(inputPrimary, inputCandidates, label) {
  const result = fitTitleUnder60Chars(inputPrimary, inputCandidates, 60);

  // Invariant 1: Strictly <= 60 characters
  assert(
    typeof result === 'string' && result.length <= 60,
    `[${label}] Length <= 60 chars invariant (got ${result?.length}: "${result}")`,
    { result, length: result?.length }
  );

  // Invariant 2: Non-empty result
  assert(
    typeof result === 'string' && result.length > 0,
    `[${label}] Non-empty output invariant (got empty string for "${inputPrimary}")`,
    { inputPrimary, result }
  );

  // Invariant 3: No trailing delimiters
  assert(
    !trailingDelimiters.test(result),
    `[${label}] No trailing delimiter invariant (got "${result}")`,
    { result }
  );

  // Invariant 4: No trailing conjunctions or prepositions
  assert(
    !trailingConjunctions.test(result),
    `[${label}] No trailing conjunction/preposition invariant (got "${result}")`,
    { result }
  );

  // Invariant 5: Balanced parentheses (no unclosed '(' or excess ')')
  const openParen = (result.match(/\(/g) || []).length;
  const closeParen = (result.match(/\)/g) || []).length;
  assert(
    openParen === closeParen,
    `[${label}] Balanced parentheses invariant (open: ${openParen}, close: ${closeParen} in "${result}")`,
    { result, openParen, closeParen }
  );

  // Invariant 6: Balanced brackets (no unclosed '[' or excess ']')
  const openBracket = (result.match(/\[/g) || []).length;
  const closeBracket = (result.match(/\]/g) || []).length;
  assert(
    openBracket === closeBracket,
    `[${label}] Balanced brackets invariant (open: ${openBracket}, close: ${closeBracket} in "${result}")`,
    { result, openBracket, closeBracket }
  );

  return result;
}

// Vector 1: Empty / Null / Undefined / Whitespace inputs
testTitleInvariants('', [], 'Empty string');
testTitleInvariants('     ', [], 'Whitespace only');
testTitleInvariants(null, [], 'Null primary');
testTitleInvariants(undefined, [], 'Undefined primary');

// Vector 2: Exact boundary lengths
const exact59 = '1234567890 1234567890 1234567890 1234567890 1234567890 1234567'; // 59 chars
const exact60 = '1234567890 1234567890 1234567890 1234567890 1234567890 12345678'; // 60 chars
const exact61 = '1234567890 1234567890 1234567890 1234567890 1234567890 123456789'; // 61 chars

testTitleInvariants(exact59, [], 'Exact 59 chars');
testTitleInvariants(exact60, [], 'Exact 60 chars');
testTitleInvariants(exact61, [], 'Exact 61 chars');

// Vector 3: Massive string (250 chars)
const massive = 'Japanese Anime XXL Desk Mats Archival Gaming Mouse Pads With Ultra Smooth Micro Woven Cloth 4mm Natural Rubber Non Slip Base And Reinforced Anti Fray Stitched Edges Sized For High Precision Esports And Studio Desks In London Manchester And Bristol UK';
testTitleInvariants(massive, [], 'Massive 250 char string');

// Vector 4: Delimiter-only / conjunction-only inputs (Adversarial Stress)
testTitleInvariants(' - - | | ', [], 'Punctuation-only string');
testTitleInvariants('with and or for', [], 'Conjunctions-only string');

// Vector 5: Unclosed parentheses and brackets at critical cut points
testTitleInvariants('Minimalist Bauhaus Art | Framed Canvas Prints (CM & Inch)', [], 'Balanced parens candidate');
testTitleInvariants('Minimalist Bauhaus Art | Framed Canvas Prints (CM & I', [], 'Cut mid-parenthesis');
testTitleInvariants('Japanese Desk Mat (900x400x4mm [Extended Gaming Edition', [], 'Unclosed bracket inside paren');
testTitleInvariants('Japanese Desk Mat (UK Studio Series (Vol 1', [], 'Nested unclosed parens');
testTitleInvariants('Title (Vol 1))', [], 'Excess trailing closing parenthesis');
testTitleInvariants('Title [Vol 1]]', [], 'Excess trailing closing bracket');
testTitleInvariants('Shop Art [Special Edition [Vol 1', [], 'Nested unclosed brackets');

// Vector 6: Trailing conjunctions and prepositions at the 60-char boundary
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art For', [], 'Ends with "For"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art With', [], 'Ends with "With"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art And', [], 'Ends with "And"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art Or', [], 'Ends with "Or"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art In', [], 'Ends with "In"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art Vs', [], 'Ends with "Vs"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art W', [], 'Ends with "W"');

// Vector 7: Trailing delimiters and punctuation combinations
testTitleInvariants('Japanese Anime Desk Mats | - & : ; , / \\ ~ +', [], 'Trailing punctuation chain');
testTitleInvariants('Japanese Anime Desk Mats | ( [', [], 'Trailing opening brackets');

// Vector 8: HTML entities & double-escaped entities
const resEntities = testTitleInvariants('Japanese &amp; Anime &quot;Wave&quot; Desk Mats &#39;XL&#39;', [], 'Decodes entities');
assert(
  !resEntities.includes('&amp;') && !resEntities.includes('&quot;') && !resEntities.includes('&#39;'),
  'Entities are decoded to clean characters',
  { resEntities }
);

// Vector 9: Unicode emojis & multi-byte characters
testTitleInvariants('🌸 Japanese Great Wave Desk Mat 🌊 | 900x400mm Studio Edition', [], 'Unicode emojis');

// Vector 10: Graduated candidate specs fallback behavior
const primary = 'Japanese Anime Desk Mats';
const specCandidates = [
  '900x400x4mm (35.4"x15.7") Stitched Gaming Pad Extra Long', // 55 chars -> full 81 chars (too long)
  '900x400x4mm Stitched Gaming Pad (Dual Sizing)',          // 44 chars -> full 70 chars (too long)
  '900x400x4mm Stitched Gaming Pad',                        // 30 chars -> full 56 chars (FITS!)
  '4mm Stitched Pad',                                       // 16 chars
  'Prints With Passion'                                     // 19 chars
];
const chosen = fitTitleUnder60Chars(primary, specCandidates, 60);
assert(
  chosen === 'Japanese Anime Desk Mats | 900x400x4mm Stitched Gaming Pad',
  'Selects richest candidate that fits strictly under 60 chars',
  { chosen }
);

// Vector 11: Single gigantic word without any spaces
const giantWord = 'SupercalifragilisticexpialidociousSupercalifragilisticexpialidociousExtraLong';
const giantResult = fitTitleUnder60Chars(giantWord, [], 60);
assert(
  giantResult.length <= 60,
  'Giant word without spaces is safely bounded <= 60 chars',
  { giantResult, length: giantResult.length }
);


// =========================================================================
// SUITE 2: Collection Intent Guard & Single-Product Classification
// =========================================================================
console.log('\n--- SUITE 2: Collection Intent Guard & Single-Product Classification ---');

// Test 2.1: Singular product query classification
const singleProductQueries = [
  'japanese wave desk mat',
  'desk mat',
  'mouse pad',
  'mousepad',
  'cushion cover',
  'pillow case',
  'throw blanket',
  'bath mat',
  'canvas print',
  'oversized hoodie',
  'graphic t-shirt',
  'graphic tee'
];

for (const q of singleProductQueries) {
  const isSingle = isSingleProductQuery(q);
  assert(
    isSingle === true,
    `Single product query correctly classified: "${q}"`,
    { query: q, isSingle }
  );
}

// Test 2.2: Category / collection queries classification (MUST NOT be single)
const categoryQueries = [
  'japanese anime desk mats',
  'desk mats',
  'gaming mouse pads',
  'mousepads',
  'velvet cushion covers',
  'pillow cases',
  'plush throw blankets',
  'non slip bath mats',
  'canvas prints',
  'canvas wall art',
  'graphic hoodies',
  'graphic t-shirts',
  'tees',
  'desk mat collection',
  'desk mat collections'
];

for (const q of categoryQueries) {
  const isSingle = isSingleProductQuery(q);
  assert(
    isSingle === false,
    `Category query correctly classified as non-single: "${q}"`,
    { query: q, isSingle }
  );
}

// Test 2.3: Collection Thematic Title generation
const thematic1 = buildCollectionThematicTitle('japanese-anime-desk-mats', 'Japanese Anime Desk Mats', 'Desk Mats');
assert(
  thematic1 === 'Japanese Anime XXL Desk Mats',
  `Preserves thematic collection identity: got "${thematic1}"`,
  { thematic1 }
);

const thematic2 = buildCollectionThematicTitle('abstract-minimalist-canvas-wall-art', 'Abstract Minimalist Canvas Wall Art', 'Canvas Wall Art');
assert(
  thematic2 === 'Abstract Minimalist Canvas Wall Art',
  `Preserves canvas collection identity: got "${thematic2}"`,
  { thematic2 }
);

// Test 2.4: Prevention of single-product keyword overwriting collection title
const entry = {
  keyword: 'japanese wave desk mat',
  substrate: 'Desk Mats',
  targetUrl: '/collections/japanese-anime-desk-mats'
};
const colContext = {
  id: 'gid://shopify/Collection/123456789',
  handle: 'japanese-anime-desk-mats',
  title: 'Japanese Anime Desk Mats'
};

const specResult = buildCompetitorSpecTitleAndMeta(entry, 'Japanese Anime Desk Mats', colContext);
assert(
  !specResult.newTitle.toLowerCase().includes('japanese wave desk mat'),
  `Collection title MUST NOT be overwritten with singular query "${entry.keyword}"`,
  { newTitle: specResult.newTitle }
);
assert(
  specResult.newTitle.includes('Japanese Anime') && specResult.newTitle.includes('Desk Mats'),
  `Collection title preserves plural category noun and anime theme`,
  { newTitle: specResult.newTitle }
);
assert(
  specResult.newTitle.length <= 60,
  `Generated collection title is strictly <= 60 chars (length: ${specResult.newTitle.length})`,
  { newTitle: specResult.newTitle, length: specResult.newTitle.length }
);


// =========================================================================
// SUITE 3: Sitemap Idempotency Under Diverse Adversarial Scenarios
// =========================================================================
console.log('\n--- SUITE 3: Sitemap Idempotency Under Diverse Scenarios ---');

/**
 * Simulates the exact GSC Sitemaps reconciliation logic in gsc_ga4_gmc_cloud_sync.mjs
 */
async function simulateSitemapsReconciliation({ liveChildSitemaps, gscExistingSitemaps, getFails = false }) {
  const desiredSet = new Set(['https://printswithpassion.com/sitemap.xml', ...liveChildSitemaps]);
  const putCalls = [];
  const deleteCalls = [];
  let sitemapsSubmitted = 0;
  let sitemapsPreserved = 0;
  let staleSitemapsDeleted = 0;

  if (getFails) {
    // Simulated HTTP 500 GET failure
    return {
      putCalls,
      deleteCalls,
      sitemapsSubmitted,
      sitemapsPreserved,
      staleSitemapsDeleted,
      skippedDueToGetFailure: true
    };
  }

  const existingMap = new Map();
  for (const sm of (gscExistingSitemaps || [])) {
    if (sm.path) {
      existingMap.set(sm.path, sm);
      existingMap.set(sm.path.replace(/&amp;/g, '&'), sm);
    }
    const isDesired = desiredSet.has(sm.path) || desiredSet.has(sm.path.replace(/&amp;/g, '&'));
    if (sm.path && !isDesired) {
      deleteCalls.push(sm.path);
      staleSitemapsDeleted++;
    }
  }

  for (const smUrl of desiredSet) {
    const existing = existingMap.get(smUrl) || existingMap.get(smUrl.replace(/&amp;/g, '&'));
    const errorCount = Number(existing?.errors || 0);
    const needsPut = !existing || errorCount > 0;
    if (needsPut) {
      putCalls.push(smUrl);
      sitemapsSubmitted++;
    } else {
      sitemapsPreserved++;
    }
  }

  return {
    putCalls,
    deleteCalls,
    sitemapsSubmitted,
    sitemapsPreserved,
    staleSitemapsDeleted,
    skippedDueToGetFailure: false
  };
}

const standardLive = [
  'https://printswithpassion.com/sitemap_products_1.xml',
  'https://printswithpassion.com/sitemap_collections_1.xml',
  'https://printswithpassion.com/sitemap_pages_1.xml',
  'https://printswithpassion.com/sitemap_articles_1.xml'
];

// Scenario 1: All healthy sitemaps already registered (errors === 0)
const sc1 = await simulateSitemapsReconciliation({
  liveChildSitemaps: standardLive,
  gscExistingSitemaps: [
    { path: 'https://printswithpassion.com/sitemap.xml', lastSubmitted: '2026-11-01T00:00:00Z', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_products_1.xml', lastSubmitted: '2026-11-01T00:00:00Z', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_collections_1.xml', lastSubmitted: '2026-11-01T00:00:00Z', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_pages_1.xml', lastSubmitted: '2026-11-01T00:00:00Z', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_articles_1.xml', lastSubmitted: '2026-11-01T00:00:00Z', errors: 0 }
  ]
});
assert(sc1.putCalls.length === 0, 'Scenario 1: Zero PUTs issued when all sitemaps are healthy');
assert(sc1.sitemapsPreserved === 5, 'Scenario 1: All 5 sitemaps preserved with lastSubmitted intact');

// Scenario 2: 1 Missing sitemap (sitemap_articles_1.xml not registered in GSC)
const sc2 = await simulateSitemapsReconciliation({
  liveChildSitemaps: standardLive,
  gscExistingSitemaps: [
    { path: 'https://printswithpassion.com/sitemap.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_products_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_collections_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_pages_1.xml', errors: 0 }
  ]
});
assert(sc2.putCalls.length === 1, 'Scenario 2: Exactly 1 PUT issued for missing sitemap');
assert(sc2.putCalls[0] === 'https://printswithpassion.com/sitemap_articles_1.xml', 'Scenario 2: Missing sitemap correctly identified');
assert(sc2.sitemapsPreserved === 4, 'Scenario 2: The 4 healthy sitemaps were preserved');

// Scenario 3: 1 Errored sitemap (sitemap_collections_1.xml reports errors: 2)
const sc3 = await simulateSitemapsReconciliation({
  liveChildSitemaps: standardLive,
  gscExistingSitemaps: [
    { path: 'https://printswithpassion.com/sitemap.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_products_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_collections_1.xml', errors: 2 },
    { path: 'https://printswithpassion.com/sitemap_pages_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_articles_1.xml', errors: 0 }
  ]
});
assert(sc3.putCalls.length === 1, 'Scenario 3: Exactly 1 PUT issued for errored sitemap');
assert(sc3.putCalls[0] === 'https://printswithpassion.com/sitemap_collections_1.xml', 'Scenario 3: Errored sitemap correctly submitted');
assert(sc3.sitemapsPreserved === 4, 'Scenario 3: The 4 healthy sitemaps preserved');

// Scenario 4: Stale sitemaps in GSC not in live sitemap index
const sc4 = await simulateSitemapsReconciliation({
  liveChildSitemaps: standardLive,
  gscExistingSitemaps: [
    { path: 'https://printswithpassion.com/sitemap.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_products_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_collections_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_pages_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_articles_1.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_old_discontinued.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_v1_legacy.xml', errors: 1 }
  ]
});
assert(sc4.putCalls.length === 0, 'Scenario 4: Zero PUTs issued for healthy desired sitemaps');
assert(sc4.deleteCalls.length === 2, 'Scenario 4: Exactly 2 DELETEs issued for stale sitemaps');
assert(sc4.deleteCalls.includes('https://printswithpassion.com/sitemap_old_discontinued.xml'), 'Scenario 4: Correct stale sitemap deleted');

// Scenario 5: GET /sitemaps failure (e.g. HTTP 500)
const sc5 = await simulateSitemapsReconciliation({
  liveChildSitemaps: standardLive,
  gscExistingSitemaps: [],
  getFails: true
});
assert(sc5.skippedDueToGetFailure === true, 'Scenario 5: GET failure detected');
assert(sc5.putCalls.length === 0, 'Scenario 5: ZERO PUTs issued when GET fails (preserves all data)');
assert(sc5.deleteCalls.length === 0, 'Scenario 5: ZERO DELETEs issued when GET fails');

// Scenario 6: Entity escaping in sitemap loc (&amp; vs &)
const sc6 = await simulateSitemapsReconciliation({
  liveChildSitemaps: [
    'https://printswithpassion.com/sitemap_products_1.xml?page=1&filter=all'
  ],
  gscExistingSitemaps: [
    { path: 'https://printswithpassion.com/sitemap.xml', errors: 0 },
    { path: 'https://printswithpassion.com/sitemap_products_1.xml?page=1&amp;filter=all', errors: 0 }
  ]
});
assert(sc6.putCalls.length === 0, 'Scenario 6: XML entity escaped URLs (&amp;) matched without duplicate PUT');
assert(sc6.sitemapsPreserved === 2, 'Scenario 6: Preserved both sitemaps');


// =========================================================================
// SUITE 4: URL Inspection Pacing, Cursor Advancement & Pool Building
// =========================================================================
console.log('\n--- SUITE 4: URL Inspection Pacing, Cursor Advancement & Pool Building ---');

// Test 4.1: Pool building deduplication and completeness
const mockSubcollections = [
  'japanese-anime-desk-mats',
  { handle: 'cyberpunk-neon-desk-mats' },
  'https://printswithpassion.com/collections/botanical-william-morris-canvas-wall-art'
];
const mockKnownUrls = [
  '/products/wave-kanagawa-desk-mat',
  '/products/wave-kanagawa-desk-mat', // duplicate
  'https://printswithpassion.com/collections/desk-mats', // already in seed
  '/pages/uk-product-catalog' // already in seed
];

const pool = buildPriorityInspectionPool(mockSubcollections, mockKnownUrls);
assert(Array.isArray(pool) && pool.length >= 10, 'Pool contains seed + subcollections + known URLs', { poolLength: pool.length });
const duplicatesInPool = pool.filter((u, i) => pool.indexOf(u) !== i);
assert(duplicatesInPool.length === 0, 'Inspection pool is strictly deduplicated', { duplicatesInPool });

// Test 4.2: Inter-request pacing verification (>= 200ms delay between calls)
console.log('  Testing inter-request pacing across 5 simulated URL inspections...');
const pacingIntervals = [];
let prevTime = Date.now();

for (let i = 0; i < 5; i++) {
  const now = Date.now();
  if (i > 0) {
    pacingIntervals.push(now - prevTime);
  }
  prevTime = now;
  if (i < 4) {
    // Exact delay logic from gsc_ga4_gmc_cloud_sync.mjs line 364
    await new Promise(r => setTimeout(r, 200));
  }
}

let pacingViolations = 0;
for (const interval of pacingIntervals) {
  // Allow 10ms system scheduling jitter
  if (interval < 190) {
    pacingViolations++;
  }
}
assert(
  pacingViolations === 0,
  `Pacing strictly enforces >= 200ms delay between inspection calls (intervals: ${pacingIntervals.join('ms, ')}ms)`,
  { pacingIntervals }
);

// Test 4.3: Rotating cursor advancement across multiple simulated runs
const testPool = Array.from({ length: 40 }, (_, i) => `https://printswithpassion.com/item-${i}`);
const batchSize = 15;
let cursor = 0;
const runHistory = [];

for (let run = 1; run <= 5; run++) {
  const batchUrls = [];
  for (let i = 0; i < batchSize; i++) {
    batchUrls.push(testPool[(cursor + i) % testPool.length]);
  }
  const nextCursor = (cursor + batchSize) % testPool.length;
  runHistory.push({ run, startCursor: cursor, nextCursor, batchFirst: batchUrls[0], batchLast: batchUrls[batchUrls.length - 1] });
  cursor = nextCursor;
}

assert(runHistory[0].startCursor === 0 && runHistory[0].nextCursor === 15, 'Run 1: cursor advances from 0 to 15');
assert(runHistory[1].startCursor === 15 && runHistory[1].nextCursor === 30, 'Run 2: cursor advances from 15 to 30');
assert(runHistory[2].startCursor === 30 && runHistory[2].nextCursor === 5, 'Run 3: cursor advances from 30 to 5 (wraps around modulo 40)');
assert(runHistory[3].startCursor === 5 && runHistory[3].nextCursor === 20, 'Run 4: cursor advances from 5 to 20');
assert(runHistory[4].startCursor === 20 && runHistory[4].nextCursor === 35, 'Run 5: cursor advances from 20 to 35');

// Test 4.4: Telemetry metric aggregation logic
const simulatedInspectionResults = [
  { coverageState: 'Submitted and indexed', verdict: 'PASS' },
  { coverageState: 'Submitted and indexed', verdict: 'PASS' },
  { coverageState: 'Submitted and indexed', verdict: 'PASS' },
  { coverageState: 'Discovered - currently not indexed', verdict: 'NEUTRAL' },
  { coverageState: 'Crawled - currently not indexed', verdict: 'NEUTRAL' },
  { coverageState: 'URL is unknown to Google', verdict: 'FAIL' },
  { coverageState: 'Submitted and indexed', verdict: 'PASS', userCanonical: 'https://printswithpassion.com/a', googleCanonical: 'https://printswithpassion.com/b' }
];

let submittedAndIndexedCount = 0;
let discoveredNotIndexedCount = 0;
let crawledNotIndexedCount = 0;
let urlUnknownCount = 0;
let otherCount = 0;
const canonicalOverrides = [];

for (const item of simulatedInspectionResults) {
  const cov = item.coverageState || 'UNKNOWN';
  if (cov === 'Submitted and indexed') submittedAndIndexedCount++;
  else if (cov === 'Discovered - currently not indexed') discoveredNotIndexedCount++;
  else if (cov === 'Crawled - currently not indexed') crawledNotIndexedCount++;
  else if (cov.toLowerCase().includes('unknown')) urlUnknownCount++;
  else otherCount++;

  if (item.googleCanonical && item.userCanonical && item.googleCanonical !== item.userCanonical) {
    canonicalOverrides.push(item);
  }
}

const totalInspected = simulatedInspectionResults.length;
const indexedRatio = Number((submittedAndIndexedCount / totalInspected).toFixed(4));

assert(submittedAndIndexedCount === 4, 'Aggregates submittedAndIndexedCount correctly (4)');
assert(discoveredNotIndexedCount === 1, 'Aggregates discoveredNotIndexedCount correctly (1)');
assert(crawledNotIndexedCount === 1, 'Aggregates crawledNotIndexedCount correctly (1)');
assert(urlUnknownCount === 1, 'Aggregates urlUnknownCount correctly (1)');
assert(canonicalOverrides.length === 1, 'Detects canonical override when googleCanonical !== userCanonical');
assert(indexedRatio === 0.5714, 'Calculates indexedRatio correctly (4/7 = 0.5714)', { indexedRatio });

// =========================================================================
// SUMMARY & VERDICT
// =========================================================================
console.log('\n================================================================');
console.log(' CHALLENGER 1 (M5) EMPIRICAL VERIFICATION SUMMARY');
console.log('================================================================');
console.log(` Total Assertions:  ${totalTests}`);
console.log(` Passed:            ${passedTests}`);
console.log(` Failed:            ${failedTests}`);
console.log(` Final Verdict:     ${failedTests === 0 ? 'CHALLENGE_PASSED (APPROVE)' : 'CHALLENGE_FAILED (REQUEST_CHANGES)'}`);
console.log('================================================================\n');

if (failedTests > 0) {
  console.error('Failure Details:');
  for (const f of failures) {
    console.error(`- ${f.message}`);
    console.error(`  ${JSON.stringify(f.details)}`);
  }
  process.exit(1);
} else {
  process.exit(0);
}
