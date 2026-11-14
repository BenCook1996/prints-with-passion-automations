## 2026-11-14T13:28:12Z
[Message] timestamp=2026-11-14T13:28:12Z sender=a280eadc-29bd-4b32-8ff2-6606b37c7730 priority=MESSAGE_PRIORITY_HIGH content=You are Worker M3-IT2 for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project plan and milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3\SCOPE.md

Read the synthesized Iteration 2 Explorer deliverables:
- Explorer 1 (Clean Proposals V2 without literal quotes):
  `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_it2_1\verified_collection_proposals_v2.json`
  `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_it2_1\handoff.md`
- Explorer 2 (Liquid Template Patch & Theme Upload Spec):
  `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_it2_2\handoff.md`
- Explorer 3 (Storefront Verification Script):
  `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_it2_3\proposed_audit_all_storefront_collections.mjs`
  `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_it2_3\handoff.md`

Your working directory:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

Your state folder:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m3_it2

Write Ownership:
You exclusively own:
- `snippets/head.liquid` (local file and active Shopify theme `177936466293` asset)
- `remediate_m3_collections_seo.mjs`
- `tests/audit_all_storefront_collections.mjs`
- Files within your state folder

Your Objectives:
1. Liquid Template Patch:
   - Patch `snippets/head.liquid` line 56 to include `| replace: '&quot;', '"' | replace: '&#39;', "'"` before `| escape`.
   - Deploy the updated `snippets/head.liquid` to the active live theme `gid://shopify/OnlineStoreTheme/177936466293` using Shopify Admin REST Asset API (`PUT /admin/api/2025-01/themes/177936466293/assets.json`).
2. Collection Metadata Update:
   - Update `remediate_m3_collections_seo.mjs` to target `verified_collection_proposals_v2.json`.
   - Run `node remediate_m3_collections_seo.mjs` to execute live mutations in Shopify Admin for all collections where descriptions had literal quotes.
3. Storefront Verification Script:
   - Copy `proposed_audit_all_storefront_collections.mjs` into `tests/audit_all_storefront_collections.mjs`.
4. Run Complete Verification Suite:
   - `node remediate_m3_collections_seo.mjs --verify-only` (100% compliant in Admin)
   - `node verify_40_subcollections_counts.mjs` (0 violations)
   - `node catalog_uniqueness_and_seo_lint_gate.mjs` (0 violations)
   - `node tests/audit_all_storefront_collections.mjs` (all 69 collections pass live storefront HTML audit with ZERO `&amp;quot;` entities and all lengths 140–158)
5. Document all execution commands, live API responses, storefront HTML verification logs, and diffs in your handoff report:
   `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m3_it2\handoff.md`.
6. Send a completion message back to parent orchestrator via send_message.
