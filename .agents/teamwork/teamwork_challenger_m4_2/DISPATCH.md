# DISPATCH — Challenger 2 (Milestone 4: GraphQL & Boundary Adversarial Stress-Tester)

## Objective
Adversarially challenge the live Shopify Admin GraphQL API and stored metadata objects to verify strict boundary compliance, character counts, entity cleanliness, and error handling.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Worker 3 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3\handoff.md
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json

## Adversarial Tasks
1. Exhaustive Boundary Audit across all 36 pages:
   - For every page: assert `title_tag` length is between 1 and 60 characters. If any exceeds 60, fail.
   - For every page: assert `description_tag` length is between 145 and 158 characters. If any is outside this range, fail.
   - For every page body: regex search for `<h1` — if any inner H1 exists, fail.
   - For every page body: regex search for `&amp;` — if any literal entity remains in text nodes, fail.
   - For `contact-us`: regex search for `printswithpasssionbc@gmail.com` — if present, fail.
2. Exhaustive Boundary Audit across all 26 articles:
   - For every article: assert `title_tag` length <= 60 characters.
   - For every article: assert `description_tag` length between 145 and 158 characters.
   - For every article: assert title does not match `/Extended Mo/i` or end with dangling tokens/colons.
   - For every article: verify presence of internal cross-link blocks.
3. Test Suite Execution:
   - Run `node tests/e2e_recovery_test_runner.mjs --dry-run` and verify that all Tier 1, Tier 2, Tier 3, and Tier 4 tests associated with Pages and Articles pass.
4. Provide a clear verdict: `APPROVE` or `REJECT`.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_challenger_m4_2\handoff.md`
Send completion message to parent sub-orchestrator.


## 2026-11-14T13:32:59Z
You are Challenger 2 for Milestone 4 (Phase 4 — Page & Article SEO Remediation).
Your state folder is: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_challenger_m4_2
Your task assignment is in: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_challenger_m4_2\DISPATCH.md

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md.
Also read PROJECT.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md and SCOPE.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md.
Read Worker 3 handoff report at: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3\handoff.md.

Adversarially challenge the live Shopify Admin GraphQL API and stored metadata objects for strict boundary compliance across all 36 pages and 26 articles (character length boundaries: title <=60, desc 145-158, zero &amp;, zero inner H1s, zero email typos, zero dangling tokens). Run the full E2E test runner for features 14, 15, 16.
Formulate a clear verdict (APPROVE or REJECT). Write your report to handoff.md in your state folder.
When complete, notify parent conversation 66755ac4-eeb3-414d-aa4d-be0b45896b18 via send_message.
