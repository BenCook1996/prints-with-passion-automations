# Scope: Milestone 4 — Page & Article SEO Remediation (Requirement R4)

## Architecture
- **Target Platform**: Shopify Online Store theme `gid://shopify/OnlineStoreTheme/177936466293` on `bencook96store.myshopify.com` (`https://printswithpassion.com/`).
- **Data Stores**:
  - 36 static pages (`sitemap_pages_1.xml`), including 28 `*-uk-guide` pillar pages, `/pages/uk-product-catalog`, `/pages/contact-us`, `/pages/size-guide`, etc.
  - 25 blog articles (`sitemap_articles_1.xml`), including desk mat guides, canvas hanging rules, interior styling guides.
  - Footer navigation menu (`gid://shopify/Menu/221177086263`).
- **API Interfaces**: Shopify Admin GraphQL API (2025-01): `pageUpdate`, `articleUpdate`, `menuUpdate`; Shopify REST Asset API (`snippets/head.liquid`, `snippets/pwp-clean-footer-nav.liquid`).

## Feature Inventory
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 14 | Page Inner `<h1>` Conversion | Convert inner `<h1>` in `page.body` to `<h2>` across all 36 pages (including 28 `*-uk-guide`) so strictly 1 `<h1>` renders per page; sanitize `&amp;` artifacts to `&` | DONE |
| 15 | Page SEO Metadata & Links | Populate word-boundary-safe `seo.title` (<=60 chars) and clean `seo.description` (145-158 chars) for 36 pages; link 11 missing unindexed pages in `/pages/uk-product-catalog` and footer menu; fix `contact-us` email typo | DONE |
| 16 | Blog Article Titles & Internal Links | Repair mid-word truncated titles, populate `seo.title` (<=60 chars) and `seo.description` (145-158 chars) for 25 articles; inject contextual internal cross-links to uncrawled articles and smart sub-collections | DONE |

## Subtasks & Execution Flow
1. **Subtask 4.1: Forensic Analysis & Specification (Explorers 1, 2, 3)**: COMPLETED
   - Explorer 1: Inspected 36 Pages: inner `<h1>` presence, `&amp;` entity artifacts, current metadata vs proposed metadata, contact-us email typo.
   - Explorer 2: Inspected 25 Blog Articles: truncated titles, description lengths (145-158 chars), grammatical completeness, and SEO metadata.
   - Explorer 3: Inspected Internal Linking & Menus: 11 unindexed pages, `/pages/uk-product-catalog` structure, footer menu `gid://shopify/Menu/221177086263`, cross-links between indexed articles, 8 uncrawled articles, and 14 uncrawled smart sub-collections.
2. **Subtask 4.2: Implementation & Execution (Worker 3 & Worker 4)**: COMPLETED
   - Implemented and executed `remediate_pages_and_articles_seo.mjs` against live Admin API.
   - Iteration 2: Patched and deployed `snippets/head.liquid` to active theme `177936466293`, eliminating runtime phrase expansion.
   - Executed `execute_milestone_4_iteration_2_fixes.mjs` updating 16 descriptions and cleaning ampersands (`&` -> `and`).
   - Updated footer menu `gid://shopify/Menu/221177086263` and `snippets/pwp-clean-footer-nav.liquid` linking all unindexed pages.
3. **Subtask 4.3: Verification (Reviewers 1 & 2)**: COMPLETED
   - Verified 36 static pages (single H1, <=60 chars title, 145-158 chars meta description, zero &amp; artifacts, catalog links, contact typo).
   - Verified 26 blog articles (no truncated titles, <=60 chars title, 145-158 chars meta description, contextual cross-links, footer navigation).
4. **Subtask 4.4: Adversarial Testing (Challengers 1 & 2)**: COMPLETED
   - Challenger 1: Live storefront crawling of pages and articles via `tests/adversarial_challenger_m4_crawler.mjs` (339/339 passed, 0 failures -> APPROVE).
   - Challenger 2: Admin GraphQL verification via `tests/adversarial_challenger_m4_boundary_test.mjs` (913/913 passed, 0 failures -> APPROVE).
5. **Subtask 4.5: Forensic Audit (Auditor 1)**: COMPLETED
   - Audited scripts and live objects, verified authentic executions, zero cheating facades, binary veto CLEAN.
6. **Subtask 4.6: Gate Check**: COMPLETED (PASS)
   - Iteration 2 Gate Result: PASS.

## Interface Contracts
- `pageUpdate(id: ID!, page: PageUpdateInput!)`: Updates `body`, `seo: { title, description }`.
- `articleUpdate(id: ID!, article: ArticleUpdateInput!)`: Updates `title`, `body`, `seo: { title, description }`.
- `menuUpdate(id: ID!, title: String!, handle: String!, items: [MenuItemInput!]!)`: Adds missing navigation links to footer.
- `PUT /admin/api/2025-01/themes/177936466293/assets.json`: Theme asset deployment.
