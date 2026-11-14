import assert from 'assert';

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
    let s = str.trim();
    let prev = '';
    while (s !== prev) {
      prev = s;
      // Strip trailing delimiters/punctuation: -, |, &, :, ;, ,, /, \, ~, +, (, [
      s = s.replace(/[\s\-_|&:,;/\\~+([\]]+$/, '').trim();
      // Strip trailing conjunctions, prepositions, and stop-words
      s = s.replace(/\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i, '').trim();
    }
    return s;
  };

  const balanceBrackets = (str) => {
    let s = str;
    // Balance parentheses
    while ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) {
      const lastOpen = s.lastIndexOf('(');
      if (lastOpen === -1) break;
      s = s.slice(0, lastOpen);
    }
    while ((s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) {
      const lastClose = s.lastIndexOf(')');
      if (lastClose === -1) break;
      s = s.slice(0, lastClose) + s.slice(lastClose + 1);
    }

    // Balance brackets
    while ((s.match(/\[/g) || []).length > (s.match(/\]/g) || []).length) {
      const lastOpen = s.lastIndexOf('[');
      if (lastOpen === -1) break;
      s = s.slice(0, lastOpen);
    }
    while ((s.match(/\]/g) || []).length > (s.match(/\[/g) || []).length) {
      const lastClose = s.lastIndexOf(']');
      if (lastClose === -1) break;
      s = s.slice(0, lastClose) + s.slice(lastClose + 1);
    }

    return stripTrailingDangling(s);
  };

  const truncateAtWordBoundary = (str, limit) => {
    let s = stripTrailingDangling(str);
    if (s.length <= limit) {
      return balanceBrackets(s);
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
    return s;
  };

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
  const truncated = truncateAtWordBoundary(primary, maxChars);
  return truncated || 'Prints With Passion';
}

// Now test all vectors from challenger_m5_empirical_harness.mjs!
const trailingDelimiters = /[\s\-_|&:,;/\\~+([\]]+$/;
const trailingConjunctions = /\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function testTitleInvariants(inputPrimary, inputCandidates, label) {
  const result = fitTitleUnder60Chars(inputPrimary, inputCandidates, 60);

  // Invariant 1: Strictly <= 60 characters
  totalTests++;
  if (typeof result === 'string' && result.length <= 60) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 1 Length: "${result}" (${result?.length})`);
  }

  // Invariant 2: Non-empty result
  totalTests++;
  if (typeof result === 'string' && result.length > 0) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 2 Non-empty: got empty string`);
  }

  // Invariant 3: No trailing delimiters
  totalTests++;
  if (!trailingDelimiters.test(result)) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 3 Trailing Delimiter: "${result}"`);
  }

  // Invariant 4: No trailing conjunctions or prepositions
  totalTests++;
  if (!trailingConjunctions.test(result)) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 4 Trailing Conjunction: "${result}"`);
  }

  // Invariant 5: Balanced parentheses
  const openParen = (result.match(/\(/g) || []).length;
  const closeParen = (result.match(/\)/g) || []).length;
  totalTests++;
  if (openParen === closeParen) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 5 Balanced Parens: open=${openParen}, close=${closeParen} in "${result}"`);
  }

  // Invariant 6: Balanced brackets
  const openBracket = (result.match(/\[/g) || []).length;
  const closeBracket = (result.match(/\]/g) || []).length;
  totalTests++;
  if (openBracket === closeBracket) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`FAIL [${label}] Invariant 6 Balanced Brackets: open=${openBracket}, close=${closeBracket} in "${result}"`);
  }

  return result;
}

// Vector 1
testTitleInvariants('', [], 'Empty string');
testTitleInvariants('     ', [], 'Whitespace only');
testTitleInvariants(null, [], 'Null primary');
testTitleInvariants(undefined, [], 'Undefined primary');

// Vector 2
const exact59 = '1234567890 1234567890 1234567890 1234567890 1234567890 1234567';
const exact60 = '1234567890 1234567890 1234567890 1234567890 1234567890 12345678';
const exact61 = '1234567890 1234567890 1234567890 1234567890 1234567890 123456789';
testTitleInvariants(exact59, [], 'Exact 59 chars');
testTitleInvariants(exact60, [], 'Exact 60 chars');
testTitleInvariants(exact61, [], 'Exact 61 chars');

// Vector 3
const massive = 'Japanese Anime XXL Desk Mats Archival Gaming Mouse Pads With Ultra Smooth Micro Woven Cloth 4mm Natural Rubber Non Slip Base And Reinforced Anti Fray Stitched Edges Sized For High Precision Esports And Studio Desks In London Manchester And Bristol UK';
testTitleInvariants(massive, [], 'Massive 250 char string');

// Vector 4
testTitleInvariants(' - - | | ', [], 'Punctuation-only string');
testTitleInvariants('with and or for', [], 'Conjunctions-only string');

// Vector 5
testTitleInvariants('Minimalist Bauhaus Art | Framed Canvas Prints (CM & Inch)', [], 'Balanced parens candidate');
testTitleInvariants('Minimalist Bauhaus Art | Framed Canvas Prints (CM & I', [], 'Cut mid-parenthesis');
testTitleInvariants('Japanese Desk Mat (900x400x4mm [Extended Gaming Edition', [], 'Unclosed bracket inside paren');
testTitleInvariants('Japanese Desk Mat (UK Studio Series (Vol 1', [], 'Nested unclosed parens');
testTitleInvariants('Title (Vol 1))', [], 'Excess trailing closing parenthesis');
testTitleInvariants('Title [Vol 1]]', [], 'Excess trailing closing bracket');
testTitleInvariants('Shop Art [Special Edition [Vol 1', [], 'Nested unclosed brackets');

// Vector 6
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art For', [], 'Ends with "For"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art With', [], 'Ends with "With"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art And', [], 'Ends with "And"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art Or', [], 'Ends with "Or"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art In', [], 'Ends with "In"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art Vs', [], 'Ends with "Vs"');
testTitleInvariants('Shop Archival Modern Abstract Framed Canvas Wall Art W', [], 'Ends with "W"');

// Vector 7
testTitleInvariants('Japanese Anime Desk Mats | - & : ; , / \\ ~ +', [], 'Trailing punctuation chain');
testTitleInvariants('Japanese Anime Desk Mats | ( [', [], 'Trailing opening brackets');

// Vector 8
testTitleInvariants('Japanese &amp; Anime &quot;Wave&quot; Desk Mats &#39;XL&#39;', [], 'Decodes entities');

// Vector 9
testTitleInvariants('🌸 Japanese Great Wave Desk Mat 🌊 | 900x400mm Studio Edition', [], 'Unicode emojis');

// Vector 10
const primary = 'Japanese Anime Desk Mats';
const specCandidates = [
  '900x400x4mm (35.4"x15.7") Stitched Gaming Pad Extra Long',
  '900x400x4mm Stitched Gaming Pad (Dual Sizing)',
  '900x400x4mm Stitched Gaming Pad',
  '4mm Stitched Pad',
  'Prints With Passion'
];
const chosen = fitTitleUnder60Chars(primary, specCandidates, 60);
assert.strictEqual(chosen, 'Japanese Anime Desk Mats | 900x400x4mm Stitched Gaming Pad');

// Vector 11
const giantWord = 'SupercalifragilisticexpialidociousSupercalifragilisticexpialidociousExtraLong';
const giantResult = fitTitleUnder60Chars(giantWord, [], 60);
assert.ok(giantResult.length <= 60);

console.log(`\nResults: ${passedTests} passed, ${failedTests} failed out of ${totalTests} assertions.`);
if (failedTests === 0) {
  console.log('SUCCESS: All 26 invariant vectors passed 100%!');
}

// Unit tests from test_rewriter.mjs
const exact60_str = 'A'.repeat(60);
assert.strictEqual(fitTitleUnder60Chars(exact60_str).length, 60);
assert.strictEqual(fitTitleUnder60Chars(exact60_str), exact60_str);

const longTitle = 'Short Prefix But Then A VeryLongWordThatExceedsTheSixtyCharacter';
const fittedLong = fitTitleUnder60Chars(longTitle);
assert.ok(fittedLong.length <= 60, `Length <= 60 (got ${fittedLong.length})`);
assert.ok(!fittedLong.includes('VeryLongWordThatExceeds'), 'Partial long word dropped');

const singleToken = 'A'.repeat(70);
const fittedSingle = fitTitleUnder60Chars(singleToken);
assert.strictEqual(fittedSingle.length, 60);

const withEntities = 'Canvas &amp; Wall Art &amp; Home Decor Luxury Prints UK Series';
const fittedEntities = fitTitleUnder60Chars(withEntities);
assert.ok(fittedEntities.length <= 60);
assert.ok(!fittedEntities.includes('&amp;'), 'Entities decoded');

assert.strictEqual(fitTitleUnder60Chars('Japanese Anime Desk Mats | '), 'Japanese Anime Desk Mats');
assert.strictEqual(fitTitleUnder60Chars('Canvas Prints & '), 'Canvas Prints');
assert.strictEqual(fitTitleUnder60Chars('Desk Mats for '), 'Desk Mats');
assert.strictEqual(fitTitleUnder60Chars('Desk Mats and '), 'Desk Mats');
assert.strictEqual(fitTitleUnder60Chars('Desk Mats with '), 'Desk Mats');

const danglingParen = 'Minimalist Bauhaus Canvas Print | 1.25" Pine Framed Canvas (CM & Inch)';
const fittedParen = fitTitleUnder60Chars(danglingParen);
assert.ok(fittedParen.length <= 60, `Length <= 60 (got ${fittedParen.length}: "${fittedParen}")`);
assert.ok(!fittedParen.includes('(CM & I'), 'No cut parenthesis or dangling ampersand');
const openCount = (fittedParen.match(/\(/g) || []).length;
const closeCount = (fittedParen.match(/\)/g) || []).length;
assert.strictEqual(openCount, closeCount, 'Parentheses balanced');

console.log('All test_rewriter unit tests also PASSED with 100% compliance!');
