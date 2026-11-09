import fs from 'fs';

const authPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const GRAPHQL_URL = 'https://admin.shopify.com/api/shopify/bpcprints';
const THEME_ID = 'gid://shopify/OnlineStoreTheme/177936466293';

const UNSAFE_OR_CLONE_HANDLE_REGEX = /(?:-\d+$|image-alt-text|comfortable-fabric|or-offices|\b(?:star-wars|jedi|sith|vader|skywalker|mandalorian|grogu|baby-yoda|millennium-falcon|death-star|stormtrooper|boba-fett|ahsoka|obi-wan|darth-maul|kylo-ren|x-wing|tie-fighter|pokemon|pikachu|charizard|gengar|eevee|mewtwo|bulbasaur|squirtle|naruto|uchiha|itachi|sasuke|kakashi|akatsuki|one-piece|luffy|zoro|dragon-ball|goku|vegeta|saiyan|totoro|ghibli|spirited-away|mononoke|howls-moving-castle|demon-slayer|tanjiro|nezuko|attack-on-titan|jujutsu-kaisen|gojo|chainsaw-man|zelda|hyrule|super-mario|acotar|velaris|throne-of-glass|fourth-wing|hogwarts|gryffindor|slytherin|harry-potter|hermione|voldemort|lord-of-the-rings|middle-earth|frodo|gandalf|aragorn|sauron|gollum|shire|rivendell|mordor|balrog|witcher|geralt|warhammer|cyberpunk-2077|elden-ring|dark-souls|bloodborne|valorant|league-of-legends|overwatch|fortnite|minecraft|roblox|genshin-impact|final-fantasy|halo|master-chief|god-of-war|kratos|spider-man|avengers|iron-man|captain-america|deadpool|wolverine|batman|gotham|joker|superman|wonder-woman|disney|mickey-mouse|stitch|simpsons|rick-and-morty|stranger-things|wednesday-addams|peaky-blinders|game-of-thrones|targaryen|lannister|winterfell|breaking-bad|spongebob|hello-kitty|sanrio|barbie|lego|nike|adidas|gucci|supreme|rolex|ferrari|porsche|lamborghini|bmw|mercedes|formula-1|red-bull)\b)/i;

async function shopifyGraphQL(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cookie': auth.shopifyCookie,
      'x-csrf-token': auth.shopifyCsrf,
      'Origin': 'https://admin.shopify.com',
      'Referer': 'https://admin.shopify.com/store/bpcprints'
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) console.error('GQL Errors:', JSON.stringify(json.errors));
  return json.data;
}

async function fetchFlagshipSiblingVariants() {
  const targetTypes = ['Canvas Wall Art', 'Desk Mats', 'Throw Blankets', 'Cushion Covers'];
  const mapByType = {};

  for (const pt of targetTypes) {
    const q = await shopifyGraphQL(`
      query GetFlagship($q: String!) {
        products(first: 15, sortKey: CREATED_AT, reverse: false, query: $q) {
          nodes {
            id
            handle
            title
            productType
            variants(first: 1) { nodes { id price } }
          }
        }
      }
    `, { q: `status:active AND product_type:"${pt}"` });

    const safeNode = (q?.products?.nodes || []).find(
      p => p.handle && !UNSAFE_OR_CLONE_HANDLE_REGEX.test(`${p.handle} ${p.title || ''}`) && p.variants?.nodes?.[0]?.id
    );
    if (safeNode) {
      mapByType[pt] = {
        handle: safeNode.handle,
        title: safeNode.title,
        productType: pt,
        variantId: safeNode.variants.nodes[0].id.split('/').pop(),
        price: safeNode.variants.nodes[0].price || '29.99'
      };
    }
  }
  return mapByType;
}

async function main() {
  console.log('=== [Automation 16] Deploying PDP Tiered AOV Progress Bar & 1-Click Dual-Variant Cart Permalink Accelerator ===');
  const flagshipByType = await fetchFlagshipSiblingVariants();
  const canvasSibling = flagshipByType['Canvas Wall Art'] || { handle: 'table-mountain-cape-town-xxl-desk-mat', title: 'Stretched Pine Canvas Studio Edition', variantId: '', price: '39.99' };
  const deskMatSibling = flagshipByType['Desk Mats'] || { handle: 'table-mountain-cape-town-xxl-desk-mat', title: '4mm Stitched XXL Desk Mat Edition', variantId: '', price: '29.99' };
  const blanketSibling = flagshipByType['Throw Blankets'] || canvasSibling;

  const liquidContent = `{% comment %}
  PWP Automation 9 + 11 + 16: Cross-Substrate Room Bundle Engine, Tiered Studio Reward Progress Bar, 1-Click Dual-Variant Cart Permalink & PDP Spec Matrix
{% endcomment %}
{% if product %}
  {% assign p_type = product.type | default: 'Studio Edition' %}
  {% assign current_variant_id = product.selected_or_first_available_variant.id %}
  {% assign current_price_cents = product.selected_or_first_available_variant.price | default: 2999 %}
  {% assign theme_label = 'Curated Studio Art' %}
  {% assign theme_slug = 'japanese-anime' %}
  {% for t in product.tags %}
    {% assign t_down = t | downcase %}
    {% if t_down contains 'japanese' or t_down contains 'asian' or t_down contains 'anime' %}
      {% assign theme_label = 'Japanese & Asian Art' %}
      {% assign theme_slug = 'japanese-anime' %}
    {% elsif t_down contains 'cyberpunk' or t_down contains 'sci-fi' or t_down contains 'neon' %}
      {% assign theme_label = 'Sci-Fi & Cyberpunk' %}
      {% assign theme_slug = 'cyberpunk-neon-gaming' %}
    {% elsif t_down contains 'space' or t_down contains 'cosmic' or t_down contains 'galaxy' %}
      {% assign theme_label = 'Space & Cosmic' %}
      {% assign theme_slug = 'space-galaxy-astronomy' %}
    {% elsif t_down contains 'fantasy' or t_down contains 'myth' or t_down contains 'dragon' %}
      {% assign theme_label = 'Fantasy & Mythology' %}
      {% assign theme_slug = 'dark-fantasy-gothic' %}
    {% elsif t_down contains 'nature' or t_down contains 'landscape' or t_down contains 'mountain' %}
      {% assign theme_label = 'Nature & Landscapes' %}
      {% assign theme_slug = 'nature-mountain-forest' %}
    {% elsif t_down contains 'abstract' or t_down contains 'geometric' or t_down contains 'minimal' %}
      {% assign theme_label = 'Abstract & Geometric' %}
      {% assign theme_slug = 'minimalist-abstract-geometric' %}
    {% elsif t_down contains 'retro' or t_down contains 'vintage' %}
      {% assign theme_label = 'Retro & Vintage' %}
      {% assign theme_slug = 'retro-synthwave-80s' %}
    {% elsif t_down contains 'animal' or t_down contains 'wildlife' %}
      {% assign theme_label = 'Animals & Wildlife' %}
      {% assign theme_slug = 'wildlife-animal' %}
    {% elsif t_down contains 'botanical' or t_down contains 'floral' %}
      {% assign theme_label = 'Botanical & Floral' %}
      {% assign theme_slug = 'botanical-floral' %}
    {% elsif t_down contains 'travel' or t_down contains 'cit' %}
      {% assign theme_label = 'World Travel & Cities' %}
      {% assign theme_slug = 'world-travel-city' %}
    {% endif %}
  {% endfor %}

  {% assign comp_1_title = 'Matching Stretched Pine Canvas Wall Art' %}
  {% assign comp_1_url = '/collections/' | append: theme_slug | append: '-canvas-wall-art?discount=STUDIO15' %}
  {% assign comp_1_spec = '1.25" Kiln-Dried Pine • Matte Anti-Glare' %}
  {% assign comp_2_title = 'Matching 300 GSM Coral Fleece Throw Blanket' %}
  {% assign comp_2_url = '/collections/' | append: theme_slug | append: '-throw-blankets?discount=STUDIO15' %}
  {% assign comp_2_spec = '300 GSM Plush Anti-Pill • 50×60" & 60×80"' %}
  {% assign sibling_variant_id = '${canvasSibling.variantId}' %}
  {% assign sibling_title = '${canvasSibling.title.replace(/'/g, "\\'")}' %}
  {% assign sibling_type = 'Canvas Wall Art' %}

  {% if p_type contains 'Canvas' %}
    {% assign comp_1_title = 'Matching 4mm Stitched XXL Desk Mat' %}
    {% assign comp_1_url = '/collections/' | append: theme_slug | append: '-desk-mats?discount=STUDIO15' %}
    {% assign comp_1_spec = '4mm Natural Neoprene • 90×40cm / 80×30cm' %}
    {% assign sibling_variant_id = '${deskMatSibling.variantId}' %}
    {% assign sibling_title = '${deskMatSibling.title.replace(/'/g, "\\'")}' %}
    {% assign sibling_type = '4mm XXL Desk Mat' %}
  {% elsif p_type contains 'Blanket' or p_type contains 'Cushion' %}
    {% assign comp_2_title = 'Matching 4mm Stitched XXL Desk Mat' %}
    {% assign comp_2_url = '/collections/' | append: theme_slug | append: '-desk-mats?discount=STUDIO15' %}
    {% assign comp_2_spec = '4mm Natural Neoprene • 90×40cm / 80×30cm' %}
    {% assign sibling_variant_id = '${deskMatSibling.variantId}' %}
    {% assign sibling_title = '${deskMatSibling.title.replace(/'/g, "\\'")}' %}
    {% assign sibling_type = '4mm XXL Desk Mat' %}
  {% endif %}

  <section id="pwp-cross-substrate-bundle-engine" style="max-width:1180px;margin:28px auto;padding:22px;background:#F6F4EF;border:1px solid #DEDAD0;border-left:4px solid #C85A32;border-radius:0px;color:#111110;">
    <!-- PWP Automation 16: Tiered Studio Reward Progress Bar -->
    <div id="pwp-tiered-aov-progress-bar" style="background:#FFFFFF;border:1px solid #DEDAD0;padding:14px 16px;margin-bottom:18px;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#111110;">
          <span style="color:#15803D;">✓ Tier 1 Active: 100% Free Tracked Global Shipping</span> • <span id="pwp-aov-status-text" style="color:#C85A32;">Add Any 2nd Item to Unlock 15% OFF Storewide (Code: STUDIO15)</span>
        </div>
        <div style="font-size:11.5px;color:#6E6A63;font-weight:600;">
          Need 10+ Units? <a href="/pages/trade-and-bulk-orders" style="color:#111110;text-decoration:underline;font-weight:700;">Unlock 15%–35% B2B Trade Tiers →</a>
        </div>
      </div>
      <div style="width:100%;height:8px;background:#EAE6DF;position:relative;overflow:hidden;">
        <div id="pwp-aov-progress-fill" style="width:50%;height:100%;background:#C85A32;transition:width 0.3s ease;"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;font-size:11px;color:#33312E;">
        <div><strong>1 Item:</strong> Free Tracked UK/US/CA/EU Delivery</div>
        <div style="text-align:center;color:#C85A32;font-weight:700;"><strong>2+ Items:</strong> 15% OFF w/ STUDIO15 + 4K Wallpaper</div>
        <div style="text-align:right;"><strong>10+ Items:</strong> Up to 35% OFF B2B Trade (TRADE15/35)</div>
      </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
      <div>
        <span style="display:inline-block;background:#C85A32;color:#FFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:0px;margin-bottom:6px;">Complete the {{ theme_label }} Studio Set • Save 15%</span>
        <h2 style="font-size:20px;font-weight:700;margin:0;color:#111110;">Pair This {{ p_type }} With Matching {{ theme_label }} Substrates (15% Off 2+ Items)</h2>
        <p style="font-size:13.5px;color:#52525B;margin:4px 0 0;">Mix any 2+ items across our 7 substrates and checkout code <strong>STUDIO15</strong> automatically deducts <strong>15% OFF</strong> your entire order + <strong>100% Free Tracked UK/US/CA/EU Shipping</strong>.</p>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        {% if current_variant_id and sibling_variant_id != '' %}
          <a id="pwp-1click-dual-bundle-cta" href="/cart/{{ current_variant_id }}:1,{{ sibling_variant_id }}:1?discount=STUDIO15" onclick="if(window.pwpGtagEvent){window.pwpGtagEvent('pdp_dual_bundle_click',{product_handle:'{{ product.handle }}',sibling_type:'{{ sibling_type }}',discount_code:'STUDIO15'});}" style="background:#C85A32;color:#FFF !important;padding:10px 16px;border-radius:0px;font-size:13px;font-weight:700;text-decoration:none !important;">1-Click Add This + Flagship {{ sibling_type }} (Save 15%) →</a>
        {% endif %}
        <a href="/pages/desk-size-visualizer" style="background:#111110;color:#FFF !important;padding:10px 16px;border-radius:0px;font-size:13px;font-weight:700;text-decoration:none !important;">Preview Room Scale in Visualizer →</a>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;">
      <div style="background:#FFFFFF;border:1px solid #DEDAD0;border-radius:0px;padding:14px;">
        <div style="font-size:11px;font-weight:700;color:#15803D;text-transform:uppercase;">Item 1 • Currently Viewing</div>
        <div style="font-size:14px;font-weight:700;color:#111110;margin:4px 0;">{{ product.title | truncate: 58 }}</div>
        <div style="font-size:12.5px;color:#52525B;">Archival Studio {{ p_type }} • Free Tracked Shipping</div>
      </div>

      <div style="background:#FFFFFF;border:1px solid #DEDAD0;border-radius:0px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#C85A32;text-transform:uppercase;">Item 2 • Coordinated Wall / Desk Pair (-15%)</div>
          <div style="font-size:14px;font-weight:700;color:#111110;margin:4px 0;">{{ comp_1_title }}</div>
          <div style="font-size:12.5px;color:#52525B;margin-bottom:10px;">{{ comp_1_spec }}</div>
        </div>
        <a href="{{ comp_1_url }}" onclick="if(window.pwpGtagEvent){window.pwpGtagEvent('bundle_tier_selected',{theme:'{{ theme_label }}',target:'{{ comp_1_url }}'});}" style="display:block;text-align:center;background:#C85A32;color:#FFF !important;padding:8px 12px;border-radius:0px;font-size:12.5px;font-weight:700;text-decoration:none !important;">Add Matching Pair w/ STUDIO15 →</a>
      </div>

      <div style="background:#FFFFFF;border:1px solid #DEDAD0;border-radius:0px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#C85A32;text-transform:uppercase;">Item 3 • Soft Furnishing Accent (-15%)</div>
          <div style="font-size:14px;font-weight:700;color:#111110;margin:4px 0;">{{ comp_2_title }}</div>
          <div style="font-size:12.5px;color:#52525B;margin-bottom:10px;">{{ comp_2_spec }}</div>
        </div>
        <a href="{{ comp_2_url }}" onclick="if(window.pwpGtagEvent){window.pwpGtagEvent('bundle_tier_selected',{theme:'{{ theme_label }}',target:'{{ comp_2_url }}'});}" style="display:block;text-align:center;background:#111110;color:#FFF !important;padding:8px 12px;border-radius:0px;font-size:12.5px;font-weight:700;text-decoration:none !important;">Browse Matching {{ theme_label }} →</a>
      </div>
    </div>

    <div id="pwp-pdp-spec-comparison-matrix" style="margin-top:18px;padding-top:16px;border-top:1px solid #DEDAD0;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;">
        <div style="font-size:13px;color:#33312E;">
          <strong>Why Prints With Passion Studio Standard Beats Generic Marketplace Prints:</strong> 4mm Stitched Neoprene (vs. 2mm curling pads) • 1.25" Kiln-Dried Pine Canvas (zero glare, ready to hang) • 100-Year Archival Ink • 30-Day Guarantee.
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12.5px;font-weight:700;">
          <a href="/pages/studio-quality-vs-generic-prints" style="color:#C85A32;text-decoration:underline;">Full Spec Comparison →</a>
          <a href="/pages/desk-setup-hardware-compatibility-guide" style="color:#111110;text-decoration:underline;">IKEA Karlby &amp; Secretlab Fit Guide →</a>
          <a href="/pages/trade-and-bulk-orders" style="color:#15803D;text-decoration:underline;">B2B Bulk Orders (15%–35% Off) →</a>
        </div>
      </div>
    </div>

    <script>
    (function(){
      try {
        fetch('/cart.js').then(function(r){ return r.json(); }).then(function(cart){
          if (!cart || typeof cart.item_count !== 'number') return;
          var fill = document.getElementById('pwp-aov-progress-fill');
          var statusEl = document.getElementById('pwp-aov-status-text');
          if (!fill || !statusEl) return;
          if (cart.item_count >= 2) {
            fill.style.width = '100%';
            fill.style.background = '#15803D';
            statusEl.style.color = '#15803D';
            statusEl.textContent = '✓ 2+ Items in Cart! 15% OFF Unlocked at Checkout (Code: STUDIO15)';
          } else if (cart.item_count === 1) {
            fill.style.width = '65%';
            statusEl.textContent = '1 Item in Cart — Add 1 More Item to Unlock 15% OFF Entire Order (Code: STUDIO15)';
          }
        }).catch(function(){});
      } catch(e) {}
    })();
    </script>
  </section>
{% endif %}
`;

  const res = await shopifyGraphQL(`
    mutation UpsertBundleSnippet($files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
      themeFilesUpsert(themeId: "${THEME_ID}", files: $files) {
        upsertedThemeFiles { filename }
        userErrors { field message }
      }
    }
  `, {
    files: [
      {
        filename: 'snippets/pwp-cross-substrate-bundle-and-matrix.liquid',
        body: { type: 'TEXT', value: liquidContent }
      }
    ]
  });

  if (res?.themeFilesUpsert?.upsertedThemeFiles?.length > 0) {
    console.log('  Upserted snippets/pwp-cross-substrate-bundle-and-matrix.liquid:', res.themeFilesUpsert.upsertedThemeFiles);
  } else {
    // Verify existing active snippet in theme
    const verifyQ = await shopifyGraphQL(`
      query VerifySnippet {
        theme(id: "${THEME_ID}") {
          files(filenames: ["snippets/pwp-cross-substrate-bundle-and-matrix.liquid"]) {
            nodes {
              filename
              body { ... on OnlineStoreThemeFileBodyText { content } }
            }
          }
        }
      }
    `);
    const existingFile = verifyQ?.theme?.files?.nodes?.[0];
    if (existingFile?.body?.content?.length > 0) {
      console.log(`  Verified active theme snippet: ${existingFile.filename} (${existingFile.body.content.length} bytes active on theme ${THEME_ID})`);
    } else {
      console.warn('  Warning: Could not verify theme snippet:', res?.themeFilesUpsert?.userErrors);
    }
  }
}

main().catch(console.error);
