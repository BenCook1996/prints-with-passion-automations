# Investigation & Architecture Report: Network Pacing, Sitemap Partitioning, Entity Masking & Regex Remediation

**Role**: Explorer 3 (`teamwork_explorer`, `explorer_e2e_r2_3`)  
**Track**: Prints With Passion E2E Testing Track — Iteration 2  
**Target Repository**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  
**Date**: 2026-11-14T03:30:00Z  
**Parent Orchestrator ID**: `0b8e665c-4e46-49fc-92ae-e440b283ba00`  
**Investigation Mode**: Read-Only Architecture & Defect Investigation  

---

## Executive Summary

Following the forensic audit integrity rejection of the Iteration 1 E2E test suite, Explorer 3 performed an in-depth empirical investigation of the 4 critical network, parsing, and regex defects identified by Reviewers and Challengers:

1. **Concurrency Pacing Stampede**: In `tests/helpers/shopify_client.mjs`, `enforcePacing` computes delays against a shared timestamp updated only *after* promises resolve, causing concurrent requests to awake in an unthrottled burst (`t = 318ms` for 4 simultaneous calls). In `tests/helpers/storefront_crawler.mjs`, `fetchUrl` has zero rate-limiting pacing, triggering Shopify CDN `HTTP 429 Too Many Requests` during multi-URL crawls (such as `T4-SCEN-03`'s 56 sequential requests).
2. **Shopify Sitemap Partitioning (`HTTP 400`)**: The live Shopify storefront partitions child sitemaps with ID query strings (e.g. `sitemap_collections_1.xml?from=437768978743&to=730430275957` and `sitemap_pages_1.xml?from=131838509367&to=703875252597`). Requesting unpartitioned URLs results in `HTTP 400 Bad Request`. Hardcoded tests (`T1-F06-05`, `T1-F08-01`, `T1-F08-05`, `T3-PAIR-02`, `T4-SCEN-05`) failed in live mode because they did not parse `sitemap.xml` dynamically.
3. **HTML Entity Masking & Recursive Decoding**: In `tests/helpers/storefront_crawler.mjs:extractMetaDescription`, chained replaces execute `.replace(/&amp;/g, '&')` *before* `.replace(/&quot;/g, '"')`. This recursively unescapes double-escaped entities (`&amp;quot;` -> `&quot;` -> `"`), masking template corruption so that `assertNotIncludes(desc, '&amp;quot;')` passed on dirty HTML. Furthermore, callers have no access to the raw attribute content.
4. **Regex Word-Boundary Flaw on Email Typo**: In `T1-F04-01`, `T1-F04-03`, and `T3-PAIR-09`, the regex `/\bprintswithpasssion\b/i` fails against the authoritative typo `printswithpasssionbc@gmail.com` because `n` and `b` are both ASCII word characters (`\w`), preventing the trailing `\b` from matching.

This report establishes the complete evidence chain, provides verified mathematical and regex solutions, and outlines an actionable, drop-in remediation plan for the Worker / Test Writer.

---

## 1. Observation

### 1.1 Concurrency Pacing Defect in `shopify_client.mjs` and Missing Pacing in `storefront_crawler.mjs`

#### Location 1: `tests/helpers/shopify_client.mjs` lines 18–30
```javascript
let lastRequestTime = 0;

/**
 * Enforces rate limiting pacing between consecutive GraphQL requests
 */
async function enforcePacing(pacingMs = 250) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < pacingMs) {
    await new Promise(r => setTimeout(r, pacingMs - elapsed));
  }
  lastRequestTime = Date.now();
}
```

#### Verbatim Empirical Concurrency Test
Running 5 concurrent calls via `Promise.all([1, 2, 3, 4, 5].map(...))` produced:
```json
[
  { "i": 1, "t": 0 },
  { "i": 2, "t": 318 },
  { "i": 3, "t": 318 },
  { "i": 4, "t": 318 },
  { "i": 5, "t": 318 }
]
```
- Request 1 executed immediately at `t = 0ms`.
- Requests 2, 3, 4, and 5 evaluated `elapsed < pacingMs` simultaneously, scheduled identical `setTimeout` timers, and all 4 woke up together at `t = 318ms`, dispatching 4 concurrent requests in a burst.
- `lastRequestTime` was updated only *after* each request woke up, failing to increment sequentially for pending requests.

#### Location 2: `tests/helpers/storefront_crawler.mjs` lines 25–43
```javascript
export async function fetchUrl(url, options = {}) {
  const {
    userAgent = 'desktop_chrome',
    redirect = 'manual',
    timeout = 5000,
    dryRun = false,
    mockResponses = null
  } = options;

  const uaHeader = USER_AGENTS[userAgent] || userAgent;

  // If in dry-run mode, serve from recorded fixtures or mock table
  if (dryRun) {
    return serveDryRunResponse(url, { redirect, mockResponses });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const res = await fetch(url, { ... });
```
- When `dryRun` is false, `fetchUrl` issues an immediate HTTP `fetch` without any queueing, delay, or rate limiting.
- In `tests/suites/tier4_real_world.mjs` (`T4-SCEN-03`, lines 132–144), 28 discontinued collection handles are tested in a loop. For each handle, 2 requests are sent (initial 301 check + target 200 check) = 56 requests fired with 0ms spacing.
- **Verbatim Error in `T4-SCEN-03`**:
  ```
  not ok 3 - [T4-SCEN-03] Googlebot Discontinued URL Prune Simulation
    ---
    operator: equal
    expected: 301
    actual:   429
    message:  "Legacy URL https://printswithpassion.com/collections/rugs must return HTTP 301 redirect to Googlebot"
    ---
  ```
- Shopify CDN / Cloudflare rate limiter flagged the unthrottled burst and returned `HTTP 429 Too Many Requests`.

---

### 1.2 Sitemap Partition Format & HTTP 400 Verification

#### Live Inspection of Root Sitemap `https://printswithpassion.com/sitemap.xml`
Executing an HTTP GET against `https://printswithpassion.com/sitemap.xml` yielded:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_agentic_discovery.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_products_1.xml?from=9677213139255&amp;to=14889862922613</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_products_2.xml?from=14889863020917&amp;to=16026015727989</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_pages_1.xml?from=131838509367&amp;to=703875252597</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&amp;to=730430275957</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_blogs_1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://printswithpassion.com/sitemap_articles_1.xml</loc>
  </sitemap>
</sitemapindex>
```

#### Verbatim Empirical Status Codes
Testing child sitemaps with and without query parameters:
```powershell
collections without params: 400
collections with params:    200
pages without params:        400
pages with params:           200
```
- Direct requests to `https://printswithpassion.com/sitemap_collections_1.xml` or `sitemap_pages_1.xml` fail with `HTTP 400 Bad Request`.
- When fetched with `?from=...&to=...` (with `&amp;` unescaped to `&`), Shopify returns `HTTP 200 OK`.
- Current tests in `tier1_feature_coverage.mjs` (lines 419, 497, 548), `tier3_cross_feature.mjs` (line 78), and `tier4_real_world.mjs` (line 193) hardcode unpartitioned paths (`/sitemap_collections_1.xml`), which always fail on the live storefront.
- In `storefront_crawler.mjs` line 146, `serveDryRunResponse` checks `cleanUrl.endsWith('.xml')`. If query parameters are present in `cleanUrl` (`/sitemap_collections_1.xml?from=...`), `.endsWith('.xml')` returns `false`, causing dry-run execution to fall through to the homepage HTML fixture!

---

### 1.3 Entity Masking in `storefront_crawler.mjs:extractMetaDescription`

#### Location: `tests/helpers/storefront_crawler.mjs` lines 253–266
```javascript
export function extractMetaDescription(html) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (!match) return '';
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
```

#### Verbatim Live Homepage Meta Description
Direct HTTP extraction of the live meta description tag from `https://printswithpassion.com/`:
```
Verbatim raw attribute content: Shop archival framed canvas wall art (1.25&quot; pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets &amp; memory foam bath mats.
```
- In HTML attribute syntax `content="..."`, double quotes inside the value are correctly single-escaped as `&quot;`, and ampersands as `&amp;`.
- In `extractMetaDescription`:
  1. `.replace(/&amp;/g, '&')` runs first.
  2. If the HTML contains double-escaped `&amp;quot;`, it is converted to `&quot;`.
  3. `.replace(/&quot;/g, '"')` runs next.
  4. The newly converted `&quot;` is converted to `"`.
- **Result**: `&amp;quot;` was converted into `"` through recursive double-decoding.
- In `tests/suites/tier1_feature_coverage.mjs` lines 92–98 (`T1-F01-04`):
  ```javascript
  const desc = extractMetaDescription(res.body);
  assertNotIncludes(desc, '&quot;', 'Description must not contain raw HTML entities like &quot;');
  assertNotIncludes(desc, '&amp;quot;', 'Description must not contain double-escaped &amp;quot;');
  ```
  Because `desc` has already been decoded to ASCII quotes, it never contains `&quot;` or `&amp;quot;`. Injecting double-escaped corruption `Shop &amp;quot;broken&quot;` still resulted in a passing test.

---

### 1.4 Regex Word-Boundary Flaw on Email Typo

#### Locations:
- `tests/suites/tier1_feature_coverage.mjs` line 255 (`T1-F04-01`): `assertNotRegex(res.body, /\bprintswithpasssion\b/i)`
- `tests/suites/tier1_feature_coverage.mjs` line 275 (`T1-F04-03`): `assertNotRegex(res.body, /\bprintswithpasssion\b/i)`
- `tests/suites/tier3_cross_feature.mjs` line 259 (`T3-PAIR-09`): `assertNotRegex(res.body, /\bprintswithpasssion\b/i)`

#### Verbatim Specification in `ORIGINAL_REQUEST.md` Line 22:
```
fix the contact email typo (printswithpasssionbc@gmail.com -> printswithpassionbc@gmail.com)
```

#### Empirical Execution:
```javascript
const regex = /\bprintswithpasssion\b/i;
const typoEmail = 'printswithpasssionbc@gmail.com';
console.log(regex.test(typoEmail)); // false
```
- In `printswithpasssionbc`, the letter `n` is followed by `b`. Both are `\w` (word) characters.
- In regular expressions, `\b` asserts a transition between `\w` and `\W` (or start/end of string). Because there is no word boundary between `n` and `b`, the trailing `\b` fails.
- If the exact typo `printswithpasssionbc@gmail.com` appears in the live storefront HTML or fixture, the test passes with zero failures.

---

## 2. Logic Chain

1. **Concurrency Pacing Logic**:
   - In `shopify_client.mjs`, `lastRequestTime` represents the time when the last request completed its pacing sleep.
   - When requests $R_1, R_2, \dots, R_k$ enter `enforcePacing` concurrently at time $t_0$, each computes $\Delta t = t_0 - \text{lastRequestTime}$. All $k$ requests compute the same elapsed time and schedule identical timeouts $t_0 + (\text{pacingMs} - \Delta t)$.
   - When that timeout elapses, all $k$ requests wake up simultaneously and execute concurrently.
   - To achieve strict serial spacing $\Delta t \ge \text{pacingMs}$, each caller must be enqueued onto a sequential Promise chain (ticket lock) where `nextAvailableTime` is reserved *at queue insertion time* rather than after resolution.
   - For `storefront_crawler.mjs`, Shopify CDN enforces rate limiting on unauthenticated storefront GET requests. Firing 56 requests in an unthrottled loop (as in `T4-SCEN-03`) exhausts CDN token buckets and triggers HTTP 429. Therefore, `storefront_crawler.mjs` must also enforce serialized pacing for live network requests and implement automated backoff retry on HTTP 429.

2. **Sitemap Dynamic Indexing Logic**:
   - Observation 1.2 proves that Shopify does not serve unpartitioned sitemaps for collections and pages when the shop catalog exceeds shard limits; it returns HTTP 400 Bad Request.
   - The shard boundary parameters (`?from=437768978743&to=730430275957`) are dynamically assigned by Shopify based on internal entity IDs.
   - Hardcoding shard IDs in test cases creates brittle tests that break whenever Shopify re-indexes or collections change.
   - Therefore, `storefront_crawler.mjs` must dynamically inspect `/sitemap.xml`, extract all child sitemap `<loc>` entries, decode XML `&amp;` entities to `&`, and cache this index.
   - When a test requests `sitemap_collections_1.xml` or `sitemap_pages_1.xml`, `storefront_crawler.mjs` must resolve the bare filename to the full partitioned URL.
   - Simultaneously, `serveDryRunResponse` must strip query strings when matching `.xml` extensions so dry-run tests also work with partitioned URLs.

3. **Entity Masking & Single-Pass Decoding Logic**:
   - In HTML, attributes can contain encoded entities (`&quot;`, `&amp;`).
   - If an entity replacer replaces `&amp;` with `&` prior to replacing `&quot;`, the substring `&amp;quot;` becomes `&quot;`, which is then captured by the subsequent replace and becomes `"`. This is recursive decoding.
   - A standard, mathematically sound entity decoder must perform a single pass using a unified regex:
     `/&(?:quot|#39|apos|lt|gt|amp);/gi`
     In a single pass, `&amp;quot;` has its leading `&amp;` replaced with `&`, leaving literal string `&quot;`.
   - Furthermore, tests evaluating HTML compliance must inspect the raw HTML attribute string (`{ raw: true }`), allowing assertions to verify that double-escaped entities (`&amp;quot;`, `&amp;amp;`) do not exist in the source markup.

4. **Regex Word-Boundary Logic**:
   - The authoritative typo is `printswithpasssionbc@gmail.com`.
   - The test author placed `\b` at both ends of `printswithpasssion`.
   - Since `passsion` is followed by `bc`, the sequence `n` $\to$ `b` is `\w\w`, which is not a boundary.
   - The correct regex must either:
     - Include the optional/mandatory `bc` suffix before the boundary: `/\bprintswithpasssion(?:bc)?\b/i`, or
     - Remove the trailing boundary: `/\bprintswithpasssion/i`, or
     - Target any occurrence of 3 or more `s`'s: `/\bprintswithpas{3,}ion/i`.
   - Any of these correctly matches `printswithpasssionbc@gmail.com` and fails when the typo is present.

---

## 3. Caveats

- **Network Jitter & CI Execution Time**: Serializing all storefront crawler requests at 150ms–250ms spacing in live mode will increase total execution time for multi-URL tests (e.g. 56 requests in `T4-SCEN-03` will take $\sim 8.4\text{s}$). This is necessary and desirable to avoid HTTP 429 bans from Shopify's CDN. In `--dry-run` mode, pacing is 0ms and execution remains sub-second.
- **Shopify Dynamic Sharding**: While `printswithpassion.com` currently has one collections sitemap (`sitemap_collections_1.xml`), large stores may have multiple partitions (`_2.xml`, `_3.xml`). The dynamic index parser resolves all child partitions seamlessly.
- **Read-Only Protocol**: Per explorer archetype guidelines, no source code in `tests/` or the root codebase was modified during this investigation. All verified solutions are documented as drop-in implementations for the Worker / Test Writer.

---

## 4. Conclusion & Actionable Remediation Plan

### Remediation Blueprint for Worker / Test Writer

#### Component 1: Concurrency Pacing in `tests/helpers/shopify_client.mjs`

**File**: `tests/helpers/shopify_client.mjs` (replace lines 18–30)

```javascript
// BEFORE (Buggy: simultaneous wakeups under concurrency)
let lastRequestTime = 0;

async function enforcePacing(pacingMs = 250) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < pacingMs) {
    await new Promise(r => setTimeout(r, pacingMs - elapsed));
  }
  lastRequestTime = Date.now();
}

// AFTER (Fixed: strict queue-serialized ticket lock)
let nextAvailableSlot = 0;
let pacingQueue = Promise.resolve();

export async function enforcePacing(pacingMs = 250) {
  if (pacingMs <= 0) return;
  const prevSlot = pacingQueue;
  let release;
  pacingQueue = new Promise(resolve => { release = resolve; });

  await prevSlot;

  try {
    const now = Date.now();
    const waitTime = Math.max(0, nextAvailableSlot - now);
    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime));
    }
    nextAvailableSlot = Date.now() + pacingMs;
  } finally {
    release();
  }
}
```

---

#### Component 2: Storefront Crawler Pacing & Dynamic Sitemap Partitioning in `tests/helpers/storefront_crawler.mjs`

**File**: `tests/helpers/storefront_crawler.mjs`

##### A. Add Serialized Storefront Pacing & HTTP 429 Retry
Add queue pacing helper and integrate into `fetchUrl`:

```javascript
let storefrontNextSlot = 0;
let storefrontQueue = Promise.resolve();

async function enforceStorefrontPacing(pacingMs = 150) {
  if (pacingMs <= 0) return;
  const prevSlot = storefrontQueue;
  let release;
  storefrontQueue = new Promise(resolve => { release = resolve; });

  await prevSlot;

  try {
    const now = Date.now();
    const waitTime = Math.max(0, storefrontNextSlot - now);
    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime));
    }
    storefrontNextSlot = Date.now() + pacingMs;
  } finally {
    release();
  }
}
```

##### B. Add Dynamic Sitemap Index Resolution
Add functions to dynamically discover partitioned sitemaps from `/sitemap.xml`:

```javascript
let sitemapIndexCache = null;
let sitemapCacheTime = 0;

/**
 * Dynamically queries sitemap.xml to extract all child sitemap <loc> URLs
 * with XML &amp; unescaped to &.
 */
export async function getSitemapIndex(baseUrl = 'https://printswithpassion.com', options = {}) {
  const rootUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
  const res = await fetchUrl(rootUrl, { ...options, _skipSitemapResolve: true });
  if (res.status !== 200) {
    throw new Error(`Failed to fetch sitemap index from ${rootUrl}: HTTP ${res.status}`);
  }
  const matches = [...res.body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
  return matches.map(m => m[1].replace(/&amp;/g, '&').trim());
}

/**
 * Resolves a bare child sitemap filename to its live partitioned URL with query params
 */
export async function resolveChildSitemapUrl(urlOrPattern, options = {}) {
  if (options.dryRun || urlOrPattern.includes('?')) return urlOrPattern;

  const matchChild = urlOrPattern.match(/(sitemap_[a-z]+_\d+\.xml)/i);
  if (!matchChild) return urlOrPattern;

  const childFilename = matchChild[1];
  const now = Date.now();
  if (!sitemapIndexCache || (now - sitemapCacheTime > 60000)) {
    try {
      sitemapIndexCache = await getSitemapIndex('https://printswithpassion.com', options);
      sitemapCacheTime = now;
    } catch {
      return urlOrPattern;
    }
  }

  const found = sitemapIndexCache.find(loc => loc.includes(childFilename));
  return found || urlOrPattern;
}
```

##### C. Update `fetchUrl` to Pacing, Sitemap Rewrite, and 429 Retry
In `fetchUrl`:

```javascript
export async function fetchUrl(url, options = {}) {
  const {
    userAgent = 'desktop_chrome',
    redirect = 'manual',
    timeout = 5000,
    dryRun = false,
    mockResponses = null,
    pacingMs = 150,
    maxRetries = 2,
    _retryCount = 0,
    _skipSitemapResolve = false
  } = options;

  // If live and fetching a child sitemap, dynamically resolve partition query parameters
  let targetUrl = url;
  if (!dryRun && !_skipSitemapResolve) {
    targetUrl = await resolveChildSitemapUrl(url, options);
  }

  if (dryRun) {
    return serveDryRunResponse(targetUrl, { redirect, mockResponses });
  }

  // Enforce queue pacing for live HTTP requests
  await enforceStorefrontPacing(pacingMs);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENTS[userAgent] || userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect,
      signal: controller.signal
    });

    const latencyMs = Date.now() - startTime;
    clearTimeout(timer);

    // Auto-retry on HTTP 429 with backoff
    if (res.status === 429 && _retryCount < maxRetries) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
      await new Promise(r => setTimeout(r, Math.max(1000, retryAfter * 1000)));
      return fetchUrl(targetUrl, { ...options, _retryCount: _retryCount + 1 });
    }

    const location = res.headers.get('location') || '';
    let body = '';
    if (res.status === 200 || res.status === 404) {
      body = await res.text();
    }

    return {
      url: targetUrl,
      status: res.status,
      statusText: res.statusText,
      location,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      latencyMs
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${targetUrl} timed out after ${timeout}ms`);
    }
    throw err;
  }
}
```

##### D. Fix Dry-Run Sitemap Routing in `serveDryRunResponse`
In `serveDryRunResponse` (lines 146–160):

```javascript
  // Fix: strip query params when checking for .xml fixtures
  const cleanPath = cleanUrl.split('?')[0];
  if (cleanPath.endsWith('.xml')) {
    const sitemapFixture = path.join(FIXTURES_DIR, 'sitemaps_sample.xml');
    if (fs.existsSync(sitemapFixture)) {
      return {
        url,
        status: 200,
        statusText: 'OK',
        location: '',
        headers: { 'content-type': 'application/xml; charset=utf-8' },
        body: fs.readFileSync(sitemapFixture, 'utf8'),
        latencyMs: 8
      };
    }
  }
```

---

#### Component 3: Entity Masking & Raw Attribute Access in `tests/helpers/storefront_crawler.mjs`

**File**: `tests/helpers/storefront_crawler.mjs` (replace lines 236–266)

```javascript
const HTML_ENTITY_MAP = {
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&'
};

/**
 * Single-pass HTML entity decoder preventing recursive double-unescaping
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str.replace(/&(?:quot|#39|apos|lt|gt|amp);/gi, match => {
    return HTML_ENTITY_MAP[match.toLowerCase()] || match;
  });
}

/**
 * Extracts raw, verbatim meta description content attribute without decoding
 */
export function extractRawMetaDescription(html) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  return match ? match[1].trim() : '';
}

/**
 * Extracts and decodes the meta description content from raw HTML.
 * When options.raw === true, returns unescaped raw attribute content.
 */
export function extractMetaDescription(html, options = {}) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (!match) return '';
  if (options.raw) {
    return match[1].trim();
  }
  return decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts and decodes the <title> tag text from raw HTML using single-pass decoding
 */
export function extractTitle(html, options = {}) {
  if (!html) return '';
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  if (options.raw) {
    return match[1].trim();
  }
  return decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim();
}
```

##### Update Assertion in `tests/suites/tier1_feature_coverage.mjs` (`T1-F01-04`)
Update lines 92–98:

```javascript
  {
    id: 'T1-F01-04',
    name: 'Homepage Meta Description Plain Text',
    tier: 1,
    feature: 1,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      // Verify raw markup is free of double-escaped entities
      const rawDesc = extractMetaDescription(res.body, { raw: true });
      assertNotIncludes(rawDesc, '&amp;quot;', 'Raw description must not contain double-escaped &amp;quot;');
      assertNotIncludes(rawDesc, '&amp;amp;', 'Raw description must not contain double-escaped &amp;amp;');
      assertNotRegex(rawDesc, /<[^>]+>/, 'Description must not contain HTML tags');

      // Verify decoded text has no entity remnants
      const cleanDesc = extractMetaDescription(res.body);
      assertNotIncludes(cleanDesc, '&quot;', 'Decoded description must not contain raw &quot; tokens');
      assertNotIncludes(cleanDesc, '&amp;', 'Decoded description must not contain raw &amp; tokens');
    }
  },
```

---

#### Component 4: Regex Word-Boundary Fix in `T1-F04-01`, `T1-F04-03`, and `T3-PAIR-09`

Replace `/\bprintswithpasssion\b/i` with `/\bprintswithpasssion(?:bc)?\b/i` across all 3 occurrences:

1. **`tests/suites/tier1_feature_coverage.mjs` line 255 (`T1-F04-01`)**:
   ```javascript
   // BEFORE:
   assertNotRegex(res.body, /\bprintswithpasssion\b/i, 'Homepage must have zero occurrences of triple-s typo');
   // AFTER:
   assertNotRegex(res.body, /\bprintswithpasssion(?:bc)?\b/i, 'Homepage must have zero occurrences of triple-s typo');
   ```

2. **`tests/suites/tier1_feature_coverage.mjs` line 275 (`T1-F04-03`)**:
   ```javascript
   // BEFORE:
   assertNotRegex(res.body, /\bprintswithpasssion\b/i, 'Delivery return page must have zero triple-s typos');
   // AFTER:
   assertNotRegex(res.body, /\bprintswithpasssion(?:bc)?\b/i, 'Delivery return page must have zero triple-s typos');
   ```

3. **`tests/suites/tier3_cross_feature.mjs` line 259 (`T3-PAIR-09`)**:
   ```javascript
   // BEFORE:
   assertNotRegex(res.body, /\bprintswithpasssion\b/i, 'Zero triple-s email typos');
   // AFTER:
   assertNotRegex(res.body, /\bprintswithpasssion(?:bc)?\b/i, 'Zero triple-s email typos');
   ```

---

## 5. Verification Method

To independently verify these findings and confirm the remediation:

### 1. Concurrency Pacing Verification
Run concurrent ticket-lock test in Node:
```powershell
node -e "
let nextAvailableSlot = 0;
let pacingQueue = Promise.resolve();

async function enforcePacing(pacingMs = 100) {
  const prevSlot = pacingQueue;
  let release;
  pacingQueue = new Promise(resolve => { release = resolve; });
  await prevSlot;
  try {
    const now = Date.now();
    const waitTime = Math.max(0, nextAvailableSlot - now);
    if (waitTime > 0) await new Promise(r => setTimeout(r, waitTime));
    nextAvailableSlot = Date.now() + pacingMs;
  } finally {
    release();
  }
}

const start = Date.now();
Promise.all([1, 2, 3, 4, 5].map(async i => {
  await enforcePacing(100);
  console.log('Dispatched', i, 'at', Date.now() - start, 'ms');
}));
"
```
*Expected Outcome*: Dispatches are strictly separated by $\ge 100\text{ms}$ (e.g. 0ms, 105ms, 210ms, 315ms, 420ms), with zero simultaneous wakeups.

### 2. Live Sitemap Partition Verification
Verify Shopify returns HTTP 400 for unpartitioned requests and HTTP 200 for partitioned requests:
```powershell
node -e "
Promise.all([
  fetch('https://printswithpassion.com/sitemap_collections_1.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => console.log('Unpartitioned:', r.status)),
  fetch('https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&to=730430275957', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => console.log('Partitioned:', r.status))
]);"
```
*Expected Outcome*: Unpartitioned returns `400`; Partitioned returns `200`.

### 3. Entity Masking & Single-Pass Decoder Verification
Run single-pass decoding against raw and double-escaped strings:
```powershell
node -e "
const map = { '&quot;': '\"', '&amp;': '&' };
function decode(s) { return s.replace(/&(?:quot|amp);/gi, m => map[m.toLowerCase()] || m); }
console.log('Single escaped:', decode('Shop 1.25&quot; pine bars &amp; mats'));
console.log('Double escaped:', decode('Shop 1.25&amp;quot; pine bars &amp; mats'));
"
```
*Expected Outcome*:
- Single escaped decodes to `Shop 1.25" pine bars & mats`.
- Double escaped decodes to `Shop 1.25&quot; pine bars & mats` (retains `&quot;`, preventing masking).

### 4. Regex Word-Boundary Verification
Test the corrected regex against the authoritative typo:
```powershell
node -e "
const regex = /\bprintswithpasssion(?:bc)?\b/i;
console.log('Typo email:', regex.test('printswithpasssionbc@gmail.com'));
console.log('Clean email:', regex.test('printswithpassionbc@gmail.com'));
"
```
*Expected Outcome*: Typo email prints `true`; Clean email prints `false`.
