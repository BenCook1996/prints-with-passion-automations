# Handoff Report — Milestone 6 Phase 1: E2E Test Suite Execution (Dry-Run & Live Modes)

## 1. Observation

### Execution Commands and Run Results
Two complete executions of the opaque-box 4-tier E2E test runner (`tests/e2e_recovery_test_runner.mjs`) were performed from repository root `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`:

1. **Dry-Run Test Execution**:
   - **Command**: `node --dns-result-order=ipv4first tests/e2e_recovery_test_runner.mjs --dry-run --json`
   - **Process Exit Code**: `0`
   - **Duration**: `3.13s`
   - **Total Tests Run**: `245`
   - **Total Passed**: `245` (100.0%)
   - **Total Failed**: `0` (0.0%)
   - **Total Skipped**: `0`
   - **Tier Breakdown**:
     - **Tier 1 (Feature Coverage)**: 115 Total | 115 Passed | 0 Failed | 0 Skipped (100%)
     - **Tier 2 (Boundaries & Corners)**: 115 Total | 115 Passed | 0 Failed | 0 Skipped (100%)
     - **Tier 3 (Cross-Feature Interactions)**: 10 Total | 10 Passed | 0 Failed | 0 Skipped (100%)
     - **Tier 4 (Real-World Scenarios)**: 5 Total | 5 Passed | 0 Failed | 0 Skipped (100%)
   - **Report Artifact**: Saved to `tests/reports/e2e_report_dryrun.json` (and `tests/reports/e2e_report.json`).

2. **Live Storefront & API Test Execution**:
   - **Command**: `node --dns-result-order=ipv4first tests/e2e_recovery_test_runner.mjs --live --json`
   - **Process Exit Code**: `1`
   - **Duration**: `273.60s` (4m 33s with 250ms inter-request pacing)
   - **Total Tests Run**: `245`
   - **Total Passed**: `236` (96.33%)
   - **Total Failed**: `9` (3.67%)
   - **Total Skipped**: `0`
   - **Tier Breakdown**:
     - **Tier 1 (Feature Coverage)**: 115 Total | 110 Passed | 5 Failed | 0 Skipped (95.65%)
     - **Tier 2 (Boundaries & Corners)**: 115 Total | 112 Passed | 3 Failed | 0 Skipped (97.39%)
     - **Tier 3 (Cross-Feature Interactions)**: 10 Total | 10 Passed | 0 Failed | 0 Skipped (100.0%)
     - **Tier 4 (Real-World Scenarios)**: 5 Total | 4 Passed | 1 Failed | 0 Skipped (80.0%)
   - **Report Artifact**: Saved to `tests/reports/e2e_report_live.json`.

---

### Verbatim Error Logs & Stack Traces for All 9 Live Failures

#### 1. `T1-F04-05` — Shop Support Email Settings
- **Location**: `tests/suites/tier1_feature_coverage.mjs:326`
- **Feature**: F4 (Contact Email Typo Correction)
- **Error Operator**: `equal`
- **Expected**: `"printswithpassionbc@gmail.com"`
- **Actual**: `"printswithpasssionbc@gmail.com"`
- **Message**: `"Shop Admin contact email setting must be printswithpassionbc@gmail.com"`
- **Verbatim Stack**:
  ```
  AssertionError: Shop Admin contact email setting must be printswithpassionbc@gmail.com
      at assertEqual (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:35:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier1_feature_coverage.mjs:326:9)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 2. `T1-F05-01` — Homepage Hub Snippet Presence
- **Location**: `tests/suites/tier1_feature_coverage.mjs:342`
- **Feature**: F5 (Curated Studio Hub Directory)
- **Error Operator**: `regex`
- **Expected**: `/class=["'][^"']*pwp-curated-collections-hub/i`
- **Actual**: `<!doctype html><!--[if IE 9]> <html class="ie9 no-js supports-no-cookies" lang="en">...`
- **Message**: `"Homepage must render Curated Collections Hub container"`
- **Verbatim Stack**:
  ```
  AssertionError: Homepage must render Curated Collections Hub container
      at assertRegex (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:71:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier1_feature_coverage.mjs:342:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 3. `T1-F10-05` — All Redirect Targets HTTP 200
- **Location**: `tests/suites/tier1_feature_coverage.mjs:707`
- **Feature**: F10 (Fix %20 Redirect Targets)
- **Error Operator**: `ok`
- **Expected**: `true`
- **Actual**: `false`
- **Message**: `"Redirect target /products/a-tapestry-of-colors-in-marrakechs-heart must return HTTP 200"`
- **Verbatim Stack**:
  ```
  AssertionError: Redirect target /products/a-tapestry-of-colors-in-marrakechs-heart must return HTTP 200
      at assertOk (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:19:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier1_feature_coverage.mjs:707:11)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 4. `T1-F17-03` — PUT On Missing Sitemap
- **Location**: `tests/suites/tier1_feature_coverage.mjs:1144`
- **Feature**: F17 (Sitemap Submission Idempotency)
- **Error Operator**: `ok`
- **Expected**: `true`
- **Actual**: `false`
- **Message**: `"PUT must succeed for missing sitemap"`
- **Verbatim Stack**:
  ```
  AssertionError: PUT must succeed for missing sitemap
      at assertOk (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:19:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier1_feature_coverage.mjs:1144:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 5. `T1-F17-04` — PUT On Errored Sitemap
- **Location**: `tests/suites/tier1_feature_coverage.mjs:1154`
- **Feature**: F17 (Sitemap Submission Idempotency)
- **Error Operator**: `ok`
- **Expected**: `true`
- **Actual**: `false`
- **Message**: `"PUT must succeed to refresh errored sitemap"`
- **Verbatim Stack**:
  ```
  AssertionError: PUT must succeed to refresh errored sitemap
      at assertOk (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:19:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier1_feature_coverage.mjs:1154:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 6. `T2-F05-03` — Hub Snippet Included Twice in Layout Deduplication
- **Location**: `tests/suites/tier2_boundaries_corners.mjs:315`
- **Feature**: F5 (Curated Studio Hub Directory)
- **Error Operator**: `equal`
- **Expected**: `1`
- **Actual**: `0`
- **Message**: `"Curated collections hub must only appear once in DOM"`
- **Verbatim Stack**:
  ```
  AssertionError: Curated collections hub must only appear once in DOM
      at assertEqual (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:35:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier2_boundaries_corners.mjs:315:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 7. `T2-F07-03` — Redirect Chain Detection (A -> B -> C)
- **Location**: `tests/suites/tier2_boundaries_corners.mjs:462`
- **Feature**: F7 (Create 301 Legacy Redirects)
- **Error Operator**: `equal`
- **Expected**: `0`
- **Actual**: `2`
- **Message**: `"No redirect targets may point to another redirect path (multi-hop chains prohibited)"`
- **Verbatim Stack**:
  ```
  AssertionError: No redirect targets may point to another redirect path (multi-hop chains prohibited)
      at assertEqual (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:35:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier2_boundaries_corners.mjs:462:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 8. `T2-F21-04` — E2E Runner Offline Mode Completes Without Network
- **Location**: `tests/suites/tier2_boundaries_corners.mjs:1314`
- **Feature**: F21 (End-to-End Test Suite)
- **Error Operator**: `equal`
- **Expected**: `true`
- **Actual**: `false`
- **Message**: `"Dry-run flag active"`
- **Verbatim Stack**:
  ```
  AssertionError: Dry-run flag active
      at assertEqual (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:35:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier2_boundaries_corners.mjs:1314:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

#### 9. `T4-SCEN-04` — Human Shopper Live Storefront Navigation Journey
- **Location**: `tests/suites/tier4_real_world.mjs:166`
- **Feature**: Scenario 4 (Human Shopper Live Storefront Navigation Journey)
- **Error Operator**: `includes`
- **Expected**: `includes "pwp-curated-collections-hub"`
- **Actual**: `<!doctype html><!--[if IE 9]> <html class="ie9 no-js supports-no-cookies" lang="en">...`
- **Message**: `"Shopper views curated collections hub"`
- **Verbatim Stack**:
  ```
  AssertionError: Shopper views curated collections hub
      at assertIncludes (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/helpers/assertions.mjs:115:11)
      at Object.run (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/suites/tier4_real_world.mjs:166:7)
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async main (file:///C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/tests/e2e_recovery_test_runner.mjs:155:7)
  ```

---

## 2. Logic Chain & Root Cause Analysis

### Step 1: Category A — Storefront HTML Class Name Discrepancy (3 Failures: `T1-F05-01`, `T2-F05-03`, `T4-SCEN-04`)
- **Direct Observation**:
  - `snippets/pwp-curated-collections-hub.liquid` lines 17 & 184 define container styling `.pwp-curated-hub` and HTML tag `<section class="pwp-curated-hub" aria-labelledby="pwp-curated-hub-heading">`.
  - In `deploy_milestone_1.mjs` line 440, verification checks `pageHtml.includes('pwp-curated-hub')` which PASSED.
  - The live storefront `https://printswithpassion.com/` returns HTML that contains `pwp-curated-hub: true` and all 48 sub-collection links.
  - However, `tests/suites/tier1_feature_coverage.mjs:342` asserts `/class=["'][^"']*pwp-curated-collections-hub/i`, `tier2_boundaries_corners.mjs:315` asserts `matches.length === 1` for `pwp-curated-collections-hub`, and `tier4_real_world.mjs:166` asserts `homeRes.body.includes('pwp-curated-collections-hub')`.
  - In the offline fixture `tests/fixtures/homepage_sample.html` line 45, the container class was recorded as `<section class="pwp-curated-collections-hub" ...>`.
- **Inference**:
  The production theme snippet and live storefront render `.pwp-curated-hub` instead of `.pwp-curated-collections-hub`. The live tests expect the class name defined in `TEST_INFRA.md` (`.pwp-curated-collections-hub`). Adding `pwp-curated-collections-hub` to the container's class list (`class="pwp-curated-hub pwp-curated-collections-hub"`) would satisfy both stylesheets and test contracts.

### Step 2: Category B — Shopify Admin Store Setting API Immutability (1 Failure: `T1-F04-05`)
- **Direct Observation**:
  - `T1-F04-05` queries GraphQL `{ shop { contactEmail } }`.
  - Query against `bencook96store.myshopify.com` returns `contactEmail: "printswithpasssionbc@gmail.com"` (triple-s).
  - All theme files and storefront pages (homepage, `/pages/delivery-return`, liquid snippets) have been corrected to `printswithpassionbc@gmail.com` and pass tests `T1-F04-01` through `T1-F04-04`.
  - Schema inspection of GraphQL `Mutation` reveals no `shopUpdate` mutation exists in Shopify Admin API 2025-01.
  - REST endpoint `PUT /admin/api/2025-01/shop.json` returns HTTP 406 Not Acceptable because Shopify deprecated and disabled programmatic modification of merchant contact details via API tokens.
- **Inference**:
  `shop.contactEmail` is a merchant dashboard setting (`Settings -> General -> Store details`) that cannot be modified via Shopify Admin API tokens. It requires store owner authentication via the Shopify Web Admin UI. The test assumption that API tokens can alter `shop.contactEmail` fails against live Shopify platform constraints.

### Step 3: Category C — Google Search Console API Quota & Authorization Scopes (2 Failures: `T1-F17-03`, `T1-F17-04`)
- **Direct Observation**:
  - Direct execution of `submitSitemap(undefined, 'https://printswithpassion.com/sitemap_new_1.xml', { dryRun: false })` using GCP service account token (`sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`) against Webmasters v3 API `PUT https://www.googleapis.com/webmasters/v3/sites/.../sitemaps/...` returns HTTP 403 Forbidden.
  - In `tests/helpers/gsc_client.mjs`, `listSitemaps` has a fallback for HTTP 403/401 (`if (res.status === 403 || res.status === 401) return resolveFixtureSitemaps()`), but `submitSitemap` sets `success: res.ok`.
  - `T1-F17-03` and `T1-F17-04` assert `res.success === true`.
- **Inference**:
  The Google Cloud Service Account has been granted read-only / delegated inspection access in Google Search Console for property `sc-domain:printswithpassion.com`, but does not possess administrative Owner write permissions required to execute PUT requests on sitemaps.

### Step 4: Category D — Pre-existing Legacy Store Data in Shopify Admin (2 Failures: `T1-F10-05`, `T2-F07-03`)
- **Direct Observation**:
  - Shopify store `bencook96store.myshopify.com` contains 42,360 server-side `urlRedirect` records.
  - `T1-F10-05` samples `redirects.slice(0, 5)` from GraphQL `urlRedirects(first: 250)`. The first redirect target is `/products/a-tapestry-of-colors-in-marrakechs-heart`. Direct fetch against `https://printswithpassion.com/products/a-tapestry-of-colors-in-marrakechs-heart` returns HTTP 404 Not Found because this historical product was deleted from the store catalog.
  - `T2-F07-03` checks for redirect chains across all redirects in Shopify. It finds 2 multi-hop chains in historical product redirects:
    1. `/products/%f0%9f%8e%a8-messi-a-watercolor-masterpiece-of-grace-and-grandeur` -> `/products/messi-a-watercolor-masterpiece-of-grace-and-grandeur`
    2. `/products/midnight-magic-times-square-nightscape-poster` -> `/products/new-york-poster-midnight-magic-times-square-nightscape`
  - Neither of these failures originates from the 28 legacy collection redirects created under Milestone 2 (which all route cleanly to parent collections with HTTP 200/301 and 0 hops).
- **Inference**:
  `T1-F10-05` and `T2-F07-03` tested arbitrary pre-existing records from the 42,360 historical redirect table rather than scoping their assertions to the 15 repaired product redirects (Feature 10) or the 28 legacy collection redirects (Feature 7).

### Step 5: Category E — Live vs Dry-Run Context Inversion in Test Runner (1 Failure: `T2-F21-04`)
- **Direct Observation**:
  - `tests/suites/tier2_boundaries_corners.mjs` lines 1309-1316:
    ```javascript
    id: 'T2-F21-04',
    name: 'E2E Runner Offline Mode Completes Without Network',
    tier: 2,
    feature: 21,
    async run(ctx) {
      assertEqual(ctx.dryRun, true, 'Dry-run flag active');
    }
    ```
  - When the runner executes in live mode (`options.dryRun === false`), `ctx.dryRun` is `false`.
  - The assertion `assertEqual(ctx.dryRun, true)` directly asserts that the runner was executed with `--dry-run`.
- **Inference**:
  `T2-F21-04` contains an inverted premise: it asserts that the runner's execution context is currently offline, rather than running a subprocess to test offline behavior. As written, it is mathematically impossible for `T2-F21-04` to pass during a live mode run.

---

## 3. Caveats
- No modifications were made to test files or production assets during this execution turn to preserve raw forensic integrity.
- In dry-run mode, all 245 test cases pass 100% because fixtures reflect ideal hermetic state.
- Live test execution duration (273.60s) reflects intentional 250ms inter-request pacing enforcing Shopify's 50-cost-points/second leaky bucket limits.

---

## 4. Conclusion
1. **Dry-Run Suite**: Fully verified. 245/245 tests pass (100.0%) across all 4 tiers with exit code 0.
2. **Live Storefront Suite**: 236/245 tests pass (96.33%) with exit code 1.
3. The 9 live failures have been completely diagnosed and fall into 5 distinct, well-understood categories:
   - 3 tests (`T1-F05-01`, `T2-F05-03`, `T4-SCEN-04`) failed due to `.pwp-curated-hub` vs `.pwp-curated-collections-hub` class naming.
   - 1 test (`T1-F04-05`) failed because Shopify Admin API restricts `shop.contactEmail` modification.
   - 2 tests (`T1-F17-03`, `T1-F17-04`) failed because Google Search Console credentials have read-only permissions.
   - 2 tests (`T1-F10-05`, `T2-F07-03`) failed due to pre-existing historical redirect entries in the 42,360-entry database.
   - 1 test (`T2-F21-04`) failed due to an inline assertion `assertEqual(ctx.dryRun, true)` that cannot pass in live mode.

---

## 5. Verification Method

### How to Independently Verify:
1. **Verify Dry-Run Execution**:
   ```powershell
   Set-Location "C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine"
   node --dns-result-order=ipv4first tests/e2e_recovery_test_runner.mjs --dry-run --json
   ```
   *Expected Output*: Exit code `0`, `Total Tests Run: 245`, `Passed: 245`, `Failed: 0`, `Final Verdict: PASS`.

2. **Verify Saved Dry-Run JSON Report**:
   ```powershell
   Set-Location "C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine"
   node -e "const r = JSON.parse(fs.readFileSync('tests/reports/e2e_report_dryrun.json')); console.log(r.summary);"
   ```
   *Expected Output*: `{ total: 245, passed: 245, failed: 0, skipped: 0, durationSeconds: 3.13 }`.

3. **Verify Saved Live JSON Report**:
   ```powershell
   Set-Location "C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine"
   node -e "const r = JSON.parse(fs.readFileSync('tests/reports/e2e_report_live.json')); console.log(r.summary); console.log(r.tiers);"
   ```
   *Expected Output*:
   - Summary: `{ total: 245, passed: 236, failed: 9, skipped: 0, durationSeconds: 273.6 }`
   - Tiers: Tier 1 (110 pass, 5 fail), Tier 2 (112 pass, 3 fail), Tier 3 (10 pass, 0 fail), Tier 4 (4 pass, 1 fail).
