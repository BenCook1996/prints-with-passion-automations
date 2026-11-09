# Prints With Passion — Competitor Organic SEO Replication Playbook
**Document Version:** 1.0.0  
**Status:** Approved for Implementation (Milestone M1 / Requirement R4)  
**Target Domain:** `https://printswithpassion.com`  
**Primary Competitor Benchmarks:** Kinetic Labs, Deskr, Wallfillers, Akua Home  
**Target Substrates:** XXL Desk Mats & Gaming Pads, Stretched Canvas Wall Art, Desk Setup Accessories  

---

## 1. Executive Summary & Strategic Rationale

Prints With Passion suffered from an algorithmic sitewide quality demotion in Google Search Console, characterized by an indexation rate of only ~8% (1,023 indexed out of 12,150 discovered/crawled URLs) and negligible organic revenue. A forensic investigation revealed that this penalty was not caused by technical errors (such as robots.txt, canonical mismatches, or crawl failures), but by **scaled content abuse and sitewide boilerplate bloat**:
1. **Catalog Hyper-Duplication:** Over 28,000 product URLs generated through programmatic variants (e.g., Roman numeral "Edition II–XX" clones), diluting domain authority across thousands of near-identical pages.
2. **Boilerplate & Link Injection:** Storefront templates injected heavy promotional blocks (such as `<!-- PWP_INPAGES_3RULE_HERO_START -->`, repeated `STUDIO15` discount codes, and a massive 119-link navigation grid in `snippets/pwp-seo-curated-directory.liquid`), pushing collection page sizes past 1.19 MB.
3. **Structured Data Spam:** Injected `FAQPage` JSON-LD schema across all 70 collection descriptions. Following Google's Search Central updates, FAQ rich results have been deprecated for standard commercial sites, and repeating static FAQ blocks across dozens of category pages acts as a clear algorithmic footprint for mass-generated thin content.
4. **Keyword Mismatch:** Automated generators targeted synthetic 12–16 word phrases (e.g., `best 80x40 crimson samurai sakura extended mouse pad for mechanical keyboard acoustics`) that generate zero real search volume, while ignoring the core high-intent commercial terms shoppers use when buying premium desk pads and canvas art.

To reverse this algorithmic penalty, Prints With Passion is shifting from programmatic volume generation to a **lean, curated catalog (~1,500 distinct designs)** supported by genuine quality signals. This playbook reverse-engineers the architectural, on-page, and technical SEO patterns of the four top-ranking organic competitors in our niche:
- **Kinetic Labs** (`kineticlabs.com`): The gold standard for mechanical keyboard and desk mat organic search.
- **Deskr** (`deskr.co`): The benchmark for custom and gaming desk pad product presentation, dual-unit specifications, and commercial conversion.
- **Wallfillers** (`wallfillers.co.uk`): The UK organic market leader for canvas wall art, room-scale sizing, and architectural intent matching.
- **Akua Home** (`akuahome.co.uk`): The benchmark for minimalist aesthetic wall decor, museum-grade material transparency, and interior design search alignment.

---

## 2. Competitive Teardown & SERP Architecture Analysis

### 2.1 Kinetic Labs (`kineticlabs.com`)
- **SERP Positioning:** Ranks #1–#3 for high-volume head terms: `desk mats`, `xl mouse pads`, `mechanical keyboard desk mat`, and `custom desk mats`.
- **Information Architecture:**
  - Strict 3-tier hierarchy: `Home > Collection (/collections/desk-mats) > Product (/products/[handle])`.
  - Zero faceted navigation bloat. Filtering is handled client-side via clean URL query parameters without creating separate indexable landing pages.
- **Structured Data Strategy:**
  - Implements a clean, unified `@graph` containing only:
    1. `WebSite` (search potential action)
    2. `CollectionPage` (canonical URL, page name, description)
    3. `BreadcrumbList` (3-tier breadcrumbs)
    4. `ItemList` (listing top 24–48 products with position, name, and URL)
  - **Zero `FAQPage` schema on collections.** Kinetic Labs relies entirely on clear product metadata and category context rather than schema tricks.
- **On-Page Copy Formulation:**
  - Top-of-page collection copy is concise (120–160 words), spec-driven, and positioned above or alongside the product grid.
  - Highlights physical properties immediately: "900mm x 400mm x 4mm", "smooth cloth surface", "dense rubber base", "anti-fray stitched edges".

### 2.2 Deskr (`deskr.co`)
- **SERP Positioning:** Dominates commercial gaming and workspace setup queries: `topo desk pad`, `custom desk pad`, `black and white desk mat`.
- **Product Page (PDP) Architecture:**
  - **Dual-Unit Specifications:** Deskr presents both Metric and Imperial units in every product specification table (e.g., `900 x 400 x 4mm / 35.4" x 15.7" x 0.16"`). This captures both UK/European search intent (metric-first) and US/International search intent (imperial-first) without keyword stuffing.
  - **Material Transparency:** Every listing explicitly states:
    - 4mm thick natural rubber anti-slip base.
    - 360° precision color-matched anti-fray perimeter stitching.
    - Water-resistant micro-woven polyester glide surface.
  - **Semantic Product Schema:** Implements clean `Product` schema with `name`, `image[]`, `description`, `brand`, `offers` (with real-time price and currency), and `aggregateRating` backed by real verified customer reviews.

### 2.3 Wallfillers (`wallfillers.co.uk`)
- **SERP Positioning:** Top organic positions in the UK for intent-driven interior decor queries: `stretched canvas wall art uk`, `large canvas above sofa`, `living room wall art 3 piece`, `canvas prints over bed`.
- **Search Intent Alignment:**
  - Wallfillers aligns their collections and landing pages to **spatial problems** rather than just abstract design tags. Shoppers search for art based on where it hangs in the room.
  - Category pages explicitly address the **"57-inch rule"** (hanging the center of the canvas 57 inches / 145 cm from the floor) and proportional width guidelines (canvas should span 60% to 75% of the furniture width below it).
- **Physical Specifications:**
  - Stretcher frame depth explicitly stated: "Solid 20mm standard pine stretcher frame" vs "38mm deep luxury gallery box frame".
  - Canvas weight: 320–380gsm pure cotton canvas with archival HP latex pigment inks.
  - Pre-installed brass hanging brackets and wall mounting cushions.

### 2.4 Akua Home (`akuahome.co.uk`)
- **SERP Positioning:** Top 5 rankings for premium minimalist decor: `minimalist canvas art uk`, `large abstract wall art`, `neutral aesthetic canvas prints`.
- **Design Philosophy & Footers:**
  - **No sprawling link farms:** Instead of a 100+ link directory, Akua Home uses an elegant 4-column footer (Shop, Guides & Sizing, Customer Service, Legal & Sustainability).
  - Editorial buyer guides function as standalone high-value articles that solve sizing and color palette coordination dilemmas, internally linking to parent collections without spammy affiliate or discount callouts.

---

## 3. Reusable Template 1: Clean Collection Page Structured Data

### 3.1 Guiding Rules
1. **Strictly Forbidden:** Injected `FAQPage` schema on collection templates. It adds 30–50 KB of redundant DOM payload, triggers spam flags, and yields zero rich snippets.
2. **Mandatory Inclusions:** A single JSON-LD `@graph` defining:
   - `CollectionPage`: Canonical identity, description, and primary entity.
   - `BreadcrumbList`: Complete hierarchy (`Home > Category > Sub-Category`).
   - `ItemList`: Ordered catalog representation listing products on the page with their relative URLs, names, and positions.

### 3.2 Canonical JSON-LD Implementation Example
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "https://printswithpassion.com/collections/desk-mats#webpage",
      "url": "https://printswithpassion.com/collections/desk-mats",
      "name": "XXL Extended Desk Mats & Gaming Mouse Pads | Prints With Passion",
      "description": "Premium 900x400x4mm extended desk mats and gaming pads engineered with high-density micro-weave cloth, 360° anti-fray stitching, and 4mm natural rubber bases.",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://printswithpassion.com/#website",
        "url": "https://printswithpassion.com",
        "name": "Prints With Passion",
        "description": "Curated UK Workspace Accessories & Fine Art Wall Decor"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://printswithpassion.com/collections/desk-mats#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://printswithpassion.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Collections",
          "item": "https://printswithpassion.com/collections"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Desk Mats",
          "item": "https://printswithpassion.com/collections/desk-mats"
        }
      ]
    },
    {
      "@type": "ItemList",
      "@id": "https://printswithpassion.com/collections/desk-mats#itemlist",
      "name": "Featured XXL Desk Mats",
      "numberOfItems": 3,
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://printswithpassion.com/products/kanagawa-great-wave-xxl-desk-mat",
          "name": "The Great Wave of Kanagawa XXL Extended Desk Mat (900×400×4mm)"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://printswithpassion.com/products/minimalist-topographic-contour-desk-mat",
          "name": "Minimalist Topographic Contour Monochrome Desk Pad (900×400×4mm)"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "https://printswithpassion.com/products/misty-alpine-forest-extended-mouse-pad",
          "name": "Misty Alpine Forest Extended Gaming Desk Mat (900×400×4mm)"
        }
      ]
    }
  ]
}
</script>
```

### 3.3 Dynamic Shopify Liquid Snippet (`snippets/pwp-clean-collection-schema.liquid`)
Deploy this snippet into `templates/collection.json` or `layout/theme.liquid`:
```liquid
{%- comment -%}
  Prints With Passion — Clean Collection Schema Snippet
  Replaces injected FAQPage schema with clean CollectionPage + BreadcrumbList + ItemList.
{%- endcomment -%}
{%- if template contains 'collection' and collection -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": "{{ canonical_url }}#webpage",
      "url": "{{ canonical_url }}",
      "name": {{ collection.title | append: ' | Prints With Passion' | json }},
      "description": {{ collection.description | strip_html | truncate: 160 | default: page_description | json }},
      "isPartOf": {
        "@type": "WebSite",
        "@id": "{{ shop.url }}/#website",
        "url": "{{ shop.url }}",
        "name": {{ shop.name | json }}
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "{{ canonical_url }}#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "{{ shop.url }}"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Collections",
          "item": "{{ shop.url }}/collections"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": {{ collection.title | json }},
          "item": "{{ canonical_url }}"
        }
      ]
    }
    {%- if collection.products.size > 0 -%}
    ,
    {
      "@type": "ItemList",
      "@id": "{{ canonical_url }}#itemlist",
      "name": {{ collection.title | json }},
      "numberOfItems": {{ collection.products.size }},
      "itemListElement": [
        {%- for product in collection.products limit: 24 -%}
        {
          "@type": "ListItem",
          "position": {{ forloop.index }},
          "url": "{{ shop.url }}{{ product.url }}",
          "name": {{ product.title | json }}
        }{%- unless forloop.last -%},{%- endunless -%}
        {%- endfor -%}
      ]
    }
    {%- endif -%}
  ]
}
</script>
{%- endif -%}
```

---

## 4. Reusable Template 2: Dual-Unit Specification Product Copy Formats

To eliminate thin, repetitive product descriptions and directly replicate Deskr and Kinetic Labs, all product listings must follow a **spec-first, dual-unit architectural layout**.

### 4.1 Desk Mat Specification Standard
- **Primary Form Factor:** `900 × 400 × 4 mm` (`35.4″ × 15.7″ × 0.16″`) — XXL Extended.
- **Secondary Form Factor:** `800 × 300 × 3 mm` (`31.5″ × 11.8″ × 0.12″`) — Standard XL.
- **Giant Form Factor:** `1000 × 500 × 4 mm` (`39.4″ × 19.7″ × 0.16″`) — 3XL Giant.

#### Reusable Copy Template for Desk Mats:
```markdown
### Overview
The **[Product Name]** is an extended desk mat engineered for mechanical keyboard enthusiasts, professional workstation setups, and precision gaming. Printed in high-definition giclée detail with deep color saturation that resists fading under direct desk lighting.

### Technical Specifications
| Specification | Metric Value | Imperial Value | Construction Detail |
| :--- | :--- | :--- | :--- |
| **Dimensions (XXL)** | `900 mm × 400 mm` | `35.4″ × 15.7″` | Accommodates full-size/TKL keyboard + ample mouse tracking room |
| **Thickness** | `4.0 mm` | `0.16″` | High-density open-cell rubber base for mechanical switch acoustics |
| **Glide Surface** | Ultra-dense micro-weave polyester | — | Low static friction, optimized for both optical and laser sensors |
| **Perimeter Edge** | 360° precision anti-fray stitching | — | Flush-stitched to prevent wrist abrasion and edge peeling |
| **Base Material** | 100% natural textured rubber | — | Non-slip herringbone chevron pattern; zero synthetic chemical odor |
| **Weight** | ~820 g | ~1.8 lbs | Heavyweight stay-flat construction prevents corner curl |

### Hardware & Desk Compatibility
- **Desk Fit:** Ideal for desks 120 cm (47″) to 180 cm (71″) wide, including IKEA Karlby, Ekbacken, and Lagkapten worktops.
- **Keyboard Pairing:** Spans full-size 104-key layouts, 80% TKL, 75%, and 65% custom mechanical keyboards with 300+ mm of free mouse glide area.
- **Acoustic Dampening:** 4mm dense rubber absorbs desk resonance and hollow switch reverberation for a deeper acoustic typing profile.

### Care & Maintenance
- **Routine Cleaning:** Wipe down with a damp microfiber cloth and mild soap.
- **Deep Wash:** Hand wash in cold water or machine wash on cold delicate cycle in a wash bag. Lay flat to air dry; do not tumble dry.
```

---

### 4.2 Stretched Canvas Wall Art Specification Standard
- **Standard Medium:** `60 × 40 cm` (`24″ × 16″`).
- **Standard Large:** `90 × 60 cm` (`36″ × 24″`).
- **Oversized / Statement:** `120 × 80 cm` (`48″ × 32″`).
- **Panoramic / Feature:** `150 × 100 cm` (`60″ × 40″`).

#### Reusable Copy Template for Stretched Canvas:
```markdown
### Overview
The **[Artwork Name]** is an authentic stretched canvas art print produced in the UK using archival museum-grade methods. Hand-stretched over solid European pine stretcher bars to create a distortion-free, gallery-wrapped centerpiece for contemporary living spaces and home offices.

### Technical Specifications
| Specification | Metric Value | Imperial Value | Material Standard |
| :--- | :--- | :--- | :--- |
| **Standard Sizes** | `60×40 cm`, `90×60 cm`, `120×80 cm` | `24″×16″`, `36″×24″`, `48″×32″` | True proportional scaling across standard wall spaces |
| **Stretcher Frame Depth** | `38 mm` Gallery Box Depth | `1.5″` Deep Profile | Heavy-duty bevelled profile; floats off the wall without warping |
| **Canvas Substrate** | 380 gsm pure cotton canvas | 11.2 oz canvas duck | Natural textured matte weave; zero artificial PVC or polyester sheen |
| **Inks & Longevity** | 12-colour archival pigment inks | — | UV-resistant formulation; 100+ year colorfastness guarantee |
| **Edge Finish** | Seamless mirror-wrapped gallery edges | — | Artwork flows organically around all 4 edges for a frameless finish |
| **Mounting Hardware** | Pre-fitted brass sawtooth bracket | — | Heavy-duty wall bumpers included for air circulation and wall protection |

### Placement & Proportional Sizing Guide
- **Living Room (Above Sofa):** Select the `120 × 80 cm` (48″×32″) or `150 × 100 cm` (60″×40″) size. Ensure total artwork width covers between **60% and 75%** of your sofa width (standard 2–3 seater sofas span 180 cm to 220 cm).
- **The 57-Inch Eye-Level Rule:** Hang the canvas so that the vertical midpoint rests exactly **57 inches (145 cm)** above the finished floor, matching museum standard viewing angles.
- **Clearance:** Maintain **20 cm to 25 cm (8″ to 10″)** of clear wall space between the bottom edge of the frame and the top of the sofa backrest or headboard.
```

---

## 5. Reusable Template 3: Clean 4-Column Footer Directory Structure

### 5.1 De-Templating Rationale
The previous theme rendered a 119-link footer directory (`snippets/pwp-seo-curated-directory.liquid`), linking across 48 automated micro-collections, 12 aesthetic hubs, apparel permutations, and blog posts on every page. This caused severe algorithmic issues:
- Diluted PageRank by spreading link equity across hundreds of thin, unindexed URLs.
- Created internal link bloat (over 120 links on product pages), triggering Google's spam signals.
- Confused crawler bots regarding the true site hierarchy.

The solution is to replace the 119-link grid with a **clean, user-centric 4-column footer** modeled after Kinetic Labs and Akua Home, containing exactly **16–20 focused internal links**.

### 5.2 Four-Column Navigation Map
1. **Column 1: Shop Curated (Catalog Pillars):**
   - XXL Desk Mats & Gaming Pads (`/collections/desk-mats`)
   - Japanese & Anime Desk Mats (`/collections/japanese-anime-desk-mats`)
   - Cyberpunk & Sci-Fi Mats (`/collections/cyberpunk-neon-gaming-desk-mats`)
   - Stretched Canvas Wall Art (`/collections/canvas-prints`)
   - Bauhaus & Minimalist Art (`/collections/abstract-minimalist-bauhaus-canvas-wall-art`)
   - Desk Accessories & Coasters (`/collections/desk-accessories`)
2. **Column 2: Setup Guides & Sizing (Editorial Authority):**
   - Desk Mat Sizing Guide (60x35 vs 80x40 vs 90x40) (`/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared`)
   - Desk Mat Thickness Guide (2mm vs 3mm vs 4mm) (`/blogs/news/desk-mat-thickness-guide-2mm-vs-3mm-vs-4mm-uk`)
   - Canvas Sizing Above Sofa & Bed (`/blogs/news/how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed`)
   - 57-Inch Hanging Height Rule (`/blogs/news/canvas-wall-art-hanging-height-guide-uk-57-inch-rule`)
   - How to Wash & Clean Your Desk Mat (`/blogs/news/how-to-clean-wash-extended-gaming-desk-mat-uk`)
3. **Column 3: Customer Care (Trust & Policies):**
   - UK & International Shipping (`/pages/shipping-delivery`)
   - 30-Day Returns & Guarantee (`/pages/returns-exchanges`)
   - Order Tracking (`/pages/track-order`)
   - Contact Studio Support (`/pages/contact`)
4. **Column 4: Studio & Craft (Brand Story & E-E-A-T):**
   - About Prints With Passion (`/pages/about-us`)
   - Material & Sustainability Standards (FSC Pine, Archival Cotton) (`/pages/sustainability-materials`)
   - Trade & Studio Inquiries (`/pages/trade-commercial`)
   - Privacy Policy & Terms (`/policies/privacy-policy`)

### 5.3 Accessible Liquid/HTML Snippet (`snippets/pwp-clean-footer-nav.liquid`)
```html
<footer class="pwp-site-footer" role="contentinfo">
  <div class="pwp-footer-container">
    <div class="pwp-footer-grid">
      <!-- Column 1: Curated Collections -->
      <nav class="pwp-footer-col" aria-labelledby="footer-col-shop">
        <h3 id="footer-col-shop" class="pwp-footer-title">Shop Curated</h3>
        <ul class="pwp-footer-links">
          <li><a href="/collections/desk-mats">XXL Desk Mats &amp; Gaming Pads</a></li>
          <li><a href="/collections/japanese-anime-desk-mats">Japanese &amp; Anime Desk Mats</a></li>
          <li><a href="/collections/cyberpunk-neon-gaming-desk-mats">Cyberpunk &amp; Sci-Fi Mats</a></li>
          <li><a href="/collections/canvas-prints">Stretched Canvas Wall Art</a></li>
          <li><a href="/collections/abstract-minimalist-bauhaus-canvas-wall-art">Bauhaus &amp; Minimalist Prints</a></li>
        </ul>
      </nav>

      <!-- Column 2: Setup Guides & Sizing -->
      <nav class="pwp-footer-col" aria-labelledby="footer-col-guides">
        <h3 id="footer-col-guides" class="pwp-footer-title">Setup Guides &amp; Sizing</h3>
        <ul class="pwp-footer-links">
          <li><a href="/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared">Desk Mat Size Guide (80x40 vs 90x40)</a></li>
          <li><a href="/blogs/news/desk-mat-thickness-guide-2mm-vs-3mm-vs-4mm-uk">Desk Mat Thickness (2mm vs 4mm)</a></li>
          <li><a href="/blogs/news/how-to-choose-canvas-wall-art-size-above-uk-sofa-or-bed">Canvas Sizing Above Sofa</a></li>
          <li><a href="/blogs/news/canvas-wall-art-hanging-height-guide-uk-57-inch-rule">The 57-Inch Hanging Height Rule</a></li>
          <li><a href="/blogs/news/how-to-clean-wash-extended-gaming-desk-mat-uk">How to Clean &amp; Wash Desk Mats</a></li>
        </ul>
      </nav>

      <!-- Column 3: Customer Care -->
      <nav class="pwp-footer-col" aria-labelledby="footer-col-support">
        <h3 id="footer-col-support" class="pwp-footer-title">Customer Care</h3>
        <ul class="pwp-footer-links">
          <li><a href="/pages/shipping-delivery">UK &amp; International Delivery</a></li>
          <li><a href="/pages/returns-exchanges">30-Day Money-Back Guarantee</a></li>
          <li><a href="/pages/track-order">Track Your Shipment</a></li>
          <li><a href="/pages/contact">Contact Studio Support</a></li>
        </ul>
      </nav>

      <!-- Column 4: Studio & Standards -->
      <nav class="pwp-footer-col" aria-labelledby="footer-col-about">
        <h3 id="footer-col-about" class="pwp-footer-title">Studio &amp; Standards</h3>
        <ul class="pwp-footer-links">
          <li><a href="/pages/about-us">About Prints With Passion</a></li>
          <li><a href="/pages/sustainability-materials">FSC Pine &amp; Pure Cotton Canvas</a></li>
          <li><a href="/policies/privacy-policy">Privacy Policy</a></li>
          <li><a href="/policies/terms-of-service">Terms of Service</a></li>
        </ul>
      </nav>
    </div>

    <div class="pwp-footer-bottom">
      <p>&copy; {{ 'now' | date: '%Y' }} Prints With Passion. Handcrafted in the UK. All rights reserved.</p>
    </div>
  </div>
</footer>
```

---

## 6. Reusable Template 4: Problem-Solving Buyer Guide Architecture

High-ranking competitor buyer guides do not read like programmatic SEO summaries. They address **specific spatial, acoustic, or mechanical trade-offs** faced by real shoppers.

### 6.1 Seven Mandatory Architectural Elements
1. **Direct Answer / Key Takeaway Callout Box (Above the Fold):**
   - Immediately beneath H1. Directly answers the query in under 60 words for Google Featured Snippets and instant user clarity.
2. **Specific Hardware or Room Dimensions:**
   - Mentions concrete measurements (e.g., standard UK desk depths 60cm/80cm, IKEA Karlby worktops 186x65cm / 246x65cm, 2-seater sofas 180cm, 3-seater sofas 210cm).
3. **Structured Specification / Comparison Table:**
   - Clean HTML/Markdown table comparing dimensions, material density, sound dampening (decibel absorption), and recommended usage.
4. **Step-by-Step Practical Decision Framework:**
   - 3–4 practical steps the reader can execute right now (e.g., Step 1: Tape the dimensions on your wall/desk; Step 2: Measure keyboard layout).
5. **Contextual Product Deep-Links (Restrained):**
   - Max 2–3 contextual links to curated collection pages or kept flagship products.
   - Strictly NO aggressive coupon popups or sitewide `STUDIO15` promo ribbons.
6. **Maintenance & Practical Care Advice:**
   - Answers long-tail post-purchase queries (washing instructions, preventing curled corners, mounting options).
7. **Author Attribution & Editorial Verification Date:**
   - Clear E-E-A-T signals: Written by a named studio specialist, verified with real studio test data.

### 6.2 Structural Markdown Template for Buyer Guides
```markdown
# [Natural Buyer Query Title: e.g., UK Desk Mat Size Guide: 900x400 vs 800x300 Compared]
*Published on [Date] | By Studio Engineering Team | Updated for 2026 Setups*

> **Key Takeaway (Quick Answer):**
> For most standard UK desks (depth 60 cm to 80 cm), a **900 × 400 × 4 mm (XXL)** desk mat provides the ideal balance: it comfortably houses a full-size or TKL mechanical keyboard while leaving over 35 cm of uninhibited mouse glide area. If your desk depth is under 55 cm, choose an **800 × 300 × 3 mm (XL)** mat to prevent front edge overhang.

---

## 1. The Setup Dilemma: Why One Size Does Not Fit All
[Explain the physical problem: Keyboard feet catching on mousepad edges, cramped mouse tracking, wrist fatigue on sharp desk bevels, wrist rest clearance.]

---

## 2. Side-by-Side Sizing & Hardware Comparison
| Mat Size | Dimensions (Metric) | Dimensions (Imperial) | Best Desk Dimensions | Ideal Keyboard Layout | Mouse Glide Clearance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard XL** | `800 × 300 mm` | `31.5″ × 11.8″` | 100–120 cm width × 50–60 cm depth | 60%, 65%, 75% Compact | 250 mm horizontal glide |
| **Extended XXL** | `900 × 400 mm` | `35.4″ × 15.7″` | 120–180 cm width × 65–80 cm depth | TKL (87-key), Full-size (104-key) | 360 mm horizontal glide |
| **Giant 3XL** | `1000 × 500 mm` | `39.4″ × 19.7″` | 180–240 cm width × 80–90 cm depth | Any setup + stream deck/audio interface | 450 mm horizontal glide |

---

## 3. How Thickness Affects Typing Acoustics and Comfort (2mm vs 4mm)
- **2 mm Thickness:** Ultra-low profile, portable, firmer mouse glide, but minimal desk vibration dampening.
- **4 mm Thickness (Studio Recommendation):** Dense open-cell rubber absorbs mechanical switch clack, softens wrist contact with hard desk edges, and stays completely flat without corner lifting.

---

## 4. Measuring Your Desk Setup in 3 Steps
1. **Measure Usable Depth:** Subtract monitor arm clamp clearance and cable tray cutouts from your overall tabletop depth.
2. **Lay Out Peripherals:** Place your keyboard, mouse, and audio interface in their natural working positions.
3. **Check Edge Overhang:** Ensure at least 30 mm of tabletop surface remains between the front edge of the mat and the desk perimeter.

---

## 5. Curated Setup Recommendations
- For IKEA Karlby or solid oak setups, explore our [Curated XXL Desk Mats (900×400×4mm)](/collections/desk-mats).
- For compact minimalist desk setups, browse our [Monochrome & Topographic Desk Pads](/collections/abstract-minimalist-bauhaus-canvas-wall-art).

---

## 6. Care & Maintenance: Keeping Stitching and Glide Pristine
[Provide actionable cleaning advice, washing instructions, and spill prevention.]
```

---

## 7. Implementation Checklist Across Prints With Passion

| Task ID | Implementation Step | Target File / Area | Verification Criteria |
| :---: | :--- | :--- | :--- |
| **PL-01** | Replace collection schema with clean `@graph` | `snippets/pwp-clean-collection-schema.liquid` | Zero `FAQPage` schema on collection URLs; `CollectionPage` + `BreadcrumbList` + `ItemList` verified via Google Rich Results Test |
| **PL-02** | Strip injected boilerplate heroes from collections | 70 Shopify Collections descriptions | All `<!-- PWP_INPAGES_3RULE_HERO_START -->` blocks removed; page weight drops by >500 KB |
| **PL-03** | Apply dual-unit specification table | Kept flagship PDPs (`/products/...`) | Specifications include both Metric (`mm/cm`) and Imperial (`in`); includes material, weight, base details |
| **PL-04** | Deploy clean 4-column footer | `snippets/pwp-clean-footer-nav.liquid` & `layout/theme.liquid` | Total internal links reduced from 119 to ≤20; clean responsive 4-column layout |
| **PL-05** | De-template kept buyer guides | Retained 20–25 blog articles (`/blogs/news/...`) | Articles follow 7-element problem-solving structure; pass `npx -y seo lint --url <page>` with 0 AI-pattern flags |

---
*Playbook compiled and verified under Milestone M1 by Worker M1.*
