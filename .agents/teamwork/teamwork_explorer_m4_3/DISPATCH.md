# DISPATCH — Explorer 3 (Milestone 4: Internal Linking, Unindexed Pages & Menu Navigation)

## Objective
Investigate and formulate the exact remediation specification for internal linking, linking unindexed pages from `/pages/uk-product-catalog` and footer menu, and cross-linking blog articles to satisfy Requirement R4.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Survey 2 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
- Audited Pages: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_pages.json
- Audited Articles: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_articles.json
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json

## Scope of Investigation
1. Identify the 11 unindexed/orphaned static pages identified in Survey 2 that lack internal link pathways (e.g. `/pages/about-us`, `/pages/uk-product-catalog`, `/pages/studio-lookbook-social-feed`, etc.).
2. Inspect the current body HTML of `/pages/uk-product-catalog` (`gid://shopify/Page/140089884983`). Formulate clean, semantic HTML hub content linking all 11 unindexed pages and core pillar guides.
3. Inspect the footer navigation menu (`gid://shopify/Menu/221177086263`). Formulate the exact `menuUpdate` mutation payload to add key unindexed pages (`/pages/about-us`, `/pages/uk-product-catalog`, `/pages/studio-lookbook-social-feed`) to the footer navigation.
4. Inspect the 8 uncrawled blog articles and 14 uncrawled smart sub-collections.
5. Formulate contextual internal link mappings to inject into the 25 blog articles so that indexed articles link to uncrawled articles and uncrawled smart sub-collections naturally with keyword-rich anchor text.
6. Output a complete, verified mapping in your state folder: `internal_linking_spec.json`.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\handoff.md`
Send completion message to parent sub-orchestrator.


## 2026-11-14T02:34:54Z
[Message] timestamp=2026-11-14T02:34:54Z sender=66755ac4-eeb3-414d-aa4d-be0b45896b18 priority=MESSAGE_PRIORITY_HIGH content=You are Explorer 3 for Milestone 4 (Phase 4 — Page & Article SEO Remediation).
Your state folder is: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3
Your task assignment is in: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_3\DISPATCH.md

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md.
Also read PROJECT.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md and SCOPE.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md.
Read Survey 2 files:
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_pages.json
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_articles.json

Investigate internal linking pathways:
1. The 11 unindexed/orphaned static pages identified in Survey 2 that need internal link pathways.
2. The current body HTML of /pages/uk-product-catalog (gid://shopify/Page/140089884983) and how to link all 11 unindexed pages and core pillar guides.
3. The footer navigation menu (gid://shopify/Menu/221177086263) and exact menuUpdate mutation payload to add key unindexed pages (/pages/about-us, /pages/uk-product-catalog, /pages/studio-lookbook-social-feed).
4. The 8 uncrawled blog articles and 14 uncrawled smart sub-collections, formulating exact contextual cross-link injection specs for the 25 blog articles.
Write your complete specification to internal_linking_spec.json in your state folder, and write your report to handoff.md in your state folder.
When complete, notify parent conversation 66755ac4-eeb3-414d-aa4d-be0b45896b18 via send_message.
