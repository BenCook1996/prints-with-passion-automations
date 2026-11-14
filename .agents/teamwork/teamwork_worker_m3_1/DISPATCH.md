## 2026-11-14T03:04:54Z
You are Worker M3-1 for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project plan and milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3\SCOPE.md

Read the synthesized Explorer reports and verified proposal deliverables:
- Verified Proposals JSON:
  C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2\verified_collection_proposals.json
- Explorer 1 Catalog Audit:
  C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_1\handoff.md
- Explorer 2 Copy Validation:
  C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2\handoff.md
- Explorer 3 Mutation Architecture & Script Spec:
  C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_3\handoff.md

Your working directory:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

Your state folder:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m3_1

Write Ownership:
You exclusively own `remediate_m3_collections_seo.mjs` in the working directory and files within your state folder.

Your Objectives:
1. Implement the production remediation script `remediate_m3_collections_seo.mjs` using `shopifyGraphQL` from `lib/cloud-env.mjs`, adhering to the architecture specified in Explorer 3's handoff:
   - Load `verified_collection_proposals.json`.
   - Execute `collectionUpdate` mutations sequentially with ~300ms pacing delay (2–4 req/sec) to respect the 50 pts/sec leaky bucket.
   - For each collection, update `seo: { title: ..., description: ... }`.
   - Inspect and handle any `userErrors` or GraphQL errors.
   - Support optional flags: `--dry-run` and `--verify-only`.
2. Run `remediate_m3_collections_seo.mjs` against the live Shopify Admin GraphQL API to execute the live updates.
3. Execute post-mutation verification:
   - Query live Shopify Admin GraphQL API for all updated collections and verify that 100% of active collections have custom `seo.title` (<= 60 chars) and `seo.description` (140–158 chars).
   - Verify specific collections:
     * `/collections/japanese-anime-desk-mats`: title is category-level (<= 60 chars) and description is 140–158 chars.
     * `/collections/abstract-minimalist-bauhaus-canvas-wall-art`: title is clean, not truncated at `(CM & I` (<= 60 chars) and description is 140–158 chars.
   - Verify zero unescaped entities (`&quot;`, `&amp;quot;`, `&amp;`) and zero template phrases (`Transform with...`, `Elevate with...`, `Style with...`).
4. Run existing test scripts/lint gates where applicable (e.g. `node catalog_uniqueness_and_seo_lint_gate.mjs` or relevant tests).
5. Document all commands, execution logs, live GraphQL query verification results, and diffs in your handoff report:
   `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m3_1\handoff.md`.
6. Send a completion message back to parent orchestrator via send_message.
