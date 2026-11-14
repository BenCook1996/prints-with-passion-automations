# BRIEFING — 2026-11-13T00:39:30Z

## Mission
Investigate R2, R3, R4 (Phases 2, 3, 4 — Collections, Redirects, Pages, Articles) for Prints With Passion SEO recovery, verify Shopify Admin API, audit discontinued collections, broken redirects, active collections SEO metadata, static pages, and blog articles.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
- State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_survey_2
- Original parent: 06484a10-42e1-4890-aa95-00865dd7540f
- Milestone: Survey Phase 2 (R2, R3, R4)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / do NOT modify live store data or production files
- Scope strictly: Requirements R2, R3, R4
- Detailed evidence chain with exact GIDs, handles, URLs, and verified API outputs

## Current Parent
- Conversation ID: 06484a10-42e1-4890-aa95-00865dd7540f
- Updated: not yet

## Investigation State
- **Explored paths**:
  - Shopify Admin GraphQL (API 2025-01): verified HTTP 200 via OAuth2 client credentials (`lib/cloud-env.mjs`).
  - All 101 collections in Shopify Admin: identified 28 discontinued collections (all 0-product, all GIDs documented).
  - `frontpage` collection (`gid://shopify/Collection/437768978743`): confirmed 0 products, core Shopify object, must be preserved.
  - `avada-upsell-best-sellers` (`gid://shopify/Collection/441651298615`): confirmed in `sitemap_collections_1.xml`, published to Online Store (`gid://shopify/Publication/124388507959`).
  - 42,360 urlRedirects: identified 15 product redirects with `%20` encoded spaces; 164 `/blogs/` redirects.
  - `/blogs/news/uk-student-room-rental-flat-decor-guide`: identified broken redirect `gid://shopify/UrlRedirect/1701624414581` to `/collections/canvas-prints` and corresponding unpublished article `gid://shopify/Article/1016204886389`.
  - 70 collections in `sitemap_collections_1.xml`: 63 missing custom `seo.title` (null), 33 with broken template phrases (`Transform with...`).
  - R3 specific collections: `/collections/japanese-anime-desk-mats` (overwritten with product title) and `/collections/abstract-minimalist-bauhaus-canvas-wall-art` (truncated at `(CM & I`).
  - 36 pages in `sitemap_pages_1.xml`: 25 with inner `<h1>`, 34 with `&amp;`, 35 missing `title_tag`, 34 missing `description_tag`, 11 missing from catalog/footer.
  - 25 articles in `sitemap_articles_1.xml`: all missing `title_tag` and `description_tag`, mid-word truncated titles.
- **Key findings**:
  - Full evidence chain compiled and documented with zero assumptions.
  - Exact remediation mutations and queries designed and validated.
  - 100% compliant title and description templates generated for all collections, pages, and articles.
- **Unexplored areas**:
  - None within R2, R3, R4 scope.

## Key Decisions Made
- Exclude `frontpage` from deletion to avoid breaking Shopify core theme dependencies.
- Map discontinued collections to their closest functional parent (`apparel`, `home-living`, `bath-mats`, `canvas-prints`, `desk-mats`, `animals-wildlife`).
- Unpublish `avada-upsell-best-sellers` from Online Store publication (`gid://shopify/Publication/124388507959`) instead of deleting it.
- Delete the broken redirect on `/blogs/news/uk-student-room-rental-flat-decor-guide` and publish the article (`publishedAt: now`).
- Replace inner `<h1>` on pages with `<h2>` and populate `global.title_tag` and `global.description_tag` metafields.

## Artifact Index
- `handoff.md` — Full 5-component survey and specification report
- `all_collections.json` — Raw snapshot of all 101 collections in Shopify Admin
- `all_redirects.json` — Raw snapshot of all 42,360 urlRedirects in Shopify
- `discontinued_28_details.json` — Exact GIDs, handles, titles, counts for 28 legacy collections
- `avada_publications.json` — Channel publication breakdown for AVADA collection
- `active_collections_seo_audit.json` — Complete audit of all 70 active collections
- `fitted_collection_proposals.json` — 100% compliant title and description proposals for collections
- `audited_pages.json` & `page_seo_proposals.json` — Complete audit and proposals for 36 pages
- `audited_articles.json` & `article_seo_proposals.json` — Complete audit and proposals for 25 articles
- `progress.md` — Liveness heartbeat
- `DISPATCH.md` — Incoming messages log
