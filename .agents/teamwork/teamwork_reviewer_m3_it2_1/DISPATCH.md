# Dispatch — Reviewer M3-IT2-1: Collection SEO Metadata Reviewer
Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_reviewer_m3_it2_1


## 2026-11-14T13:55:50Z
You are Reviewer M3-IT2-1 (Collection SEO Metadata Reviewer) for Milestone 3 Iteration 2.

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan and milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3\SCOPE.md

Read the Worker's implementation and handoff:
- Script: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\remediate_m3_collections_seo.mjs
- Worker Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m3_it2\handoff.md

Your working directory:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

Your state folder:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_reviewer_m3_it2_1

Objective:
1. Objectively examine the correctness, completeness, and robustness of the Milestone 3 Iteration 2 implementation.
2. Verify against Requirement R3:
   - Check that all active collections in Shopify Admin have bespoke, word-boundary safe seo.title (<= 60 chars) and plain text seo.description (140–158 chars).
   - Verify specifically:
     * /collections/japanese-anime-desk-mats: category-level title (<= 60 chars) and description (140-158 chars).
     * /collections/abstract-minimalist-bauhaus-canvas-wall-art: clean, untruncated title (no (CM & I artifact, <= 60 chars) and description (140-158 chars).
   - Verify zero unescaped HTML entities (&quot;, &amp;quot;, &amp;) and zero template phrases.
3. Run verification tests:
   - node remediate_m3_collections_seo.mjs --verify-only
   - node verify_40_subcollections_counts.mjs
   - node catalog_uniqueness_and_seo_lint_gate.mjs
   - node tests/audit_all_storefront_collections.mjs
4. Provide an explicit verdict in your handoff report: APPROVE or REQUEST_CHANGES.
5. Write your handoff report to:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_reviewer_m3_it2_1\handoff.md.
6. Send completion message back to parent orchestrator via send_message.
