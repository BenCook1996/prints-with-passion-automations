/**
 * Prints With Passion — Reviewer 1 (M5 R2) Adversarial Deep Dive Test
 * (tests/reviewer_adversarial_deep_dive.mjs)
 *
 * Demonstrates the boundary failure in `strikezone_ctr_and_competitor_rewriter.mjs`
 * when unclosed opening brackets/parens appear at index 0 or empty parens `()` are provided.
 */
import assert from 'assert';
import { fitTitleUnder60Chars } from '../strikezone_ctr_and_competitor_rewriter.mjs';

console.log('=== Reviewer 1 (M5 R2) Adversarial Edge Case Verification ===\n');

const testCases = [
  {
    name: 'Unclosed parenthesis at start of string',
    input: '(UK Edition Japanese Desk Mat',
    candidates: ['900x400x4mm Stitched Pad', 'XXL Desk Mats']
  },
  {
    name: 'Unclosed bracket at start of string',
    input: '[UK Series Japanese Desk Mat',
    candidates: ['900x400x4mm Stitched Pad', 'XXL Desk Mats']
  },
  {
    name: 'Multiple unclosed parens at start',
    input: '((((Extreme Unclosed Parens',
    candidates: ['900x400x4mm Stitched Pad', 'XXL Desk Mats']
  },
  {
    name: 'Empty parentheses only',
    input: '()',
    candidates: []
  }
];

let failures = 0;

for (const tc of testCases) {
  const result = fitTitleUnder60Chars(tc.input, tc.candidates, 60);
  console.log(`Test: ${tc.name}`);
  console.log(`  Input:    "${tc.input}"`);
  console.log(`  Output:   "${result}" (length: ${result?.length ?? 0})`);

  let passed = true;
  if (!result || result.length === 0) {
    console.error(`  FAIL: Output must not be empty string!`);
    passed = false;
  } else if (result === '()') {
    console.error(`  FAIL: Output must not be literal empty parentheses "()"!`);
    passed = false;
  } else {
    console.log(`  PASS`);
  }

  if (!passed) failures++;
  console.log('');
}

console.log(`=== Adversarial Summary: ${failures} failure(s) found ===`);
if (failures > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
