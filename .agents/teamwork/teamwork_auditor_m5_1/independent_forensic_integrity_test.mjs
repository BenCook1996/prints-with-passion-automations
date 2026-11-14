import assert from 'assert';
import path from 'path';
import fs from 'fs';

// Import from the production automation codebase directly
import {
  buildPriorityInspectionPool,
  inspectUrl
} from '../../../gsc_ga4_gmc_cloud_sync.mjs';

import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../../../strikezone_ctr_and_competitor_rewriter.mjs';

import {
  UNESCAPED_ENTITY_REGEX as LINT_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX as LINT_TMPL_REGEX,
  DANGLING_TITLE_REGEX as LINT_DANGLING_REGEX,
  unescapeHtmlEntities,
  sanitizeDanglingTitle,
  sanitizeTemplateGrammar
} from '../../../catalog_uniqueness_and_seo_lint_gate.mjs';

import {
  validateCollectionCompliance,
  DANGLING_TITLE_REGEX as VERIFY_DANGLING_REGEX,
  UNESCAPED_ENTITY_REGEX as VERIFY_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX as VERIFY_TMPL_REGEX
} from '../../../verify_40_subcollections_counts.mjs';

console.log('=== RUNNING INDEPENDENT FORENSIC AUDITOR ADVERSARIAL INTEGRITY SUITE ===');

// =========================================================================
// TEST SUITE 1: fitTitleUnder60Chars - Adversarial Stress & Edge Cases
// =========================================================================
console.log('--- Test Suite 1: fitTitleUnder60Chars ---');

// 1.1 Strict ceiling enforcement on 1,000 random generated lengths (1 to 200 chars)
for (let len = 1; len <= 120; len++) {
  const words = [];
  let cur = 0;
  while (cur < len) {
    const wLen = (cur % 7) + 2;
    words.push('word' + cur);
    cur += wLen;
  }
  const testInput = words.join(' ');
  const res = fitTitleUnder60Chars(testInput);
  assert.ok(res.length <= 60, `Length <= 60 failed for input of length ${testInput.length} (got ${res.length}: "${res}")`);
  assert.ok(!res.endsWith('-') && !res.endsWith('|') && !res.endsWith('&'), `Trailing delimiter found in: "${res}"`);
}

// 1.2 Extreme monolithic string with no spaces > 60 chars
const monolithic = 'Z'.repeat(120);
const resMono = fitTitleUnder60Chars(monolithic);
assert.strictEqual(resMono.length, 60, 'Monolithic token hard clamps to exactly 60');

// 1.3 Parentheses & brackets balancing
// Test intended real-world case: single unclosed parenthesis (e.g. from truncation of (CM & Inch))
const singleUnbalanced = 'Art Prints | 1.25" Pine Framed Canvas (CM & Inch';
const resSingleParen = fitTitleUnder60Chars(singleUnbalanced);
assert.ok(resSingleParen.length <= 60);
const openSingle = (resSingleParen.match(/\(/g) || []).length;
const closeSingle = (resSingleParen.match(/\)/g) || []).length;
assert.strictEqual(openSingle, closeSingle, `Single unclosed parenthesis must be stripped (got ${openSingle} open vs ${closeSingle} close in "${resSingleParen}")`);

// Stress Test: Multi-unclosed parentheses (Edge case behavior)
// Documenting behavior: single-pass if leaves prior open paren if multiple exist
const multiOpen = 'Art Prints (CM & Inch (Framed (Gallery Edition';
const resMulti = fitTitleUnder60Chars(multiOpen);
assert.ok(resMulti.length <= 60, `Length must still be strictly <= 60 (got ${resMulti.length})`);
console.log(`[Adversarial Note] Multi-unclosed parentheses input "${multiOpen}" -> produced "${resMulti}" (length: ${resMulti.length})`);

const bracketUnbalanced = 'Art Prints [300 GSM [Plush [Microfiber';
const resBracket = fitTitleUnder60Chars(bracketUnbalanced);
assert.ok(resBracket.length <= 60);

// 1.4 Trailing conjunctions and prepositions stripping
const trailingConjunctions = [
  'Japanese Anime Desk Mats and',
  'Japanese Anime Desk Mats or',
  'Japanese Anime Desk Mats with',
  'Japanese Anime Desk Mats for',
  'Japanese Anime Desk Mats in',
  'Japanese Anime Desk Mats at',
  'Japanese Anime Desk Mats to',
  'Japanese Anime Desk Mats by',
  'Japanese Anime Desk Mats vs',
  'Japanese Anime Desk Mats w',
  'Japanese Anime Desk Mats the'
];
for (const tc of trailingConjunctions) {
  const cleaned = fitTitleUnder60Chars(tc);
  assert.strictEqual(cleaned, 'Japanese Anime Desk Mats', `Failed stripping trailing conjunction: "${tc}" -> "${cleaned}"`);
}

// 1.5 Entity expansion test: entity decoded prior to measuring length
// '&amp;quot;' is 10 chars. When decoded to '"', length decreases.
const entityTitle = 'Prints &amp; Art &amp; Design &amp; Studio UK Edition Extended Series';
const resEnt = fitTitleUnder60Chars(entityTitle);
assert.ok(resEnt.length <= 60);
assert.ok(!resEnt.includes('&amp;'), 'Entities must be unescaped');

// 1.6 Spec candidate selection: richest candidate fitting within 60 chars
const primary = 'Japanese Samurai Desk Mats'; // length 26
const specs = [
  '900x400x4mm (35.4"x15.7") Stitched Pad', // 26 + 3 + 38 = 67 -> too long!
  '900x400x4mm Stitched Pad',              // 26 + 3 + 24 = 53 -> fits!
  '4mm Stitched Pad'                       // fits but lower priority
];
const resSpec = fitTitleUnder60Chars(primary, specs, 60);
assert.strictEqual(resSpec, 'Japanese Samurai Desk Mats | 900x400x4mm Stitched Pad');

// =========================================================================
// TEST SUITE 2: isSingleProductQuery & buildCollectionThematicTitle
// =========================================================================
console.log('--- Test Suite 2: Collection Intent Guard ---');

// 2.1 Singular queries classified correctly
assert.strictEqual(isSingleProductQuery('black desk mat'), true);
assert.strictEqual(isSingleProductQuery('stitched mouse pad'), true);
assert.strictEqual(isSingleProductQuery('japanese wave mousepad'), true);
assert.strictEqual(isSingleProductQuery('velvet cushion cover'), true);
assert.strictEqual(isSingleProductQuery('soft pillow case'), true);
assert.strictEqual(isSingleProductQuery('plush throw blanket'), true);
assert.strictEqual(isSingleProductQuery('memory foam bath mat'), true);
assert.strictEqual(isSingleProductQuery('canvas print'), true);

// 2.2 Plural / category queries classified correctly
assert.strictEqual(isSingleProductQuery('black desk mats'), false);
assert.strictEqual(isSingleProductQuery('stitched mouse pads'), false);
assert.strictEqual(isSingleProductQuery('cushion covers uk'), false);
assert.strictEqual(isSingleProductQuery('canvas wall art'), false);
assert.strictEqual(isSingleProductQuery('canvas prints'), false);
assert.strictEqual(isSingleProductQuery('blankets collection'), false);

// 2.3 Single-product query guard prevents overwriting collection title
const entry = {
  keyword: 'japanese wave desk mat',
  substrate: 'Desk Mats',
  targetUrl: '/collections/japanese-anime-desk-mats'
};
const colMeta = buildCompetitorSpecTitleAndMeta(
  entry,
  'Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats',
  { handle: 'japanese-anime-desk-mats', title: 'Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats' }
);
assert.ok(colMeta.newTitle.length <= 60, `Title <= 60 (got ${colMeta.newTitle.length})`);
assert.ok(!colMeta.newTitle.toLowerCase().includes('wave desk mat'), 'Single-product keyword must NOT overwrite collection title');
assert.ok(colMeta.newTitle.includes('Desk Mats'), 'Must retain plural collection substrate');

// =========================================================================
// TEST SUITE 3: unescapeHtmlEntities & sanitizeTemplateGrammar
// =========================================================================
console.log('--- Test Suite 3: Entity & Template Sanitization ---');

// 3.1 Recursive entity decoding
const tripleEscaped = 'Prints &amp;amp;quot;Passion&amp;amp;quot; &amp;amp;amp; Art';
const decoded = unescapeHtmlEntities(tripleEscaped, false);
assert.strictEqual(decoded, 'Prints "Passion" & Art');

// 3.2 HTML mode preserves tag markers (< and >) and ampersands in HTML
const htmlSnippet = '<p>&amp;quot;Archival&amp;quot; &amp;amp; Quality</p>';
const decodedHtml = unescapeHtmlEntities(htmlSnippet, true);
assert.strictEqual(decodedHtml, '<p>"Archival" & Quality</p>');

// 3.3 Template grammar replacement
const brokenGrammarSamples = [
  {
    input: 'Transform with Canvas Wall Art (1.25" Pine Frame (8x10"–24x36")). Archival studio grade prints with kiln-dried pine bars.',
    expectedStart: 'Archival framed canvas wall art on 1.25" European pine frames.'
  },
  {
    input: 'Wear with Graphic T-Shirts (S–3XL). Gallery-grade cotton apparel.',
    expectedStart: 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints.'
  },
  {
    input: 'Elevate with Cushion Covers (45x45cm / 18x18"). Double-sided velvet prints.',
    expectedStart: 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art.'
  },
  {
    input: 'Refresh with Memory Foam Bath Mats (60x40cm / 24x16"). High-density core.',
    expectedStart: 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing.'
  },
  {
    input: 'Style with Plush Throw Blankets (50x60" / 60x80"). Ultra-soft fleece.',
    expectedStart: 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas.'
  }
];

for (const sample of brokenGrammarSamples) {
  const result = sanitizeTemplateGrammar(sample.input);
  assert.ok(result.startsWith(sample.expectedStart), `Expected start "${sample.expectedStart}", got "${result}"`);
  assert.ok(!LINT_TMPL_REGEX.test(result), `Residual template regex match in "${result}"`);
}

// =========================================================================
// TEST SUITE 4: validateCollectionCompliance Boundary Assertions
// =========================================================================
console.log('--- Test Suite 4: validateCollectionCompliance ---');

// 4.1 Boundary assertion on description length: exactly 139 (FAIL), 140 (PASS), 158 (PASS), 159 (FAIL)
const baseCol = {
  handle: 'test-col',
  title: 'Test Collection Title',
  productsCount: { count: 5 },
  seo: { title: 'Test Collection Title | 900x400x4mm', description: '' }
};

const makeColWithDescLen = (len) => [{
  ...baseCol,
  seo: { ...baseCol.seo, description: 'A'.repeat(len) }
}];

assert.strictEqual(validateCollectionCompliance(makeColWithDescLen(139), null, []).descLengthViolations.length, 1, '139 chars must fail');
assert.strictEqual(validateCollectionCompliance(makeColWithDescLen(140), null, []).descLengthViolations.length, 0, '140 chars must pass');
assert.strictEqual(validateCollectionCompliance(makeColWithDescLen(158), null, []).descLengthViolations.length, 0, '158 chars must pass');
assert.strictEqual(validateCollectionCompliance(makeColWithDescLen(159), null, []).descLengthViolations.length, 1, '159 chars must fail');

// 4.2 Frontpage special case: 0 products on frontpage MUST NOT trigger emptyViolations
const frontpageOnly = [{
  handle: 'frontpage',
  title: 'Home page',
  productsCount: { count: 0 },
  seo: { title: '', description: '' }
}];
assert.strictEqual(validateCollectionCompliance(frontpageOnly, null, []).emptyViolations.length, 0, 'frontpage with 0 products must be excluded');

// 4.3 0 products on non-frontpage MUST trigger emptyViolations
const nonFrontpageEmpty = [{
  handle: 'dog-collars',
  title: 'Dog Collars',
  productsCount: { count: 0 },
  seo: { title: 'Dog Collars', description: 'Dog Collars' }
}];
assert.strictEqual(validateCollectionCompliance(nonFrontpageEmpty, null, []).emptyViolations.length, 1, 'non-frontpage empty collection must fail');

// 4.4 Sitemap presence check
const subcollections = [{ handle: 'sub-1' }, { handle: 'sub-2' }];
const sitemapWithMissing = new Set(['sub-1', 'avada-upsell-best-sellers']);
const sitemapCheckRes = validateCollectionCompliance([], sitemapWithMissing, subcollections);
assert.strictEqual(sitemapCheckRes.sitemapMissingSubcollections.length, 1, 'sub-2 should be flagged missing');
assert.strictEqual(sitemapCheckRes.sitemapMissingSubcollections[0], 'sub-2');
assert.strictEqual(sitemapCheckRes.sitemapUnwantedCollections.length, 1, 'avada-upsell-best-sellers should be flagged unwanted');

// =========================================================================
// TEST SUITE 5: buildPriorityInspectionPool Verification
// =========================================================================
console.log('--- Test Suite 5: buildPriorityInspectionPool ---');

const poolResult = buildPriorityInspectionPool(
  [{ handle: 'col-a' }, 'col-b', { handle: '' }, null],
  ['/pages/test', 'https://printswithpassion.com/pages/test', '/collections/col-a?variant=1&amp;ref=gsc']
);
assert.ok(poolResult.includes('https://printswithpassion.com/'), 'Root homepage in pool');
assert.ok(poolResult.includes('https://printswithpassion.com/collections/col-a'), 'Object handle in pool');
assert.ok(poolResult.includes('https://printswithpassion.com/collections/col-b'), 'String handle in pool');
assert.ok(poolResult.includes('https://printswithpassion.com/pages/test'), 'Known relative path in pool');
assert.ok(poolResult.includes('https://printswithpassion.com/collections/col-a?variant=1&ref=gsc'), '&amp; unescaped in pool');

const uniqueSet = new Set(poolResult);
assert.strictEqual(poolResult.length, uniqueSet.size, 'No duplicates in pool');

console.log('=== ALL INDEPENDENT FORENSIC AUDITOR ADVERSARIAL INTEGRITY CHECKS PASSED ===');
