/**
 * Comprehensive Integration Verification Runner
 * (run_all_adversarial_suites_against_proposed_blueprint.mjs)
 *
 * Runs all adversarial and regression test cases from:
 * 1. tests/adversarial_challenger_m5_iteration2_edge_cases.mjs
 * 2. tests/reviewer_adversarial_deep_dive.mjs
 * 3. tests/challenger_m5_r2_adversarial_matrix.mjs (Suite 1, 2, 3, 7)
 * 4. tests/challenger_m5_empirical_harness.mjs (Suite 1 & 2)
 * 5. tests/adversarial_challenger_m5_lint_and_collections.mjs
 */

import assert from 'assert';

// =========================================================================
// 1. PROPOSED BLUEPRINT IMPLEMENTATIONS
// =========================================================================

export function fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60) {
  const cleanPart = (str) => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .replace(/\s+/g, ' ');
  };

  const stripTrailingDangling = (str) => {
    let s = (str || '').trim();
    let prev = '';
    while (s !== prev) {
      prev = s;
      // Strip empty parentheses and brackets anywhere
      s = s.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').trim();
      // Strip trailing delimiters/punctuation: -, |, &, :, ;, ,, /, \, ~, +, (, [ (NOT closing ')' or ']')
      s = s.replace(/[\s\-_|&:,;/\\~+(\[]+$/, '').trim();
      // Strip trailing conjunctions, prepositions, and stop-words
      s = s.replace(/\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i, '').trim();
    }
    return s;
  };

  const balanceBrackets = (str) => {
    let s = str;
    let prev = '';
    while (s !== prev) {
      prev = s;

      // Iteratively balance parentheses: unclosed '('
      while ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) {
        const lastOpen = s.lastIndexOf('(');
        if (lastOpen === -1) break;
        const prefix = s.slice(0, lastOpen);
        if (!/[a-zA-Z0-9]/.test(prefix)) {
          // If no substantive text precedes '(', strip just the unclosed character
          s = s.slice(0, lastOpen) + s.slice(lastOpen + 1);
        } else {
          // If substantive text precedes '(', strip the unclosed trailing specification
          s = prefix;
        }
      }

      // Iteratively balance parentheses: excess ')'
      while ((s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) {
        const lastClose = s.lastIndexOf(')');
        if (lastClose === -1) break;
        s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      }

      // Iteratively balance brackets: unclosed '['
      while ((s.match(/\[/g) || []).length > (s.match(/\]/g) || []).length) {
        const lastOpen = s.lastIndexOf('[');
        if (lastOpen === -1) break;
        const prefix = s.slice(0, lastOpen);
        if (!/[a-zA-Z0-9]/.test(prefix)) {
          // If no substantive text precedes '[', strip just the unclosed character
          s = s.slice(0, lastOpen) + s.slice(lastOpen + 1);
        } else {
          // If substantive text precedes '[', strip the unclosed trailing specification
          s = prefix;
        }
      }

      // Iteratively balance brackets: excess ']'
      while ((s.match(/\]/g) || []).length > (s.match(/\[/g) || []).length) {
        const lastClose = s.lastIndexOf(']');
        if (lastClose === -1) break;
        s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      }

      s = stripTrailingDangling(s);
    }

    return s;
  };

  const truncateAtWordBoundary = (str, limit) => {
    let s = stripTrailingDangling(str);
    if (!s) return 'Prints With Passion';
    if (s.length <= limit) {
      const balanced = balanceBrackets(s);
      return balanced || 'Prints With Passion';
    }
    const sliced = s.slice(0, limit);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace > 0) {
      s = sliced.slice(0, lastSpace);
    } else {
      s = sliced;
    }
    s = stripTrailingDangling(s);
    s = balanceBrackets(s);
    if (s.length > limit) {
      s = s.slice(0, limit);
      s = stripTrailingDangling(s);
      s = balanceBrackets(s);
    }
    return s || 'Prints With Passion';
  };

  // Clean and pre-strip trailing delimiters upfront
  let primary = stripTrailingDangling(cleanPart(primaryPart));
  if (!primary) return 'Prints With Passion';

  const candidates = Array.isArray(specCandidates)
    ? specCandidates.map(cleanPart).filter(Boolean)
    : [cleanPart(specCandidates)].filter(Boolean);

  // 1. Evaluate candidate specs in order (longest/richest first)
  for (const cand of candidates) {
    const full = cand ? `${primary} | ${cand}` : primary;
    if (full.length <= maxChars) {
      const balanced = balanceBrackets(stripTrailingDangling(full));
      if (balanced && balanced.length <= maxChars) {
        return balanced;
      }
    }
  }

  // 2. Fall back to primaryPart alone if it fits
  if (primary.length <= maxChars) {
    const balanced = balanceBrackets(stripTrailingDangling(primary));
    if (balanced && balanced.length <= maxChars) {
      return balanced;
    }
  }

  // 3. Truncate primaryPart cleanly at word boundary
  const result = truncateAtWordBoundary(primary, maxChars);
  return result || 'Prints With Passion';
}

export function unescapeHtmlEntities(str, isHtml = false) {
  if (!str) return '';
  let s = String(str);
  let prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/&amp;quot;/gi, '&quot;')
         .replace(/&amp;apos;/gi, '&apos;')
         .replace(/&amp;#39;/gi, '&#39;')
         .replace(/&amp;amp;/gi, '&amp;')
         .replace(/&amp;lt;/gi, '&lt;')
         .replace(/&amp;gt;/gi, '&gt;')
         .replace(/&amp;nbsp;/gi, '&nbsp;');
  }
  if (!isHtml) {
    s = s.replace(/&quot;/gi, '"')
         .replace(/&(?:apos|#39);/gi, "'")
         .replace(/&amp;/gi, '&')
         .replace(/&lt;/gi, '<')
         .replace(/&gt;/gi, '>')
         .replace(/&nbsp;/gi, ' ');
  }
  return s;
}

export function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = unescapeHtmlEntities(desc, false);
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)(?:\d*\.\d+|[^\.\n])*\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)(?:\d*\.\d+|[^\.\n])*\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)(?:\d*\.\d+|[^\.\n])*\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)(?:\d*\.\d+|[^\.\n])*\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)(?:\d*\.\d+|[^\.\n])*\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+((?:\d*\.\d+|[^\.\n])+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}

// =========================================================================
// 2. TEST EXECUTION
// =========================================================================

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}: ${err.message}`);
    throw err;
  }
}

console.log('=== RUNNING COMPREHENSIVE INTEGRATION SUITE ===\n');

// --- Challenger 1 Iteration 2 Edge Cases ---
console.log('--- Challenger 1 Iteration 2 Edge Cases ---');
runTest('C1: (Exclusive Desk Mats non-empty and substantive', () => {
  const r = fitTitleUnder60Chars('(Exclusive Desk Mats', [], 60);
  assert.ok(r && r.length > 0);
  assert.ok(r.includes('Exclusive Desk Mats'));
  assert.strictEqual(r, 'Exclusive Desk Mats');
});

runTest('C1: [Exclusive Desk Mats non-empty and substantive', () => {
  const r = fitTitleUnder60Chars('[Exclusive Desk Mats', [], 60);
  assert.ok(r && r.length > 0);
  assert.ok(r.includes('Exclusive Desk Mats'));
  assert.strictEqual(r, 'Exclusive Desk Mats');
});

runTest('C1: Preserves valid bracketed tag [UK Edition]', () => {
  const r = fitTitleUnder60Chars('Japanese Anime Desk Mats [UK Edition]', [], 60);
  assert.ok(r.includes('[UK Edition]'));
  assert.strictEqual(r, 'Japanese Anime Desk Mats [UK Edition]');
});

runTest('C1: Preserves completely bracketed title [Desk Mats]', () => {
  const r = fitTitleUnder60Chars('[Desk Mats]', [], 60);
  assert.ok(r && r.length > 0);
  assert.strictEqual(r, '[Desk Mats]');
});

runTest('C1: ( Wall Gaming with candidate', () => {
  const r = fitTitleUnder60Chars('( Wall Gaming', ['900x400mm Studio'], 60);
  assert.ok(r && r.length > 0);
  assert.strictEqual(r, 'Wall Gaming | 900x400mm Studio');
});

// --- Reviewer 1 Deep Dive Cases ---
console.log('\n--- Reviewer 1 Deep Dive Cases ---');
runTest('R1: Unclosed parenthesis at start of string', () => {
  const r = fitTitleUnder60Chars('(UK Edition Japanese Desk Mat', ['900x400x4mm Stitched Pad', 'XXL Desk Mats'], 60);
  assert.ok(r && r.length > 0);
  assert.ok(!r.startsWith('('));
});

runTest('R1: Unclosed bracket at start of string', () => {
  const r = fitTitleUnder60Chars('[UK Series Japanese Desk Mat', ['900x400x4mm Stitched Pad', 'XXL Desk Mats'], 60);
  assert.ok(r && r.length > 0);
  assert.ok(!r.startsWith('['));
});

runTest('R1: Multiple unclosed parens at start', () => {
  const r = fitTitleUnder60Chars('((((Extreme Unclosed Parens', ['900x400x4mm Stitched Pad', 'XXL Desk Mats'], 60);
  assert.ok(r && r.length > 0);
  assert.strictEqual(r, 'Extreme Unclosed Parens | 900x400x4mm Stitched Pad');
});

runTest('R1: Empty parentheses only resolves to fallback', () => {
  const r = fitTitleUnder60Chars('()', [], 60);
  assert.ok(r && r.length > 0);
  assert.notStrictEqual(r, '()');
  assert.strictEqual(r, 'Prints With Passion');
});

// --- Challenger 2 Matrix Cases (Bug 1 & Bug 2) ---
console.log('\n--- Challenger 2 Adversarial Matrix Cases ---');
runTest('C2 Bug 1: Decimal point in canvas stretcher bar dimensions (1.25")', () => {
  const input = 'Transform with Canvas Wall Art (1.25" Pine Bars). Studio prints.';
  const r = sanitizeTemplateGrammar(input);
  assert.strictEqual(r.includes('25" Pine Bars'), false);
  assert.strictEqual(r, 'Archival framed canvas wall art on 1.25" European pine frames. Studio prints.');
});

runTest('C2 Bug 2: Rewriter non-empty output across adversarial inputs', () => {
  const cases = [
    '( Wall Gaming',
    '[ Special Edition',
    ' - - | | ',
    '(((((Unclosed Opening Parens',
    '[[[[[Unclosed Opening Brackets'
  ];
  for (const raw of cases) {
    const res = fitTitleUnder60Chars(raw, ['900x400mm Studio', 'Archival Edition'], 60);
    assert.ok(typeof res === 'string' && res.trim().length > 0, `Returned empty for ${raw}`);
  }
});

// --- All Template Categories ---
console.log('\n--- Template Action Verbs ---');
runTest('Template: Action verbs and category descriptions', () => {
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
    assert.strictEqual(res, t.exp);
  }
});

// --- Challenger 1 Empirical Harness Title Invariants (Aligned trailingDelimiters) ---
console.log('\n--- Challenger 1 Empirical Harness Invariants (Aligned) ---');
const alignedTrailingDelimiters = /[\s\-_|&:,;/\\~+(\[]+$/;
const trailingConjunctions = /\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i;

const c1Invariants = [
  ['', [], 'Empty string'],
  ['     ', [], 'Whitespace only'],
  [null, [], 'Null primary'],
  [undefined, [], 'Undefined primary'],
  ['1234567890 1234567890 1234567890 1234567890 1234567890 1234567', [], 'Exact 59 chars'],
  ['1234567890 1234567890 1234567890 1234567890 1234567890 12345678', [], 'Exact 60 chars'],
  ['1234567890 1234567890 1234567890 1234567890 1234567890 123456789', [], 'Exact 61 chars'],
  ['Japanese Anime XXL Desk Mats Archival Gaming Mouse Pads With Ultra Smooth Micro Woven Cloth 4mm Natural Rubber Non Slip Base And Reinforced Anti Fray Stitched Edges Sized For High Precision Esports And Studio Desks In London Manchester And Bristol UK', [], 'Massive 250 char string'],
  [' - - | | ', [], 'Punctuation-only string'],
  ['with and or for', [], 'Conjunctions-only string'],
  ['Minimalist Bauhaus Art | Framed Canvas Prints (CM & Inch)', [], 'Balanced parens candidate'],
  ['Minimalist Bauhaus Art | Framed Canvas Prints (CM & I', [], 'Cut mid-parenthesis'],
  ['Japanese Desk Mat (900x400x4mm [Extended Gaming Edition', [], 'Unclosed bracket inside paren'],
  ['Japanese Desk Mat (UK Studio Series (Vol 1', [], 'Nested unclosed parens'],
  ['Title (Vol 1))', [], 'Excess trailing closing parenthesis'],
  ['Title [Vol 1]]', [], 'Excess trailing closing bracket'],
  ['Shop Art [Special Edition [Vol 1', [], 'Nested unclosed brackets'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art For', [], 'Ends with "For"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art With', [], 'Ends with "With"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art And', [], 'Ends with "And"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art Or', [], 'Ends with "Or"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art In', [], 'Ends with "In"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art Vs', [], 'Ends with "Vs"'],
  ['Shop Archival Modern Abstract Framed Canvas Wall Art W', [], 'Ends with "W"'],
  ['Japanese Anime Desk Mats | - & : ; , / \\ ~ +', [], 'Trailing punctuation chain'],
  ['Japanese Anime Desk Mats | ( [', [], 'Trailing opening brackets'],
  ['🌸 Japanese Great Wave Desk Mat 🌊 | 900x400mm Studio Edition', [], 'Unicode emojis']
];

for (const [p, c, l] of c1Invariants) {
  runTest(`C1 Invariant: ${l}`, () => {
    const res = fitTitleUnder60Chars(p, c, 60);
    assert.ok(typeof res === 'string' && res.length <= 60, 'Length <= 60');
    assert.ok(typeof res === 'string' && res.length > 0, 'Non-empty');
    assert.ok(!alignedTrailingDelimiters.test(res), `No trailing delimiter: ${res}`);
    assert.ok(!trailingConjunctions.test(res), `No trailing conjunction: ${res}`);
    const openP = (res.match(/\(/g) || []).length;
    const closeP = (res.match(/\)/g) || []).length;
    assert.strictEqual(openP, closeP, `Balanced parens: ${res}`);
    const openB = (res.match(/\[/g) || []).length;
    const closeB = (res.match(/\]/g) || []).length;
    assert.strictEqual(openB, closeB, `Balanced brackets: ${res}`);
  });
}

console.log(`\n================================================================`);
console.log(`TOTAL TESTS: ${total}`);
console.log(`PASSED:      ${passed}`);
console.log(`FAILED:      ${total - passed}`);
console.log(`================================================================`);
console.log(`ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!`);
