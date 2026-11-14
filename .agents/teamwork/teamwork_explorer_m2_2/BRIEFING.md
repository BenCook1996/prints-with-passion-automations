# BRIEFING — 2026-11-13T00:58:30Z

## Mission
Analyze collection redirect hygiene for Milestone 2: 28 legacy discontinued collection redirects, 15 %20 corrupted redirects, and 1 rogue article redirect deletion. Provide concrete GraphQL mutation plans and verification strategies.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
- State folder: C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m2_2
- Original parent: 590f5f5d-0180-4545-b7ad-7d20c32abc37
- Milestone: Milestone 2 (Phase 2 — Collection & Redirect Hygiene)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code
- Files for content delivery, Messages for coordination
- 5-component handoff report in state folder: handoff.md

## Current Parent
- Conversation ID: 590f5f5d-0180-4545-b7ad-7d20c32abc37
- Updated: 2026-11-13T00:44:35Z

## Investigation State
- **Explored paths**:
  - Live Shopify Admin GraphQL API 2025-01 (`lib/cloud-env.mjs`)
  - `all_redirects.json` (42,360 total redirects)
  - `discontinued_28_details.json`
  - `all_collections.json` (101 collections)
  - Mutation schema inspection for `urlRedirectCreate`, `urlRedirectUpdate`, `urlRedirectDelete`
- **Key findings**:
  - 28 Legacy Collections: 22 missing redirects (`urlRedirectCreate`), 2 existing redirects requiring target repair (`urlRedirectUpdate`), 4 existing redirects already pointing to exact correct active collection. Zero path collision or incoming redirect chains.
  - Target Collections: All 9 proposed target parent collections are active, published, and populated (e.g., `home-living` 1035 products, `canvas-prints` 375 products, `desk-mats` 375 products, `blankets` 270 products, `animals-wildlife` 278 products, `bath-mats` 120 products, `apparel` 45 products, `hoodies` 45 products).
  - 15 `%20` Target Redirects: All 15 target products do NOT exist in Shopify (`productByHandle: null`). Redirecting to clean hyphenated product URLs would produce 404s. Canonical redirection to active parent collections (`/collections/blankets`, `/collections/canvas-prints`, `/collections/hoodies`) cures the `%20` corruption, avoids 404s, and terminates double-redirect hops.
  - Blog Guide Redirect `gid://shopify/UrlRedirect/1701624414581`: Validated live hijacking `/blogs/news/uk-student-room-rental-flat-decor-guide` -> `/collections/canvas-prints`. Ready for `urlRedirectDelete`.
- **Unexplored areas**: None. Complete investigation finished.

## Key Decisions Made
- Categorize 28 legacy handles into 22 create, 2 update, and 4 preserve to prevent duplicate path collision errors in Shopify.
- Propose canonical parent collection targets for all 15 `%20` product redirects rather than 404 product handles.
- Define GraphQL mutations, leaky bucket rate limiting (<= 4 req/sec, 300ms pacing), and verification head checks.

## Artifact Index
- DISPATCH.md — record of incoming instructions
- BRIEFING.md — persistent situational awareness
- progress.md — liveness heartbeat
- handoff.md — comprehensive 5-component handoff report
