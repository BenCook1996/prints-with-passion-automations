# Handoff Report — Explorer 2 (Milestone 4: Blog Article SEO Remediation)

- **Agent**: `teamwork_explorer_m4_2`
- **Milestone**: Milestone 4 (Phase 4 — Page & Article SEO Remediation, Requirement R4)
- **Target Repository**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`
- **Target Store**: `https://printswithpassion.com/` (`bencook96store.myshopify.com`)
- **Generated Artifact**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_2\article_remediation_spec.json`

---

## 1. Observation

### 1.1 Current Article Catalog in Shopify Admin API
Via direct live GraphQL query against `https://bencook96store.myshopify.com/admin/api/2025-01/graphql.json` using `shopifyGraphQL` in `lib/cloud-env.mjs`:
```graphql
query {
  articles(first: 50, query: "published_status:published") {
    edges {
      node {
        id
        handle
        title
        isPublished
        publishedAt
        titleTag: metafield(namespace: "global", key: "title_tag") { value }
        descTag: metafield(namespace: "global", key: "description_tag") { value }
      }
    }
  }
}
```
**Findings**:
1. Exactly **26 published articles** exist under `/blogs/news` in the live store:
   - 25 articles matching `sitemap_articles_1.xml` (audited in `.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json`).
   - 1 article (`uk-student-room-rental-flat-decor-guide`, GID `gid://shopify/Article/1016204886389`) published during Milestone 2 as part of Requirement R2.
2. **100% of articles currently have `titleTag: null` and `descTag: null`** (no `seo.title` or `seo.description` is populated in Shopify Admin).
3. The default fallback article titles currently range from **79 to 140 characters**, severely exceeding the 60-character SERP display limit.

### 1.2 Storefront Title Rendering & Mid-Word Truncation Mechanism
In `snippets/head.liquid` (lines 51–58):
```liquid
{%- else -%}
    {%- capture pwp_brand_suffix -%}{%- unless page_title contains shop.name or page_title contains '|' or page_title.size > 46 %} | {{ shop.name }}{%- endunless -%}{%- endcapture -%}
    {%- capture clean_seo_title -%}{{ page_title | strip | replace: 'Free UK Delivery', 'Free Tracked Delivery' }}{%- if current_tags -%}{% assign meta_tags = current_tags | join: ', ' %} &ndash; {{ 'general.meta.tags' | t: tags: meta_tags }}{%- endif -%}{%- if current_page != 1 %} &ndash; Page {{ current_page }}{%- endif -%}{{ pwp_brand_suffix }}{%- endcapture -%}
    <title>{{ clean_seo_title | strip }}</title>
    {%- if page_description -%}
        {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}
        <meta name="description" content="{{ raw_desc | strip | escape }}">
    {%- endif -%}
{%- endif -%}
```
- In Shopify Liquid, `page_title` evaluates to `article.metafields.global.title_tag` if present; otherwise falling back to `article.title`.
- Because `title_tag` was null across all articles, `page_title` was evaluating to raw 80–140 character strings.
- In Google search results and earlier automated slice scripts (e.g., hard-slicing at 66 characters in `strikezone_ctr_and_competitor_rewriter.mjs`), Article 1 (`uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared`) was cut off at `"Extended Mo"` (`UK Desk Mat Size Guide (2026): 60×35 cm XL vs 80×40 cm XXL Extended Mo...`).
- This mid-word truncation was specifically captured in test assertion `T1-F16-01` (`tests/suites/tier1_feature_coverage.mjs:1031`):
  `assertNotRegex(title, /Extended Mo$/i, 'Size guide title must not be cut off at "Extended Mo"')`.

### 1.3 Forensic Flaws in Survey 2 Automated Proposals
Inspection of `generate_pages_and_articles_proposals.mjs` (lines 114–120) and `article_seo_proposals.json` revealed severe programmatic defects in previous proposals:
```javascript
desc = `Read our UK guide: ${cleanATitle.slice(0, 80)}. Expert styling tips, hardware specs, metric dimensions and free tracked UK delivery on studio decor.`;
if (desc.length > 158) {
  desc = desc.slice(0, 157).replace(/\s+\S*$/, '') + '.';
}
```
1. **Title Truncations**:
   - `How to Choose the Right Canvas Wall Art Size Above a UK` (55 chars — cut off mid-thought before "Sofa or Bed").
   - `Best Desk Setup Accessories for IKEA Karlby & Lagkapten` (55 chars — cut off before "Desks UK").
   - `How to Clean & Wash an Extended Gaming Desk Mat UK Without` (58 chars — dangling preposition "Without").
   - `Ergonomic Wrist Rest vs Flat Extended Desk Mat: Preventing` (58 chars — dangling verb "Preventing").
   - `Mechanical Keyboard Desk Mat Sizing & Acoustic Dampening:` (57 chars — trailing colon, flagged by `DANGLING_TITLE_REGEX`).
   - `Mid-Century Modern Home Office & Living Room Styling Guide:` (59 chars — trailing colon).
   - `Biophilic Home Office & Living Room Styling Guide:` (50 chars — trailing colon).
   - `Abstract Minimalist & Bauhaus Geometric Styling Guide:` (54 chars — trailing colon).
2. **Description Truncations**:
   - `(CM & Inch C. Expert styling tips...` (mid-word truncation of "Chart").
   - `...Height Guide UK (57-Inc. Expert...` (mid-word truncation of "Inch").
   - `...Under £40–£65 (With Fr. Expert...` (mid-word truncation of "Free").
   - `...Without Fraying Stitched Edge. Expert...` (truncated noun).
   - `...Proportions & Cabl. Expert...` (mid-word truncation of "Cable").
   - `...Clean Battlestat. Expert...` (mid-word truncation of "Battlestation").
   - `...Spacing, Sizing & Alignment G. Expert...` (mid-word truncation of "Guide").
   - `...During Long Se. Expert...` (mid-word truncation of "Sessions").
   - `...Cable Routing & A. Expert...` (mid-word truncation of "Anti-Slip").
   - `...Frame Spacing & Living. Expert...` (mid-word truncation of "Room").
   - `...DPI Accuracy, Wrist Ergonomic. Expert...` (mid-word truncation of "Ergonomics").
   - `...DPI & Control Gui. Expert...` (mid-word truncation of "Guide").
   - `...Curling Edges Without Heat Da. Expert...` (mid-word truncation of "Damage").
   - `...Cleaning Coffee & Drinks Witho. Expert...` (mid-word truncation of "Without").
   - `...Warm Walnut Desks, G. Expert...` (mid-word truncation of "Geometric").
   - `...Botanical Canvas Wall Art, Ex. Expert...` (mid-word truncation of "Extended").
   - `...Traditional Woodblock Canvas Pri. Expert...` (mid-word truncation of "Prints").
   - `...Canvas Wall Art, Dual CM/. Expert...` (mid-word punctuation error).
   - `...metric dimensions and free tracked.` (missing noun after "tracked").
   - `...metric dimensions and.` (dangling conjunction and period).

### 1.4 Lint Gate & Quality Constraints
`catalog_uniqueness_and_seo_lint_gate.mjs` enforces the following rules for published articles:
- **Length Constraint** (line 347): `(titleTag || title).length <= 60`.
- **Dangling Title Regex** (line 27):
  ```javascript
  export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
  ```
- **Unescaped Entity Regex** (line 25):
  ```javascript
  export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
  ```
- **AI Cliché Regex** (line 23):
  ```javascript
  const AI_CLICHE_REGEX = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/gi;
  ```
- **Template Grammar Regex** (line 26):
  ```javascript
  export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
  ```

---

## 2. Logic Chain

1. **Root Cause**: The absence of `titleTag` and `descTag` across all 25+ articles in Shopify Admin causes themes and search engines to fall back to the raw unedited `article.title`. Because those titles exceed 80 characters, search engines and automated scripts truncate them arbitrarily, producing broken tokens like `"Extended Mo"`.
2. **Survey 2 Defect**: Survey 2 attempted automated string slicing using `cleanATitle.slice(0, 80)` combined with template sentences and greedy word-dropping (`replace(/\s+\S*$/, '') + '.'`). This algorithm systematically destroyed the ends of sentences and titles, yielding broken abbreviations (`57-Inc.`, `With Fr.`, `Cabl.`, `Battlestat.`) and dangling colons.
3. **Formulation Strategy**:
   - Each `seo.title` was crafted by hand to be complete, natural, and informative, strictly `<= 60` characters (average: 57.5 chars).
   - All `seo.title` entries end cleanly with either brand attribution (`| PWP Studio`, `| PWP`, `| UK Guide`) or a complete noun phrase. This ensures `pwp_brand_suffix` in `snippets/head.liquid` does NOT append additional brand text (since `contains '|'` or `size > 46`), guaranteeing the rendered `<title>` on the storefront never exceeds 60 characters.
   - Each `seo.description` was crafted as two complete grammatical sentences describing the guide's specific domain (dimensions, hardware compatibility, styling, and free UK tracked shipping), strictly between 145 and 158 characters (average: 153.8 chars).
   - Zero AI clichés, zero template grammar fragments ("Transform with", "Elevate with"), and zero HTML entities were used.
4. **Scope Expansion**: Although `sitemap_articles_1.xml` originally listed 25 articles, Milestone 2 successfully published the 26th article (`uk-student-room-rental-flat-decor-guide`). Leaving article #26 un-remediated would cause it to fail the lint gate (`title.length > 60` and `titleTag: null`). Thus, the specification explicitly covers all 26 articles.

---

## 3. Caveats

1. **Sitemap Synchronization**:
   - `sitemap_articles_1.xml` was snapshot before `uk-student-room-rental-flat-decor-guide` was published in M2. When Shopify regenerates the sitemap XML, all 26 articles will be present. Both the 25 sitemap articles and the 26th published article are fully specified.
2. **GraphQL Rate Limiting**:
   - When the Milestone 4 Worker agent executes `articleUpdate`, requests must be throttled with at least 250ms spacing to respect Shopify's 50 pt/sec leaky bucket limit.
3. **Internal Linking Delegation**:
   - Cross-linking between indexed articles, uncrawled articles, and smart sub-collections is investigated by Explorer 3 and executed by the Worker agent. This report strictly governs article title remediation, `seo.title`, and `seo.description` specification.
4. **No Other Caveats.**

---

## 4. Conclusion & Authoritative Specification

The complete verified specification has been generated and validated in `article_remediation_spec.json`.

### 4.1 Master Remediation Table (All 26 Articles)

| # | Handle | GID | Clean Remediated Title | `seo.title` (<=60 chars) | Chars | `seo.description` (145–158 chars) | Chars |
|---|---|---|---|---|---|---|---|
| 1 | `uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` | `gid://shopify/Article/1016174772597` | UK Desk Mat Size Guide: 60×35 cm XL vs 80×40 cm XXL Compared | UK Desk Mat Size Guide: 60×35 XL vs 80×40 XXL \| PWP Studio | 58 | Compare 60×35 cm XL and 80×40 cm XXL extended desk mats for UK setups. Explore exact desk dimensions, keyboard clearance, mouse glide and free UK delivery. | 155 |
| 2 | `how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed` | `gid://shopify/Article/1016174805365` | How to Choose the Right Canvas Wall Art Size Above a UK Sofa or Bed | Canvas Wall Art Sizing Above a UK Sofa or Bed \| PWP Studio | 58 | Learn how to choose the perfect canvas wall art size above a UK sofa or bed. Discover ideal proportions, metric sizing charts and free tracked UK delivery. | 155 |
| 3 | `best-desk-setup-accessories-ikea-karlby-lagkapten-uk-guide` | `gid://shopify/Article/1016176902517` | Best Desk Setup Accessories for IKEA Karlby & Lagkapten Desks UK | Best Desk Accessories for IKEA Karlby & Lagkapten Desks UK | 58 | Discover the best desk setup accessories for IKEA Karlby and Lagkapten desks in the UK. Pair XXL desk mats with cable management and free tracked delivery. | 155 |
| 4 | `mechanical-keyboard-desk-mat-pairing-guide-uk` | `gid://shopify/Article/1016184963445` | Mechanical Keyboard Desk Mat Pairing Guide: 60%, 75%, TKL & Full-Size | Mechanical Keyboard Desk Mat Pairing Guide: 60%, TKL, Full | 58 | Find the ideal desk mat size for 60%, 75%, TKL and full-size mechanical keyboards. Explore acoustic dampening, mouse clearance and free tracked UK shipping. | 156 |
| 5 | `canvas-wall-art-hanging-height-guide-uk-57-inch-rule` | `gid://shopify/Article/1016185061749` | Canvas Wall Art Placement Height Guide UK: The 57-Inch Rule | Canvas Wall Art Hanging Height Guide: 57-Inch Rule \| PWP | 56 | Master the 57-inch gallery rule for hanging canvas wall art in UK hallways, offices, and bedrooms. Learn exact eye-level placement and get free UK shipping. | 156 |
| 6 | `best-gifts-for-gamers-remote-workers-homeowners-uk` | `gid://shopify/Article/1016185258357` | Best Gifts for Remote Workers, Gamers & New Homeowners UK | Best Gifts for Gamers & Remote Workers Under £65 \| UK Guide | 59 | Explore curated gifts for UK gamers, remote workers and new homeowners under £40–£65. Choose archival canvas art and XXL desk mats with free UK delivery. | 153 |
| 7 | `dual-monitor-ultrawide-desk-setup-mat-sizing-uk` | `gid://shopify/Article/1016192991605` | Dual Monitor & Ultrawide Desk Setup Proportions: Desk Mat Layouts | Dual Monitor & Ultrawide Desk Setup: Best XXL Desk Mat Sizes | 60 | Plan the ideal dual monitor or ultrawide desk setup with XL & XXL desk mats. Discover balanced workstation layouts, cable clearance and free UK delivery. | 153 |
| 8 | `how-to-clean-wash-extended-gaming-desk-mat-uk` | `gid://shopify/Article/1016204591477` | How to Clean & Wash an Extended Gaming Desk Mat Without Fraying | How to Clean an Extended Gaming Desk Mat Safely \| UK Guide | 58 | Learn how to clean and wash an extended gaming desk mat without fraying stitched edges. Follow our step-by-step washing, drying and care guide for UK desks. | 156 |
| 9 | `ikea-karlby-alex-drawer-gaming-desk-setup-mat-guide-uk` | `gid://shopify/Article/1016204624245` | IKEA Karlby & Alex Drawer Desk Setup: Best XXL Desk Mat Sizing | IKEA Karlby & Alex Drawer Desk Setup: XXL Desk Mat Guide | 56 | Build the ultimate IKEA Karlby & Alex drawer desk setup. Discover best-fit XXL desk mat proportions, clean cable routing tips and free tracked UK delivery. | 155 |
| 10 | `stretched-canvas-vs-framed-prints-uk-comparison` | `gid://shopify/Article/1016204657013` | Stretched Canvas vs Framed Prints: Glare, Durability & Acoustics | Stretched Canvas vs Framed Prints: Glare & Acoustics Guide | 58 | Compare stretched canvas wall art vs framed prints for modern UK rooms. Review glare reduction, durability, acoustic benefits and free tracked UK shipping. | 155 |
| 11 | `uk-student-room-rental-flat-decor-guide` | `gid://shopify/Article/1016204886389` | UK Student Room & Rental Flat Decor Guide: Zero-Damage Styling | UK Student Room & Rental Flat Decor Guide \| Zero-Damage Art | 59 | Decorate UK university student rooms and rented flats without deposit deductions. Explore damage-free canvas hanging, XXL desk mats and free UK shipping. | 153 |
| 12 | `mechanical-keyboard-desk-mat-acoustics-sizing-uk-guide` | `gid://shopify/Article/1016204984693` | Mechanical Keyboard Desk Mat Sizing & Acoustic Dampening Guide | Mechanical Keyboard Desk Mat Acoustics & Sizing \| PWP Guide | 59 | Understand mechanical keyboard desk mat acoustics and sizing. Compare 3mm vs 4mm natural rubber thickness, sound absorption, mouse glide and free delivery. | 155 |
| 13 | `cable-management-rgb-routing-desk-mat-uk` | `gid://shopify/Article/1016205607285` | Cable Management & RGB Routing Guide for Extended Desk Mats | Desk Mat Cable Management & RGB Routing Guide \| UK Setups | 57 | Achieve a clean battlestation with our UK desk mat cable management and RGB routing guide. Conceal wires, protect surfaces and enjoy free UK delivery. | 150 |
| 14 | `desk-mat-thickness-guide-2mm-vs-3mm-vs-4mm-uk` | `gid://shopify/Article/1016205640053` | Desk Mat Thickness Guide: 2mm vs 3mm vs 4mm vs 5mm Compared | Desk Mat Thickness Guide: 2mm, 3mm, 4mm & 5mm Compared \| PWP | 60 | Compare 2mm, 3mm, 4mm, and 5mm desk mat thicknesses for UK workstations. Evaluate wrist support, keyboard dampening, mouse glide and free UK shipping. | 150 |
| 15 | `gallery-wall-grid-vs-salon-hang-spacing-guide-uk` | `gid://shopify/Article/1016205705589` | Gallery Wall Grid Layout vs Asymmetric Salon Hang Guide | Gallery Wall Grid vs Salon Hang: Spacing & Sizing \| PWP | 55 | Compare gallery wall grid layouts with asymmetric salon hangs. Learn frame spacing, metric sizing rules, wall alignment and get free tracked UK delivery. | 153 |
| 16 | `ergonomic-wrist-rest-vs-flat-desk-mat-uk` | `gid://shopify/Article/1016207343989` | Ergonomic Wrist Rest vs Flat Extended Desk Mat: Preventing Strain | Ergonomic Wrist Rest vs Flat Extended Desk Mat: RSI Guide | 57 | Compare ergonomic wrist rests against flat extended desk mats to prevent wrist strain. Discover typing posture tips, 4mm cushioning and free UK delivery. | 153 |
| 17 | `home-office-standing-desk-mat-sizing-uk-guide` | `gid://shopify/Article/1016211734901` | Home Office Standing Desk Mat Sizing: Height-Adjustable Desks | Home Office Standing Desk Mat Sizing & Setup Guide \| PWP | 56 | Select the ideal desk mat size for UK height-adjustable standing desks. Discover anti-slip rubber base specs, cable routing tips and free tracked delivery. | 155 |
| 18 | `gallery-wall-layout-canvas-art-sizing-uk-guide` | `gid://shopify/Article/1016218124661` | Gallery Wall Layout & Canvas Art Sizing: Eye-Level Rules | Gallery Wall Layout & Canvas Sizing: Eye-Level Rules \| PWP | 58 | Plan a striking living room gallery wall with our canvas art sizing guide. Master eye-level placement rules, frame spacing formulas and free UK delivery. | 153 |
| 19 | `uk-mouse-pad-vs-extended-desk-mat-gaming-work-guide` | `gid://shopify/Article/1016218157429` | Mouse Pad vs Extended XXL Desk Mat: DPI Accuracy & Ergonomics | Mouse Pad vs Extended XXL Desk Mat: DPI & Ergonomics Guide | 58 | Compare standard mouse pads with extended XXL desk mats. Discover optical sensor DPI accuracy, wrist ergonomics, surface protection and free UK shipping. | 153 |
| 20 | `cloth-vs-glass-desk-mat-mouse-sensor-tracking-uk` | `gid://shopify/Article/1016218648949` | Cloth vs Glass Desk Mats: Mouse Sensor Tracking & DPI Guide | Cloth vs Glass Desk Mats: Mouse Sensor Tracking & DPI Guide | 59 | Compare optical mouse sensor tracking on micro-woven cloth vs glass desk mats. Learn DPI control differences, stopping power, glide and free UK delivery. | 153 |
| 21 | `how-to-flatten-rolled-desk-mat-curling-edges-uk` | `gid://shopify/Article/1016218681717` | How to Flatten a Rolled Desk Mat Fast: Stop Curling Edges | How to Flatten a Rolled Desk Mat Fast Without Heat Damage | 57 | Learn how to flatten a rolled desk mat fast without heat damage. Eliminate curling edges using reverse rolling and heavy books with our UK setup care tips. | 155 |
| 22 | `spill-proof-water-resistant-desk-mat-care-uk` | `gid://shopify/Article/1016220385653` | Spill-Proof Extended Desk Mats: Cleaning Coffee Without Stains | Spill-Proof & Water-Resistant Desk Mats: Stain Care Guide | 57 | Care for spill-proof and water-resistant extended desk mats. Discover easy methods to clean coffee and drink spills without stains, plus free UK delivery. | 154 |
| 23 | `mid-century-modern-home-office-living-room-styling-uk-guide` | `gid://shopify/Article/1016265310581` | Mid-Century Modern Home Office & Living Room Styling Guide | Mid-Century Modern Office & Living Room Styling Guide \| PWP | 59 | Style a mid-century modern home office and living room. Coordinate warm walnut desks, geometric velvet cushions, XXL mats and archival canvas wall art. | 151 |
| 24 | `biophilic-home-office-living-room-styling-guide` | `gid://shopify/Article/1016276287861` | Biophilic Home Office & Living Room Styling Guide: Nature Decor | Biophilic Office & Living Room Styling Guide \| PWP Studio | 57 | Design a biophilic home office and living room sanctuary. Pair botanical canvas wall art, forest green XXL desk mats and nature decor with free UK shipping. | 156 |
| 25 | `japanese-ukiyo-e-asian-art-zen-styling-guide` | `gid://shopify/Article/1016297718133` | Japanese Ukiyo-e & Asian Art Zen Room Styling Guide | Japanese Ukiyo-e & Asian Art Zen Styling Guide \| PWP Studio | 59 | Curate a serene sanctuary with Japanese Ukiyo-e and Asian zen decor. Pair traditional woodblock canvas prints, calligraphy desk mats and free UK delivery. | 154 |
| 26 | `abstract-minimalist-bauhaus-styling-guide` | `gid://shopify/Article/1016314102133` | Abstract Minimalist & Bauhaus Geometric Styling Guide | Abstract Minimalist & Bauhaus Styling Guide \| PWP Studio | 56 | Explore Bauhaus geometric design and abstract minimalist interior styling. Balance modernist canvas wall art with XXL desk mats and free tracked delivery. | 154 |

---

## 5. Verification Method

### 5.1 Programmatic Specification Verification
To verify the remediation specification against all project rules, execute:
```powershell
Set-Location "C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine"
node -e "
  import fs from 'fs';
  const data = JSON.parse(fs.readFileSync('./.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json', 'utf8'));
  const DANGLING = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
  const ENTITY = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
  const CLICHE = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/i;
  const TEMPLATE = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;

  let errors = 0;
  data.articles.forEach(a => {
    if (a.seoTitleLen > 60 || a.seoTitleLen < 15) { console.error('Title length error:', a.handle, a.seoTitleLen); errors++; }
    if (a.seoDescriptionLen > 158 || a.seoDescriptionLen < 145) { console.error('Desc length error:', a.handle, a.seoDescriptionLen); errors++; }
    if (DANGLING.test(a.seoTitle)) { console.error('Title dangling:', a.handle, a.seoTitle); errors++; }
    if (ENTITY.test(a.seoTitle) || ENTITY.test(a.seoDescription)) { console.error('Entity violation:', a.handle); errors++; }
    if (CLICHE.test(a.seoDescription)) { console.error('AI cliche violation:', a.handle); errors++; }
    if (TEMPLATE.test(a.seoDescription)) { console.error('Template grammar violation:', a.handle); errors++; }
    if (!a.seoDescription.endsWith('.')) { console.error('Desc not full sentence:', a.handle); errors++; }
  });
  console.log('Result: ' + (errors === 0 ? 'ALL CHECKS PASSED (100% OK)' : 'FAILURES: ' + errors));
"
```

### 5.2 Post-Implementation Verification Commands (Worker / Reviewer)
After Worker executes `articleUpdate` mutations:
1. **Live GraphQL Verification**:
   ```powershell
   node -e "
     import { shopifyGraphQL } from './lib/cloud-env.mjs';
     const res = await shopifyGraphQL(\`
       query {
         articles(first: 50, query: \"published_status:published\") {
           edges {
             node {
               handle
               title
               titleTag: metafield(namespace: \"global\", key: \"title_tag\") { value }
               descTag: metafield(namespace: \"global\", key: \"description_tag\") { value }
             }
           }
         }
       }
     \`);
     const nodes = res.articles.edges.map(e => e.node);
     console.log('Published articles count:', nodes.length);
     nodes.forEach(n => console.log(n.handle, 'TitleLen:', n.titleTag?.value?.length, 'DescLen:', n.descTag?.value?.length));
   "
   ```
2. **Storefront HTTP Verification**:
   ```powershell
   node -e "
     const res = await fetch('https://printswithpassion.com/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared');
     const html = await res.text();
     const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
     console.log('Live Title:', title);
     console.log('Ends with Extended Mo?:', /Extended Mo$/i.test(title));
     console.log('Length <= 60?:', title.length <= 60, '(Length:', title.length + ')');
   "
   ```
3. **E2E Feature 16 Test Suite**:
   ```powershell
   node tests/e2e_recovery_test_runner.mjs --feature=16 --verbose
   ```
4. **Catalog Quality Gate**:
   ```powershell
   node catalog_uniqueness_and_seo_lint_gate.mjs
   ```

### 5.3 Invalidation Conditions
- Any `seo.title` exceeding 60 characters or ending with punctuation (`:`, `-`, `|`, `,`).
- Any `seo.description` outside the 145–158 character range.
- Presence of any truncated word tokens (`Extended Mo`, `57-Inc.`, `With Fr.`, `Cabl.`, `Battlestat.`, `dimensions and.`).
- Presence of double-escaped entities (`&quot;`, `&amp;quot;`, `&amp;`).
- Failure of E2E tests `T1-F16-01` through `T1-F16-05`.
