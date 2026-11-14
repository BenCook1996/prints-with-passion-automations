# Handoff Report — Explorer Survey 3 (Requirements R5 & R6)

## 1. Observation

Direct code and environment investigation conducted in `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine` and `C:\Users\Benjamin\.gemini\antigravity\brain\07bfb7d6-9234-4f9d-b17c-a75686424c5d\scratch`:

### 1.1 Git Remote & Branch Status
- **Repository Path**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`
- **Git Remote**: `origin https://github.com/BenCook1996/prints-with-passion-automations.git (fetch & push)`
- **Branch**: `main` (clean working tree, fully synced with `origin/main`).
- **Untracked files**: `.agents/`, `ORIGINAL_REQUEST.md`.
- **GitHub CLI (`gh auth status`)**: Authenticated as `BenCook1996` with scopes `'gist', 'read:org', 'repo', 'workflow'`.
- **Cloud Workflows (`gh workflow list`)**:
  - `412670068`: `1. Daily GMC Shopping Feed, Google Images Visual Pack & Spec-First CTR Optimizer` (active)
  - `412670069`: `2. Daily Technical SEO, Uniqueness/Lint Gate, 404 Self-Healer & AI Citation Audit` (active)
  - `412670071`: `3. Weekly GSC Sitemap/404 Triage, Forecast-vs-Actuals & Active Strike-Zone CTR Rewriter` (active)
  - `412670073`: `4. Weekly Active Internal Link Sculptor, SEO Lint Sanitizer, Interactive Visualizer & Earned Authority` (active)

### 1.2 Local Credentials Verification
- **`.shopify_token.json`**: Present and valid. Contains `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, and `SHOPIFY_ADMIN_ACCESS_TOKEN` for `bencook96store.myshopify.com`. Tested live GraphQL connection via `verify_40_subcollections_counts.mjs`: returned HTTP 200 with inventory counts for all 48 subcollections.
- **`.gcp_service_account.json`**: Present and valid. Client email: `sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`. Tested live RS256 JWT auth against `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`:
  - Request: `{ inspectionUrl: "https://printswithpassion.com/collections/canvas-prints", siteUrl: "https://printswithpassion.com/" }`
  - Response: `HTTP 200`, `verdict: "PASS"`, `coverageState: "Submitted and indexed"`.

### 1.3 `gsc_ga4_gmc_cloud_sync.mjs` Code Analysis
- **Lines 170–176**:
  ```javascript
  for (const smUrl of desiredSet) {
    const putRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(smUrl)}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );
    if (putRes.ok) sitemapsSynced++;
  }
  ```
  **Direct Issue**: Every daily run unconditionally issues a `PUT` request for all desired sitemaps, overwriting `LastSubmitted` in GSC and resetting indexing crawl history.
- **URL Inspection Gap**: The script currently queries Search Analytics (rows) and GA4 Data API, but lacks URL Inspection health tracking.

### 1.4 `strikezone_ctr_and_competitor_rewriter.mjs` Code Analysis
- **Lines 30, 36, 41**:
  ```javascript
  const newTitle = `${titleCasedKw} | 1.25" Pine Framed Canvas (CM & Inch)`.slice(0, 66);
  const newTitle = `${titleCasedKw} | 900x400x4mm (35.4"x15.7") Stitched Pad`.slice(0, 66);
  const newTitle = `${titleCasedKw} | Dual CM & Inch Studio Sizing Guide`.slice(0, 66);
  ```
  **Direct Issue**: Hard `.slice(0, 66)` cuts strings mid-word and mid-token.
- **Lines 79–133**:
  ```javascript
  for (const entry of selected) {
    const url = entry.targetUrl || entry.url;
    const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry);
    if (url.startsWith('/collections/')) { ... }
  }
  ```
  **Direct Issue**: When `entry` is for a collection URL, `buildCompetitorSpecTitleAndMeta` receives a single product search query from GSC (e.g., `"japanese wave desk mat"` or `"cyberpunk ronin mouse pad"`), completely replacing the category-level title.
- **Live Storefront Evidence from `gsc_deep_dive_part5_root_causes_verification.mjs`**:
  - `/collections/japanese-anime-desk-mats`: Title is `"Japanese Wave Desk Mat | 900x400x4mm (35.4&quot;x15.7&quot;) Stitched Pad"` (overwritten by single-product keyword + contains double-escaped `&quot;`).
  - `/collections/abstract-minimalist-bauhaus-canvas-wall-art`: Title is `"Minimalist Bauhaus Canvas Print | 1.25&quot; Pine Framed Canvas (CM &amp; I"` (mid-token cut at character 66: ends with dangling `(CM &amp; I`).

### 1.5 `catalog_uniqueness_and_seo_lint_gate.mjs` Code Analysis
- **Lines 48–67**: GraphQL query requests `collections(first: 80)` but omits `productsCount` and publication status. It does not query `pages(first: 50)`.
- **Lines 152–206**: Collection audit checks for `pop-culture-icons`, residual JSON-LD FAQPage blocks, and `STUDIO15`. It **does not check**:
  1. Double-escaped entities: `&quot;`, `&amp;quot;`, `&amp;amp;`, `&#39;`.
  2. Broken template grammar fragments: `"Transform with "`, `"Elevate with "`, `"Style with "`, trailing prepositions.
  3. Truncated titles ending in dangling conjunctions/fragments (`&`, `Mo`, `Si`).
  4. Empty (0-product) collections.
- **Live Evidence**:
  - 26 collections in Shopify Admin currently have broken template grammar (`"Transform with Canvas Wall Art..."`, `"Elevate with Cushion Covers..."`, `"Style with Plush Throw Blankets..."`).
  - Article `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` live title ends in `"Extended Mo"`.
  - Storefront contains 28 discontinued 0-product collections returning 404 (`dog-collars`, `laundry-bags`, etc.).

### 1.6 `verify_40_subcollections_counts.mjs` Code Analysis
- **Lines 5–28**: Only reads `phase2_40_subcollections.json` (48 items). It currently verifies that these 48 smart subcollections have products (all 48 currently pass with >0 products).
- **Direct Issue**: It does not audit all 100 Shopify collections, does not check publication status, does not check presence in `sitemap_collections_1.xml`, and does not validate `seo.title` length or unescaped `seo.description`.

---

## 2. Logic Chain

1. **Sitemap PUT Reset Chain**:
   - `gsc_ga4_gmc_cloud_sync.mjs` lines 170–176 loops through all `desiredSet` and calls `PUT` every day.
   - When Google Search Console receives a `PUT` for an already-submitted sitemap, its internal crawler treats the submission as new, updating `LastSubmitted` to today and discarding historical crawl cadence.
   - Therefore, by checking `GET /sitemaps` response first (`listJson.sitemap`) and only calling `PUT` if `!existingMap.has(smUrl) || existingMap.get(smUrl).errors > 0`, we preserve `LastSubmitted` and crawl history while still recovering from sitemap errors.

2. **Title Truncation & Overwrite Chain**:
   - In `strikezone_ctr_and_competitor_rewriter.mjs`, `.slice(0, 66)` cuts strings strictly at character 66 regardless of word boundaries.
   - Because `(CM & Inch)` occurs near character 60, `.slice(0, 66)` leaves `(CM & I`.
   - In addition, Google search result snippets truncate titles at approximately 580–600 pixels (roughly 60 characters). A title of 66 characters is truncated by Google in the SERP anyway.
   - When `entry.keyword` is a singular product term (e.g., `"japanese wave desk mat"`), applying it to `/collections/*` degrades the collection's ability to rank for high-volume plural category queries (`"japanese anime desk mats"`).
   - Therefore, replacing `.slice(0, 66)` with a word-boundary-safe `fitTitleUnder60Chars()` function, and guarding collections by anchoring them on category-level plural themes, eliminates both mid-word truncations and title degradation.

3. **SEO Lint & Verification Gate Chain**:
   - In Shopify Liquid, `{{ page_description | escape }}` automatically escapes special characters. If `seo.description` in Shopify Admin contains literal `&quot;` or `&amp;quot;`, Liquid produces double-escaped `&amp;quot;` in the rendered HTML `<meta name="description">`.
   - Furthermore, template generators that output `"Transform with <Title>"` without checking noun compatibility produce ungrammatical meta descriptions.
   - By updating `catalog_uniqueness_and_seo_lint_gate.mjs` to sanitize entities, strip template fragments, flag truncated titles, and flag 0-product collections, and by upgrading `verify_40_subcollections_counts.mjs` to audit all collections storewide, any future regressions are caught automatically in CI/CD before being deployed.

---

## 3. Caveats

1. **Search Console URL Inspection Quota**: The GSC URL Inspection API has a quota of 2,000 queries per day and 600 queries per minute per project. Inspecting 15 rotating URLs per run with a 250ms inter-request delay consumes less than 1% of the daily quota.
2. **Shopify Collection Deletion**: When deleting legacy 0-product collections via `collectionDelete`, Shopify requires that `frontpage` never be deleted. `frontpage` must be explicitly excluded from deletion loops.
3. **Local Credential Safety**: `.shopify_token.json` and `.gcp_service_account.json` are local-only files ignored by `.gitignore`. In GitHub Actions, credentials are supplied via GitHub Secrets (`SHOPIFY_ADMIN_ACCESS_TOKEN`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`).

---

## 4. Conclusion & Concrete Implementation Specifications

### 4.1 Specification for `gsc_ga4_gmc_cloud_sync.mjs` (R5)

#### Change 1: Sitemaps PUT Idempotency & Error-Only Submission
Replace lines 154–176 with:
```javascript
// Fetch existing registered sitemaps in GSC
const listRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
  headers: { Authorization: `Bearer ${token}` }
});

const existingSitemapMap = new Map();
if (listRes.ok) {
  const listJson = await listRes.json();
  for (const sm of (listJson.sitemap || [])) {
    if (sm.path) {
      existingSitemapMap.set(sm.path, sm);
      // Delete sitemaps registered in GSC that are no longer part of our desired set
      if (!desiredSet.has(sm.path)) {
        const delRes = await fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm.path)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (delRes.ok) staleSitemapsDeleted++;
      }
    }
  }
}

// Only PUT sitemaps that are either missing from GSC or currently report errors
let sitemapsPreserved = 0;
for (const smUrl of desiredSet) {
  const existing = existingSitemapMap.get(smUrl);
  const hasErrors = existing && (Number(existing.errors || 0) > 0);
  const isMissing = !existing;

  if (isMissing || hasErrors) {
    const putRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(smUrl)}`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
    );
    if (putRes.ok) sitemapsSynced++;
    console.log(`[gsc_ga4_gmc_cloud_sync] Sitemap submitted (${isMissing ? 'NEW' : 'RECOVERING ERRORS'}): ${smUrl}`);
  } else {
    sitemapsPreserved++;
    console.log(`[gsc_ga4_gmc_cloud_sync] Sitemap already active and healthy in GSC (preserving LastSubmitted): ${smUrl}`);
  }
}
```

#### Change 2: Rotating URL Inspection Health Tracking
Add inspection logic for a rotating batch of 15 priority URLs per run:
```javascript
// 4. Rotating GSC URL Inspection Health Tracking (15 priority URLs per run)
try {
  const PRIORITY_URL_POOL = [
    'https://printswithpassion.com/',
    'https://printswithpassion.com/collections/canvas-prints',
    'https://printswithpassion.com/collections/desk-mats',
    'https://printswithpassion.com/collections/pillow-cases',
    'https://printswithpassion.com/collections/blankets',
    'https://printswithpassion.com/collections/bath-mats',
    'https://printswithpassion.com/collections/apparel',
    'https://printswithpassion.com/collections/nature-mountain-landscape-canvas-wall-art',
    'https://printswithpassion.com/collections/japanese-anime-desk-mats',
    'https://printswithpassion.com/collections/abstract-minimalist-bauhaus-canvas-wall-art',
    'https://printswithpassion.com/collections/space-galaxy-nebula-desk-mats',
    'https://printswithpassion.com/collections/botanical-floral-garden-cushion-covers',
    'https://printswithpassion.com/collections/nature-mountain-cabin-throw-blankets',
    'https://printswithpassion.com/collections/coastal-ocean-botanical-bath-mats',
    'https://printswithpassion.com/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared',
    'https://printswithpassion.com/blogs/news/how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed',
    'https://printswithpassion.com/pages/xxl-extended-gaming-desk-mats-uk-guide'
  ];

  snapshot.urlInspectionHealth = snapshot.urlInspectionHealth || {
    nextCursor: 0,
    totalIndexed: 0,
    totalDiscoveredNotIndexed: 0,
    inspections: []
  };

  const cursor = snapshot.urlInspectionHealth.nextCursor || 0;
  const batchSize = 15;
  const urlsToInspect = [];
  for (let i = 0; i < batchSize; i++) {
    urlsToInspect.push(PRIORITY_URL_POOL[(cursor + i) % PRIORITY_URL_POOL.length]);
  }
  snapshot.urlInspectionHealth.nextCursor = (cursor + batchSize) % PRIORITY_URL_POOL.length;

  let submittedAndIndexedCount = 0;
  let discoveredNotIndexedCount = 0;
  let otherCount = 0;
  const batchResults = [];

  for (const inspectionUrl of urlsToInspect) {
    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl, siteUrl })
    });
    if (res.ok) {
      const data = await res.json();
      const idx = data.inspectionResult?.indexStatusResult || {};
      const cov = idx.coverageState || 'UNKNOWN';
      if (cov.toLowerCase().includes('submitted and indexed')) submittedAndIndexedCount++;
      else if (cov.toLowerCase().includes('discovered')) discoveredNotIndexedCount++;
      else otherCount++;

      const info = {
        url: inspectionUrl,
        verdict: idx.verdict || 'UNKNOWN',
        coverageState: cov,
        lastCrawlTime: idx.lastCrawlTime || null,
        googleCanonical: idx.googleCanonical || null,
        userCanonical: idx.userCanonical || null
      };
      batchResults.push(info);

      const uPath = new URL(inspectionUrl).pathname;
      if (snapshot.byUrl && snapshot.byUrl[uPath]) {
        snapshot.byUrl[uPath].gscCoverageState = cov;
        snapshot.byUrl[uPath].gscVerdict = idx.verdict || 'UNKNOWN';
      }
    }
    await new Promise(r => setTimeout(r, 200)); // Quota rate pacing
  }

  snapshot.urlInspectionHealth.lastRun = new Date().toISOString();
  snapshot.urlInspectionHealth.inspectedInBatch = batchResults.length;
  snapshot.urlInspectionHealth.submittedAndIndexed = submittedAndIndexedCount;
  snapshot.urlInspectionHealth.discoveredNotIndexed = discoveredNotIndexedCount;
  snapshot.urlInspectionHealth.indexedRatio = Number((submittedAndIndexedCount / Math.max(1, batchResults.length)).toFixed(3));
  snapshot.urlInspectionHealth.recentBatch = batchResults;
  console.log(`[gsc_ga4_gmc_cloud_sync] URL Inspection Batch (${batchResults.length} URLs): ${submittedAndIndexedCount} Indexed | ${discoveredNotIndexedCount} Discovered | Ratio: ${snapshot.urlInspectionHealth.indexedRatio}`);
} catch (err) {
  console.warn(`[gsc_ga4_gmc_cloud_sync] URL Inspection warning: ${err.message}`);
}
```

---

### 4.2 Specification for `strikezone_ctr_and_competitor_rewriter.mjs` (R5)

#### Change 1: Word-Boundary Safe Title Truncator (`<= 60` Chars)
Implement a dedicated helper that guarantees no mid-word cuts and strictly `<= 60` chars:
```javascript
export function fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60) {
  const cleanPrimary = String(primaryPart || '').trim().replace(/[\s|,\-–—&]+$/, '');

  // 1. Try primaryPart + specCandidate in descending length order
  for (const spec of specCandidates) {
    const candidate = `${cleanPrimary} | ${spec}`.trim();
    if (candidate.length <= maxChars) {
      return candidate;
    }
  }

  // 2. If cleanPrimary alone fits, return it
  if (cleanPrimary.length <= maxChars) {
    return cleanPrimary;
  }

  // 3. Shorten cleanPrimary at word boundary
  const words = cleanPrimary.split(/\s+/);
  let truncated = '';
  for (const w of words) {
    const test = truncated ? `${truncated} ${w}` : w;
    if (test.length > maxChars) break;
    truncated = test;
  }

  truncated = (truncated || cleanPrimary.slice(0, maxChars))
    .replace(/[\s|,\-–—&]+$/, '')
    .trim();

  // Close unclosed parentheses or strip them
  const openParen = (truncated.match(/\(/g) || []).length;
  const closeParen = (truncated.match(/\)/g) || []).length;
  if (openParen > closeParen) {
    if (truncated.length + 1 <= maxChars) truncated += ')';
    else truncated = truncated.replace(/\s*\([^\)]*$/, '').trim();
  }

  return truncated;
}
```

#### Change 2: Collection vs Product Intent Guard
In `buildCompetitorSpecTitleAndMeta`:
```javascript
function buildCompetitorSpecTitleAndMeta(entry, existingTitle = '', isCollection = false) {
  const kw = entry.keyword || entry.primaryKeyword || '';
  const sub = entry.substrate || 'Desk Mats';

  // Collection Guard: Never overwrite a collection title with a single-product keyword!
  let titleCasedKw = '';
  if (isCollection) {
    // If it's a collection, prioritize the collection's theme + plural category noun
    const baseColTitle = existingTitle || 'Studio Collection';
    const isPluralCategory = /\b(desk mats|canvas wall art|cushion covers|throw blankets|bath mats|hoodies|t-shirts|apparel)\b/i.test(kw);
    if (isPluralCategory) {
      titleCasedKw = kw.split(/\s+/).map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
    } else {
      // Use clean existing collection category title
      titleCasedKw = baseColTitle.split('|')[0].trim();
    }
  } else {
    titleCasedKw = (kw || 'Studio Edition')
      .split(/\s+/)
      .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ');
  }

  if (sub === 'Canvas Wall Art') {
    const newTitle = fitTitleUnder60Chars(titleCasedKw, [
      '1.25" Pine Framed Canvas',
      'Framed Canvas Art',
      'Canvas Wall Art',
      'Wall Art'
    ], 60);
    const newMeta = `${titleCasedKw} printed on 400gsm matte cotton-poly canvas over 1.25" (32mm) kiln-dried pine stretcher bars with free tracked UK delivery.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  if (sub === 'Desk Mats') {
    const newTitle = fitTitleUnder60Chars(titleCasedKw, [
      '900x400x4mm Stitched Pad',
      '4mm XXL Stitched Pad',
      '4mm Stitched Pad',
      'XXL Desk Mat'
    ], 60);
    const newMeta = `${titleCasedKw} engineered with a 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth in 90x40cm XXL size.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  const newTitle = fitTitleUnder60Chars(titleCasedKw, [
    'Dual CM & Inch Sizing',
    'Studio Sizing Guide',
    'Studio Guide'
  ], 60);
  const newMeta = `Compare exact Metric (cm/mm) and Imperial (inch) dimensions for ${titleCasedKw}. Includes furniture formulas & material specs with free UK delivery.`.slice(0, 158);
  return { newTitle, newMeta };
}
```

---

### 4.3 Specification for `catalog_uniqueness_and_seo_lint_gate.mjs` (R5)

Add lint checks and auto-sanitization for:
1. **Double-escaped HTML entities**:
   `&quot;` -> `"`
   `&amp;quot;` -> `"`
   `&amp;amp;` -> `&`
   `&#39;` / `&amp;#39;` -> `'`
   `&amp;` -> `&`
2. **Broken template grammar fragments**:
   Match: `/\b(?:Transform|Elevate|Style|Explore|Refresh)\s+with\b/i` and replace with complete sentences.
3. **Truncated title endings**:
   Match: `/(?:[–—\-|,]\s*$|\b(?:&|&amp;|Mo|Si|and|with|the|in|for|of|vs)\s*$|\.\.\.\s*$|\([^\)]*$)/i` and length `> 60`.
4. **Empty collections gate**:
   Query all collections with `productsCount { count }`. If `productsCount.count === 0 && handle !== 'frontpage'`, flag as violation and auto-clean or delete.

---

### 4.4 Specification for `verify_40_subcollections_counts.mjs` (R5)

Upgrade script from 33 lines to a comprehensive storewide collection gate:
1. Verify all 48 smart subcollections have `productsCount > 0`.
2. Query all collections in Shopify Admin:
   - Verify `0` empty collections exist (excluding `frontpage`).
   - Verify every active collection has `seo.title` (`<= 60` chars, no mid-word cut, no dangling conjunctions).
   - Verify every active collection has `seo.description` (`140–158` chars, plain text, `0` `&quot;` or `&amp;quot;` entities).
   - Verify all active collections appear in live `sitemap_collections_1.xml`.
   - Exit with code `1` if violations are found, preventing broken metadata from entering production.

---

### 4.5 Specification for Verification, Deployment & GitHub Actions Sync (R6)

1. **Pre-Deployment Local Verification**:
   - Run `node catalog_uniqueness_and_seo_lint_gate.mjs`
   - Run `node verify_40_subcollections_counts.mjs`
   - Run `node gsc_deep_dive_part5_root_causes_verification.mjs`
2. **Git Commit & Push**:
   - Commit all updated scripts to `main` of `https://github.com/BenCook1996/prints-with-passion-automations`.
3. **Trigger Cloud Execution**:
   - Run `gh workflow run pwp-daily-technical-seo.yml`
   - Monitor via `gh run list --workflow=pwp-daily-technical-seo.yml`
   - Verify `conclusion: success`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Test Sitemap Submission & Inspection Locally**:
   ```powershell
   cd C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
   node gsc_ga4_gmc_cloud_sync.mjs
   ```
   *Expected Output*: `Sitemap already active and healthy in GSC (preserving LastSubmitted)` for all 8 existing child sitemaps, followed by `URL Inspection Batch (15 URLs): ... Indexed | ... Discovered`.

2. **Test Title Truncator & Collection Protection**:
   ```powershell
   node -e "import('./strikezone_ctr_and_competitor_rewriter.mjs').then(m => { console.log(m.fitTitleUnder60Chars('Minimalist Bauhaus Canvas Print', ['1.25\" Pine Framed Canvas (CM & Inch)', 'Framed Canvas Art'], 60)); })"
   ```
   *Expected Output*: A clean, complete title strictly `<= 60` characters with zero mid-word or dangling punctuation artifacts.

3. **Test Storewide Collection Lint Gate**:
   ```powershell
   node catalog_uniqueness_and_seo_lint_gate.mjs
   node verify_40_subcollections_counts.mjs
   ```
   *Expected Output*: `0` empty collections, `0` double-escaped `&quot;` entities, `0` truncated titles, and exit code `0`.

4. **Verify GitHub Actions Cloud Run**:
   ```powershell
   gh workflow run pwp-daily-technical-seo.yml
   gh run watch
   ```
   *Expected Output*: Workflow `pwp-daily-technical-seo.yml` completes with `status: completed` and `conclusion: success`.
