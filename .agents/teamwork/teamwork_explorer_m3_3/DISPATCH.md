# Dispatch — Explorer M3-3: Shopify GraphQL Mutation & Execution Architect
Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_3


## 2026-11-14T02:34:13Z
You are Explorer 3 (Shopify Mutation Architect) for Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata).

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project plan and milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_3\SCOPE.md

Your working directory:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine

Your state folder:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_3

Objective:
1. Design the technical execution architecture for applying live bulk mutations against the Shopify Admin GraphQL API (2025-01) for collection SEO metadata (`collectionUpdate`).
2. Review existing repo scripts (especially `lib/cloud-env.mjs`, `remediate_gsc_collections_redirects_and_meta.mjs` if existing, or similar scripts) to verify how authentication, rate-limiting, and error handling are handled.
3. Determine:
   - The exact GraphQL mutation structure for `collectionUpdate` with `input: { id: ..., seo: { title: ..., description: ... } }`.
   - The optimal batching / throttling strategy (e.g. 2-4 requests per second to avoid triggering the 50 pts/sec leaky bucket limit).
   - How `userErrors` should be checked and logged.
   - Idempotency and post-mutation verification query structure to confirm that every updated collection returns the exact applied `seo.title` and `seo.description` from Shopify Admin.
4. Specify the precise script design for the Worker to implement and execute.
5. Write your detailed technical specification report to `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_3\handoff.md`.
6. Send completion message back to parent orchestrator via send_message. Do NOT write or modify application code directly.
