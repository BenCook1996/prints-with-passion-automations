# DISPATCH — Sub-Orchestrator Milestone 5 (Automation Scripts Upgrade)

## 2026-11-13T00:42:05Z

You are the Sub-Orchestrator for Milestone 5 (Phase 5 — Automation Scripts Upgrade) for the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_5

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the forensic survey report for Milestone 5 at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_3\handoff.md

Your scope of execution:
Requirement R5 (Phase 5 — Automation Scripts Upgrade):
1. In `gsc_ga4_gmc_cloud_sync.mjs`:
   - Only submit sitemap PUT requests when a sitemap is missing from GSC or reports errors (preserving `LastSubmitted` date and indexing history).
   - Incorporate rotating `urlInspection/index:inspect` health tracking (15 priority URLs per run with 200ms pacing) using `.gcp_service_account.json`.
2. In `strikezone_ctr_and_competitor_rewriter.mjs`:
   - Replace hard character truncation (`.slice(0, 66)`) with word-boundary-safe title truncation (`fitTitleUnder60Chars`, strictly `<= 60` chars).
   - Prevent collection titles from being overwritten by single-product search queries.
3. In `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs`:
   - Implement validation checks for double-escaped entities (`&quot;`, `&amp;`), broken template grammar fragments, truncated titles, and 0-product collections.
   - Upgrade `verify_40_subcollections_counts.mjs` to validate all storewide collections.

Follow the Project Pattern procedure:
Iterate: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate check in `GATE_STATUS.md`.
Enforce mandatory integrity warning to workers. Forensic auditor veto is absolute.
When gate passes, write handoff.md and send completion report to parent.


## 2026-11-14T02:30:45Z

[REVIVE NOTICE]
Server restart occurred. Resume execution immediately:
1. Ensure Worker finishes implementing the automation scripts upgrade:
   - `gsc_ga4_gmc_cloud_sync.mjs`: Idempotent sitemap PUTs (only when missing/errored) + rotating 15-URL inspection batch.
   - `strikezone_ctr_and_competitor_rewriter.mjs`: `fitTitleUnder60Chars(..., 60)` + collection title keyword guard.
   - `catalog_uniqueness_and_seo_lint_gate.mjs` & `verify_40_subcollections_counts.mjs`: Storewide checks for entities, template grammar, truncated titles, 0-product collections.
2. Run reviews, challenger verification, and forensic audit.
3. Verify gate passes and send completion report to parent.
