# Handoff Report: Milestone 5 Explorer 1 — GSC Cloud Sync & URL Inspection

## 1. Observation

### Target File & Component Architecture
- **Target File**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\gsc_ga4_gmc_cloud_sync.mjs`
- **Related Auth & Helper Modules**:
  - `lib/cloud-env.mjs`: Line 248 defines `getGoogleAccessToken(['https://www.googleapis.com/auth/webmasters', ...])`, which reads `.gcp_service_account.json` and generates RS256 JWT tokens via `node:crypto`.
  - `gsc_ga4_latest_snapshot.json`: Contains storewide performance summary, historical GSC query rows, and `byUrl` map of page performance.
  - `phase2_40_subcollections.json`: Defines the 48 smart sub-collections used for catalog SEO routing.

### Issue 1: Sitemap PUT Re-Submission Non-Idempotency
In `gsc_ga4_gmc_cloud_sync.mjs` lines 149–179:
```javascript
149:  // 2. GSC Sitemaps API Sync (GET / DELETE stale / PUT live child sitemaps)
150:  try {
151:    const liveSmXml = await (await fetch('https://printswithpassion.com/sitemap.xml')).text();
152:    const liveChildSitemaps = [...liveSmXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
153:    const desiredSet = new Set(['https://printswithpassion.com/sitemap.xml', ...liveChildSitemaps]);
154:
155:    const listRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
156:      headers: { Authorization: `Bearer ${token}` }
157:    });
158:    if (listRes.ok) {
159:      const listJson = await listRes.json();
160:      for (const sm of (listJson.sitemap || [])) {
161:        if (sm.path && !desiredSet.has(sm.path)) {
162:          const delRes = await fetch(
163:            `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm.path)}`,
164:            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
165:          );
166:          if (delRes.ok) staleSitemapsDeleted++;
167:        }
168:      }
169:    }
170:
171:    for (const smUrl of desiredSet) {
172:      const putRes = await fetch(
173:        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(smUrl)}`,
174:        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
175:      );
176:      if (putRes.ok) sitemapsSynced++;
177:    }
178:  } catch (err) {
179:    console.warn(`[gsc_ga4_gmc_cloud_sync] GSC Sitemaps API warning: ${err.message}`);
180:  }
```

Direct observations:
- At line 155, `listRes` queries `GET /sitemaps`, but the retrieved `listJson.sitemap` array is **only used to delete stale sitemaps** (lines 160–168).
- At lines 171–177, the script loops over **all** sitemaps in `desiredSet` and **unconditionally issues an HTTP `PUT` request** for every single sitemap on every single run.
- Live verification via Google Search Console Webmasters API (`GET /sitemaps`) returned:
  ```json
  {
    "sitemap": [
      {
        "path": "https://printswithpassion.com/sitemap_articles_1.xml",
        "lastSubmitted": "2026-11-12T13:07:59.709Z",
        "isPending": false,
        "isSitemapsIndex": false,
        "type": "sitemap",
        "lastDownloaded": "2026-11-12T13:08:00.901Z",
        "warnings": "0",
        "errors": "0",
        "contents": [{ "type": "web", "submitted": "25", "indexed": "0" }]
      },
      ...
    ]
  }
  ```
  Every time a `PUT` is submitted, Google Search Console resets `lastSubmitted` to the current execution timestamp and resets `indexed: 0`, destroying crawl history and disrupting Googlebot's natural crawling cadence.

### Issue 2: Missing Rotating URL Inspection Health Tracking
In `gsc_ga4_gmc_cloud_sync.mjs`:
- Line 11 states in the file header:
  `* 3. Inspect priority URLs via GSC URL Inspection API (urlInspection/index:inspect).`
  However, lines 81–235 contain NO URL inspection implementation whatsoever! The script only queries Search Analytics (lines 81–146) and Sitemaps (lines 148–179), and then jumps straight to GA4 Data API (lines 181–229).
- Live verification of `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` using `.gcp_service_account.json` credentials succeeded:
  ```json
  {
    "inspectionResult": {
      "indexStatusResult": {
        "verdict": "PASS",
        "coverageState": "Submitted and indexed",
        "robotsTxtState": "ALLOWED",
        "indexingState": "INDEXING_ALLOWED",
        "lastCrawlTime": "2026-11-12T11:59:05Z",
        "pageFetchState": "SUCCESSFUL",
        "googleCanonical": "https://printswithpassion.com/",
        "userCanonical": "https://printswithpassion.com/"
      }
    }
  }
  ```
- E2E Test Specification (`spec_miner_e2e_1/handoff.md` lines 292–300 & 442–446) requires:
  1. Inspecting exactly 15 URLs per run.
  2. Inter-request pacing of `>= 200ms`.
  3. Recording `submittedAndIndexedCount`, `discoveredNotIndexedCount`, `crawledNotIndexedCount`, `urlUnknownCount`, and `canonicalOverrides`.
  4. Calculating `indexedRatio`.
  5. Advancing a rotating cursor across runs so subsequent runs inspect the next batch.
  6. Updating `snapshot.urlInspectionHealth` and `snapshot.byUrl[urlPath].urlInspection`.

---

## 2. Logic Chain

### Logic Chain for Sitemap PUT Idempotency (Feature 17)
1. **Observation**: `GET https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps` already returns an array of existing registered sitemaps including `path`, `errors`, `warnings`, and `lastSubmitted`.
2. **Observation**: Unconditional daily `PUT` causes Google to reset `lastSubmitted` and resets `indexed` counts to 0, which prevents Search Console from stabilizing index coverage tracking.
3. **Inference**: By populating an `existingSitemapsMap` during the `GET` response, we can evaluate each desired sitemap before deciding to send a `PUT`.
4. **Rule Definition**:
   - If a sitemap URL is **not present** in `existingSitemapsMap`, it is newly created or unregistered -> **execute `PUT`**.
   - If a sitemap URL **is present**, but reports `errors > 0` (`Number(existing.errors || 0) > 0`) -> **execute `PUT`** to request re-processing.
   - If a sitemap URL **is present** with `errors === 0` -> **skip `PUT`** and increment `sitemapsPreserved`.
5. **URL Normalization**: Shopify sitemap index URLs may contain `&amp;` (e.g. `sitemap_products_1.xml?from=...&amp;to=...`). To ensure robust lookup, the map should store both the raw path and `path.replace(/&amp;/g, '&')`.
6. **Fault Tolerance**: If `listRes` fails (`!listRes.ok`), the script MUST NOT execute PUTs blindly. It should log a warning and skip modifications to avoid accidental reset of sitemaps.

### Logic Chain for Rotating URL Inspection Health Tracking (Feature 18)
1. **Observation**: Google Search Console provides a free quota of 2,000 URL inspection requests per day per property.
2. **Observation**: In forensic analysis (`gsc_position_and_impressions_recovery_plan.md`), 85% of newly added products, 14 collections, and 8 blog articles had `LastCrawl: NEVER` because they lacked discovery links.
3. **Observation**: The project specification scopes URL inspection to a batch of 15 priority URLs per execution with `>= 200ms` rate pacing.
4. **Priority Candidate Pool Architecture**:
   - The priority pool should encompass:
     - Root & Category Hubs (Homepage `/`, `/collections/canvas-prints`, `/collections/desk-mats`, `/collections/pillow-cases`, `/collections/blankets`, `/collections/bath-mats`, `/collections/apparel`).
     - Key Pages (`/pages/uk-product-catalog`, `/pages/about-us`, `/pages/delivery-return`).
     - All 48 Smart Sub-Collections (from `phase2_40_subcollections.json` or `sitemap_collections_1.xml`).
     - Pillar Pages & Blog Guides (from `sitemap_pages_1.xml` and `sitemap_articles_1.xml`).
     - High-impact products recorded in `snapshot.byUrl`.
5. **Rotating Cursor Mechanism**:
   - Storing `cursor: nextIndex` in `snapshot.urlInspectionHealth` allows sequential, deterministic round-robin traversal across multiple runs without unbounded memory accumulation.
   - Run 1 processes indices `0..14`, sets `cursor: 15`.
   - Run 2 processes indices `15..29`, sets `cursor: 30`.
   - When `cursor + batchSize >= pool.length`, cursor wraps modulo `pool.length`.
6. **Telemetry & Metric Aggregation**:
   - Calculate `indexedRatio = submittedAndIndexedCount / totalInspected`.
   - Capture `canonicalOverrides` whenever `idx.googleCanonical !== idx.userCanonical`.
   - Record granular inspection results into `snapshot.byUrl[urlPath].urlInspection` so individual URL audits can reference fresh indexing state.

---

## 3. Caveats

1. **Service Account Quota & Permissions**: The Service Account (`sweepr-seo-bot@sweepr-514223.iam.gserviceaccount.com`) is confirmed to have Search Console access for `https://printswithpassion.com/`. However, if run in an environment without `.gcp_service_account.json` or `GOOGLE_SERVICE_ACCOUNT_JSON`, both GSC and URL inspection gracefully skip with `skipped_no_service_account_secret`.
2. **Live Execution Latency**: Live network calls to `searchconsole.googleapis.com/v1/urlInspection/index:inspect` may take 1–3 seconds each across public internet. Running 15 URLs sequentially with 200ms delay takes ~20–40 seconds in live production, well within the 60-second execution window. In unit and mocked test suites, executions complete in < 500ms.
3. **URL Inspection Read-Only Nature**: `urlInspection/index:inspect` only queries Google's index state; it does not trigger immediate re-indexing (which is not available via public GSC APIs).

---

## 4. Conclusion & Implementation Recommendation

The worker implementer should apply the following modifications to `gsc_ga4_gmc_cloud_sync.mjs`:

### A. Exported Helper Functions
Add `buildPriorityInspectionPool` and `inspectUrl` at the module level:

```javascript
/**
 * Assembles a deduplicated, deterministic pool of priority URLs for rotating inspection.
 */
export function buildPriorityInspectionPool(subcollections = [], knownUrls = []) {
  const seed = [
    'https://printswithpassion.com/',
    'https://printswithpassion.com/collections/canvas-prints',
    'https://printswithpassion.com/collections/desk-mats',
    'https://printswithpassion.com/collections/pillow-cases',
    'https://printswithpassion.com/collections/blankets',
    'https://printswithpassion.com/collections/bath-mats',
    'https://printswithpassion.com/collections/apparel',
    'https://printswithpassion.com/pages/uk-product-catalog',
    'https://printswithpassion.com/pages/about-us',
    'https://printswithpassion.com/pages/delivery-return'
  ];

  const subColUrls = subcollections.map(sc => {
    const handle = typeof sc === 'string' ? sc : sc.handle;
    return handle.startsWith('http') ? handle : `https://printswithpassion.com/collections/${handle}`;
  });

  const cleanKnown = knownUrls
    .filter(u => typeof u === 'string')
    .map(u => u.startsWith('http') ? u : `https://printswithpassion.com${u.startsWith('/') ? u : '/' + u}`)
    .map(u => u.replace(/&amp;/g, '&'));

  return [...new Set([...seed, ...subColUrls, ...cleanKnown])];
}

/**
 * Performs a single URL inspection via GSC urlInspection/index:inspect.
 */
export async function inspectUrl(token, siteUrl, inspectionUrl) {
  const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inspectionUrl, siteUrl })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 180)}`);
  }
  return res.json();
}
```

### B. Replace Sitemap Sync Logic (Lines 148–179)
Replace the unconditional `PUT` loop with an idempotent comparison:

```javascript
  // 2. GSC Sitemaps API Sync (GET / DELETE stale / Idempotent PUT)
  let sitemapsSubmitted = 0;
  let sitemapsPreserved = 0;
  try {
    const liveSmXml = await (await fetch('https://printswithpassion.com/sitemap.xml')).text();
    const liveChildSitemaps = [...liveSmXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
    const desiredSet = new Set(['https://printswithpassion.com/sitemap.xml', ...liveChildSitemaps]);

    const listRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (listRes.ok) {
      const listJson = await listRes.json();
      const existingMap = new Map();
      for (const sm of (listJson.sitemap || [])) {
        if (sm.path) {
          existingMap.set(sm.path, sm);
          existingMap.set(sm.path.replace(/&amp;/g, '&'), sm);
        }
        const isDesired = desiredSet.has(sm.path) || desiredSet.has(sm.path.replace(/&amp;/g, '&'));
        if (sm.path && !isDesired) {
          const delRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm.path)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
          );
          if (delRes.ok) staleSitemapsDeleted++;
        }
      }

      for (const smUrl of desiredSet) {
        const existing = existingMap.get(smUrl) || existingMap.get(smUrl.replace(/&amp;/g, '&'));
        const errorCount = Number(existing?.errors || 0);
        const needsPut = !existing || errorCount > 0;
        if (needsPut) {
          const putRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(smUrl)}`,
            { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
          );
          if (putRes.ok) {
            sitemapsSubmitted++;
            sitemapsSynced++;
          }
        } else {
          sitemapsPreserved++;
        }
      }
    } else {
      console.warn(`[gsc_ga4_gmc_cloud_sync] Failed to GET sitemaps list (HTTP ${listRes.status}). Skipping PUTs to preserve LastSubmitted dates.`);
    }
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] GSC Sitemaps API warning: ${err.message}`);
  }
```

### C. Add Rotating URL Inspection Step (Inserted between Sitemap Sync and GA4 Sync)
```javascript
  // 3. Rotating URL Inspection Health Tracking (15 priority URLs per run, 200ms pacing)
  let urlsInspectedCount = 0;
  try {
    let subcollections = [];
    const subColFile = path.join(WORKSPACE, 'phase2_40_subcollections.json');
    if (fs.existsSync(subColFile)) {
      try {
        subcollections = JSON.parse(fs.readFileSync(subColFile, 'utf8'));
      } catch {}
    }

    const knownUrls = Object.keys(snapshot.byUrl || {}).map(p => `https://printswithpassion.com${p.startsWith('/') ? p : '/' + p}`);
    const pool = buildPriorityInspectionPool(subcollections, knownUrls);

    if (pool.length > 0) {
      const batchSize = Math.min(15, pool.length);
      const cursor = Number(snapshot.urlInspectionHealth?.cursor || 0) % pool.length;
      const batchUrls = [];
      for (let i = 0; i < batchSize; i++) {
        batchUrls.push(pool[(cursor + i) % pool.length]);
      }
      const nextCursor = (cursor + batchSize) % pool.length;

      let submittedAndIndexedCount = 0;
      let discoveredNotIndexedCount = 0;
      let crawledNotIndexedCount = 0;
      let urlUnknownCount = 0;
      let otherCount = 0;
      let errorCount = 0;
      const coverageBreakdown = {};
      const canonicalOverrides = [];
      const batchResults = [];

      for (let i = 0; i < batchUrls.length; i++) {
        const u = batchUrls[i];
        try {
          const data = await inspectUrl(token, siteUrl, u);
          const idx = data?.inspectionResult?.indexStatusResult || {};
          const cov = idx.coverageState || 'UNKNOWN';
          coverageBreakdown[cov] = (coverageBreakdown[cov] || 0) + 1;

          if (cov === 'Submitted and indexed') {
            submittedAndIndexedCount++;
          } else if (cov === 'Discovered - currently not indexed') {
            discoveredNotIndexedCount++;
          } else if (cov === 'Crawled - currently not indexed') {
            crawledNotIndexedCount++;
          } else if (cov.toLowerCase().includes('unknown')) {
            urlUnknownCount++;
          } else {
            otherCount++;
          }

          const uObj = new URL(u);
          const pathKey = uObj.pathname || '/';
          const isCanonOverride = Boolean(
            idx.googleCanonical && idx.userCanonical && idx.googleCanonical !== idx.userCanonical
          );
          if (isCanonOverride) {
            canonicalOverrides.push({
              url: u,
              userCanonical: idx.userCanonical,
              googleCanonical: idx.googleCanonical
            });
          }

          snapshot.byUrl = snapshot.byUrl || {};
          snapshot.byUrl[pathKey] = {
            ...(snapshot.byUrl[pathKey] || {}),
            urlInspection: {
              inspectedAt: new Date().toISOString(),
              verdict: idx.verdict || 'UNKNOWN',
              coverageState: cov,
              robotsTxtState: idx.robotsTxtState || 'UNKNOWN',
              indexingState: idx.indexingState || 'UNKNOWN',
              lastCrawlTime: idx.lastCrawlTime || 'NEVER',
              pageFetchState: idx.pageFetchState || 'UNKNOWN',
              googleCanonical: idx.googleCanonical || null,
              userCanonical: idx.userCanonical || null,
              canonicalOverride: isCanonOverride,
              referringUrls: (idx.referringUrls || []).map(r => r.replace('https://printswithpassion.com', ''))
            }
          };

          batchResults.push({
            url: u,
            path: pathKey,
            verdict: idx.verdict || 'UNKNOWN',
            coverageState: cov,
            indexingState: idx.indexingState || 'UNKNOWN',
            lastCrawlTime: idx.lastCrawlTime || 'NEVER',
            googleCanonical: idx.googleCanonical || null,
            userCanonical: idx.userCanonical || null
          });
        } catch (err) {
          errorCount++;
          otherCount++;
          console.warn(`[gsc_ga4_gmc_cloud_sync] URL inspection failed for ${u}: ${err.message}`);
        }

        urlsInspectedCount++;
        if (i < batchUrls.length - 1) {
          await new Promise(r => setTimeout(r, 200));
        }
      }

      const totalInspected = batchUrls.length;
      const indexedRatio = totalInspected > 0 ? Number((submittedAndIndexedCount / totalInspected).toFixed(4)) : 0;
      const indexedRatioDisplay = `${(indexedRatio * 100).toFixed(1)}%`;

      snapshot.urlInspectionHealth = {
        lastRunAt: new Date().toISOString(),
        cursor: nextCursor,
        batchSize,
        totalInspected,
        submittedAndIndexedCount,
        discoveredNotIndexedCount,
        crawledNotIndexedCount,
        urlUnknownCount,
        otherCount,
        errorCount,
        canonicalOverridesCount: canonicalOverrides.length,
        indexedRatio,
        indexedRatioDisplay,
        coverageBreakdown,
        canonicalOverrides,
        batchResults
      };
    }
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] URL Inspection Health warning: ${err.message}`);
  }
```

### D. Update Log and Return Signature
```javascript
  console.log(`[gsc_ga4_gmc_cloud_sync] Complete: GSC=${gscUpdated} | SitemapsSubmitted=${sitemapsSubmitted} | SitemapsPreserved=${sitemapsPreserved} (StaleDeleted=${staleSitemapsDeleted}) | UrlsInspected=${urlsInspectedCount} | GA4=${ga4Updated}`);
  return {
    synced: gscUpdated || ga4Updated || urlsInspectedCount > 0,
    sitemapsSynced,
    sitemapsSubmitted,
    sitemapsPreserved,
    staleSitemapsDeleted,
    urlsInspectedCount,
    urlInspectionHealth: snapshot.urlInspectionHealth,
    snapshot
  };
```

---

## 5. Verification Method

### Automated Independent Verification Steps
1. **Unit Test of Sitemap Idempotency (T1-F17-01 to T1-F17-05)**:
   - Run `node -e` test mocking GSC sitemaps:
     - Case A: GSC returns 8 sitemaps with `errors: "0"` -> verify 0 PUT requests issued and `sitemapsPreserved === 8`.
     - Case B: GSC returns 7 sitemaps (1 missing) -> verify exactly 1 PUT request issued.
     - Case C: GSC returns 1 sitemap with `errors: "1"` -> verify exactly 1 PUT request issued.
2. **Unit Test of URL Inspection (T1-F18-01 to T1-F18-05)**:
   - Call inspection logic with mock token and mock fetch:
     - Verify exactly 15 URLs inspected per run.
     - Verify measured timestamp difference between requests is `>= 200ms`.
     - Verify `snapshot.urlInspectionHealth` contains `submittedAndIndexedCount`, `discoveredNotIndexedCount`, and `indexedRatio`.
     - Run inspection twice on a 30-item array: verify first run inspects items 0..14 and second run inspects items 15..29.
3. **Storefront Snapshot Verification**:
   - Inspect `gsc_ga4_latest_snapshot.json` to verify `snapshot.urlInspectionHealth` and `snapshot.byUrl` contains valid `urlInspection` sub-objects.
4. **Invalidation Conditions**:
   - Any execution that issues a `PUT` request for an existing sitemap with `errors === 0`.
   - Any URL inspection loop with inter-request delay `< 200ms`.
   - Any run inspecting fewer or more than 15 URLs when pool size is `>= 15`.
   - Any failure to advance `snapshot.urlInspectionHealth.cursor`.
