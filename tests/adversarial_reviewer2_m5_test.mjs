/**
 * Reviewer 2 & Adversarial Critic — Milestone 5 Stress Test Suite
 * Tests edge cases, boundary limits, and error conditions across all 4 upgraded scripts.
 */
import assert from 'assert';

import {
  buildPriorityInspectionPool,
  inspectUrl
} from '../gsc_ga4_gmc_cloud_sync.mjs';

import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../strikezone_ctr_and_competitor_rewriter.mjs';

import {
  UNESCAPED_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX,
  DANGLING_TITLE_REGEX,
  unescapeHtmlEntities,
  sanitizeDanglingTitle,
  sanitizeTemplateGrammar
} from '../catalog_uniqueness_and_seo_lint_gate.mjs';

import {
  validateCollectionCompliance
} from '../verify_40_subcollections_counts.mjs';

console.log('=== STARTING REVIEWER 2 ADVERSARIAL STRESS SUITE ===');

// ----------------------------------------------------
// SECTION 1: gsc_ga4_gmc_cloud_sync.mjs
// ----------------------------------------------------
console.log('\n--- 1. Testing buildPriorityInspectionPool ---');

// Edge cases: null, undefined, empty arrays
const emptyPool = buildPriorityInspectionPool([], []);
assert.ok(emptyPool.length >= 10, 'Pool contains at least 10 seed URLs even when inputs empty');
assert.ok(emptyPool.includes('https://printswithpassion.com/'), 'Homepage in seed pool');

// Malformed subcollections and known URLs
const dirtyPool = buildPriorityInspectionPool(
  [null, undefined, '', { noHandle: 123 }, { handle: 'clean-handle' }, 'string-handle', 'https://printswithpassion.com/already-full'],
  ['', '   ', '/relative-path', 'no-leading-slash', 'https://printswithpassion.com/with-entities?a=1&amp;b=2']
);
assert.ok(dirtyPool.includes('https://printswithpassion.com/collections/clean-handle'));
assert.ok(dirtyPool.includes('https://printswithpassion.com/collections/string-handle'));
assert.ok(dirtyPool.includes('https://printswithpassion.com/already-full'));
assert.ok(dirtyPool.includes('https://printswithpassion.com/relative-path'));
assert.ok(dirtyPool.includes('https://printswithpassion.com/no-leading-slash'));
assert.ok(dirtyPool.includes('https://printswithpassion.com/with-entities?a=1&b=2'));
assert.strictEqual(dirtyPool.length, new Set(dirtyPool).size, 'No duplicates in dirty pool');

// ----------------------------------------------------
// SECTION 2: strikezone_ctr_and_competitor_rewriter.mjs
// ----------------------------------------------------
console.log('\n--- 2. Testing fitTitleUnder60Chars & Intent Guard ---');

// 2.1 Boundary lengths
assert.strictEqual(fitTitleUnder60Chars('').length <= 60, true);
assert.strictEqual(fitTitleUnder60Chars(null).length <= 60, true);
assert.strictEqual(fitTitleUnder60Chars('   ').length <= 60, true);

const exactly60 = 'A'.repeat(60);
assert.strictEqual(fitTitleUnder60Chars(exactly60).length, 60);

const chars61 = 'Short prefix ' + 'B'.repeat(55);
const fitted61 = fitTitleUnder60Chars(chars61);
assert.ok(fitted61.length <= 60, `Expected <= 60, got ${fitted61.length}`);

// 2.2 Unmatched brackets & parenthesis balancing
const unclosedParenSingle = 'Art Prints (1.25" Pine Bars (CM & Inch)';
// Single unclosed bracket at end
const unclosedSquareSingle = 'Art Prints [1.25" Pine Bars';
const fittedSquareSingle = fitTitleUnder60Chars(unclosedSquareSingle);
assert.ok(fittedSquareSingle.length <= 60);
assert.strictEqual(fittedSquareSingle, 'Art Prints');
assert.strictEqual((fittedSquareSingle.match(/\[/g) || []).length, (fittedSquareSingle.match(/\]/g) || []).length);

// 2.3 Trailing conjunctions, prepositions & punctuation
const trailingJunk = 'Prints With Passion Desk Mats and or nor but for with in on at to by vs - | : ; ,';
const cleanedJunk = fitTitleUnder60Chars(trailingJunk);
assert.ok(cleanedJunk.length <= 60);
assert.strictEqual(cleanedJunk, 'Prints With Passion Desk Mats');

// 2.4 Single product queries vs collection category plural queries
assert.strictEqual(isSingleProductQuery('japanese wave desk mat'), true);
assert.strictEqual(isSingleProductQuery('minimalist canvas print'), true);
assert.strictEqual(isSingleProductQuery('velvet pillow case'), true);
assert.strictEqual(isSingleProductQuery('fleece throw blanket'), true);
assert.strictEqual(isSingleProductQuery('memory foam bath mat'), true);

assert.strictEqual(isSingleProductQuery('japanese wave desk mats'), false);
assert.strictEqual(isSingleProductQuery('canvas wall art'), false);
assert.strictEqual(isSingleProductQuery('velvet pillow cases'), false);
assert.strictEqual(isSingleProductQuery('throw blankets for bed'), false);
assert.strictEqual(isSingleProductQuery('bath mats uk'), false);

// 2.5 buildCompetitorSpecTitleAndMeta guard verification
const colEntry = {
  keyword: 'japanese wave desk mat',
  substrate: 'Desk Mats',
  targetUrl: '/collections/japanese-anime-desk-mats'
};
const colCtx = {
  handle: 'japanese-anime-desk-mats',
  title: 'Japanese Anime Extended Desk Mats'
};
const metaResult = buildCompetitorSpecTitleAndMeta(colEntry, colCtx.title, colCtx);
assert.ok(metaResult.newTitle.length <= 60, `newTitle length: ${metaResult.newTitle.length}`);
assert.ok(metaResult.newTitle.includes('Desk Mats'), 'Preserves plural category');
assert.ok(!metaResult.newTitle.includes('Japanese Wave Desk Mat |'), 'Does NOT overwrite collection with single-product title');
assert.ok(metaResult.newMeta.length <= 158, `newMeta length: ${metaResult.newMeta.length}`);

// ----------------------------------------------------
// SECTION 3: catalog_uniqueness_and_seo_lint_gate.mjs
// ----------------------------------------------------
console.log('\n--- 3. Testing unescapeHtmlEntities & Sanitizers ---');

// Multi-tier entity unescaping
const nestedEntity = '&amp;amp;quot;Bauhaus&amp;amp;quot; &amp;amp; Desk Mats';
assert.strictEqual(unescapeHtmlEntities(nestedEntity, false), '"Bauhaus" & Desk Mats');

// Dangling title sanitization
const danglingExamples = [
  'Japanese Anime Desk Mats |',
  'Canvas Wall Art -',
  'Desk Mats &',
  'UK Size Guide: Extended Mo',
  'Framed Canvas (CM & I',
  'Canvas Prints with '
];
for (const ex of danglingExamples) {
  const sanitized = sanitizeDanglingTitle(ex);
  assert.ok(sanitized.length <= 60);
  assert.ok(!DANGLING_TITLE_REGEX.test(sanitized), `Dangling regex matched: "${sanitized}"`);
}

// Template grammar sanitization
const templates = [
  'Transform with Canvas Wall Art (1.25" Pine Frame). Beautiful prints.',
  'Elevate with Cushion Covers for your couch. Soft velvet.',
  'Wear with Graphic T-Shirts. Archival fashion.',
  'Refresh with Memory Foam Bath Mats. Soft absorbent.',
  'Style with Plush Throw Blankets. Warm fleece.'
];
for (const t of templates) {
  const sanitized = sanitizeTemplateGrammar(t);
  assert.ok(!TEMPLATE_GRAMMAR_REGEX.test(sanitized), `Template regex matched: "${sanitized}"`);
  assert.ok(!sanitized.startsWith('Transform with'));
}

// ----------------------------------------------------
// SECTION 4: verify_40_subcollections_counts.mjs
// ----------------------------------------------------
console.log('\n--- 4. Testing validateCollectionCompliance ---');

// Test 0-product non-frontpage detection
const res1 = validateCollectionCompliance(
  [
    { handle: 'frontpage', title: 'Home', productsCount: { count: 0 } },
    { handle: 'dog-collars', title: 'Dog Collars', productsCount: { count: 0 } }
  ],
  null,
  []
);
assert.strictEqual(res1.emptyViolations.length, 1);
assert.strictEqual(res1.emptyViolations[0].handle, 'dog-collars');
assert.strictEqual(res1.passed, false);

// Test title > 60 chars
const res2 = validateCollectionCompliance(
  [
    { handle: 'too-long', title: 'A'.repeat(61), productsCount: { count: 5 }, seo: { title: 'A'.repeat(61), description: 'B'.repeat(145) } }
  ],
  null,
  []
);
assert.strictEqual(res2.titleLengthViolations.length, 1);
assert.strictEqual(res2.passed, false);

// Test avada-upsell-best-sellers in sitemap
const res3 = validateCollectionCompliance(
  [],
  new Set(['avada-upsell-best-sellers']),
  []
);
assert.strictEqual(res3.sitemapUnwantedCollections.length, 1);
assert.strictEqual(res3.passed, false);

console.log('\n=== ALL REVIEWER 2 ADVERSARIAL STRESS TESTS PASSED (100%) ===\n');
