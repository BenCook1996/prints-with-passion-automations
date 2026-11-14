import assert from 'assert';
import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../../../strikezone_ctr_and_competitor_rewriter.mjs';

import {
  unescapeHtmlEntities,
  sanitizeDanglingTitle,
  sanitizeTemplateGrammar,
  IP_TRADEMARK_REGEX,
  UNESCAPED_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX,
  DANGLING_TITLE_REGEX
} from '../../../catalog_uniqueness_and_seo_lint_gate.mjs';

import {
  buildPriorityInspectionPool
} from '../../../gsc_ga4_gmc_cloud_sync.mjs';

import {
  validateCollectionCompliance
} from '../../../verify_40_subcollections_counts.mjs';

console.log('=== INDEPENDENT FORENSIC AUDITOR STRESS CHECK ===');

// 1. fitTitleUnder60Chars edge cases
assert.strictEqual(fitTitleUnder60Chars('   --- ||| ::: ///   '), 'Prints With Passion');
assert.strictEqual(fitTitleUnder60Chars('((((Japanese Anime))))'), '((((Japanese Anime))))');
assert.strictEqual(fitTitleUnder60Chars('(Japanese Anime [UK Edition]'), 'Japanese Anime [UK Edition]');
assert.strictEqual(fitTitleUnder60Chars('Japanese Anime Desk Mats and - |'), 'Japanese Anime Desk Mats');

// Single-word overflow without spaces
const longWord = 'A'.repeat(80);
const rLong = fitTitleUnder60Chars(longWord);
assert.ok(rLong.length <= 60, `rLong length must be <= 60, got ${rLong.length}`);

// Empty bracket handling
assert.strictEqual(fitTitleUnder60Chars('()'), 'Prints With Passion');
assert.strictEqual(fitTitleUnder60Chars('[]'), 'Prints With Passion');
assert.strictEqual(fitTitleUnder60Chars('( )'), 'Prints With Passion');
assert.strictEqual(fitTitleUnder60Chars('[ ]'), 'Prints With Passion');

// Substantive text preservation with leading bracket
const rLeadParen = fitTitleUnder60Chars('(Exclusive Desk Mats', [], 60);
assert.strictEqual(rLeadParen, 'Exclusive Desk Mats');
const rLeadBracket = fitTitleUnder60Chars('[Exclusive Desk Mats', [], 60);
assert.strictEqual(rLeadBracket, 'Exclusive Desk Mats');

// 2. sanitizeTemplateGrammar decimal preservation
const dec1 = sanitizeTemplateGrammar('Transform with Canvas Wall Art (1.25" Pine Bars). Premium finish.');
console.log('dec1 output:', dec1);
assert.ok(!dec1.includes('25" Pine Bars'), 'Must not fracture at decimal 1.25"');
assert.ok(dec1.includes('1.25" European pine frames'), 'Must have correct replacement');
assert.ok(dec1.includes('Premium finish'), 'Must preserve remainder of text');

const dec2 = sanitizeTemplateGrammar('Upgrade with 4.5mm Stitched Desk Mats. Archival quality.');
assert.ok(dec2.includes('4.5mm Stitched Desk Mats'), 'Must retain 4.5mm');

// 3. unescapeHtmlEntities deep nesting and HTML preservation
const deep = '&amp;amp;amp;quot;Test&amp;amp;amp;quot;';
assert.strictEqual(unescapeHtmlEntities(deep, false), '"Test"');
const htmlWithEntities = '<p>Shop &amp;quot;Art&amp;quot; &amp;amp; <strong>Quality</strong></p>';
assert.strictEqual(unescapeHtmlEntities(htmlWithEntities, true), '<p>Shop "Art" & <strong>Quality</strong></p>');

// 4. Intent protection
assert.strictEqual(isSingleProductQuery('japanese anime desk mat'), true);
assert.strictEqual(isSingleProductQuery('japanese anime desk mats'), false);

const specResult = buildCompetitorSpecTitleAndMeta({
  keyword: 'japanese wave desk mat',
  substrate: 'Desk Mats',
  targetUrl: '/collections/japanese-anime-desk-mats'
}, 'Japanese Anime Desk Mats', { handle: 'japanese-anime-desk-mats', title: 'Japanese Anime Desk Mats' });

assert.ok(!specResult.newTitle.includes('japanese wave desk mat'), 'Collection must not be overwritten by singular product keyword');
assert.ok(specResult.newTitle.length <= 60, `Title must be <= 60 chars, got ${specResult.newTitle.length}`);

// 5. URL Inspection pool deduplication & entities
const pool = buildPriorityInspectionPool(
  ['desk-mats', { handle: 'canvas-prints' }, 'desk-mats'],
  ['/collections/desk-mats', 'https://printswithpassion.com/collections/desk-mats?a=1&amp;b=2']
);
assert.strictEqual(pool.length, new Set(pool).size, 'Pool must be deduplicated');
assert.ok(pool.some(u => u.includes('?a=1&b=2')), 'Entity &amp; must be decoded in URL pool');

console.log('ALL INDEPENDENT FORENSIC AUDITOR STRESS CHECKS PASSED (100%)');
