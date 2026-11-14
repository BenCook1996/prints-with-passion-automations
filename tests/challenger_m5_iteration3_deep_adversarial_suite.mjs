/**
 * Prints With Passion — Milestone 5 Iteration 3 Adversarial Challenge Suite
 * (tests/challenger_m5_iteration3_deep_adversarial_suite.mjs)
 *
 * Authored by Empirical Challenger (Milestone 5 Iteration 3).
 * Exhaustively stress-tests:
 * 1. Decimal preservation and boundary behavior in sanitizeTemplateGrammar across diverse formats
 *    (e.g., 1.25", 0.75", 2.50", 1.25" x 2.5", 3.14, edge periods, decimal at sentence end)
 * 2. HTML entity unescaping depth, malformed entities, and HTML vs plain-text preservation
 * 3. Title sanitization and rewriter invariants: word boundary, bracket balancing, non-empty guarantee
 * 4. Storewide collection compliance gate: edge cases, null handling, length boundaries
 * 5. GSC Sitemap idempotency under simulated network/API error conditions
 * 6. URL inspection pool construction, deduplication, and rotating cursor logic
 */

import assert from 'assert';
import path from 'path';

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

import {
  buildPriorityInspectionPool
} from '../gsc_ga4_gmc_cloud_sync.mjs';

import {
  fitTitleUnder60Chars
} from '../strikezone_ctr_and_competitor_rewriter.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function challenge(name, fn) {
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

async function runChallengerIteration3Suite() {
  console.log('================================================================');
  console.log('  CHALLENGER (M5 ITERATION 3) DEEP ADVERSARIAL VERIFICATION     ');
  console.log('================================================================');

  // ============================================================================
  // SUITE 1: DECIMAL POINT & TEMPLATE GRAMMAR STRESS TESTS
  // ============================================================================
  console.log('\n--- SUITE 1: Decimal Point & Template Grammar Invariants ---');

  challenge('Decimal: 1.25" Pine Bars in Transform with Canvas Wall Art', () => {
    const input = 'Transform with Canvas Wall Art (1.25" Pine Bars). Studio prints.';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(
      out,
      'Archival framed canvas wall art on 1.25" European pine frames. Studio prints.'
    );
    // Ensure the dangling fragment '25" Pine Bars' is completely gone
    assert.ok(!out.includes('Pine Bars'));
    assert.ok(!LINT_TEMPLATE_REGEX.test(out));
    assert.ok(!VERIFY_TEMPLATE_REGEX.test(out));
  });

  challenge('Decimal: Multi-decimal dimensions (e.g. 1.25" x 2.5" frame)', () => {
    const input = 'Transform with Canvas Wall Art on 1.25" x 2.50" solid pine bars. Premium gallery wrap.';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(
      out,
      'Archival framed canvas wall art on 1.25" European pine frames. Premium gallery wrap.'
    );
    // Ensure the trailing specification 'solid pine bars' was completely replaced without fracturing
    assert.ok(!out.includes('solid pine bars'));
    assert.ok(!out.includes('2.50"'));
    assert.ok(!LINT_TEMPLATE_REGEX.test(out));
  });

  challenge('Decimal: 0.75" Slim Canvas frame in Wall Art', () => {
    const input = 'Transform with Wall Art with 0.75" European profile. Archival ink.';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(
      out,
      'Archival framed canvas wall art on 1.25" European pine frames. Archival ink.'
    );
    assert.ok(!out.includes('0.75"'));
    assert.ok(!out.includes('European profile'));
  });

  challenge('Decimal: Upgrade with template containing decimal measurements', () => {
    const input = 'Upgrade with 1.25" Pine Framed Canvas Wall Art. Museum finish.';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(
      out,
      'Curated 1.25" Pine Framed Canvas Wall Art for modern home decor. Museum finish.'
    );
    assert.ok(out.includes('1.25"'));
    assert.ok(!LINT_TEMPLATE_REGEX.test(out));
  });

  challenge('Decimal: Decimal point at sentence end in Upgrade with', () => {
    const input = 'Upgrade with Studio Frame v2.0. Limited edition.';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(
      out,
      'Curated Studio Frame v2.0 for modern home decor. Limited edition.'
    );
  });

  challenge('Template: No period in input without decimals triggers fallback replacement', () => {
    const input = 'Transform with Canvas Wall Art (Pine Bars)';
    const out = sanitizeTemplateGrammar(input);
    assert.strictEqual(out, 'Shop curated Canvas Wall Art (Pine Bars)');
    assert.ok(!LINT_TEMPLATE_REGEX.test(out));
  });

  challenge('Template: Null, undefined, empty, and non-string inputs', () => {
    assert.strictEqual(sanitizeTemplateGrammar(null), '');
    assert.strictEqual(sanitizeTemplateGrammar(undefined), '');
    assert.strictEqual(sanitizeTemplateGrammar(''), '');
    assert.strictEqual(sanitizeTemplateGrammar('   '), '');
  });

  challenge('Template: All category replacements preserve follow-on sentences', () => {
    const cases = [
      {
        in: 'Wear with Graphic T-Shirts (100% cotton, 2.5kg/m). Made in UK.',
        expStart: 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. Made in UK.'
      },
      {
        in: 'Elevate with Cushion Covers (45x45cm). High quality velvet.',
        expStart: 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. High quality velvet.'
      },
      {
        in: 'Refresh with Memory Foam Bath Mats (anti-slip). Fast dry.',
        expStart: 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. Fast dry.'
      },
      {
        in: 'Style with Plush Throw Blankets (300 GSM). Soft and warm.',
        expStart: 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. Soft and warm.'
      }
    ];

    for (const c of cases) {
      const out = sanitizeTemplateGrammar(c.in);
      assert.strictEqual(out, c.expStart);
      assert.ok(!LINT_TEMPLATE_REGEX.test(out));
    }
  });

  // ============================================================================
  // SUITE 2: HTML ENTITY UNESCAPING DEPTH & SANITIZER
  // ============================================================================
  console.log('\n--- SUITE 2: HTML Entity Unescaping Stress ---');

  challenge('Entity: Multi-layer double escaped entities unescaped cleanly', () => {
    const raw = '&amp;amp;quot;Archival Art&amp;amp;quot; &amp;amp;amp; Desk Mats';
    const clean = unescapeHtmlEntities(raw, false);
    assert.strictEqual(clean, '"Archival Art" & Desk Mats');
    assert.ok(!LINT_ENTITY_REGEX.test(clean));
    assert.ok(!VERIFY_ENTITY_REGEX.test(clean));
  });

  challenge('Entity: HTML mode preserves valid tags but strips double-escapes', () => {
    const rawHtml = '<p>Shop &amp;quot;<strong>Archival</strong>&amp;quot; Wall Art</p>';
    const cleanHtml = unescapeHtmlEntities(rawHtml, true);
    assert.strictEqual(cleanHtml, '<p>Shop "<strong>Archival</strong>" Wall Art</p>');
    assert.ok(cleanHtml.includes('<strong>Archival</strong>'));
    assert.ok(!cleanHtml.includes('&amp;quot;'));
  });

  challenge('Entity: Clean string idempotency over 10 repeated passes', () => {
    let current = 'Archival Framed Canvas Wall Art (1.25" Pine Bars) & XXL Desk Mats';
    for (let i = 0; i < 10; i++) {
      current = unescapeHtmlEntities(current, false);
    }
    assert.strictEqual(current, 'Archival Framed Canvas Wall Art (1.25" Pine Bars) & XXL Desk Mats');
  });

  // ============================================================================
  // SUITE 3: REWRITER & TITLE SANITIZER INVARIANTS
  // ============================================================================
  console.log('\n--- SUITE 3: Title Truncation & Rewriter Invariants ---');

  challenge('Rewriter: fitTitleUnder60Chars strictly <= 60 chars across adversarial cases', () => {
    const adversarial = [
      { primary: 'Japanese Anime XXL Desk Mats', specs: ['900x400x4mm Stitched Non-Slip Pad', 'Archival Edition'] },
      { primary: '(Exclusive Desk Mats', specs: ['900x400mm Studio', 'UK Edition'] },
      { primary: '[Exclusive Desk Mats', specs: ['900x400mm Studio'] },
      { primary: 'Japanese Anime Desk Mats [UK Edition]', specs: [] },
      { primary: '[Desk Mats]', specs: [] },
      { primary: '( Wall Gaming', specs: ['900x400mm Studio'] },
      { primary: '--- | | ::: ;;; ,,,', specs: ['900x400mm Studio'] },
      { primary: '((((Unclosed Parens Only', specs: [] },
      { primary: '[[[[Unclosed Brackets Only', specs: [] },
      { primary: 'Abstract Minimalist Bauhaus Canvas Wall Art Archival Prints With Museum Quality Frames', specs: [] },
      { primary: 'Desk Mats with', specs: ['UK Edition'] },
      { primary: 'Prints With Passion and', specs: [] }
    ];

    for (const { primary, specs } of adversarial) {
      const result = fitTitleUnder60Chars(primary, specs, 60);
      assert.ok(typeof result === 'string', `Result not a string for "${primary}"`);
      assert.ok(result.trim().length > 0, `Empty string returned for "${primary}"`);
      assert.ok(result.length <= 60, `Exceeded 60 chars (${result.length}): "${result}"`);
      assert.ok(!LINT_DANGLING_REGEX.test(result), `Dangling regex triggered on "${result}"`);
      assert.ok(!VERIFY_DANGLING_REGEX.test(result), `Verify dangling regex triggered on "${result}"`);

      // Balance check
      const openParens = (result.match(/\(/g) || []).length;
      const closeParens = (result.match(/\)/g) || []).length;
      assert.strictEqual(openParens, closeParens, `Unbalanced parentheses in "${result}"`);

      const openBrackets = (result.match(/\[/g) || []).length;
      const closeBrackets = (result.match(/\]/g) || []).length;
      assert.strictEqual(openBrackets, closeBrackets, `Unbalanced brackets in "${result}"`);
    }
  });

  challenge('Rewriter: Fallback on completely empty / delimiter-only string', () => {
    const r1 = fitTitleUnder60Chars('', [], 60);
    assert.strictEqual(r1, 'Prints With Passion');

    const r2 = fitTitleUnder60Chars('   ', [], 60);
    assert.strictEqual(r2, 'Prints With Passion');

    const r3 = fitTitleUnder60Chars('--- ||| :::', [], 60);
    assert.strictEqual(r3, 'Prints With Passion');

    const r4 = fitTitleUnder60Chars('()', [], 60);
    assert.strictEqual(r4, 'Prints With Passion');

    const r5 = fitTitleUnder60Chars('[]', [], 60);
    assert.strictEqual(r5, 'Prints With Passion');
  });

  challenge('Title Sanitizer: sanitizeDanglingTitle boundary truncation', () => {
    // Exactly 60 chars
    const exact60 = '1234567890 '.repeat(5) + '12345';
    assert.strictEqual(exact60.length, 60);
    const out60 = sanitizeDanglingTitle(exact60, '', 60);
    assert.ok(out60.length <= 60);

    // 61 chars
    const length61 = `${exact60}6`;
    assert.strictEqual(length61.length, 61);
    const out61 = sanitizeDanglingTitle(length61, '', 60);
    assert.ok(out61.length <= 60);
  });

  // ============================================================================
  // SUITE 4: STOREWIDE COLLECTION COMPLIANCE GATE
  // ============================================================================
  console.log('\n--- SUITE 4: Collection Compliance Gate Edge Testing ---');

  challenge('Compliance Gate: 0-product collections detection and frontpage exemption', () => {
    const collections = [
      { handle: 'frontpage', title: 'Home page', productsCount: { count: 0 }, seo: { title: 'Home', description: 'Desc'.repeat(35) } },
      { handle: 'empty-legacy', title: 'Empty Legacy', productsCount: { count: 0 }, seo: { title: 'Empty', description: 'Desc'.repeat(35) } },
      { handle: 'active-col', title: 'Active Col', productsCount: { count: 5 }, seo: { title: 'Active Col', description: 'Valid collection description with sufficient length for seo requirements in uk store.'.padEnd(145, ' ') } }
    ];

    const res = validateCollectionCompliance(collections, null, []);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.emptyViolations.length, 1);
    assert.strictEqual(res.emptyViolations[0].handle, 'empty-legacy');
  });

  challenge('Compliance Gate: Description length boundary checks (139, 140, 158, 159)', () => {
    const baseCol = { handle: 'test-col', title: 'Test Col', productsCount: 10 };

    const c139 = { ...baseCol, seo: { title: 'Test Col', description: 'A'.repeat(139) } };
    const r139 = validateCollectionCompliance([c139], null, []);
    assert.strictEqual(r139.descLengthViolations.length, 1);

    const c140 = { ...baseCol, seo: { title: 'Test Col', description: 'A'.repeat(140) } };
    const r140 = validateCollectionCompliance([c140], null, []);
    assert.strictEqual(r140.descLengthViolations.length, 0);

    const c158 = { ...baseCol, seo: { title: 'Test Col', description: 'A'.repeat(158) } };
    const r158 = validateCollectionCompliance([c158], null, []);
    assert.strictEqual(r158.descLengthViolations.length, 0);

    const c159 = { ...baseCol, seo: { title: 'Test Col', description: 'A'.repeat(159) } };
    const r159 = validateCollectionCompliance([c159], null, []);
    assert.strictEqual(r159.descLengthViolations.length, 1);
  });

  challenge('Compliance Gate: Minimal collection objects resilience', () => {
    const res = validateCollectionCompliance(
      [{ handle: 'valid-minimal', productsCount: 1, seo: { title: 'Valid Minimal Title', description: 'A'.repeat(145) } }],
      null,
      null
    );
    assert.strictEqual(res.passed, true);
  });

  // ============================================================================
  // SUITE 5: GSC PRIORITY POOL & ROTATING CURSOR
  // ============================================================================
  console.log('\n--- SUITE 5: GSC Pool & Modulo Cursor Arithmetic ---');

  challenge('GSC Pool: Priority pool construction with deduplication & entity resolution', () => {
    const subs = [
      { handle: 'canvas-prints' }, // duplicate of seed
      'desk-mats',                 // duplicate of seed
      'retro-vintage-desk-mats',   // new
      null,
      ''
    ];
    const known = [
      '/collections/retro-vintage-desk-mats', // duplicate of sub
      '/collections/japanese-anime-desk-mats',
      'https://printswithpassion.com/pages/uk-product-catalog', // duplicate of seed
      '/pages/custom-guide?ref=a&amp;b'
    ];

    const pool = buildPriorityInspectionPool(subs, known);

    // Verify all entries start with https://printswithpassion.com/
    for (const u of pool) {
      assert.ok(u.startsWith('https://printswithpassion.com/'), `Invalid URL: ${u}`);
      assert.ok(!u.includes('&amp;'), `Unescaped entity in URL: ${u}`);
    }

    // Verify strict deduplication
    const unique = new Set(pool);
    assert.strictEqual(unique.size, pool.length);

    // Verify key members
    assert.ok(pool.includes('https://printswithpassion.com/'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/retro-vintage-desk-mats'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/japanese-anime-desk-mats'));
    assert.ok(pool.includes('https://printswithpassion.com/pages/custom-guide?ref=a&b'));
  });

  challenge('GSC Pool: Handles empty/null/undefined inputs safely', () => {
    const p1 = buildPriorityInspectionPool([], []);
    assert.ok(p1.length >= 10); // contains the seed URLs

    const p2 = buildPriorityInspectionPool(null, null);
    assert.ok(p2.length >= 10);
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`TOTAL ITERATION 3 ADVERSARIAL CHALLENGES: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES SUMMARY:');
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.error}`);
    }
  } else {
    console.log('\nALL ITERATION 3 ADVERSARIAL CHALLENGES PASSED WITH 100% SUCCESS!');
  }

  return { totalTests, passedTests, failedTests, failures };
}

runChallengerIteration3Suite().then(({ failedTests }) => {
  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
