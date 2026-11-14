# DISPATCH — Spec Miner (E2E Testing Track)

## 2026-11-13T00:44:00Z

Task: Investigate authoritative sources, reference diagnostic scripts, live storefront specifications, and codebase structure to provide the complete specification matrix for building the E2E test runner (`tests/e2e_recovery_test_runner.mjs`) and 4-tier test suites.
Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\spec_miner_e2e_1


## 2026-11-13T00:44:06Z

You are teamwork_spec_miner investigating authoritative requirements and test specifications for the Prints With Passion E2E Testing Track.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\spec_miner_e2e_1

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read your dispatch assignment at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\spec_miner_e2e_1\DISPATCH.md

Investigate:
1. Diagnostic verification scripts in:
   C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch\gsc_deep_dive_part5_root_causes_verification.mjs (and parts 1 through 6 in that directory)
2. Existing codebase scripts in C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ (e.g. package.json, lib/cloud-env.mjs, gsc_ga4_gmc_cloud_sync.mjs, strikezone_ctr_and_competitor_rewriter.mjs, catalog_uniqueness_and_seo_lint_gate.mjs, verify_40_subcollections_counts.mjs)
3. The 23 features in PROJECT.md Feature Inventory across R1–R6.

Your Deliverable:
Produce a comprehensive specification report in:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\spec_miner_e2e_1\handoff.md

Your report must specify:
- Precise test assertions, inputs, expected outputs, and verification methods for all 23 features.
- Concrete test case design matrix across 4 tiers:
  * Tier 1: Feature Coverage (>=5 test cases per feature for all 23 features = 115+ test cases)
  * Tier 2: Boundary & Corner Cases (>=5 test cases per feature covering string lengths <=60 chars, 140-158 chars, entity escaping, 0-product handling, url encoding, etc.)
  * Tier 3: Cross-Feature Combinations (pairwise interactions: sitemaps vs redirects vs unpublishing vs canonicals)
  * Tier 4: Real-World Application Scenarios (Googlebot user-agent crawl simulation, SERP snippet rendering, live storefront navigation, sitemap XML parsing)
- Recommended architecture for `tests/e2e_recovery_test_runner.mjs` including CLI options (`--tier`, `--feature`, `--json`, `--verbose`), output formats (TAP/summary), timing, and progressive testability.

When finished, send a completion message back to parent orchestrator.
