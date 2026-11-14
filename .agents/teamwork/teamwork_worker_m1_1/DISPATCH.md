# DISPATCH — Worker 1 (Milestone 1 Implementation)

## 2026-11-13T01:09:00Z

You are Worker 1 for Milestone 1 (Phase 1 — Homepage & Theme SEO Overhaul) of the Prints With Passion Google Search Console recovery project.

Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m1_1

MANDATORY FIRST STEP:
Read the authoritative user request at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md

Read the project plan at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md

Read the milestone scope at:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_1\SCOPE.md

Read the three Explorer handoff reports:
1. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_1\handoff.md
2. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_2\handoff.md
3. C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write ownership:
You exclusively own the implementation of Milestone 1:
- Shopify theme assets on active theme `gid://shopify/OnlineStoreTheme/177936466293` (`2025-theme|OPT`):
  1. `snippets/head.liquid`
  2. `sections/header.liquid`
  3. `templates/index.json`
  4. `snippets/pwp-curated-collections-hub.liquid`
  5. `layout/theme.liquid`
- Shopify Admin API:
  6. `pageUpdate` mutation on `gid://shopify/Page/703779766645` (`delivery-return`)

Tasks to implement:
1. Update `snippets/head.liquid` on theme `177936466293`:
   - Prepend `{%- if template.name == 'index' -%}` at line 43 emitting `<title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>` and `<meta name="description" content="Shop archival framed canvas wall art (1.25&quot; pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets &amp; memory foam bath mats.">`.
2. Update `sections/header.liquid` on theme `177936466293`:
   - Line 1065: Change `main_logo_tag = 'h1'` to `main_logo_tag = 'div'`.
   - Line 1796: Remove rogue leading slash from login URL (`href="/{%- if customer...` -> `href="{%- if customer...`).
3. Update `templates/index.json` on theme `177936466293`:
   - Section `home_builder_HhUtjg` block `pwp_curatorial_hero`: Update `<h1 class="pwp-gallery-hero__title">Art built for quiet rooms</h1>` to include commercial intent (`Art built for quiet rooms &mdash; Archival Framed Canvas Wall Art &amp; XXL Desk Mats` or styled subtitle) so exactly 1 commercial `<h1>` renders on `/`.
4. Fix contact email typo in `/pages/delivery-return`:
   - Execute GraphQL `pageUpdate` mutation on `gid://shopify/Page/703779766645` replacing `printswithpasssionbc@gmail.com` with `printswithpassionbc@gmail.com`.
5. Deploy `snippets/pwp-curated-collections-hub.liquid` and integrate in `layout/theme.liquid`:
   - Upload new asset `snippets/pwp-curated-collections-hub.liquid` (use Explorer 3's validated artifact `proposed_pwp-curated-collections-hub.liquid`).
   - Patch `layout/theme.liquid` to render `pwp-curated-collections-hub` immediately after `</main>` on `template.name == 'index'` and the 6 parent collection handles (`canvas-prints`, `desk-mats`, `pillow-cases`, `blankets`, `bath-mats`, `apparel`).
6. Execute live verification against `https://printswithpassion.com/` and the 6 parent collection URLs to prove:
   - `<title>` matches exactly (65 chars).
   - `<meta name="description">` matches and has no discontinued products.
   - Exactly 1 `<h1>` renders on `/`.
   - Zero malformed auth links.
   - Zero occurrences of `printswithpasssion`.
   - All 48 sub-collections linked on `/` and all 6 parent collection pages.

Write your complete handoff report to:
C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_worker_m1_1\handoff.md
Send a message when complete.
