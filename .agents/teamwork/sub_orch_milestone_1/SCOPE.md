# Scope: Milestone 1 — Homepage & Theme SEO Overhaul (Requirement R1)

## Architecture
- **Active Theme**: `gid://shopify/OnlineStoreTheme/177936466293` (Numeric ID: `177936466293`, Name: `2025-theme|OPT`)
- **Theme Assets**:
  - `snippets/head.liquid` (Homepage `<title>` and `<meta name="description">`)
  - `sections/header.liquid` (Demote logo badge from `h1` to `div`; repair malformed leading `/` in auth link at line 1796)
  - `templates/index.json` (Enrich hero headline so exactly 1 commercial `<h1>` renders on `/`)
  - `snippets/pwp-curated-collections-hub.liquid` (New snippet rendering crawlable links to all 48 smart sub-collections categorized under 6 parent collections)
  - `layout/theme.liquid` (Render hub snippet on index and the 6 parent collection handles)
- **Shopify Content & Settings**:
  - `GET/PUT /admin/api/2025-01/shop.json` & GraphQL (`shop.customer_email` update to `printswithpassionbc@gmail.com`)
  - Page `/pages/delivery-return` via `pageUpdate` mutation to replace `printswithpasssionbc@gmail.com` with `printswithpassionbc@gmail.com`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Homepage SEO Metadata | Update shop/homepage title (<=60 chars) to "Canvas Wall Art, XXL Desk Mats & Home Decor \| Prints With Passion" and meta description (140-158 chars) to "Shop archival framed canvas wall art (1.25\" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats." in `snippets/head.liquid` and `shop.description` | M1 | ORIGINAL_REQUEST R1 |
| 2 | Semantic <h1> Demotion | Demote decorative logo brand badge to `<div>` in `sections/header.liquid` (line 1065) and enrich hero headline in `templates/index.json` so exactly 1 semantic commercial `<h1>` renders on `/` | M1 | ORIGINAL_REQUEST R1 |
| 3 | Customer Auth URL Repair | Fix leading slash in `sections/header.liquid` line 1796 (`href="/{%- if customer...` -> `href="{%- if customer...`) to eliminate 404 crawl trap | M1 | ORIGINAL_REQUEST R1 |
| 4 | Contact Email Typo Correction | Cure `printswithpasssionbc@gmail.com` -> `printswithpassionbc@gmail.com` in shop settings (`shop.customer_email`) and `/pages/delivery-return` | M1 | ORIGINAL_REQUEST R1 |
| 5 | Curated Studio Hub Directory | Deploy `snippets/pwp-curated-collections-hub.liquid` and integrate into `layout/theme.liquid` placing all 48 smart sub-collections within 1 click of `/` and 6 parent collection pages | M1 | ORIGINAL_REQUEST R1 |

## Interface Contracts
### Theme Assets ↔ Live Storefront
- `snippets/head.liquid`: Emits `<title>` strictly `<= 60` chars on index: `Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion`, and `<meta name="description">` (140-158 chars) with plain text unescaped copy.
- `sections/header.liquid`: Sets `main_logo_tag = 'div'` on index, eliminates leading `/` from line 1796.
- `templates/index.json`: Enriches hero headline so exactly 1 commercial `<h1>` renders.
- `snippets/pwp-curated-collections-hub.liquid`: Contains semantic, responsive link directory for all 48 smart sub-collections grouped by parent:
  1. `/collections/canvas-prints` (8 sub-collections)
  2. `/collections/desk-mats` (8 sub-collections)
  3. `/collections/pillow-cases` (8 sub-collections)
  4. `/collections/blankets` (8 sub-collections)
  5. `/collections/bath-mats` (8 sub-collections)
  6. `/collections/apparel` (8 sub-collections)
- `layout/theme.liquid`: Renders `pwp-curated-collections-hub` when `template.name == 'index'` or on the 6 parent collection handles.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Phase 1 — Homepage & Theme SEO Overhaul (R1) | Features 1-5 | none | IN_PROGRESS |
