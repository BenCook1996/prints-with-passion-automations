# Handoff Report — Explorer 2: Milestone 2 (Phase 2 — Collection & Redirect Hygiene)

**Agent**: `teamwork_explorer_m2_2`  
**Parent Agent**: `590f5f5d-0180-4545-b7ad-7d20c32abc37`  
**Milestone**: Milestone 2 (Phase 2 — Collection & Redirect Hygiene, Requirement R2)  
**Date**: 2026-11-13  
**Working Directory**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  
**Storefront**: `https://printswithpassion.com/` (`bencook96store.myshopify.com`)  

---

## 1. Observation

All data below was retrieved, queried, and verified directly against the live Shopify Admin API (2025-01) and surveyed artifacts from `.agents/teamwork/teamwork_explorer_survey_2/` (`all_redirects.json` containing 42,360 redirects, `discontinued_28_details.json`, and `all_collections.json`).

### 1.1 Status of the 28 Discontinued Collection Handles in `urlRedirects`
Querying the 42,360 redirects in Shopify Admin revealed that the 28 discontinued collection handles fall into three distinct operational categories:
- **22 Handles Have NO Existing Redirect** (`MISSING` in Shopify `urlRedirects`):
  1. `dog-collars`
  2. `laundry-bags`
  3. `duffle-bags`
  4. `clutch-bags`
  5. `phone-cases`
  6. `beach-towels`
  7. `mugs`
  8. `journals`
  9. `wall-tapestry`
  10. `puzzles`
  11. `shoes`
  12. `hats`
  13. `tote-bags`
  14. `suitcases`
  15. `yoga-mats`
  16. `makeup-bags`
  17. `coasters`
  18. `pet-mat`
  19. `bottle-opener`
  20. `pet-bowls`
  21. `bags-1`
  22. `can-cooler`
- **2 Handles Have Existing Redirects with Sub-optimal Targets** (`EXISTING`, requires `urlRedirectUpdate`):
  1. `/collections/bottles` — `gid://shopify/UrlRedirect/1699588079989`:
     - Current Target: `/collections/all` (generic store catalog)
     - Target Parent: `/collections/home-living`
  2. `/collections/bags` — `gid://shopify/UrlRedirect/1691668873589`:
     - Current Target: `/collections/home-living`
     - Target Parent: `/collections/apparel` (matches apparel bags/accessories)
- **4 Handles Have Existing Redirects that ALREADY Point to the Exact Target** (`EXISTING`, correct target, NO mutation needed):
  1. `/collections/pets-animals` — `gid://shopify/UrlRedirect/1691668840821`:
     - Current Target: `/collections/animals-wildlife` (Target is already active and correct)
  2. `/collections/posters` — `gid://shopify/UrlRedirect/1691668775285`:
     - Current Target: `/collections/canvas-prints` (Target is already active and correct)
  3. `/collections/rugs` — `gid://shopify/UrlRedirect/1691668808053`:
     - Current Target: `/collections/bath-mats` (Target is already active and correct)
  4. `/collections/mousepads` — `gid://shopify/UrlRedirect/1691668644213`:
     - Current Target: `/collections/desk-mats` (Target is already active and correct)

### 1.2 Verification of Active Target Collections
Querying the 101 collections live in Shopify Admin via GraphQL confirmed that all proposed target parent collections are active, published to the Online Store, and have healthy non-zero product inventories:

| Target Handle | Title | Product Count | Collection GID |
|---|---|---|---|
| `animals-wildlife` | Animals, Wildlife & Pet Portrait Art Collection | 278 | `gid://shopify/Collection/730285408629` |
| `apparel` | Graphic T-Shirts | 45 | `gid://shopify/Collection/438563340599` |
| `home-living` | Home & Living | 1,035 | `gid://shopify/Collection/495985787191` |
| `bath-mats` | Memory Foam Bath Mats | 120 | `gid://shopify/Collection/484716085559` |
| `canvas-prints` | Canvas Wall Art | 375 | `gid://shopify/Collection/437811249463` |
| `desk-mats` | Extended Desk Mats | 375 | `gid://shopify/Collection/486063046967` |
| `hoodies` | Graphic Hoodies | 45 | `gid://shopify/Collection/480381698359` |
| `blankets` | Plush Throw Blankets | 270 | `gid://shopify/Collection/486148210999` |
| `pillow-cases` | Cushion Covers | 270 | `gid://shopify/Collection/484418388279` |

### 1.3 Audit of the 15 Redirects with Literal `%20` Encoded Spaces in Target
Live query against Shopify Admin confirmed all 15 redirects verbatim:

| # | UrlRedirect GID | Source Path | Current Corrupted Target | Clean Product Handle Exists in Shopify? | Recommended Target Parent Collection |
|---|---|---|---|---|---|
| 1 | `gid://shopify/UrlRedirect/472276566327` | `/products/copy-of-tropical-nights-blanket-neon-cocktails-good-times` | `/products/neon%20throw%20blanket-tropical-nights-good-times` | `false` (null) | `/collections/blankets` |
| 2 | `gid://shopify/UrlRedirect/472276926775` | `/products/copy-of-spider-man-responsibility-and-heroism` | `/products/spiderman%20poster-responsibility-and-heroism` | `false` (null) | `/collections/canvas-prints` |
| 3 | `gid://shopify/UrlRedirect/472277123383` | `/products/copy-of-city-lights-symphony-a-glittering-abstract-art-deco-tapestry-hoodie-this-title` | `/products/abstract%20art%20hoodie-lights-symphony` | `false` (null) | `/collections/hoodies` |
| 4 | `gid://shopify/UrlRedirect/472277680439` | `/products/copy-of-sacred-journeys-a-mandala-elephants-spiritual-odyssey-hoodie-this` | `/products/elephant%20hoodie-spiritual-odyssey` | `false` (null) | `/collections/hoodies` |
| 5 | `gid://shopify/UrlRedirect/472277745975` | `/products/copy-of-capturing-times-essence-a-vintage-camera-and-film-reel-journey-hoodie-this-title` | `/products/vintage%20hoodies%20mens-vintage-camera-film-reel` | `false` (null) | `/collections/hoodies` |
| 6 | `gid://shopify/UrlRedirect/472278139191` | `/products/copy-of-mr-incredible-super-dad-super-hero` | `/products/the%20incredibles%20poster-mr-incredible` | `false` (null) | `/collections/canvas-prints` |
| 7 | `gid://shopify/UrlRedirect/472278925623` | `/products/copy-of-legacy-of-exploration-a-vintage-airplanes-timeless-journey-hoodie-this` | `/products/airplane%20hoodie-legacy-of-exploration` | `false` (null) | `/collections/hoodies` |
| 8 | `gid://shopify/UrlRedirect/472279482679` | `/products/copy-of-simba-the-lion-kings-legacy` | `/products/lion%20king%20painting-simba-the-lion-kings-legacy` | `false` (null) | `/collections/canvas-prints` |
| 9 | `gid://shopify/UrlRedirect/472377819447` | `/products/copy-of-lanterns-aglow-a-night-in-the-asian-market` | `/products/night%20life%20painting-of-lanterns-aglow-a-night-in-the-asian-market` | `false` (null) | `/collections/canvas-prints` |
| 10 | `gid://shopify/UrlRedirect/472377884983` | `/products/copy-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title` | `/products/retro%20hoodies-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title` | `false` (null) | `/collections/hoodies` |
| 11 | `gid://shopify/UrlRedirect/472378016055` | `/products/copy-of-invisible-jet-canvas-hoodie` | `/products/super%20hero%20sweatshirt-of-wonder-woman` | `false` (null) | `/collections/hoodies` |
| 12 | `gid://shopify/UrlRedirect/472381817143` | `/products/copy-of-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape-hoodie-this-title` | `/products/abstract%20art%20hoodie-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape` | `false` (null) | `/collections/hoodies` |
| 13 | `gid://shopify/UrlRedirect/472381915447` | `/products/copy-of-antarctic-capers-a-waddle-of-winter-fun-hoodie-this-title` | `/products/penguins%20sweatshirt-antarctic-capers-a-waddle-of-winter-fun-hoodie` | `false` (null) | `/collections/hoodies` |
| 14 | `gid://shopify/UrlRedirect/472382374199` | `/products/copy-of-geometric-symphony-a-rhythmic-dance-of-abstract-art-deco-elements-hoodie-this-title` | `/products/abstract%20art%20sweatshirt-geometric-symphony-hoodie` | `false` (null) | `/collections/hoodies` |
| 15 | `gid://shopify/UrlRedirect/472382898487` | `/products/copy-of-wheels-of-wonder-a-retro-roller-skate-adventure-hoodie-this-title` | `/products/rollerblade%20hoodie-wheels-of-wonder` | `false` (null) | `/collections/hoodies` |

**Critical Sub-observation**: Testing `productByHandle` in live Shopify GraphQL for all 15 hyphenated product target handles returned `null` for all 15. The products do not exist. Therefore, redirecting to hyphenated `/products/<handle>` would result in an HTTP 404 crawl trap. Directing them to their active parent collections (`/collections/blankets`, `/collections/canvas-prints`, `/collections/hoodies`) guarantees immediate HTTP 200 resolution without redirect loops or 404 errors.

### 1.4 Audit of Rogue Blog Redirect and Article Status
- **Rogue Redirect Verified Live**:
  ```json
  {
    "id": "gid://shopify/UrlRedirect/1701624414581",
    "path": "/blogs/news/uk-student-room-rental-flat-decor-guide",
    "target": "/collections/canvas-prints"
  }
  ```
- **Underlying Article Verified Live**:
  ```json
  {
    "id": "gid://shopify/Article/1016204886389",
    "title": "UK University Student Room & Rental Flat Decor Guide: Zero-Damage Wall Art, Throws & Desk Mats (2026)",
    "handle": "uk-student-room-rental-flat-decor-guide",
    "publishedAt": null,
    "isPublished": false
  }
  ```
- **Live Search**: Confirmed exactly 1 redirect exists on this path. No other redirects point to or from this guide.

### 1.5 Shopify Admin API GraphQL Mutation Schema (2025-01)
Inspecting the GraphQL introspection schema confirmed the exact signature and payloads for all required mutations:
- `urlRedirectCreate(urlRedirect: UrlRedirectInput!)`:
  - Returns `urlRedirect { id path target }`, `userErrors { field message }`
- `urlRedirectUpdate(id: ID!, urlRedirect: UrlRedirectInput!)`:
  - Returns `urlRedirect { id path target }`, `userErrors { field message }`
- `urlRedirectDelete(id: ID!)`:
  - Returns `deletedUrlRedirectId: ID`, `userErrors { field message }`

---

## 2. Logic Chain

1. **Premise 1**: The user requirement (ORIGINAL_REQUEST R2) mandates creating 301 redirects for all 28 discontinued legacy collections to their closest active parent collections.
2. **Observation Step**: In Shopify, `urlRedirectCreate` will reject with `Path has already been taken` if a redirect record already exists for `/collections/<handle>`.
3. **Deduction 1**: We must segregate the 28 collections into:
   - 22 `urlRedirectCreate` calls for handles that currently have no redirect.
   - 2 `urlRedirectUpdate` calls for `bottles` and `bags` where redirects already exist but point to non-optimal targets.
   - 4 no-op / verification calls for `pets-animals`, `posters`, `rugs`, and `mousepads` where redirects already exist and point to the exact desired target.
4. **Premise 2**: Redirects must never land on 404 pages or create multi-hop redirect chains.
5. **Observation Step**: The 15 `%20` redirects currently point to corrupted product paths like `/products/neon%20throw%20blanket-...`. All 15 underlying products are deleted (`productByHandle: null`). In addition, 7 secondary redirects exist that redirect some `%20` paths to the storefront root `https://printswithpassion.com/`, creating a 2-hop chain.
6. **Deduction 2**: Updating the target of these 15 redirects to their active parent collection (`/collections/blankets`, `/collections/canvas-prints`, or `/collections/hoodies`) immediately cures the `%20` encoding defect, terminates the secondary hop, and delivers a single, clean 301 redirect to active commercial catalog inventory.
7. **Premise 3**: The blog article `gid://shopify/Article/1016204886389` is a cornerstone SEO asset intended for organic indexing, but its canonical path `/blogs/news/uk-student-room-rental-flat-decor-guide` is intercepted by `gid://shopify/UrlRedirect/1701624414581`.
8. **Deduction 3**: Deleting `gid://shopify/UrlRedirect/1701624414581` via `urlRedirectDelete` removes the route interception. Coupled with publishing the article (`isPublished: true`), this restores the URL to HTTP 200 for Googlebot and human visitors.

---

## 3. Caveats

1. **Ordering of Deletions vs Redirects**:
   - In Shopify, an active collection resource takes routing precedence over a `urlRedirect` matching the same path.
   - Therefore, `collectionDelete` (handled by Explorer 1) and `urlRedirectCreate` / `urlRedirectUpdate` work hand-in-hand. Whether redirects are created slightly before or after `collectionDelete`, they will become active as 301s as soon as the collection is deleted. Creating redirects before or immediately following `collectionDelete` avoids any extended 404 window.
2. **Client Rate Limits (Leaky Bucket)**:
   - Shopify Admin API GraphQL operates on a 50-point/sec leaky bucket with 1,000 max capacity.
   - Milestone 2 involves:
     - 22 `urlRedirectCreate` calls
     - 17 `urlRedirectUpdate` calls (2 collection + 15 %20)
     - 1 `urlRedirectDelete` call
   - Total mutation calls: 40 mutations.
   - Pacing each call with a 250ms–300ms delay ensures total execution completes in ~12 seconds without ever exceeding Shopify rate limits or triggering HTTP 429 throttles.
3. **No Caveats on Target Collections**:
   - Every single parent collection was directly verified live to exist, be published, and contain between 45 and 1,035 active products.

---

## 4. Conclusion & Actionable Specification

### 4.1 Specification: 28 Legacy Collection Redirects

| # | Collection Handle | Source Path | Target Parent Path | Operational Action | Redirect GID (if existing) |
|---|---|---|---|---|---|
| 1 | `dog-collars` | `/collections/dog-collars` | `/collections/animals-wildlife` | `urlRedirectCreate` | New |
| 2 | `laundry-bags` | `/collections/laundry-bags` | `/collections/apparel` | `urlRedirectCreate` | New |
| 3 | `duffle-bags` | `/collections/duffle-bags` | `/collections/apparel` | `urlRedirectCreate` | New |
| 4 | `clutch-bags` | `/collections/clutch-bags` | `/collections/apparel` | `urlRedirectCreate` | New |
| 5 | `phone-cases` | `/collections/phone-cases` | `/collections/home-living` | `urlRedirectCreate` | New |
| 6 | `beach-towels` | `/collections/beach-towels` | `/collections/bath-mats` | `urlRedirectCreate` | New |
| 7 | `mugs` | `/collections/mugs` | `/collections/home-living` | `urlRedirectCreate` | New |
| 8 | `journals` | `/collections/journals` | `/collections/home-living` | `urlRedirectCreate` | New |
| 9 | `wall-tapestry` | `/collections/wall-tapestry` | `/collections/canvas-prints` | `urlRedirectCreate` | New |
| 10 | `puzzles` | `/collections/puzzles` | `/collections/home-living` | `urlRedirectCreate` | New |
| 11 | `shoes` | `/collections/shoes` | `/collections/apparel` | `urlRedirectCreate` | New |
| 12 | `hats` | `/collections/hats` | `/collections/apparel` | `urlRedirectCreate` | New |
| 13 | `bottles` | `/collections/bottles` | `/collections/home-living` | `urlRedirectUpdate` | `gid://shopify/UrlRedirect/1699588079989` |
| 14 | `tote-bags` | `/collections/tote-bags` | `/collections/apparel` | `urlRedirectCreate` | New |
| 15 | `suitcases` | `/collections/suitcases` | `/collections/apparel` | `urlRedirectCreate` | New |
| 16 | `yoga-mats` | `/collections/yoga-mats` | `/collections/bath-mats` | `urlRedirectCreate` | New |
| 17 | `makeup-bags` | `/collections/makeup-bags` | `/collections/home-living` | `urlRedirectCreate` | New |
| 18 | `coasters` | `/collections/coasters` | `/collections/home-living` | `urlRedirectCreate` | New |
| 19 | `pet-mat` | `/collections/pet-mat` | `/collections/bath-mats` | `urlRedirectCreate` | New |
| 20 | `bottle-opener` | `/collections/bottle-opener` | `/collections/home-living` | `urlRedirectCreate` | New |
| 21 | `pet-bowls` | `/collections/pet-bowls` | `/collections/animals-wildlife` | `urlRedirectCreate` | New |
| 22 | `bags` | `/collections/bags` | `/collections/apparel` | `urlRedirectUpdate` | `gid://shopify/UrlRedirect/1691668873589` |
| 23 | `bags-1` | `/collections/bags-1` | `/collections/apparel` | `urlRedirectCreate` | New |
| 24 | `pets-animals` | `/collections/pets-animals` | `/collections/animals-wildlife` | None (Already verified `/collections/animals-wildlife`) | `gid://shopify/UrlRedirect/1691668840821` |
| 25 | `can-cooler` | `/collections/can-cooler` | `/collections/home-living` | `urlRedirectCreate` | New |
| 26 | `posters` | `/collections/posters` | `/collections/canvas-prints` | None (Already verified `/collections/canvas-prints`) | `gid://shopify/UrlRedirect/1691668775285` |
| 27 | `rugs` | `/collections/rugs` | `/collections/bath-mats` | None (Already verified `/collections/bath-mats`) | `gid://shopify/UrlRedirect/1691668808053` |
| 28 | `mousepads` | `/collections/mousepads` | `/collections/desk-mats` | None (Already verified `/collections/desk-mats`) | `gid://shopify/UrlRedirect/1691668644213` |

### 4.2 Specification: 15 %20 Redirect Target Updates

All 15 execute via `urlRedirectUpdate`:

| # | UrlRedirect GID | Source Path | New Canonical Target Path |
|---|---|---|---|
| 1 | `gid://shopify/UrlRedirect/472276566327` | `/products/copy-of-tropical-nights-blanket-neon-cocktails-good-times` | `/collections/blankets` |
| 2 | `gid://shopify/UrlRedirect/472276926775` | `/products/copy-of-spider-man-responsibility-and-heroism` | `/collections/canvas-prints` |
| 3 | `gid://shopify/UrlRedirect/472277123383` | `/products/copy-of-city-lights-symphony-a-glittering-abstract-art-deco-tapestry-hoodie-this-title` | `/collections/hoodies` |
| 4 | `gid://shopify/UrlRedirect/472277680439` | `/products/copy-of-sacred-journeys-a-mandala-elephants-spiritual-odyssey-hoodie-this` | `/collections/hoodies` |
| 5 | `gid://shopify/UrlRedirect/472277745975` | `/products/copy-of-capturing-times-essence-a-vintage-camera-and-film-reel-journey-hoodie-this-title` | `/collections/hoodies` |
| 6 | `gid://shopify/UrlRedirect/472278139191` | `/products/copy-of-mr-incredible-super-dad-super-hero` | `/collections/canvas-prints` |
| 7 | `gid://shopify/UrlRedirect/472278925623` | `/products/copy-of-legacy-of-exploration-a-vintage-airplanes-timeless-journey-hoodie-this` | `/collections/hoodies` |
| 8 | `gid://shopify/UrlRedirect/472279482679` | `/products/copy-of-simba-the-lion-kings-legacy` | `/collections/canvas-prints` |
| 9 | `gid://shopify/UrlRedirect/472377819447` | `/products/copy-of-lanterns-aglow-a-night-in-the-asian-market` | `/collections/canvas-prints` |
| 10 | `gid://shopify/UrlRedirect/472377884983` | `/products/copy-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title` | `/collections/hoodies` |
| 11 | `gid://shopify/UrlRedirect/472378016055` | `/products/copy-of-invisible-jet-canvas-hoodie` | `/collections/hoodies` |
| 12 | `gid://shopify/UrlRedirect/472381817143` | `/products/copy-of-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape-hoodie-this-title` | `/collections/hoodies` |
| 13 | `gid://shopify/UrlRedirect/472381915447` | `/products/copy-of-antarctic-capers-a-waddle-of-winter-fun-hoodie-this-title` | `/collections/hoodies` |
| 14 | `gid://shopify/UrlRedirect/472382374199` | `/products/copy-of-geometric-symphony-a-rhythmic-dance-of-abstract-art-deco-elements-hoodie-this-title` | `/collections/hoodies` |
| 15 | `gid://shopify/UrlRedirect/472382898487` | `/products/copy-of-wheels-of-wonder-a-retro-roller-skate-adventure-hoodie-this-title` | `/collections/hoodies` |

### 4.3 Specification: Rogue Blog Guide Redirect Deletion
- **Mutation**: `urlRedirectDelete`
- **Variables**:
  ```json
  {
    "id": "gid://shopify/UrlRedirect/1701624414581"
  }
  ```

### 4.4 Concrete GraphQL Mutation Templates

#### Mutation 1: `urlRedirectCreate`
```graphql
mutation CreateRedirect($urlRedirect: UrlRedirectInput!) {
  urlRedirectCreate(urlRedirect: $urlRedirect) {
    urlRedirect {
      id
      path
      target
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Mutation 2: `urlRedirectUpdate`
```graphql
mutation UpdateRedirect($id: ID!, $urlRedirect: UrlRedirectInput!) {
  urlRedirectUpdate(id: $id, urlRedirect: $urlRedirect) {
    urlRedirect {
      id
      path
      target
    }
    userErrors {
      field
      message
    }
  }
}
```

#### Mutation 3: `urlRedirectDelete`
```graphql
mutation DeleteRedirect($id: ID!) {
  urlRedirectDelete(id: $id) {
    deletedUrlRedirectId
    userErrors {
      field
      message
    }
  }
}
```

---

## 5. Verification Method

### 5.1 Verification Commands via GraphQL

1. **Verify Deletion of Blog Redirect**:
   ```graphql
   query {
     urlRedirect(id: "gid://shopify/UrlRedirect/1701624414581") {
       id
       path
       target
     }
   }
   ```
   *Expected Result*: `urlRedirect: null`

2. **Verify 15 %20 Redirects Repaired**:
   Query each of the 15 GIDs:
   ```graphql
   query {
     r1: urlRedirect(id: "gid://shopify/UrlRedirect/472276566327") { target }
     r2: urlRedirect(id: "gid://shopify/UrlRedirect/472276926775") { target }
     r3: urlRedirect(id: "gid://shopify/UrlRedirect/472277123383") { target }
   }
   ```
   *Expected Result*: Every `target` does NOT contain `%20` and matches `/collections/blankets`, `/collections/canvas-prints`, or `/collections/hoodies`.

3. **Verify 28 Discontinued Collection Redirects**:
   For each handle:
   - Make an HTTP HEAD/GET request to `https://printswithpassion.com/collections/<handle>`:
     - Returns HTTP status `301 Moved Permanently` (or `302 Found`).
     - Header `Location` resolves to the designated active collection (e.g., `/collections/animals-wildlife`).

4. **Verify Blog Guide Live**:
   Make an HTTP GET request to `https://printswithpassion.com/blogs/news/uk-student-room-rental-flat-decor-guide`:
   - Returns HTTP status `200 OK`.
   - Title matches: `UK University Student Room & Rental Flat Decor Guide: Zero-Damage Wall Art, Throws & Desk Mats (2026)`.

### 5.2 Invalidation Conditions
- Any mutation returns non-empty `userErrors` (e.g. `Path has already been taken` or `UrlRedirect not found`).
- Any redirect target returns HTTP 404.
- Any redirect loops back on itself or causes multi-hop redirection.
- Any active collection has 0 products.
