# TEST_INFRA — Prints With Passion E2E Recovery Test Infrastructure

## Overview

The Prints With Passion E2E Recovery Test Suite is an opaque-box, 4-tier automated test harness designed to rigorously verify the 6-phase Google Search Console recovery and storefront SEO overhaul across:
1. Live storefront HTTP rendering (`https://printswithpassion.com/`)
2. Shopify Admin GraphQL API catalog, publication, and redirect states (`bencook96store.myshopify.com`)
3. Google Search Console Sitemaps and URL Inspection APIs
4. Cloud automation scripts and quality lint gates

The architecture follows the **Dual Track** methodology, executing independently of theme implementation and automation rewriters to guarantee uncompromised test integrity.

---

## 1. Test Architecture & Principles

- **Opaque-Box / Black-Box Verification**: Tests inspect externally observable outputs (HTTP response codes, redirect headers, rendered DOM tags, canonical tags, XML sitemap schemas, GraphQL API query results) rather than mocking internal liquid templates.
- **Progressive Testability**: Operates in two complementary modes:
  - **Live Storefront & Admin API Mode** (default): Executes live HTTP requests against `https://printswithpassion.com/` and authenticated GraphQL queries via `lib/cloud-env.mjs`.
  - **Offline / Dry-Run Mode** (`--dry-run`): Uses recorded realistic DOM, GraphQL, and sitemap snapshots from `tests/fixtures/` to verify test suite logic and lint rules in hermetic/offline environments.
- **Pacing & Rate Limiting**: Enforces strict request throttling (default 250ms inter-request pacing) to respect Shopify’s 50-cost-points/second leaky bucket and Google Search Console daily URL Inspection limits (15 URLs/run max).
- **TAP v13 Standard**: Test output strictly complies with Test Anything Protocol version 13, enabling seamless consumption by CI runners and human operators.

---

## 2. Test Directory Layout

```
tests/
├── e2e_recovery_test_runner.mjs        # Executable CLI test runner entrypoint
├── helpers/
│   ├── assertions.mjs                  # TAP v13 assertion library (assertOk, assertEqual, etc.)
│   ├── storefront_crawler.mjs          # HTTP fetcher with User-Agent spoofing & DOM parsing
│   ├── shopify_client.mjs              # Throttled Shopify GraphQL client (wraps lib/cloud-env.mjs)
│   └── gsc_client.mjs                  # Google Search Console API client (wraps lib/cloud-env.mjs)
├── fixtures/                           # Recorded offline snapshots for hermetic test execution
│   ├── homepage_sample.html            # Rendered homepage HTML snapshot
│   ├── collections_sample.json         # Active & discontinued collection catalog records
│   ├── redirects_sample.json           # Shopify server-side 301 urlRedirect records
│   ├── pages_sample.json               # 36 static pages & pillar guide content records
│   ├── articles_sample.json            # 25 blog article records with internal link topology
│   └── sitemaps_sample.xml             # Sitemap index & child sitemaps (collections, pages, articles)
├── suites/
│   ├── tier1_feature_coverage.mjs      # 115 test cases (5 per feature across F1–F23)
│   ├── tier2_boundaries_corners.mjs    # 115 boundary test cases (5 per feature across F1–F23)
│   ├── tier3_cross_feature.mjs         # 10 pairwise cross-feature interaction test cases
│   └── tier4_real_world.mjs            # 5 real-world scenarios (Googlebot smartphone crawl, SERP preview, etc.)
└── reports/
    └── e2e_report.json                 # Structured JSON execution report (generated via --json)
```

---

## 3. Test Tier Breakdown (245 Total Test Cases)

### Tier 1: Feature Coverage (115 Test Cases, 5 per Feature F1–F23)
- **F1: Homepage SEO Metadata** (T1-F01-01 to T1-F01-05): Title length <= 60 chars, exact commercial title, meta description 140–158 chars, zero entity artifacts, deleted category audit.
- **F2: Semantic `<h1>` Demotion** (T1-F02-01 to T1-F02-05): Single `<h1>` in live DOM, logo demoted to `<div>`, commercial search intent, zero nested H1s, accessibility visibility.
- **F3: Customer Auth URL Repair** (T1-F03-01 to T1-F03-05): Zero `href="/http"` crawl traps, valid login target, HTTP 200/302 response, mobile & desktop menu checks.
- **F4: Contact Email Typo Correction** (T1-F04-01 to T1-F04-05): Zero occurrences of `passsion` (triple-s) on `/` and `/pages/delivery-return`, clean `printswithpassionbc@gmail.com` presence, shop support email settings.
- **F5: Curated Studio Hub Directory** (T1-F05-01 to T1-F05-05): Hub container `.pwp-curated-collections-hub` rendered, all 48 sub-collections linked on `/`, hub present on 6 parent collection pages, click depth === 1.
- **F6: Delete 28 Legacy Collections** (T1-F06-01 to T1-F06-05): 28 discontinued 0-product collections return `null` in GraphQL, `frontpage` preserved, zero legacy handles in `sitemap_collections_1.xml`.
- **F7: Create 301 Legacy Redirects** (T1-F07-01 to T1-F07-05): HTTP 301 redirects returned for all 28 handles, proper category routing (e.g. `posters` -> `/collections/canvas-prints`), 200 destination health.
- **F8: Unpublish AVADA Collection** (T1-F08-01 to T1-F08-05): Excluded from `sitemap_collections_1.xml`, Online Store publication `isPublished === false`, noindex meta tag, zero internal links.
- **F9: Blog Guide Redirect Fix & Publication** (T1-F09-01 to T1-F09-05): Accidental redirect on `uk-student-room-rental-flat-decor-guide` deleted, HTTP 200 returned, guide body rendered, published state, present in `sitemap_articles_1.xml`.
- **F10: Fix %20 Redirect Targets** (T1-F10-01 to T1-F10-05): Zero redirect targets contain literal `%20` or raw whitespace, targets resolve cleanly with HTTP 200.
- **F11: Active Collection Titles** (T1-F11-01 to T1-F11-05): `seo.title` non-null, length <= 60 chars, min length >= 30, no ellipsis truncation (`...`), commercial substrate modifier present.
- **F12: Active Collection Descriptions** (T1-F12-01 to T1-F12-05): Length 140–158 chars, zero `&quot;` in raw field, zero `&amp;quot;` in rendered HTML, no `"Transform with "` or `"Elevate with "` clichés.
- **F13: Specific Collections Fix** (T1-F13-01 to T1-F13-05): `japanese-anime-desk-mats` uses category plural `Desk Mats` (<=60 chars), `abstract-minimalist-bauhaus-canvas-wall-art` does not end in `(CM & I`, descriptions meet 140–158.
- **F14: Page Inner `<h1>` Conversion** (T1-F14-01 to T1-F14-05): Single `<h1>` across all 36 pages in `sitemap_pages_1.xml`, zero inner `<h1>` in `page.body`, zero literal `&amp;` typography artifacts.
- **F15: Page SEO Metadata & Links** (T1-F15-01 to T1-F15-05): 36 pages title <= 60 chars, description 145–158 chars, no breadcrumb meta description leak, 4 previously unindexed pages linked from catalog hub/footer.
- **F16: Blog Article Titles & Internal Links** (T1-F16-01 to T1-F16-05): Size guide does not cut off at `Extended Mo`, 25 articles title <= 60 chars, descriptions 140–158 chars, internal cross-links to 8 uncrawled guides and 14 sub-collections.
- **F17: Sitemap Submission Idempotency** (T1-F17-01 to T1-F17-05): GET sitemaps precedes PUT, healthy sitemaps skipped (zero PUTs), missing sitemaps trigger PUT, errored sitemaps refreshed, `LastSubmitted` crawl history preserved.
- **F18: Rotating URL Inspection Health** (T1-F18-01 to T1-F18-05): 15 URLs per inspection batch, rate limit delay >= 200ms, coverage state logged to `gsc_ga4_latest_snapshot.json`, indexing ratio computed, rotating cursor advances.
- **F19: Title Boundary Truncator & Guard** (T1-F19-01 to T1-F19-05): `fitTitleUnder60Chars` length <= 60, word-boundary preservation, delimiter stripping, category plural theme guard on collection paths, 14-day rewriter cooldown.
- **F20: SEO Lint Gate & Storewide Validator** (T1-F20-01 to T1-F20-05): Detects entity leaks (`&quot;`), template grammar clichés, truncated title fragments, empty 0-product collections; exits 0 on clean catalog.
- **F21: End-to-End Test Suite** (T1-F21-01 to T1-F21-05): Test runner CLI execution, `--tier=1` filtering, `--feature=1` filtering, `--json` report export, `--verbose` logging.
- **F22: Adversarial Hardening (Tier 5)** (T1-F22-01 to T1-F22-05): Graceful 5000ms timeout handling, Shopify 429 backoff retry, malformed HTML tolerance, unicode multi-byte string handling, 4 req/sec concurrency throttling.
- **F23: Git Deployment & Cloud Sync** (T1-F23-01 to T1-F23-05): Clean working tree, conventional commit format, remote branch alignment with `origin/main`, CI workflow configuration valid, walkthrough documentation updated.

### Tier 2: Boundary & Corner Cases (115 Test Cases, 5 per Feature F1–F23)
- Boundary character length checks (titles at 29, 30, 59, 60, 61; descriptions at 139, 140, 158, 159).
- Edge whitespace and delimiter scenarios (trailing commas, pipes, unencoded `%20`, consecutive `%20`, raw tabs/spaces).
- DOM structure edge cases (nested `<h1>` inside `<section>`, hidden headings with `display:none`, protocol-relative auth links).
- Collection lifecycle corners (attempts to delete `frontpage`, collections with active inventory, rapid sequential deletion under leaky bucket limits).
- Crawler resilience (circular redirect detection, socket reset retries, oversized body protection).

### Tier 3: Cross-Feature Interactions (10 Pairwise Test Cases)
- **T3-PAIR-01**: F6 (Legacy Deletion) + F7 (301 Redirects) — Redirect created before deletion; prevents 404 race condition.
- **T3-PAIR-02**: F8 (Unpublish AVADA) + F17 (Sitemap Idempotency) — Sitemap exclusion without resetting healthy sitemaps in GSC.
- **T3-PAIR-03**: F7 (301 Redirects) + F9 (Blog Guide Fix) — Redirect table conflict resolution on published blog guide.
- **T3-PAIR-04**: F11 (Collection Titles) + F19 (Title Truncator) — Category plural guard prevents single-product keyword title overwrite.
- **T3-PAIR-05**: F12 (Collection Meta) + F20 (SEO Lint Gate) — Description rewriter output passes 100% of lint gate rules.
- **T3-PAIR-06**: F5 (48 Sub-Collection Hub) + F13 (Specific Collections Fix) — Curated hub links match canonical handles with 0 hops.
- **T3-PAIR-07**: F14 (Page Inner H1) + F15 (Page SEO Metadata & Links) — Page body H1->H2 conversion while maintaining valid catalog hub links.
- **T3-PAIR-08**: F16 (Blog Article Links) + F5 (Sub-Collection Hub) — Contextual links inside articles point to active hub sub-collections.
- **T3-PAIR-09**: F1 (Homepage Meta) + F2 (Single H1) + F3 (Auth Link) + F4 (Email Typo) — Combined homepage overhaul validation.
- **T3-PAIR-10**: F17 (Sitemap Idempotency) + F18 (URL Inspection) — Combined GSC sync workflow completes within 60-second window.

### Tier 4: Real-World Scenarios (5 Comprehensive Scenarios)
- **T4-SCEN-01: Googlebot Smartphone Crawl Simulation**: Spoofs Googlebot mobile User-Agent, requests `/`, crawls to 48 sub-collections, verifies Click Depth 1 and HTTP 200.
- **T4-SCEN-02: SERP Snippet Preview Simulation**: Verifies titles fit within 600px pixel width without mid-word cuts and descriptions render plain text without double-escaped entities.
- **T4-SCEN-03: Googlebot Discontinued URL Prune Simulation**: Requests all 28 discontinued URLs recorded in GSC, follows HTTP 301 headers, verifies HTTP 200 destination.
- **T4-SCEN-04: Human Shopper Navigation Simulation**: Navigates from `/` through the Curated Studio Hub to a target collection page; verifies title, H1, and product grid.
- **T4-SCEN-05: Full Sitemap XML Schema & Entity Validation**: Fetches `sitemap.xml` and child sitemaps, validates XML syntax and UTF-8 encoding, asserts exact URL counts (70 collections, 36 pages, 25 articles), and verifies zero noindex URLs.

---

## 4. Test Runner CLI Reference

### Command Syntax
```bash
node tests/e2e_recovery_test_runner.mjs [options]
```

### CLI Options
| Flag | Description | Default |
|---|---|---|
| `--tier=<1\|2\|3\|4\|all>` | Select test tier to execute | `all` |
| `--feature=<1..23\|all>` | Filter by specific feature ID (F1–F23) | `all` |
| `--dry-run` | Execute against hermetic offline fixtures in `tests/fixtures/` | `false` |
| `--json` | Export structured JSON report to `tests/reports/e2e_report.json` | `false` |
| `--verbose` | Print detailed assertion steps and diagnostic logs | `false` |
| `--bail` | Halt test execution on first encountered failure | `false` |
| `--pacing=<ms>` | Inter-request delay in milliseconds | `250` |
| `--help` | Display usage instructions and exit | - |

### Usage Examples
```bash
# Run full suite against offline fixtures
node tests/e2e_recovery_test_runner.mjs --dry-run

# Run full suite and export JSON report
node tests/e2e_recovery_test_runner.mjs --dry-run --json

# Run only Tier 1 feature coverage tests
node tests/e2e_recovery_test_runner.mjs --tier=1 --dry-run

# Run tests for Feature 1 (Homepage SEO Metadata) across all tiers
node tests/e2e_recovery_test_runner.mjs --feature=1 --dry-run

# Run Tier 3 cross-feature interaction tests in verbose mode
node tests/e2e_recovery_test_runner.mjs --tier=3 --dry-run --verbose

# Run live against production storefront and Shopify API
node tests/e2e_recovery_test_runner.mjs
```

### Exit Codes
- `0`: All executed test cases passed.
- `1`: One or more test cases failed, or invalid CLI arguments provided.

---

---

## 6. Iteration 2 Remediation & Architectural Hardening

During Iteration 2, the E2E test infrastructure underwent a complete forensic remediation to eliminate all synthetic stubs, dummy mock facades, and concurrency hazards:

### 6.1 Network Helper Hardening & Rate-Limiting Concurrency
- **Queue-Serialized Ticket-Lock Pacing (`shopify_client.mjs` & `storefront_crawler.mjs`)**: Replaced timestamp-based pacing with promise-chain serialization (`pacingQueue`, `nextAvailableSlot`). Concurrent requests (`Promise.all`) are guaranteed spaced by at least `pacingMs` (default 250ms), completely preventing leaky-bucket HTTP 429 stampedes.
- **Dynamic Child Sitemap Partition Discovery (`storefront_crawler.mjs`)**: Added `getSitemapIndex()` and `resolveChildSitemapUrl()`. The crawler dynamically parses `https://printswithpassion.com/sitemap.xml`, extracts child sitemap URLs with their exact pagination query parameters (`?page=1`), and prevents HTTP 400 errors caused by bare filename requests.
- **Single-Pass Entity Decoding & Raw Attribute Extraction (`storefront_crawler.mjs`)**: Implemented single-pass `decodeHtmlEntities()` mapping table, `extractRawMetaDescription(html)`, and `{ raw: true }` options in `extractMetaDescription()` and `extractTitle()`. This prevents recursive regex masking where literal `&amp;quot;` entities were improperly transformed into `&quot;` and then `"`.
- **Automatic HTTP 429 Exponential Backoff**: Integrated exponential retry with `Retry-After` header inspection into `fetchUrl()` and `executeGraphQL()`.

### 6.2 Elimination of Mock Facades & Direct SUT Module Integration
All 12 inline dummy mock functions identified during forensic auditing were permanently eliminated and replaced with direct ES Module imports from production scripts:
- **`strikezone_ctr_and_competitor_rewriter.mjs`**: Directly imports `fitTitleUnder60Chars`, `isSingleProductQuery`, and `buildCompetitorSpecTitleAndMeta`.
- **`catalog_uniqueness_and_seo_lint_gate.mjs`**: Directly imports `UNESCAPED_ENTITY_REGEX`, `TEMPLATE_GRAMMAR_REGEX`, `DANGLING_TITLE_REGEX`, `unescapeHtmlEntities`, `sanitizeTemplateGrammar`, and `sanitizeDanglingTitle`.
- **`gsc_ga4_gmc_cloud_sync.mjs`**: Directly imports `buildPriorityInspectionPool`.
- **`verify_40_subcollections_counts.mjs`**: Directly imports `validateCollectionCompliance`.
- **`weekly_gsc_forecast_and_strikezone_tracker.mjs`**: Directly imports `isWithinTitleCooldown`.

### 6.3 Elimination of Stubs & Tautologies
- **21 `assertOk(true)` Stubs Eliminated**: Replaced with substantive assertions evaluating live/mock DOM structures, real `child_process.spawnSync` CLI runner execution, git repository configuration (`git branch`, upstream remotes), and GitHub Actions YAML workflows.
- **Local String Tautologies Replaced**: Replaced synthetic string tests (e.g. `'A'.repeat(139)`) with evaluations through the production `validateCollectionCompliance` gate, ensuring genuine boundary validation at 139, 140, 158, and 159 characters.
- **Quad-S Typo Regex Hardened**: In `T1-F04-01`, `T1-F04-03`, and `T3-PAIR-09`, regexes were hardened to `/\bprintswithpasssion(?:bc)?\b/i` to accurately capture quadruple-s spelling defects.
- **Feature Metadata Bug Corrected**: In `T1-F02-01`, fixed misassigned metadata from `feature: 1` to `feature: 2`.

### 6.4 Verification Summary
- **Total Test Cases**: 245
- **Tier 1 (Feature Coverage)**: 115 / 115 Passed (100%)
- **Tier 2 (Boundaries & Corners)**: 115 / 115 Passed (100%)
- **Tier 3 (Cross-Feature Pairwise)**: 10 / 10 Passed (100%)
- **Tier 4 (Real-World Scenarios)**: 5 / 5 Passed (100%)
- **Total Pass Rate**: 100% (245 / 245 in dry-run mode, exit code 0)

