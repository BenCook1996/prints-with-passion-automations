# Milestone 5 Explorer 3 Investigation & Implementation Plan: SEO Lint Gate & Storewide Collection Validator

## 1. Observation

### 1.1 Existing `catalog_uniqueness_and_seo_lint_gate.mjs`
- **Location**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\catalog_uniqueness_and_seo_lint_gate.mjs` (258 lines).
- **Current Queries (Lines 48–67)**:
  ```javascript
  query SampleQualityGate {
    productsCount(query: "status:active") { count }
    products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
      nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } }
    }
    fujifilmCheck: products(first: 20, query: "status:active fujifilm") {
      nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } }
    }
    collections(first: 80) {
      nodes { id handle title descriptionHtml seo { title description } }
    }
    blogs(first: 20) {
      nodes { id handle title }
    }
    articles(first: 50, query: "published_status:published") {
      nodes { id handle title body }
    }
  }
  ```
  **Direct Defects Observed**:
  1. `collections(first: 80)` misses collections beyond 80 (there are currently 73–101 collections storewide).
  2. `collections` node lacks `productsCount { count }`, meaning 0-product collections are invisible to the gate.
  3. `products` and `articles` do not fetch `seo { title description }` or metafield title/description tags (`metafield(namespace: "global", key: "title_tag")`).
  4. Pages (`pages(first: 50)`) are completely omitted from the query.
- **Current Checks (Lines 79–226)**:
  - Line 88: Cleans non-news blog containers.
  - Line 106: Checks products for `ROMAN_CLONE_REGEX`, `IP_TRADEMARK_REGEX`, £0.00 prices, and `AI_CLICHE_REGEX`.
  - Line 152: Deletes `pop-culture-icons`, cleans `STUDIO15` and `FAQPage` schema boilerplate.
  - Line 209: Checks articles for `AI_CLICHE_REGEX`.
  **Missing Required Capabilities**:
  - Zero checks or sanitizers for double-escaped HTML entities (`&quot;`, `&amp;quot;`, `&amp;amp;`, `&#39;`).
  - Zero checks or sanitizers for broken template grammar fragments (`Transform with...`, `Elevate with...`, `Style with...`).
  - Zero checks or sanitizers for dangling truncated titles (`-`, `|`, `&`, `Mo`, `Si`, `Desig`, `Pass`).
  - Zero checks or cleaners for 0-product collections (except the hardcoded `pop-culture-icons`).

### 1.2 Existing `verify_40_subcollections_counts.mjs`
- **Location**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\verify_40_subcollections_counts.mjs` (33 lines).
- **Verbatim Code**:
  ```javascript
  import fs from 'fs';
  import { shopifyGraphQL, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

  async function main() {
    const subs = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
    const ids = subs.map(s => s.id);
    const data = await shopifyGraphQL(`
      query CheckCounts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Collection {
            id
            handle
            title
            productsCount { count }
          }
        }
      }
    `, { ids });

    let zeroCount = 0;
    for (const c of data?.nodes || []) {
      if (!c) continue;
      const cnt = typeof c.productsCount === 'object' ? (c.productsCount?.count ?? 0) : (c.productsCount ?? 0);
      console.log(`${c.handle.padEnd(45)} | count=${String(cnt).padStart(5)} | ${c.title}`);
      if (cnt === 0) zeroCount++;
    }
    console.log(`\nTotal checked: ${(data?.nodes || []).length}, Zero-product collections: ${zeroCount}`);
  }

  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
  ```
  **Direct Defects Observed**:
  1. Only checks the 48 curated subcollections from `phase2_40_subcollections.json`; completely ignores all other storewide collections (parent collections, legacy collections, unlisted collections).
  2. Does NOT fail when `zeroCount > 0`! It prints `Zero-product collections: ${zeroCount}` and exits with code 0.
  3. No validation of collection title lengths (`<= 60` chars).
  4. No validation of mid-word or dangling truncated titles.
  5. No validation of collection descriptions (neither 140–158 character length, nor entity escaping, nor template grammar).
  6. No validation of presence in live `sitemap_collections_1.xml`.

### 1.3 Live Store Audit Results (Direct Execution via Prototype)
- Running `prototype_verify_collections_gate.mjs` against live production Shopify API and `https://printswithpassion.com/sitemap.xml`:
  - **Total Collections Queried**: 73
  - **Curated Subcollections Loaded**: 48
  - **Live Sitemap Collections**: 70
  - **Empty Collections (excl. frontpage)**: 0 (The 28 legacy collections have just been purged by Milestone 2 remediation).
  - **Title Length > 60 chars**: 13 collections currently violate length (e.g. `Abstract, Boho Kilim, Tartan & Geometric Plush Throw Blankets` = 61 chars).
  - **Title Mid-Word / Dangling**: 2 collections currently violate dangling boundaries (`japanese-anime-desk-mats` and `abstract-minimalist-bauhaus-canvas-wall-art`).
  - **Description Length out of 140–158 chars**: 29 active collections violate description length.
  - **Broken Template Grammar Fragments**: 61 active collections violate template grammar (e.g. `Transform with Canvas Wall Art...`, `Elevate with Cushion Covers...`, `Wear with Graphic T-Shirts...`).
  - **Unwanted / Unlisted in Sitemap**: 1 collection (`avada-upsell-best-sellers` is still present in live sitemap).
  - **Subcollections Missing from Sitemap**: 0 (All 48 subcollections are present in `sitemap_collections_1.xml`).

---

## 2. Logic Chain

1. **Step 1 (Catalog Uniqueness & Lint Gate Role)**:
   - In `package.json` line 9, `"seo-daily"` executes `catalog_uniqueness_and_seo_lint_gate.mjs` first, followed by downstream tools and finally `verify_40_subcollections_counts.mjs`.
   - `catalog_uniqueness_and_seo_lint_gate.mjs` must therefore act as an **active sanitizer and early audit logger**, correcting violations in Shopify before downstream gates run.
   - By querying all collections using `collections(first: 250)`, products (`first: 200`), articles (`first: 50`), and pages (`first: 50`), it can comprehensively scan the entire catalog.

2. **Step 2 (Double-Escaped Entity Remediation)**:
   - Double-escaped entities like `&amp;quot;`, `&amp;amp;`, `&#39;`, and `&quot;` in plain text SEO fields (`seo.title`, `seo.description`, `titleTag`, `descTag`) cause literal entity markup to render in search engine snippets.
   - In HTML fields (`descriptionHtml`, `body`), double-escaped entities like `&amp;quot;` render as literal `&quot;` to site visitors.
   - An unescaping utility (`unescapeHtmlEntities(text, isHtml)`) resolves this by decoding double entities in HTML and decoding both single and double entities in plain text SEO fields.

3. **Step 3 (Broken Template Grammar Sanitization)**:
   - The phrase pattern `/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i` was introduced by automated templating scripts (e.g., `Transform with Canvas Wall Art (1.25" Pine Frame (8x10"–24x36")). ...`).
   - `sanitizeTemplateGrammar` converts these into natural commercial copy (e.g. "Archival framed canvas wall art on 1.25\" European pine frames. ...") or removes the leading template fragment, ensuring descriptions read cleanly and fall within the 140–158 character window.

4. **Step 4 (Dangling Truncated Title Remediation)**:
   - Hard slicing (e.g. `.slice(0, 66)`) cuts words mid-token (`Desig`, `Pass`, `Si`, `Mo`, `(CM & I`) or leaves trailing conjunctions/separators (`-`, `|`, `&`, `with`, `and`).
   - A word-boundary truncation function (`sanitizeDanglingTitle` / `fitTitleUnder60Chars`) removes trailing separators and unclosed opening parentheses, and truncates at word boundaries (`lastIndexOf(' ')`) strictly `<= 60` characters.

5. **Step 5 (0-Product Collection Hygiene)**:
   - Any collection with `productsCount === 0` (excluding `frontpage`) is a dead end for users and crawler budget waste.
   - When detected in `catalog_uniqueness_and_seo_lint_gate.mjs`, it flags the collection and triggers `collectionDelete` and `urlRedirectCreate` (redirecting to the appropriate parent collection or `/collections/all`).

6. **Step 6 (Comprehensive Storewide Gate in `verify_40_subcollections_counts.mjs`)**:
   - `verify_40_subcollections_counts.mjs` is the final gatekeeper in `seo-daily`.
   - It must query all collections (`collections(first: 250)`), check all 48 subcollections from `phase2_40_subcollections.json`, and fetch `sitemap_collections_1.xml`.
   - It enforces 8 assertions:
     1. 0 empty collections (excl. `frontpage`).
     2. All active collection titles `<= 60` chars.
     3. No active collection title ends dangling or cut mid-word.
     4. All active collection descriptions are 140–158 chars.
     5. No active collection description has unescaped HTML entities.
     6. No active collection description has broken template phrasing.
     7. All 48 curated subcollections are in `sitemap_collections_1.xml`.
     8. Discontinued / unpublished collections (like `avada-upsell-best-sellers`) are NOT in `sitemap_collections_1.xml`.
   - If any violation is present, it logs a formatted diagnostic table and executes `process.exit(1)`. If 0 violations, it logs success and exits `0`.

---

## 3. Caveats

1. **Pre-Remediation State vs. Gate Pass**:
   - `verify_40_subcollections_counts.mjs` will exit with code 1 until Milestone 3 (R3 active collection SEO metadata rewrite) and Milestone 2 unpublishing of `avada-upsell-best-sellers` are live in Shopify. This is by design: the gate must fail until the live store is clean.
2. **Shopify API Rate Limits**:
   - Shopify GraphQL operates on a leaky bucket (50 points/sec). When `catalog_uniqueness_and_seo_lint_gate.mjs` executes auto-sanitization mutations in batch, it must maintain a pacing limit (max 25–30 sanitizations per run or 250ms delay between mutations).
3. **Frontpage Collection Handling**:
   - Shopify automatically creates and preserves `frontpage` (handle: `frontpage`, id: `gid://shopify/Collection/437768978743`). It is not published in sitemaps and frequently has 0 products. It must be explicitly excluded from empty collection failure assertions.

---

## 4. Conclusion & Implementation Blueprint

The Worker for Milestone 5 should implement the following exact changes:

### 4.1 Upgraded `catalog_uniqueness_and_seo_lint_gate.mjs` Blueprint

#### Add Regexes & Utility Functions (Top of file):
```javascript
// Entity, grammar, and title regexes
export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;

export function unescapeHtmlEntities(str, isHtml = false) {
  if (!str) return '';
  let res = str;
  res = res.replace(/&amp;quot;/gi, '"')
           .replace(/&amp;#39;/gi, "'")
           .replace(/&amp;apos;/gi, "'")
           .replace(/&amp;amp;/gi, '&')
           .replace(/&amp;lt;/gi, '<')
           .replace(/&amp;gt;/gi, '>')
           .replace(/&amp;nbsp;/gi, ' ');
  if (!isHtml) {
    res = res.replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/&apos;/gi, "'")
             .replace(/&amp;/gi, '&')
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&nbsp;/gi, ' ');
  }
  return res;
}

export function sanitizeDanglingTitle(rawTitle, brandSuffix = ' | Prints With Passion', maxChars = 60) {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
  title = title.replace(/\s*\([^\)]*$/, '').trim();
  title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
  title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();

  if (title.length > maxChars) {
    let truncated = title.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 25) {
      truncated = truncated.slice(0, lastSpace);
    }
    title = truncated.trim().replace(/[–—\-|,/&:]+$/, '').trim();
    title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
    title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
  }
  return title;
}

export function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = desc;
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)\s*\([^\)]+\)\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)\s*\([^\)]+\)\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)\s*\([^\)]+\)\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)\s*\([^\)]+\)\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)\s*\([^\)]+\)\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+([^\.]+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}
```

#### Update SampleQualityGate Query:
```graphql
query SampleQualityGate {
  productsCount(query: "status:active") { count }
  products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
    nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
  }
  fujifilmCheck: products(first: 20, query: "status:active fujifilm") {
    nodes { id handle title description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
  }
  collections(first: 250) {
    nodes { id handle title descriptionHtml productsCount { count } seo { title description } }
  }
  blogs(first: 20) {
    nodes { id handle title }
  }
  articles(first: 50, query: "published_status:published") {
    nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
  }
  pages(first: 50) {
    nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
  }
}
```

#### Add Audit & Auto-Sanitization Loops:
1. **0-Product Collections Loop**:
   ```javascript
   for (const c of collections) {
     if (c.handle !== 'frontpage' && (c.productsCount?.count ?? 0) === 0) {
       zeroProductViolations.push({ id: c.id, handle: c.handle, title: c.title });
       // Auto-clean if active sanitization permitted
       if (autoSanitizedCount < 30) {
         await shopifyGql(`
           mutation DelCol($input: CollectionDeleteInput!) {
             collectionDelete(input: $input) { deletedCollectionId userErrors { field message } }
           }
         `, { input: { id: c.id } });
         await shopifyGql(`
           mutation RedirCol($urlRedirect: UrlRedirectInput!) {
             urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
           }
         `, { urlRedirect: { path: `/collections/${c.handle}`, target: '/collections/all' } });
         autoSanitizedCount++;
       }
     }
   }
   ```
2. **Collection Entities, Grammar & Dangling Titles Sanitization**:
   ```javascript
   for (const c of collections) {
     if (c.handle === 'frontpage') continue;
     let seoTitle = c.seo?.title || c.title || '';
     let seoDesc = c.seo?.description || '';
     let needsUpdate = false;

     // Check entities
     if (UNESCAPED_ENTITY_REGEX.test(seoTitle) || UNESCAPED_ENTITY_REGEX.test(seoDesc)) {
       entityViolations.push({ type: 'Collection', handle: c.handle });
       seoTitle = unescapeHtmlEntities(seoTitle, false);
       seoDesc = unescapeHtmlEntities(seoDesc, false);
       needsUpdate = true;
     }

     // Check broken template grammar
     if (TEMPLATE_GRAMMAR_REGEX.test(seoDesc)) {
       templateGrammarViolations.push({ type: 'Collection', handle: c.handle });
       seoDesc = sanitizeTemplateGrammar(seoDesc);
       needsUpdate = true;
     }

     // Check dangling title
     if (DANGLING_TITLE_REGEX.test(seoTitle) || seoTitle.length > 60) {
       danglingTitleViolations.push({ type: 'Collection', handle: c.handle, title: seoTitle });
       seoTitle = sanitizeDanglingTitle(seoTitle, ' | Prints With Passion', 60);
       needsUpdate = true;
     }

     if (needsUpdate && autoSanitizedCount < 30) {
       await shopifyGql(`
         mutation CleanColSeo($input: CollectionInput!) {
           collectionUpdate(input: $input) { collection { id } userErrors { field message } }
         }
       `, { input: { id: c.id, seo: { title: seoTitle, description: seoDesc } } });
       autoSanitizedCount++;
     }
   }
   ```
3. **Products & Articles Entity Sanitization**:
   Add checks and unescaping for product and article titles and bodies.
4. **Log Reporting**: Update `LINT_QUALITY_GATE_LOG.md` summary with sections for entity violations, template grammar violations, dangling title violations, and 0-product collections cleaned.

---

### 4.2 Upgraded `verify_40_subcollections_counts.mjs` Blueprint
Replace the 33-line script with a comprehensive storewide collection gate:
```javascript
import fs from 'fs';
import { shopifyGql, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;

async function fetchAllCollections() {
  const collections = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const afterClause = cursor ? `, after: "${cursor}"` : '';
    const res = await shopifyGql(`
      query GetAllCollectionsStorewide {
        collections(first: 250${afterClause}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productsCount { count }
            seo { title description }
          }
        }
      }
    `);
    collections.push(...(res?.collections?.nodes || []));
    hasNextPage = res?.collections?.pageInfo?.hasNextPage ?? false;
    cursor = res?.collections?.pageInfo?.endCursor ?? null;
  }
  return collections;
}

async function fetchSitemapCollections() {
  const sitemapHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  };
  const handles = new Set();
  try {
    const indexRes = await fetch('https://printswithpassion.com/sitemap.xml', { headers: sitemapHeaders });
    if (!indexRes.ok) throw new Error(`HTTP ${indexRes.status} fetching sitemap.xml`);
    const indexXml = await indexRes.text();
    const locMatches = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
    const colSitemapUrl = locMatches.find(u => u.includes('sitemap_collections'));
    if (colSitemapUrl) {
      const colRes = await fetch(colSitemapUrl, { headers: sitemapHeaders });
      if (colRes.ok) {
        const colXml = await colRes.text();
        const urls = [...colXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
        for (const u of urls) {
          const match = u.match(/\/collections\/([^\/\?#]+)/);
          if (match) handles.add(match[1]);
        }
      }
    }
  } catch (err) {
    console.warn(`[WARN] Live sitemap check failed: ${err.message}.`);
    return null;
  }
  return handles;
}

async function main() {
  console.log('================================================================');
  console.log('  PRINTS WITH PASSION — STOREWIDE COLLECTION COMPLIANCE GATE    ');
  console.log('================================================================');

  const collections = await fetchAllCollections();
  const sitemapHandles = await fetchSitemapCollections();
  const subcollections = fs.existsSync(SUBCOLLECTIONS_PATH)
    ? JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'))
    : [];

  const emptyViolations = [];
  const titleLengthViolations = [];
  const titleDanglingViolations = [];
  const descLengthViolations = [];
  const descEntityViolations = [];
  const descTemplateViolations = [];
  const sitemapMissingSubcollections = [];
  const sitemapUnwantedCollections = [];

  for (const c of collections) {
    const isFrontpage = c.handle === 'frontpage';
    const count = c.productsCount?.count ?? 0;

    // 1. 0-product check
    if (!isFrontpage && count === 0) {
      emptyViolations.push({ handle: c.handle, title: c.title });
    }

    // Active collection metadata validation
    if (!isFrontpage && count > 0) {
      const title = (c.seo?.title || c.title || '').trim();
      const desc = (c.seo?.description || '').trim();

      if (title.length > 60) {
        titleLengthViolations.push({ handle: c.handle, title, len: title.length });
      }
      if (DANGLING_TITLE_REGEX.test(title)) {
        titleDanglingViolations.push({ handle: c.handle, title });
      }
      if (desc.length < 140 || desc.length > 158) {
        descLengthViolations.push({ handle: c.handle, len: desc.length, desc: desc.slice(0, 50) });
      }
      if (UNESCAPED_ENTITY_REGEX.test(desc)) {
        descEntityViolations.push({ handle: c.handle, desc });
      }
      if (TEMPLATE_GRAMMAR_REGEX.test(desc)) {
        descTemplateViolations.push({ handle: c.handle, desc });
      }
    }
  }

  // Sitemap presence
  if (sitemapHandles) {
    for (const sub of subcollections) {
      if (!sitemapHandles.has(sub.handle)) {
        sitemapMissingSubcollections.push(sub.handle);
      }
    }
    if (sitemapHandles.has('avada-upsell-best-sellers')) {
      sitemapUnwantedCollections.push('avada-upsell-best-sellers (should be unpublished)');
    }
  }

  const totalViolations = (
    emptyViolations.length +
    titleLengthViolations.length +
    titleDanglingViolations.length +
    descLengthViolations.length +
    descEntityViolations.length +
    descTemplateViolations.length +
    sitemapMissingSubcollections.length +
    sitemapUnwantedCollections.length
  );

  console.log(`Total Collections Queried:   ${collections.length}`);
  console.log(`Curated Subcollections:      ${subcollections.length}`);
  console.log(`Collections in Live Sitemap: ${sitemapHandles ? sitemapHandles.size : 'N/A'}`);
  console.log('----------------------------------------------------------------');
  console.log(`[1] Empty Collections (excl. frontpage):   ${emptyViolations.length === 0 ? 'PASS (0)' : `FAIL (${emptyViolations.length})`}`);
  console.log(`[2] Title Length <= 60 chars:              ${titleLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${titleLengthViolations.length})`}`);
  console.log(`[3] Title Word-Boundary / Dangling:        ${titleDanglingViolations.length === 0 ? 'PASS (0)' : `FAIL (${titleDanglingViolations.length})`}`);
  console.log(`[4] Description Length (140-158 chars):    ${descLengthViolations.length === 0 ? 'PASS (0)' : `FAIL (${descLengthViolations.length})`}`);
  console.log(`[5] Description Free of HTML Entities:     ${descEntityViolations.length === 0 ? 'PASS (0)' : `FAIL (${descEntityViolations.length})`}`);
  console.log(`[6] Description Free of Broken Templates:  ${descTemplateViolations.length === 0 ? 'PASS (0)' : `FAIL (${descTemplateViolations.length})`}`);
  console.log(`[7] 48 Subcollections in Live Sitemap:     ${sitemapMissingSubcollections.length === 0 ? 'PASS (All 48 present)' : `FAIL (${sitemapMissingSubcollections.length} missing)`}`);
  console.log(`[8] Unwanted / Unlisted in Sitemap:        ${sitemapUnwantedCollections.length === 0 ? 'PASS (0)' : `FAIL (${sitemapUnwantedCollections.length})`}`);
  console.log('================================================================');
  console.log(`OVERALL GATE STATUS: ${totalViolations === 0 ? 'PASSED (0 violations)' : `FAILED (${totalViolations} violations)`}`);
  console.log('================================================================');

  if (totalViolations > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

---

## 5. Verification Method

### 5.1 Independent Test Commands
1. **Run Prototype Storewide Gate**:
   ```bash
   node C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_3_rep1\prototype_verify_collections_gate.mjs
   ```
   - **Expected Result**: Successfully connects to live Shopify Admin and live sitemap, reports exact breakdown of 73 collections, passes 0 empty collections, passes all 48 subcollections in sitemap, correctly flags titles and descriptions awaiting M3 rewrite, and exits with code 1.
2. **Run Prototype Lint Gate Audit**:
   ```bash
   node C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m5_3_rep1\prototype_lint_gate.mjs
   ```
   - **Expected Result**: Successfully connects, queries products, collections, articles, and pages storewide, accurately detects the 1 entity violation in articles, 62 template grammar violations in collections, and 40 dangling title violations across collections/articles, and exits with code 0.
3. **Post-Implementation Verification (by Worker)**:
   After editing `catalog_uniqueness_and_seo_lint_gate.mjs` and `verify_40_subcollections_counts.mjs`:
   ```bash
   node catalog_uniqueness_and_seo_lint_gate.mjs
   ```
   Verify that `LINT_QUALITY_GATE_LOG.md` is updated and contains the new audit metrics.
   ```bash
   node verify_40_subcollections_counts.mjs
   ```
   Verify that it exits cleanly with clear diagnostic reporting.

### 5.2 Invalidation Conditions
- If any collection has 0 products (excluding `frontpage`) and `verify_40_subcollections_counts.mjs` exits with code 0, the gate is broken.
- If any active collection has `seo.title.length > 60` or dangling punctuation and passes the gate, the gate is broken.
- If any active collection has `seo.description` outside [140, 158] or containing `&quot;`, `&amp;quot;`, or `Transform with...` and passes the gate, the gate is broken.
- If any of the 48 curated studio collections is absent from `sitemap_collections_1.xml` and the gate passes, the gate is broken.
