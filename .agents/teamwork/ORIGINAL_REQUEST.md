# Original User Request

## Initial Request — 2026-11-13T00:08:14Z

Implement the 6-phase Google Search Console position and impressions recovery plan directly against the live production Prints With Passion Shopify store (https://printswithpassion.com/) and automation repository.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
Integrity mode: development

## Reference Material
- Target Storefront: https://printswithpassion.com/
- Shopify Admin API: bencook96store.myshopify.com (Active Main Theme ID: gid://shopify/OnlineStoreTheme/177936466293)
- Automation Codebase: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine (git remote: https://github.com/BenCook1996/prints-with-passion-automations on main)
- Local Credential Files: .shopify_token.json and .gcp_service_account.json in C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\
- Plan Artifact: C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\gsc_position_and_impressions_recovery_plan.md
- Walkthrough Artifact: C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\walkthrough.md
- Diagnostic Verification Scripts: C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch\gsc_deep_dive_part5_root_causes_verification.mjs (and parts 1–6 in the same directory)

## Requirements

### R1. Phase 1 — Homepage & Theme SEO Overhaul
On active theme gid://shopify/OnlineStoreTheme/177936466293, update the shop/homepage <title> to "Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion" (<= 60 characters) and meta description to "Shop archival framed canvas wall art (1.25\" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats.". Demote the decorative brand badge from <h1> to a non-heading element (<div> or <p>) so the live homepage renders exactly one semantic <h1> element enriched with commercial intent. Repair the malformed customer authentication URL and fix the contact email typo (printswithpasssionbc@gmail.com -> printswithpassionbc@gmail.com). Add a clean, crawlable "Shop All 48 Curated Studio Collections" hub directory block on the homepage and parent collection pages (/collections/canvas-prints, /collections/desk-mats, /collections/pillow-cases, /collections/blankets, /collections/bath-mats, /collections/apparel) placing all 48 smart sub-collections within one click of the homepage.

### R2. Phase 2 — Collection & Redirect Hygiene
Delete the 28 discontinued 0-product legacy collections from Shopify Admin via collectionDelete (preserving frontpage if required by Shopify): dog-collars, laundry-bags, duffle-bags, clutch-bags, phone-cases, beach-towels, mugs, journals, wall-tapestry, puzzles, shoes, hats, bottles, tote-bags, suitcases, yoga-mats, makeup-bags, coasters, pet-mat, bottle-opener, pet-bowls, bags, bags-1, pets-animals, can-cooler, posters, rugs, and mousepads. Create server-side 301 redirects (urlRedirectCreate) for all legacy collection paths to their closest active parent collection. Unpublish /collections/avada-upsell-best-sellers from the Online Store publication so it exits sitemap_collections_1.xml. Audit all existing urlRedirects in Shopify Admin: remove improper redirects on active blog guides (e.g. /blogs/news/uk-student-room-rental-flat-decor-guide) and repair any redirect target paths containing literal %20 encoded spaces.

### R3. Phase 3 — Bulk Optimization of Active Collection SEO Metadata
Populate bespoke, word-boundary-safe (<= 60 characters), high-intent commercial seo.title values across all 66 active collections currently missing titles or showing default fallback values, and fix /collections/japanese-anime-desk-mats and /collections/abstract-minimalist-bauhaus-canvas-wall-art. Rewrite all collection seo.description fields (140–158 characters) as grammatically complete, plain text sentences free of double-escaped HTML entities (&quot;, &amp;quot;) and broken template phrasing ("Transform with...", "Elevate with...", "Style with...").

### R4. Phase 4 — Page & Article SEO Remediation
Across all 36 pages in sitemap_pages_1.xml (including all 28 *-uk-guide pillar pages), convert inner <h1> tags inside page.body to <h2> so every page renders strictly one <h1> element with zero &amp; entity artifacts. Populate clean, word-boundary-safe seo.title (<= 60 characters) and plain-text seo.description (145–158 characters) so no guide page falls back to breadcrumb meta descriptions, and link unindexed pages from /pages/uk-product-catalog or the footer navigation. Across all 25 blog articles in sitemap_articles_1.xml, repair mid-word truncated titles and add contextual internal links between indexed articles, uncrawled articles, and uncrawled smart sub-collections.

### R5. Phase 5 — Automation Scripts Upgrade
In gsc_ga4_gmc_cloud_sync.mjs, only submit sitemap PUT requests when a sitemap is missing from GSC or reports errors (preserving LastSubmitted date and indexing history), and incorporate rotating urlInspection/index:inspect health tracking. In strikezone_ctr_and_competitor_rewriter.mjs, replace hard character truncation (.slice(0, 66)) with word-boundary-safe title truncation (<= 60 characters) and prevent collection titles from being overwritten by single-product keywords. In catalog_uniqueness_and_seo_lint_gate.mjs and verify_40_subcollections_counts.mjs, implement validation checks for double-escaped entities (&quot;, &amp;), template grammar fragments, truncated titles, and 0-product collections.

### R6. Phase 6 — Verification, Deployment & GitHub Actions Sync
Execute diagnostic verification scripts against the live storefront and Shopify Admin API to verify HTTP response codes, single <h1> structure, title lengths, unescaped meta descriptions, and hub navigation links. Commit and push updated scripts and logs to the main branch of https://github.com/BenCook1996/prints-with-passion-automations, trigger the pwp-daily-technical-seo.yml GitHub Actions workflow, verify successful completion, and document results in walkthrough.md.

## Acceptance Criteria

### Storefront & Theme Verification
- [ ] Live homepage returns HTTP 200 with strictly one semantic <h1> element.
- [ ] Live homepage <title> is <= 60 characters and matches "Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion".
- [ ] Live homepage <meta name="description"> matches the target description without escaped entity artifacts.
- [ ] Homepage and parent collection pages render crawlable links to all 48 smart sub-collections.
- [ ] Contact email typo and malformed customer authentication links are resolved on the live storefront.

### Collection & Redirect Hygiene
- [ ] All 28 discontinued 0-product collections are removed from Shopify Admin (or unpublished from Online Store where required).
- [ ] Server-side 301 redirects are active and return HTTP 301 -> 200 for all 28 legacy collection handles to their target active collections.
- [ ] /collections/avada-upsell-best-sellers is unpublished from Online Store and absent from sitemap_collections_1.xml.
- [ ] No active Shopify urlRedirect target contains literal %20 characters.
- [ ] Active blog guides (e.g. uk-student-room-rental-flat-decor-guide) are accessible and not redirected to collections.

### Metadata & Content Standards
- [ ] All active collections have non-null, word-boundary-safe seo.title (<= 60 characters) and unescaped seo.description (140–158 characters, no raw or double-escaped entities).
- [ ] All 36 static/guide pages render strictly one <h1> tag and have non-default seo.title and seo.description.
- [ ] Truncated blog article titles are repaired and cross-links are present in article content.

### Automation Scripts & CI
- [ ] gsc_ga4_gmc_cloud_sync.mjs executes without re-submitting already-registered, error-free sitemaps.
- [ ] strikezone_ctr_and_competitor_rewriter.mjs uses word-boundary title limits (<= 60 chars) and protects collection titles.
- [ ] catalog_uniqueness_and_seo_lint_gate.mjs passes with zero lint failures.
- [ ] Updated files are committed to main and pwp-daily-technical-seo.yml workflow completes with status SUCCESS.
- [ ] walkthrough.md is updated with execution results and verification logs.


## Follow-up — 2026-11-14T02:26:31Z

A server restart occurred and stopped background subagents. Please check your Teamwork run status right now, report how far execution got before the restart, and resume/continue any remaining milestones through Phase 6 completion.


## Follow-up — 2026-11-14T12:50:44Z

A temporary host network/DNS drop ("no such host" while the PC slept) paused your execution, and network connectivity is now restored. Please check the current state of Milestones 3, 4, 5, E2E, and Milestone 6 right now and resume execution through full completion and verification.
