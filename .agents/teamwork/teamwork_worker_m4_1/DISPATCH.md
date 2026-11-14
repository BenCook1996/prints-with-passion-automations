# DISPATCH — Worker 1 (Milestone 4: Page & Article SEO Remediation)

## Objective
Implement and execute the production remediation script `remediate_pages_and_articles_seo.mjs` against the live Shopify Admin GraphQL API to satisfy Requirement R4 (Features 14, 15, and 16).

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Explorer 1 Spec (Pages): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\page_remediation_spec.json
- Explorer 1 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\handoff.md
- Explorer 2 Spec (Articles): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_2\article_remediation_spec.json
- Explorer 2 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_2\handoff.md
- Explorer 3 Spec (Linking & Menus): C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\internal_linking_spec.json
- Explorer 3 Catalog HTML: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\proposed_uk_product_catalog.html
- Explorer 3 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\handoff.md
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json
- Auth Helper: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\lib\cloud-env.mjs

## File Ownership
You exclusively own and may create / edit:
- `remediate_pages_and_articles_seo.mjs` (in project root)
- Files in your state folder: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_1\`

## Execution Requirements
1. **Script Implementation (`remediate_pages_and_articles_seo.mjs`)**:
   - Use `shopifyGraphQL` from `lib/cloud-env.mjs`.
   - Implement pacing (~250ms delay between calls, ~4 calls/sec) to avoid Shopify leaky bucket throttling.
   - For 36 Pages:
     - Demote inner `<h1>` to `<h2>` in `page.body` for the 25 affected pages.
     - Sanitize `&amp;` entities to `&` in `page.body`.
     - Replace `/pages/uk-product-catalog` (`gid://shopify/Page/703791300981`) body with the full HTML from Explorer 3's `proposed_uk_product_catalog.html`.
     - Update `global.title_tag` (<=60 chars) and `global.description_tag` (145-158 chars) via `pageUpdate(id: $id, page: { body: $body, metafields: [...] })` or `metafieldsSet`.
     - Fix the `/pages/contact-us` typo (`printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com`) in `description_tag`.
   - For 25/26 Blog Articles:
     - Repair truncated titles (e.g., replace raw titles ending in "Extended Mo" with clean titles).
     - Update `global.title_tag` (<=60 chars) and `global.description_tag` (145-158 chars) via `articleUpdate` or `metafieldsSet`.
     - Inject contextual internal cross-link blocks from `internal_linking_spec.json` into blog articles connecting them to the 8 uncrawled articles and 14 uncrawled smart sub-collections.
   - For Footer Menu (`gid://shopify/Menu/221177086263`):
     - Execute `menuUpdate` preserving existing 13 item IDs and adding `/pages/about-us`, `/pages/uk-product-catalog`, and `/pages/studio-lookbook-social-feed`.
2. **Execute Script & Verify**:
   - Run `node remediate_pages_and_articles_seo.mjs` against live Shopify Admin API.
   - Run verification queries against live Admin GraphQL API and storefront to confirm:
     - 100% of pages have single `<h1>`
     - 100% of pages have title <= 60 chars, description 145-158 chars, zero `&amp;` artifacts
     - `/pages/contact-us` description has correct email
     - `/pages/uk-product-catalog` links all 11 unindexed pages
     - Footer menu contains 16 items including about-us, uk-product-catalog, and studio-lookbook-social-feed
     - 100% of articles have title <= 60 chars, description 145-158 chars, no "Extended Mo" truncations, cross-links present.
   - Run `node catalog_uniqueness_and_seo_lint_gate.mjs` if available to ensure all gates pass.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_1\handoff.md`
Report command lines, execution logs, and verification proof.
Send completion message to parent sub-orchestrator.
