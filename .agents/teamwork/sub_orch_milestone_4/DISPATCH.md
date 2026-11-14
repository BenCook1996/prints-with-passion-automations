# DISPATCH — Sub-Orchestrator Milestone 4 (Page & Article SEO Remediation)

## 2026-11-14T02:30:30Z

You are the Sub-Orchestrator for Milestone 4 (Phase 4 — Page & Article SEO Remediation) for the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the pre-compiled proposals and audit at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\page_seo_proposals.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_pages.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\article_seo_proposals.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\audited_articles.json
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md

Your scope of execution:
Requirement R4 (Phase 4 — Page & Article SEO Remediation):
1. Across all 36 pages in `sitemap_pages_1.xml` (including all 28 `*-uk-guide` pillar pages):
   - Convert inner `<h1>` tags inside `page.body` to `<h2>` so every page renders strictly one `<h1>` element with zero `&amp;` entity artifacts.
   - Populate clean, word-boundary-safe `seo.title` (<= 60 characters) and plain-text `seo.description` (145–158 characters) so no guide page falls back to breadcrumb meta descriptions.
   - Link unindexed pages from `/pages/uk-product-catalog` or the footer navigation.
   - Fix `/pages/contact-us` meta description typo (`printswithpasssionbc@gmail.com`).
2. Across all 25 blog articles in `sitemap_articles_1.xml`:
   - Repair mid-word truncated titles (e.g. `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` ending in "Extended Mo").
   - Populate clean `seo.title` (<= 60 chars) and plain-text `seo.description` (145-158 chars).
   - Add contextual internal links between indexed articles, uncrawled articles, and uncrawled smart sub-collections.
3. Execute mutations against live Shopify Admin GraphQL API (`pageUpdate`, `articleUpdate`).

Follow the Project Pattern procedure:
Iterate: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate check in `GATE_STATUS.md`.
Enforce mandatory integrity warning to workers. Forensic auditor veto is absolute.
When gate passes, write handoff.md and send completion report to parent via send_message.


## 2026-11-14T15:09:11Z

**Context**: Milestone 4 (Page & Article SEO Remediation) Final Gate
**Content**: Worker 4 has completed live verification (339/339 live crawl checks pass, 913/913 boundary assertions pass, 10/10 live E2E Feature 15 pass). All other milestones (M1, M2, M3, M5, E2E Track) are complete.
**Action**: Please complete your Gate 2 verification (Reviewers, Challengers, Forensic Auditor) and deliver your final milestone handoff so we can advance to Milestone 6.
