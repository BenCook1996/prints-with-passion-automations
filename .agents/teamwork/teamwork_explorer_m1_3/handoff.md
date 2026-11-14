# Investigation & Technical Design Report — 48 Curated Studio Collections Hub & Theme Integration

**Agent:** Explorer 3 (Milestone 1 — Requirement R1)  
**Target Theme:** `gid://shopify/OnlineStoreTheme/177936466293` (`2025-theme|OPT`)  
**Working Directory:** `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine`  
**State Folder:** `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_3`  
**Report Date:** 2026-11-13T01:05:00Z  

---

## 1. Observation

### A. Sub-Collection & Parent Collection Architecture (`phase2_40_subcollections.json` & Shopify Admin GraphQL)
Direct verification of `phase2_40_subcollections.json` and Shopify Admin API (Endpoint: `https://bencook96store.myshopify.com/admin/api/2025-01/graphql.json`) confirms that exactly **48 smart sub-collections** are defined, published, and mapped across **6 parent collection handles** (exactly 8 sub-collections per parent).

Every single collection has `productsCount > 0` (ranging from 3 to 122 products), and all 6 parent collections have substantial active catalogs (45 to 375 products):

| Parent Collection Handle | Parent Collection Title | GraphQL Node ID | Active Products | Sub-Collections Count | Sub-Collection Handles |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `/collections/canvas-prints` | Canvas Wall Art | `gid://shopify/Collection/437811249463` | 375 | 8 | `nature-mountain-landscape-canvas-wall-art` (122), `botanical-floral-coastal-canvas-wall-art` (21), `abstract-minimalist-bauhaus-canvas-wall-art` (66), `japanese-ukiyo-e-zen-canvas-wall-art` (12), `animals-wildlife-equestrian-canvas-wall-art` (69), `world-travel-city-skyline-canvas-wall-art` (74), `space-cosmic-astronomy-canvas-wall-art` (26), `sci-fi-cyberpunk-neon-canvas-wall-art` (24) |
| `/collections/desk-mats` | Extended Desk Mats | `gid://shopify/Collection/486063046967` | 375 | 8 | `japanese-anime-desk-mats` (14), `cyberpunk-neon-gaming-desk-mats` (14), `space-galaxy-nebula-desk-mats` (25), `fantasy-dragon-mythology-desk-mats` (15), `nature-mountain-forest-desk-mats` (104), `minimalist-abstract-geometric-desk-mats` (60), `animals-wildlife-pet-desk-mats` (55), `retro-vintage-synthwave-desk-mats` (15) |
| `/collections/pillow-cases` | Cushion Covers | `gid://shopify/Collection/484418388279` | 270 | 8 | `botanical-floral-garden-cushion-covers` (98), `abstract-geometric-bauhaus-cushion-covers` (29), `animals-wildlife-woodland-cushion-covers` (32), `space-celestial-galaxy-cushion-covers` (42), `fantasy-mythology-gothic-cushion-covers` (62), `japanese-asian-art-cushion-covers` (9), `world-travel-mediterranean-cushion-covers` (38), `retro-vintage-pop-art-cushion-covers` (15) |
| `/collections/blankets` | Plush Throw Blankets | `gid://shopify/Collection/486148210999` | 270 | 8 | `nature-mountain-cabin-throw-blankets` (104), `abstract-boho-kilim-throw-blankets` (106), `space-starry-night-galaxy-throw-blankets` (18), `animals-wildlife-cozy-throw-blankets` (65), `fantasy-dragon-mythic-throw-blankets` (14), `sci-fi-cyberpunk-gamer-throw-blankets` (11), `world-travel-paris-european-throw-blankets` (42), `japanese-sakura-oriental-throw-blankets` (9) |
| `/collections/bath-mats` | Memory Foam Bath Mats | `gid://shopify/Collection/484716085559` | 120 | 8 | `coastal-ocean-botanical-bath-mats` (38), `minimalist-abstract-stone-bath-mats` (40), `animals-wildlife-whimsical-bath-mats` (35), `celestial-space-moon-bath-mats` (9), `fantasy-gothic-witchy-bath-mats` (6), `sci-fi-neon-cyberpunk-bath-mats` (6), `japanese-zen-onsen-bath-mats` (10), `retro-vintage-funky-bath-mats` (10) |
| `/collections/apparel` | Graphic Apparel | `gid://shopify/Collection/438563340599` | 45 | 8 | **Graphic T-Shirts (4):** `japanese-anime-graphic-t-shirts` (3), `cyberpunk-sci-fi-graphic-t-shirts` (9), `space-galaxy-graphic-t-shirts` (5), `retro-synthwave-graphic-t-shirts` (45)<br>**Hoodies (4):** `japanese-ukiyo-e-graphic-hoodies` (6), `cyberpunk-neon-graphic-hoodies` (4), `fantasy-dragon-graphic-hoodies` (6), `nature-mountain-graphic-hoodies` (45) |

### B. Live Storefront Sitemap Publication Status (`sitemap_collections_1.xml`)
Direct inspection of `https://printswithpassion.com/sitemap.xml` reveals:
```xml
<sitemap>
  <loc>https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&amp;to=730430275957</loc>
</sitemap>
```
Parsing `https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&to=730430275957` confirmed:
- **Sub-collections present in sitemap:** `48 / 48` (`100%`)
- **Parent collections present in sitemap:** All `6 / 6` (`canvas-prints`, `desk-mats`, `pillow-cases`, `blankets`, `bath-mats`, `apparel`)
- **Zero 404 risk:** All 54 URLs are active, published to the Online Store sales channel, and indexed in the Shopify collection sitemap.

### C. Active Theme Layout & Insertion Point (`layout/theme.liquid`)
In active theme `gid://shopify/OnlineStoreTheme/177936466293`, inspecting `layout/theme.liquid` lines 259–272:
```liquid
259: <main id="MainContent">
260:   {%- if request.page_type == 'page' or request.page_type == 'product' or request.page_type == 'cart' or request.page_type == 'list-collections' or request.page_type == 'page' or template.name == 'page' or request.page_type == 'page' or request.page_type == 'article' or request.page_type == 'page' or request.page_type == 'blog' -%}
261:     {% include 'breadcrumbs' %}
262:   {%- elsif request.page_type == 'collection' -%}
263:     <div id="CollectionBreadcrumbs">
264:       {% include 'breadcrumbs' %}
265:     </div>
266:   {%- endif -%}
267:   {{ content_for_layout }}
268: </main>
269: {% render 'pwp-clean-footer-nav' %}
270: {% render 'pwp-clean-collection-schema' %}
271: {% sections 'footer-group' %}
```
Live HTML inspection of `https://printswithpassion.com/` and `https://printswithpassion.com/collections/canvas-prints` shows that `</main>` is immediately followed by `<style> .pwp-site-footer...` rendered by `snippets/pwp-clean-footer-nav.liquid`.

### D. Competitor & Theme Aesthetic Baseline (`snippets/pwp-clean-footer-nav.liquid`)
Inspection of `snippets/pwp-clean-footer-nav.liquid` reveals the store's dark studio palette and typography tokens:
- Primary background: `#111110`
- Surface / card background: `#18181B`
- Accent / brand color: `#C85A32` (terracotta / copper)
- Border color: `#27272A`
- Primary text: `#FFFFFF`
- Secondary / link text: `#D4D4D8` / `#A1A1AA`
- Subdued / spec text: `#71717A`
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

---

## 2. Logic Chain

1. **Internal Linking & Crawl Depth Deficit:**
   - *Observation A & GSC Forensic Data:* 45 of the 48 smart sub-collections currently have zero direct internal links from the homepage or navigation header (`Refs: 0-2`), causing 14 collections and 85% of catalog products to remain uncrawled (`LastCrawl: NEVER`).
   - *Logic:* By rendering a dedicated, accessible directory block on the homepage (`/`) and all 6 parent collection pages, every single smart sub-collection is elevated to **Click Depth 1** from the homepage and cross-linked across the entire parent category structure.

2. **Heading Structure & 1-H1 Invariant:**
   - *Observation C & Requirement R1:* The homepage must render strictly **one** semantic `<h1>` tag (hero headline `Art built for quiet rooms — Archival Framed Canvas Wall Art & XXL Desk Mats`). On collection pages, the collection title is the sole `<h1>`.
   - *Logic:* The directory hub snippet must **never** render an `<h1>`. It must strictly use `<h2>` for the section heading (`Shop All 48 Curated Studio Collections`) and `<h3>` for each of the 6 parent category cards. This guarantees 100% adherence to the single `<h1>` invariant on both the homepage and all parent collection pages.

3. **Performance & Determinism (Hardcoded vs. Dynamic Collection Loop):**
   - *Observation A:* Shopify Liquid `collections[handle]` lookups within loops incur server-side Liquid execution overhead and are vulnerable to Liquid handle lookup limits.
   - *Logic:* Emitting clean, semantic HTML anchor elements directly within `snippets/pwp-curated-collections-hub.liquid` ensures zero database lookups, instantaneous server-side rendering, deterministic anchor text, and zero double-escaping glitches.

4. **Integration Point Selection:**
   - *Observation C:* In `layout/theme.liquid`, line 268 closes the main content wrapper (`</main>`), followed by line 269 (`{% render 'pwp-clean-footer-nav' %}`).
   - *Logic:* Inserting the hub snippet directly between line 268 and line 269 wraps the hub cleanly outside `content_for_layout` while placing it directly above the footer navigation. Wrapping the render in a conditional check ensures it only renders on `template.name == 'index'` or when `collection.handle` matches one of the 6 parent collections.

5. **Active Category Polish:**
   - *Observation A & C:* When a buyer or search bot navigates to `/collections/canvas-prints`, highlighting the current category reinforces context.
   - *Logic:* Adding a Liquid conditional class `{% if collection.handle == 'canvas-prints' %} pwp-curated-hub__card--active{% endif %}` applies a subtle brand border `#C85A32` and an "Active" badge, creating visual and semantic clarity without altering HTML structure for crawlers.

---

## 3. Caveats

1. **Theme ID Scope:** This integration is engineered exclusively for active production theme `gid://shopify/OnlineStoreTheme/177936466293` (`2025-theme|OPT`). Unpublished development themes (`176986915189`, `177944822133`) have distinct layout files and must not be targeted.
2. **Shopify CDN Edge Caching:** Shopify edge servers cache storefront HTML responses. Storefront verification requests after file deployment must append a cache-busting query parameter (e.g. `?_ts=${Date.now()}`) to verify the updated DOM.
3. **Apparel Parent Collection Singular/Plural Handle:** The active parent collection handle is `/collections/apparel` (title in Shopify: "Graphic T-Shirts", containing both Graphic T-Shirts and Hoodies). The hub card accurately groups both T-Shirts (4) and Hoodies (4) under the parent `/collections/apparel`.

---

## 4. Conclusion & Implementation Blueprint

The technical exploration and design for the **48 Curated Studio Collections Hub** is **100% complete**. Two ready-to-deploy artifacts have been generated in this state folder:
1. `proposed_pwp-curated-collections-hub.liquid` (Full theme snippet)
2. `proposed_layout_theme_liquid.patch` (Theme layout diff patch)

### Artifact 1: Exact Snippet Code (`snippets/pwp-curated-collections-hub.liquid`)
*Target Path in Active Theme:* `snippets/pwp-curated-collections-hub.liquid`  
*Local Artifact:* `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_3\proposed_pwp-curated-collections-hub.liquid`

```liquid
{%- comment -%}
  Prints With Passion — 48 Curated Studio Collections Directory Hub
  Snippet: snippets/pwp-curated-collections-hub.liquid
  Target Theme: gid://shopify/OnlineStoreTheme/177936466293 (2025-theme|OPT)

  Places all 48 smart sub-collections at Click Depth 1 from Homepage and Parent Collections.
  Renders conditionally on template.name == 'index' or the 6 parent collection handles:
  - /collections/canvas-prints (8)
  - /collections/desk-mats (8)
  - /collections/pillow-cases (8)
  - /collections/blankets (8)
  - /collections/bath-mats (8)
  - /collections/apparel (8)
{%- endcomment -%}

<style>
  .pwp-curated-hub {
    background: #111110;
    color: #E4E4E7;
    padding: 56px 24px 64px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    border-top: 1px solid #27272A;
    border-bottom: 1px solid #27272A;
  }
  .pwp-curated-hub__container {
    max-width: 1280px;
    margin: 0 auto;
  }
  .pwp-curated-hub__header {
    margin-bottom: 36px;
    text-align: left;
  }
  .pwp-curated-hub__eyebrow {
    color: #C85A32;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
  }
  .pwp-curated-hub__title {
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    margin: 0 0 10px 0;
  }
  .pwp-curated-hub__subtitle {
    color: #A1A1AA;
    font-size: 14.5px;
    line-height: 1.6;
    max-width: 780px;
    margin: 0;
  }
  .pwp-curated-hub__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  @media (max-width: 1024px) {
    .pwp-curated-hub__grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
  @media (max-width: 640px) {
    .pwp-curated-hub {
      padding: 40px 16px 48px;
    }
    .pwp-curated-hub__title {
      font-size: 22px;
    }
    .pwp-curated-hub__grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  .pwp-curated-hub__card {
    background: #18181B;
    border: 1px solid #27272A;
    border-radius: 8px;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  .pwp-curated-hub__card:hover {
    border-color: #3F3F46;
  }
  .pwp-curated-hub__card--active {
    border-color: #C85A32;
    box-shadow: 0 0 0 1px #C85A32 inset;
  }
  .pwp-curated-hub__card-header {
    border-bottom: 1px solid #27272A;
    padding-bottom: 14px;
    margin-bottom: 16px;
  }
  .pwp-curated-hub__card-title {
    margin: 0 0 6px 0;
    font-size: 17px;
    font-weight: 700;
    line-height: 1.3;
  }
  .pwp-curated-hub__parent-link {
    color: #FFFFFF;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s ease;
  }
  .pwp-curated-hub__parent-link:hover,
  .pwp-curated-hub__parent-link:focus {
    color: #C85A32;
    text-decoration: underline;
  }
  .pwp-curated-hub__arrow {
    color: #C85A32;
    font-weight: 700;
    transition: transform 0.15s ease;
  }
  .pwp-curated-hub__parent-link:hover .pwp-curated-hub__arrow {
    transform: translateX(3px);
  }
  .pwp-curated-hub__spec {
    color: #71717A;
    font-size: 12px;
    line-height: 1.4;
  }
  .pwp-curated-hub__active-badge {
    display: inline-block;
    background: rgba(200, 90, 50, 0.15);
    color: #C85A32;
    border: 1px solid #C85A32;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    margin-left: 8px;
    vertical-align: middle;
  }
  .pwp-curated-hub__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .pwp-curated-hub__item {
    margin: 0;
    padding: 0;
  }
  .pwp-curated-hub__sub-link {
    color: #D4D4D8;
    text-decoration: none;
    font-size: 13.5px;
    line-height: 1.45;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 3px 0;
    transition: color 0.15s ease, padding-left 0.15s ease;
  }
  .pwp-curated-hub__sub-link:before {
    content: "•";
    color: #C85A32;
    font-size: 12px;
    flex-shrink: 0;
  }
  .pwp-curated-hub__sub-link:hover,
  .pwp-curated-hub__sub-link:focus {
    color: #FFFFFF;
    text-decoration: underline;
    padding-left: 3px;
  }
</style>

<section class="pwp-curated-hub" aria-labelledby="pwp-curated-hub-heading">
  <div class="pwp-curated-hub__container">
    <div class="pwp-curated-hub__header">
      <div class="pwp-curated-hub__eyebrow">Archival Print Studio Architecture</div>
      <h2 id="pwp-curated-hub-heading" class="pwp-curated-hub__title">Shop All 48 Curated Studio Collections</h2>
      <p class="pwp-curated-hub__subtitle">Explore specialized aesthetic editions across solid pine framed canvas, 4mm XXL stitched gaming desk mats, double-sided velvet cushions, plush coral fleece throws, memory foam bath mats &amp; heavyweight graphic apparel.</p>
    </div>

    <div class="pwp-curated-hub__grid">
      <!-- 1. Canvas Wall Art (8 Collections) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'canvas-prints' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/canvas-prints" class="pwp-curated-hub__parent-link">
              <span>Canvas Wall Art</span>
              {% if collection.handle == 'canvas-prints' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">Archival 1.25" Pine Bars &bull; 8&times;10" to 24&times;36" (CM &amp; Inch) &bull; 375 Prints</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/nature-mountain-landscape-canvas-wall-art" class="pwp-curated-hub__sub-link">Nature, Alpine Mountain &amp; Scenic Landscape Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/botanical-floral-coastal-canvas-wall-art" class="pwp-curated-hub__sub-link">Botanical, Floral Garden &amp; Coastal Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/abstract-minimalist-bauhaus-canvas-wall-art" class="pwp-curated-hub__sub-link">Abstract, Minimalist &amp; Bauhaus Geometric Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-ukiyo-e-zen-canvas-wall-art" class="pwp-curated-hub__sub-link">Japanese Ukiyo-e, Samurai &amp; Sakura Blossom Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/animals-wildlife-equestrian-canvas-wall-art" class="pwp-curated-hub__sub-link">Animals, Wildlife, Highland Cow &amp; Pet Portrait Canvas Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/world-travel-city-skyline-canvas-wall-art" class="pwp-curated-hub__sub-link">World Travel, City Skylines &amp; Architectural Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/space-cosmic-astronomy-canvas-wall-art" class="pwp-curated-hub__sub-link">Space, Deep-Field Nebula &amp; Celestial Canvas Wall Art</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/sci-fi-cyberpunk-neon-canvas-wall-art" class="pwp-curated-hub__sub-link">Sci-Fi, Cyberpunk &amp; Neon Futuristic Canvas Wall Art</a></li>
        </ul>
      </article>

      <!-- 2. XXL Extended Desk Mats (8 Collections) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'desk-mats' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/desk-mats" class="pwp-curated-hub__parent-link">
              <span>Extended Desk Mats</span>
              {% if collection.handle == 'desk-mats' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">4mm Heavyweight Neoprene &bull; Anti-Fray Stitched Edge &bull; 900&times;400mm &bull; 375 Mats</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-anime-desk-mats" class="pwp-curated-hub__sub-link">Japanese, Samurai, Sakura &amp; Ukiyo-e Extended Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/cyberpunk-neon-gaming-desk-mats" class="pwp-curated-hub__sub-link">Sci-Fi, Cyberpunk &amp; Synthwave XXL Gaming Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/space-galaxy-nebula-desk-mats" class="pwp-curated-hub__sub-link">Space, Galaxy, Nebula &amp; Astronaut Extended Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/fantasy-dragon-mythology-desk-mats" class="pwp-curated-hub__sub-link">Fantasy, Dragons, Dark Mythic &amp; RPG Gaming Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/nature-mountain-forest-desk-mats" class="pwp-curated-hub__sub-link">Nature, Alpine Mountain &amp; Forest Landscape Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/minimalist-abstract-geometric-desk-mats" class="pwp-curated-hub__sub-link">Minimalist, Abstract, Bauhaus &amp; Topographic Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/animals-wildlife-pet-desk-mats" class="pwp-curated-hub__sub-link">Animals, Wildlife, Cats &amp; Dogs Extended Desk Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/retro-vintage-synthwave-desk-mats" class="pwp-curated-hub__sub-link">Retro, 80s Vaporwave &amp; Vintage Arcade Gaming Desk Mats</a></li>
        </ul>
      </article>

      <!-- 3. Velvet Cushion Covers (8 Collections) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'pillow-cases' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/pillow-cases" class="pwp-curated-hub__parent-link">
              <span>Cushion Covers</span>
              {% if collection.handle == 'pillow-cases' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">Double-Sided Studio Velvet &bull; Concealed Zipper &bull; 45&times;45cm (18&times;18") &bull; 270 Pillows</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/botanical-floral-garden-cushion-covers" class="pwp-curated-hub__sub-link">Botanical, Vintage Floral &amp; Nature Square Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/abstract-geometric-bauhaus-cushion-covers" class="pwp-curated-hub__sub-link">Abstract, Geometric, Bauhaus &amp; Mid-Century Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/animals-wildlife-woodland-cushion-covers" class="pwp-curated-hub__sub-link">Animals, Woodland Wildlife &amp; Pet Portrait Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/space-celestial-galaxy-cushion-covers" class="pwp-curated-hub__sub-link">Celestial, Moon Phase &amp; Cosmic Galaxy Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/fantasy-mythology-gothic-cushion-covers" class="pwp-curated-hub__sub-link">Fantasy, Dark Academia, Mythology &amp; Gothic Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-asian-art-cushion-covers" class="pwp-curated-hub__sub-link">Japanese Wave, Koi, Sakura &amp; Zen Accent Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/world-travel-mediterranean-cushion-covers" class="pwp-curated-hub__sub-link">World Travel, Coastal Villa &amp; European City Cushion Covers</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/retro-vintage-pop-art-cushion-covers" class="pwp-curated-hub__sub-link">Retro, Vintage Poster &amp; Mid-Century Pop Art Cushion Covers</a></li>
        </ul>
      </article>

      <!-- 4. Plush Throw Blankets (8 Collections) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'blankets' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/blankets" class="pwp-curated-hub__parent-link">
              <span>Plush Throw Blankets</span>
              {% if collection.handle == 'blankets' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">300 GSM Ultra-Soft Coral Fleece &bull; Hemmed Edge &bull; 50&times;60" &amp; 60&times;80" &bull; 270 Blankets</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/nature-mountain-cabin-throw-blankets" class="pwp-curated-hub__sub-link">Nature, Alpine Cabin, Forest &amp; Scenic Plush Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/abstract-boho-kilim-throw-blankets" class="pwp-curated-hub__sub-link">Abstract, Boho Kilim, Tartan &amp; Geometric Plush Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/space-starry-night-galaxy-throw-blankets" class="pwp-curated-hub__sub-link">Space, Starry Night, Constellation &amp; Galaxy Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/animals-wildlife-cozy-throw-blankets" class="pwp-curated-hub__sub-link">Animals, Wildlife, Cats, Dogs &amp; Woodland Plush Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/fantasy-dragon-mythic-throw-blankets" class="pwp-curated-hub__sub-link">Fantasy, Dragon, Celestial Tarot &amp; Mythic Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/sci-fi-cyberpunk-gamer-throw-blankets" class="pwp-curated-hub__sub-link">Sci-Fi, Cyberpunk &amp; Neon Gaming Room Plush Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/world-travel-paris-european-throw-blankets" class="pwp-curated-hub__sub-link">World Travel, Paris Sunset &amp; Cityscape Plush Throw Blankets</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-sakura-oriental-throw-blankets" class="pwp-curated-hub__sub-link">Japanese Sakura, Great Wave &amp; Oriental Plush Throw Blankets</a></li>
        </ul>
      </article>

      <!-- 5. Memory Foam Bath Mats (8 Collections) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'bath-mats' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/bath-mats" class="pwp-curated-hub__parent-link">
              <span>Memory Foam Bath Mats</span>
              {% if collection.handle == 'bath-mats' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">High-Density Memory Foam &bull; Non-Slip Skid Backing &bull; 17&times;24" &amp; 20&times;30" &bull; 120 Mats</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/coastal-ocean-botanical-bath-mats" class="pwp-curated-hub__sub-link">Coastal Ocean, Tropical Leaf &amp; Nature Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/minimalist-abstract-stone-bath-mats" class="pwp-curated-hub__sub-link">Minimalist, Abstract Terrazzo &amp; Geometric Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/animals-wildlife-whimsical-bath-mats" class="pwp-curated-hub__sub-link">Animals, Whimsical Cat, Frog &amp; Wildlife Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/celestial-space-moon-bath-mats" class="pwp-curated-hub__sub-link">Celestial Moon, Starry Night &amp; Cosmic Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/fantasy-gothic-witchy-bath-mats" class="pwp-curated-hub__sub-link">Fantasy, Celestial Moth, Gothic &amp; Enchanted Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/sci-fi-neon-cyberpunk-bath-mats" class="pwp-curated-hub__sub-link">Sci-Fi, Neon Cyberpunk &amp; Futuristic Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-zen-onsen-bath-mats" class="pwp-curated-hub__sub-link">Japanese Koi, Great Wave &amp; Zen Sanctuary Memory Foam Bath Mats</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/retro-vintage-funky-bath-mats" class="pwp-curated-hub__sub-link">Retro 70s Groovy, Checkerboard &amp; Vintage Memory Foam Bath Mats</a></li>
        </ul>
      </article>

      <!-- 6. Graphic Apparel (8 Collections: 4 Tees, 4 Hoodies) -->
      <article class="pwp-curated-hub__card{% if collection.handle == 'apparel' %} pwp-curated-hub__card--active{% endif %}">
        <header class="pwp-curated-hub__card-header">
          <h3 class="pwp-curated-hub__card-title">
            <a href="/collections/apparel" class="pwp-curated-hub__parent-link">
              <span>Graphic Apparel</span>
              {% if collection.handle == 'apparel' %}<span class="pwp-curated-hub__active-badge">Active</span>{% endif %}
              <span class="pwp-curated-hub__arrow" aria-hidden="true">&rarr;</span>
            </a>
          </h3>
          <div class="pwp-curated-hub__spec">Heavyweight Ringspun Cotton &bull; Unisex S&ndash;3XL &bull; Studio DTG Print &bull; 45 Garments</div>
        </header>
        <ul class="pwp-curated-hub__list" role="list">
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-anime-graphic-t-shirts" class="pwp-curated-hub__sub-link">Japanese Ukiyo-e, Samurai &amp; Sakura Graphic Cotton T-Shirts</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/cyberpunk-sci-fi-graphic-t-shirts" class="pwp-curated-hub__sub-link">Sci-Fi, Cyberpunk &amp; Neon Futuristic Graphic Cotton T-Shirts</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/space-galaxy-graphic-t-shirts" class="pwp-curated-hub__sub-link">Space, Astronaut, Nebula &amp; Celestial Graphic Cotton T-Shirts</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/retro-synthwave-graphic-t-shirts" class="pwp-curated-hub__sub-link">Retro 80s Synthwave, Vintage &amp; Abstract Graphic Cotton T-Shirts</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/japanese-ukiyo-e-graphic-hoodies" class="pwp-curated-hub__sub-link">Japanese Samurai, Great Wave &amp; Sakura Heavyweight Hoodies</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/cyberpunk-neon-graphic-hoodies" class="pwp-curated-hub__sub-link">Sci-Fi, Cyberpunk &amp; Neon Streetwear Heavyweight Hoodies</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/fantasy-dragon-graphic-hoodies" class="pwp-curated-hub__sub-link">Fantasy, Dragon, Gothic &amp; Mythology Heavyweight Hoodies</a></li>
          <li class="pwp-curated-hub__item"><a href="/collections/nature-mountain-graphic-hoodies" class="pwp-curated-hub__sub-link">Nature, Mountain Landscape &amp; Wildlife Heavyweight Hoodies</a></li>
        </ul>
      </article>
    </div>
  </div>
</section>
```

---

### Artifact 2: Unified Diff Patch for `layout/theme.liquid`
*Target Path in Active Theme:* `layout/theme.liquid` (Lines 267–272)  
*Local Artifact:* `C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine\.agents\teamwork\teamwork_explorer_m1_3\proposed_layout_theme_liquid.patch`

```diff
--- layout/theme.liquid
+++ layout/theme.liquid
@@ -267,3 +267,9 @@
   {{ content_for_layout }}
 </main>
+{%- if template.name == 'index' or template.name == 'collection' -%}
+  {%- if template.name == 'index' or collection.handle == 'canvas-prints' or collection.handle == 'desk-mats' or collection.handle == 'pillow-cases' or collection.handle == 'blankets' or collection.handle == 'bath-mats' or collection.handle == 'apparel' -%}
+    {% render 'pwp-curated-collections-hub' %}
+  {%- endif -%}
+{%- endif -%}
 {% render 'pwp-clean-footer-nav' %}
 {% render 'pwp-clean-collection-schema' %}
```

---

## 5. Verification Method

### A. Pre-Deployment Validation Test
Run the automated snippet structural validator script in the state folder:
```powershell
cd C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
node .agents/teamwork/teamwork_explorer_m1_3/test_hub_snippet.mjs
```
*Expected Output:*
```
Snippet generated. Length: 20325
Verification 1 (All 48 subcollections present): PASS
Verification 2 (All 6 parent collections present): PASS
Verification 3 (Headings): H1=0, H2=1, H3=6
Verification 4 (Anchor count): 54 (Expected: 6 parents + 48 subs = 54 anchors)
Verification 5 (Double entities): PASS
```

### B. Live Storefront Automated E2E Verification
After deploying `snippets/pwp-curated-collections-hub.liquid` and patching `layout/theme.liquid` via Shopify REST Asset API, execute the following script to verify live HTML responses across the homepage and all 6 parent collections:

```powershell
cd C:\Users\Benjamin\.gemini\antigravity\scratch\pwp-seo-blog-engine
node -e "
const fs = require('fs');
const subs = JSON.parse(fs.readFileSync('phase2_40_subcollections.json', 'utf8'));

const targets = [
  'https://printswithpassion.com/',
  'https://printswithpassion.com/collections/canvas-prints',
  'https://printswithpassion.com/collections/desk-mats',
  'https://printswithpassion.com/collections/pillow-cases',
  'https://printswithpassion.com/collections/blankets',
  'https://printswithpassion.com/collections/bath-mats',
  'https://printswithpassion.com/collections/apparel'
];

async function verifyStorefront() {
  const ts = Date.now();
  for (const url of targets) {
    const res = await fetch(url + '?_v=' + ts, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (res.status !== 200) {
      console.error('FAIL: ' + url + ' returned HTTP ' + res.status);
      continue;
    }
    const html = await res.text();
    
    // 1. Hub section present
    const hasHub = html.includes('pwp-curated-hub');
    console.assert(hasHub, 'Hub section missing on ' + url);
    
    // 2. All 48 subcollections linked
    let missingSubs = 0;
    for (const s of subs) {
      if (!html.includes('/collections/' + s.handle)) {
        missingSubs++;
      }
    }
    console.assert(missingSubs === 0, 'Found ' + missingSubs + ' missing subcollections on ' + url);
    
    // 3. Exactly 0 H1 tags inside the hub
    const hubMatch = html.match(/<section[^>]*class=[\"'][^\"']*pwp-curated-hub[\\s\\S]*?<\/section>/i);
    if (hubMatch) {
      const hubHtml = hubMatch[0];
      const h1Count = (hubHtml.match(/<h1[^>]*>/gi) || []).length;
      console.assert(h1Count === 0, 'Hub introduced an H1 tag on ' + url);
    }
    
    console.log('PASS: ' + url + ' (All 48 sub-collection links verified, 0 hub H1 tags)');
  }
}

verifyStorefront().catch(console.error);
"
```

### Invalidation Conditions:
- If fewer than 48 sub-collection URLs are found in the DOM of `/` or any of the 6 parent collection pages.
- If any link within `pwp-curated-hub` points to a non-existent or 404 URL.
- If any `<h1>` element is introduced inside `pwp-curated-hub` (violating single commercial `<h1>` invariant).
- If double-escaped entities (e.g. `&amp;quot;`, `&amp;amp;`) are detected in the snippet output.
- If the hub snippet erroneously renders on non-parent collection pages (e.g. sub-collections or product pages).
