# Project: Prints With Passion — Google Search Console Recovery & Storefront SEO Overhaul

## Architecture
- **Storefront & Theme Engine**: Shopify Liquid on active theme `gid://shopify/OnlineStoreTheme/177936466293` (`2025-theme|OPT`) on `bencook96store.myshopify.com` (`https://printswithpassion.com/`).
- **Catalog & Admin API**: Shopify Admin GraphQL/REST API (2025-01) managing 101 collections, 36 static pages, 25 blog articles, and 42,360 server-side urlRedirects.
- **Automation Codebase**: Node.js ES modules (`pwp-seo-blog-engine`), OAuth2 Shopify token exchange (`lib/cloud-env.mjs`), Google Cloud Service Account JWT auth (`sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`), and Google Search Console Webmasters v3 / URL Inspection APIs.
- **CI/CD Infrastructure**: GitHub Actions (`BenCook1996/prints-with-passion-automations` on `main`) running daily GMC, SEO, and weekly rewriters.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Homepage SEO Metadata | Update shop/homepage title (<=60 chars) and meta description without entity artifacts or discontinued categories | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 2 | Semantic <h1> Demotion | Demote decorative logo brand badge to `<div>` in `sections/header.liquid` so exactly 1 commercial `<h1>` renders | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 3 | Customer Auth URL Repair | Fix leading slash in `sections/header.liquid` line 1796 to prevent 404 crawl trap | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 4 | Contact Email Typo Correction | Cure `printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com` in shop settings and `/pages/delivery-return` | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 5 | Curated Studio Hub Directory | Deploy `snippets/pwp-curated-collections-hub.liquid` placing all 48 smart sub-collections within 1 click of `/` and 6 parent collections | M1 | ORIGINAL_REQUEST R1 (DONE) |
| 6 | Delete 28 Legacy Collections | Execute `collectionDelete` for 28 0-product collections while preserving `frontpage` | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 7 | Create 301 Legacy Redirects | Establish server-side 301 redirects for all 28 legacy collection handles to active parent collections | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 8 | Unpublish AVADA Collection | Execute `publishableUnpublish` against Online Store for `avada-upsell-best-sellers` to remove from sitemap | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 9 | Blog Guide Redirect Fix & Publication | Delete redirect on `/blogs/news/uk-student-room-rental-flat-decor-guide` and publish article | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 10 | Fix %20 Redirect Targets | Audit and repair 15 product redirects containing literal `%20` encoded spaces | M2 | ORIGINAL_REQUEST R2 (DONE) |
| 11 | Active Collection Titles | Populate bespoke, word-boundary-safe `seo.title` (<=60 chars) across all 66+ active collections | M3 | ORIGINAL_REQUEST R3 |
| 12 | Active Collection Descriptions | Rewrite `seo.description` (140-158 chars) with plain text, no double-escaped entities or broken template phrases | M3 | ORIGINAL_REQUEST R3 |
| 13 | Specific Collections Fix | Fix overwritten product title on `japanese-anime-desk-mats` and hard truncated title on `abstract-minimalist-bauhaus-canvas-wall-art` | M3 | ORIGINAL_REQUEST R3 |
| 14 | Page Inner <h1> Conversion | Convert inner `<h1>` in `page.body` to `<h2>` across all 36 pages (including 28 *-uk-guide) so strictly 1 `<h1>` renders | M4 | ORIGINAL_REQUEST R4 |
| 15 | Page SEO Metadata & Links | Populate word-boundary `seo.title` (<=60 chars) and `seo.description` (145-158 chars) for 36 pages; link 11 missing pages in catalog | M4 | ORIGINAL_REQUEST R4 |
| 16 | Blog Article Titles & Internal Links | Fix truncated titles and populate `title_tag`/`description_tag` for 25 articles; inject contextual internal cross-links | M4 | ORIGINAL_REQUEST R4 |
| 17 | Sitemap Submission Idempotency | Update `gsc_ga4_gmc_cloud_sync.mjs` to only PUT missing/errored sitemaps, preserving GSC `LastSubmitted` crawl history | M5 | ORIGINAL_REQUEST R5 |
| 18 | Rotating URL Inspection Health | Integrate rotating 15-URL batch inspection into `gsc_ga4_gmc_cloud_sync.mjs` using Search Console inspection API | M5 | ORIGINAL_REQUEST R5 |
| 19 | Title Boundary Truncator & Guard | Upgrade `strikezone_ctr_and_competitor_rewriter.mjs` with `fitTitleUnder60Chars` and category-level plural theme guard | M5 | ORIGINAL_REQUEST R5 |
| 20 | SEO Lint Gate & Storewide Validator | Upgrade `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs` with entity, grammar, and 0-product gates | M5 | ORIGINAL_REQUEST R5 |
| 21 | End-to-End Test Suite | Implement comprehensive 4-Tier Opaque-box E2E test runner covering all requirements R1–R6 | E2E | Project Pattern Dual Track |
| 22 | Adversarial Hardening (Tier 5) | Perform white-box adversarial verification of edge cases, race conditions, entity escaping, and GSC API pacing | M6 | Project Pattern Phase 2 |
| 23 | Git Deployment & Cloud Sync | Commit, push to `origin/main`, trigger `pwp-daily-technical-seo.yml`, verify successful run, and update walkthrough | M6 | ORIGINAL_REQUEST R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test infra & runner (Tiers 1-4) published to `TEST_READY.md` | none | IN_PROGRESS |
| 1 | Homepage & Theme SEO Overhaul (R1) | Theme assets, title/meta, single H1, auth link, email typo, 48 sub-collection hub snippet | none | DONE |
| 2 | Collection & Redirect Hygiene (R2) | Delete 28 legacy collections, 301 redirects, unpublish AVADA, blog redirect/publish, fix %20 redirects | none | DONE |
| 3 | Active Collection SEO Metadata (R3) | Populate title (<=60) and description (140-158) across all active collections, fix anime & bauhaus | M2 | IN_PROGRESS |
| 4 | Page & Article SEO Remediation (R4) | Convert inner H1->H2 on 36 pages, populate metadata, link 11 pages, repair 25 blog articles | M2 | IN_PROGRESS |
| 5 | Automation Scripts Upgrade (R5) | GSC sync idempotency + URL inspect, rewriter title boundaries, lint gate storewide rules | none | IN_PROGRESS |
| 6 | Final Milestone: E2E Verification & CI (R6) | Pass 100% E2E test suite (Tiers 1-4), Tier 5 adversarial hardening, Git push main, trigger CI | M1, M3, M4, M5, E2E | PLANNED |

## Interface Contracts
### Theme Assets ↔ Live Storefront
- `snippets/head.liquid`: Emits `<title>` strictly `<= 60` chars on index, `<meta name="description">` (140-158 chars) with plain text unescaped copy.
- `sections/header.liquid`: Sets `main_logo_tag = 'div'` on index, eliminates leading `/` from line 1796.
- `layout/theme.liquid`: Renders `snippets/pwp-curated-collections-hub.liquid` on index and 6 parent collections.

### Shopify Admin API ↔ Automation Codebase
- GraphQL endpoint: `https://bencook96store.myshopify.com/admin/api/2025-01/graphql.json`
- Mutations used: `collectionDelete`, `urlRedirectCreate`, `urlRedirectUpdate`, `urlRedirectDelete`, `publishableUnpublish`, `collectionUpdate`, `pageUpdate`, `articleUpdate`.
- Pacing: Max 4 GraphQL calls/sec to stay within the 50-point/sec leaky bucket.

### Automation Scripts ↔ Google Search Console API
- Endpoint: `https://www.googleapis.com/webmasters/v3/sites/.../sitemaps` and `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`
- Authorization: RS256 JWT bearer token from `.gcp_service_account.json`.
- Idempotency: `GET /sitemaps` precedes `PUT`; `PUT` invoked only when `!existing || errors > 0`.
- Quota: 15 URLs per run with 200ms delay.

## Code Layout
- `snippets/pwp-curated-collections-hub.liquid` (New theme snippet)
- `snippets/head.liquid` (Theme head metadata)
- `sections/header.liquid` (Theme header logo & auth links)
- `templates/index.json` (Theme index template sections)
- `layout/theme.liquid` (Theme root layout)
- `gsc_ga4_gmc_cloud_sync.mjs` (GSC sitemap & URL inspection sync)
- `strikezone_ctr_and_competitor_rewriter.mjs` (CTR title & meta rewriter)
- `catalog_uniqueness_and_seo_lint_gate.mjs` (Lint gate and entity sanitizer)
- `verify_40_subcollections_counts.mjs` (Storewide collection validation)
- `tests/e2e_recovery_test_runner.mjs` (E2E opaque-box test runner)
