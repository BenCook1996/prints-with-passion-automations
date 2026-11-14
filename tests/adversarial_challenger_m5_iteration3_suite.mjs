/**
 * Prints With Passion — Milestone 5 Iteration 3 Challenger Empirical Adversarial Suite
 * (tests/adversarial_challenger_m5_iteration3_suite.mjs)
 *
 * Authored by Empirical Challenger (Milestone 5 Iteration 3).
 * Exhaustively stress-tests:
 * 1. Preservation of valid bracket tags ([UK Edition], [Desk Mats], etc.)
 * 2. Preservation of substantive text when titles start with unclosed delimiters
 * 3. Step 2 fallback truthiness guard (never returns empty string)
 * 4. Empty parentheticals and bracket variations ((), [], (  ), [  ], ([ ]), [( )])
 * 5. Punctuation-only and delimiter-only strings
 * 6. Edge cases with nested delimiters, excess closing delimiters, and mixed delimiters
 * 7. Long words without spaces exceeding 60 characters
 * 8. Trailing conjunctions, prepositions, and stop-words
 * 9. Template grammar sanitizer decimal preservation (1.25" pine bars)
 * 10. Collection intent guard vs singular query overwrites
 */

import assert from 'assert';
import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../strikezone_ctr_and_competitor_rewriter.mjs';

import {
  sanitizeTemplateGrammar,
  sanitizeDanglingTitle,
  unescapeHtmlEntities
} from '../catalog_uniqueness_and_seo_lint_gate.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message });
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

console.log('================================================================');
console.log('  CHALLENGER ITERATION 3: EMPIRICAL ADVERSARIAL STRESS SUITE     ');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// SUITE 1: Valid Bracket Tag Preservation
// ----------------------------------------------------------------------------
console.log('--- SUITE 1: Valid Bracket Tag Preservation ---');

check('Preserves single bracketed tag at end of title', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats [UK Edition]', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats [UK Edition]');
  assert(res.length <= 60);
});

check('Preserves single bracketed tag at start of title', () => {
  const res = fitTitleUnder60Chars('[UK Edition] Japanese Anime Desk Mats', [], 60);
  assert.strictEqual(res, '[UK Edition] Japanese Anime Desk Mats');
  assert(res.length <= 60);
});

check('Preserves completely bracketed title', () => {
  const res = fitTitleUnder60Chars('[Desk Mats]', [], 60);
  assert.strictEqual(res, '[Desk Mats]');
  assert(res.length <= 60);
});

check('Preserves double bracketed tags if within 60 chars', () => {
  const res = fitTitleUnder60Chars('Anime Desk Mats [UK Edition] [Studio Series]', [], 60);
  assert.strictEqual(res, 'Anime Desk Mats [UK Edition] [Studio Series]');
  assert(res.length <= 60);
});

check('Preserves valid parentheses tag alongside bracket tag', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats (XXL) [UK Edition]', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats (XXL) [UK Edition]');
  assert(res.length <= 60);
});

// ----------------------------------------------------------------------------
// SUITE 2: Substantive Text Preservation on Leading / Unclosed Delimiters
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 2: Substantive Text Preservation on Leading / Unclosed Delimiters ---');

check('Leading unclosed paren preserves substantive text', () => {
  const res = fitTitleUnder60Chars('(Exclusive Desk Mats', [], 60);
  assert.strictEqual(res, 'Exclusive Desk Mats');
});

check('Leading unclosed bracket preserves substantive text', () => {
  const res = fitTitleUnder60Chars('[Exclusive Desk Mats', [], 60);
  assert.strictEqual(res, 'Exclusive Desk Mats');
});

check('Multiple leading unclosed parens preserve substantive text', () => {
  const res = fitTitleUnder60Chars('(((Exclusive Desk Mats', [], 60);
  assert.strictEqual(res, 'Exclusive Desk Mats');
});

check('Multiple leading unclosed brackets preserve substantive text', () => {
  const res = fitTitleUnder60Chars('[[[Exclusive Desk Mats', [], 60);
  assert.strictEqual(res, 'Exclusive Desk Mats');
});

check('Mixed leading unclosed delimiters preserve substantive text', () => {
  const res = fitTitleUnder60Chars('([ Exclusive Desk Mats', [], 60);
  assert.strictEqual(res, 'Exclusive Desk Mats');
});

check('Leading delimiter with candidate spec attaches candidate properly', () => {
  const res = fitTitleUnder60Chars('( Wall Gaming', ['900x400mm Studio'], 60);
  assert.strictEqual(res, 'Wall Gaming | 900x400mm Studio');
  assert(res.length <= 60);
});

check('Leading unclosed bracket with candidate spec attaches candidate properly', () => {
  const res = fitTitleUnder60Chars('[ Wall Gaming', ['900x400mm Studio'], 60);
  assert.strictEqual(res, 'Wall Gaming | 900x400mm Studio');
  assert(res.length <= 60);
});

// ----------------------------------------------------------------------------
// SUITE 3: Trailing / Mid-String Delimiter Balancing
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 3: Trailing / Mid-String Delimiter Balancing ---');

check('Trailing unclosed paren truncated cleanly without stripping main title', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats (UK Edition', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats');
});

check('Trailing unclosed bracket truncated cleanly without stripping main title', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats [UK Edition', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats');
});

check('Excess trailing closing paren stripped cleanly', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats (XXL))', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats (XXL)');
});

check('Excess trailing closing bracket stripped cleanly', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats [UK Edition]]', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats [UK Edition]');
});

check('Multiple excess closing delimiters stripped cleanly', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats ))]', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats');
});

// ----------------------------------------------------------------------------
// SUITE 4: Non-Empty Invariant & Empty Delimiters Fallback
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 4: Non-Empty Invariant & Empty Delimiters Fallback ---');

check('Empty string falls back to brand default', () => {
  const res = fitTitleUnder60Chars('', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Whitespace-only string falls back to brand default', () => {
  const res = fitTitleUnder60Chars('    ', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Null primary falls back to brand default', () => {
  const res = fitTitleUnder60Chars(null, [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Undefined primary falls back to brand default', () => {
  const res = fitTitleUnder60Chars(undefined, [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Empty parens "()" falls back to brand default', () => {
  const res = fitTitleUnder60Chars('()', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Empty brackets "[]" falls back to brand default', () => {
  const res = fitTitleUnder60Chars('[]', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Spaced empty parens "(   )" falls back to brand default', () => {
  const res = fitTitleUnder60Chars('(   )', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Spaced empty brackets "[   ]" falls back to brand default', () => {
  const res = fitTitleUnder60Chars('[   ]', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Mixed empty parentheticals "() []" falls back to brand default', () => {
  const res = fitTitleUnder60Chars('() []', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Punctuation-only string falls back to brand default', () => {
  const res = fitTitleUnder60Chars('- | & : ; , / \\ ~ + ( [', [], 60);
  assert.strictEqual(res, 'Prints With Passion');
});

check('Trailing cascading conjunctions stripped cleanly', () => {
  const res = fitTitleUnder60Chars('Japanese Anime Desk Mats and or but for with in', [], 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats');
});

// ----------------------------------------------------------------------------
// SUITE 5: Boundary Truncation & Edge Lengths
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 5: Boundary Truncation & Edge Lengths ---');

check('Exact 60 characters string preserved completely', () => {
  const title60 = 'A'.repeat(60);
  assert.strictEqual(title60.length, 60);
  const res = fitTitleUnder60Chars(title60, [], 60);
  assert.strictEqual(res.length, 60);
  assert.strictEqual(res, title60);
});

check('61 characters string truncated cleanly <= 60', () => {
  const title61 = 'Japanese Anime Desk Mats ' + 'X'.repeat(36);
  assert.strictEqual(title61.length, 61);
  const res = fitTitleUnder60Chars(title61, [], 60);
  assert(res.length <= 60);
  assert(res.length > 0);
});

check('Single continuous word > 60 characters is bounded <= 60 without crash', () => {
  const giant = 'SupercalifragilisticexpialidociousSupercalifragilisticexpialidociousExtraLong';
  const res = fitTitleUnder60Chars(giant, [], 60);
  assert(res.length <= 60);
  assert(res.length > 0);
});

check('Long title ending with dangling conjunction has conjunction stripped', () => {
  const longTitle = 'Archival Framed Canvas Wall Art Prints For Studio And Home With';
  const res = fitTitleUnder60Chars(longTitle, [], 60);
  assert(res.length <= 60);
  assert(!/\bwith$/i.test(res));
  assert(!/\band$/i.test(res));
});

// ----------------------------------------------------------------------------
// SUITE 6: Candidate Specs Selection and Filtering
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 6: Candidate Specs Selection and Filtering ---');

check('Selects richest candidate spec that fits <= 60 chars', () => {
  const primary = 'Japanese Anime Desk Mats'; // 24 chars
  const specs = [
    '900x400x4mm Extra Long Thick Gaming Pad Stitched Edges UK', // 57 chars -> 24 + 3 + 57 = 84 (too long)
    '900x400x4mm Stitched Gaming Pad Extra Long',                 // 42 chars -> 24 + 3 + 42 = 69 (too long)
    '900x400x4mm Stitched Gaming Pad',                           // 31 chars -> 24 + 3 + 31 = 58 (FITS!)
    '4mm Stitched Pad'                                          // 16 chars
  ];
  const res = fitTitleUnder60Chars(primary, specs, 60);
  assert.strictEqual(res, 'Japanese Anime Desk Mats | 900x400x4mm Stitched Gaming Pad');
  assert(res.length <= 60);
});

check('Candidate spec containing invalid entities is cleaned', () => {
  const primary = 'Anime Desk Mats';
  const specs = ['&quot;Studio Edition&quot; &amp; 900x400mm'];
  const res = fitTitleUnder60Chars(primary, specs, 60);
  assert(!res.includes('&quot;'));
  assert(!res.includes('&amp;'));
  assert(res.includes('"Studio Edition" & 900x400mm'));
});

// ----------------------------------------------------------------------------
// SUITE 7: Template Grammar Sanitizer Decimal Preservation
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 7: Template Grammar Sanitizer Decimal Preservation ---');

check('sanitizeTemplateGrammar preserves decimal dimensions like 1.25" pine bars', () => {
  const input = 'Transform with Canvas Wall Art (1.25" Pine Bars). Premium archival studio prints.';
  const res = sanitizeTemplateGrammar(input);
  assert(res.includes('1.25" European pine frames'));
  assert(!res.includes(' 25" European pine frames'));
  assert(!res.toLowerCase().includes('transform with'));
});

check('sanitizeTemplateGrammar preserves metric dimensions and handles action verbs', () => {
  const input = 'Elevate with Cushion Covers (45x45cm). High quality velvet.';
  const res = sanitizeTemplateGrammar(input);
  assert(res.includes('45x45cm'));
  assert(!res.toLowerCase().includes('elevate with'));
});

// ----------------------------------------------------------------------------
// SUITE 8: Single Product vs Collection Intent Guard
// ----------------------------------------------------------------------------
console.log('\n--- SUITE 8: Single Product vs Collection Intent Guard ---');

check('Single product query detection', () => {
  assert.strictEqual(isSingleProductQuery('japanese anime desk mat'), true);
  assert.strictEqual(isSingleProductQuery('anime mouse pad'), true);
  assert.strictEqual(isSingleProductQuery('canvas print'), true);
});

check('Category query detection (plural or collection keywords)', () => {
  assert.strictEqual(isSingleProductQuery('japanese anime desk mats'), false);
  assert.strictEqual(isSingleProductQuery('desk mats'), false);
  assert.strictEqual(isSingleProductQuery('gaming mouse pads'), false);
  assert.strictEqual(isSingleProductQuery('desk mat collection'), false);
});

check('buildCollectionThematicTitle protects collection identity', () => {
  const res = buildCollectionThematicTitle('japanese-anime-desk-mats', 'Japanese Anime Desk Mats', 'Desk Mats');
  assert.strictEqual(res, 'Japanese Anime XXL Desk Mats');
});

check('buildCompetitorSpecTitleAndMeta protects collection title from single product overwrite', () => {
  const entry = {
    keyword: 'japanese anime desk mat', // singular query!
    substrate: 'Desk Mats',
    targetUrl: '/collections/japanese-anime-desk-mats',
    pageType: 'collection'
  };
  const colContext = {
    handle: 'japanese-anime-desk-mats',
    title: 'Japanese Anime XXL Desk Mats'
  };
  const res = buildCompetitorSpecTitleAndMeta(entry, 'Japanese Anime XXL Desk Mats', colContext);
  assert(res.newTitle.includes('Desk Mats')); // plural preserved
  assert(!res.newTitle.endsWith('desk mat'));  // singular prevented
  assert(res.newTitle.length <= 60);
});

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('  CHALLENGER ITERATION 3 ADVERSARIAL STRESS SUMMARY             ');
console.log('================================================================');
console.log(`  Total Assertions:  40`);
console.log(`  Passed:            ${passedTests}`);
console.log(`  Failed:            ${failedTests}`);
console.log(`  Verdict:           ${failedTests === 0 ? 'APPROVE / CHALLENGE_PASSED' : 'REQUEST_CHANGES / CHALLENGE_FAILED'}`);
console.log('================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
