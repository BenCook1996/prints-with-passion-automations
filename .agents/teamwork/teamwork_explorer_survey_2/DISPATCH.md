## 2026-11-13T00:10:43Z
You are an Explorer subagent for the survey phase of the Prints With Passion SEO recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Your scope of investigation:
Requirements R2, R3, R4 (Phases 2, 3, 4 — Collections, Redirects, Pages, Articles):
- Check credentials (.shopify_token.json in working directory) and test Shopify Admin GraphQL/REST API connectivity.
- Enumerate the 28 discontinued 0-product collections listed in R2 (dog-collars, laundry-bags, duffle-bags, clutch-bags, phone-cases, beach-towels, mugs, journals, wall-tapestry, puzzles, shoes, hats, bottles, tote-bags, suitcases, yoga-mats, makeup-bags, coasters, pet-mat, bottle-opener, pet-bowls, bags, bags-1, pets-animals, can-cooler, posters, rugs, mousepads), identify their GIDs and target redirect parent handles. Check frontpage collection constraints.
- Inspect /collections/avada-upsell-best-sellers publication status and sitemap presence.
- Audit Shopify urlRedirects: identify broken redirects on active blog guides (e.g. /blogs/news/uk-student-room-rental-flat-decor-guide) and redirects containing literal %20 encoded spaces.
- Inspect the 66 active collections, checking their current seo.title, seo.description, double-escaped entities (&quot;, &amp;quot;), template phrases ("Transform with...", etc.), and the two specific collections mentioned in R3 (/collections/japanese-anime-desk-mats and /collections/abstract-minimalist-bauhaus-canvas-wall-art).
- Inspect the 36 pages in sitemap_pages_1.xml (28 *-uk-guide pages) for inner <h1> tags in body, &amp; entities, seo.title, seo.description, and footer/catalog link coverage.
- Inspect the 25 blog articles in sitemap_articles_1.xml for truncated titles and internal link opportunities.
- Review reference materials:
  * C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\gsc_position_and_impressions_recovery_plan.md
  * C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\walkthrough.md
  * C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch\gsc_deep_dive_part5_root_causes_verification.mjs

Write your detailed findings, verified evidence, GIDs, handles, redirect mapping proposals, title/description templates, and concrete implementation strategy to:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2\handoff.md
Update progress.md in your state folder as you work.
When finished, notify the orchestrator with send_message.
