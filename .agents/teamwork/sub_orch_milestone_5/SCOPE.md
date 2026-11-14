# Scope: Milestone 5 — Automation Scripts Upgrade

## Architecture
- Upgrades 4 Node.js automation scripts in `pwp-seo-blog-engine`:
  1. `gsc_ga4_gmc_cloud_sync.mjs`: Idempotent sitemap submission preserving LastSubmitted date and rotating GSC URL inspection health tracking.
  2. `strikezone_ctr_and_competitor_rewriter.mjs`: Word-boundary-safe title truncation (`fitTitleUnder60Chars`, `<= 60` chars) and collection theme guard against single-product keyword overwrites.
  3. `catalog_uniqueness_and_seo_lint_gate.mjs`: Validation and auto-sanitization for double-escaped entities, template grammar fragments, dangling truncated titles, and 0-product collections.
  4. `verify_40_subcollections_counts.mjs`: Storewide collection validation gate covering all active Shopify collections.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 17 | Sitemap Submission Idempotency | Update `gsc_ga4_gmc_cloud_sync.mjs` to only PUT missing/errored sitemaps, preserving GSC `LastSubmitted` crawl history | M5 | ORIGINAL_REQUEST R5 |
| 18 | Rotating URL Inspection Health | Integrate rotating 15-URL batch inspection into `gsc_ga4_gmc_cloud_sync.mjs` using Search Console inspection API | M5 | ORIGINAL_REQUEST R5 |
| 19 | Title Boundary Truncator & Guard | Upgrade `strikezone_ctr_and_competitor_rewriter.mjs` with `fitTitleUnder60Chars` and category-level plural theme guard | M5 | ORIGINAL_REQUEST R5 |
| 20 | SEO Lint Gate & Storewide Validator | Upgrade `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs` with entity, grammar, and 0-product gates | M5 | ORIGINAL_REQUEST R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 5 | Automation Scripts Upgrade (R5) | GSC sync idempotency + URL inspect, rewriter title boundaries, lint gate storewide rules | none | DONE |

## Interface Contracts
### Automation Scripts ↔ Google Search Console API
- Endpoint: `https://www.googleapis.com/webmasters/v3/sites/.../sitemaps` and `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`
- Authorization: RS256 JWT bearer token from `.gcp_service_account.json` (Google Cloud Service Account `sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`).
- Idempotency: `GET /sitemaps` precedes `PUT`; `PUT` invoked only when `!existing || errors > 0`.
- Quota: 15 URLs per run with 200ms delay.

### Title Truncation Contract
- Function signature: `fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60)`
- Output: strictly `<= 60` characters, no trailing punctuation/conjunctions (`-`, `|`, `&`, `(CM & I`), no cut mid-word, balanced brackets and parens, non-empty fallback to `'Prints With Passion'`.
- Collection guard: Single product search query cannot overwrite collection theme.

### Verification Contract
- `verify_40_subcollections_counts.mjs`: Checks all collections storewide. Fails if any 0-product collections exist (excluding `frontpage`), if titles > 60 chars or cut mid-word, or if meta descriptions contain unescaped entities or broken template fragments.

## Code Layout
- `gsc_ga4_gmc_cloud_sync.mjs`
- `strikezone_ctr_and_competitor_rewriter.mjs`
- `catalog_uniqueness_and_seo_lint_gate.mjs`
- `verify_40_subcollections_counts.mjs`
