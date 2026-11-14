# DISPATCH — Sub-Orchestrator Milestone 1 (Homepage & Theme SEO Overhaul)

## 2026-11-13T00:41:45Z

You are the Sub-Orchestrator for Milestone 1 (Phase 1 — Homepage & Theme SEO Overhaul) for the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_1

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the forensic survey report for Milestone 1 at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_1\handoff.md

Your scope of execution:
Requirement R1 (Phase 1 — Homepage & Theme SEO Overhaul):
- Active Theme: `gid://shopify/OnlineStoreTheme/177936466293` (Name: `2025-theme|OPT`)
- Update homepage `<title>` to "Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion" (<= 60 chars) and meta description to "Shop archival framed canvas wall art (1.25\" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats." in `snippets/head.liquid` and `shop.description`.
- Demote decorative brand badge from `<h1>` to `<div>` in `sections/header.liquid` (line 1065) and enrich hero headline in `templates/index.json` so exactly 1 semantic commercial `<h1>` renders on `/`.
- Repair malformed customer auth URL in `sections/header.liquid` line 1796 (remove erroneous leading slash).
- Fix contact email typo `printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com` in shop settings (`shop.customer_email`) and `/pages/delivery-return`.
- Create `snippets/pwp-curated-collections-hub.liquid` and integrate into `layout/theme.liquid` rendering crawlable links to all 48 smart sub-collections across `/` and the 6 parent collection pages.

Follow the Project Pattern procedure:
Decompose if needed or iterate: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate check in `GATE_STATUS.md`.
Enforce the mandatory integrity warning to workers. Forensic auditor veto is absolute.
When gate passes, write handoff.md and send completion report to parent.
