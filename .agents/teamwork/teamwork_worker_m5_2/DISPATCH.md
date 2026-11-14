# Worker Dispatch — Milestone 5 Iteration 2 (Worker 2)

## Working directory
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

## State folder
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m5_2

## Context & Inputs
1. Mandatory first step: read ORIGINAL_REQUEST.md:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md
2. Global Project Plan:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
3. Scope Document:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_5_gen1\SCOPE.md
4. Solution Blueprint (Exact verified implementation):
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_r2_2_rep1\handoff.md (lines 171–278)

## Task Description
Apply the verified fix for `fitTitleUnder60Chars` in `strikezone_ctr_and_competitor_rewriter.mjs`.

### Exclusive Write Ownership
You exclusively own `strikezone_ctr_and_competitor_rewriter.mjs`. Do not modify other source files unless strictly necessary for tests.

### Instructions
1. Read `strikezone_ctr_and_competitor_rewriter.mjs`.
2. Replace lines 42–132 (the existing `stripTrailingDangling`, `balanceBrackets`, `truncateAtWordBoundary`, and the primary/candidate evaluation logic) with the verified implementation from Section 5 of `teamwork_explorer_m5_r2_2_rep1/handoff.md`:
   - An outer convergence loop `while (s !== prev)` in `balanceBrackets` to ensure nested and interleaved parens/brackets are fully balanced.
   - Retaining `stripTrailingDangling` handling of trailing punctuation, conjunctions, and prepositions.
   - Pre-cleaning and pre-stripping trailing delimiters on `primaryPart` with fallback to `'Prints With Passion'` if empty.
3. Run verification test suites:
   `node tests/challenger_m5_empirical_harness.mjs`
   `node tests/adversarial_reviewer2_m5_test.mjs`
   `node tests/adversarial_challenger_m5_lint_and_collections.mjs`
   `node tests/e2e_recovery_test_runner.mjs --dry-run`
4. Document the exact changes and test outputs in `handoff.md` in your state folder.
5. Notify orchestrator via `send_message`.

### Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
