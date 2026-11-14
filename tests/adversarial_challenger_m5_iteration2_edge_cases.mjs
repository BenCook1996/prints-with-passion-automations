/**
 * Prints With Passion — Milestone 5 Challenger Iteration 2 Edge Case Harness
 * (tests/adversarial_challenger_m5_iteration2_edge_cases.mjs)
 *
 * Authored by Challenger 1 (Milestone 5 Iteration 2).
 * Verifies newly identified failure modes in fitTitleUnder60Chars:
 * 1. Stray opening paren at index 0 emits empty string ""
 * 2. Stray opening bracket at index 0 emits empty string ""
 * 3. Valid bracketed tag [UK Edition] is destroyed by stripTrailingDangling
 * 4. Completely bracketed title [Desk Mats] emits empty string ""
 * 5. Line 142 truthiness check allows empty string return
 */

import { fitTitleUnder60Chars } from '../strikezone_ctr_and_competitor_rewriter.mjs';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message, details = {}) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
    if (Object.keys(details).length) {
      console.error(`        Details:`, details);
    }
    failures.push({ message, details });
  }
}

console.log('\n--- SUITE: fitTitleUnder60Chars Iteration 2 Adversarial Stress ---');

// Test 1: Stray opening paren at index 0
const r1 = fitTitleUnder60Chars('(Exclusive Desk Mats', [], 60);
assert(
  r1 !== '' && r1.length > 0,
  `Non-empty string invariant for "(Exclusive Desk Mats" (got "${r1}")`,
  { input: '(Exclusive Desk Mats', result: r1 }
);
assert(
  r1.includes('Exclusive Desk Mats'),
  `Preserves substantive text for "(Exclusive Desk Mats" (got "${r1}")`,
  { input: '(Exclusive Desk Mats', result: r1 }
);

// Test 2: Stray opening bracket at index 0
const r2 = fitTitleUnder60Chars('[Exclusive Desk Mats', [], 60);
assert(
  r2 !== '' && r2.length > 0,
  `Non-empty string invariant for "[Exclusive Desk Mats" (got "${r2}")`,
  { input: '[Exclusive Desk Mats', result: r2 }
);
assert(
  r2.includes('Exclusive Desk Mats'),
  `Preserves substantive text for "[Exclusive Desk Mats" (got "${r2}")`,
  { input: '[Exclusive Desk Mats', result: r2 }
);

// Test 3: Valid bracketed tag preservation
const r3 = fitTitleUnder60Chars('Japanese Anime Desk Mats [UK Edition]', [], 60);
assert(
  r3.includes('[UK Edition]'),
  `Preserves valid bracketed tag "[UK Edition]" in "${r3}"`,
  { input: 'Japanese Anime Desk Mats [UK Edition]', result: r3 }
);

// Test 4: Completely bracketed title
const r4 = fitTitleUnder60Chars('[Desk Mats]', [], 60);
assert(
  r4 !== '' && r4.length > 0,
  `Non-empty string invariant for "[Desk Mats]" (got "${r4}")`,
  { input: '[Desk Mats]', result: r4 }
);

// Test 5: Unclosed leading paren with candidate
const r5 = fitTitleUnder60Chars('( Wall Gaming', ['900x400mm Studio'], 60);
assert(
  r5 !== '' && r5.length > 0,
  `Non-empty string invariant for "( Wall Gaming" with candidate (got "${r5}")`,
  { input: '( Wall Gaming', candidates: ['900x400mm Studio'], result: r5 }
);

console.log('\n================================================================');
console.log(' CHALLENGER 1 (M5 ITERATION 2) STRESS TEST SUMMARY');
console.log('================================================================');
console.log(` Total Assertions:  ${totalTests}`);
console.log(` Passed:            ${passedTests}`);
console.log(` Failed:            ${failedTests}`);
console.log(` Verdict:           ${failedTests === 0 ? 'CHALLENGE_PASSED' : 'CHALLENGE_FAILED'}`);
console.log('================================================================\n');

process.exit(failedTests > 0 ? 1 : 0);
