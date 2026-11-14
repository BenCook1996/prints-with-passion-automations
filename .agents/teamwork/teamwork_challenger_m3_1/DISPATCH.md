## 2026-11-14T14:19:05Z
You are Challenger M3-1 (Collection Stress & Invariant Challenger) for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata).

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
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_challenger_m3_1

Objective:
1. Empirically challenge and stress-test the live collection SEO metadata directly against the Shopify Admin GraphQL API (2025-01).
2. Write and execute an independent empirical test script / oracle to stress-test all active collections against strict invariants:
   - Boundary limits: exactly assert length <= 60 chars for titles, 140 <= length <= 158 for descriptions.
   - Uniqueness: 0 duplicate titles, 0 duplicate descriptions across the entire catalog.
   - Entity purity: strictly zero literal double quotes `"`, zero `&quot;`, zero `&amp;quot;`, zero raw `&amp;`.
   - Category-level commercial intent: verify that no collection has single-product title or model dimensions (specifically assert `/collections/japanese-anime-desk-mats` is category-level desk mats).
   - Untruncated clean title: specifically assert `/collections/abstract-minimalist-bauhaus-canvas-wall-art` has zero `(CM & I` truncation.
3. Provide an explicit verdict in your handoff report: `APPROVE` or `FAIL`.
4. Write your handoff report to:
   C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_challenger_m3_1\handoff.md.
5. Send completion message back to parent orchestrator via send_message.
