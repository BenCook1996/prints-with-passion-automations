## 2026-11-13T01:05:05Z
You are the Worker for Milestone 2 (Phase 2 — Collection & Redirect Hygiene).

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m2_1

Write ownership:
You have exclusive write ownership of:
1. `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\remediate_m2_collections_redirects.mjs`
2. Your state folder `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m2_1\`
Do NOT modify theme templates, rewriters, or other files outside this scope.

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project architecture and global plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the Milestone 2 scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_2\SCOPE.md

Read the Explorer reports:
1. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_1\handoff.md
2. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_2\handoff.md
3. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your technical mission:
Implement and execute the complete Milestone 2 remediation script (`remediate_m2_collections_redirects.mjs`) against the live Shopify Admin GraphQL API:
1. **Safety Guardrails**: Include hardcoded immutable deny-list sets and assertions protecting `gid://shopify/Collection/437768978743` (`frontpage`) and `gid://shopify/Collection/441651298615` (`avada-upsell-best-sellers`) from deletion. Whitelist strictly the 28 discontinued collection GIDs.
2. **Collection Deletion**: Execute `collectionDelete` for all 28 discontinued 0-product collections sequentially with ~300ms pacing delay. Handle idempotency (treat "Collection does not exist" as ALREADY_DELETED).
3. **Redirect Hygiene**:
   - Create 22 missing redirects via `urlRedirectCreate` for legacy collection handles to their target parent collections.
   - Update 2 sub-optimal redirects via `urlRedirectUpdate` (`bottles` -> `/collections/home-living`, `bags` -> `/collections/apparel`).
   - Verify 4 existing redirects are intact (`pets-animals` -> `/collections/animals-wildlife`, `posters` -> `/collections/canvas-prints`, `rugs` -> `/collections/bath-mats`, `mousepads` -> `/collections/desk-mats`).
   - Update 15 `%20` redirect targets via `urlRedirectUpdate` to point to active canonical parent collections (`/collections/blankets`, `/collections/canvas-prints`, `/collections/hoodies`).
   - Delete rogue redirect `gid://shopify/UrlRedirect/1701624414581` on `/blogs/news/uk-student-room-rental-flat-decor-guide` via `urlRedirectDelete`.
4. **AVADA Collection Unpublishing**: Execute `publishableUnpublish` for `gid://shopify/Collection/441651298615` strictly against Online Store publication `gid://shopify/Publication/124388507959`, preserving all other 7 sales channels.
5. **Blog Article Publication**: Execute `articleUpdate` for `gid://shopify/Article/1016204886389` setting `isPublished: true`.
6. **Execution & Verification**:
   - Run the script against live Shopify Admin API.
   - Run post-execution verification checks verifying:
     a) Collections count reduced from 101 to 73.
     b) Frontpage collection still exists and is untouched.
     c) All 28 legacy handles return 301 redirects to target parent collections.
     d) AVADA collection has `isPublished: false` on Online Store, remaining 7 publications active.
     e) All 15 %20 redirects no longer contain %20.
     f) Blog redirect is deleted and article returns HTTP 200 OK on storefront.
   - Document all verification commands and outputs in your report.

Write your final handoff report in:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m2_1\handoff.md`
When complete, send a message to the orchestrator with your verdict and report path.
