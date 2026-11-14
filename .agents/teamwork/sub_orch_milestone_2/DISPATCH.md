# DISPATCH — Sub-Orchestrator Milestone 2 (Collection & Redirect Hygiene)

## 2026-11-13T00:41:55Z

You are the Sub-Orchestrator for Milestone 2 (Phase 2 — Collection & Redirect Hygiene) for the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_2

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the global project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the forensic survey report for Milestone 2 at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
(including `discontinued_28_details.json` and `avada_publications.json` in that directory)

Your scope of execution:
Requirement R2 (Phase 2 — Collection & Redirect Hygiene):
1. Delete the 28 discontinued 0-product legacy collections via `collectionDelete` using their exact GIDs, strictly preserving `frontpage` (`gid://shopify/Collection/437768978743`).
2. Create/update server-side 301 redirects (`urlRedirectCreate` / `urlRedirectUpdate`) for all 28 legacy collection handles to their target active collections.
3. Unpublish `/collections/avada-upsell-best-sellers` (`gid://shopify/Collection/441651298615`) from the Online Store publication (`gid://shopify/Publication/124388507959`) via `publishableUnpublish`.
4. Delete improper redirect `gid://shopify/UrlRedirect/1701624414581` on `/blogs/news/uk-student-room-rental-flat-decor-guide` and publish article `gid://shopify/Article/1016204886389` via `articleUpdate`.
5. Repair all 15 redirect targets containing literal `%20` encoded spaces to clean canonical handles.

Follow the Project Pattern procedure:
Iterate: Explorer -> Worker -> Reviewer -> Challenger -> Forensic Auditor -> Gate check in `GATE_STATUS.md`.
Enforce mandatory integrity warning to workers. Forensic auditor veto is absolute.
When gate passes, write handoff.md and send completion report to parent.
