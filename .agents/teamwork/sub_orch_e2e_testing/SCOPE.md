# Scope: E2E Testing Track

## Architecture
- **E2E Test Runner**: `tests/e2e_recovery_test_runner.mjs` (Node.js ES Module).
- **Test Infrastructure Document**: `TEST_INFRA.md` at project root.
- **Completion Signal**: `TEST_READY.md` at project root.
- **Verification Targets**:
  - Live Storefront (`https://printswithpassion.com/`): Opaque-box HTML scraping, HTTP status code checks, header checks, canonical links, sitemaps (`/sitemap.xml`, `/sitemap_collections_1.xml`, `/sitemap_pages_1.xml`, `/sitemap_articles_1.xml`), robots.txt, schema.org JSON-LD.
  - Shopify Admin API (`bencook96store.myshopify.com`): GraphQL queries for collection counts, redirect records, publication status, page bodies, article tags.
  - Automation Codebase & CLI Entry Points: `gsc_ga4_gmc_cloud_sync.mjs`, `strikezone_ctr_and_competitor_rewriter.mjs`, `catalog_uniqueness_and_seo_lint_gate.mjs`, `verify_40_subcollections_counts.mjs`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Homepage SEO Metadata | Shop/homepage title <=60 chars & clean meta description | E2E-T1/T2 | ORIGINAL_REQUEST R1 |
| 2 | Semantic <h1> Demotion | Single commercial <h1> on homepage, logo demoted to <div> | E2E-T1/T2 | ORIGINAL_REQUEST R1 |
| 3 | Customer Auth URL Repair | Line 1796 leading slash removed; valid auth URL | E2E-T1/T2 | ORIGINAL_REQUEST R1 |
| 4 | Contact Email Typo Correction | Correct email `printswithpassionbc@gmail.com` across shop & /pages/delivery-return | E2E-T1/T2 | ORIGINAL_REQUEST R1 |
| 5 | Curated Studio Hub Directory | 48 curated studio collections hub snippet on homepage & 6 parent collection pages | E2E-T1/T2 | ORIGINAL_REQUEST R1 |
| 6 | Delete 28 Legacy Collections | 28 discontinued 0-product collections deleted from Admin API | E2E-T1/T2 | ORIGINAL_REQUEST R2 |
| 7 | Create 301 Legacy Redirects | Server-side 301 redirects for 28 legacy collection handles to active parents | E2E-T1/T2 | ORIGINAL_REQUEST R2 |
| 8 | Unpublish AVADA Collection | `avada-upsell-best-sellers` unpublished from Online Store; excluded from sitemap | E2E-T1/T2 | ORIGINAL_REQUEST R2 |
| 9 | Blog Guide Redirect Fix & Publication | Delete redirect on uk-student-room-rental-flat-decor-guide and verify publication | E2E-T1/T2 | ORIGINAL_REQUEST R2 |
| 10 | Fix %20 Redirect Targets | 15 product redirects with literal %20 fixed | E2E-T1/T2 | ORIGINAL_REQUEST R2 |
| 11 | Active Collection Titles | Bespoke word-boundary title <=60 chars across all active collections | E2E-T1/T2 | ORIGINAL_REQUEST R3 |
| 12 | Active Collection Descriptions | Plain text 140-158 chars descriptions without entities or template phrases | E2E-T1/T2 | ORIGINAL_REQUEST R3 |
| 13 | Specific Collections Fix | Fix japanese-anime-desk-mats and abstract-minimalist-bauhaus-canvas-wall-art | E2E-T1/T2 | ORIGINAL_REQUEST R3 |
| 14 | Page Inner <h1> Conversion | Inner <h1> converted to <h2> on 36 pages so strictly 1 <h1> renders | E2E-T1/T2 | ORIGINAL_REQUEST R4 |
| 15 | Page SEO Metadata & Links | Word-boundary title <=60 chars, description 145-158 chars, 11 unindexed pages linked | E2E-T1/T2 | ORIGINAL_REQUEST R4 |
| 16 | Blog Article Titles & Internal Links | Truncated titles repaired, meta tags populated, contextual internal links added | E2E-T1/T2 | ORIGINAL_REQUEST R4 |
| 17 | Sitemap Submission Idempotency | GSC sync only submits PUT when sitemap missing or erroring | E2E-T1/T2 | ORIGINAL_REQUEST R5 |
| 18 | Rotating URL Inspection Health | 15-URL batch inspection integration with GSC inspection API | E2E-T1/T2 | ORIGINAL_REQUEST R5 |
| 19 | Title Boundary Truncator & Guard | `fitTitleUnder60Chars` and category-level plural guard in rewriter | E2E-T1/T2 | ORIGINAL_REQUEST R5 |
| 20 | SEO Lint Gate & Storewide Validator | Storewide lint gate for entities, template fragments, and 0-product collections | E2E-T1/T2 | ORIGINAL_REQUEST R5 |
| 21 | End-to-End Test Suite | Comprehensive 4-tier test runner covering all requirements R1–R6 | E2E-T1-T4 | Project Pattern Dual Track |
| 22 | Adversarial Hardening (Tier 5) | White-box stress testing, race conditions, entity escaping edge cases | E2E-T5-prep | Project Pattern Phase 2 |
| 23 | Git Deployment & Cloud Sync | Git status, clean commit, CI workflow configuration validation | E2E-T1/T4 | ORIGINAL_REQUEST R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E.1 | Survey & Spec Mining | Spec miner investigates live endpoints, schema, and reference diagnostics | none | DONE |
| E2E.2 | Test Infrastructure & Framework Design | Create `TEST_INFRA.md` & test runner harness at `tests/e2e_recovery_test_runner.mjs` | E2E.1 | DONE |
| E2E.3 | Test Case Implementation (Tiers 1-4) | Implement Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner), Tier 3 (Cross-Feature Pairwise), Tier 4 (Real-World Scenarios) | E2E.2 | DONE |
| E2E.4 | Review, Challenger & Forensic Audit | Spawn Reviewers, Challengers, and Forensic Auditor to verify test runner completeness, execution, and integrity | E2E.3 | DONE |
| E2E.5 | TEST_READY Publication & Handoff | Generate `TEST_READY.md` at root, update briefing/progress, send handoff to parent | E2E.4 | DONE |

## Interface Contracts
### Test Runner Invocation
- Entry Point: `node tests/e2e_recovery_test_runner.mjs [options]`
- CLI Flags:
  - `--tier=1|2|3|4|all`
  - `--feature=F1..F23`
  - `--json` (for programmatic parsing)
  - `--verbose`
- Exit Code: `0` if all tests pass (or in current state, accurately reporting pass/fail status per test case); non-zero if test harness crashes.
- Output Format: Structured TAP or JSON summary reporting per-tier test counts, pass/fail counts, execution time, and failure diagnostics.
