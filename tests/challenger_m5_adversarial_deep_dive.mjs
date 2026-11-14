/**
 * Prints With Passion — Milestone 5 Challenger Deep Adversarial Dive
 * (tests/challenger_m5_adversarial_deep_dive.mjs)
 *
 * Authored by Challenger 1 (Milestone 5 Iteration 2).
 * Deep empirical fuzzing and boundary stress-testing.
 */

import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../strikezone_ctr_and_competitor_rewriter.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
    if (Object.keys(details).length) {
      console.error(`        Details:`, details);
    }
    failures.push({ message, details });
  }
}

const trailingDelimiters = /[\s\-_|&:,;/\\~+([\]]+$/;
const trailingConjunctions = /\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i;

function verifyTitleInvariants(result, label, originalInput) {
  assert(
    typeof result === 'string' && result.length <= 60,
    `[${label}] Length <= 60 (got ${result?.length}: "${result}")`,
    { result, length: result?.length, originalInput }
  );

  assert(
    typeof result === 'string' && result.length > 0,
    `[${label}] Non-empty output (got "${result}")`,
    { result, originalInput }
  );

  assert(
    !trailingDelimiters.test(result),
    `[${label}] No trailing delimiters (got "${result}")`,
    { result, originalInput }
  );

  assert(
    !trailingConjunctions.test(result),
    `[${label}] No trailing conjunctions (got "${result}")`,
    { result, originalInput }
  );

  const openParen = (result.match(/\(/g) || []).length;
  const closeParen = (result.match(/\)/g) || []).length;
  assert(
    openParen === closeParen,
    `[${label}] Balanced parens (open: ${openParen}, close: ${closeParen} in "${result}")`,
    { result, openParen, closeParen, originalInput }
  );

  const openBracket = (result.match(/\[/g) || []).length;
  const closeBracket = (result.match(/\]/g) || []).length;
  assert(
    openBracket === closeBracket,
    `[${label}] Balanced brackets (open: ${openBracket}, close: ${closeBracket} in "${result}")`,
    { result, openBracket, closeBracket, originalInput }
  );
}

console.log('--- SECTION 1: Combinatorial Bracket & Delimiter Fuzzing (1,000 cases) ---');

const words = ['Desk', 'Mat', 'Prints', 'Passion', 'Art', 'Wall', 'Decor', 'Canvas', 'XL', 'UK', 'Gaming', 'Studio', 'Series', 'Edition'];
const brackets = ['(', ')', '[', ']', ' - ', ' | ', ' & ', ' / ', ' ~ ', ' : '];

for (let i = 0; i < 1000; i++) {
  // Generate pseudo-random title with arbitrary bracket mismatches
  const numTokens = 3 + (i % 12);
  let tokens = [];
  for (let j = 0; j < numTokens; j++) {
    if ((i + j) % 3 === 0) {
      tokens.push(brackets[(i * 7 + j * 13) % brackets.length]);
    } else {
      tokens.push(words[(i * 3 + j * 5) % words.length]);
    }
  }
  const rawTitle = tokens.join(' ');
  const res = fitTitleUnder60Chars(rawTitle, ['900x400mm Studio', 'Archival Edition'], 60);
  verifyTitleInvariants(res, `Fuzz ${i}`, rawTitle);
}

console.log('--- SECTION 2: Tricky Bracket Nesting & Mismatches ---');

const trickyCases = [
  '((((((Open Parens Galore',
  '))))))Close Parens Galore',
  '[[[[[[Open Brackets Galore',
  ']]]]]]Close Brackets Galore',
  '([([([Mixed Nested Opening Delimiters',
  ')])])])Mixed Nested Closing Delimiters',
  'Desk Mat (UK (London (Studio (Edition) Series',
  'Canvas Art [Archival [Pine [Frames [UK] Edition',
  'Wall Decor () [] () [] ()',
  'Wall Decor ( ) [ ] ( )',
  'Shop (UK) [2026] (Series) [Deluxe] (Final) Extra Words Over Limit Here',
  'Desk Mat (Special) & (UK) | [Limited] & [Edition] And More Long Text Words',
  'PWP Art (Vol 1) (Vol 2) (Vol 3 (Vol 4',
  'PWP Art [Vol 1] [Vol 2] [Vol 3 [Vol 4',
  'Art (A (B) C (D) E',
  'Art [A [B] C [D] E',
  'Art (A [B) C] D',
  'Art [A (B] C) D'
];

for (const tc of trickyCases) {
  const res = fitTitleUnder60Chars(tc, [], 60);
  verifyTitleInvariants(res, `Tricky: ${tc.slice(0, 20)}`, tc);
}

console.log('--- SECTION 3: Delimiter Only, Whitespace, & Null Candidates ---');

const edgeCandidates = [
  null,
  undefined,
  [],
  [''],
  ['   '],
  [' - - | '],
  [null, undefined, 'Valid Candidate'],
  ['(Unclosed Candidate', '[Unclosed Bracket Candidate'],
  ['Valid Spec | Long Extra Text Over The Character Limit Invariant']
];

for (let i = 0; i < edgeCandidates.length; i++) {
  const cands = edgeCandidates[i];
  const res1 = fitTitleUnder60Chars('Japanese Great Wave Desk Mat', cands, 60);
  verifyTitleInvariants(res1, `Candidate Case ${i} on valid primary`, { cands });

  const res2 = fitTitleUnder60Chars(' - | - ', cands, 60);
  verifyTitleInvariants(res2, `Candidate Case ${i} on delimiter primary`, { cands });
}

console.log('--- SECTION 4: Single Gigantic Unbroken Word at Limits ---');

for (let len = 50; len <= 120; len += 5) {
  const giant = 'A'.repeat(len);
  const res = fitTitleUnder60Chars(giant, [], 60);
  verifyTitleInvariants(res, `Giant word length ${len}`, giant);
}

console.log('--- SECTION 5: Trailing Conjunctions and Prepositions Exhaustive Test ---');

const stopWords = ['and', 'or', 'nor', 'but', 'for', 'with', 'w', 'in', 'on', 'at', 'to', 'by', 'from', 'of', 'the', 'a', 'an', 'vs'];

for (const sw of stopWords) {
  // Test when word is at exact cutoff
  const base = 'Shop Archival Japanese Canvas Wall Art Prints In The UK';
  const withStop = `${base} ${sw}`;
  const res = fitTitleUnder60Chars(withStop, [], 60);
  verifyTitleInvariants(res, `Trailing stopword: ${sw}`, withStop);
  assert(
    !res.toLowerCase().endsWith(` ${sw}`),
    `Stopword "${sw}" is not trailing in "${res}"`,
    { res, sw }
  );
}

console.log('--- SECTION 6: Collection Intent Guard Plural / Singular Boundary Matrix ---');

const singularQueries = [
  'japanese anime desk mat',
  'desk mat',
  'gaming mouse pad',
  'custom mousepad',
  'velvet cushion cover',
  'linen pillow case',
  'plush throw blanket',
  'memory foam bath mat',
  'archival canvas print',
  'oversized anime hoodie',
  'graphic t-shirt',
  'vintage tee'
];

for (const q of singularQueries) {
  const isSingle = isSingleProductQuery(q);
  assert(isSingle === true, `Query "${q}" should be classified as single product`, { q, isSingle });
}

const pluralQueries = [
  'japanese anime desk mats',
  'desk mats',
  'gaming mouse pads',
  'custom mousepads',
  'velvet cushion covers',
  'linen pillow cases',
  'plush throw blankets',
  'memory foam bath mats',
  'archival canvas prints',
  'canvas wall art',
  'oversized anime hoodies',
  'graphic t-shirts',
  'vintage tees',
  'desk mat collection',
  'canvas art prints',
  'prints'
];

for (const q of pluralQueries) {
  const isSingle = isSingleProductQuery(q);
  assert(isSingle === false, `Query "${q}" should NOT be classified as single product`, { q, isSingle });
}

console.log('--- SECTION 7: Collection Title Preservation Under Adversarial Rewrites ---');

const testCases = [
  {
    handle: 'japanese-anime-desk-mats',
    currentTitle: 'Japanese Anime Desk Mats',
    topQuery: 'japanese wave desk mat', // singular!
    impressions: 500,
    expectedKeyword: 'Japanese Anime XXL Desk Mats' // must protect collection intent
  },
  {
    handle: 'abstract-minimalist-bauhaus-canvas-wall-art',
    currentTitle: 'Abstract Minimalist Bauhaus Canvas Wall Art',
    topQuery: 'bauhaus canvas print', // singular!
    impressions: 400,
    expectedKeyword: 'Abstract Minimalist Canvas Wall Art' // must protect collection intent
  }
];

for (const tc of testCases) {
  const thematic = buildCollectionThematicTitle(tc.handle, tc.currentTitle, tc.topQuery);
  assert(
    thematic === tc.expectedKeyword,
    `buildCollectionThematicTitle protects collection identity: got "${thematic}", expected "${tc.expectedKeyword}"`,
    { thematic, tc }
  );

  const specMeta = buildCompetitorSpecTitleAndMeta(
    thematic,
    '4mm XXL Stitched Gaming Desk Mats',
    tc.topQuery,
    'desk-mats'
  );
  assert(
    typeof specMeta.title === 'string' && specMeta.title.length <= 60,
    `Generated title <= 60 chars (got ${specMeta.title.length}: "${specMeta.title}")`,
    { title: specMeta.title }
  );
  assert(
    !specMeta.title.toLowerCase().includes(tc.topQuery.toLowerCase()),
    `Singular query "${tc.topQuery}" NOT injected into collection title`,
    { title: specMeta.title, query: tc.topQuery }
  );
}

console.log('\n================================================================');
console.log(' CHALLENGER 1 (M5) DEEP ADVERSARIAL SUMMARY');
console.log('================================================================');
console.log(` Total Assertions:  ${totalTests}`);
console.log(` Passed:            ${passedTests}`);
console.log(` Failed:            ${failedTests}`);
console.log(` Final Verdict:     ${failedTests === 0 ? 'CHALLENGE_PASSED (APPROVE)' : 'CHALLENGE_FAILED (REQUEST_CHANGES)'}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
