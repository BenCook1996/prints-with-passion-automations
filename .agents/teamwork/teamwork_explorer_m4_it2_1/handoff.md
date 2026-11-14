# Handoff Report — Explorer 1: Milestone 4 (Iteration 2 — Theme Head Liquid Remediation)

- **Agent**: `teamwork_explorer_m4_it2_1` (Teamwork Explorer 1)
- **Milestone**: Milestone 4 (Iteration 2 — Requirement R4: Page & Article SEO Remediation)
- **Target Platform**: Active Theme `gid://shopify/OnlineStoreTheme/177936466293` (`2025-theme|OPT`) on `bencook96store.myshopify.com`
- **State Folder**: `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m4_it2_1`
- **Reference Inputs**:
  - `ORIGINAL_REQUEST.md` (C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\ORIGINAL_REQUEST.md)
  - `PROJECT.md` (C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\PROJECT.md)
  - `SCOPE.md` (C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\sub_orch_milestone_4\SCOPE.md)
  - Challenger 1 Handoff (`.agents/teamwork/teamwork_challenger_m4_1/handoff.md`)
  - Adversarial Test Results (`tests/reports/challenger_m4_report.json`)
  - Active Theme Asset (`snippets/head.liquid`)

---

## 1. Observation

### 1.1 Context of Iteration 1 Challenger Rejection
During Milestone 4 Iteration 1 verification, Challenger 1 (`teamwork_challenger_m4_1`) executed an adversarial live storefront crawler (`tests/adversarial_challenger_m4_crawler.mjs`) directly against `https://printswithpassion.com`. 
While Features 14 (Single `<h1>`), Catalog Hub Directory (`/pages/uk-product-catalog`), Footer Navigation (`/`), Contact Email Typo Fix, and Blog Title Truncation Repair passed 100%, Challenger 1 **REJECTED** the milestone due to **26 storefront rendering check failures**:
1. **16 Meta Description character length overflows (167–172 characters vs max 158 limit)** across 7 static pages and 9 blog articles.
2. **10 Meta Description entity corruptions (`&amp;` artifact inside `<meta name="description" content="...">`)** across 10 pages.

### 1.2 Inspection of `snippets/head.liquid` (Lines 40–60)
Direct inspection of `snippets/head.liquid` on both the local repository and the active Shopify theme (`gid://shopify/OnlineStoreTheme/177936466293`) revealed lines 51–59:

```liquid
51: {%- else -%}
52:     {%- capture pwp_brand_suffix -%}{%- unless page_title contains shop.name or page_title contains '|' or page_title.size > 46 %} | {{ shop.name }}{%- endunless -%}{%- endcapture -%}
53:     {%- capture clean_seo_title -%}{{ page_title | strip | replace: 'Free UK Delivery', 'Free Tracked Delivery' }}{%- if current_tags -%}{% assign meta_tags = current_tags | join: ', ' %} &ndash; {{ 'general.meta.tags' | t: tags: meta_tags }}{%- endif -%}{%- if current_page != 1 %} &ndash; Page {{ current_page }}{%- endif -%}{{ pwp_brand_suffix }}{%- endcapture -%}
54:     <title>{{ clean_seo_title | strip }}</title>
55:     {%- if page_description -%}
56:         {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}
57:         <meta name="description" content="{{ raw_desc | strip | escape }}">
58:     {%- endif -%}
59: {%- endif -%}
```

### 1.3 Identification of Root Cause Mechanisms in Theme Logic
Two distinct theme rendering mechanisms cause the 26 live storefront failures:

1. **Unwanted Runtime String Expansion (Line 56)**:
   ```liquid
   replace: 'free UK delivery', 'free tracked UK, US & EU delivery'
   ```
   - Target phrase: `'free UK delivery'` = 16 characters.
   - Replacement phrase: `'free tracked UK, US & EU delivery'` = 33 characters.
   - Net inflation: **+17 characters added at runtime** to any page or article description containing this phrase.
   - The GraphQL API data (`global.description_tag`) authored in `page_remediation_spec.json` and `article_remediation_spec.json` was strictly compliant (150–155 characters). At storefront render time, this filter inflated them to **167–172 characters**, causing Google snippet truncation and failing Challenger 1's length gate (`140 <= length <= 158`).

2. **Entity Double-Escaping to `&amp;` (Line 57)**:
   ```liquid
   <meta name="description" content="{{ raw_desc | strip | escape }}">
   ```
   - The Liquid `escape` filter (`html_escape`) encodes literal ampersands `&` into `&amp;`.
   - On line 56, the filter introduced `&` via `"UK, US & EU delivery"`.
   - On pages like `/pages/contact-us`, `/pages/size-guide`, and `/pages/desk-size-visualizer`, the curated description already contained valid plain text ampersands (`"bespoke sizing & delivery tracking"`, `"throw blankets & bath mats"`, `"80×40cm & 90×40cm"`).
   - Piping `raw_desc` through `| escape` on line 57 turned these ampersands into `&amp;` in HTML attribute values (`<meta name="description" content="... &amp; ...">`), directly triggering Challenger 1's entity assertion failure:
     ```javascript
     const hasRawAmp = dom.rawDesc.includes('&amp;');
     assertCheck(`Meta Description has clean entities on ${path}`, !hasRawAmp && !hasDoubleQuote, ...);
     ```

### 1.4 Verbatim Failure Catalog from Adversarial Run

#### Table 1: The 16 Over-Length URLs (Expanded by +17 chars at runtime)
| # | URL Path | Type | Curated API Length | Live Rendered Length | Verbatim Curated Suffix | Verbatim Rendered Suffix |
|---|----------|------|--------------------|----------------------|-------------------------|--------------------------|
| 1 | `/pages/japanese-ukiyo-e-anime-desk-mats-wall-art-uk` | Page | 152 | 169 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 2 | `/pages/space-cosmic-nebula-desk-mats-wall-art-uk` | Page | 151 | 168 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 3 | `/pages/botanical-floral-nature-wall-art-cushions-uk` | Page | 153 | 170 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 4 | `/pages/abstract-geometric-minimalist-wall-art-decor-uk` | Page | 154 | 171 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 5 | `/pages/retro-vintage-pop-art-wall-art-desk-mats-uk` | Page | 154 | 171 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 6 | `/pages/matching-home-office-desk-mat-and-canvas-sets-uk` | Page | 155 | 172 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 7 | `/pages/trade-and-bulk-orders` | Page | 150 | 167 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 8 | `/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared` | Article | 155 | 172 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |
| 9 | `/blogs/news/best-gifts-for-gamers-remote-workers-homeowners-uk` | Article | 153 | 170 | `with free UK delivery.` | `with free tracked UK, US & EU delivery.` |
| 10 | `/blogs/news/dual-monitor-ultrawide-desk-setup-mat-sizing-uk` | Article | 153 | 170 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |
| 11 | `/blogs/news/cable-management-rgb-routing-desk-mat-uk` | Article | 150 | 167 | `and enjoy free UK delivery.` | `and enjoy free tracked UK, US & EU delivery.` |
| 12 | `/blogs/news/ergonomic-wrist-rest-vs-flat-desk-mat-uk` | Article | 153 | 170 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |
| 13 | `/blogs/news/gallery-wall-layout-canvas-art-sizing-uk-guide` | Article | 153 | 170 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |
| 14 | `/blogs/news/cloth-vs-glass-desk-mat-mouse-sensor-tracking-uk` | Article | 153 | 170 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |
| 15 | `/blogs/news/spill-proof-water-resistant-desk-mat-care-uk` | Article | 154 | 171 | `plus free UK delivery.` | `plus free tracked UK, US & EU delivery.` |
| 16 | `/blogs/news/japanese-ukiyo-e-asian-art-zen-styling-guide` | Article | 154 | 171 | `and free UK delivery.` | `and free tracked UK, US & EU delivery.` |

#### Table 2: The 3 Affected URLs with Clean Ampersands Re-Escaped to `&amp;`
| # | URL Path | Type | Curated Length | Verbatim Curated String | Escaped HTML Rendered |
|---|----------|------|----------------|-------------------------|------------------------|
| 17 | `/pages/contact-us` | Page | 153 | `... bespoke sizing & delivery tracking. Free tracked UK delivery ...` | `... bespoke sizing &amp; delivery tracking. Free tracked UK delivery ...` |
| 18 | `/pages/size-guide` | Page | 157 | `... throw blankets & bath mats in both metric (cm) and imperial (inches).` | `... throw blankets &amp; bath mats in both metric (cm) and imperial (inches).` |
| 19 | `/pages/desk-size-visualizer` | Page | 157 | `... preview 60×35cm, 80×40cm & 90×40cm XXL desk mats ...` | `... preview 60×35cm, 80×40cm &amp; 90×40cm XXL desk mats ...` |

*(Note: The other 7 entity failures are the 7 static pages from Table 1, which gained an `&` from `free tracked UK, US & EU delivery` that was then escaped to `&amp;`)*.

### 1.5 Double-Quote & Entity Audit of Authored Descriptions
An automated scan of all 36 pages in `page_remediation_spec.json` and all 26 articles in `article_remediation_spec.json` verified:
- **Double quote occurrences (`"`) in curated descriptions**: **0 / 62** (Zero double quotes).
- **Metric dimensions format**: Uses `cm`, `mm`, `in.`, or single quotes `'`.
- **Character count distribution**: Strictly 145–158 characters.

---

## 2. Logic Chain

1. **Root Cause Confirmation (Observation 1.2 & 1.3)**:
   - The GraphQL Admin API stores compliant descriptions (150–155 chars, plain text).
   - `snippets/head.liquid` line 56 applies a global string substitution `replace: 'free UK delivery', 'free tracked UK, US & EU delivery'` across all templates falling into the `{%- else -%}` block.
   - This replacement is purely a Liquid runtime mutation. It does not exist in the database.
   - For all 16 pages and articles whose curated copy includes `"free UK delivery"`, this filter expands length by +17 characters, pushing rendered output into the 167–172 character range.

2. **Entity Corruption Mechanism (Observation 1.3 & Table 2)**:
   - Line 57 pipes the result through `| escape`.
   - Liquid's `escape` filter unconditionally turns `&` into `&amp;`.
   - In HTML5, ampersands inside attribute values (`<meta name="description" content="...">`) do not need to be entity-escaped when used as text and do not form an entity name.
   - Escaping creates literal `&amp;` strings inside the attribute, violating Requirement R4 ("with zero &amp; entity artifacts") and failing the crawler's entity gate.

3. **Template Scoping Strategy (Observation 1.2 & 1.5)**:
   - Homepage (`template.name == 'index'`) is already isolated on lines 43–45 with hardcoded title and description. It does not enter the `else` block.
   - Gift card pages (`template contains 'gift_card'`) are isolated on lines 46–50.
   - By introducing a template check `{%- if template.name == 'page' or template.name == 'article' -%}` within lines 55–58:
     - Curated descriptions for static pages and blog articles bypass the string expansion filters completely.
     - Curated descriptions bypass the `| escape` filter, outputting clean, unescaped plain text (`<meta name="description" content="{{ clean_desc | strip }}">`).
     - Legacy templates (e.g. `collection`, `product`, `search`) continue through the `{%- else -%}` branch, preserving 100% backward compatibility and zero regression risk.

4. **Safety Against Quote Injection (Observation 1.5)**:
   - Because all curated descriptions have zero double quotes, emitting them inside double-quoted attributes `content="..."` is completely safe.
   - To guarantee defensive protection against any rogue double quote breaking the HTML attribute in future edits, the Liquid logic includes `replace: '"', "'"` and `replace: '&quot;', "'"`. Single quotes do not break double-quoted HTML attributes and do not generate `&quot;` entity artifacts.

---

## 3. Recommended Remediation & Exact Liquid Logic

### 3.1 Precise Code Modification for `snippets/head.liquid`

#### Target Region to Replace (Lines 55–58 in current file):
```liquid
    {%- if page_description -%}
        {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}
        <meta name="description" content="{{ raw_desc | strip | escape }}">
    {%- endif -%}
```

#### Exact Drop-in Replacement:
```liquid
    {%- if page_description -%}
        {%- if template.name == 'page' or template.name == 'article' -%}
            {%- assign clean_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', "'" | replace: '&#39;', "'" | replace: '"', "'" -%}
            <meta name="description" content="{{ clean_desc | strip }}">
        {%- else -%}
            {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}
            <meta name="description" content="{{ raw_desc | strip | escape }}">
        {%- endif -%}
    {%- endif -%}
```

### 3.2 Full Surrounding Context (Lines 43–66 for verification)
```liquid
{%- if template.name == 'index' -%}
    <title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>
    <meta name="description" content="Shop archival framed canvas wall art (1.25&quot; pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets &amp; memory foam bath mats.">
{%- elsif template contains 'gift_card' -%}
    {%- assign formatted_initial_value = gift_card.initial_value | money_without_trailing_zeros: gift_card.currency -%}
    {%- assign formatted_initial_value_stripped = formatted_initial_value | strip_html -%}
    <title>{{ 'gift_cards.issued.title' | t: value: formatted_initial_value_stripped, shop: shop.name }}</title>
    <meta name="description" content="{{ 'gift_cards.issued.subtext' | t }}">
{%- else -%}
    {%- capture pwp_brand_suffix -%}{%- unless page_title contains shop.name or page_title contains '|' or page_title.size > 46 %} | {{ shop.name }}{%- endunless -%}{%- endcapture -%}
    {%- capture clean_seo_title -%}{{ page_title | strip | replace: 'Free UK Delivery', 'Free Tracked Delivery' }}{%- if current_tags -%}{% assign meta_tags = current_tags | join: ', ' %} &ndash; {{ 'general.meta.tags' | t: tags: meta_tags }}{%- endif -%}{%- if current_page != 1 %} &ndash; Page {{ current_page }}{%- endif -%}{{ pwp_brand_suffix }}{%- endcapture -%}
    <title>{{ clean_seo_title | strip }}</title>
    {%- if page_description -%}
        {%- if template.name == 'page' or template.name == 'article' -%}
            {%- assign clean_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', "'" | replace: '&#39;', "'" | replace: '"', "'" -%}
            <meta name="description" content="{{ clean_desc | strip }}">
        {%- else -%}
            {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}
            <meta name="description" content="{{ raw_desc | strip | escape }}">
        {%- endif -%}
    {%- endif -%}
{%- endif -%}
```

### 3.3 Execution Payload & Deployment Pattern for Worker
To deploy this fix to the live production theme `gid://shopify/OnlineStoreTheme/177936466293` and keep the local repository synchronized:

1. **Local Theme File Sync**:
   Update `snippets/head.liquid` in the workspace using the exact replacement block above.

2. **Live Theme Asset API Upload**:
   Execute a Shopify Admin REST Asset API PUT request:
   - **Method**: `PUT`
   - **URL**: `https://bencook96store.myshopify.com/admin/api/2025-01/themes/177936466293/assets.json`
   - **Headers**:
     - `Content-Type: application/json`
     - `X-Shopify-Access-Token: <OAUTH_ACCESS_TOKEN>`
   - **Body**:
     ```json
     {
       "asset": {
         "key": "snippets/head.liquid",
         "value": "<FULL_UPDATED_SNIPPETS_HEAD_LIQUID_CONTENT>"
       }
     }
     ```

3. **Proposed Standalone Deployment Script for Worker**:
   The Worker can execute this in a dedicated script (e.g. `remediate_theme_head_seo.mjs`):
   ```javascript
   import fs from 'fs';
   import path from 'path';
   import { fileURLToPath } from 'url';
   import { SHOP_DOMAIN, LOCAL_TOKEN_PATH } from './lib/cloud-env.mjs';

   const THEME_ID = '177936466293';
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);

   async function getAccessToken() {
     const cfg = JSON.parse(fs.readFileSync(LOCAL_TOKEN_PATH, 'utf8'));
     const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         client_id: cfg.SHOPIFY_CLIENT_ID.trim(),
         client_secret: cfg.SHOPIFY_CLIENT_SECRET.trim(),
         grant_type: 'client_credentials'
       })
     });
     if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
     const data = await res.json();
     return data.access_token;
   }

   async function updateHeadSnippet() {
     const token = await getAccessToken();
     const localPath = path.join(__dirname, 'snippets/head.liquid');
     let content = fs.readFileSync(localPath, 'utf8');

     const oldBlock = `    {%- if page_description -%}\n        {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}\n        <meta name="description" content="{{ raw_desc | strip | escape }}">\n    {%- endif -%}`;

     const newBlock = `    {%- if page_description -%}\n        {%- if template.name == 'page' or template.name == 'article' -%}\n            {%- assign clean_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', "'" | replace: '&#39;', "'" | replace: '"', "'" -%}\n            <meta name="description" content="{{ clean_desc | strip }}">\n        {%- else -%}\n            {%- assign raw_desc = page_description | strip_html | strip | replace: '&amp;', '&' | replace: '&quot;', '"' | replace: '&#39;', "'" | replace: 'Free UK Delivery', 'Free Tracked UK, US & EU Delivery' | replace: 'free UK delivery', 'free tracked UK, US & EU delivery' -%}\n            <meta name="description" content="{{ raw_desc | strip | escape }}">\n        {%- endif -%}\n    {%- endif -%}`;

     if (!content.includes(oldBlock)) {
       throw new Error('Target Liquid block not found in snippets/head.liquid');
     }

     const updatedContent = content.replace(oldBlock, newBlock);
     fs.writeFileSync(localPath, updatedContent, 'utf8');

     const putRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json`, {
       method: 'PUT',
       headers: {
         'Content-Type': 'application/json',
         'X-Shopify-Access-Token': token
       },
       body: JSON.stringify({ asset: { key: 'snippets/head.liquid', value: updatedContent } })
     });

     if (!putRes.ok) throw new Error(`PUT asset failed: ${putRes.status} ${await putRes.text()}`);
     const data = await putRes.json();
     console.log(`Successfully deployed snippets/head.liquid (${data.asset.size} bytes) to theme ${THEME_ID}.`);
   }

   updateHeadSnippet();
   ```

---

## 4. Caveats

- **Scope Boundary**: This investigation is strictly read-only and diagnostic. No modifications have been made to live theme assets or repository files during this turn.
- **Edge Cache Invalidation**: Shopify CDN edges may serve cached HTML for up to ~60–120 seconds after a theme asset update. When validating post-remediation, fetch requests should use cache-busting query parameters (e.g. `?_v=${Date.now()}`).
- **Theme Scope**: Scoping the fix to `template.name == 'page'` and `template.name == 'article'` deliberately leaves collection and product templates untouched, ensuring zero unexpected behavior on other catalog pages.

---

## 5. Conclusion

1. **Root Cause Confirmed**: The 26 live storefront failures reported by Challenger 1 are 100% caused by `snippets/head.liquid` line 56 (`replace: 'free UK delivery', 'free tracked UK, US & EU delivery'`) and line 57 (`{{ raw_desc | strip | escape }}`). The underlying page and article data stored in Shopify Admin GraphQL API is completely sound.
2. **Actionable Fix Formulated**: The proposed Liquid logic selectively isolates `template.name == 'page'` and `template.name == 'article'` to render clean, unescaped plain text meta descriptions without runtime string replacement.
3. **Comprehensive Resolution**: Deploying this fix will immediately restore all 16 overflowing URLs to their authored 150–155 character lengths and eliminate all 10 `&amp;` entity corruptions, bringing Challenger 1's test crawler to **339 / 339 passing checks (100% pass rate)**.

---

## 6. Verification Method

To independently verify this investigation and test the remediation:

### Step 1: Pre-Fix Verification (Confirming the Current Failure State)
Run a single-page probe against the live storefront:
```powershell
cd 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'
node --dns-result-order=ipv4first -e "
  const res = await fetch('https://printswithpassion.com/pages/japanese-ukiyo-e-anime-desk-mats-wall-art-uk');
  const html = await res.text();
  const m = html.match(/<meta\s+[^>]*?name=[\"']description[\"'][^>]*?content=[\"']([^\"']*)[\"']/i);
  console.log('Rendered Meta Description:', m[1]);
  console.log('Rendered Length:', m[1].length, '(Expected failure: 169 chars > 158)');
"
```

### Step 2: Post-Deployment Verification (Full Adversarial Suite)
Once Worker deploys the theme update, execute the full crawler:
```powershell
cd 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'
node --dns-result-order=ipv4first tests/adversarial_challenger_m4_crawler.mjs
```
*Expected Result*:
```
VERIFICATION SUMMARY: 339 passed, 0 failed out of 339 checks.
FINAL ADVERSARIAL VERDICT: APPROVED (ALL ASSERTIONS SATISFIED)
```

### Step 3: Entity Spot-Check
Confirm clean unescaped ampersands on the 3 sensitive guide pages:
```powershell
cd 'C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine'
node --dns-result-order=ipv4first -e "
  const urls = ['/pages/contact-us', '/pages/size-guide', '/pages/desk-size-visualizer'];
  for (const u of urls) {
    const res = await fetch('https://printswithpassion.com' + u + '?_v=' + Date.now());
    const html = await res.text();
    const m = html.match(/<meta\s+[^>]*?name=[\"']description[\"'][^>]*?content=[\"']([^\"']*)[\"']/i);
    console.log(u, 'has &amp;:', m[1].includes('&amp;'), 'has raw &:', m[1].includes('&'), 'len:', m[1].length);
  }
"
```
*Expected Output*: `has &amp;: false`, `has raw &: true`, `len: <= 158`.
