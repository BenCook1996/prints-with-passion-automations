# DISPATCH — Worker 1 (Milestone 5 Implementation: Automation Scripts Upgrade)

## Mandatory Reading Before Any Implementation
1. `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md` (Read in full!)
2. `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md`
3. `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_5\SCOPE.md`
4. Explorer 1 Handoff: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_1\handoff.md`
5. Explorer 2 Handoff: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_2\handoff.md`
6. Explorer 3 Handoff: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_3_rep1\handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You exclusively own and may edit the following 4 files in `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`:
1. `gsc_ga4_gmc_cloud_sync.mjs`
2. `strikezone_ctr_and_competitor_rewriter.mjs`
3. `catalog_uniqueness_and_seo_lint_gate.mjs`
4. `verify_40_subcollections_counts.mjs`

You may also create temporary test scripts within your state folder or project test directory to verify your implementation.

## Detailed Implementation Requirements

### 1. In `gsc_ga4_gmc_cloud_sync.mjs`:
- **Sitemaps PUT Idempotency**:
  - Replace the unconditional daily `PUT` loop.
  - Query `GET https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`.
  - Delete stale sitemaps no longer in `desiredSet`.
  - Only issue a `PUT` request if a sitemap is missing from GSC or reports errors (`Number(existing.errors || 0) > 0`).
  - If a sitemap exists and is healthy (`errors === 0`), skip `PUT` and preserve Google's `LastSubmitted` date and indexing crawl history.
- **Rotating URL Inspection Health Tracking**:
  - Implement exported helper `buildPriorityInspectionPool(subcollections, knownUrls)`.
  - Implement exported helper `inspectUrl(token, siteUrl, inspectionUrl)` calling `searchconsole.googleapis.com/v1/urlInspection/index:inspect`.
  - Assemble priority pool containing root/category hubs, key pages, 48 smart sub-collections, guides, and products.
  - Inspect a rotating batch of 15 priority URLs per run with `>= 200ms` rate pacing.
  - Advance rotating cursor modulo pool length.
  - Aggregate metrics (`submittedAndIndexedCount`, `discoveredNotIndexedCount`, `crawledNotIndexedCount`, `urlUnknownCount`, `canonicalOverrides`, `indexedRatio`).
  - Store health telemetry in `snapshot.urlInspectionHealth` and update `snapshot.byUrl[pathKey].urlInspection`.

### 2. In `strikezone_ctr_and_competitor_rewriter.mjs`:
- **Word-Boundary-Safe Title Truncation**:
  - Export `fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60)`.
  - Enforce strictly `<= 60` characters.
  - Enforce word-boundary truncation (never slice mid-word like `(CM & I`, `Extended Mo`, `Studio Si`).
  - Balance parentheses and brackets (remove unclosed `(` or `[`).
  - Cleanly strip trailing delimiters, conjunctions, and prepositions (`-`, `|`, `&`, `,`, `:`, `and`, `or`, `with`, `for`, `in`, `to`, `vs`).
  - Evaluate specCandidates in descending length order before falling back to clean primary part.
- **Collection Intent Guard**:
  - Export `isSingleProductQuery(keyword, substrate)`.
  - Export `buildCollectionThematicTitle(colHandle, colTitle, substrate)`.
  - In `main()`, fetch collection details from Shopify GraphQL BEFORE calling `buildCompetitorSpecTitleAndMeta(entry, prevTitle, col)`.
  - When targeting `/collections/*`, ensure single-product search queries (e.g. `japanese wave desk mat`) NEVER overwrite multi-product collection titles or themes. Preserve plural substrate nouns (`XXL Desk Mats`, `Canvas Wall Art`, `Cushion Covers`, `Throw Blankets`, `Bath Mats`).

### 3. In `catalog_uniqueness_and_seo_lint_gate.mjs`:
- Add regexes: `UNESCAPED_ENTITY_REGEX`, `TEMPLATE_GRAMMAR_REGEX`, `DANGLING_TITLE_REGEX`.
- Export `unescapeHtmlEntities(str, isHtml = false)` for `&quot;`, `&amp;quot;`, `&amp;amp;`, `&#39;`.
- Export `sanitizeDanglingTitle(rawTitle, brandSuffix, maxChars = 60)`.
- Export `sanitizeTemplateGrammar(desc)`.
- Expand `SampleQualityGate` query to fetch `collections(first: 250)`, `productsCount { count }`, `pages(first: 50)`, and metafield title/description tags.
- Add audit and auto-sanitization loops for:
  - 0-product collections (flag, clean, redirect; exclude `frontpage`).
  - Double-escaped HTML entities in titles and descriptions.
  - Broken template grammar fragments (`Transform with...`, `Elevate with...`, `Style with...`).
  - Dangling truncated titles (`-`, `|`, `&`, `Mo`, `Si`).
- Log results to `LINT_QUALITY_GATE_LOG.md`.

### 4. In `verify_40_subcollections_counts.mjs`:
- Upgrade the 33-line script into a comprehensive storewide collection gate:
  - Query all collections storewide (`collections(first: 250)` with pagination).
  - Fetch and parse `sitemap_collections_1.xml` from `https://printswithpassion.com/sitemap.xml`.
  - Validate 8 compliance assertions:
    1. 0 empty collections (excluding `frontpage`).
    2. All active collection titles `<= 60` characters.
    3. No active collection title ends dangling or cut mid-word.
    4. All active collection descriptions are 140–158 characters.
    5. No active collection description contains unescaped HTML entities.
    6. No active collection description contains broken template grammar fragments.
    7. All 48 curated subcollections from `phase2_40_subcollections.json` are present in `sitemap_collections_1.xml`.
    8. Discontinued collections (such as `avada-upsell-best-sellers`) are NOT present in `sitemap_collections_1.xml`.
  - Print formatted diagnostic table.
  - Exit with code 1 if violations are present; exit with code 0 if 0 violations.

## Verification Requirements
You MUST run unit and integration tests against your changes and document:
1. Exact commands executed and their full terminal output.
2. Verification that all 4 scripts parse cleanly (`node --check <file>`).
3. Verification that tests pass.
4. Output your complete handoff report to:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m5_1\handoff.md`
Report back via `send_message` when done.


## 2026-11-13T01:17:29Z
You are Worker 1 for Milestone 5 (Phase 5 — Automation Scripts Upgrade).
Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m5_1


## 2026-11-14T02:31:37Z
**Context**: Server restart recovery for Milestone 5 implementation.
**Content**: The server has restarted. Please resume your implementation work immediately:
1. Complete the implementation of the 4 files:
   - `gsc_ga4_gmc_cloud_sync.mjs`: Idempotent sitemaps submission (`GET /sitemaps` check, only PUT when missing or errors > 0) + rotating 15-URL inspection batch with >=200ms pacing and telemetry aggregation.
   - `strikezone_ctr_and_competitor_rewriter.mjs`: `fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60)` + collection title keyword guard.
   - `catalog_uniqueness_and_seo_lint_gate.mjs`: Add unescaping for entities, template grammar sanitization, dangling title sanitization, 0-product collection handling.
   - `verify_40_subcollections_counts.mjs`: Upgrade to storewide collection compliance gate validating 8 compliance assertions.
2. Run syntax verification (`node --check <file>`) and tests.
3. Write your complete handoff report to `handoff.md` in your state folder.
**Action**: Resume execution and deliver your handoff report when finished.


## 2026-11-14T02:48:47Z
**Context**: Milestone 5 Worker completion.
**Content**: We noticed your progress log and briefing show implementation and tests complete. Please make sure `handoff.md` is written to your state folder (`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m5_1\handoff.md`) and send your completion report back via `send_message`.
**Action**: Write `handoff.md` and report completion.
