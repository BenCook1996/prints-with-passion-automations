# Scope: Milestone 3 (Active Collection SEO Metadata)

## Architecture
- **Shopify Admin GraphQL API (2025-01)** on `bencook96store.myshopify.com` (`https://printswithpassion.com/`).
- **Target Collections**: All active collections currently in `sitemap_collections_1.xml` (approx. 66–70 active collections including frontpage; excluding 28 discontinued collections handled in M2 and unpublishing AVADA upsell collection).
- **Execution Script**: Node.js script using `shopifyGraphQL` helper from `lib/cloud-env.mjs` executing `collectionUpdate` mutations.
- **Pacing**: ~2–4 calls/sec to stay within the 50-point/sec leaky bucket.

## Feature Inventory (Milestone 3)
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 11 | Active Collection Titles | Populate bespoke, word-boundary-safe `seo.title` (<=60 chars) across all active collections currently missing titles or showing default fallback values | M3 | ORIGINAL_REQUEST R3 |
| 12 | Active Collection Descriptions | Rewrite `seo.description` (140-158 chars) with plain text, zero double-escaped entities (`&quot;`, `&amp;quot;`, `&amp;`), zero broken template phrases | M3 | ORIGINAL_REQUEST R3 |
| 13 | Specific Collections Fix | Fix overwritten product title on `japanese-anime-desk-mats` and hard truncated title on `abstract-minimalist-bauhaus-canvas-wall-art` | M3 | ORIGINAL_REQUEST R3 |

## Interface Contracts
### Shopify Admin GraphQL API ↔ Remediation Script
- Mutation:
  ```graphql
  mutation updateCollectionSeo($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        handle
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  ```
- Constraints on `$input.seo`:
  - `title`: String, length >= 1 and <= 60 characters, word-boundary safe, high-intent commercial phrasing.
  - `description`: String, length >= 140 and <= 158 characters, plain text, grammatically complete sentence(s), no HTML entities (`&quot;`, `&amp;`), no template phrases (`Transform with...`, `Elevate with...`, `Style with...`, `Refresh with...`, `Upgrade with...`).

## Specific Target Collections
1. `/collections/japanese-anime-desk-mats`:
   - GID: `gid://shopify/Collection/730428473717`
   - Must be category-level title (<= 60 chars), NOT a single-product title.
2. `/collections/abstract-minimalist-bauhaus-canvas-wall-art`:
   - GID: `gid://shopify/Collection/730428801397`
   - Fix hard truncation at `(CM & I` to clean, complete title (<= 60 chars).

## Status
- Status: DONE
- Key Outputs:
  - `remediate_m3_collections_seo.mjs` (production bulk remediation script)
  - `snippets/head.liquid` (deployed to live theme 177936466293 with `&quot;` and `&#39;` unescaping patch)
  - `tests/audit_all_storefront_collections.mjs` (comprehensive 69-collection live storefront probe suite)
  - Live Shopify Admin: 73 collections 100% compliant with bespoke titles (<=60c) and descriptions (140-158c)
  - Live Storefront: 69 active collections crawled with 100% 200 OK, 0 `&amp;quot;` entities, clean category-level titles and descriptions
