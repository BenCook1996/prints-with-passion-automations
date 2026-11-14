# DISPATCH — Explorer 2 (Milestone 4: Blog Article SEO Remediation)

## Objective
Investigate and formulate the exact remediation specification for all 25 blog articles in `sitemap_articles_1.xml` to satisfy Requirement R4.

## Authoritative Inputs
- `ORIGINAL_REQUEST.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md (MANDATORY: read first)
- `PROJECT.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md
- `SCOPE.md`: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md
- Survey 2 Handoff: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
- Audited Articles: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_articles.json
- Article SEO Proposals: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\article_seo_proposals.json
- Local Token: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json

## Scope of Investigation
1. Verify the 25 articles against live Shopify Admin GraphQL API or `audited_articles.json`.
2. Inspect article titles: identify all mid-word truncated titles (e.g. `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` ending in "Extended Mo" or other articles cut off prematurely).
3. Formulate polished, word-boundary safe, high-CTR `seo.title` (strictly <= 60 characters) and complete article `title` values. Note: In `article_seo_proposals.json`, some proposals were truncated awkwardly (e.g., ending with "Above a UK", "IKEA Karlby & Lagkapten", or descriptions ending with "dimensions and."). Formulate clean, complete, high-quality titles and descriptions.
4. Formulate clean `seo.description` for all 25 articles: strictly 145–158 characters, full grammatically correct sentences, plain text, zero double-escaped entities.
5. Output a complete, verified mapping in your state folder: `article_remediation_spec.json`.

## Completion Criteria
Write your complete report to `handoff.md` in your state folder:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_2\handoff.md`
Send completion message to parent sub-orchestrator.
