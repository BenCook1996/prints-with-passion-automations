# E2E Test Specification & Recovery Test Runner Architecture Report

**Track**: Prints With Passion E2E Testing Track  
**Author**: `teamwork_spec_miner` (`spec_miner_e2e_1`)  
**Date**: 2026-11-13  
**Status**: COMPLETE — Test Specification Matrix & Runner Architecture Ready  
**Target Repository**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  

---

## 1. Observation

Authoritative diagnostic investigations were conducted directly against live production endpoints (`https://printswithpassion.com/`), Shopify Admin API (`bencook96store.myshopify.com` via `lib/cloud-env.mjs`), Google Search Console API (`sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`), diagnostic forensics scripts (`gsc_deep_dive_part5_root_causes_verification.mjs` and parts 1–6 in `C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch\`), and repository codebase files.

### Verbatim Live Storefront & API Observations:
1. **Homepage Metadata & DOM (`https://printswithpassion.com/`)**:
   - Live `<title>`: `"Stylish Wall Art, Hoodies, T-Shirts &amp; More | Perfect Decor &amp; Accessori"` (68 characters; cut off mid-word at `Accessori`; lacks brand name and primary commercial categories).
   - Live `<meta name="description">`: `"Shop stylish wall art, hoodies, t-shirts, posters, makeup bags, desk mats, puzzles, duvet covers, an"` (100 characters; cut off mid-word at `an`; advertises deleted categories: posters, makeup bags, puzzles, duvet covers).
   - Live `<h1>` tags: Renders `2` distinct `<h1>` elements:
     * `<h1>P Prints With Passion ARCHIVAL PRINT STUDIO</h1>` (decorative brand badge logo in `sections/header.liquid`)
     * `<h1>Art built for quiet rooms</h1>` (hero banner text)
   - Malformed links & typos: Live HTML contains `<a href="/https://printswithpassion.com/customer_authentication/redirect?locale=en&region_country=US">` causing a 404 crawl trap, and footer contact email `printswithpasssionbc@gmail.com` with triple-s typo.
   - Click depth & sub-collection crawlability: Out of 48 Smart Sub-Collections, only 3 are linked from the homepage or main nav; 45 sub-collections have 0 links from `/`.

2. **Legacy Collections & Server-Side 301 Redirects**:
   - `HTTP 404` returned on discontinued 0-product collections:
     * `/collections/dog-collars` -> `HTTP 404` (ranks at Pos 66.4 in GSC)
     * `/collections/laundry-bags` -> `HTTP 404` (ranks at Pos 82.6 in GSC)
     * `/collections/duffle-bags` -> `HTTP 404` (ranks at Pos 89.7 in GSC)
     * `/collections/clutch-bags` -> `HTTP 404` (ranks at Pos 82.0 in GSC)
     * `/collections/phone-cases` -> `HTTP 404`
     * `/collections/beach-towels` -> `HTTP 404`
     * `/collections/mugs` -> `HTTP 404`
   - Unwanted redirects on editorial guides:
     * `/blogs/news/uk-student-room-rental-flat-decor-guide` -> `HTTP 301 -> /collections/canvas-prints`
   - Malformed redirect targets with URL-encoded `%20`:
     * Targets like `/products/neon%20throw%20blanket-tropical-nights-good-times` exist in `urlRedirects`.
   - App-generated collection in sitemap:
     * `/collections/avada-upsell-best-sellers` returns `HTTP 200` with `<meta name="robots" content="noindex, follow">`, while published in `sitemap_collections_1.xml`.

3. **Active Collection Metadata & Entity Escaping**:
   - 66 out of 70 collections in `sitemap_collections_1.xml` have `seo.title = null`, falling back to unadorned titles like `"Canvas Wall Art | Prints With Passion"`.
   - Double-escaped HTML entities in `seo.description`:
     * `/collections/canvas-prints`: `"Transform with Canvas Wall Art (1.25&amp;quot; Pine Frame (8x10&amp;quot;–24x36&amp;quot;))..."`
     * `/collections/blankets`: `"Style with Plush Throw Blankets (300 GSM Fleece (50x60&amp;quot; / 60x80&amp;quot;))..."`
     * `/collections/bath-mats`: `"Refresh with Memory Foam Bath Mats (Memory Foam (60x40cm / 24x16&amp;quot;))..."`
   - Overwritten & truncated collection titles:
     * `/collections/japanese-anime-desk-mats`: `<title>` is overwritten with single product title `"Japanese Wave Desk Mat | 900x400x4mm (35.4"x15.7") Stitched Pad"`.
     * `/collections/abstract-minimalist-bauhaus-canvas-wall-art`: `<title>` truncated mid-word to `"Minimalist Bauhaus Canvas Print | 1.25" Pine Framed Canvas (CM & I"`.

4. **Static Pages & Blog Articles**:
   - All 28 `*-uk-guide` pages (e.g. `/pages/xxl-extended-gaming-desk-mats-uk-guide`) render `2` identical `<h1>` elements (one theme heading + one body heading with `&amp;`), missing `seo.description`, and falling back to breadcrumb text (`"Home › UK Catalog Directory › ... &amp;amp;"`).
   - Blog article `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared`: `<title>` truncated to `"UK Desk Mat Size Guide (2026): 60×35 cm XL vs 80×40 cm XXL Extended Mo"`.

5. **Codebase Scripts Inspection**:
   - `gsc_ga4_gmc_cloud_sync.mjs`: Lines 170–176 execute unconditional `PUT` requests for all sitemaps on every run, resetting `LastSubmitted` dates in GSC.
   - `strikezone_ctr_and_competitor_rewriter.mjs`: Lines 30, 36, 41 execute `.slice(0, 66)` without word-boundary awareness, and lack collection theme guards.
   - `catalog_uniqueness_and_seo_lint_gate.mjs`: Lacks rules checking for double-escaped `&quot;`, broken template grammar (`Transform with`), and empty 0-product collections.
   - `verify_40_subcollections_counts.mjs`: Only checks 48 sub-collections, not storewide active collections.

---

## 2. Logic Chain

1. **Root Cause Analysis**: The stagnation in GSC impressions and Average Position (dragging at 32.17 sitewide) stems directly from:
   - 50.6% of impression-receiving URLs being 404 ghost pages or broken redirect chains.
   - 85% of catalog products and 14 sub-collections being unindexed (`LastCrawl: NEVER`) due to lack of internal link equity.
   - Broken snippets (mid-word truncated titles, double-escaped `&amp;quot;`, breadcrumb description leaks) driving CTR to 0% and depressing Google rank.
2. **Requirement Mapping**: To permanently remediate these root causes, 23 interconnected features across 6 phases (R1–R6) plus E2E runner infrastructure must be verified with automated test assertions.
3. **Dual-Track Testing Mandate**: Because implementations will modify theme files, Shopify Admin records (redirects, collections, pages, articles), and cloud automation scripts, an independent 4-tier E2E recovery test suite must be built to validate each feature in isolation, at boundary limits, in cross-feature interaction, and under real-world crawler simulations.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Theme SEO | Homepage SEO Metadata | Homepage `<title>` strictly `<= 60` chars and `<meta name="description">` (140–158 chars) | HTTP GET `/` | HTML `<title>` & `<meta description>` | Truncated titles (>60 chars) or entity bugs | PROJECT.md R1, `gsc_deep_dive_part5` |
| 2 | Theme SEO | Semantic `<h1>` Demotion | Demote decorative logo to `<div>` in `sections/header.liquid`; live index renders exactly 1 commercial `<h1>` | HTTP GET `/` | DOM `<h1>` count === 1 | Multiple `<h1>`s or missing commercial terms | PROJECT.md R1, `gsc_deep_dive_part5` |
| 3 | Theme SEO | Customer Auth URL Repair | Remove leading `/` in line 1796 of `sections/header.liquid` to prevent 404 crawl trap | HTTP GET `/` | Valid customer login URL | Crawl trap `href="/http..."` | PROJECT.md R1, `ORIGINAL_REQUEST.md` |
| 4 | Theme SEO | Contact Email Typo Correction | Cure `printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com` | HTTP GET `/`, `/pages/delivery-return` | HTML text contains clean email | Triple-s typo in HTML | PROJECT.md R1, `ORIGINAL_REQUEST.md` |
| 5 | Theme SEO | Curated Studio Hub Directory | Deploy `snippets/pwp-curated-collections-hub.liquid` linking all 48 sub-collections from `/` & 6 parents | HTTP GET `/` & 6 parent collection URLs | 48 `<a href="/collections/...">` present | Missing sub-collection links (click depth > 1) | PROJECT.md R1, `phase2_40_subcollections.json` |
| 6 | Redirect Hygiene | Delete 28 Legacy Collections | Execute `collectionDelete` for 28 0-product collections while keeping `frontpage` | Shopify GraphQL query | Handles return null; preserved `frontpage` | Non-deleted collections remain in GMC/sitemaps | PROJECT.md R2, `gsc_deep_dive_part4` |
| 7 | Redirect Hygiene | Create 301 Legacy Redirects | Server-side 301 redirects for 28 legacy collection handles to active parents | HTTP GET `/collections/<legacy>` | HTTP 301 -> active parent (200) | HTTP 404 on legacy handles | PROJECT.md R2, `gsc_deep_dive_part5` |
| 8 | Redirect Hygiene | Unpublish AVADA Collection | `publishableUnpublish` against Online Store for `avada-upsell-best-sellers` | `sitemap_collections_1.xml` & GraphQL | Collection excluded from sitemap | Collection remains indexed with noindex conflict | PROJECT.md R2, `gsc_deep_dive_part4` |
| 9 | Redirect Hygiene | Blog Guide Redirect Fix & Publication | Delete redirect on `/blogs/news/uk-student-room-rental-flat-decor-guide` & publish | HTTP GET blog URL | HTTP 200 with article body | Redirect to `/collections/canvas-prints` | PROJECT.md R2, `gsc_deep_dive_part6` |
| 10 | Redirect Hygiene | Fix %20 Redirect Targets | Audit and repair 15 product redirects with `%20` spaces | Shopify GraphQL `urlRedirects` | Clean hyphenated target paths | Literal `%20` in redirect target | PROJECT.md R2, `gsc_deep_dive_part6` |
| 11 | Metadata SEO | Active Collection Titles | Bespoke, word-boundary `seo.title` (<=60 chars) on all active collections | Shopify GraphQL & HTTP GET | `<title>` length <= 60 chars | Generic fallback or mid-word cut | PROJECT.md R3, `gsc_deep_dive_part4` |
| 12 | Metadata SEO | Active Collection Descriptions | Rewrite `seo.description` (140–158 chars) with plain text and no broken grammar | Shopify GraphQL & HTTP GET | Clean description, no `&quot;` | Double-escaped entities `&amp;quot;` | PROJECT.md R3, `gsc_deep_dive_part5` |
| 13 | Metadata SEO | Specific Collections Fix | Fix anime desk mats title overwrite & bauhaus canvas title truncation | HTTP GET both collections | Commercial plural titles <= 60 chars | Single-product title or `(CM & I` cut | PROJECT.md R3, `gsc_deep_dive_part5` |
| 14 | Content SEO | Page Inner `<h1>` Conversion | Convert inner `<h1>` in `page.body` to `<h2>` across 36 pages; strictly 1 `<h1>` | HTTP GET 36 page URLs | DOM `<h1>` count === 1 per page | Multiple `<h1>`s or `&amp;` in heading | PROJECT.md R4, `gsc_deep_dive_part5` |
| 15 | Content SEO | Page SEO Metadata & Links | Word-boundary `seo.title` (<=60) and `seo.description` (145-158) on 36 pages; hub links | HTTP GET 36 page URLs & catalog hub | Clean metadata; all pages linked | Breadcrumb description fallback | PROJECT.md R4, `gsc_deep_dive_part5` |
| 16 | Content SEO | Blog Article Titles & Internal Links | Fix truncated titles; add contextual links to 8 uncrawled articles & 14 sub-collections | HTTP GET 25 blog articles | Complete titles; contextual internal links | Mid-word title cut `Extended Mo` | PROJECT.md R4, `gsc_deep_dive_part5` |
| 17 | Cloud Automation | Sitemap Submission Idempotency | Update `gsc_ga4_gmc_cloud_sync.mjs` to only PUT missing or errored sitemaps | `gsc_ga4_gmc_cloud_sync.mjs` execution | Unchanged sitemaps skipped | Daily reset of `LastSubmitted` | PROJECT.md R5, `ORIGINAL_REQUEST.md` |
| 18 | Cloud Automation | Rotating URL Inspection Health | Integrate rotating 15-URL inspection batch into `gsc_ga4_gmc_cloud_sync.mjs` | GSC URL Inspection API | Metrics logged to snapshot | Quota burn or missing index stats | PROJECT.md R5, `gsc_deep_dive_part2` |
| 19 | Cloud Automation | Title Boundary Truncator & Guard | Upgrade `strikezone_ctr_and_competitor_rewriter.mjs` with `fitTitleUnder60Chars` & plural guard | Function execution with test inputs | String length <= 60; word-boundary safe | Mid-word cuts or single-product collection title | PROJECT.md R5, `ORIGINAL_REQUEST.md` |
| 20 | Cloud Automation | SEO Lint Gate & Storewide Validator | Upgrade `catalog_uniqueness_and_seo_lint_gate.mjs` with entity, grammar, and 0-product rules | Script execution | Passes clean catalog; throws on bugs | Silent regression of entity/grammar bugs | PROJECT.md R5, `ORIGINAL_REQUEST.md` |
| 21 | Test Infrastructure | End-to-End Test Suite | Comprehensive 4-Tier test runner covering all requirements R1–R6 | CLI `tests/e2e_recovery_test_runner.mjs` | TAP output + summary + JSON | Test failures reported with diffs | PROJECT.md E2E Track |
| 22 | Adversarial SEO | Adversarial Hardening (Tier 5) | White-box adversarial testing of edge cases, race conditions, entity escaping, API pacing | Adversarial inputs to test runner | All boundary & corrupt inputs handled | Unhandled promise rejections, leaky bucket 429 | PROJECT.md M6 |
| 23 | CI/CD Deployment | Git Deployment & Cloud Sync | Commit, push to `origin/main`, trigger GitHub Action workflow, verify walkthrough | Git & GitHub Actions CLI | Workflow green; walkthrough updated | Dirty tree, failed CI run | PROJECT.md R6, `walkthrough.md` |

---

## 4. Edge Cases Discovered

| # | Feature | Input | Observed Behavior | Required Handling |
|---|---------|-------|-------------------|-------------------|
| 1 | F1 / F11 | Title with trailing punctuation / open parenthesis: `Canvas Prints (8x10` | Cuts off in the middle of dimensions or parentheses | Truncator must strip trailing open parenthesis or dangling delimiters |
| 2 | F1 / F12 | Raw double quote `"` inside liquid `meta description` | Browser renders `&amp;quot;` if double-escaped | Pass unescaped plain string or ensure theme filter uses `escape` exactly once |
| 3 | F5 | Parent collection with no products matching a tag | Liquid hub block might render empty links | Hub snippet must render fixed 48 sub-collection paths regardless of inventory |
| 4 | F6 | Collection `frontpage` requested for deletion | Shopify Admin API rejects deleting system `frontpage` | `collectionDelete` must explicitly exclude handle `frontpage` |
| 5 | F7 | Legacy handle with trailing slash: `/collections/dog-collars/` | Shopify redirect table matches `/collections/dog-collars` but may loop on slashes | Server-side redirect handles both with and without trailing slash |
| 6 | F8 | AVADA Upsell collection deleted instead of unpublished | AVADA theme scripts may break or throw JavaScript errors | Only unpublish from `Online Store` channel (`publishableUnpublish`), do not delete ID |
| 7 | F9 | Old blog handle having dual redirect and published article | Request routing precedence could prefer redirect over live article | Explicitly delete urlRedirect record before publishing article |
| 8 | F10 | Redirect target with mixed `%20` and query params: `/products/foo%20bar?variant=123` | Naive string replace corrupts query strings | URL decode, replace spaces with hyphens, re-encode query parameters |
| 9 | F14 | Static page with multiple inner `<h1>` in nested div/sections | Regex replace might only catch first `<h1>` | Use global regex `/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi` and replace all inner occurrences with `<h2$1>$2</h2>` |
| 10 | F17 | GSC API returning `sitemap: null` on freshly created site | `(listJson.sitemap || [])` throws if not guarded | Null-coalesce sitemap arrays before iterating |
| 11 | F18 | GSC Inspection API returning HTTP 429 quota exhaustion | Synchronous loop fails entire pipeline | Catch 429, log warning, backoff 2000ms, skip remaining URL batch |
| 12 | F19 | Substrate keyword shorter than 10 characters or longer than 60 characters | String builder either produces empty string or exceeds 60 chars | Fallback template ensures length between 25 and 60 chars |
| 13 | F20 | Collection with 0 products but recently created (in-progress sync) | Gate deletes collection while products are being imported | Add 24-hour age check or explicit exclusion list before auto-deletion |

---

## 5. Detailed Test Specification for All 23 Features

### Feature 1: Homepage SEO Metadata
- **Assertions**:
  1. `<title>` exists in live DOM.
  2. `title.length <= 60` characters.
  3. `title.length >= 40` characters.
  4. `title` strictly equals `"Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion"`.
  5. `<meta name="description">` exists in live DOM.
  6. `desc.length >= 140 && desc.length <= 158` characters.
  7. `desc` strictly equals `"Shop archival framed canvas wall art (1.25\" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats."`.
  8. `desc` contains NO entity artifacts: `!desc.includes('&quot;') && !desc.includes('&amp;')`.
  9. `desc` contains NO deleted merchandise terms: `!/(posters|makeup bags|puzzles|duvet covers)/i.test(desc)`.
- **Inputs**: HTTP GET `https://printswithpassion.com/`
- **Expected Outputs**: Status 200, clean `<title>` and `<meta name="description">` elements matching constraints.
- **Verification Method**: Automated Cheerio / regex inspection in `e2e_recovery_test_runner.mjs`.

### Feature 2: Semantic `<h1>` Demotion
- **Assertions**:
  1. Storefront homepage DOM has `h1s.length === 1`.
  2. The single `<h1>` contains commercial intent (e.g. `Art built for quiet rooms` or studio collection descriptor).
  3. The decorative logo badge (`P Prints With Passion ARCHIVAL PRINT STUDIO`) is NOT an `<h1>` tag (demoted to `<div>` or `<p>`).
  4. Header logo badge contains class or semantic role preserved for visual styling.
- **Inputs**: HTTP GET `https://printswithpassion.com/`
- **Expected Outputs**: Exactly 1 `<h1>` tag in response HTML.

### Feature 3: Customer Auth URL Repair
- **Assertions**:
  1. Zero occurrences of `href="/https:"` or `href="/http:"` across entire homepage HTML.
  2. Customer login link href is either `/account/login`, `https://printswithpassion.com/account/login`, or clean Shopify customer authentication redirect URL.
  3. Customer auth link returns `HTTP 200` or `HTTP 302` (NOT `HTTP 404`).
- **Inputs**: HTTP GET `https://printswithpassion.com/`
- **Expected Outputs**: All anchor hrefs start with valid relative `/` or absolute `https://` without concatenation.

### Feature 4: Contact Email Typo Correction
- **Assertions**:
  1. Zero occurrences of `passsion` (triple-s) on `https://printswithpassion.com/`.
  2. Zero occurrences of `passsion` on `https://printswithpassion.com/pages/delivery-return`.
  3. Storefront footer contains `mailto:printswithpassionbc@gmail.com`.
  4. Delivery return page contains `printswithpassionbc@gmail.com`.
- **Inputs**: HTTP GET `/` and `/pages/delivery-return`.
- **Expected Outputs**: Regex `/\bprintswithpasssion\b/i` returns 0 matches.

### Feature 5: Curated Studio Hub Directory
- **Assertions**:
  1. Homepage HTML contains crawlable hub directory container (e.g. `pwp-curated-collections-hub`).
  2. All 48 smart sub-collections from `phase2_40_subcollections.json` are present in anchor tags on `/`.
  3. The 6 parent collections (`/collections/canvas-prints`, `/collections/desk-mats`, `/collections/pillow-cases`, `/collections/blankets`, `/collections/bath-mats`, `/collections/apparel`) also contain the hub directory block.
  4. Click depth for all 48 sub-collections from `/` is strictly 1.
- **Inputs**: HTTP GET `/` and 6 parent collection URLs.
- **Expected Outputs**: 48 unique `/collections/<handle>` links in rendered DOM.

### Feature 6: Delete 28 Legacy Collections
- **Assertions**:
  1. For each of the 28 handles (`dog-collars`, `laundry-bags`, `duffle-bags`, `clutch-bags`, `phone-cases`, `beach-towels`, `mugs`, `journals`, `wall-tapestry`, `puzzles`, `shoes`, `hats`, `bottles`, `tote-bags`, `suitcases`, `yoga-mats`, `makeup-bags`, `coasters`, `pet-mat`, `bottle-opener`, `pet-bowls`, `bags`, `bags-1`, `pets-animals`, `can-cooler`, `posters`, `rugs`, `mousepads`), Shopify GraphQL `collectionByHandle` returns `null`.
  2. System collection `frontpage` exists and has ID.
  3. None of the 28 handles appear in `https://printswithpassion.com/sitemap_collections_1.xml`.
- **Inputs**: Shopify Admin GraphQL query + `sitemap_collections_1.xml`.
- **Expected Outputs**: 28 null collection records; frontpage intact; 0 legacy URLs in sitemap.

### Feature 7: Create 301 Legacy Redirects
- **Assertions**:
  1. For each of the 28 legacy collection handles, HTTP GET (redirect manual) returns `status === 301` (or 302/301 leading to 200).
  2. `Location` header points to a valid active parent collection.
  3. Final resolved destination returns `HTTP 200` (NOT 404).
  4. Mapping rules verified:
     - `wall-tapestry`, `posters` -> `/collections/canvas-prints`
     - `beach-towels`, `yoga-mats`, `pet-mat`, `rugs`, `mousepads` -> `/collections/bath-mats` or `/collections/desk-mats`
     - `hats`, `shoes`, `bags`, `bags-1`, `tote-bags`, `duffle-bags`, `clutch-bags`, `laundry-bags` -> `/collections/apparel`
- **Inputs**: HTTP GET `https://printswithpassion.com/collections/<handle>` with `{ redirect: 'manual' }`.
- **Expected Outputs**: HTTP 301 redirect status code and valid target.

### Feature 8: Unpublish AVADA Collection
- **Assertions**:
  1. `/collections/avada-upsell-best-sellers` does NOT appear in `https://printswithpassion.com/sitemap_collections_1.xml`.
  2. Shopify Admin GraphQL query verifies `resourcePublicationsV2` for AVADA collection has `Online Store` `isPublished: false`.
  3. URL does not trigger sitemap-vs-noindex contradiction warning in GSC.
- **Inputs**: `sitemap_collections_1.xml` content + Shopify GraphQL publication status.
- **Expected Outputs**: Handle absent from sitemap XML.

### Feature 9: Blog Guide Redirect Fix & Publication
- **Assertions**:
  1. Shopify Admin `urlRedirects` contains NO redirect with `path: "/blogs/news/uk-student-room-rental-flat-decor-guide"`.
  2. HTTP GET `https://printswithpassion.com/blogs/news/uk-student-room-rental-flat-decor-guide` returns `HTTP 200` (NOT 301).
  3. Article body rendered contains UK decor advice and product links.
  4. Article handle appears in `sitemap_articles_1.xml`.
- **Inputs**: HTTP GET article URL + Shopify GraphQL query.
- **Expected Outputs**: HTTP 200 status, article published, present in sitemap.

### Feature 10: Fix %20 Redirect Targets
- **Assertions**:
  1. Shopify Admin `urlRedirects` queried across all records.
  2. Zero redirect targets contain literal `%20`.
  3. Zero redirect targets contain unencoded whitespace.
  4. All targets resolve to valid handles.
- **Inputs**: Shopify GraphQL query `urlRedirects(first: 250)`.
- **Expected Outputs**: Every `target` string matches `/^\/[a-zA-Z0-9_\-\/\?=&]+$/` without `%20`.

### Feature 11: Active Collection Titles
- **Assertions**:
  1. For all active collections (`productsCount > 0`): `seo.title != null && seo.title.trim().length > 0`.
  2. `seo.title.length <= 60` characters.
  3. Title does NOT end in mid-word truncations or ellipsis (`!/[a-zA-Z0-9]\.\.\.$/`).
  4. Title does NOT end in dangling stop-words (`!/\s+(&|and|or|in|at|the|a|w\/|with)\s*$/i`).
  5. Substrate modifier present: contains one of `Canvas`, `Desk Mats`, `Cushion Covers`, `Throw Blankets`, `Bath Mats`, `Hoodies`, `Tees`, `Art`.
- **Inputs**: Shopify GraphQL collections query.
- **Expected Outputs**: 70+ collections pass 100% of length and boundary assertions.

### Feature 12: Active Collection Descriptions
- **Assertions**:
  1. For all active collections: `seo.description.length >= 140 && seo.description.length <= 158`.
  2. Plain text unescaped: `!desc.includes('&quot;') && !desc.includes('&amp;quot;') && !desc.includes('&amp;')`.
  3. Contains NO broken template phrases: `!/^(Transform|Elevate|Style|Refresh)\s+with\s+[A-Z]/i.test(desc)`.
  4. Complete grammatical sentence ending in period or exclamation point.
- **Inputs**: Shopify GraphQL collections query.
- **Expected Outputs**: All descriptions meet length and entity cleanliness.

### Feature 13: Specific Collections Fix
- **Assertions**:
  1. `/collections/japanese-anime-desk-mats`:
     - `seo.title` length <= 60 chars.
     - Title is category-level (contains plural `Desk Mats`), NOT single product (`Japanese Wave Desk Mat`).
     - Example expected title: `"Japanese Anime Desk Mats | 900x400 XXL Stitched Gaming Pads"`.
  2. `/collections/abstract-minimalist-bauhaus-canvas-wall-art`:
     - `seo.title` length <= 60 chars.
     - Title is complete and does NOT end in `(CM & I`.
     - Example expected title: `"Bauhaus & Minimalist Canvas Art | 1.25\" Framed Wall Prints"`.
- **Inputs**: HTTP GET and Shopify GraphQL for both handles.
- **Expected Outputs**: Clean, non-overwritten, non-truncated titles <= 60 chars.

### Feature 14: Page Inner `<h1>` Conversion
- **Assertions**:
  1. For all 36 pages in `sitemap_pages_1.xml`:
     - HTTP GET returns HTML with strictly `h1s.length === 1`.
     - `page.body` has zero `<h1>` tags (converted to `<h2>`).
     - Rendered `<h1>` text contains NO literal `&amp;` artifact (displays clean `&` or unescaped character).
- **Inputs**: HTTP GET for all 36 page URLs.
- **Expected Outputs**: All 36 pages have single H1 and clean typography.

### Feature 15: Page SEO Metadata & Links
- **Assertions**:
  1. For all 36 pages: `seo.title.length <= 60` and ends on word boundary.
  2. For all 36 pages: `seo.description.length >= 145 && seo.description.length <= 158`.
  3. Meta description does NOT begin with `"Home › "` breadcrumb pattern.
  4. All 4 previously unindexed pages (`/pages/about-us`, `/pages/abstract-geometric-minimalist-wall-art-decor-uk`, `/pages/studio-lookbook-social-feed`, `/pages/data-sharing-opt-out`) are linked from `/pages/uk-product-catalog` or site footer navigation.
- **Inputs**: HTTP GET 36 page URLs + catalog directory page.
- **Expected Outputs**: 100% compliant titles/descriptions; 0 orphaned pages.

### Feature 16: Blog Article Titles & Internal Links
- **Assertions**:
  1. For all 25 articles in `sitemap_articles_1.xml`:
     - `title.length <= 60` in `seo.title`.
     - `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` does NOT end in `Extended Mo`.
  2. Top indexed blog articles contain valid HTML links to:
     - 8 previously uncrawled articles.
     - 14 previously uncrawled smart sub-collections.
- **Inputs**: HTTP GET 25 blog article URLs.
- **Expected Outputs**: Complete titles; reciprocal link equity topology established.

### Feature 17: Sitemap Submission Idempotency
- **Assertions**:
  1. Function queries `GET https://www.googleapis.com/webmasters/v3/sites/.../sitemaps` first.
  2. If live child sitemap is already listed with `errors === 0` (or `errors === null`), `PUT` is NOT executed.
  3. If sitemap is missing from GSC or has `errors > 0`, `PUT` IS executed.
  4. `LastSubmitted` timestamp in GSC is preserved for healthy sitemaps.
- **Inputs**: Mock/live GSC Sitemaps API interaction.
- **Expected Outputs**: Zero redundant PUT requests on healthy sitemaps.

### Feature 18: Rotating URL Inspection Health
- **Assertions**:
  1. Inspects exactly 15 URLs per scheduled run (or fewer if queue depleted).
  2. Enforces >=200ms inter-request delay to honor GSC API rate limits.
  3. Aggregates results into `gsc_ga4_latest_snapshot.json`.
  4. Logs `submittedAndIndexedCount`, `discoveredNotIndexedCount`, and canonical overrides.
- **Inputs**: GSC URL Inspection API runner with 15 target URLs.
- **Expected Outputs**: Valid JSON snapshot updated with inspection ratios.

### Feature 19: Title Boundary Truncator & Guard
- **Assertions**:
  1. Function `fitTitleUnder60Chars(rawTitle)` accepts strings of length 1–200.
  2. Output string length is strictly `<= 60` characters.
  3. Output string does not break words in half (e.g. `Extended Mo` -> breaks before `Extended`).
  4. Output string does not leave dangling delimiters (`|`, `-`, `&`, `(`, `/`).
  5. Category guard: if URL starts with `/collections/`, refuses single-product keyword without pluralizing substrate.
- **Inputs**: Unit test suite with boundary strings (55, 60, 61, 65, 75, 120 chars).
- **Expected Outputs**: Clean strings meeting regex `/^.{1,60}$/` and boundary checks.

### Feature 20: SEO Lint Gate & Storewide Validator
- **Assertions**:
  1. Fails if any collection, page, or article description contains `&quot;` or `&amp;quot;`.
  2. Fails if any title ends in truncated fragment (`& I`, `&`, `Mo`, `Si`).
  3. Fails if any collection has 0 products and is published (excluding `frontpage`).
  4. Fails if template grammar phrases (`Transform with`, `Elevate with`) exist in descriptions.
  5. Passes clean catalog with exit code 0.
- **Inputs**: Execution of `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs`.
- **Expected Outputs**: Exit code 0, clean log report.

### Feature 21: End-to-End Test Suite
- **Assertions**:
  1. Test runner `tests/e2e_recovery_test_runner.mjs` executes cleanly with Node.js.
  2. Supports CLI flags: `--tier=<1|2|3|4|all>`, `--feature=<1..23|all>`, `--json`, `--verbose`.
  3. Produces standard TAP (Test Anything Protocol v13) output.
  4. Outputs test timing, summary table (passed, failed, skipped), and exit code (0 on success, 1 on failure).
- **Inputs**: CLI execution with various parameter combinations.
- **Expected Outputs**: TAP stream and structured results.

### Feature 22: Adversarial Hardening (Tier 5)
- **Assertions**:
  1. Test runner gracefully handles network timeouts (5000ms threshold) without hanging.
  2. Handles Shopify rate-limit HTTP 429 with exponential backoff.
  3. Handles malformed HTML (unclosed tags, missing meta tags) without uncaught exceptions.
  4. Handles special unicode characters (`—`, `×`, `’`, `&`, `"`).
- **Inputs**: Adversarial test harness with corrupted responses and network delay injection.
- **Expected Outputs**: Controlled assertion failures with descriptive error logs, 0 unhandled promise rejections.

### Feature 23: Git Deployment & Cloud Sync
- **Assertions**:
  1. Git working tree is clean (`git status --porcelain` is empty).
  2. All commits follow conventional commit format (`feat:`, `fix:`, `test:`, `chore:`).
  3. Pushed to remote `origin/main`.
  4. GitHub Actions workflow `pwp-daily-technical-seo.yml` completes with status `conclusion: success`.
  5. `walkthrough.md` contains updated run logs and verification results.
- **Inputs**: Git repo state and GitHub CLI `gh run view`.
- **Expected Outputs**: Exit code 0, workflow green.

---

## 6. Concrete Test Case Design Matrix Across 4 Tiers

### Tier 1: Feature Coverage (>=5 Test Cases Per Feature = 115 Test Cases)

| Feature # | Test Case ID | Test Name | Target / Input | Assertion / Expected Outcome |
|---|---|---|---|---|
| F1 | T1-F01-01 | Homepage Title Length | GET `/` | `<title>` length <= 60 characters |
| F1 | T1-F01-02 | Homepage Title Exact Match | GET `/` | Title equals `"Canvas Wall Art, XXL Desk Mats & Home Decor \| Prints With Passion"` |
| F1 | T1-F01-03 | Homepage Meta Description Length | GET `/` | `<meta name="description">` length between 140 and 158 characters |
| F1 | T1-F01-04 | Homepage Meta Description Plain Text | GET `/` | Description contains zero `&quot;`, `&amp;quot;`, or `<>` |
| F1 | T1-F01-05 | Homepage Meta Description Merch Audit | GET `/` | Description does not contain deleted terms (posters, makeup bags, puzzles, duvet covers) |
| F2 | T1-F02-01 | Homepage Semantic H1 Count | GET `/` | Exactly 1 `<h1>` element in rendered DOM |
| F2 | T1-F02-02 | Logo Brand Badge Demotion | GET `/` | Brand badge element uses `<div>` or `<p>`, not `<h1>` |
| F2 | T1-F02-03 | Commercial H1 Intent | GET `/` | Rendered `<h1>` contains commercial search terms |
| F2 | T1-F02-04 | No Nested H1s in Header | GET `/` | Header section has 0 `<h1>` tags |
| F2 | T1-F02-05 | H1 Accessibility Visibility | GET `/` | Single `<h1>` is visible and not hidden by `display:none` |
| F3 | T1-F03-01 | Absence of Leading Slash Concat | GET `/` | Zero instances of `href="/http"` in HTML |
| F3 | T1-F03-02 | Customer Auth Link Target | GET `/` | Customer login link has valid relative path or absolute URL |
| F3 | T1-F03-03 | Customer Auth Link HTTP Status | GET customer auth URL | Returns HTTP 200 or 302, not 404 |
| F3 | T1-F03-04 | Header Mobile Auth Link | GET `/` | Mobile menu customer login link is also clean |
| F3 | T1-F03-05 | Header Desktop Auth Link | GET `/` | Desktop menu customer login link is clean |
| F4 | T1-F04-01 | Homepage Contact Typo Audit | GET `/` | Zero occurrences of `printswithpasssionbc@gmail.com` |
| F4 | T1-F04-02 | Homepage Correct Email Presence | GET `/` | Contains `printswithpassionbc@gmail.com` |
| F4 | T1-F04-03 | Delivery Return Page Email Typo | GET `/pages/delivery-return` | Zero occurrences of `passsion` |
| F4 | T1-F04-04 | Delivery Return Correct Email | GET `/pages/delivery-return` | Contains `printswithpassionbc@gmail.com` |
| F4 | T1-F04-05 | Shop Support Email Settings | GraphQL `shop { contactEmail }` | Value is `printswithpassionbc@gmail.com` |
| F5 | T1-F05-01 | Homepage Hub Snippet Presence | GET `/` | DOM contains hub container `.pwp-curated-collections-hub` |
| F5 | T1-F05-02 | 48 Sub-Collections on Homepage | GET `/` | All 48 handles from `phase2_40_subcollections.json` linked |
| F5 | T1-F05-03 | Canvas Prints Parent Hub | GET `/collections/canvas-prints` | Hub container present with sub-collection links |
| F5 | T1-F05-04 | Desk Mats Parent Hub | GET `/collections/desk-mats` | Hub container present with sub-collection links |
| F5 | T1-F05-05 | Click Depth Assertion | Crawler from `/` | All 48 sub-collections reachable at Click Depth 1 |
| F6 | T1-F06-01 | Legacy Dog Collars Deletion | GraphQL `collectionByHandle(handle: "dog-collars")` | Returns `null` |
| F6 | T1-F06-02 | Legacy Laundry Bags Deletion | GraphQL `collectionByHandle(handle: "laundry-bags")` | Returns `null` |
| F6 | T1-F06-03 | Legacy Clutch Bags Deletion | GraphQL `collectionByHandle(handle: "clutch-bags")` | Returns `null` |
| F6 | T1-F06-04 | Frontpage Collection Preserved | GraphQL `collectionByHandle(handle: "frontpage")` | Returns valid collection object with ID |
| F6 | T1-F06-05 | Zero Legacy Collections in Sitemap | GET `sitemap_collections_1.xml` | None of the 28 handles appear in `<loc>` tags |
| F7 | T1-F07-01 | 301 Redirect Dog Collars | GET `/collections/dog-collars` | Returns HTTP 301 -> active parent |
| F7 | T1-F07-02 | 301 Redirect Posters | GET `/collections/posters` | Returns HTTP 301 -> `/collections/canvas-prints` |
| F7 | T1-F07-03 | 301 Redirect Rugs | GET `/collections/rugs` | Returns HTTP 301 -> `/collections/bath-mats` |
| F7 | T1-F07-04 | 301 Redirect Mousepads | GET `/collections/mousepads` | Returns HTTP 301 -> `/collections/desk-mats` |
| F7 | T1-F07-05 | 301 Destination Health | GET target URL for all 28 redirects | Every destination returns HTTP 200 (not 404) |
| F8 | T1-F08-01 | AVADA Sitemap Absence | GET `sitemap_collections_1.xml` | `avada-upsell-best-sellers` is NOT present |
| F8 | T1-F08-02 | AVADA Publication Status | GraphQL `collectionByHandle("avada-upsell-best-sellers")` | Online Store publication `isPublished === false` |
| F8 | T1-F08-03 | AVADA Meta Robots Tag | GET `/collections/avada-upsell-best-sellers` | Contains `<meta name="robots" content="noindex` |
| F8 | T1-F08-04 | AVADA Internal Link Exclusion | GET `/` and parent collections | No direct anchor links to AVADA collection |
| F8 | T1-F08-05 | Zero Noindex In Sitemap Rule | Cross-reference sitemap vs live HTML | Zero sitemap URLs render `noindex` robots tag |
| F9 | T1-F09-01 | Blog Guide Redirect Deletion | GraphQL `urlRedirects` query | Path `/blogs/news/uk-student-room-rental-flat-decor-guide` absent |
| F9 | T1-F09-02 | Blog Guide HTTP 200 | GET `/blogs/news/uk-student-room-rental-flat-decor-guide` | Status === 200 (not 301) |
| F9 | T1-F09-03 | Blog Guide Content Body | GET article URL | Body contains UK student room guide copy |
| F9 | T1-F09-04 | Blog Guide Publication State | GraphQL article query | `publishedAt != null` |
| F9 | T1-F09-05 | Blog Guide In Sitemap | GET `sitemap_articles_1.xml` | Article handle present in `<loc>` tags |
| F10 | T1-F10-01 | Zero %20 in Redirect Targets | GraphQL `urlRedirects` | Zero targets contain `%20` |
| F10 | T1-F10-02 | Zero Unescaped Spaces in Targets | GraphQL `urlRedirects` | Zero targets contain literal space `' '` |
| F10 | T1-F10-03 | Neon Blanket Redirect Cleanliness | GraphQL `urlRedirects(path: "...neon...")` | Target is clean hyphenated handle |
| F10 | T1-F10-04 | Abstract Hoodie Redirect Cleanliness | GraphQL `urlRedirects(path: "...hoodie...")` | Target is clean hyphenated handle |
| F10 | T1-F10-05 | All Redirect Targets HTTP 200 | GET sample 15 repaired redirect targets | All return HTTP 200 |
| F11 | T1-F11-01 | Active Collections Non-Null Title | GraphQL `collections` (`productsCount > 0`) | `seo.title != null` for all 70 active collections |
| F11 | T1-F11-02 | Active Collection Title Length | GraphQL `collections` | `seo.title.length <= 60` for all 70 active collections |
| F11 | T1-F11-03 | Active Collection Title Min Length | GraphQL `collections` | `seo.title.length >= 30` for all 70 active collections |
| F11 | T1-F11-04 | No Ellipsis Truncation in Titles | GraphQL `collections` | Zero collection titles end in `...` or `..` |
| F11 | T1-F11-05 | Commercial Substrate Modifier Check | GraphQL `collections` | Title contains substrate noun (Canvas, Desk Mat, etc.) |
| F12 | T1-F12-01 | Collection Description Length | GraphQL `collections` | `seo.description.length` between 140 and 158 chars |
| F12 | T1-F12-02 | Zero &quot; in Collection Description | GraphQL `collections` | Zero occurrences of `&quot;` in raw field |
| F12 | T1-F12-03 | Zero &amp;quot; in Live Collection HTML | GET 10 sample active collections | HTML meta description has zero `&amp;quot;` |
| F12 | T1-F12-04 | No "Transform with" Template Cliché | GraphQL `collections` | Zero descriptions start with `"Transform with "` |
| F12 | T1-F12-05 | No "Elevate with" Template Cliché | GraphQL `collections` | Zero descriptions start with `"Elevate with "` |
| F13 | T1-F13-01 | Japanese Anime Desk Mats Plural | GET `/collections/japanese-anime-desk-mats` | `<title>` contains plural `"Desk Mats"`, not single mat |
| F13 | T1-F13-02 | Japanese Anime Desk Mats Length | GET `/collections/japanese-anime-desk-mats` | `<title>` length <= 60 characters |
| F13 | T1-F13-03 | Bauhaus Canvas Wall Art Completeness | GET `/collections/abstract-minimalist-bauhaus-canvas-wall-art` | `<title>` does NOT end in `(CM & I` |
| F13 | T1-F13-04 | Bauhaus Canvas Wall Art Length | GET `/collections/abstract-minimalist-bauhaus-canvas-wall-art` | `<title>` length <= 60 characters |
| F13 | T1-F13-05 | Specific Collections Description Sanity | GET both collections | Descriptions 140–158 chars, plain text |
| F14 | T1-F14-01 | Guide Pages H1 Count | GET `/pages/xxl-extended-gaming-desk-mats-uk-guide` | DOM has strictly `h1s.length === 1` |
| F14 | T1-F14-02 | Stretched Canvas Guide H1 Count | GET `/pages/stretched-canvas-wall-art-uk-guide` | DOM has strictly `h1s.length === 1` |
| F14 | T1-F14-03 | All 36 Pages H1 Count Audit | GET all 36 pages in `sitemap_pages_1.xml` | `h1s.length === 1` on 100% of pages |
| F14 | T1-F14-04 | Zero &amp; In Heading Text | GET all 36 pages | Rendered `<h1>` text has zero literal `&amp;` |
| F14 | T1-F14-05 | Inner Body Heading Demoted to H2 | GraphQL `pages` query | `page.body` has 0 `<h1>` tags |
| F15 | T1-F15-01 | 36 Pages Title Length | GraphQL `pages` | `seo.title.length <= 60` on all 36 pages |
| F15 | T1-F15-02 | 36 Pages Description Length | GraphQL `pages` | `seo.description.length` between 145 and 158 chars |
| F15 | T1-F15-03 | No Breadcrumb Meta Description | GET all 36 pages | `<meta description>` does not start with `"Home › "` |
| F15 | T1-F15-04 | Catalog Hub Links 36 Pages | GET `/pages/uk-product-catalog` | Links present for all 36 static/guide pages |
| F15 | T1-F15-05 | 4 Previously Unindexed Pages Linked | GET `/` and footer | `/pages/about-us` and 3 others linked |
| F16 | T1-F16-01 | Desk Mat Size Guide Title | GET `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` | `<title>` does NOT end in `Extended Mo` |
| F16 | T1-F16-02 | 25 Blog Articles Title Length | GET all 25 blog articles | `<title>` length <= 60 chars |
| F16 | T1-F16-03 | 25 Blog Articles Meta Description | GET all 25 blog articles | `<meta description>` between 140 and 158 chars |
| F16 | T1-F16-04 | Links to 8 Uncrawled Articles | GET top 10 indexed blog articles | Contains links to 8 previously uncrawled guides |
| F16 | T1-F16-05 | Links to 14 Uncrawled Collections | GET top 10 indexed blog articles | Contains links to 14 previously uncrawled sub-colls |
| F17 | T1-F17-01 | GSC Sitemaps GET Before PUT | Unit test `gsc_ga4_gmc_cloud_sync` | GET invoked to inspect existing sitemaps first |
| F17 | T1-F17-02 | Skip Healthy Sitemaps | Mock GSC returns 8 healthy sitemaps | Zero PUT requests issued |
| F17 | T1-F17-03 | PUT On Missing Sitemap | Mock GSC returns 7 sitemaps (1 missing) | Exactly 1 PUT request issued for missing URL |
| F17 | T1-F17-04 | PUT On Errored Sitemap | Mock GSC returns sitemap with `errors: 1` | Exactly 1 PUT request issued to refresh |
| F17 | T1-F17-05 | LastSubmitted Preservation | GSC Sitemaps API inspection | `lastSubmitted` date unchanged for untouched sitemaps |
| F18 | T1-F18-01 | Rotating URL Inspection Batch Size | Run URL inspector module | Exactly 15 URLs processed per batch |
| F18 | T1-F18-02 | Inspection API Rate Limiting | Monitor timing of inspection calls | Inter-request delay >= 200ms |
| F18 | T1-F18-03 | Coverage State Logging | Inspect `gsc_ga4_latest_snapshot.json` | Contains `coverageState` counts for inspected URLs |
| F18 | T1-F18-04 | Indexing Ratio Calculation | Inspect `gsc_ga4_latest_snapshot.json` | Contains ratio of `submittedAndIndexed` vs other |
| F18 | T1-F18-05 | Rotating Cursor Advancement | Run inspector twice | Second run inspects next batch of 15 URLs |
| F19 | T1-F19-01 | Title Under 60 Chars Function | Call `fitTitleUnder60Chars(longStr)` | Returns string length <= 60 |
| F19 | T1-F19-02 | Word-Boundary Preservation | Call with `"A Very Long Title That Must Cut Cleanly (CM & Inch)"` | Does not cut word in half |
| F19 | T1-F19-03 | Trailing Punctuation Stripping | Call with title ending in ` | ` | Strips dangling trailing pipe or delimiter |
| F19 | T1-F19-04 | Collection Category Plural Guard | Call rewriter on `/collections/` target | Appends plural noun; refuses single-product keyword |
| F19 | T1-F19-05 | 14-Day Cooldown Check | Call rewriter on recently optimized item | Skips item if within 14-day window |
| F20 | T1-F20-01 | Lint Gate Entity Detection | Run lint gate on test item with `&quot;` | Detects violation and flags item |
| F20 | T1-F20-02 | Lint Gate Grammar Detection | Run lint gate on test item with `"Transform with "` | Detects violation and flags item |
| F20 | T1-F20-03 | Lint Gate Truncated Title Detection | Run lint gate on item ending in `(CM & I` | Detects violation and flags item |
| F20 | T1-F20-04 | Lint Gate 0-Product Detection | Run lint gate on empty collection | Detects 0-product violation |
| F20 | T1-F20-05 | Clean Catalog Pass | Run lint gate against post-remediation store | Exits with code 0 and zero violations |
| F21 | T1-F21-01 | E2E Runner Invocation | `node tests/e2e_recovery_test_runner.mjs` | Executes and outputs summary |
| F21 | T1-F21-02 | CLI Flag `--tier=1` | Run with `--tier=1` | Runs only Tier 1 tests |
| F21 | T1-F21-03 | CLI Flag `--feature=1` | Run with `--feature=1` | Runs only Feature 1 tests |
| F21 | T1-F21-04 | CLI Flag `--json` | Run with `--json` | Generates valid JSON test report |
| F21 | T1-F21-05 | CLI Flag `--verbose` | Run with `--verbose` | Prints detailed assertions and headers |
| F22 | T1-F22-01 | Graceful Timeout Handling | Simulate slow network on test fetch | Times out gracefully within 5000ms |
| F22 | T1-F22-02 | Shopify 429 Backoff | Simulate Shopify 429 response | Retries with exponential backoff |
| F22 | T1-F22-03 | Malformed HTML Handling | Parse truncated HTML string | No crash or unhandled promise rejection |
| F22 | T1-F22-04 | Unicode Punctuation Handling | Pass strings with `—`, `×`, `’` | Correct character count and no garbling |
| F22 | T1-F22-05 | Pacing Concurrency Throttle | Concurrency test with 50 requests | Max 4 req/sec enforced against Shopify |
| F23 | T1-F23-01 | Git Working Tree Cleanliness | `git status --porcelain` | Output is empty |
| F23 | T1-F23-02 | Commit Message Convention | `git log -1 --pretty=%B` | Matches conventional commit pattern |
| F23 | T1-F23-03 | Remote Branch Alignment | `git status -uno` | Branch is up to date with `origin/main` |
| F23 | T1-F23-04 | GitHub Workflow Success | `gh run list --workflow=pwp-daily-technical-seo.yml` | Latest run status is `completed` / `success` |
| F23 | T1-F23-05 | Walkthrough Documentation Updated | Read `walkthrough.md` | Contains verified test run logs and results |

---

### Tier 2: Boundary & Corner Cases (>=5 Test Cases Per Feature = 115 Boundary Cases)

| Feature # | Test Case ID | Boundary / Corner Case Scenario | Boundary Condition | Expected Behavior |
|---|---|---|---|---|
| F1 | T2-F01-01 | Homepage Title Exact 60 Chars | Input title length === 60 | Valid; no truncation or trailing ellipsis |
| F1 | T2-F01-02 | Homepage Title 61 Chars | Input title length === 61 | Rejected or truncated cleanly at word boundary <60 |
| F1 | T2-F01-03 | Homepage Meta Description 139 Chars | Input desc length === 139 | Flagged as under minimal threshold (<140 chars) |
| F1 | T2-F01-04 | Homepage Meta Description Exact 158 Chars | Input desc length === 158 | Valid; accepted without truncation |
| F1 | T2-F01-05 | Homepage Meta Description 159 Chars | Input desc length === 159 | Flagged as exceeding max limit (>158 chars) |
| F2 | T2-F02-01 | Zero H1 Elements in Theme | Empty page template with no H1 | Flagged as violation: exactly 1 H1 required |
| F2 | T2-F02-02 | Three H1 Elements in Theme | Page with 3 H1 tags | Flagged as violation: exactly 1 H1 required |
| F2 | T2-F02-03 | H1 Tag with Inner HTML Markup | `<h1><span>Title</span> <svg>...</svg></h1>` | Strips tags, verifies single commercial string |
| F2 | T2-F02-04 | H1 Hidden with Inline CSS | `<h1 style="display:none">Hidden</h1>` | Flagged as accessibility/SEO violation |
| F2 | T2-F02-05 | H1 with HTML Entity in Title | `<h1>Canvas &amp; Decor</h1>` | Rendered text is `Canvas & Decor`, not literal `&amp;` |
| F3 | T2-F03-01 | Auth Link with Multiple Slashes | `href="///account/login"` | Flagged as malformed link structure |
| F3 | T2-F03-02 | Auth Link with Query Parameters | `href="/account/login?return_to=%2Fcart"` | Query parameters preserved without 404 |
| F3 | T2-F03-03 | Protocol-Relative Auth Link | `href="//printswithpassion.com/account/login"` | Evaluated as valid absolute or relative URL |
| F3 | T2-F03-04 | Auth Link with Trailing Slash | `href="/account/login/"` | Redirects or returns 200 cleanly |
| F3 | T2-F03-05 | Internationalized Auth Link | `href="/en-us/account/login"` | Handled cleanly by Shopify Markets without loop |
| F4 | T2-F04-01 | Quad-S Email Typo | `printswithpassssionbc@gmail.com` | Flagged by typo regex check |
| F4 | T2-F04-02 | Mixed Case Email | `PrintsWithPassionBC@Gmail.Com` | Normalized or matched case-insensitively |
| F4 | T2-F04-03 | Email in JSON-LD Schema | Storefront `<script type="application/ld+json">` | Verified clean without typos in Organization schema |
| F4 | T2-F04-04 | Email in Anchor Title or Alt | `<a title="printswithpasssionbc@gmail.com">` | Scanned and flagged across all attributes |
| F4 | T2-F04-05 | Encoded Mailto Link | `href="mailto:printswithpassionbc%40gmail.com"` | Decoded and verified clean |
| F5 | T2-F05-01 | Sub-Collection with 0 Products Linked | Empty sub-collection in hub block | Guarded: sub-collections must have products |
| F5 | T2-F05-02 | Sub-Collection with Long Handle (50+ chars) | Very long collection URL in hub block | Formatted cleanly without layout shift or break |
| F5 | T2-F05-03 | Hub Snippet Included Twice in Layout | Template mistakenly includes hub twice | DOM deduplicates or test flags duplicate container |
| F5 | T2-F05-04 | Hub Snippet on Pagination Page 2 | `/collections/canvas-prints?page=2` | Hub block remains crawlable or suppressed cleanly |
| F5 | T2-F05-05 | Hub Links Missing Leading Slash | Anchor `href="collections/desk-mats"` | Flagged: must have absolute root path `/collections/` |
| F6 | T2-F06-01 | Collection Already Deleted | Calling `collectionDelete` on deleted ID | Returns clean UserError or null without script crash |
| F6 | T2-F06-02 | Collection with Active Inventory | Collection unexpectedly has 1 active product | Aborts deletion and alerts engineer |
| F6 | T2-F06-03 | Frontpage Collection Deletion Attempt | Target ID matches `frontpage` | Skipped automatically with log warning |
| F6 | T2-F06-04 | Collection ID Malformed | Invalid GID format passed | Throws handled validation error |
| F6 | T2-F06-05 | Concurrent Collection Deletion | Rapid sequential deletion of 28 collections | Handled under 4 GraphQL calls/sec leaky bucket |
| F7 | T2-F07-01 | Redirect Source with Query String | `/collections/dog-collars?page=2&sort=price` | Shopify preserves or strips query without 404 |
| F7 | T2-F07-02 | Redirect Target Same as Source | Source `/foo` pointing to Target `/foo` | Circular redirect loop detected and prevented |
| F7 | T2-F07-03 | Redirect Chain (A -> B -> C) | Source redirects to another redirect | Flagged: must resolve directly to final 200 URL |
| F7 | T2-F07-04 | Redirect Case Sensitivity | `/Collections/Dog-Collars` (uppercase) | Storefront normalizes and redirects cleanly |
| F7 | T2-F07-05 | Redirect on Deactivated Subfolder | `/de-at/collections/dog-collars` | Must redirect to root parent without 404 subfolder |
| F8 | T2-F08-01 | AVADA Collection Re-Published by App | Background app attempts re-publication | Lint gate detects and automatically unpublishes |
| F8 | T2-F08-02 | AVADA Collection Visited Directly | Direct browser visit to `/collections/avada-...` | Serves products but maintains `noindex, follow` |
| F8 | T2-F08-03 | AVADA Collection in Custom Collection Menu | Menu links directly to AVADA collection | Navigation audit flags link |
| F8 | T2-F08-04 | Multiple Publications Active | Published to POS, Shop, Pinterest, but not Web | Verified published ONLY to internal channels |
| F8 | T2-F08-05 | AVADA Collection with 0 Products | App empties collection | Unpublish persists; 0-product gate does not crash |
| F9 | T2-F09-01 | Blog Guide URL with Trailing Slash | `/blogs/news/uk-student-room.../` | Returns 200 or canonical 301 without redirect loop |
| F9 | T2-F09-02 | Blog Article Tag Filtering URL | `/blogs/news/uk-student-room...?tag=decor` | Handles query filter without 404 |
| F9 | T2-F09-03 | Blog Article Re-Added to Redirects | Automation accidentally re-adds redirect | Gate blocks redirect creation for published articles |
| F9 | T2-F09-04 | Blog Article Body with Raw Markdown | Body text contains `### Heading` instead of HTML | HTML parser flags unparsed markdown |
| F9 | T2-F09-05 | Blog Article Unpublished State | Article set to draft | Test flags article as missing from live index |
| F10 | T2-F10-01 | Target with Multiple Consecutive `%20` | `/products/foo%20%20bar` | Collapses into single clean hyphen `-` |
| F10 | T2-F10-02 | Target with Mixed Escaped and Raw Spaces | `/products/foo%20bar baz` | Cleanses all spaces into clean hyphens |
| F10 | T2-F10-03 | Target with `%2F` Encoded Slashes | `/products%2Fneon-blanket` | Normalized to valid path `/products/neon-blanket` |
| F10 | T2-F10-04 | Target with Hash Anchor | `/products/item#specifications` | Preserves anchor while sanitizing space in path |
| F10 | T2-F10-05 | Target with Non-Ascii Unicode Characters | `/products/café%20decor` | Normalizes accented characters or punycode |
| F11 | T2-F11-01 | Title with Exactly 60 Characters | Title length === 60 chars | Accepted without truncation |
| F11 | T2-F11-02 | Title with Exactly 29 Characters | Title length === 29 chars | Flagged: minimum recommended length is 30 |
| F11 | T2-F11-03 | Title with Double Quotes `"` | `Japanese "Wave" Desk Mats` | Counts actual character length without quote inflation |
| F11 | T2-F11-04 | Title with Em Dash `—` or Multiplier `×` | `XXL Desk Mats 90×40cm — Archival Studio` | Counts unicode multi-byte characters accurately |
| F11 | T2-F11-05 | Title with All Uppercase Text | `CANVAS WALL ART UK` | Flagged: must use title case or clean casing |
| F12 | T2-F12-01 | Description with Exactly 140 Characters | Description length === 140 chars | Accepted at lower boundary |
| F12 | T2-F12-02 | Description with Exactly 158 Characters | Description length === 158 chars | Accepted at upper boundary |
| F12 | T2-F12-03 | Description with Metric & Imperial Units | Contains `900x400x4mm (35.4"x15.7")` | Plain text quotes rendered without `&quot;` bug |
| F12 | T2-F12-04 | Description Ending Without Punctuation | Last character is a letter or number | Flagged: must end in complete sentence punctuation |
| F12 | T2-F12-05 | Description with Non-Breaking Space `\u00A0` | Contains hidden non-breaking space | Normalized to standard space `\u0020` |
| F13 | T2-F13-01 | Japanese Anime Desk Mats Singularity | Title contains single product noun | Flagged by category plural guard |
| F13 | T2-F13-02 | Bauhaus Canvas Wall Art Delimiter Cut | Title ending in `|` or `&` | Flagged and stripped before publication |
| F13 | T2-F13-03 | Specific Collection Description 139 Chars | Length is 139 chars | Flagged: 1 char below 140 minimum |
| F13 | T2-F13-04 | Specific Collection Description 159 Chars | Length is 159 chars | Flagged: 1 char above 158 maximum |
| F13 | T2-F13-05 | Re-running Title Rewriter on Bauhaus | Within 14-day cooldown period | Skipped to prevent title churn |
| F14 | T2-F14-01 | Page with Nested H1 inside Article/Section | `<section><h1>Inner</h1></section>` | Correctly converted to `<h2>` |
| F14 | T2-F14-02 | Page with H1 having HTML Attributes | `<h1 class="guide-title" id="top">Title</h1>` | Converted to `<h2 class="guide-title" id="top">` |
| F14 | T2-F14-03 | Page with Self-Closing or Malformed H1 | `<h1 />` or unclosed `<h1>` | Handled cleanly by HTML tokenizer |
| F14 | T2-F14-04 | Page with Ampersand in H1 Text | `Setup & Buyer's Guide` | Rendered without double escaping `&amp;amp;` |
| F14 | T2-F14-05 | Page with Multiple H1s Converted to H2s | 3 inner H1 tags in body | All 3 converted to `<h2>` preserving order |
| F15 | T2-F15-01 | Page Description 144 Chars | Length === 144 chars | Flagged: 1 char below page minimum 145 |
| F15 | T2-F15-02 | Page Description 158 Chars | Length === 158 chars | Accepted at upper boundary |
| F15 | T2-F15-03 | Page with Missing Meta Description | Tag absent from HTML head | Flagged: missing description fallback |
| F15 | T2-F15-04 | Page Title with Exactly 60 Chars | Length === 60 chars | Accepted at upper boundary |
| F15 | T2-F15-05 | Catalog Hub Linking Self | `/pages/uk-product-catalog` linking self | Handled cleanly; self-link ignored in orphans check |
| F16 | T2-F16-01 | Blog Title Ending in Incomplete Word | `Extended Mo` | Flagged: word truncated mid-string |
| F16 | T2-F16-02 | Blog Title with Parentheses at 60 Chars | `Guide (2026 Edition)` | Parenthesis not cut in half |
| F16 | T2-F16-03 | Blog Post with 0 Outbound Links | Article body has no anchor tags | Flagged: minimum 2 contextual links required |
| F16 | T2-F16-04 | Blog Post Linking 404 URL | Link points to dead collection | Flagged by internal link verification test |
| F16 | T2-F16-05 | Reciprocal Linking Between 2 Articles | Article A links B and B links A | Valid anchor text and relevance verified |
| F17 | T2-F17-01 | GSC Sitemaps API Returns 403 Forbidden | Service account lacks webmasters scope | Throws descriptive error without corrupting state |
| F17 | T2-F17-02 | GSC Sitemaps API Returns Empty List | Zero sitemaps registered in GSC | Issues PUT for all live child sitemaps |
| F17 | T2-F17-03 | Sitemap URL with Encoded Parameters | `sitemap_products_1.xml?from=123&to=456` | URL encoded properly in PUT path |
| F17 | T2-F17-04 | GSC Returns Warning Status | Sitemap status is `WARNING` | Evaluated against error threshold |
| F17 | T2-F17-05 | Daily Execution Timing | Script invoked twice in 10 minutes | Idempotency guarantees 0 duplicate PUT calls |
| F18 | T2-F18-01 | URL Inspection Returns 404 in Index | URL unknown to Google | Recorded as `URL_IS_UNKNOWN` without failure |
| F18 | T2-F18-02 | URL Inspection Quota Exceeded (429) | Exceeded daily/minute limit | Halts inspection queue and logs warning |
| F18 | T2-F18-03 | URL with Non-Standard Google Canonical | Google chose `/en-us` instead of `/` | Flagged as canonical divergence alert |
| F18 | T2-F18-04 | Inspection Queue Reaches End | Cursor wraps around to index 0 | Loops seamlessly back to start of URL list |
| F18 | T2-F18-05 | Inspection Target Not in Sitemap | URL inspected is orphaned | Alerts engineer to unlisted URL |
| F19 | T2-F19-01 | Input Title Exactly 60 Chars | `fitTitleUnder60Chars(str60)` | Returns exact input unmodified |
| F19 | T2-F19-02 | Input Title 61 Chars with Long Last Word | `... VeryLongWordThatExceeds` | Truncates before the long word, not mid-word |
| F19 | T2-F19-03 | Input Title with No Spaces (Single Token) | 65-char continuous hash string | Truncates at char 60 safely without exception |
| F19 | T2-F19-04 | Input with HTML Entities | `Canvas &amp; Wall Art` | Decodes entities before measuring character length |
| F19 | T2-F19-05 | Input with Punctuation at Boundary | Cut point lands on comma or semicolon | Strips trailing comma or semicolon |
| F20 | T2-F20-01 | Lint Gate Empty String in Description | `seo.description: ""` | Flagged as missing description |
| F20 | T2-F20-02 | Lint Gate Single Product Collection | Collection with 1 product | Permitted but flagged for inventory growth |
| F20 | T2-F20-03 | Lint Gate AI Cliche in Title | Title contains `Elevate Your Space` | Detected and sanitized |
| F20 | T2-F20-04 | Lint Gate Special Trademark in Handle | Handle contains prohibited IP token | Flagged by trademark regex |
| F20 | T2-F20-05 | Lint Gate Large Catalog Batch (1500 prods) | Paginating 1,501 products | Streams pages without memory exhaustion |
| F21 | T2-F21-01 | E2E Runner with Non-Existent Tier | `--tier=99` | Exits with code 1 and lists valid tiers |
| F21 | T2-F21-02 | E2E Runner with Non-Existent Feature | `--feature=99` | Exits with code 1 and lists valid features |
| F21 | T2-F21-03 | E2E Runner with `--bail` Flag | First assertion fails | Execution halts immediately without running rest |
| F21 | T2-F21-04 | E2E Runner Offline Mode | `--dry-run` or `--offline` | Uses mock fixtures and completes without network |
| F21 | T2-F21-05 | E2E Runner Report Path Missing Directory | Directory `tests/reports` does not exist | Automatically creates directory and writes file |
| F22 | T2-F22-01 | Network Socket Reset Mid-Stream | ECONNRESET during HTTP GET | Retries request up to 3 times before failing |
| F22 | T2-F22-02 | Shopify 503 Service Unavailable | Cloudflare / Shopify temporary outage | Retries with jittered backoff |
| F22 | T2-F22-03 | Response Body Exceeding 10MB | Oversized response payload | Streams and bounds memory consumption |
| F22 | T2-F22-04 | HTTP 301 Redirect Loop (A -> B -> A) | Circular redirect chain | Aborts after 5 hops and logs circular path |
| F22 | T2-F22-05 | Malformed JSON in GraphQL Error | Non-JSON response from server | Catches parse error and logs HTTP status code |
| F23 | T2-F23-01 | Git Push Rejected (Non-Fast-Forward) | Remote has newer commit | Pulls with rebase before pushing |
| F23 | T2-F23-02 | GitHub CLI Not Authenticated | `gh auth status` fails | Emits descriptive error with instructions |
| F23 | T2-F23-03 | Workflow Dispatch Times Out | Workflow run exceeds timeout | Reports timeout and provides run URL |
| F23 | T2-F23-04 | Dirty Files in Git Submodule | Submodule has untracked changes | Cleans or stages submodule cleanly |
| F23 | T2-F23-05 | Branch Mismatch in CI Trigger | Local on branch other than `main` | Verifies branch is `main` before triggering CI |

---

### Tier 3: Cross-Feature Combinations (Pairwise Interaction Matrix)

| Pair / Group ID | Interacting Features | Interaction Scenario | Edge Dynamic & Hazard | Test Assertion & Resolution |
|---|---|---|---|---|
| T3-PAIR-01 | F6 (Delete Legacy) + F7 (301 Redirects) | Deleting 28 legacy collections while establishing 301 redirects | If Shopify redirect is created *after* collection deletion, does the deletion remove the redirect rule? If collection is deleted but redirect fails, does handle return 404? | Test creates redirect FIRST, deletes collection SECOND, verifies GET returns 301 (not 404), and checks redirect table still holds the path. |
| T3-PAIR-02 | F8 (Unpublish AVADA) + F17 (Sitemap Idempotency) | Unpublishing AVADA collection from Online Store vs GSC Sitemaps Sync | When AVADA is unpublished, Shopify drops it from `sitemap_collections_1.xml`. Does GSC sync detect sitemap changes and avoid re-submitting unchanged child sitemaps? | Verify `sitemap_collections_1.xml` excludes AVADA, while GSC sync preserves `LastSubmitted` dates for other 7 sitemaps. |
| T3-PAIR-03 | F7 (301 Redirects) + F9 (Blog Guide Redirect Fix) | Legacy 301 redirect rule colliding with a valid published blog guide | Accidental redirect on `/blogs/news/uk-student-room-...` takes precedence over live blog content, returning 301 to collection. | Test verifies urlRedirect is deleted, article is published, and storefront serves HTTP 200 with article body. |
| T3-PAIR-04 | F11 (Collection Titles) + F19 (Title Truncator) | Rewriting collection titles with `fitTitleUnder60Chars` and category plural guard | Rewriter must not overwrite a collection title with a single-product keyword (e.g. Japanese Wave Desk Mat) and must truncate at <=60 chars. | Test feeds product keyword to collection rewriter; verifies title is pluralized (`Japanese Anime Desk Mats`) and strictly <= 60 chars. |
| T3-PAIR-05 | F12 (Collection Meta) + F20 (SEO Lint Gate) | Bulk rewriting collection descriptions vs SEO Lint Gate rules | Rewritten descriptions must simultaneously pass length rules (140–158), entity clean rules (no `&quot;`), and grammar cliché rules (no `"Transform with"`). | Test runs rewritten descriptions through lint gate validator; asserts zero violations and exit code 0. |
| T3-PAIR-06 | F5 (48 Sub-Collection Hub) + F13 (Specific Collections Fix) | Curated Hub linking to `/collections/japanese-anime-desk-mats` and `/collections/abstract-minimalist-...` | The Hub directory links must match the exact canonical handles whose metadata was repaired, with zero 301 or 404 hops. | Test extracts all 48 links from hub; performs HTTP GET on each; verifies direct HTTP 200 without redirect. |
| T3-PAIR-07 | F14 (Page Inner H1) + F15 (Page SEO Metadata & Links) | Converting inner H1s on 36 pages while updating page metadata and linking from catalog hub | Pages must render single H1 in DOM, have <=60 title, 145–158 description, and be present in `/pages/uk-product-catalog`. | Comprehensive crawler test fetches all 36 pages from catalog hub; asserts 1 H1, correct title length, and clean meta description. |
| T3-PAIR-08 | F16 (Blog Article Links) + F5 (Sub-Collection Hub) | Blog articles linking to 14 uncrawled smart sub-collections | Links inside blog articles must point to active sub-collections with >0 products that are also in the Hub directory. | Test verifies all collection links inside blog bodies resolve to active sub-collections in `phase2_40_subcollections.json`. |
| T3-PAIR-09 | F1 (Homepage Meta) + F2 (Single H1) + F3 (Auth Link) + F4 (Email Typo) | Full homepage theme overhaul applied together | Combining title update, H1 demotion, auth link repair, and email typo fix in `sections/header.liquid` and `templates/index.json`. | Single integration test crawls `/`; verifies title <=60, desc 140–158, H1 count === 1, zero bad auth links, and correct email. |
| T3-PAIR-10 | F17 (Sitemap Idempotency) + F18 (URL Inspection) | Scheduled cloud sync executing both sitemap check and rotating URL inspection | Both operations run in `gsc_ga4_gmc_cloud_sync.mjs` within the 60-second execution window without hitting Google API quotas. | Test runs combined module with mocked tokens; verifies both sitemap check and 15-URL inspection complete in <5000ms. |

---

### Tier 4: Real-World Application Scenarios

| Scenario ID | Scenario Name | Crawler / Agent Profile | User Flow & Steps | Expected Real-World Behavior |
|---|---|---|---|---|
| T4-SCEN-01 | Googlebot Smartphone Discovery Crawl | `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` | 1. Request `https://printswithpassion.com/`<br>2. Parse HTML and extract all internal links<br>3. Follow links to all 48 Smart Sub-Collections<br>4. Follow links to 6 parent collections<br>5. Follow links to 28 guide pages | - Homepage returns HTTP 200 with viewport meta.<br>- All 48 sub-collections found at Click Depth 1.<br>- All sub-collection links return HTTP 200.<br>- Zero crawl traps (no `href="/http..."`).<br>- Zero redirect loops. |
| T4-SCEN-02 | Google Search SERP Snippet Preview | Desktop Google SERP Renderer | 1. Request homepage, 5 active collections, 2 guide pages, 2 blog articles<br>2. Extract `<title>` and `<meta name="description">`<br>3. Simulate Google SERP pixel truncation (600px width for titles, ~960px for descriptions) | - Titles fit within 600px without mid-word truncation or `...` cuts.<br>- Descriptions render plain text with zero `&amp;quot;` or `&quot;` entities.<br>- Zero breadcrumb fallback leaks in page descriptions. |
| T4-SCEN-03 | Googlebot Discontinued URL Prune Simulation | `Googlebot/2.1` | 1. Googlebot requests the 28 discontinued collection URLs recorded in GSC impressions (e.g. `/collections/dog-collars`)<br>2. Follows server-side redirect headers | - Receives HTTP 301 permanently moved.<br>- Target is closest parent collection (e.g. `/collections/apparel` or `/collections/canvas-prints`).<br>- Destination returns HTTP 200 with active products.<br>- Zero 404 responses encountered. |
| T4-SCEN-04 | Human Shopper Live Storefront Navigation | Real Browser (`Chrome / Edge / Safari`) | 1. Land on homepage `/`<br>2. Scroll to Curated Studio Collections Hub<br>3. Click "Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats"<br>4. Arrive at collection page<br>5. Inspect page title, H1, product grid, and filter facets | - URL loads instantaneously.<br>- H1 displays "Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats".<br>- Page title is commercial, <= 60 chars.<br>- 14 active products displayed.<br>- Zero broken image links or missing prices. |
| T4-SCEN-05 | Full Sitemap XML Schema & Entity Validation | XML Parser / Search Console Sitemap Ingestion Engine | 1. Fetch `https://printswithpassion.com/sitemap.xml`<br>2. Recursively fetch all 7 child sitemaps<br>3. Validate XML schema against standard `sitemap.xsd`<br>4. Check each `<loc>` URL for HTTP 200, canonical consistency, and robots meta | - XML is strictly valid with UTF-8 encoding.<br>- Exactly 70 URLs in collections sitemap (0 discontinued, 0 AVADA).<br>- Exactly 36 URLs in pages sitemap.<br>- Exactly 25 URLs in articles sitemap.<br>- Zero sitemap URLs return `noindex`.<br>- Zero sitemap URLs return 301 or 404. |

---

## 7. Recommended Test Runner Architecture (`tests/e2e_recovery_test_runner.mjs`)

### 1. Architectural Principles
- **Opaque-Box Verification**: The test runner tests observable behavior from the outside (live HTTP responses, DOM parsing, Shopify Admin GraphQL queries, GSC Sitemaps API responses) without relying on internal function mocks where live endpoints are available.
- **Progressive Testability**: Operates in two distinct modes:
  * **Live Mode** (default): Runs real HTTP queries against `https://printswithpassion.com/` and authenticated queries against Shopify GraphQL using `.shopify_token.json`.
  * **Offline / Dry-Run Mode** (`--dry-run`): Uses recorded JSON/HTML fixtures in `tests/fixtures/` when credentials or network are restricted.
- **Pacing & Rate Limiting**: Enforces a strict 250ms sleep between GraphQL requests to stay well within Shopify’s 50-point/second leaky bucket, and 200ms sleep between GSC inspection calls.

### 2. File & Directory Layout
```
tests/
├── e2e_recovery_test_runner.mjs       # Main executable CLI entrypoint
├── suites/
│   ├── tier1_feature_coverage.mjs     # 115+ feature coverage test cases
│   ├── tier2_boundaries_corners.mjs   # 115+ boundary & corner test cases
│   ├── tier3_cross_feature.mjs        # Pairwise interaction test cases
│   └── tier4_real_world.mjs           # Googlebot crawl & SERP simulation
├── helpers/
│   ├── storefront_crawler.mjs         # HTTP fetch wrapper with UA, redirects, Cheerio DOM
│   ├── assertions.mjs                 # TAP assertion library (assertOk, assertEqual, etc.)
│   ├── shopify_client.mjs             # Throttled GraphQL client using lib/cloud-env.mjs
│   └── gsc_client.mjs                 # GSC API client using lib/cloud-env.mjs
├── fixtures/                          # Recorded snapshots for offline verification
│   ├── homepage_sample.html
│   ├── collections_sample.json
│   └── sitemaps_sample.xml
└── reports/                           # Test execution results
    └── e2e_report.json
```

### 3. CLI Command-Line Interface Specification
```
Usage: node tests/e2e_recovery_test_runner.mjs [options]

Options:
  --tier=<1|2|3|4|all>      Select test tier to execute (default: all)
  --feature=<1..23|all>     Filter by specific feature ID (default: all)
  --json                    Export test results to tests/reports/e2e_report.json
  --verbose                 Print detailed assertions, HTTP status codes, and diffs
  --bail                    Stop test execution on first failure
  --dry-run                 Use offline mock fixtures instead of live network
  --pacing=<ms>             Delay in ms between API calls (default: 250)
  --help                    Show help message and options
```

### 4. Output Formatting & Standards
- **TAP v13 Compliance**: The test runner outputs standard Test Anything Protocol format to `stdout`:
  ```
  TAP version 13
  1..250
  ok 1 - [T1-F01-01] Homepage title length <= 60 chars (got 59)
  ok 2 - [T1-F01-02] Homepage title matches exact commercial spec
  not ok 3 - [T1-F02-01] Homepage semantic H1 count === 1 (got 2)
    ---
    operator: equal
    expected: 1
    actual:   2
    at: tests/suites/tier1_feature_coverage.mjs:42
    ---
  ```
- **Terminal Summary Box**:
  ```
  ==============================================================
   PRINTS WITH PASSION — E2E RECOVERY TEST RUNNER SUMMARY
  ==============================================================
   Total Tests Run:    245
   Passed:             244
   Failed:               1
   Skipped:              0
   Duration:           18.42s
   Result:             FAIL (Bail on M1 Homepage H1 count)
  ==============================================================
  ```
- **JSON Structured Report**: Exported when `--json` flag is provided, structured with timestamps, feature breakdown, assertions passed/failed, and latency per test.

---

## 8. Caveats

1. **Shopify Admin API Quotas**: The store uses Shopify standard API limits (50 cost points/sec). The test runner must space GraphQL queries with a minimum 250ms delay between consecutive requests to avoid triggering `THROTTLED` errors.
2. **Search Console Inspection API Daily Quota**: GSC URL Inspection API has a daily limit of 2,000 requests per project. Tier 1 and Tier 4 tests must inspect a maximum of 15 priority URLs per run to conserve quota for cloud automation syncs.
3. **Live Theme Editing Safety**: Theme modifications for Feature 1 (title/meta), Feature 2 (H1 demotion), Feature 3 (auth link), Feature 4 (typo), and Feature 5 (hub snippet) occur on active theme `gid://shopify/OnlineStoreTheme/177936466293`. All test mutations in live mode must be verified for syntax validity before theme assets are updated.
4. **Google Index Lag**: Live HTTP redirects and metadata updates take effect immediately on `printswithpassion.com`, but reflecting in GSC impressions and Average Position requires Googlebot crawl cycles (expected 3–14 days per Section 5 of the recovery plan).

---

## 9. Conclusion

The specification mining investigation has uncovered and verified the authoritative technical state, root causes, interface contracts, and expected behaviors across all 23 features in PROJECT.md. 

The test specification matrix provides:
- **115 Tier 1 Feature Coverage Test Cases** (5 distinct test cases for each of the 23 features).
- **115 Tier 2 Boundary & Corner Cases** (covering length boundaries, entity escaping, empty collections, URL encoding, and whitespace).
- **10 Critical Tier 3 Cross-Feature Interactions** (testing redirects vs deletions, sitemaps vs unpublishing, rewriter vs lint gate).
- **5 Comprehensive Tier 4 Real-World Application Scenarios** (Googlebot smartphone crawling, SERP snippet rendering, live customer navigation, and sitemap XML validation).
- A complete, modular architecture for `tests/e2e_recovery_test_runner.mjs`.

The test suite is fully designed and ready for immediate implementation by the test implementation engineer.

---

## 10. Verification Method

To independently verify this specification and test readiness:
1. **Inspect Handoff Artifact**:
   `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\spec_miner_e2e_1\handoff.md`
2. **Execute Diagnostic Forensics Script**:
   ```powershell
   node C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch\gsc_deep_dive_part5_root_causes_verification.mjs
   ```
   *Expected Output*: Verifies live 404s on 28 legacy collections, 2 H1s on homepage, truncated titles, double-escaped `&amp;quot;`, and AVADA sitemap status.
3. **Verify Catalog Counts via Shopify GraphQL**:
   ```powershell
   cd C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
   node -e "import('./lib/cloud-env.mjs').then(async m => { console.log(await m.shopifyGraphQL('{ collectionsCount { count } pagesCount { count } }')); });"
   ```
   *Expected Output*: `{"collectionsCount":{"count":101},"pagesCount":{"count":36}}`.
4. **Invalidation Conditions**:
   - If Shopify Admin API removes OAuth access or credentials change.
   - If the active theme ID changes from `gid://shopify/OnlineStoreTheme/177936466293`.
