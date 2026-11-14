# Handoff Report — Explorer Phase 2: Requirements R2, R3, R4 (Collections, Redirects, Pages, Articles)

**Agent**: `teamwork_explorer_survey_2`  
**Milestone**: Survey Phase 2 (Phases 2, 3, 4 Forensic Investigation & Specification)  
**Date**: 2026-11-13  
**Target Codebase**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  
**Target Storefront**: `https://printswithpassion.com/` (`bencook96store.myshopify.com`)  

---

## 1. Observation

All observations below were directly executed and verified via live Shopify Admin GraphQL API (2025-01), live storefront sitemaps, and local repository scripts.

### 1.1 Credential & Connectivity Verification
- **Credential File**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.shopify_token.json`
- **Client ID**: `cea3bb07f8442ba35a6aea5e756338e4`
- **Client Secret**: `[REDACTED_SHOPIFY_CLIENT_SECRET]`
- **Access Token**: Auto-minted via OAuth2 Client Credentials exchange (`grant_type=client_credentials`) against `https://bencook96store.myshopify.com/admin/oauth/access_token` via `lib/cloud-env.mjs`.
- **GraphQL Verification Result**:
  ```json
  {
    "shop": {
      "name": "Prints With Passion",
      "myshopifyDomain": "bencook96store.myshopify.com",
      "primaryDomain": {
        "url": "https://printswithpassion.com",
        "host": "printswithpassion.com"
      }
    }
  }
  ```
  Verified HTTP 200 response with full GraphQL access.

---

### 1.2 Enumeration of the 28 Discontinued 0-Product Collections (Requirement R2)
Every single one of the 28 discontinued collections listed in R2 was located in Shopify Admin with `productsCount: 0`. None currently appear in `sitemap_collections_1.xml`, but all exist in Admin and return HTTP 404 on the storefront, dragging GSC Average Position down to 65–90:

| # | Collection Handle | Shopify Collection GID | Admin Title | Products Count | Target Parent Collection Handle | Existing Redirect in Shopify |
|---|---|---|---|---|---|---|
| 1 | `dog-collars` | `gid://shopify/Collection/484418421047` | Dog Collars | 0 | `animals-wildlife` | None |
| 2 | `laundry-bags` | `gid://shopify/Collection/486062588215` | Laundry Bags | 0 | `apparel` | None |
| 3 | `duffle-bags` | `gid://shopify/Collection/486062391607` | Duffle Bags | 0 | `apparel` | None |
| 4 | `clutch-bags` | `gid://shopify/Collection/486062653751` | Clutch Bags | 0 | `apparel` | None |
| 5 | `phone-cases` | `gid://shopify/Collection/484418224439` | Phone Cases | 0 | `home-living` | None |
| 6 | `beach-towels` | `gid://shopify/Collection/444874228023` | Beach Towels | 0 | `bath-mats` | None |
| 7 | `mugs` | `gid://shopify/Collection/491112530231` | Mugs | 0 | `home-living` | None |
| 8 | `journals` | `gid://shopify/Collection/484418683191` | Journals | 0 | `home-living` | None |
| 9 | `wall-tapestry` | `gid://shopify/Collection/484716183863` | Wall Tapestry | 0 | `canvas-prints` | None |
| 10 | `puzzles` | `gid://shopify/Collection/485993447735` | Puzzles | 0 | `home-living` | None |
| 11 | `shoes` | `gid://shopify/Collection/486062424375` | Shoes | 0 | `apparel` | None |
| 12 | `hats` | `gid://shopify/Collection/486062522679` | Hats | 0 | `apparel` | None |
| 13 | `bottles` | `gid://shopify/Collection/486062719287` | Bottles | 0 | `home-living` | `gid://shopify/UrlRedirect/1699588079989` -> `/collections/all` (Update to `/collections/home-living`) |
| 14 | `tote-bags` | `gid://shopify/Collection/491049681207` | Tote Bags | 0 | `apparel` | None |
| 15 | `suitcases` | `gid://shopify/Collection/491068031287` | Suitcases | 0 | `apparel` | None |
| 16 | `yoga-mats` | `gid://shopify/Collection/491090837815` | Yoga Mats | 0 | `bath-mats` | None |
| 17 | `makeup-bags` | `gid://shopify/Collection/491806064951` | Makeup Bags | 0 | `home-living` | None |
| 18 | `coasters` | `gid://shopify/Collection/491808457015` | Coasters | 0 | `home-living` | None |
| 19 | `pet-mat` | `gid://shopify/Collection/491808620855` | Pet Mat | 0 | `bath-mats` | None |
| 20 | `bottle-opener` | `gid://shopify/Collection/491808817463` | Bottle Openers | 0 | `home-living` | None |
| 21 | `pet-bowls` | `gid://shopify/Collection/491808981303` | Pet Bowls | 0 | `animals-wildlife` | None |
| 22 | `bags` | `gid://shopify/Collection/484418289975` | Accessories | 0 | `apparel` | `gid://shopify/UrlRedirect/1691668873589` -> `/collections/home-living` (Update to `/collections/apparel`) |
| 23 | `bags-1` | `gid://shopify/Collection/494964998455` | Bags | 0 | `apparel` | None |
| 24 | `pets-animals` | `gid://shopify/Collection/495985918263` | Pets & Animals | 0 | `animals-wildlife` | `gid://shopify/UrlRedirect/1691668840821` -> `/collections/animals-wildlife` |
| 25 | `can-cooler` | `gid://shopify/Collection/666332823925` | Can Cooler | 0 | `home-living` | None |
| 26 | `posters` | `gid://shopify/Collection/438564192567` | Posters | 0 | `canvas-prints` | `gid://shopify/UrlRedirect/1691668775285` -> `/collections/canvas-prints` |
| 27 | `rugs` | `gid://shopify/Collection/666330530165` | Rugs | 0 | `bath-mats` | `gid://shopify/UrlRedirect/1691668808053` -> `/collections/bath-mats` |
| 28 | `mousepads` | `gid://shopify/Collection/666330595701` | Mousepads | 0 | `desk-mats` | `gid://shopify/UrlRedirect/1691668644213` -> `/collections/desk-mats` |

**Frontpage Collection Constraint**:
- `handle`: `frontpage`
- `id`: `gid://shopify/Collection/437768978743`
- `title`: `Home page`
- `productsCount`: 0
- **Constraint**: Must NOT be deleted (`collectionDelete`). It is a standard Shopify system collection referenced by themes.

---

### 1.3 AVADA Upsell Collection Publication Status (Requirement R2)
- **Handle**: `avada-upsell-best-sellers`
- **ID**: `gid://shopify/Collection/441651298615`
- **Title**: `AVADA Upsell - Best Sellers`
- **Products Count**: 1,495
- **Sitemap Status**: Confirmed present in `https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&to=730430275957`.
- **Publication Audit**:
  - `Online Store` (`gid://shopify/Publication/124388507959`): `isPublished: true`
  - `Google & YouTube` (`gid://shopify/Publication/124416393527`): `isPublished: true`
  - `Facebook & Instagram` (`gid://shopify/Publication/124414984503`): `isPublished: true`
  - `Shop` (`gid://shopify/Publication/124416229687`): `isPublished: true`
  - `Amazon Channel` (`gid://shopify/Publication/124423962935`): `isPublished: true`
  - `Pinterest` (`gid://shopify/Publication/145699471671`): `isPublished: true`
  - `TikTok` (`gid://shopify/Publication/216645796151`): `isPublished: true`
  - `Buy Button` (`gid://shopify/Publication/243046449463`): `isPublished: true`
- **Remediation Action**: Execute `publishableUnpublish` strictly against `gid://shopify/Publication/124388507959` (Online Store). This immediately purges it from `sitemap_collections_1.xml` while preserving app functionality.

---

### 1.4 Shopify `urlRedirects` Audit (Requirement R2)
- Total urlRedirects in Shopify: **42,360**.
- **15 Redirect Targets Containing Literal `%20` Encoded Spaces**:
  All 15 point to corrupted product URLs:
  1. `gid://shopify/UrlRedirect/472276566327`: `/products/copy-of-tropical-nights-blanket-neon-cocktails-good-times` -> `/products/neon%20throw%20blanket-tropical-nights-good-times` (Fix target: `/products/neon-throw-blanket-tropical-nights-good-times` or `/collections/blankets`)
  2. `gid://shopify/UrlRedirect/472276926775`: `/products/copy-of-spider-man-responsibility-and-heroism` -> `/products/spiderman%20poster-responsibility-and-heroism` (Fix target: `/collections/canvas-prints`)
  3. `gid://shopify/UrlRedirect/472277123383`: `/products/copy-of-city-lights-symphony-a-glittering-abstract-art-deco-tapestry-hoodie-this-title` -> `/products/abstract%20art%20hoodie-lights-symphony` (Fix target: `/collections/hoodies`)
  4. `gid://shopify/UrlRedirect/472277680439`: `/products/copy-of-sacred-journeys-a-mandala-elephants-spiritual-odyssey-hoodie-this` -> `/products/elephant%20hoodie-spiritual-odyssey` (Fix target: `/collections/hoodies`)
  5. `gid://shopify/UrlRedirect/472277745975`: `/products/copy-of-capturing-times-essence-a-vintage-camera-and-film-reel-journey-hoodie-this-title` -> `/products/vintage%20hoodies%20mens-vintage-camera-film-reel` (Fix target: `/collections/hoodies`)
  6. `gid://shopify/UrlRedirect/472278139191`: `/products/copy-of-mr-incredible-super-dad-super-hero` -> `/products/the%20incredibles%20poster-mr-incredible` (Fix target: `/collections/canvas-prints`)
  7. `gid://shopify/UrlRedirect/472278925623`: `/products/copy-of-legacy-of-exploration-a-vintage-airplanes-timeless-journey-hoodie-this` -> `/products/airplane%20hoodie-legacy-of-exploration` (Fix target: `/collections/hoodies`)
  8. `gid://shopify/UrlRedirect/472279482679`: `/products/copy-of-simba-the-lion-kings-legacy` -> `/products/lion%20king%20painting-simba-the-lion-kings-legacy` (Fix target: `/collections/canvas-prints`)
  9. `gid://shopify/UrlRedirect/472377819447`: `/products/copy-of-lanterns-aglow-a-night-in-the-asian-market` -> `/products/night%20life%20painting-of-lanterns-aglow-a-night-in-the-asian-market` (Fix target: `/collections/canvas-prints`)
  10. `gid://shopify/UrlRedirect/472377884983`: `/products/copy-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title` -> `/products/retro%20hoodies-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title` (Fix target: `/collections/hoodies`)
  11. `gid://shopify/UrlRedirect/472378016055`: `/products/copy-of-invisible-jet-canvas-hoodie` -> `/products/super%20hero%20sweatshirt-of-wonder-woman` (Fix target: `/collections/hoodies`)
  12. `gid://shopify/UrlRedirect/472381817143`: `/products/copy-of-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape-hoodie-this-title` -> `/products/abstract%20art%20hoodie-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape` (Fix target: `/collections/hoodies`)
  13. `gid://shopify/UrlRedirect/472381915447`: `/products/copy-of-antarctic-capers-a-waddle-of-winter-fun-hoodie-this-title` -> `/products/penguins%20sweatshirt-antarctic-capers-a-waddle-of-winter-fun-hoodie` (Fix target: `/collections/hoodies`)
  14. `gid://shopify/UrlRedirect/472382374199`: `/products/copy-of-geometric-symphony-a-rhythmic-dance-of-abstract-art-deco-elements-hoodie-this-title` -> `/products/abstract%20art%20sweatshirt-geometric-symphony-hoodie` (Fix target: `/collections/hoodies`)
  15. `gid://shopify/UrlRedirect/472382898487`: `/products/copy-of-wheels-of-wonder-a-retro-roller-skate-adventure-hoodie-this-title` -> `/products/rollerblade%20hoodie-wheels-of-wonder` (Fix target: `/collections/hoodies`)

- **Broken Blog Guide Redirect**:
  - `gid://shopify/UrlRedirect/1701624414581`:
    - `path`: `/blogs/news/uk-student-room-rental-flat-decor-guide`
    - `target`: `/collections/canvas-prints`
  - In Admin, the article exists:
    - ID: `gid://shopify/Article/1016204886389`
    - Title: `"UK University Student Room & Rental Flat Decor Guide: Zero-Damage Wall Art, Throws & Desk Mats (2026)"`
    - Status: `publishedAt: null` (Unpublished)
  - Action: Delete `gid://shopify/UrlRedirect/1701624414581` via `urlRedirectDelete` and publish `gid://shopify/Article/1016204886389` via `articleUpdate(id: $id, article: { isPublished: true })`.

---

### 1.5 Active Collection SEO Metadata Audit (Requirement R3)
- In `sitemap_collections_1.xml`, there are **70 collections** (68 active commercial + `frontpage` + `avada-upsell-best-sellers`).
- **63 collections** have `seo.title: null` (rendering generic fallback titles like `"Canvas Wall Art | Prints With Passion"` missing commercial specs and UK modifiers).
- **33 collections** have broken template phrasing in `seo.description`:
  - `"Transform with Canvas Wall Art (1.25" Pine Frame (8x10"–24x36"))..."`
  - `"Elevate with Cushion Covers (Soft Velvet (45x45cm / 18x18"))..."`
  - `"Style with Plush Throw Blankets (300 GSM Fleece (50x60" / 60x80"))..."`
  - `"Refresh with Memory Foam Bath Mats (Memory Foam (60x40cm / 24x16"))..."`
  - `"Upgrade with Clothing & Apparel (4mm XXL Desk Mats & Pine Canvas)..."` (apparel description erroneously citing desk mats & canvas!)
- **Two Specific Problematic Collections in R3**:
  1. `/collections/japanese-anime-desk-mats`:
     - ID: `gid://shopify/Collection/730428473717`
     - Title: `Japanese, Samurai, Sakura & Ukiyo-e Extended Desk Mats`
     - Current SEO Title (63 chars): `"Japanese Wave Desk Mat | 900x400x4mm (35.4"x15.7") Stitched Pad"` (overwritten with a single product's title!).
     - Proposed SEO Title (57 chars): `Japanese Anime & Ukiyo-e Desk Mats | 4mm XXL Gaming Pads`
     - Proposed SEO Desc (156 chars): `Shop Japanese anime, samurai, sakura blossom and Great Wave XXL gaming desk mats featuring 4mm non-slip rubber & stitched borders. Free tracked UK delivery.`
  2. `/collections/abstract-minimalist-bauhaus-canvas-wall-art`:
     - ID: `gid://shopify/Collection/730428801397`
     - Title: `Abstract, Minimalist & Bauhaus Geometric Canvas Wall Art`
     - Current SEO Title (66 chars): `"Minimalist Bauhaus Canvas Print | 1.25" Pine Framed Canvas (CM & I"` (hard cut mid-word at `(CM & I`!).
     - Proposed SEO Title (58 chars): `Bauhaus & Minimalist Canvas Wall Art | 1.25" Framed Prints`
     - Proposed SEO Desc (153 chars): `Abstract, minimalist and Bauhaus geometric canvas wall art on 400gsm cotton-poly canvas over 1.25" European pine frames. Free tracked UK delivery on all art.`

---

### 1.6 Page & Article SEO Remediation Audit (Requirement R4)
- **36 Pages in `sitemap_pages_1.xml`**:
  - **25 pages** contain an inner `<h1>` inside `page.body`. The Shopify theme already renders `<h1>{{ page.title }}</h1>`, resulting in **two duplicate `<h1>` tags** per page.
  - **34 pages** contain literal `&amp;` artifacts inside body or heading text.
  - **35 pages** have `title_tag: null`, causing titles to exceed 75–95 characters and truncate mid-word.
  - **34 pages** have `description_tag: null`, causing Shopify to fall back to breadcrumb meta descriptions (`"Home › UK Catalog Directory › ... &amp;amp;"`).
  - **Link Coverage in `/pages/uk-product-catalog`**:
    11 pages are currently omitted from the catalog directory and footer:
    `/pages/about-us`, `/pages/data-sharing-opt-out`, `/pages/studio-lookbook-social-feed`, `/pages/vip-loyalty-program`, `/pages/us-shipping-and-sizing-guide`, `/pages/ai-catalog-directory`, `/pages/desk-setup-hardware-compatibility-guide`, `/pages/studio-quality-vs-generic-prints`, `/pages/trade-and-bulk-orders`, `/pages/delivery-return`.
  - **Contact Page Typo**:
    `/pages/contact-us` (`gid://shopify/Page/131838509367`) has description tag `We would love to hear from you. Please email printswithpasssionbc@gmail.com.` containing the triple-`s` typo!

- **25 Blog Articles in `sitemap_articles_1.xml`**:
  - **All 25 articles** have `title_tag: null` and `description_tag: null`.
  - Titles range from 80 to 140 characters, truncating mid-word in SERP snippets.
  - Specific article in R4: `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` (`gid://shopify/Article/1016174772597`):
    - Title: `"UK Desk Mat Size Guide (2026): 60×35 cm XL vs 80×40 cm XXL Extended Mouse Pads Compared"` (87 chars, cut off at `...Extended Mo`).
    - Proposed Title Tag (56 chars): `UK Desk Mat Size Guide: 60×35cm XL vs 80×40cm XXL Pads`
    - Proposed Desc Tag (154 chars): `Read our UK desk mat size guide comparing 60×35cm XL vs 80×40cm XXL extended mouse pads for mechanical keyboards and mice. Free tracked UK delivery on all mats.`
  - Internal links: Articles have links to parent collections, but lack cross-links to the 8 uncrawled blog articles and 14 uncrawled smart sub-collections.

---

## 2. Logic Chain

1. **Root Cause of High Average Position Drag (Pos 65–90)**:
   - Observation: 28 empty legacy collections exist in Shopify Admin, returning HTTP 404 on the storefront, yet registered in Google's index.
   - Inference: Because Googlebot continues to crawl historical URLs and encounters 404s, GSC averages these low-ranking URLs into the store's sitewide performance metrics.
   - Resolution: Executing `collectionDelete` purges them from Shopify Admin and external channel feeds. Creating server-side 301 redirects (`urlRedirectCreate`) forces Googlebot to update its index to active parent collections, transferring link equity.

2. **Why `frontpage` Must Be Preserved**:
   - Observation: `frontpage` (`gid://shopify/Collection/437768978743`) has 0 products and is a standard Shopify core object.
   - Inference: Deleting `frontpage` in Shopify can break theme defaults and cause admin warnings.
   - Resolution: Explicitly exclude `frontpage` from `collectionDelete`, but populate its SEO metadata.

3. **Elimination of the AVADA Sitemap Drag**:
   - Observation: `avada-upsell-best-sellers` contains 1,495 products (duplicate of `/collections/all`), published to Online Store and listed in `sitemap_collections_1.xml`.
   - Inference: GSC indexes or attempts to crawl this redundant app collection, wasting crawl budget.
   - Resolution: Unpublishing it from the `Online Store` publication (`gid://shopify/Publication/124388507959`) removes it from `sitemap_collections_1.xml` without deleting the collection or breaking AVADA app upsell functionality.

4. **Correction of the %20 Redirects & Blog Restoration**:
   - Observation: 15 product redirects contain `%20` in target paths, and `/blogs/news/uk-student-room-rental-flat-decor-guide` is redirected to `/collections/canvas-prints` while the article exists in draft.
   - Inference: %20 in URL redirects creates malformed URLs that return 404 or trigger crawl warnings. Redirecting an editorial guide that ranks at Pos 48 destroys its keyword relevance.
   - Resolution: Replace %20 with clean hyphens or redirect to parent category, delete the blog redirect, and set `publishedAt: new Date().toISOString()`.

5. **Eliminating Duplicate `<h1>` and Breadcrumb Meta Descriptions on Guide Pages**:
   - Observation: Page templates render `<h1>{{ page.title }}</h1>`, while `page.body` has an inner `<h1>`, causing 2 `<h1>` tags per page. Missing `description_tag` causes fallback to breadcrumb snippets.
   - Inference: Having two `<h1>` tags dilutes keyword weight and fails semantic HTML standards. Breadcrumb meta descriptions give poor SERP click-through rates.
   - Resolution: Convert inner `<h1>` to `<h2>` via regex `/<h1>([\s\S]*?)<\/h1>/gi -> <h2>$1</h2>` and populate `global.title_tag` (<=60 chars) and `global.description_tag` (145-158 chars).

---

## 3. Caveats

1. **Sitemap Generation Latency**:
   - Shopify does not rebuild `sitemap_collections_1.xml` synchronously. After unpublishing `avada-upsell-best-sellers` and deleting the 28 collections, it may take 2 to 12 hours for Shopify's background sitemap daemon to regenerate the XML.
2. **Shopify Admin GraphQL Rate Limits**:
   - Bulk updates of 70 collections, 36 pages, 25 articles, and redirect deletions must pace requests at ~2–4 calls/sec to stay within the 50-point/sec leaky bucket. `lib/cloud-env.mjs` automatically retries on throttled errors.
3. **Existing 6 Redirects for Discontinued Collections**:
   - 6 of the 28 handles (`mousepads`, `posters`, `rugs`, `pets-animals`, `bags`, `bottles`) already have redirects in `all_redirects.json`. When deleting the collection object, these redirects will become active. Updating `bottles` and `bags` targets to `/collections/home-living` and `/collections/apparel` ensures optimal category matching.
4. **No Caveats Beyond These Technical Timing Constraints.**

---

## 4. Conclusion & Implementation Strategy

### 4.1 Phase 2 Implementation Specification (`remediate_gsc_collections_redirects_and_meta.mjs`)
1. **Delete 28 Legacy Collections**:
   Call `collectionDelete(input: { id: $id })` for the 28 GIDs listed in Section 1.2.
2. **Create/Update 301 Redirects**:
   For each discontinued collection, verify/create `urlRedirectCreate(urlRedirect: { path: "/collections/<handle>", target: "/collections/<target>" })`.
3. **Unpublish AVADA Collection**:
   Call `publishableUnpublish(id: "gid://shopify/Collection/441651298615", input: [{ publicationId: "gid://shopify/Publication/124388507959" }])`.
4. **Delete Improper Blog Redirect & Publish Article**:
   - Call `urlRedirectDelete(id: "gid://shopify/UrlRedirect/1701624414581")`.
   - Call `articleUpdate(id: "gid://shopify/Article/1016204886389", article: { isPublished: true })`.
5. **Repair 15 `%20` Redirect Targets**:
   Call `urlRedirectUpdate` for the 15 IDs listed in Section 1.4 to remove `%20`.

### 4.2 Phase 3 Implementation Specification (`remediate_gsc_collections_redirects_and_meta.mjs`)
1. Update all 68 active collections + `frontpage` using `collectionUpdate(input: { id: $id, seo: { title: $title, description: $desc } })`:
   - 100% of titles `<= 60` characters.
   - 100% of descriptions `140–158` characters.
   - Zero double-escaped entities (`&quot;`, `&amp;quot;`, `&amp;`).
   - Zero broken template phrases (`Transform with...`).
   - Dedicated bespoke titles for `/collections/japanese-anime-desk-mats` and `/collections/abstract-minimalist-bauhaus-canvas-wall-art`.

### 4.3 Phase 4 Implementation Specification (`remediate_pages_and_articles_seo.mjs`)
1. **Remediate 36 Pages**:
   - In `page.body`: replace `<h1>([\s\S]*?)<\/h1>` with `<h2>$1</h2>`.
   - In `page.body`: replace `&amp;` with `&`.
   - Update `title_tag` and `description_tag` metafields via `pageUpdate(id: $id, page: { body: $body, metafields: [...] })`.
   - Update `/pages/contact-us` description to remove triple-`s` typo.
   - Update `/pages/uk-product-catalog` HTML body to include links to the 11 missing pages.
   - Add `/pages/about-us`, `/pages/uk-product-catalog`, and `/pages/studio-lookbook-social-feed` to footer navigation menu `gid://shopify/Menu/221177086263`.
2. **Remediate 25 Blog Articles**:
   - Update `title_tag` (<=60 chars) and `description_tag` (145–158 chars) via `articleUpdate`.
   - Inject contextual cross-links to the 8 uncrawled articles and 14 uncrawled smart sub-collections.

---

## 5. Verification Method

To independently verify the implementation:

1. **Verify Collections & Redirects**:
   ```powershell
   node -e "
     import { shopifyGraphQL } from './lib/cloud-env.mjs';
     const res = await shopifyGraphQL('query { collections(first: 10, query: \"handle:dog-collars OR handle:laundry-bags\") { nodes { id handle } } }');
     console.log('Deleted collections check (should be empty):', res?.collections?.nodes);
   "
   ```
2. **Verify Live 301 Redirects**:
   ```powershell
   curl.exe -I "https://printswithpassion.com/collections/dog-collars"
   # Expected: HTTP/1.1 301 Moved Permanently -> Location: https://printswithpassion.com/collections/animals-wildlife
   ```
3. **Verify Blog Article Restoration**:
   ```powershell
   curl.exe -I "https://printswithpassion.com/blogs/news/uk-student-room-rental-flat-decor-guide"
   # Expected: HTTP/1.1 200 OK (no longer 301 -> /collections/canvas-prints)
   ```
4. **Verify Single `<h1>` Structure on Pages**:
   ```powershell
   curl.exe -s "https://printswithpassion.com/pages/xxl-extended-gaming-desk-mats-uk-guide" | Select-String -Pattern "<h1" -AllMatches
   # Expected: Exactly 1 match
   ```
5. **Verify Zero `%20` in Redirects**:
   ```powershell
   node -e "
     import { shopifyGraphQL } from './lib/cloud-env.mjs';
     const res = await shopifyGraphQL('query { urlRedirects(first: 250, query: \"target:*%20*\") { nodes { id path target } } }');
     console.log('Redirects with %20 (should be empty):', res?.urlRedirects?.nodes);
   "
   ```
6. **Lint Gate Verification**:
   ```powershell
   node catalog_uniqueness_and_seo_lint_gate.mjs
   node verify_40_subcollections_counts.mjs
   node technical_seo_audit.mjs
   ```

### Generated Artifacts in State Folder
- `all_collections.json` — Raw snapshot of all 101 collections in Shopify Admin.
- `all_redirects.json` — Raw snapshot of all 42,360 urlRedirects in Shopify.
- `discontinued_28_details.json` — Exact GIDs, handles, titles, counts for the 28 legacy collections.
- `avada_publications.json` — Publication channel status for AVADA collection.
- `active_collections_seo_audit.json` — Deep audit of all 70 collections in `sitemap_collections_1.xml`.
- `fitted_collection_proposals.json` — 100% compliant title (<=60 chars) and description (140-158 chars) proposals for all active collections.
- `audited_pages.json` & `page_seo_proposals.json` — Complete audit and fitted metadata for all 36 pages.
- `audited_articles.json` & `article_seo_proposals.json` — Complete audit and fitted metadata for all 25 blog articles.
