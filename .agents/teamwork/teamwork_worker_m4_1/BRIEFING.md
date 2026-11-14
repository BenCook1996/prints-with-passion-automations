# BRIEFING — 2026-11-14T03:30:00Z

## Mission
Implement and execute the production remediation script `remediate_pages_and_articles_seo.mjs` against live Shopify Admin GraphQL API to satisfy Milestone 4 (Features 14, 15, and 16).

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
- State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m4_1
- Original parent: 66755ac4-eeb3-414d-aa4d-be0b45896b18
- Milestone: Milestone 4 (Phase 4 — Page & Article SEO Remediation)

## 🔒 Key Constraints
- Production environment against live Shopify Admin GraphQL API
- Use shopifyGraphQL from lib/cloud-env.mjs
- Rate limiting / pacing (~250ms delay, ~4 calls/sec)
- Zero truncation, single h1 on pages, valid meta tags (title <= 60, desc 145-158)
- Real changes on live store, followed by live verification queries
- Do not cheat, fake, or mock live verification

## Current Parent
- Conversation ID: 66755ac4-eeb3-414d-aa4d-be0b45896b18
- Updated: 2026-11-14T03:30:00Z

## Task Summary
- **What to build**: Production script `remediate_pages_and_articles_seo.mjs` executing live Shopify GraphQL updates for:
  1. 36 Shopify pages: body h1 demotion to h2, entity sanitization, uk-product-catalog replacement, title_tag / description_tag metafields, contact-us typo fix.
  2. 25/26 Blog articles: repair truncated titles, update title_tag / description_tag, inject contextual internal cross-link blocks.
  3. Footer menu: add 3 orphaned pages (about-us, uk-product-catalog, studio-lookbook-social-feed) preserving existing 13 items.
- **Success criteria**: All pages & articles remediated and verified live, lint gates passing.
- **Interface contracts**: PROJECT.md, SCOPE.md, Explorer specs.
- **Code layout**: Root directory for script, state folder for logs and handoff.

## Key Decisions Made
- [TBD]

## Artifact Index
- `remediate_pages_and_articles_seo.mjs` — Production remediation script
- `.agents/teamwork/teamwork_worker_m4_1/progress.md` — Liveness & progress tracker
- `.agents/teamwork/teamwork_worker_m4_1/handoff.md` — Final 5-component handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not started
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending execution
- **Lint status**: Pending
- **Tests added/modified**: Pending verification script
