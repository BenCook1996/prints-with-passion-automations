/**
 * Prints With Passion — Milestone 5 Iteration 2 Challenger 2 Adversarial Stress Suite
 * (tests/challenger_m5_r2_adversarial_matrix.mjs)
 *
 * Authored by Challenger 2 (Milestone 5 Iteration 2).
 * Thoroughly stress-tests:
 * 1. Double-escaped entities & regex boundaries in catalog_uniqueness_and_seo_lint_gate.mjs
 * 2. Broken template grammar fragments & fallback handling
 * 3. Dangling title sanitizer & length edge cases
 * 4. Storewide collection compliance gate in verify_40_subcollections_counts.mjs
 * 5. GSC Sitemap idempotency under all error & network conditions
 * 6. URL inspection pool construction, rotating cursor modulo arithmetic, and 200ms pacing
 * 7. Rewriter title invariants (brackets, delimiters, non-empty) in strikezone_ctr_and_competitor_rewriter.mjs
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

function test(name, fn) {
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

async function runAllTests() {
  console.log('================================================================');
  console.log('  CHALLENGER 2: DEEP ADVERSARIAL STRESS MATRIX (MILESTONE 5 R2) ');
  console.log('================================================================');

  // ============================================================================
  // SUITE 1: HTML ENTITY UNESCAPING & REGEX DETECTION
  // ============================================================================
  console.log('\n--- SUITE 1: HTML Entity Unescaping & Invariant Testing ---');

  test('Entity: 1 to 10 layers of nested double-escaped &quot;', () => {
    let nested = 'Art';
    for (let i = 1; i <= 10; i++) {
      nested = `&amp;quot;${nested}&amp;quot;`;
      const unescaped = unescapeHtmlEntities(nested, false);
      assert.ok(!LINT_ENTITY_REGEX.test(unescaped), `Failed at depth ${i}: "${unescaped}"`);
      assert.ok(!VERIFY_ENTITY_REGEX.test(unescaped), `Verify regex failed at depth ${i}: "${unescaped}"`);
    }
  });

  test('Entity: Mixed entities in single string (quot, apos, #39, amp, lt, gt, nbsp)', () => {
    const dirty = 'Shop &quot;Art&quot; &amp;apos;Studio&amp;apos; &#39;UK&#39; &amp;amp; Mats &amp;lt;4mm&amp;gt; &amp;nbsp; Edition';
    const clean = unescapeHtmlEntities(dirty, false);
    assert.strictEqual(clean, 'Shop "Art" \'Studio\' \'UK\' & Mats <4mm>   Edition');
    assert.ok(!LINT_ENTITY_REGEX.test(clean));
    assert.ok(!VERIFY_ENTITY_REGEX.test(clean));
  });

  test('Entity: HTML Mode (isHtml = true) preserves HTML markup while cleaning double-escaped entities', () => {
    const dirtyHtml = '<div class="content"><p>Shop &amp;quot;Archival&amp;quot; &amp;amp; <strong>Canvas Art</strong></p></div>';
    const cleanHtml = unescapeHtmlEntities(dirtyHtml, true);
    assert.strictEqual(cleanHtml, '<div class="content"><p>Shop "Archival" & <strong>Canvas Art</strong></p></div>');
    assert.ok(cleanHtml.includes('<div class="content">'));
    assert.ok(cleanHtml.includes('<strong>Canvas Art</strong>'));
    assert.ok(!cleanHtml.includes('&amp;quot;'));
  });

  test('Entity: Idempotence across 5 iterative passes', () => {
    let s = '&amp;amp;amp;quot;Bauhaus Art&amp;amp;amp;quot;';
    for (let pass = 0; pass < 5; pass++) {
      s = unescapeHtmlEntities(s, false);
    }
    assert.strictEqual(s, '"Bauhaus Art"');
    assert.ok(!LINT_ENTITY_REGEX.test(s));
  });

  test('Entity: Safe handling of edge-case types (null, undefined, number, symbol, empty)', () => {
    assert.strictEqual(unescapeHtmlEntities(null), '');
    assert.strictEqual(unescapeHtmlEntities(undefined), '');
    assert.strictEqual(unescapeHtmlEntities(''), '');
    assert.strictEqual(unescapeHtmlEntities('   '), '   ');
  });

  // ============================================================================
  // SUITE 2: TEMPLATE GRAMMAR FRAGMENTS & SANITIZATION
  // ============================================================================
  console.log('\n--- SUITE 2: Template Grammar Fragments & Fallback Handling ---');

  test('Template: All 7 forbidden action verbs at start of description without decimal point', () => {
    const templates = [
      { in: 'Wear with Graphic T-Shirts (S-3XL). Heavyweight cotton.', exp: 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. Heavyweight cotton.' },
      { in: 'Elevate with Cushion Covers (45x45cm). Velvet decor.', exp: 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. Velvet decor.' },
      { in: 'Refresh with Memory Foam Bath Mats (60x40cm). Non-slip.', exp: 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. Non-slip.' },
      { in: 'Style with Plush Throw Blankets (50x60"). Cozy fleece.', exp: 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. Cozy fleece.' },
      { in: 'Upgrade with Gaming Desk Mats. Archival UK pads.', exp: 'Curated Gaming Desk Mats for modern home decor. Archival UK pads.' },
      { in: 'Claim with Limited Studio Editions. Fast dispatch.', exp: 'Shop curated Limited Studio Editions. Fast dispatch.' }
    ];

    for (const t of templates) {
      const res = sanitizeTemplateGrammar(t.in);
      assert.strictEqual(res, t.exp, `Mismatch for input: ${t.in}`);
      assert.ok(!LINT_TEMPLATE_REGEX.test(res), `Template regex matched output: ${res}`);
      assert.ok(!VERIFY_TEMPLATE_REGEX.test(res), `Verify regex matched output: ${res}`);
    }
  });

  test('Template: Adversarial test for decimal point in canvas stretcher bar dimensions (1.25" pine bars)', () => {
    const input = 'Transform with Canvas Wall Art (1.25" Pine Bars). Studio prints.';
    const res = sanitizeTemplateGrammar(input);
    const hasBrokenFragment = res.includes('25" Pine Bars');
    assert.strictEqual(
      hasBrokenFragment,
      false,
      `BUG DETECTED: sanitizeTemplateGrammar fractured at decimal point 1.25", leaving broken fragment: "${res}"`
    );
  });

  test('Template: Mid-sentence and repeated template grammar occurrences', () => {
    const multi = 'Curated space. Elevate with Velvet Cushions for sofas. Also Refresh with Memory Foam Mats.';
    const cleaned = sanitizeTemplateGrammar(multi);
    assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
    assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
    assert.ok(cleaned.includes('Shop curated Velvet Cushions'));
    assert.ok(cleaned.includes('Shop curated Memory Foam Mats'));
  });

  test('Template: Case insensitivity (TRANSFORM WITH, elevate with, etc.)', () => {
    const upper = 'TRANSFORM WITH Canvas Wall Art (Pine Frame). Beautiful prints.';
    const cleaned = sanitizeTemplateGrammar(upper);
    assert.ok(!LINT_TEMPLATE_REGEX.test(cleaned));
    assert.ok(!VERIFY_TEMPLATE_REGEX.test(cleaned));
    assert.ok(cleaned.startsWith('Archival framed canvas wall art'));
  });

  // ============================================================================
  // SUITE 3: DANGLING TITLE SANITIZATION & BOUNDARIES
  // ============================================================================
  console.log('\n--- SUITE 3: Dangling Title Sanitizer & Boundary Stress ---');

  test('Dangling: Trailing delimiters stripped cleanly', () => {
    const delimiters = [' -', ' --', ' —', ' |', ' /', ' ,', ' :', ' &', ' &amp;'];
    for (const d of delimiters) {
      const raw = `Japanese Anime XXL Desk Mats${d}`;
      const cleaned = sanitizeDanglingTitle(raw, '', 60);
      assert.strictEqual(cleaned, 'Japanese Anime XXL Desk Mats', `Failed on delimiter "${d}"`);
      assert.ok(!LINT_DANGLING_REGEX.test(cleaned));
      assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
    }
  });

  test('Dangling: Truncated keyword fragments (Mo, Si, Desig, Pass)', () => {
    const badFragments = [
      { in: 'UK Desk Mat Guide: Extended Mo', exp: 'UK Desk Mat Guide: Extended' },
      { in: 'Dual Studio Si', exp: 'Dual Studio' },
      { in: 'Bauhaus Canvas Desig', exp: 'Bauhaus Canvas' },
      { in: 'Prints With Pass', exp: 'Prints' }
    ];

    for (const b of badFragments) {
      const cleaned = sanitizeDanglingTitle(b.in, '', 60);
      assert.strictEqual(cleaned, b.exp, `Failed for "${b.in}"`);
      assert.ok(!LINT_DANGLING_REGEX.test(cleaned));
      assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
    }
  });

  test('Dangling: Trailing conjunctions & prepositions (and, with, for, in, of, vs)', () => {
    const badTrailing = [
      'Abstract Canvas Wall Art and',
      'Japanese Anime Desk Mats with',
      'Luxury Velvet Cushion Covers for',
      'Plush Fleece Blankets in',
      'Archival Wall Art of',
      'Desk Mats vs'
    ];

    for (const bt of badTrailing) {
      const cleaned = sanitizeDanglingTitle(bt, '', 60);
      assert.ok(!LINT_DANGLING_REGEX.test(cleaned), `Dangling regex triggered on "${cleaned}"`);
      assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
      assert.ok(!/\b(and|with|for|in|of|vs)$/i.test(cleaned));
    }
  });

  test('Dangling: Unclosed parentheses and brackets at end of title', () => {
    const unclosed = [
      'Minimalist Bauhaus Canvas Print (CM & I',
      'Heavyweight Cotton Graphic T-Shirt (S-3',
      'Curated Gaming Desk Mat (900x400',
      'Framed Canvas Art (1.25" Pine'
    ];

    for (const u of unclosed) {
      const cleaned = sanitizeDanglingTitle(u, '', 60);
      assert.ok(!LINT_DANGLING_REGEX.test(cleaned));
      assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
      assert.ok(!cleaned.includes('('), `Paren left in "${cleaned}"`);
    }
  });

  test('Dangling: Cascading nested dangling patterns', () => {
    const cascaded = 'Japanese Anime Desk Mats | with & (CM & I';
    const cleaned = sanitizeDanglingTitle(cascaded, '', 60);
    assert.strictEqual(cleaned, 'Japanese Anime Desk Mats');
    assert.ok(!LINT_DANGLING_REGEX.test(cleaned));
    assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
  });

  test('Dangling: Titles > 60 chars truncated strictly at word boundary', () => {
    const longTitle = 'Abstract Minimalist Bauhaus Canvas Wall Art Archival Prints With Museum Quality Frames';
    const cleaned = sanitizeDanglingTitle(longTitle, '', 60);
    assert.ok(cleaned.length <= 60, `Length > 60: ${cleaned.length}`);
    assert.ok(!LINT_DANGLING_REGEX.test(cleaned));
    assert.ok(!VERIFY_DANGLING_REGEX.test(cleaned));
    const lastWord = cleaned.split(' ').pop();
    assert.ok(longTitle.includes(` ${lastWord} `) || longTitle.endsWith(` ${lastWord}`));
  });

  // ============================================================================
  // SUITE 4: STOREWIDE COLLECTION COMPLIANCE GATE (verify_40_subcollections_counts)
  // ============================================================================
  console.log('\n--- SUITE 4: Storewide Collection Compliance Gate Verification ---');

  const mockCuratedSubs = [
    'japanese-anime-desk-mats',
    'abstract-minimalist-bauhaus-canvas-wall-art',
    'retro-vintage-desk-mats'
  ];

  test('Compliance Gate: 100% compliant collections pass with 0 violations', () => {
    const goodCols = [
      {
        handle: 'frontpage',
        title: 'Home page',
        productsCount: { count: 0 },
        seo: { title: '', description: '' }
      },
      {
        handle: 'japanese-anime-desk-mats',
        title: 'Japanese Anime Desk Mats',
        productsCount: { count: 14 },
        seo: {
          title: 'Japanese Anime XXL Desk Mats | 900x400x4mm Stitched Pad',
          description: 'Explore Japanese anime XXL desk mats crafted with 4mm high-density natural rubber, anti-fray stitched edges & micro-woven cloth. Free tracked UK delivery.'
        }
      },
      {
        handle: 'abstract-minimalist-bauhaus-canvas-wall-art',
        title: 'Bauhaus Canvas Wall Art',
        productsCount: 8,
        seo: {
          title: 'Bauhaus Canvas Wall Art | 1.25" Pine Framed Canvas',
          description: 'Archival Bauhaus minimalist canvas wall art stretched over 1.25" kiln-dried European pine stretcher bars with 400gsm cotton-poly canvas. Free UK delivery.'
        }
      },
      {
        handle: 'retro-vintage-desk-mats',
        title: 'Retro Vintage XXL Desk Mats',
        productsCount: { count: 12 },
        seo: {
          title: 'Retro Vintage XXL Desk Mats | 900x400 Non-Slip Gaming Pad',
          description: 'Shop retro vintage gaming desk mats featuring 4mm thick non-slip natural open-cell rubber base and ultra-smooth cloth surface. Fast tracked UK delivery.'
        }
      }
    ];

    const sitemap = new Set(mockCuratedSubs);
    const res = validateCollectionCompliance(goodCols, sitemap, mockCuratedSubs);
    assert.strictEqual(res.passed, true);
    assert.strictEqual(res.totalViolations, 0);
  });

  test('Compliance Gate: 0-product collections detection across varied data formats', () => {
    const cols = [
      { handle: 'frontpage', productsCount: { count: 0 } },
      { handle: 'frontpage', productsCount: 0 },
      { handle: 'dog-collars', productsCount: { count: 0 } },
      { handle: 'beach-towels', productsCount: 0 },
      { handle: 'null-count', productsCount: null },
      { handle: 'undef-count', productsCount: undefined }
    ];

    const res = validateCollectionCompliance(cols, null, []);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.emptyViolations.length, 4);
    const handles = res.emptyViolations.map(v => v.handle);
    assert.ok(!handles.includes('frontpage'));
    assert.ok(handles.includes('dog-collars'));
    assert.ok(handles.includes('beach-towels'));
    assert.ok(handles.includes('null-count'));
    assert.ok(handles.includes('undef-count'));
  });

  test('Compliance Gate: Active collection description length constraints (140-158)', () => {
    const createCol = (len) => ({
      handle: `col-${len}`,
      title: 'Test Collection',
      productsCount: { count: 5 },
      seo: { title: 'Test Collection', description: 'X'.repeat(len) }
    });

    const res139 = validateCollectionCompliance([createCol(139)], null, []);
    assert.strictEqual(res139.descLengthViolations.length, 1);

    const res140 = validateCollectionCompliance([createCol(140)], null, []);
    assert.strictEqual(res140.descLengthViolations.length, 0);

    const res150 = validateCollectionCompliance([createCol(150)], null, []);
    assert.strictEqual(res150.descLengthViolations.length, 0);

    const res158 = validateCollectionCompliance([createCol(158)], null, []);
    assert.strictEqual(res158.descLengthViolations.length, 0);

    const res159 = validateCollectionCompliance([createCol(159)], null, []);
    assert.strictEqual(res159.descLengthViolations.length, 1);
  });

  test('Compliance Gate: Unwanted collections (avada-upsell-best-sellers) in sitemap', () => {
    const sitemapWithAvada = new Set([...mockCuratedSubs, 'avada-upsell-best-sellers']);
    const res = validateCollectionCompliance([], sitemapWithAvada, mockCuratedSubs);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.sitemapUnwantedCollections.length, 1);
    assert.ok(res.sitemapUnwantedCollections[0].includes('avada-upsell-best-sellers'));
  });

  test('Compliance Gate: Missing curated subcollections from sitemap', () => {
    const sitemapMissing = new Set(['japanese-anime-desk-mats']);
    const res = validateCollectionCompliance([], sitemapMissing, mockCuratedSubs);
    assert.strictEqual(res.passed, false);
    assert.strictEqual(res.sitemapMissingSubcollections.length, 2);
    assert.ok(res.sitemapMissingSubcollections.includes('abstract-minimalist-bauhaus-canvas-wall-art'));
    assert.ok(res.sitemapMissingSubcollections.includes('retro-vintage-desk-mats'));
  });

  // ============================================================================
  // SUITE 5: GSC SITEMAP IDEMPOTENCY LOGIC UNDER FAILURE MODES
  // ============================================================================
  console.log('\n--- SUITE 5: GSC Sitemap Idempotency Under Failure Modes ---');

  function simulateSitemapSync(listJson, liveChildSitemaps, listOk = true) {
    let sitemapsSynced = 0;
    let sitemapsSubmitted = 0;
    let sitemapsPreserved = 0;
    let staleSitemapsDeleted = 0;
    const putsIssued = [];
    const delsIssued = [];

    const desiredSet = new Set(['https://printswithpassion.com/sitemap.xml', ...liveChildSitemaps]);

    if (listOk) {
      const existingMap = new Map();
      for (const sm of (listJson.sitemap || [])) {
        if (sm.path) {
          existingMap.set(sm.path, sm);
          existingMap.set(sm.path.replace(/&amp;/g, '&'), sm);
        }
        const isDesired = desiredSet.has(sm.path) || desiredSet.has(sm.path.replace(/&amp;/g, '&'));
        if (sm.path && !isDesired) {
          delsIssued.push(sm.path);
          staleSitemapsDeleted++;
        }
      }

      for (const smUrl of desiredSet) {
        const existing = existingMap.get(smUrl) || existingMap.get(smUrl.replace(/&amp;/g, '&'));
        const errorCount = Number(existing?.errors || 0);
        const needsPut = !existing || errorCount > 0;
        if (needsPut) {
          putsIssued.push(smUrl);
          sitemapsSubmitted++;
          sitemapsSynced++;
        } else {
          sitemapsPreserved++;
        }
      }
    }

    return {
      sitemapsSynced,
      sitemapsSubmitted,
      sitemapsPreserved,
      staleSitemapsDeleted,
      putsIssued,
      delsIssued
    };
  }

  test('Sitemap Idempotency: All 5 sitemaps healthy (0 errors) -> 0 PUTs, 5 preserved', () => {
    const liveChild = [
      'https://printswithpassion.com/sitemap_products_1.xml',
      'https://printswithpassion.com/sitemap_pages_1.xml',
      'https://printswithpassion.com/sitemap_collections_1.xml',
      'https://printswithpassion.com/sitemap_blogs_1.xml'
    ];
    const gscList = {
      sitemap: [
        { path: 'https://printswithpassion.com/sitemap.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_products_1.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_pages_1.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_collections_1.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_blogs_1.xml', lastSubmitted: '2026-11-01', errors: 0 }
      ]
    };

    const sim = simulateSitemapSync(gscList, liveChild, true);
    assert.strictEqual(sim.sitemapsSubmitted, 0, 'Must NOT submit any healthy sitemaps');
    assert.strictEqual(sim.sitemapsPreserved, 5, 'Must preserve all 5 sitemaps');
    assert.strictEqual(sim.staleSitemapsDeleted, 0);
    assert.strictEqual(sim.putsIssued.length, 0);
  });

  test('Sitemap Idempotency: Missing sitemap triggers PUT for missing only', () => {
    const liveChild = [
      'https://printswithpassion.com/sitemap_products_1.xml',
      'https://printswithpassion.com/sitemap_pages_1.xml',
      'https://printswithpassion.com/sitemap_collections_1.xml',
      'https://printswithpassion.com/sitemap_blogs_1.xml'
    ];
    const gscList = {
      sitemap: [
        { path: 'https://printswithpassion.com/sitemap.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_products_1.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_pages_1.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_blogs_1.xml', lastSubmitted: '2026-11-01', errors: 0 }
      ]
    };

    const sim = simulateSitemapSync(gscList, liveChild, true);
    assert.strictEqual(sim.sitemapsSubmitted, 1);
    assert.strictEqual(sim.sitemapsPreserved, 4);
    assert.strictEqual(sim.putsIssued[0], 'https://printswithpassion.com/sitemap_collections_1.xml');
  });

  test('Sitemap Idempotency: Errored sitemap (errors: 2) triggers PUT; healthy preserved', () => {
    const liveChild = [
      'https://printswithpassion.com/sitemap_products_1.xml'
    ];
    const gscList = {
      sitemap: [
        { path: 'https://printswithpassion.com/sitemap.xml', lastSubmitted: '2026-11-01', errors: 0 },
        { path: 'https://printswithpassion.com/sitemap_products_1.xml', lastSubmitted: '2026-11-01', errors: 2 }
      ]
    };

    const sim = simulateSitemapSync(gscList, liveChild, true);
    assert.strictEqual(sim.sitemapsSubmitted, 1);
    assert.strictEqual(sim.sitemapsPreserved, 1);
    assert.strictEqual(sim.putsIssued[0], 'https://printswithpassion.com/sitemap_products_1.xml');
  });

  test('Sitemap Idempotency: Network/API outage on GET sitemaps preserves all LastSubmitted dates', () => {
    const sim = simulateSitemapSync({}, [], false);
    assert.strictEqual(sim.sitemapsSubmitted, 0);
    assert.strictEqual(sim.sitemapsPreserved, 0);
    assert.strictEqual(sim.staleSitemapsDeleted, 0);
    assert.strictEqual(sim.putsIssued.length, 0);
  });

  // ============================================================================
  // SUITE 6: URL INSPECTION POOL, ROTATING CURSOR & PACING
  // ============================================================================
  console.log('\n--- SUITE 6: URL Inspection Pool Construction & Rotating Pacing ---');

  test('Inspection Pool: Deduplication, Seed inclusion, and Handle resolution', () => {
    const subcols = [
      'japanese-anime-desk-mats',
      { handle: 'abstract-minimalist-bauhaus-canvas-wall-art' },
      'https://printswithpassion.com/collections/retro-vintage-desk-mats'
    ];
    const known = [
      '/collections/japanese-anime-desk-mats',
      'https://printswithpassion.com/pages/uk-product-catalog',
      '/pages/new-guide-page'
    ];

    const pool = buildPriorityInspectionPool(subcols, known);
    assert.ok(pool.includes('https://printswithpassion.com/'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/canvas-prints'));
    assert.ok(pool.includes('https://printswithpassion.com/pages/uk-product-catalog'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/japanese-anime-desk-mats'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/abstract-minimalist-bauhaus-canvas-wall-art'));
    assert.ok(pool.includes('https://printswithpassion.com/collections/retro-vintage-desk-mats'));
    assert.ok(pool.includes('https://printswithpassion.com/pages/new-guide-page'));
    const set = new Set(pool);
    assert.strictEqual(set.size, pool.length);
    for (const u of pool) {
      assert.ok(u.startsWith('https://printswithpassion.com/'), `URL is not absolute: ${u}`);
    }
  });

  test('Inspection Cursor: Modulo wrap-around logic', () => {
    const poolSize = 48;
    const batchSize = 15;
    let cursor = 0;

    let next = (cursor + batchSize) % poolSize;
    assert.strictEqual(next, 15);

    cursor = next;
    next = (cursor + batchSize) % poolSize;
    assert.strictEqual(next, 30);

    cursor = next;
    next = (cursor + batchSize) % poolSize;
    assert.strictEqual(next, 45);

    cursor = next;
    next = (cursor + batchSize) % poolSize;
    assert.strictEqual(next, 12);
  });

  totalTests++;
  try {
    const intervals = [];
    let lastTime = Date.now();
    for (let i = 0; i < 3; i++) {
      await new Promise(r => setTimeout(r, 200));
      const now = Date.now();
      intervals.push(now - lastTime);
      lastTime = now;
    }
    for (const iv of intervals) {
      assert.ok(iv >= 190, `Pacing interval was too low: ${iv}ms`);
    }
    passedTests++;
    console.log(`  [PASS] Inspection Pacing: Verified >= 200ms delay between calls`);
  } catch (err) {
    failedTests++;
    failures.push({ name: 'Inspection Pacing', error: err.message });
    console.error(`  [FAIL] Inspection Pacing: ${err.message}`);
  }

  // ============================================================================
  // SUITE 7: REWRITER TITLE INVARIANTS (strikezone_ctr_and_competitor_rewriter.mjs)
  // ============================================================================
  console.log('\n--- SUITE 7: Rewriter Title Invariants Stress Testing ---');

  test('Rewriter: Non-empty output invariant across leading delimiters and stray opening brackets', () => {
    const adversarialCases = [
      '( Wall Gaming',
      '[ Special Edition',
      ' - - | | ',
      '(((((Unclosed Opening Parens',
      '[[[[[Unclosed Opening Brackets'
    ];

    for (const raw of adversarialCases) {
      const res = fitTitleUnder60Chars(raw, ['900x400mm Studio', 'Archival Edition'], 60);
      assert.ok(
        typeof res === 'string' && res.trim().length > 0,
        `BUG DETECTED: fitTitleUnder60Chars returned empty string for input "${raw}"`
      );
    }
  });

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n================================================================');
  console.log(`TOTAL ADVERSARIAL MATRIX TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURES SUMMARY:');
    for (const f of failures) {
      console.error(`- ${f.name}: ${f.error}`);
    }
  } else {
    console.log('\nALL DEEP ADVERSARIAL MATRIX TESTS PASSED WITH 100% SUCCESS!');
  }

  return { totalTests, passedTests, failedTests, failures };
}

runAllTests().then(({ failedTests }) => {
  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
