# DISPATCH — Explorer 1 (Milestone 4: Page SEO Remediation)

## Objective
Investigate and formulate the exact remediation specification for all 36 static pages in `sitemap_pages_1.xml` (including the 28 `*-uk-guide` pillar pages) to satisfy Requirement R4.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Survey 2 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
- Audited Pages: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_pages.json
- Page SEO Proposals: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\page_seo_proposals.json
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json

## Scope of Investigation
1. Verify the 36 pages against live Shopify Admin GraphQL API (using `lib/cloud-env.mjs` pattern or reading `audited_pages.json`).
2. Audit every page's `body` HTML: identify all inner `<h1>` tags needing conversion to `<h2>` so that exactly one `<h1>` renders per page.
3. Check for HTML entity artifacts (`&amp;`) in titles, descriptions, and body content, specifying the exact replacement (`&`).
4. Validate and refine the proposed `seo.title` (strictly <= 60 characters, word-boundary safe) and `seo.description` (strictly 145–158 characters, plain text, grammatically complete sentences, zero truncated words).
5. Check `/pages/contact-us` for the typo `printswithpasssionbc@gmail.com` and specify correction to `printswithpassionbc@gmail.com`.
6. Output a complete, verified mapping in your state folder: `page_remediation_spec.json`.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\handoff.md`
Send completion message to parent sub-orchestrator.


## 2026-11-14T02:34:27Z
You are Explorer 1 for Milestone 4 (Phase 4 — Page & Article SEO Remediation).
Your state folder is: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1
Your task assignment is in: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\DISPATCH.md

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md.
Also read PROJECT.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md and SCOPE.md at C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md.
Read Survey 2 files:
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_pages.json
- C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\page_seo_proposals.json

Investigate the 36 static pages in sitemap_pages_1.xml (including the 28 *-uk-guide pillar pages). Formulate exact replacements for inner <h1> to <h2> in page.body, sanitize &amp; artifacts, validate/refine seo.title (<= 60 chars) and seo.description (145-158 chars), and identify the contact-us email typo fix.
Write your complete specification to page_remediation_spec.json in your state folder, and write your report to handoff.md in your state folder.
When complete, notify parent conversation 66755ac4-eeb3-414d-aa4d-be0b45896b18 via send_message.
