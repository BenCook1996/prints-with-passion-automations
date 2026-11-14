# Handoff Report — Explorer 1 (Milestone 4: Page SEO Remediation)

- **Agent**: `teamwork_explorer_m4_1`
- **Milestone**: Milestone 4 (Requirement R4 — Page & Article SEO Remediation)
- **Target Repository**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`
- **Specification Artifact**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\page_remediation_spec.json`
- **Date**: 2026-11-14T03:00:00Z

---

## 1. Observation

All observations were directly verified against live Shopify Admin GraphQL API (version `2025-01`) on `bencook96store.myshopify.com` and recorded in `live_pages_raw.json`.

### 1.1 Live Shopify Page Inventory
- **Total Static Pages in Shopify Admin & `sitemap_pages_1.xml`**: Exactly **36 pages**.
- **Page Categories**:
  - **28 Pillar Guide & Thematic Pages**: e.g., `xxl-extended-gaming-desk-mats-uk-guide`, `stretched-canvas-wall-art-uk-guide`, `cyberpunk-sci-fi-desk-mats-wall-art-uk`, `japanese-ukiyo-e-anime-desk-mats-wall-art-uk`, etc.
  - **8 Core Utility & Commercial Directory Pages**: `contact-us`, `size-guide`, `privacy-policy`, `data-sharing-opt-out`, `about-us`, `delivery-return`, `desk-size-visualizer`, `free-4k-wallpapers`, `uk-product-catalog`.

### 1.2 Inner `<h1>` Audit in `page.body`
- **Pages Containing Inner `<h1>`**: Exactly **25 pages**.
- **Total Inner `<h1>` Elements**: Exactly **25** (1 per affected page).
- **Storefront Template Mechanism**:
  Shopify theme `page.liquid` renders `<h1>{{ page.title }}</h1>` at the top of every page. Because `page.body` contains a second `<h1>`, the rendered storefront HTML contains **two `<h1>` tags**, violating SEO best practices and diluting primary keyword signals.
- **Affected 25 Pages**:
  1. `uk-product-catalog` (`gid://shopify/Page/703791300981`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;">UK Home Decor, Extended Desk Mat &amp; Stretched Canvas Wall Art Catalog Directory</h1>`
  2. `xxl-extended-gaming-desk-mats-uk-guide` (`gid://shopify/Page/703806865781`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">XXL Extended Gaming Desk Mats UK (80×40 cm): Complete Setup &amp; Buyer’s Guide</h1>`
  3. `stretched-canvas-wall-art-uk-guide` (`gid://shopify/Page/703806898549`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Gallery-Wrapped Stretched Canvas Wall Art UK (24×16 in): Interior Styling Guide</h1>`
  4. `double-sided-square-cushion-covers-uk-guide` (`gid://shopify/Page/703806931317`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Double-Sided Square Cushion Covers UK (40×40 cm): Sofa &amp; Bedroom Styling Guide</h1>`
  5. `plush-coral-fleece-throw-blankets-uk-guide` (`gid://shopify/Page/703806964085`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Ultra-Soft Plush Coral Fleece Throw Blankets UK (50×60 in): Sofa &amp; Bed Guide</h1>`
  6. `luxury-memory-foam-bath-mats-uk-guide` (`gid://shopify/Page/703806996853`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Luxury Non-Slip Memory Foam Bath Mats UK (61×43 cm): Modern Bathroom Guide</h1>`
  7. `cyberpunk-sci-fi-desk-mats-wall-art-uk` (`gid://shopify/Page/703807029621`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Sci-Fi, Cyberpunk &amp; Neon Synthwave Desk Mats, Canvas Art &amp; Home Decor UK</h1>`
  8. `japanese-ukiyo-e-anime-desk-mats-wall-art-uk` (`gid://shopify/Page/703807062389`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Japanese Ukiyo-e, Samurai &amp; Anime Aesthetic Desk Mats, Canvas Prints &amp; Decor UK</h1>`
  9. `space-cosmic-nebula-desk-mats-wall-art-uk` (`gid://shopify/Page/703807095157`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Space, Cosmic Nebula &amp; Astronomy Desk Mats, Stretched Canvas &amp; Home Decor UK</h1>`
  10. `fantasy-mythology-gothic-desk-mats-wall-art-uk` (`gid://shopify/Page/703807127925`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Fantasy, Dragon, Mythology &amp; Dark Gothic Desk Mats, Canvas Art &amp; Home Decor UK</h1>`
  11. `botanical-floral-nature-wall-art-cushions-uk` (`gid://shopify/Page/703807160693`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Botanical, Floral &amp; Forest Landscape Canvas Wall Art, Cushions &amp; Bath Mats UK</h1>`
  12. `wildlife-animal-art-cushions-blankets-wall-art-uk` (`gid://shopify/Page/703807193461`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Animals &amp; Wildlife Art Collection UK: Lion, Wolf, Bird &amp; Marine Canvas, Throws &amp; Cushions</h1>`
  13. `abstract-geometric-minimalist-wall-art-decor-uk` (`gid://shopify/Page/703807226229`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Abstract, Sacred Geometry &amp; Minimalist Line Art Canvas, Desk Mats &amp; Cushions UK</h1>`
  14. `retro-vintage-pop-art-wall-art-desk-mats-uk` (`gid://shopify/Page/703807258997`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Retro, Vintage 80s Vaporwave &amp; Pop Art Desk Mats, Canvas Prints &amp; Home Decor UK</h1>`
  15. `world-landmarks-cityscape-travel-wall-art-uk` (`gid://shopify/Page/703807291765`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">World Landmarks, London, Tokyo &amp; Paris Cityscape Canvas Wall Art &amp; Cushions UK</h1>`
  16. `matching-home-office-desk-mat-and-canvas-sets-uk` (`gid://shopify/Page/703807324533`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Matching Home Office Desk Mat &amp; Canvas Wall Art Sets UK: Cohesive Workspace Styling</h1>`
  17. `living-room-sofa-cushion-throw-blanket-canvas-pairing-uk` (`gid://shopify/Page/703807357301`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Living Room Colour Pairing Guide UK: Matching Cushion Covers, Throw Blankets &amp; Canvas Art</h1>`
  18. `bedroom-sanctuary-throw-blanket-cushion-wall-art-uk` (`gid://shopify/Page/703807390069`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Bedroom Sanctuary Decor Guide UK: Plush Fleece Throws, Accent Cushions &amp; Statement Art</h1>`
  19. `modern-uk-bathroom-makeover-memory-foam-bath-mats` (`gid://shopify/Page/703807422837`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Modern UK Bathroom Makeover Guide: Statement Memory Foam Bath Mats &amp; Spa Styling</h1>`
  20. `gaming-room-pc-setup-lighting-desk-mat-wall-art-uk` (`gid://shopify/Page/703807455605`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Ultimate UK Gaming Room &amp; Streaming Setup Guide: XXL Desk Mats, Canvas Art &amp; Throws</h1>`
  21. `home-decor-desk-mat-care-washing-maintenance-guide-uk` (`gid://shopify/Page/703807488373`): `<h1 style="font-size:32px;line-height:1.25;margin:0 0 16px;color:#111827;">Complete UK Care &amp; Washing Guide: Cleaning Desk Mats, Fleece Throws, Cushions &amp; Bath Mats</h1>`
  22. `vip-loyalty-program` (`gid://shopify/Page/703814369653`): `<h1>Prints With Passion VIP</h1>`
  23. `desk-setup-hardware-compatibility-guide` (`gid://shopify/Page/703875187061`): `<h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Desk Mat &amp; Wall Art Sizing Guide for IKEA Karlby, Secretlab Magnus, Keychron/Wooting &amp; Ultrawide Setups</h1>`
  24. `studio-quality-vs-generic-prints` (`gid://shopify/Page/703875219829`): `<h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Prints With Passion Studio Standard vs. Generic 2mm Pads, Rolled Posters &amp; Metal Prints</h1>`
  25. `trade-and-bulk-orders` (`gid://shopify/Page/703875252597`): `<h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Corporate Workspaces, Interior Stagers, Esports Lounges &amp; Hospitality Bulk Orders</h1>`

### 1.3 HTML Entity Audit
- **Literal `&amp;` in Body**: Exactly **34 pages** contain `&amp;` (total 885 occurrences).
- **Titles**: Exactly **0 pages** have `&amp;` in their `title` attribute.
- **Other Entities in Body**: `&quot;` (20), `&#39;` (1), `&lt;` (376), `&gt;` (374).
  - Note: `&lt;` and `&gt;` are part of code/schema examples and must be preserved. Only `&amp;` -> `&` replacement should be executed.

### 1.4 Existing SEO Metadata & The Contact Us Typo
- **Existing `title_tag`**: 35 pages are `null`. Only 1 page (`desk-setup-hardware-compatibility-guide`) had a value, but it was truncated mid-word at 65 characters: `"Desk Setup Hardware Compatibility Guide | Dual CM & Inch Studio Si"`.
- **Existing `description_tag`**: 34 pages are `null` (forcing fallback to raw breadcrumb snippets).
- **`/pages/contact-us` (`gid://shopify/Page/131838509367`)**:
  - `description_tag`: `"We would love to hear from you. Please email printswithpasssionbc@gmail.com."`
  - Verbatim typo confirmed: triple 's' in `printswithpasssionbc@gmail.com`.
  - In `page.body`, the email is already `printswithpassionbc@gmail.com`. The typo exists exclusively in the `description_tag` metafield.

### 1.5 Forensic Audit of Survey 2 Preliminary Proposals
- Preliminary proposals generated by Survey 2 in `page_seo_proposals.json` used crude slicing `.slice(0, 75)` and regex trimming, which generated several serious defects:
  1. **Truncated Words**: `home-decor-desk-mat-care-washing-maintenance-guide-uk` had `Cushio.` (sliced `Cushions`).
  2. **Incomplete Sentences**: `...styling ideas and free.`, `...free tracked UK delivery on.`, `...free tracked UK.`.
  3. **Dangling Possessives**: `XXL Extended Gaming Desk Mats UK: Complete Setup & Buyer’s` (ends in `Buyer’s` without noun).
- Consequently, Explorer 1 completely discarded the automated slice script and hand-crafted 36 bespoke, fully verified metadata entries.

---

## 2. Logic Chain

1. **Why Duplicate `<h1>` Elements Occur**:
   - In Shopify theme Liquid architecture, `layout/theme.liquid` includes template sections where `templates/page.liquid` automatically wraps `{{ page.title }}` inside `<h1>`.
   - The authors of the 25 pillar guides copied a layout template into `page.body` containing an additional `<h1 style="...">` header.
   - On the rendered storefront DOM, this produces two top-level `<h1>` tags. Demoting `<h1(\b[^>]*)>([\s\S]*?)<\/h1>` to `<h2$1>$2</h2>` guarantees exactly 1 commercial `<h1>` per page while preserving all existing styling.

2. **Sanitizing `&amp;` without HTML Corruption**:
   - The entity scan revealed 885 occurrences of `&amp;`. In HTML5 text nodes, `&` is standard, readable, and avoids ugly entity escapes in SERP snippets.
   - By specifically replacing `&amp;` with `&`, code tags containing `&lt;` and `&gt;` remain intact.

3. **Eliminating Breadcrumb Fallback**:
   - Because 34 pages lacked `description_tag`, search engines generate snippets from the first DOM elements (often breadcrumbs like `Home › UK Catalog Directory › ...`).
   - Populating bespoke `description_tag` values strictly between 145 and 158 characters with rich commercial and informational intent provides compelling SERP snippets.

4. **Correcting the Contact Email Typo**:
   - Updating `description_tag` on `/pages/contact-us` removes the triple-s typo `printswithpasssionbc@gmail.com` and replaces it with our compliant 153-character support description.

---

## 3. Caveats

1. **Shopify GraphQL Schema Constraints (`Page` vs `Collection`)**:
   - In Shopify Admin GraphQL API 2025-01, `CollectionUpdateInput` accepts an `seo: SEOInput` object. However, `PageUpdateInput` does **not** have an `seo` field.
   - For `Page` objects, SEO metadata must be updated via the `metafields: [MetafieldInput!]` argument on `pageUpdate`, or via `metafieldsSet`.
   - `page_remediation_spec.json` explicitly structures the exact `metafields_to_set` array (`namespace: "global"`, `key: "title_tag"` / `"description_tag"`).
2. **Shopify Admin API Rate Pacing**:
   - Updating 36 pages requires ~36 GraphQL calls. At 250ms spacing (~4 calls/sec), the entire execution takes under 10 seconds while consuming ~40 cost points (comfortably within the 50-point/sec leaky bucket limit).
3. **Storefront Cache Latency**:
   - While Shopify Admin API updates are immediate, Cloudflare/Shopify storefront edge cache may take up to 60–120 seconds to reflect updated HTML bodies and meta tags.

---

## 4. Conclusion & Specification

The full specification is finalized in:
`C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\page_remediation_spec.json`

### 4.1 Summary Statistics
- **Total Static Pages**: 36
- **Pages Requiring Inner `<h1>` Demotion**: 25 (100% mapped to `<h2>`)
- **Pages Requiring `&amp;` Sanitization in Body**: 34 (885 entities mapped to `&`)
- **Pages Requiring Body Update**: 34
- **Pages Requiring SEO Metadata Update**: 36 (100% compliant)
  - `seo.title`: 100% <= 60 characters (range: 49–60 chars, 0 truncated)
  - `seo.description`: 100% between 145 and 158 characters (range: 149–157 chars, 100% complete sentences ending in `.`)
- **Contact Us Email Typo Fix**: Included in `contact-us` remediation.

### 4.2 Exact Master Specification Table

| # | Handle | Page ID | H1 Fix? | &amp; Fix? | Proposed SEO Title (Length <= 60) | Proposed SEO Description (Length 145-158) |
|---|---|---|---|---|---|---|
| 1 | `contact-us` | `gid://shopify/Page/131838509367` | No | Yes | Contact Prints With Passion \| UK Customer Care Support (54) | Contact Prints With Passion UK customer care team for order inquiries, bespoke sizing & delivery tracking. Free tracked UK delivery on all art and decor. (153) |
| 2 | `size-guide` | `gid://shopify/Page/138744529207` | No | Yes | Official Size Guide (CM & Inches) \| Prints With Passion (55) | Complete UK and USA size guide for framed canvas prints, XXL desk mats, cushion covers, throw blankets & bath mats in both metric (cm) and imperial (inches). (157) |
| 3 | `privacy-policy` | `gid://shopify/Page/138824712503` | No | No | Privacy Policy & Data Security \| Prints With Passion (52) | Read the Prints With Passion privacy policy and data security standards. Learn how we protect your personal information, cookies and transactional privacy. (155) |
| 4 | `data-sharing-opt-out` | `gid://shopify/Page/140089688375` | No | No | Your Privacy Choices & Opt-Out \| Prints With Passion (52) | Manage your privacy choices, cookie preferences and personal data sharing opt-out options in compliance with UK GDPR and international privacy legislation. (155) |
| 5 | `about-us` | `gid://shopify/Page/688935666037` | No | Yes | About Prints With Passion \| UK Archival Art & Decor Studio (58) | Discover Prints With Passion: our independent UK print studio dedicated to archival framed canvas wall art, 4mm XXL desk mats and bespoke home decor. (149) |
| 6 | `delivery-return` | `gid://shopify/Page/703779766645` | No | Yes | Delivery & Returns Policy \| 100% Free UK Tracked Shipping (57) | Learn about our delivery and returns policy: 100% free Royal Mail tracked shipping across the UK, 30-day guarantee and secure protective studio packaging. (154) |
| 7 | `desk-size-visualizer` | `gid://shopify/Page/703780487541` | No | Yes | UK Desk Mat & Wall Art Size Visualizer \| CM & Inches (52) | Interactive sizing visualizer: preview 60×35cm, 80×40cm & 90×40cm XXL desk mats, mechanical keyboards and framed canvas prints across popular UK desk setups. (157) |
| 8 | `free-4k-wallpapers` | `gid://shopify/Page/703780520309` | No | Yes | Free 4K Desktop & Setup Wallpapers \| Prints With Passion (56) | Download free 4K ultra-high-definition desktop and dual-monitor wallpapers matching our archival canvas prints and XXL desk mats. Licensed CC-BY 4.0. (149) |
| 9 | `uk-product-catalog` | `gid://shopify/Page/703791300981` | Yes | Yes | UK Catalog Directory: Wall Art, Desk Mats & Home Decor (54) | Explore the complete Prints With Passion UK catalog directory: 48 studio collections of framed canvas wall art, XXL desk mats, cushions and fleece throws. (154) |
| 10 | `xxl-extended-gaming-desk-mats-uk-guide` | `gid://shopify/Page/703806865781` | Yes | Yes | XXL Extended Gaming Desk Mats UK (80×40cm) Setup Guide (54) | UK buyer guide for XXL 80×40cm extended gaming desk mats: 4mm thick natural rubber base, micro-weave cloth and anti-fray stitching. Free UK delivery. (149) |
| 11 | `stretched-canvas-wall-art-uk-guide` | `gid://shopify/Page/703806898549` | Yes | Yes | Gallery Stretched Canvas Wall Art UK (24×16 in) Guide (53) | Explore our UK styling guide for 24×16 inch gallery-wrapped canvas prints: 400gsm cotton-poly blend on 1.25 inch European pine frames with free UK shipping. (156) |
| 12 | `double-sided-square-cushion-covers-uk-guide` | `gid://shopify/Page/703806931317` | Yes | Yes | Double-Sided Cushion Covers UK (40×40cm) Styling Guide (54) | Interior styling guide for 40×40cm double-sided faux-suede cushion covers in the UK: vibrant colourfast prints, concealed zips and free tracked delivery. (153) |
| 13 | `plush-coral-fleece-throw-blankets-uk-guide` | `gid://shopify/Page/703806964085` | Yes | Yes | Plush Coral Fleece Throw Blankets UK (50×60 in) Guide (53) | UK home guide for 50×60 inch ultra-soft coral fleece throw blankets: lightweight warmth, hypoallergenic microfiber and machine washable with free delivery. (155) |
| 14 | `luxury-memory-foam-bath-mats-uk-guide` | `gid://shopify/Page/703806996853` | Yes | Yes | Luxury Memory Foam Bath Mats UK (61×43cm) Bathroom Guide (56) | UK bathroom decor guide for 61×43cm memory foam bath mats: quick-dry microfiber surface, high-density foam cushioning and non-slip rubber safety backing. (153) |
| 15 | `cyberpunk-sci-fi-desk-mats-wall-art-uk` | `gid://shopify/Page/703807029621` | Yes | Yes | Cyberpunk & Sci-Fi Desk Mats & Wall Art UK Setup Guide (54) | UK guide to sci-fi, synthwave and neon cyberpunk desk mats and matching canvas wall art: high-contrast aesthetic workspace decor with free UK shipping. (151) |
| 16 | `japanese-ukiyo-e-anime-desk-mats-wall-art-uk` | `gid://shopify/Page/703807062389` | Yes | Yes | Japanese Ukiyo-e & Anime Desk Mats & Canvas Art UK Guide (56) | UK styling guide for Japanese anime, Great Wave ukiyo-e and samurai XXL desk mats and canvas prints: premium archival print craft with free UK delivery. (152) |
| 17 | `space-cosmic-nebula-desk-mats-wall-art-uk` | `gid://shopify/Page/703807095157` | Yes | Yes | Space & Cosmic Nebula Desk Mats & Canvas Wall Art UK (52) | UK astronomy guide for deep space, cosmic nebula and celestial desk mats and canvas prints: high-resolution astrophotography art with free UK delivery. (151) |
| 18 | `fantasy-mythology-gothic-desk-mats-wall-art-uk` | `gid://shopify/Page/703807127925` | Yes | Yes | Fantasy & Gothic Desk Mats & Canvas Wall Art UK Guide (53) | UK decor guide for dark fantasy, dragon, mythology and gothic aesthetic desk mats, fleece throws and framed canvas wall art with free tracked UK shipping. (153) |
| 19 | `botanical-floral-nature-wall-art-cushions-uk` | `gid://shopify/Page/703807160693` | Yes | Yes | Botanical & Floral Canvas Wall Art & Cushions UK Guide (54) | UK interior guide for botanical, forest landscape and floral canvas prints, velvet cushion covers and bath mats: biophilic styling with free UK delivery. (153) |
| 20 | `wildlife-animal-art-cushions-blankets-wall-art-uk` | `gid://shopify/Page/703807193461` | Yes | Yes | Wildlife & Animal Canvas Art, Cushions & Blankets UK (52) | Explore UK animal and wildlife art: lion, wolf, stag and bird archival canvas prints, fleece throws and luxury cushion covers with free tracked UK shipping. (156) |
| 21 | `abstract-geometric-minimalist-wall-art-decor-uk` | `gid://shopify/Page/703807226229` | Yes | Yes | Abstract & Minimalist Canvas Wall Art & Desk Mats UK (52) | UK styling guide for abstract geometry, Bauhaus minimalist line art canvas prints and XXL desk mats: contemporary home office decor with free UK delivery. (154) |
| 22 | `retro-vintage-pop-art-wall-art-desk-mats-uk` | `gid://shopify/Page/703807258997` | Yes | Yes | Retro 80s Vaporwave & Pop Art Desk Mats & Wall Art UK (53) | UK guide to vintage 80s vaporwave, arcade and pop art desk mats and stretched canvas prints: nostalgic retro gaming workspace decor with free UK delivery. (154) |
| 23 | `world-landmarks-cityscape-travel-wall-art-uk` | `gid://shopify/Page/703807291765` | Yes | Yes | World Landmarks & Cityscape Canvas Wall Art UK Guide (52) | UK interior styling guide for London, Tokyo and Paris cityscape canvas wall art prints and velvet cushion covers: architectural decor with free shipping. (153) |
| 24 | `matching-home-office-desk-mat-and-canvas-sets-uk` | `gid://shopify/Page/703807324533` | Yes | Yes | Matching Home Office Desk Mat & Canvas Art Sets UK Guide (56) | UK workspace guide for pairing 80×40cm XXL desk mats with matching 24×16 inch stretched canvas prints: create a cohesive home office with free UK delivery. (155) |
| 25 | `living-room-sofa-cushion-throw-blanket-canvas-pairing-uk` | `gid://shopify/Page/703807357301` | Yes | Yes | Living Room Cushion, Blanket & Canvas Pairing Guide UK (54) | UK interior colour pairing guide for matching 40×40cm cushion covers, 50×60 in fleece throw blankets and canvas wall art: style a cohesive modern lounge. (153) |
| 26 | `bedroom-sanctuary-throw-blanket-cushion-wall-art-uk` | `gid://shopify/Page/703807390069` | Yes | Yes | Bedroom Sanctuary Decor Guide: Throws, Cushions & Art UK (56) | UK bedroom sanctuary guide: create restful spaces with plush fleece throw blankets, accent cushion covers and calming canvas wall art. Free UK delivery. (152) |
| 27 | `modern-uk-bathroom-makeover-memory-foam-bath-mats` | `gid://shopify/Page/703807422837` | Yes | Yes | Modern UK Bathroom Makeover: Memory Foam Bath Mats Guide (56) | UK modern bathroom guide: upgrade your space with luxury non-slip memory foam bath mats, coordinated colour palettes and spa styling with free delivery. (152) |
| 28 | `gaming-room-pc-setup-lighting-desk-mat-wall-art-uk` | `gid://shopify/Page/703807455605` | Yes | Yes | UK Gaming Room PC Setup Guide: XXL Desk Mats & Wall Art (55) | UK battlestation guide for gaming PC setups: pairing RGB ambient lighting with XXL stitched desk mats, canvas wall art and warm fleece throw blankets. (150) |
| 29 | `home-decor-desk-mat-care-washing-maintenance-guide-uk` | `gid://shopify/Page/703807488373` | Yes | Yes | UK Desk Mat & Home Decor Washing & Care Guide \| PWP (51) | Complete UK care and washing guide: clean 4mm stitched desk mats, machine wash fleece throws, refresh velvet cushions and maintain memory foam bath mats. (153) |
| 30 | `vip-loyalty-program` | `gid://shopify/Page/703814369653` | Yes | Yes | Prints With Passion VIP Loyalty Program \| Studio Club (53) | Join the Prints With Passion VIP Club: unlock exclusive collector discounts, early access to new art drops and loyalty rewards with free tracked UK shipping. (157) |
| 31 | `us-shipping-and-sizing-guide` | `gid://shopify/Page/703814697333` | No | Yes | US Shipping, Local Fulfillment & Imperial Sizing Guide (54) | USA buyer guide: local USA print fulfillment, rapid courier delivery and imperial size conversions (inches) for canvas wall art prints and XXL desk mats. (153) |
| 32 | `ai-catalog-directory` | `gid://shopify/Page/703874826613` | No | Yes | Studio Catalog, Sizing & AI Discovery Index \| PWP (49) | Browse the Prints With Passion AI discovery index: 48 thematic collections of framed canvas prints, XXL gaming desk mats, cushions and home accessories. (152) |
| 33 | `studio-lookbook-social-feed` | `gid://shopify/Page/703875121525` | No | Yes | Studio Lookbook, Room Inspiration & Pinterest Feed Hub (54) | Explore the Prints With Passion studio lookbook: curated workspace inspiration, customer styling photos and trending Pinterest aesthetic gallery ideas. (151) |
| 34 | `desk-setup-hardware-compatibility-guide` | `gid://shopify/Page/703875187061` | Yes | Yes | Desk Mat Hardware Compatibility Guide (IKEA & Secretlab) (56) | UK hardware sizing guide for IKEA Karlby, Secretlab Magnus and Keychron setups: calculate exact desk clearances for XXL desk mats and mechanical boards. (152) |
| 35 | `studio-quality-vs-generic-prints` | `gid://shopify/Page/703875219829` | Yes | Yes | Studio Quality vs Generic 2mm Mats & Rolled Prints Guide (56) | Full specification guide comparing Prints With Passion 4mm stitched desk mats and 1.25 in pine canvas prints against generic 2mm pads and rolled posters. (153) |
| 36 | `trade-and-bulk-orders` | `gid://shopify/Page/703875252597` | Yes | Yes | B2B Trade & Bulk Orders (15%–35% Off) \| Prints With Passion (59) | B2B commercial trade program for interior stagers, corporate workspaces, hotels and esports lounges: volume discounts up to 35% with free UK delivery. (150) |

---

## 5. Verification Method

### 5.1 Automated Specification Verification
Run the verification script to independently validate the schema, character counts, entities, and completeness of `page_remediation_spec.json`:
```bash
node C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_1\validate_spec.mjs
```
Expected result: `PERFECT! 0 errors found across all 36 pages in page_remediation_spec.json`.

### 5.2 Worker Execution GraphQL Mutation Pattern
The Worker agent should execute updates using the following tested mutation pattern:
```graphql
mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
  pageUpdate(id: $id, page: $page) {
    page {
      id
      handle
      title
      updatedAt
    }
    userErrors {
      field
      message
    }
  }
}
```
With input variables:
```json
{
  "id": "gid://shopify/Page/...",
  "page": {
    "body": "<cleaned body HTML with h2 and &>",
    "metafields": [
      {
        "namespace": "global",
        "key": "title_tag",
        "value": "<proposed_seo_title>",
        "type": "string"
      },
      {
        "namespace": "global",
        "key": "description_tag",
        "value": "<proposed_seo_description>",
        "type": "string"
      }
    ]
  }
}
```

### 5.3 Live Storefront Verification (Post-Remediation)
For each page, fetch rendered HTML:
```bash
curl -sL https://printswithpassion.com/pages/<handle> | grep -c "<h1"
```
- Invalidation condition: If any page returns `!= 1` for `<h1`, the demotion failed.
- Check title tag length:
```bash
curl -sL https://printswithpassion.com/pages/<handle> | grep "<title>"
```
- Check meta description:
```bash
curl -sL https://printswithpassion.com/pages/<handle> | grep '<meta name="description"'
```
- Check contact email on `/pages/contact-us`: must contain `printswithpassionbc@gmail.com` with no instance of `printswithpasssionbc@gmail.com`.
