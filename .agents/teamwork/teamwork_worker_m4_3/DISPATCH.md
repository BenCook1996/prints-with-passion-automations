## 2026-11-14T12:57:46Z
You are Worker 3 for Milestone 4 (Phase 4 — Page & Article SEO Remediation).
Your state folder is: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3
Your task assignment is in: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3\DISPATCH.md


## Context
Previous workers experienced an upstream API transport connection drop. You are Worker 3 executing Milestone 4 (Requirement R4).

## Objective
Implement and execute the production remediation script `remediate_pages_and_articles_seo.mjs` against the live Shopify Admin GraphQL API to satisfy Requirement R4 (Features 14, 15, and 16).

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Explorer 1 Spec (Pages): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\page_remediation_spec.json
- Explorer 2 Spec (Articles): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_2\article_remediation_spec.json
- Explorer 3 Spec (Linking & Menus): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\internal_linking_spec.json
- Explorer 3 Catalog HTML: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\proposed_uk_product_catalog.html
- Auth Helper: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\lib\cloud-env.mjs

## File Ownership
You exclusively own and may create / edit:
- `remediate_pages_and_articles_seo.mjs` (in project root)
- Files in your state folder: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3\`

## Execution Blueprint
1. **Load Pre-Compiled Specs**:
   - `page_remediation_spec.json` (36 pages: 25 inner H1 demotions, 34 entity sanitizations, 36 titles <=60 chars, 36 descriptions 145-158 chars, contact-us email fix).
   - `article_remediation_spec.json` (26 articles: titles repaired to <=60 chars, descriptions 145-158 chars).
   - `internal_linking_spec.json` (footer menu payload, article cross-link blocks).
   - `proposed_uk_product_catalog.html` (replacement HTML for `/pages/uk-product-catalog` GID `gid://shopify/Page/703791300981`).
2. **Implement `remediate_pages_and_articles_seo.mjs`**:
   - Import `shopifyGraphQL` from `./lib/cloud-env.mjs`.
   - Add pacing helper `sleep(250)` between calls (~4 calls/sec) to respect Shopify leaky bucket rate limits.
   - For 36 Pages:
     - Demote inner `<h1...>` to `<h2...>` on the 25 pages.
     - Replace `&amp;` with `&` in `page.body`.
     - Set `/pages/uk-product-catalog` body to `proposed_uk_product_catalog.html`.
     - Update `global.title_tag` and `global.description_tag` metafields.
     - Fix `printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com` on `/pages/contact-us`.
   - For 26 Articles:
     - Update article `title` (repairing "Extended Mo" etc.).
     - Update `global.title_tag` and `global.description_tag` metafields.
     - Inject cross-link block from `internal_linking_spec.json` before ending tags.
   - For Footer Menu (`gid://shopify/Menu/221177086263`):
     - Execute `menuUpdate` keeping the 13 existing items and adding `/pages/about-us`, `/pages/uk-product-catalog`, and `/pages/studio-lookbook-social-feed`.
3. **Execute & Verify**:
   - Run `node remediate_pages_and_articles_seo.mjs`.
   - Verify live Admin GraphQL query results and write comprehensive test verification outputs.
   - Run `node catalog_uniqueness_and_seo_lint_gate.mjs` if available.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_3\handoff.md`
Report command lines, execution logs, and verification proof.
Send completion message to parent sub-orchestrator.
