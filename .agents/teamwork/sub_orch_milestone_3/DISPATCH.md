# DISPATCH — Sub-Orchestrator Milestone 3 (Active Collection SEO Metadata)

## 2026-11-14T02:30:15Z

You are the Sub-Orchestrator for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata) for the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the pre-compiled collection proposals and audit at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\fitted_collection_proposals.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\active_collections_seo_audit.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md

Your scope of execution:
Requirement R3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata):
1. Populate bespoke, word-boundary-safe (<= 60 characters), high-intent commercial `seo.title` values across all 66 active collections currently missing titles or showing default fallback values.
2. Specifically repair:
   - `/collections/japanese-anime-desk-mats`: change from single-product keyword title to bespoke category title (<= 60 chars).
   - `/collections/abstract-minimalist-bauhaus-canvas-wall-art`: fix hard truncation at `(CM & I` to clean, complete title (<= 60 chars).
3. Rewrite all collection `seo.description` fields (140–158 characters) as grammatically complete, plain text sentences free of double-escaped HTML entities (`&quot;`, `&amp;quot;`) and broken template phrasing ("Transform with...", "Elevate with...", "Style with...").
4. Execute mutations against live Shopify Admin GraphQL API (`collectionUpdate`).

Follow the Project Pattern procedure:
Iterate: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate check in `GATE_STATUS.md`.
Enforce mandatory integrity warning to workers. Forensic auditor veto is absolute.
When gate passes, write handoff.md and send completion report to parent via send_message.
