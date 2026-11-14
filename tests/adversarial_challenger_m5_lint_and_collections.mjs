/**
 * Adversarial Empirical Verification Suite for Milestone 5:
 * Catalog Uniqueness & SEO Lint Quality Gate and Storewide Collection Compliance Gate
 * (tests/adversarial_challenger_m5_lint_and_collections.mjs)
 *
 * Authored by Challenger 2 (Milestone 5)
 */
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  UNESCAPED_ENTITY_REGEX as LINT_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX as LINT_TEMPLATE_REGEX,
  DANGLING_TITLE_REGEX as LINT_DANGLING_REGEX,
  IP_TRADEMARK_REGEX,
  unescapeHtmlEntities,
  sanitizeDanglingTitle,
  sanitizeTemplateGrammar
} from '../catalog_uniqueness_and_seo_lint_gate.mjs';

import {
  validateCollectionCompliance,
  DANGLING_TITLE_REGEX as VERIFY_DANGLING_REGEX,
  UNESCAPED_ENTITY_REGEX as VERIFY_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX as VERIFY_TEMPLATE_REGEX
} from '../verify_40_subcollections_counts.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function testCase(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

console.log('================================================================');
console.log('  CHALLENGER 2: ADVERSARIAL STRESS TEST HARNESS (MILESTONE 5)    ');
console.log('================================================================');

// ============================================================================
// SUITE 1: catalog_uniqueness_and_seo_lint_gate.mjs — unescapeHtmlEntities
// ============================================================================
console.log('\n--- SUITE 1: unescapeHtmlEntities Stress Testing ---');

testCase('unescapeHtmlEntities: Single escaped entities (plain text)', () => {
  assert.strictEqual(unescapeHtmlEntities('&quot;Bauhaus Wall Art&quot;', false), '"Bauhaus Wall Art"');
  assert.strictEqual(unescapeHtmlEntities('Studio &#39;Special&#39;', false), "Studio 'Special'");
  assert.strictEqual(unescapeHtmlEntities('Studio &apos;Special&apos;', false), "Studio 'Special'");
  assert.strictEqual(unescapeHtmlEntities('Canvas &amp; Desk Mats', false), 'Canvas & Desk Mats');
  assert.strictEqual(unescapeHtmlEntities('Size &lt; 60cm &gt; 20cm', false), 'Size < 60cm > 20cm');
  assert.strictEqual(unescapeHtmlEntities('Non&nbsp;breaking', false), 'Non breaking');
});

testCase('unescapeHtmlEntities: Double escaped entities (plain text)', () => {
  assert.strictEqual(unescapeHtmlEntities('&amp;quot;Bauhaus Wall Art&amp;quot;', false), '"Bauhaus Wall Art"');
  assert.strictEqual(unescapeHtmlEntities('&amp;#39;Studio Special&amp;#39;', false), "'Studio Special'");
  assert.strictEqual(unescapeHtmlEntities('&amp;apos;Studio Special&amp;apos;', false), "'Studio Special'");
  assert.strictEqual(unescapeHtmlEntities('Canvas &amp;amp; Desk Mats', false), 'Canvas & Desk Mats');
  assert.strictEqual(unescapeHtmlEntities('Size &amp;lt; 60 &amp;gt; 20', false), 'Size < 60 > 20');
});

testCase('unescapeHtmlEntities: Triple and Quadruple escaped entities', () => {
  assert.strictEqual(unescapeHtmlEntities('&amp;amp;quot;Triple Escaped&amp;amp;quot;', false), '"Triple Escaped"');
  assert.strictEqual(unescapeHtmlEntities('&amp;amp;amp;quot;Quad Escaped&amp;amp;amp;quot;', false), '"Quad Escaped"');
  assert.strictEqual(unescapeHtmlEntities('&amp;amp;amp;#39;Deep Escaped&#39;', false), "'Deep Escaped'");
  assert.strictEqual(unescapeHtmlEntities('&amp;amp;amp;amp;amp;quot;5-Deep&amp;amp;amp;amp;amp;quot;', false), '"5-Deep"');
  assert.strictEqual(unescapeHtmlEntities('&amp;amp;amp;amp;amp;amp;amp;quot;7-Deep&amp;amp;amp;amp;amp;amp;amp;quot;', false), '"7-Deep"');
});

testCase('unescapeHtmlEntities: Complex mixed entity string', () => {
  const mixed = 'Archival &amp;amp;quot;Bauhaus&amp;amp;quot; &amp;amp; 1.25&amp;quot; Pine &amp;apos;Studio&#39; Frame &amp;lt;Limited&amp;gt;';
  const expected = 'Archival "Bauhaus" & 1.25" Pine \'Studio\' Frame <Limited>';
  assert.strictEqual(unescapeHtmlEntities(mixed, false), expected);
});

testCase('unescapeHtmlEntities: isHtml = true preserves HTML tags while stripping double-escapes', () => {
  const htmlInput = '<p class="desc">Shop &amp;quot;Curated&amp;quot; &amp;amp; <strong>Bold</strong> Canvas &amp;lt;Art&amp;gt;</p>';
  const expected = '<p class="desc">Shop "Curated" & <strong>Bold</strong> Canvas <Art></p>';
  assert.strictEqual(unescapeHtmlEntities(htmlInput, true), expected);
});

testCase('unescapeHtmlEntities: Edge cases (empty, null, undefined, already clean)', () => {
  assert.strictEqual(unescapeHtmlEntities(''), '');
  assert.strictEqual(unescapeHtmlEntities(null), '');
  assert.strictEqual(unescapeHtmlEntities(undefined), '');
  assert.strictEqual(unescapeHtmlEntities('Clean plain text without entities', false), 'Clean plain text without entities');
});

testCase('unescapeHtmlEntities: Idempotency check', () => {
  const input = '&amp;amp;quot;Nested &amp;amp; Framed&amp;quot;';
  const pass1 = unescapeHtmlEntities(input, false);
  const pass2 = unescapeHtmlEntities(pass1, false);
  assert.strictEqual(pass1, pass2);
  assert.strictEqual(pass2, '"Nested & Framed"');
});

testCase('UNESCAPED_ENTITY_REGEX vs unescapeHtmlEntities', () => {
  const dirty = 'Shop &quot;Archival&quot; &amp;quot;Canvas&amp;quot; &amp;amp; Art';
  assert.ok(LINT_ENTITY_REGEX.test(dirty), 'Dirty string triggers regex');
  assert.ok(VERIFY_ENTITY_REGEX.test(dirty), 'Verify regex also triggers');
  const cleaned = unescapeHtmlEntities(dirty, false);
  assert.strictEqual(cleaned, 'Shop "Archival" "Canvas" & Art');
  assert.ok(!LINT_ENTITY_REGEX.test(cleaned), 'Cleaned string does not trigger lint regex');
  assert.ok(!VERIFY_ENTITY_REGEX.test(cleaned), 'Cleaned string does not trigger verify regex');
});

// ============================================================================
// SUITE 2: catalog_uniqueness_and_seo_lint_gate.mjs — sanitizeTemplateGrammar
// ============================================================================
console.log('\n--- SUITE 2: sanitizeTemplateGrammar Stress Testing ---');

testCase('sanitizeTemplateGrammar: Category template for Canvas Wall Art', () => {
  const input = 'Transform with Canvas Wall Art (1.25" Pine Frame (8x10"–24x36")). Archival studio grade prints.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Archival framed canvas wall art on 1.25" European pine frames. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Category template for Graphic T-Shirts', () => {
  const input = 'Wear with Graphic T-Shirts (S-3XL, 100% Ring-Spun Cotton). Premium UK apparel.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Category template for Cushion Covers', () => {
  const input = 'Elevate with Cushion Covers (45x45cm). High quality velvet sofa decor.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Category template for Bath Mats', () => {
  const input = 'Refresh with Memory Foam Bath Mats (60x40cm). Non slip bathroom decor.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Category template for Blankets', () => {
  const input = 'Style with Plush Throw Blankets (50x60"). Cozy fleece bed decor.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Generic Upgrade with template', () => {
  const input = 'Upgrade with Desk Mats & Accessories. Beautiful workspace prints.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.startsWith('Curated Desk Mats & Accessories for modern home decor. '));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Mid-sentence template patterns (fallback replacement)', () => {
  const input = 'Looking to elevate your gaming station? Transform with XXL Desk Mats crafted from micro-woven cloth.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(cleaned.includes('Shop curated XXL Desk Mats'));
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
});

testCase('sanitizeTemplateGrammar: Multiple template occurrences in single text', () => {
  const input = 'Elevate with Cushion Covers for sofas. Also Style with Plush Throw Blankets for beds.';
  const cleaned = sanitizeTemplateGrammar(input);
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!cleaned.includes('Elevate with'));
  assert.ok(!cleaned.includes('Style with'));
});

testCase('sanitizeTemplateGrammar: Empty / Null / Clean strings', () => {
  assert.strictEqual(sanitizeTemplateGrammar(''), '');
  assert.strictEqual(sanitizeTemplateGrammar(null), '');
  assert.strictEqual(sanitizeTemplateGrammar(undefined), '');
  const clean = 'Discover archival framed canvas wall art stretched over 1.25" European pine frames with free UK delivery.';
  assert.strictEqual(sanitizeTemplateGrammar(clean), clean);
});

testCase('sanitizeTemplateGrammar: Adversarial edge cases (trailing phrases, entities in template)', () => {
  // Description with entity before template
  const entityAndTmpl = '&quot;Transform with Canvas Wall Art (1.25" Pine Frame). Beautiful prints.';
  const cleaned = sanitizeTemplateGrammar(entityAndTmpl);
  assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
  assert.ok(!cleaned.startsWith('&quot;'));
});

// ============================================================================
// SUITE 3: catalog_uniqueness_and_seo_lint_gate.mjs — sanitizeDanglingTitle
// ============================================================================
console.log('\n--- SUITE 3: sanitizeDanglingTitle Stress Testing ---');

testCase('sanitizeDanglingTitle: Trailing delimiters (- | / , : & &amp;)', () => {
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats |'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats -'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats --'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats —'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats /'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats ,'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats :'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats &'), 'Japanese Anime Desk Mats');
  assert.strictEqual(sanitizeDanglingTitle('Japanese Anime Desk Mats &amp;'), 'Japanese Anime Desk Mats');
});

testCase('sanitizeDanglingTitle: Trailing truncated words (Mo, Si, Desig, Pass)', () => {
  assert.strictEqual(sanitizeDanglingTitle('UK Desk Mat Size Guide: Extended Mo'), 'UK Desk Mat Size Guide: Extended');
  assert.strictEqual(sanitizeDanglingTitle('Desk Setup Hardware Compatibility | Dual Studio Si'), 'Desk Setup Hardware Compatibility | Dual Studio');
  assert.strictEqual(sanitizeDanglingTitle('Abstract Minimalist Bauhaus Desig'), 'Abstract Minimalist Bauhaus');
  // Cascading sanitization: 'Pass' is stripped, then trailing 'With' is also stripped so it does not dangle
  assert.strictEqual(sanitizeDanglingTitle('Shop Curated Prints With Pass'), 'Shop Curated Prints');
});

testCase('sanitizeDanglingTitle: Trailing prepositions and conjunctions (with, for, and, of, in, vs)', () => {
  assert.strictEqual(sanitizeDanglingTitle('Bauhaus Canvas Prints and'), 'Bauhaus Canvas Prints');
  assert.strictEqual(sanitizeDanglingTitle('Modern Sofa Cushion Covers with'), 'Modern Sofa Cushion Covers');
  assert.strictEqual(sanitizeDanglingTitle('Memory Foam Bath Mats for'), 'Memory Foam Bath Mats');
  assert.strictEqual(sanitizeDanglingTitle('Plush Throw Blankets in'), 'Plush Throw Blankets');
  assert.strictEqual(sanitizeDanglingTitle('Luxury Velvet Cushion of'), 'Luxury Velvet Cushion');
  assert.strictEqual(sanitizeDanglingTitle('Desk Mats vs'), 'Desk Mats');
});

testCase('sanitizeDanglingTitle: Unclosed parentheses and brackets', () => {
  assert.strictEqual(sanitizeDanglingTitle('Minimalist Bauhaus Canvas Print (CM & I'), 'Minimalist Bauhaus Canvas Print');
  assert.strictEqual(sanitizeDanglingTitle('Heavyweight Cotton Graphic T-Shirt (S-3'), 'Heavyweight Cotton Graphic T-Shirt');
  assert.strictEqual(sanitizeDanglingTitle('Studio Canvas Art (1.25" Pine'), 'Studio Canvas Art');
});

testCase('sanitizeDanglingTitle: Cascading / nested dangling patterns', () => {
  const cascading1 = 'Japanese Anime Desk Mats | with & (CM & I';
  const res1 = sanitizeDanglingTitle(cascading1);
  assert.strictEqual(res1, 'Japanese Anime Desk Mats');
  assert.ok(!LINT_DANGLING_REGEX.test(res1));
  assert.ok(!VERIFY_DANGLING_REGEX.test(res1));

  const cascading2 = 'Bauhaus Wall Art - Extended Mo | for &';
  const res2 = sanitizeDanglingTitle(cascading2);
  assert.strictEqual(res2, 'Bauhaus Wall Art - Extended');
  assert.ok(!LINT_DANGLING_REGEX.test(res2));
  assert.ok(!VERIFY_DANGLING_REGEX.test(res2));
});

testCase('sanitizeDanglingTitle: Long titles (> 60 chars) truncated at word boundary', () => {
  const long1 = 'Abstract Minimalist Bauhaus Canvas Wall Art Archival Prints With Museum Quality Frames';
  const res1 = sanitizeDanglingTitle(long1, ' | Prints With Passion', 60);
  assert.ok(res1.length <= 60, `Length <= 60, got ${res1.length}: "${res1}"`);
  assert.ok(!LINT_DANGLING_REGEX.test(res1), `No dangling tokens: "${res1}"`);
  assert.ok(!VERIFY_DANGLING_REGEX.test(res1));
  // Check that the last word was not sliced mid-word
  const words = res1.split(' ');
  const originalWords = long1.split(' ');
  assert.strictEqual(words[words.length - 1], originalWords[words.length - 1], 'Last word matches full word');
});

testCase('sanitizeDanglingTitle: Boundary case exactly 60 chars vs 61 chars', () => {
  // Construct exactly 60-character title
  const exact60 = 'A'.repeat(20) + ' ' + 'B'.repeat(20) + ' ' + 'C'.repeat(18); // 20 + 1 + 20 + 1 + 18 = 60
  assert.strictEqual(exact60.length, 60);
  const res60 = sanitizeDanglingTitle(exact60, '', 60);
  assert.strictEqual(res60.length, 60);

  // Construct 61-character title
  const char61 = exact60 + 'X'; // 61 chars
  assert.strictEqual(char61.length, 61);
  const res61 = sanitizeDanglingTitle(char61, '', 60);
  assert.ok(res61.length <= 60, `Length <= 60, got ${res61.length}`);
  assert.ok(res61.length <= 41, 'Truncated at space boundary');
});

testCase('sanitizeDanglingTitle: Empty, Null, Undefined inputs', () => {
  assert.strictEqual(sanitizeDanglingTitle(''), '');
  assert.strictEqual(sanitizeDanglingTitle(null), '');
  assert.strictEqual(sanitizeDanglingTitle(undefined), '');
});

// ============================================================================
// SUITE 4: verify_40_subcollections_counts.mjs — validateCollectionCompliance
// ============================================================================
console.log('\n--- SUITE 4: validateCollectionCompliance Stress Testing ---');

const baseMockSubs = [
  { handle: 'japanese-anime-desk-mats' },
  { handle: 'abstract-minimalist-bauhaus-canvas-wall-art' },
  { handle: 'retro-vintage-desk-mats' }
];

const baseMockSitemap = new Set([
  'japanese-anime-desk-mats',
  'abstract-minimalist-bauhaus-canvas-wall-art',
  'retro-vintage-desk-mats'
]);

testCase('validateCollectionCompliance: Perfectly compliant collection set', () => {
  const cleanCols = [
    {
      handle: 'frontpage',
      title: 'Home page',
      productsCount: { count: 0 },
      seo: { title: '', description: '' }
    },
    {
      handle: 'japanese-anime-desk-mats',
      title: 'Japanese Anime XXL Desk Mats',
      productsCount: { count: 14 },
      seo: {
        title: 'Japanese Anime XXL Desk Mats | 900x400x4mm Stitched Pad',
        description: 'Explore Japanese anime XXL desk mats crafted with 4mm high-density natural rubber, anti-fray stitched edges & micro-woven cloth. Free tracked UK delivery.'
      }
    },
    {
      handle: 'abstract-minimalist-bauhaus-canvas-wall-art',
      title: 'Bauhaus Canvas Wall Art',
      productsCount: { count: 8 },
      seo: {
        title: 'Bauhaus Canvas Wall Art | 1.25" Pine Framed Canvas',
        description: 'Archival Bauhaus minimalist canvas wall art stretched over 1.25" kiln-dried European pine stretcher bars with 400gsm cotton-poly canvas. Free UK delivery.'
      }
    },
    {
      handle: 'retro-vintage-desk-mats',
      title: 'Retro Vintage XXL Desk Mats',
      productsCount: 12, // test numeric count as well
      seo: {
        title: 'Retro Vintage XXL Desk Mats | 900x400 Non-Slip Gaming Pad',
        description: 'Shop retro vintage gaming desk mats featuring 4mm thick non-slip natural open-cell rubber base and ultra-smooth cloth surface. Fast tracked UK delivery.'
      }
    }
  ];

  const res = validateCollectionCompliance(cleanCols, baseMockSitemap, baseMockSubs);
  assert.strictEqual(res.passed, true, 'Clean set must pass');
  assert.strictEqual(res.totalViolations, 0, 'Clean set has 0 violations');
  assert.strictEqual(res.emptyViolations.length, 0);
  assert.strictEqual(res.titleLengthViolations.length, 0);
  assert.strictEqual(res.titleDanglingViolations.length, 0);
  assert.strictEqual(res.descLengthViolations.length, 0);
  assert.strictEqual(res.descEntityViolations.length, 0);
  assert.strictEqual(res.descTemplateViolations.length, 0);
  assert.strictEqual(res.sitemapMissingSubcollections.length, 0);
  assert.strictEqual(res.sitemapUnwantedCollections.length, 0);
});

testCase('validateCollectionCompliance: Assertion 1 (Empty Collections & Frontpage Exemption)', () => {
  const cols = [
    {
      handle: 'frontpage',
      title: 'Home page',
      productsCount: { count: 0 },
      seo: { title: '', description: '' }
    },
    {
      handle: 'dog-collars',
      title: 'Dog Collars',
      productsCount: { count: 0 },
      seo: { title: 'Dog Collars', description: 'Empty collar description' }
    },
    {
      handle: 'beach-towels',
      title: 'Beach Towels',
      productsCount: 0, // numeric count
      seo: { title: 'Beach Towels', description: 'Empty beach towel desc' }
    }
  ];

  const res = validateCollectionCompliance(cols, baseMockSitemap, []);
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.emptyViolations.length, 2);
  const handles = res.emptyViolations.map(v => v.handle);
  assert.ok(handles.includes('dog-collars'));
  assert.ok(handles.includes('beach-towels'));
  assert.ok(!handles.includes('frontpage'), 'frontpage is excluded from emptyViolations');
});

testCase('validateCollectionCompliance: Assertion 2 (Title length > 60 chars)', () => {
  const col60 = {
    handle: 'title-60',
    title: 'Valid Title 60',
    productsCount: { count: 5 },
    seo: {
      title: 'A'.repeat(60),
      description: 'A'.repeat(145)
    }
  };
  const col61 = {
    handle: 'title-61',
    title: 'Invalid Title 61',
    productsCount: { count: 5 },
    seo: {
      title: 'A'.repeat(61),
      description: 'A'.repeat(145)
    }
  };

  const res60 = validateCollectionCompliance([col60], baseMockSitemap, []);
  assert.strictEqual(res60.titleLengthViolations.length, 0, '60 chars passes');

  const res61 = validateCollectionCompliance([col61], baseMockSitemap, []);
  assert.strictEqual(res61.titleLengthViolations.length, 1, '61 chars fails');
  assert.strictEqual(res61.titleLengthViolations[0].len, 61);
  assert.strictEqual(res61.passed, false);
});

testCase('validateCollectionCompliance: Assertion 3 (Dangling titles)', () => {
  const badTitles = [
    'Japanese Anime Desk Mats |',
    'Bauhaus Canvas Prints -',
    'Wall Art &',
    'Desk Setup Guide Extended Mo',
    'Dual Studio Si',
    'Minimalist Bauhaus Canvas Print (CM & I',
    'Cozy Blankets and',
    'Luxury Cushion Covers with',
    'Memory Foam Bath Mats for',
    'Desk Pad Collection...'
  ];

  for (const bt of badTitles) {
    const col = {
      handle: 'test-dangling',
      title: bt,
      productsCount: { count: 5 },
      seo: {
        title: bt,
        description: 'A'.repeat(145)
      }
    };
    const res = validateCollectionCompliance([col], baseMockSitemap, []);
    assert.strictEqual(res.titleDanglingViolations.length, 1, `Failed to flag dangling title: "${bt}"`);
  }
});

testCase('validateCollectionCompliance: Assertion 4 (Description length 140–158 chars)', () => {
  const desc139 = {
    handle: 'd139',
    title: 'Valid Title',
    productsCount: { count: 5 },
    seo: { title: 'Valid Title', description: 'A'.repeat(139) }
  };
  const desc140 = {
    handle: 'd140',
    title: 'Valid Title',
    productsCount: { count: 5 },
    seo: { title: 'Valid Title', description: 'A'.repeat(140) }
  };
  const desc158 = {
    handle: 'd158',
    title: 'Valid Title',
    productsCount: { count: 5 },
    seo: { title: 'Valid Title', description: 'A'.repeat(158) }
  };
  const desc159 = {
    handle: 'd159',
    title: 'Valid Title',
    productsCount: { count: 5 },
    seo: { title: 'Valid Title', description: 'A'.repeat(159) }
  };

  const res139 = validateCollectionCompliance([desc139], baseMockSitemap, []);
  assert.strictEqual(res139.descLengthViolations.length, 1, '139 chars fails');

  const res140 = validateCollectionCompliance([desc140], baseMockSitemap, []);
  assert.strictEqual(res140.descLengthViolations.length, 0, '140 chars passes');

  const res158 = validateCollectionCompliance([desc158], baseMockSitemap, []);
  assert.strictEqual(res158.descLengthViolations.length, 0, '158 chars passes');

  const res159 = validateCollectionCompliance([desc159], baseMockSitemap, []);
  assert.strictEqual(res159.descLengthViolations.length, 1, '159 chars fails');
});

testCase('validateCollectionCompliance: Assertion 5 (HTML entities in description)', () => {
  const entityDescs = [
    'Discover archival &quot;Bauhaus&quot; canvas wall art stretched over 1.25" European pine frames with free UK delivery today. Sized for bedrooms and living rooms.',
    'Discover archival &amp;quot;Bauhaus&amp;quot; canvas wall art stretched over 1.25" European pine frames with free UK delivery today. Sized for bedrooms.',
    'Discover archival Bauhaus canvas wall art &amp; desk mats stretched over 1.25" European pine frames with free UK delivery today. Sized for bedrooms.',
    'Discover archival &#39;Bauhaus&#39; canvas wall art stretched over 1.25" European pine frames with free UK delivery today. Sized for bedrooms and halls.',
    'Discover archival &apos;Bauhaus&apos; canvas wall art stretched over 1.25" European pine frames with free UK delivery today. Sized for bedrooms and halls.'
  ];

  for (const ed of entityDescs) {
    const col = {
      handle: 'test-entity',
      title: 'Valid Title',
      productsCount: { count: 5 },
      seo: { title: 'Valid Title', description: ed }
    };
    const res = validateCollectionCompliance([col], baseMockSitemap, []);
    assert.strictEqual(res.descEntityViolations.length, 1, `Failed to flag entity in: "${ed.slice(0, 40)}"`);
  }
});

testCase('validateCollectionCompliance: Assertion 6 (Template grammar in description)', () => {
  const templateDescs = [
    'Transform with Canvas Wall Art (1.25" Pine Frame (8x10"–24x36")). Archival studio grade prints with kiln-dried pine bars and free tracked shipping.',
    'Elevate with Cushion Covers for sofas. Archival studio grade prints with luxury velvet and concealed zippers with free tracked shipping across UK.',
    'Style with Plush Throw Blankets for cozy living rooms. Archival studio grade prints with 300 GSM fleece and free tracked shipping across the UK.',
    'Wear with Graphic T-Shirts (S-3XL) for casual style. Archival studio grade prints with heavyweight cotton and free tracked shipping across the UK.',
    'Refresh with Memory Foam Bath Mats (60x40cm) for modern bathrooms. Archival studio grade prints with non-slip backing and free tracked UK shipping.',
    'Upgrade with Velvet Cushion Covers for modern home decor. Archival studio grade prints with luxury fabric and free tracked shipping across the UK.'
  ];

  for (const td of templateDescs) {
    const col = {
      handle: 'test-template',
      title: 'Valid Title',
      productsCount: { count: 5 },
      seo: { title: 'Valid Title', description: td }
    };
    const res = validateCollectionCompliance([col], baseMockSitemap, []);
    assert.strictEqual(res.descTemplateViolations.length, 1, `Failed to flag template grammar in: "${td.slice(0, 30)}"`);
  }
});

testCase('validateCollectionCompliance: Assertion 7 & 8 (Sitemap presence & Unwanted collections)', () => {
  const cleanCols = [
    {
      handle: 'japanese-anime-desk-mats',
      title: 'Japanese Anime Desk Mats',
      productsCount: { count: 10 },
      seo: { title: 'Valid Title', description: 'A'.repeat(145) }
    }
  ];

  // Missing subcollection from sitemap
  const missingSitemap = new Set(['japanese-anime-desk-mats']);
  const requiredSubs = [
    { handle: 'japanese-anime-desk-mats' },
    { handle: 'abstract-minimalist-bauhaus-canvas-wall-art' }, // missing!
    'retro-vintage-desk-mats' // missing string format!
  ];

  const resMissing = validateCollectionCompliance(cleanCols, missingSitemap, requiredSubs);
  assert.strictEqual(resMissing.sitemapMissingSubcollections.length, 2);
  assert.ok(resMissing.sitemapMissingSubcollections.includes('abstract-minimalist-bauhaus-canvas-wall-art'));
  assert.ok(resMissing.sitemapMissingSubcollections.includes('retro-vintage-desk-mats'));

  // Unwanted avada in sitemap
  const unwantedSitemap = new Set([
    'japanese-anime-desk-mats',
    'abstract-minimalist-bauhaus-canvas-wall-art',
    'retro-vintage-desk-mats',
    'avada-upsell-best-sellers'
  ]);
  const resUnwanted = validateCollectionCompliance(cleanCols, unwantedSitemap, baseMockSubs);
  assert.strictEqual(resUnwanted.sitemapUnwantedCollections.length, 1);
  assert.ok(resUnwanted.sitemapUnwantedCollections[0].includes('avada-upsell-best-sellers'));
  assert.strictEqual(resUnwanted.passed, false);
});

testCase('validateCollectionCompliance: Cumulative Multi-Violation Gate Trigger', () => {
  const dirtySet = [
    {
      handle: 'empty-1',
      title: 'Empty 1',
      productsCount: { count: 0 },
      seo: { title: 'Empty 1', description: 'Empty' }
    },
    {
      handle: 'col-multi-fail',
      title: 'Multi Fail',
      productsCount: { count: 5 },
      seo: {
        title: 'Very Long Title Exceeding The Strictly Defined Maximum Sixty Chars Limit |', // >60 and dangling '|'
        description: 'Transform with Canvas Wall Art &quot;Studio Edition&quot;.' // <140, &quot;, and Transform with
      }
    }
  ];

  const dirtySitemap = new Set(['avada-upsell-best-sellers']);
  const dirtySubs = [{ handle: 'japanese-anime-desk-mats' }];

  const res = validateCollectionCompliance(dirtySet, dirtySitemap, dirtySubs);
  assert.strictEqual(res.passed, false);
  assert.strictEqual(res.emptyViolations.length, 1);
  assert.strictEqual(res.titleLengthViolations.length, 1);
  assert.strictEqual(res.titleDanglingViolations.length, 1);
  assert.strictEqual(res.descLengthViolations.length, 1);
  assert.strictEqual(res.descEntityViolations.length, 1);
  assert.strictEqual(res.descTemplateViolations.length, 1);
  assert.strictEqual(res.sitemapMissingSubcollections.length, 1);
  assert.strictEqual(res.sitemapUnwantedCollections.length, 1);
  assert.strictEqual(res.totalViolations, 8);
});

testCase('validateCollectionCompliance: Resilience to null/undefined/missing fields', () => {
  const weirdCols = [
    {
      handle: 'frontpage',
      title: null,
      productsCount: null,
      seo: null
    },
    {
      handle: 'weird-empty',
      title: undefined,
      productsCount: undefined,
      seo: undefined
    },
    {
      handle: 'valid-with-missing-seo',
      title: 'Valid Active Collection Title',
      productsCount: { count: 12 },
      seo: null // should fail desc length because description is empty
    }
  ];

  const res = validateCollectionCompliance(weirdCols, null, []);
  assert.strictEqual(res.passed, false);
  // frontpage with null productsCount should be treated as 0 and exempted
  assert.strictEqual(res.emptyViolations.length, 1);
  assert.strictEqual(res.emptyViolations[0].handle, 'weird-empty');
  // valid-with-missing-seo has count: 12 and seo: null, so desc.length is 0 -> descLengthViolations
  assert.strictEqual(res.descLengthViolations.length, 1);
  assert.strictEqual(res.descLengthViolations[0].handle, 'valid-with-missing-seo');
});

testCase('validateCollectionCompliance: Sitemap Handles null behavior (resilient on network outage)', () => {
  const cleanCols = [
    {
      handle: 'japanese-anime-desk-mats',
      title: 'Japanese Anime Desk Mats',
      productsCount: { count: 10 },
      seo: {
        title: 'Japanese Anime Desk Mats | 900x400x4mm Stitched Pad',
        description: 'Explore Japanese anime XXL desk mats crafted with 4mm high-density natural rubber, anti-fray stitched edges & micro-woven cloth. Free tracked UK delivery.'
      }
    }
  ];
  // sitemapHandles is null (e.g. fetch timed out or offline)
  const res = validateCollectionCompliance(cleanCols, null, baseMockSubs);
  assert.strictEqual(res.passed, true);
  assert.strictEqual(res.sitemapMissingSubcollections.length, 0);
  assert.strictEqual(res.sitemapUnwantedCollections.length, 0);
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TOTAL ADVERSARIAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log('================================================================');

if (failedTests > 0) {
  console.error('\nFAILURES SUMMARY:');
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('\nALL ADVERSARIAL STRESS TESTS COMPLETED WITH 100% SUCCESS!');
  process.exit(0);
}
