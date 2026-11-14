import fs from 'fs';
import path from 'path';

export function fitTitleUnder60CharsProposed(primaryPart, specCandidates = [], maxChars = 60) {
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
      // Strip trailing delimiters/punctuation: -, |, &, :, ;, ,, /, \, ~, +, (, [
      // Safe: never strip valid closing delimiters ) or ]
      s = s.replace(/[\s\-_|&:,;/\\~+(\[]+$/, '').trim();
      // Strip trailing conjunctions, prepositions, and stop-words
      s = s.replace(/\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i, '').trim();
    }
    return s;
  };

  const balanceBrackets = (str) => {
    let s = str || '';
    // Iteratively balance parentheses
    while ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) {
      const lastOpen = s.lastIndexOf('(');
      if (lastOpen === -1) break;
      s = s.slice(0, lastOpen);
      s = stripTrailingDangling(s);
    }
    while ((s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) {
      const lastClose = s.lastIndexOf(')');
      if (lastClose === -1) break;
      s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      s = stripTrailingDangling(s);
    }

    // Iteratively balance brackets
    while ((s.match(/\[/g) || []).length > (s.match(/\]/g) || []).length) {
      const lastOpen = s.lastIndexOf('[');
      if (lastOpen === -1) break;
      s = s.slice(0, lastOpen);
      s = stripTrailingDangling(s);
    }
    while ((s.match(/\]/g) || []).length > (s.match(/\[/g) || []).length) {
      const lastClose = s.lastIndexOf(']');
      if (lastClose === -1) break;
      s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      s = stripTrailingDangling(s);
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

// Test cases
const testCases = [
  { input: ' - - | | ', expected: 'Prints With Passion', label: 'Punctuation-only string' },
  { input: 'Japanese Desk Mat (UK Studio Series (Vol 1', expected: 'Japanese Desk Mat', label: 'Nested unclosed parens' },
  { input: 'Title (Vol 1))', expected: 'Title (Vol 1)', label: 'Excess trailing closing paren' },
  { input: 'Shop Art [Special Edition [Vol 1', expected: 'Shop Art', label: 'Nested unclosed brackets' },
  { input: 'Title [Vol 1]]', expected: 'Title [Vol 1]', label: 'Excess trailing closing bracket' },
  { input: 'Title [Vol 1]', expected: 'Title [Vol 1]', label: 'Valid brackets preserved' },
  { input: 'Title (Vol 1)', expected: 'Title (Vol 1)', label: 'Valid parens preserved' },
  { input: 'Japanese Anime Desk Mats | ( [', expected: 'Japanese Anime Desk Mats', label: 'Trailing open delimiters' },
  { input: 'Japanese Anime Desk Mats | - & : ; , / \\ ~ +', expected: 'Japanese Anime Desk Mats', label: 'Trailing punctuation chain' },
  { input: '', expected: 'Prints With Passion', label: 'Empty string' },
  { input: '   ', expected: 'Prints With Passion', label: 'Whitespace string' },
  { input: null, expected: 'Prints With Passion', label: 'Null input' },
  { input: undefined, expected: 'Prints With Passion', label: 'Undefined input' },
  { input: 'Minimalist Bauhaus Art | Framed Canvas Prints (CM & Inch)', expected: 'Minimalist Bauhaus Art | Framed Canvas Prints (CM & Inch)', label: 'Preserves balanced 57-char title' }
];

let allPassed = true;
for (const tc of testCases) {
  const res = fitTitleUnder60CharsProposed(tc.input);
  const pass = res === tc.expected;
  if (!pass) allPassed = false;
  console.log(`${pass ? 'PASS' : 'FAIL'}: [${tc.label}] Expected "${tc.expected}", got "${res}"`);
}

if (!allPassed) {
  console.error('\nSOME TESTS FAILED!');
  process.exit(1);
} else {
  console.log('\nALL 14 TEST CASES PASSED PERFECTLY!');
}
