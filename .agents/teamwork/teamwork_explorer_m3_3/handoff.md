# Handoff Report — Explorer M3-3: Shopify GraphQL Mutation & Execution Architect

**Agent**: `teamwork_explorer_m3_3` (Shopify Mutation Architect)  
**Milestone**: Milestone 3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata)  
**Target Codebase**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  
**Target Storefront / Admin**: `https://printswithpassion.com/` (`bencook96store.myshopify.com`)  
**Date**: 2026-11-14  

---

## 1. Observation

All observations below were established through direct examination of the codebase, live GraphQL queries against Shopify Admin API 2025-01, and review of sibling milestones and exploration artifacts.

### 1.1 Authentication & Endpoint Architecture in `lib/cloud-env.mjs`
- **File**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\lib\cloud-env.mjs`
- **Shopify Domain**:
  `export const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN || 'bencook96store.myshopify.com';` (line 39)
- **Official Admin GraphQL Endpoint**:
  `export const OFFICIAL_GRAPHQL_URL = \`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json\`;` (line 40)
- **Token Resolution**: `resolveShopifyAccessToken()` (lines 76–116) resolves credentials in priority:
  1. Priority 1: `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` via OAuth2 Client Credentials grant (`POST https://${SHOP_DOMAIN}/admin/oauth/access_token`) cached with expiration.
  2. Priority 2: `process.env.SHOPIFY_ADMIN_ACCESS_TOKEN` (`shpat_...`).
  3. Priority 3: Local `.shopify_token.json` (`accessToken` or client ID/secret).
- **Retry & Throttle Handling**:
  `shopifyGraphQL(query, variables, retries = 3)` (lines 135–215):
  - Captures HTTP 429 status code and delays `2000 * attempt` ms before retrying (line 184–187).
  - Inspects `json.errors` for strings containing `'throttled'` and backs off `2000 * attempt` ms (lines 198–202).
  - Returns `json.data` on success (line 204), or empty object `{}` on total failure after retries (line 214).

### 1.2 Live Collections Inventory State
Direct live query using `query GetAllCollections` executed via `query_collections.mjs`:
- **Total Collections Count in Shopify Admin**: **73** collections.
- **Composition**:
  - 1 Core Theme Collection: `frontpage` (`gid://shopify/Collection/437768978743`).
  - 1 App Collection: `avada-upsell-best-sellers` (`gid://shopify/Collection/441651298615`, unpublished from Online Store in Milestone 2).
  - 23 Active Parent / Category Collections: `canvas-prints`, `apparel`, `hoodies`, `pillow-cases`, `bath-mats`, `desk-mats`, `blankets`, `clothing`, `wall-art`, `home-living`, `stationary-office`, `plush-blankets`, `all-products`, `t-shirts`, `nature-landscapes`, `sci-fi-cyberpunk`, `space-cosmic`, `animals-wildlife`, `abstract-geometric`, `fantasy-mythology`, `world-travel-cities`, `retro-vintage`, `japanese-asian-art`.
  - 48 Curated Studio Smart Sub-Collections: handles ranging from `japanese-anime-desk-mats` through `nature-mountain-graphic-hoodies`.
- **Precedent Script Reference**:
  `remediate_m2_collections_redirects.mjs` lines 305–331 demonstrated the sequential iteration pattern with `await sleep(300)` pacing delay.

### 1.3 Proposal Artifacts from Explorer M3-2
- **File**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m3_2\combined_inventory.json`
- Contains 70 pre-audited and fitted entries with fields:
  - `id`: Shopify Collection GID
  - `handle`: Collection URL handle
  - `title`: Shopify internal title
  - `proposedTitle`: SEO Title (<= 60 chars)
  - `proposedTitleLen`: Character count
  - `proposedDesc`: SEO Description (140–158 chars)
  - `proposedDescLen`: Character count
- Sample Entry:
  ```json
  {
    "index": 0,
    "handle": "frontpage",
    "id": "gid://shopify/Collection/437768978743",
    "title": "Home page",
    "productsCount": 0,
    "proposedTitle": "Canvas Wall Art, XXL Desk Mats & Decor | Prints With Passion",
    "proposedTitleLen": 60,
    "proposedDesc": "Shop archival framed canvas wall art (1.25\" pine), 4mm XXL stitched desk mats, velvet cushions & plush throws for modern UK homes. Free tracked UK delivery.",
    "proposedDescLen": 156
  }
  ```

---

## 2. Logic Chain

### 2.1 GraphQL Mutation Design (`collectionUpdate`)
1. **Observation**: Requirement R3 requires updating `seo.title` and `seo.description` for all active collections without affecting product associations, ruleSets, or collection descriptions.
2. **Inference**: In Shopify Admin GraphQL API 2025-01, the `collectionUpdate` mutation accepts a single `CollectionInput!` argument. Providing only `id` and the `seo` nested object (`SEOInput { title, description }`) isolates updates strictly to search engine metadata.
3. **Specification**:
   ```graphql
   mutation CollectionSeoUpdate($input: CollectionInput!) {
     collectionUpdate(input: $input) {
       collection {
         id
         handle
         title
         seo {
           title
           description
         }
         updatedAt
       }
       userErrors {
         field
         message
       }
     }
   }
   ```
   Variables structure:
   ```json
   {
     "input": {
       "id": "gid://shopify/Collection/730428473717",
       "seo": {
         "title": "Japanese Anime & Ukiyo-e Desk Mats | 4mm XXL Gaming Pads",
         "description": "Shop Japanese anime, samurai, sakura blossom and Great Wave XXL gaming desk mats featuring 4mm non-slip rubber & stitched borders. Free tracked UK delivery."
       }
     }
   }
   ```
4. **Immediate In-Flight Verification**:
   Requesting `seo { title description }` in the mutation selection set provides instantaneous confirmation that the values were applied in Shopify's datastore during that same request.

### 2.2 Rate Limiting, Throttling & Leaky Bucket Dynamics
1. **Observation**: Shopify Admin GraphQL uses a 1,000-point leaky bucket with a 50-point/sec leak rate.
2. **Inference**:
   - A single `collectionUpdate` mutation has an actual query cost of 10 points.
   - Pacing requests sequentially with a `sleep(300)` (300 ms) delay produces an average cycle time of ~450–550 ms per collection (including network round trip of ~150–250 ms).
   - This corresponds to ~1.8 to 2.2 requests per second.
   - Total point consumption is ~18 to 22 points per second.
   - Since the restore rate is 50 points per second, the bucket accumulates points faster than it drains (`+30 pts/sec` net margin). The bucket balance will remain near 980–1,000 points indefinitely.
3. **Conclusion on Pacing**: A constant delay of **300 ms** between requests guarantees zero leaky bucket throttling while allowing the entire 70-collection catalog to update in approximately 35 seconds.

### 2.3 UserError Detection and Error Handling Architecture
1. **Observation**: `shopifyGraphQL` in `lib/cloud-env.mjs` unwraps `json.data` and returns it directly, returning `{}` if a top-level unhandled GraphQL error occurs.
2. **Inference**:
   - A call may fail at two distinct levels:
     a. **Transport / Top-Level GraphQL Error**: `!res || !res.collectionUpdate`.
     b. **Shopify Business / Validation Error**: `res.collectionUpdate.userErrors` contains items.
3. **Specification**:
   The execution loop must inspect both layers:
   ```javascript
   if (!res || !res.collectionUpdate) {
     throw new Error(`Shopify API returned empty payload for collection ${item.handle} (${item.id})`);
   }
   const userErrors = res.collectionUpdate.userErrors || [];
   if (userErrors.length > 0) {
     const errMsg = userErrors.map(e => `[${e.field?.join('.') || 'root'}]: ${e.message}`).join('; ');
     console.error(`  [USER_ERROR] ${item.handle}: ${errMsg}`);
     summary.errors.push({ handle: item.handle, id: item.id, error: errMsg });
     continue;
   }
   ```
4. **In-Flight Discrepancy Check**:
   ```javascript
   const updated = res.collectionUpdate.collection;
   if (updated.seo?.title !== item.proposedTitle || updated.seo?.description !== item.proposedDesc) {
     const mismatch = `In-flight mismatch: applied title="${updated.seo?.title}" vs expected="${item.proposedTitle}"`;
     console.error(`  [MISMATCH] ${item.handle}: ${mismatch}`);
     summary.errors.push({ handle: item.handle, id: item.id, error: mismatch });
   } else {
     console.log(`  [UPDATED_AND_VERIFIED] ${item.handle} (${item.id})`);
     summary.updatedCount++;
   }
   ```

### 2.4 Idempotency & Pre-Flight Delta Optimization
1. **Observation**: In automation workflows, scripts may be rerun due to network interruptions, CI/CD steps, or validation gates. Re-mutating unchanged collections wastes API quota and triggers unnecessary cache invalidations.
2. **Inference**:
   Before initiating mutations, the script can query all current collection states in a single paginated GraphQL query:
   ```graphql
   query CurrentCollectionSeo {
     collections(first: 100) {
       nodes {
         id
         handle
         seo {
           title
           description
         }
       }
     }
   }
   ```
   By indexing live collections by GID:
   - If `live.seo?.title === item.proposedTitle && live.seo?.description === item.proposedDesc`:
     Log `[SKIPPED_ALREADY_COMPLIANT] ${item.handle}` and skip mutation.
   - Otherwise, queue for mutation.
3. **Benefit**: Re-running the script against an already optimized store will execute 0 mutations, finish in ~1 second, and report 100% compliance.

### 2.5 Dry-Run Simulation Mode
1. **Observation**: Operators require the ability to simulate changes safely before touching live production data.
2. **Specification**: If invoked with `--dry-run` or `--audit-only`:
   - Validates all proposed metadata against R3 rules (length <= 60, desc 140–158, no entities, no template phrases).
   - Fetches live collection SEO from Shopify.
   - Calculates the exact diff: how many collections need updates, how many are already compliant, and flags any proposal defects.
   - Exits cleanly without issuing a single mutation.

---

## 3. Caveats

1. **`avada-upsell-best-sellers` Collection Handling**:
   - In Milestone 2, `avada-upsell-best-sellers` (`gid://shopify/Collection/441651298615`) was unpublished from the Online Store publication (`gid://shopify/Publication/124388507959`), successfully removing it from `sitemap_collections_1.xml`.
   - In M3-2's inventory, this collection is flagged with `action: 'UNPUBLISH_FROM_ONLINE_STORE'`.
   - The M3 script must gracefully skip or omit this collection from SEO updates, as its storefront URL returns 404 and it does not participate in organic search indexing.
2. **Frontpage Collection Handling**:
   - `frontpage` (`gid://shopify/Collection/437768978743`) is a core collection. Updating its `seo.title` and `seo.description` via `collectionUpdate` is fully supported by Shopify Admin GraphQL and will optimize `/collections/frontpage` if crawled.
3. **Storefront Liquid Cache**:
   - After updating SEO metadata via GraphQL Admin API, Shopify updates the Admin data model immediately. Edge CDN storefront rendering typically updates within 5 to 60 seconds.
4. **No other caveats.**

---

## 4. Conclusion & Precise Worker Script Specification

### 4.1 Target Script Name and Path
The Worker agent should implement:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\remediate_m3_collections_seo.mjs`

### 4.2 Script Architecture & Component Breakdown

```
========================================================================================
FILE: remediate_m3_collections_seo.mjs
========================================================================================

Section 1: Imports & Configuration
- import { shopifyGraphQL, SHOP_DOMAIN } from './lib/cloud-env.mjs';
- import fs from 'fs';
- import path from 'path';

Section 2: Constants & CLI Flags
- PACING_DELAY_MS = 300;
- PROPOSALS_FILE = resolve verified_collection_proposals.json:
    Check .agents/teamwork/teamwork_explorer_m3_2/verified_collection_proposals.json
    Fallback: .agents/teamwork/teamwork_explorer_m3_2/combined_inventory.json
- CLI Flags:
    const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('--audit-only');
    const isVerifyOnly = process.argv.includes('--verify-only');

Section 3: Strict Pre-Flight Assertion Engine
- function assertProposalStrict(item):
    - Assert proposedTitle exists, is string, length >= 1 and <= 60.
    - Assert proposedDesc exists, is string, length >= 140 and <= 158.
    - Assert proposedDesc ends with punctuation [.!?].
    - Assert /&(?:quot|amp|lt|gt|#39|#x27|#x26|amp;quot);/i.test(...) is false.
    - Assert /(?:Transform|Elevate|Style|Refresh|Upgrade|Wear|Accent)\s+with\b/i.test(...) is false.
    - Assert handle !== 'japanese-anime-desk-mats' || !title.includes('Japanese Wave Desk Mat').
    - Assert handle !== 'abstract-minimalist-bauhaus-canvas-wall-art' || !title.includes('(CM & I').

Section 4: GraphQL Mutations & Queries
- COLLECTION_UPDATE_MUTATION:
    mutation CollectionSeoUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          handle
          title
          seo { title description }
          updatedAt
        }
        userErrors { field message }
      }
    }

- BULK_COLLECTIONS_QUERY:
    query GetCollectionsLiveSeo {
      collections(first: 100) {
        nodes {
          id
          handle
          title
          seo { title description }
        }
      }
    }

Section 5: Execution Pipeline (runMilestone3Remediation)
  Step 1: Load proposals file and validate 100% of entries using assertProposalStrict().
          If any entry fails assertion, abort immediately with exit code 1.
  Step 2: Fetch current live state from Shopify Admin via BULK_COLLECTIONS_QUERY.
  Step 3: Diff computation:
          Identify which collections already have matching title & description.
          Separate into:
          - toUpdate: []
          - alreadyCompliant: []
          - skipped: [avada-upsell-best-sellers]
  Step 4: If isDryRun, print audit table and exit 0.
  Step 5: Sequential Execution Loop:
          For each item in toUpdate:
            a. Call shopifyGraphQL(COLLECTION_UPDATE_MUTATION, { input: { id: item.id, seo: { title: item.proposedTitle, description: item.proposedDesc } } });
            b. Verify !res.collectionUpdate.userErrors.length.
            c. Verify returned collection.seo matches proposed values.
            d. Pacing: await sleep(PACING_DELAY_MS) (300 ms).
  Step 6: Automated Post-Execution Verification Suite:
          a. Tier 1: Query all updated collections via GraphQL and assert exact field equality.
          b. Tier 2: HTTP probes on live storefront sample handles (/collections/japanese-anime-desk-mats, /collections/abstract-minimalist-bauhaus-canvas-wall-art, etc.).
  Step 7: Output formatted execution summary. Exit with code 0 if 100% pass, 1 if errors exist.
```

---

## 5. Verification Method

To independently verify this architecture and the resulting script:

### 5.1 Dry-Run Simulation Command
```powershell
Set-Location 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'; node remediate_m3_collections_seo.mjs --dry-run
```
**Expected Output**:
- Loads all 70 proposals.
- Reports: 100% proposals compliant with R3 constraints.
- Shows list of collections to update vs already compliant.
- Executes 0 mutations; exits with code 0.

### 5.2 Live Execution Command
```powershell
Set-Location 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'; node remediate_m3_collections_seo.mjs
```
**Expected Output**:
- Iterates through all active collections with 300ms pacing.
- Reports `[UPDATED_AND_VERIFIED]` for every mutated collection.
- Reports 0 `userErrors` and 0 GraphQL throttle errors.
- Executes Tier 1 GraphQL post-audit and Tier 2 Storefront probes.
- Final summary: `Total Collections Updated + Verified: 68–70 / 70`, `Errors: 0`.

### 5.3 Live GraphQL Verification Snippet
```powershell
Set-Location 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'; node -e "
  import { shopifyGraphQL } from './lib/cloud-env.mjs';
  const res = await shopifyGraphQL(\`
    query {
      anime: collection(id: \"gid://shopify/Collection/730428473717\") {
        handle
        seo { title description }
      }
      bauhaus: collection(id: \"gid://shopify/Collection/730428801397\") {
        handle
        seo { title description }
      }
    }
  \`);
  console.log('Anime SEO:', res?.anime?.seo);
  console.log('Bauhaus SEO:', res?.bauhaus?.seo);
"
```
**Expected Output**:
- Anime title does NOT contain "Japanese Wave Desk Mat" (product title). Title length <= 60 chars.
- Bauhaus title does NOT end in truncated `(CM & I`. Title length <= 60 chars.
- Both descriptions between 140 and 158 chars with zero HTML entities and zero template phrases.

### 5.4 Invalidation Conditions
The specification would be invalidated if:
1. `collectionUpdate` returns unexpected userErrors when given `{ id, seo: { title, description } }`.
2. A 300ms pacing delay triggers a 429 response from Shopify Admin API.
3. Live storefront does not reflect the updated `seo.title` and `seo.description` in HTML `<title>` and `<meta name="description">`.
