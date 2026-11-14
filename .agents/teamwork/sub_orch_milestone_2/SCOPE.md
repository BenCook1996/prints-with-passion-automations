# Scope: Milestone 2 — Collection & Redirect Hygiene (Requirement R2)

## Architecture
- Module: Shopify Admin API GraphQL Client (`lib/cloud-env.mjs`) & Live GraphQL Endpoint `https://bencook96store.myshopify.com/admin/api/2025-01/graphql.json`
- Targets: 28 discontinued collections, 1 unpublishable app collection (AVADA), 1 blog redirect & draft article, 15 malformed `%20` redirect targets.
- Dependencies: None (M2 is independent and can execute immediately).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 6 | Delete 28 Legacy Collections | Execute `collectionDelete` for 28 0-product collections while strictly preserving `frontpage` (`gid://shopify/Collection/437768978743`) | M2 | ORIGINAL_REQUEST R2 |
| 7 | Create 301 Legacy Redirects | Establish server-side 301 redirects (`urlRedirectCreate` / `urlRedirectUpdate`) for all 28 legacy collection handles to active parent collections | M2 | ORIGINAL_REQUEST R2 |
| 8 | Unpublish AVADA Collection | Execute `publishableUnpublish` against Online Store publication (`gid://shopify/Publication/124388507959`) for `avada-upsell-best-sellers` (`gid://shopify/Collection/441651298615`) | M2 | ORIGINAL_REQUEST R2 |
| 9 | Blog Guide Redirect Fix & Publication | Delete redirect `gid://shopify/UrlRedirect/1701624414581` on `/blogs/news/uk-student-room-rental-flat-decor-guide` and publish article `gid://shopify/Article/1016204886389` | M2 | ORIGINAL_REQUEST R2 |
| 10 | Fix %20 Redirect Targets | Audit and repair 15 product redirects containing literal `%20` encoded spaces to clean canonical handles | M2 | ORIGINAL_REQUEST R2 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M2 | Collection & Redirect Hygiene | Execute R2 remediation across Shopify Admin API, verify with GraphQL & HTTP head checks | none | IN_PROGRESS |

## Interface Contracts & Constraints
1. `collectionDelete`: Must be executed only against the 28 validated GIDs. `gid://shopify/Collection/437768978743` (`frontpage`) MUST NEVER be deleted.
2. `publishableUnpublish`: Must unpublish `gid://shopify/Collection/441651298615` strictly from `gid://shopify/Publication/124388507959` (Online Store). Other publications must remain untouched so AVADA app functions.
3. `urlRedirectDelete`: Remove `gid://shopify/UrlRedirect/1701624414581`.
4. `articleUpdate`: Set `isPublished: true` on `gid://shopify/Article/1016204886389`.
5. `urlRedirectUpdate`: Fix 15 redirects containing `%20` in target to clean hyphenated paths or parent collections.
6. Rate limiting: Paced requests at <= 4 calls/sec to stay within Shopify API leaky bucket limits.
