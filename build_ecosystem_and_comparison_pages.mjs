import fs from 'fs';

const authPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const GRAPHQL_URL = 'https://admin.shopify.com/api/shopify/bpcprints';
const THEME_ID = 'gid://shopify/OnlineStoreTheme/177936466293';
const CATALOG_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\curated_catalog.json';
const KEYWORD_QUEUE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\transactional_keyword_queue.json';

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

async function fetchDiverseBrandSafeProducts() {
  const targetTypes = [
    'Desk Mats',
    'Canvas Wall Art',
    'Cushion Covers',
    'Throw Blankets',
    'Bath Mats',
    'Hoodies'
  ];
  const daySeed = Math.floor(Date.now() / 86400000);
  const selectedHandles = [];

  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const cat = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      const pool = (cat.products || []).filter(p => p.handle && !UNSAFE_OR_CLONE_HANDLE_REGEX.test(`${p.handle} ${p.title || ''}`));
      for (let i = 0; i < targetTypes.length; i++) {
        const pt = targetTypes[i];
        const matching = pool.filter(p => (p.productType || p.type) === pt);
        if (matching.length > 0) {
          const chosen = matching[(daySeed + i * 3) % matching.length];
          selectedHandles.push(chosen.handle);
        }
      }
    } catch {}
  }

  const fetched = [];
  for (const h of selectedHandles) {
    const q = await shopifyGraphQL(`
      query GetProdByHandle($q: String!) {
        products(first: 1, query: $q) {
          nodes {
            id
            handle
            title
            productType
            featuredImage { url }
            variants(first: 1) { nodes { id price } }
          }
        }
      }
    `, { q: `handle:${h}` });
    const node = q?.products?.nodes?.[0];
    if (node) fetched.push(node);
  }

  if (fetched.length < 6) {
    const fallbackQ = await shopifyGraphQL(`
      query SampleProds {
        products(first: 40, sortKey: CREATED_AT, reverse: false, query: "status:active") {
          nodes {
            id
            handle
            title
            productType
            featuredImage { url }
            variants(first: 1) { nodes { id price } }
          }
        }
      }
    `);
    for (const p of (fallbackQ?.products?.nodes || [])) {
      if (fetched.length >= 6) break;
      if (!UNSAFE_OR_CLONE_HANDLE_REGEX.test(`${p.handle} ${p.title || ''}`) && !fetched.some(x => x.handle === p.handle)) {
        fetched.push(p);
      }
    }
  }
  return fetched.slice(0, 6);
}

function getTopKeywordsSummary() {
  if (!fs.existsSync(KEYWORD_QUEUE_PATH)) return [];
  try {
    const q = JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'));
    return (q.queue || []).slice(0, 6).map(c => c.shortAnchor || c.primaryKeyword);
  } catch {
    return [];
  }
}

function renderShoppableGrid(products, badgePrefix = 'Verified Studio Spec', isB2B = false) {
  const cards = products.slice(0, 6).map(p => {
    const img = p.featuredImage?.url || '';
    const price = p.variants?.nodes?.[0]?.price || '29.99';
    const variantGid = p.variants?.nodes?.[0]?.id || '';
    const variantNumericId = variantGid.split('/').pop();
    const b2bButtonHtml = (isB2B && variantNumericId)
      ? `<a href="/cart/${variantNumericId}:10?discount=TRADE15" style="display:block;text-align:center;background:#C85A32;color:#FFF !important;padding:8px 12px;border-radius:0px;font-size:12px;font-weight:700;text-decoration:none !important;margin-top:6px;">1-Click Load 10-Unit Trade Pack (15% Off) →</a>`
      : '';
    return `<div style="background:#FFFFFF;border:1px solid #DEDAD0;border-radius:0px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        ${img ? `<img src="${img}" alt="${p.title.replace(/"/g, '&quot;')}" style="width:100%;height:160px;object-fit:cover;border-radius:0px;margin-bottom:10px;" loading="lazy">` : ''}
        <div style="font-size:11px;font-weight:700;color:#C85A32;text-transform:uppercase;letter-spacing:0.06em;">${badgePrefix} • ${p.productType || 'Studio Edition'}</div>
        <a href="/products/${p.handle}" style="font-size:14px;font-weight:600;color:#111110;text-decoration:none;display:block;margin:4px 0 8px;line-height:1.35;">${p.title}</a>
        <div style="font-size:14px;font-weight:700;color:#15803D;margin-bottom:10px;">£${parseFloat(price).toFixed(2)} <span style="font-size:12px;color:#52525B;font-weight:400;">(15% Off 2+ w/ STUDIO15)</span></div>
      </div>
      <div>
        <a href="/products/${p.handle}" style="display:block;text-align:center;background:#111110;color:#FFF !important;padding:9px 12px;border-radius:0px;font-size:13px;font-weight:600;text-decoration:none !important;">Inspect Dimensions &amp; Order →</a>
        ${b2bButtonHtml}
      </div>
    </div>`;
  }).join('\n');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin:20px 0;">${cards}</div>`;
}

async function upsertShopifyPage(handle, title, bodyHtml, preserveBlockMarker = null) {
  const existing = await shopifyGraphQL(`
    query FindPage($q: String!) {
      pages(first: 1, query: $q) {
        nodes { id handle title body }
      }
    }
  `, { q: `handle:${handle}` });

  const node = existing?.pages?.nodes?.[0];
  let finalBody = bodyHtml;
  if (node && preserveBlockMarker) {
    const regex = new RegExp(`<!-- ${preserveBlockMarker}_START -->[\\s\\S]*?<!-- ${preserveBlockMarker}_END -->`, 'i');
    const match = (node.body || '').match(regex);
    if (match && !finalBody.includes(`<!-- ${preserveBlockMarker}_START -->`)) {
      finalBody = finalBody + '\n' + match[0];
    }
  }

  if (node) {
    const upd = await shopifyGraphQL(`
      mutation UpdPage($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) {
          page { id handle title }
          userErrors { field message }
        }
      }
    `, {
      id: node.id,
      page: { title, body: finalBody, isPublished: true }
    });
    console.log(`  Updated /pages/${handle}:`, upd?.pageUpdate?.page, upd?.pageUpdate?.userErrors);
  } else {
    const crt = await shopifyGraphQL(`
      mutation CreatePage($page: PageCreateInput!) {
        pageCreate(page: $page) {
          page { id handle title }
          userErrors { field message }
        }
      }
    `, {
      page: { handle, title, body: finalBody, isPublished: true }
    });
    console.log(`  Created /pages/${handle}:`, crt?.pageCreate?.page, crt?.pageCreate?.userErrors);
  }
}

async function main() {
  console.log('=== [Step 4] Building & Publishing Automation 11 (Hardware Compatibility & Competitor Comparison Pages) + Automation 14 (B2B Trade Portal) ===');
  const sampleProducts = await fetchDiverseBrandSafeProducts();
  const topKws = getTopKeywordsSummary();
  const kwCalloutText = topKws.length > 0
    ? `Verified Low-Competition Studio Specs: ${topKws.slice(0, 4).join(' • ')}`
    : 'Verified Studio Specs: 90×40cm XXL Desk Mats • 1.25" Kiln-Dried Pine Canvas • 300 GSM Coral Fleece';

  // --------------------------------------------------------------------------
  // 1. /pages/desk-setup-hardware-compatibility-guide
  // --------------------------------------------------------------------------
  const hardwareSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What size XXL desk mat fits an IKEA Karlby (186cm or 246cm) and Alex drawer setup?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For an IKEA Karlby 186cm×63.5cm or 246cm×63.5cm worktop, our 90×40cm (35.4×15.7 inch) 4mm Stitched XXL Desk Mat is the ideal centerpiece, leaving 11.75cm of exposed walnut border front-and-back while accommodating a full-size or 75% mechanical keyboard and wide low-DPI mouse sweep."
            }
          },
          {
            "@type": "Question",
            "name": "Which Prints With Passion desk mat size works best on a Secretlab Magnus Pro or Magnus XL?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For the Secretlab Magnus Pro (150cm×70cm), choose either our 80×30cm (31.5×11.8 inch) or 90×40cm (35.4×15.7 inch) 4mm neoprene desk mat. Both clear the rear cable management tray lid completely while dampening metallic resonance for mechanical keyboards."
            }
          },
          {
            "@type": "Question",
            "name": "Does a 4mm neoprene desk mat improve the sound profile of Keychron, Wooting, and custom mechanical keyboards?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. A 4mm high-density natural rubber/neoprene base absorbs hollow desk reverberation on wood, laminate, and steel desks, deepening the acoustic 'thock' of Keychron Q-series, Wooting 60HE/80HE, and custom gasket-mounted keyboards."
            }
          }
        ]
      }
    ]
  };

  const hardwareHtml = `<!-- PWP_AUTOMATION_11_HARDWARE_GUIDE -->
<script type="application/ld+json">${JSON.stringify(hardwareSchema)}</script>
<div style="max-width:1100px;margin:0 auto;padding:16px;color:#111110;line-height:1.65;">
  <div style="background:#F6F4EF;border:1px solid #DEDAD0;border-left:4px solid #C85A32;border-radius:0px;padding:24px;margin-bottom:28px;">
    <span style="display:inline-block;background:#C85A32;color:#FFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:0px;margin-bottom:8px;">Hardware Ecosystem Compatibility Guide • Metric (CM) &amp; Imperial (Inches)</span>
    <h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Desk Mat &amp; Wall Art Sizing Guide for IKEA Karlby, Secretlab Magnus, Keychron/Wooting &amp; Ultrawide Setups</h1>
    <p style="font-size:15px;color:#33312E;margin:0 0 12px;">Stop guessing whether an extended desk pad will overhang your cable tray or crowd your monitor arm. Use our verified hardware compatibility matrix below to pair the exact <strong>4mm Stitched XXL Desk Mat</strong> and <strong>Above-Monitor Stretched Pine Canvas</strong> with your desk, keyboard, and display ecosystem—backed by <strong>15% Off 2+ Items (Code: STUDIO15)</strong> and <strong>Free Tracked UK/US/CA/EU Shipping</strong>.</p>
    <p style="font-size:12.5px;color:#6E6A63;margin:0 0 16px;"><strong>${kwCalloutText}</strong></p>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">
      <a href="/pages/desk-size-visualizer" style="background:#111110;color:#FFF !important;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Launch Interactive Desk Size Visualizer →</a>
      <a href="/collections/desk-mats" style="background:#FFFFFF;color:#111110 !important;border:1px solid #111110;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Shop All 4mm XXL Desk Mats →</a>
      <a href="/collections/canvas-prints" style="background:#FFFFFF;color:#C85A32 !important;border:1px solid #C85A32;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Shop Above-Monitor Canvas Art →</a>
    </div>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;">1. Desk Surface Compatibility Matrix (IKEA, Secretlab, Standing Desks)</h2>
  <div style="overflow-x:auto;margin-bottom:28px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;background:#FFF;border:1px solid #DEDAD0;">
      <thead>
        <tr style="background:#F6F4EF;border-bottom:2px solid #DEDAD0;text-align:left;">
          <th style="padding:12px 14px;">Desk / Hardware Model</th>
          <th style="padding:12px 14px;">Surface Footprint</th>
          <th style="padding:12px 14px;">Recommended PWP Desk Mat Size</th>
          <th style="padding:12px 14px;">Recommended Above-Desk Canvas Size</th>
          <th style="padding:12px 14px;">Direct Collection</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>IKEA Karlby + Alex Drawers (74&quot; / 98&quot;)</strong></td>
          <td style="padding:12px 14px;">186×63.5cm or 246×63.5cm</td>
          <td style="padding:12px 14px;color:#15803D;font-weight:700;">90×40cm (35.4×15.7&quot;) XXL Extended</td>
          <td style="padding:12px 14px;">24×36&quot; (60×90cm) Statement Canvas</td>
          <td style="padding:12px 14px;"><a href="/collections/japanese-anime-desk-mats" style="color:#C85A32;font-weight:700;">Shop 90×40cm →</a></td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>Secretlab Magnus Pro / Magnus XL</strong></td>
          <td style="padding:12px 14px;">150×70cm or 177×80cm (w/ Rear Cable Tray)</td>
          <td style="padding:12px 14px;color:#15803D;font-weight:700;">80×30cm (31.5×11.8&quot;) or 90×40cm</td>
          <td style="padding:12px 14px;">16×20&quot; (40×50cm) Dual-Frame Pair</td>
          <td style="padding:12px 14px;"><a href="/collections/cyberpunk-neon-gaming-desk-mats" style="color:#C85A32;font-weight:700;">Shop Battlestation →</a></td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>IKEA Bekant / Lagkapten / Autonomous SmartDesk</strong></td>
          <td style="padding:12px 14px;">120×60cm to 160×80cm</td>
          <td style="padding:12px 14px;color:#15803D;font-weight:700;">80×30cm (31.5×11.8&quot;) Precision Fit</td>
          <td style="padding:12px 14px;">18×24&quot; (45×60cm) Gallery Canvas</td>
          <td style="padding:12px 14px;"><a href="/collections/minimalist-abstract-geometric-desk-mats" style="color:#C85A32;font-weight:700;">Shop Minimalist →</a></td>
        </tr>
        <tr>
          <td style="padding:12px 14px;"><strong>Compact Bedroom / Dorm / Writing Desk</strong></td>
          <td style="padding:12px 14px;">100×50cm to 115×60cm</td>
          <td style="padding:12px 14px;color:#15803D;font-weight:700;">60×30cm (23.6×11.8&quot;) Compact Studio</td>
          <td style="padding:12px 14px;">12×16&quot; (30×40cm) Vertical Canvas</td>
          <td style="padding:12px 14px;"><a href="/collections/nature-mountain-forest-desk-mats" style="color:#C85A32;font-weight:700;">Shop Compact →</a></td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;">2. Mechanical Keyboard &amp; Optical/Laser Mouse Sensor Synergy</h2>
  <p style="font-size:14.5px;color:#33312E;">Whether you type on a gasket-mounted <strong>Keychron Q1 Pro</strong>, a Hall-effect <strong>Wooting 60HE / 80HE</strong>, or a custom aluminum 65%/75% board paired with a <strong>Logitech G Pro X Superlight / Razer Viper V3 Pro</strong> (up to 30,000+ DPI):</p>
  <ul style="font-size:14.5px;color:#33312E;padding-left:20px;margin-bottom:24px;">
    <li><strong>4mm Acoustic Neoprene Core:</strong> Absorbs high-frequency case ping on wooden and metal desks, producing a deeper, cleaner keystroke acoustic profile.</li>
    <li><strong>Calibrated Micro-Weave Surface:</strong> Balanced static and dynamic friction engineered for zero spin-out on PixArt PAW3395 / Hero 2 optical sensors.</li>
    <li><strong>Low-Profile 360° Anti-Fray Stitching:</strong> Flush lock-stitched perimeter prevents forearm irritation during long coding, design, or competitive gaming sessions.</li>
  </ul>

  <h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;">3. Shop Verified Hardware-Ready Studio Editions Across All 6 Substrates (Save 15% on 2+ Items w/ Code STUDIO15)</h2>
  ${renderShoppableGrid(sampleProducts, 'Hardware Compatible', false)}
</div>`;

  await upsertShopifyPage(
    'desk-setup-hardware-compatibility-guide',
    'Desk Mat & Wall Art Hardware Compatibility Guide (IKEA Karlby, Secretlab, Keychron & Ultrawide)',
    hardwareHtml,
    'PWP_AUTOMATION_17_HARDWARE_MATRIX'
  );

  // --------------------------------------------------------------------------
  // 2. /pages/studio-quality-vs-generic-prints
  // --------------------------------------------------------------------------
  const comparisonSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How do Prints With Passion 4mm desk mats compare to standard 2mm marketplace mousepads?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Prints With Passion desk mats use a 4mm (0.16 inch) high-density natural neoprene rubber base with 360-degree color-matched anti-fray stitching and archival dye-sublimated micro-weave fabric. Standard 2mm promo pads curl at the edges, slide on smooth desks, and lack acoustic cushioning."
            }
          },
          {
            "@type": "Question",
            "name": "Why choose kiln-dried pine stretched canvas wall art over rolled paper posters or metal prints?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Our Stretched Canvas Wall Art arrives hand-stretched over 1.25-inch kiln-dried pine bars with a matte museum-grade weave that eliminates window and monitor glare—ready to hang out of the box without expensive custom framing or magnetic wall damage."
            }
          }
        ]
      }
    ]
  };

  const comparisonHtml = `<!-- PWP_AUTOMATION_11_COMPARISON_PAGE -->
<script type="application/ld+json">${JSON.stringify(comparisonSchema)}</script>
<div style="max-width:1100px;margin:0 auto;padding:16px;color:#111110;line-height:1.65;">
  <div style="background:#F6F4EF;border:1px solid #DEDAD0;border-left:4px solid #111110;border-radius:0px;padding:24px;margin-bottom:28px;">
    <span style="display:inline-block;background:#111110;color:#FFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:0px;margin-bottom:8px;">Material Specification Teardown • Studio Standard vs. Generic Alternatives</span>
    <h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Prints With Passion Studio Standard vs. Generic 2mm Pads, Rolled Posters &amp; Metal Prints</h1>
    <p style="font-size:15px;color:#33312E;margin:0 0 16px;">Before buying a generic marketplace desk pad that curls after three weeks or an unframed poster that glares under room lighting, inspect the 7-point construction breakdown below. Every Prints With Passion order includes <strong>100% Free Tracked UK, US, CA, AU &amp; EU Shipping</strong> plus <strong>15% Off 2+ Coordinated Substrates (Code: STUDIO15)</strong>.</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px;">
      <a href="/collections/desk-mats" style="background:#C85A32;color:#FFF !important;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Upgrade to 4mm Stitched Desk Mats →</a>
      <a href="/collections/canvas-prints" style="background:#111110;color:#FFF !important;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Shop Anti-Glare Pine Canvas Art →</a>
      <a href="/pages/desk-size-visualizer" style="background:#FFFFFF;color:#111110 !important;border:1px solid #111110;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Compare Sizes in Visualizer →</a>
    </div>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:24px 0 12px;">7-Point Laboratory &amp; Studio Specification Matrix</h2>
  <div style="overflow-x:auto;margin-bottom:28px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;background:#FFF;border:1px solid #DEDAD0;">
      <thead>
        <tr style="background:#F6F4EF;border-bottom:2px solid #DEDAD0;text-align:left;">
          <th style="padding:12px 14px;">Engineering Criterion</th>
          <th style="padding:12px 14px;background:#F0FDF4;color:#15803D;">Prints With Passion (Studio Standard)</th>
          <th style="padding:12px 14px;">Generic Marketplace 2mm Pads</th>
          <th style="padding:12px 14px;">Rolled Paper Posters / Metal Sheets</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>1. Desk Mat Thickness &amp; Flatness</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">4mm (0.16&quot;) Dense Natural Neoprene — lays dead-flat out of the box</td>
          <td style="padding:12px 14px;color:#71717A;">1.5mm–2mm low-density foam that ripples and curls</td>
          <td style="padding:12px 14px;color:#71717A;">N/A (Single-category wall sellers)</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>2. Perimeter Edge Stitching</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">360° Color-Matched Anti-Fray Lock-Stitching</td>
          <td style="padding:12px 14px;color:#71717A;">Unstitched raw edges that delaminate under wrist friction</td>
          <td style="padding:12px 14px;color:#71717A;">N/A</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>3. Wall Art Mounting &amp; Glare</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">Matte Museum Cotton-Poly Canvas on 1.25&quot; Kiln-Dried Pine (Zero Glare, Ready to Hang)</td>
          <td style="padding:12px 14px;color:#71717A;">N/A</td>
          <td style="padding:12px 14px;color:#71717A;">Requires £40+ custom framing or suffers severe window/LED glare</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>4. Color &amp; Wash Permanence</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">100-Year Archival UV Pigment &amp; Deep-Fiber Sublimation (Washable 30°C)</td>
          <td style="padding:12px 14px;color:#71717A;">Surface screen-print that fades when wiped</td>
          <td style="padding:12px 14px;color:#71717A;">Scratches easily during mounting</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>5. Cross-Room Substrate Coherence</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">7 Matched Substrates (Desk Mats, Canvas, Cushions, Throws, Bath Mats, Tees, Hoodies)</td>
          <td style="padding:12px 14px;color:#71717A;">Mousepads only</td>
          <td style="padding:12px 14px;color:#71717A;">Wall prints only</td>
        </tr>
        <tr style="border-bottom:1px solid #EAE6DF;">
          <td style="padding:12px 14px;"><strong>6. Interactive Pre-Purchase Tools</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">Free Interactive CM/Inch Size Visualizer + Free 4K Wallpapers</td>
          <td style="padding:12px 14px;color:#71717A;">Static stock mockups only</td>
          <td style="padding:12px 14px;color:#71717A;">No desk/room scale visualizer</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;"><strong>7. Shipping &amp; Multi-Item Savings</strong></td>
          <td style="padding:12px 14px;background:#F0FDF4;font-weight:700;color:#15803D;">100% Free Tracked UK/US/CA/AU/EU Shipping + 15% Off 2+ Items (Code: STUDIO15)</td>
          <td style="padding:12px 14px;color:#71717A;">£6–£12 shipping fee below threshold</td>
          <td style="padding:12px 14px;color:#71717A;">£9–£18 oversized shipping fee at checkout</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;">Explore Flagship Studio Editions Across All Substrates</h2>
  ${renderShoppableGrid(sampleProducts, 'Archival Studio Spec', false)}
</div>`;

  await upsertShopifyPage(
    'studio-quality-vs-generic-prints',
    'Prints With Passion Studio Standard vs. Generic 2mm Pads & Rolled Posters (Full Spec Comparison)',
    comparisonHtml
  );

  // --------------------------------------------------------------------------
  // 3. /pages/trade-and-bulk-orders (Automation 14 — B2B Workspace & Staging Portal)
  // --------------------------------------------------------------------------
  const b2bSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What bulk trade discounts does Prints With Passion offer for offices, interior designers, and Airbnb hosts?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Prints With Passion offers instant automated B2B volume tiers with zero minimum SKU lock-in: 15% OFF 10–24 units (Code: TRADE15), 25% OFF 25–49 units (Code: TRADE25), and 35% OFF 50+ units (Code: TRADE35), all including Free Tracked Shipping across the UK, US, Canada, Australia, and EU."
            }
          },
          {
            "@type": "Question",
            "name": "Can we mix and match different artwork and substrates (Desk Mats, Canvas Wall Art, Cushions, Throws) in a single bulk order?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. You can mix any combination of our 28,865 designs across XXL Desk Mats, Stretched Canvas Wall Art, Cushion Covers, Coral Fleece Throw Blankets, Bath Mats, and Heavyweight Apparel to reach the 10+, 25+, or 50+ unit trade discount tiers."
            }
          }
        ]
      }
    ]
  };

  const b2bHtml = `<!-- PWP_AUTOMATION_14_B2B_PORTAL -->
<script type="application/ld+json">${JSON.stringify(b2bSchema)}</script>
<div style="max-width:1100px;margin:0 auto;padding:16px;color:#111110;line-height:1.65;">
  <div style="background:#F6F4EF;border:1px solid #DEDAD0;border-top:4px solid #C85A32;border-radius:0px;padding:26px;margin-bottom:28px;">
    <span style="display:inline-block;background:#C85A32;color:#FFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:0px;margin-bottom:8px;">B2B Trade, Workspace &amp; Interior Staging Program • 15% to 35% Volume Savings</span>
    <h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#111110;">Corporate Workspaces, Interior Stagers, Esports Lounges &amp; Hospitality Bulk Orders</h1>
    <p style="font-size:15px;color:#33312E;margin:0 0 14px;">Outfit remote engineering teams, boutique hotels, Airbnb properties, and creative studios with museum-grade <strong>Stretched Pine Canvas Art</strong>, <strong>4mm Stitched XXL Desk Mats</strong>, and <strong>Coordinated Soft Furnishings</strong>. Mix and match any designs across our 28,865-item catalog with instant checkout trade codes and <strong>100% Free Tracked Regional Fulfillment (UK, US, CA, AU &amp; EU)</strong>.</p>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:28px;">
    <div style="background:#FFF;border:1px solid #DEDAD0;border-radius:0px;padding:18px;">
      <div style="font-size:12px;font-weight:700;color:#C85A32;text-transform:uppercase;">Tier 1 • 10 to 24 Units</div>
      <div style="font-size:26px;font-weight:800;color:#111110;margin:4px 0;">15% OFF</div>
      <div style="font-size:13px;color:#52525B;margin-bottom:10px;">Ideal for boutique offices, podcasts &amp; 2–3 bedroom Airbnb staging.</div>
      <div style="background:#F6F4EF;border:1px dashed #111110;padding:8px 12px;border-radius:0px;font-size:13px;font-weight:700;">Checkout Code: <span style="color:#C85A32;">TRADE15</span></div>
    </div>
    <div style="background:#FFF;border:2px solid #C85A32;border-radius:0px;padding:18px;">
      <div style="font-size:12px;font-weight:700;color:#C85A32;text-transform:uppercase;">Tier 2 • 25 to 49 Units (Most Popular)</div>
      <div style="font-size:26px;font-weight:800;color:#111110;margin:4px 0;">25% OFF</div>
      <div style="font-size:13px;color:#52525B;margin-bottom:10px;">Ideal for agency studios, esports lounges &amp; multi-unit interior design firms.</div>
      <div style="background:#F6F4EF;border:1px dashed #C85A32;padding:8px 12px;border-radius:0px;font-size:13px;font-weight:700;">Checkout Code: <span style="color:#C85A32;">TRADE25</span></div>
    </div>
    <div style="background:#FFF;border:1px solid #DEDAD0;border-radius:0px;padding:18px;">
      <div style="font-size:12px;font-weight:700;color:#15803D;text-transform:uppercase;">Tier 3 • 50+ Units</div>
      <div style="font-size:26px;font-weight:800;color:#111110;margin:4px 0;">35% OFF</div>
      <div style="font-size:13px;color:#52525B;margin-bottom:10px;">Ideal for enterprise employee onboarding kits, hotels &amp; property developers.</div>
      <div style="background:#F6F4EF;border:1px dashed #15803D;padding:8px 12px;border-radius:0px;font-size:13px;font-weight:700;">Checkout Code: <span style="color:#15803D;">TRADE35</span></div>
    </div>
  </div>

  <section id="pwp-b2b-quote-calculator" style="background:#FFFFFF;border:1px solid #DEDAD0;border-radius:0px;padding:24px;margin-bottom:28px;">
    <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Instant B2B Volume Quote &amp; Trade Code Generator</h2>
    <p style="font-size:13.5px;color:#52525B;margin:0 0 16px;">Select your primary substrate and total unit quantity below to calculate your instant B2B trade pricing and unlock your pre-activated checkout discount link.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:18px;">
      <div>
        <label for="pwp-b2b-substrate" style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:6px;">1. Primary Substrate Mix</label>
        <select id="pwp-b2b-substrate" style="width:100%;padding:10px;border:1px solid #DEDAD0;border-radius:0px;font-size:14px;font-weight:600;">
          <option value="29.99|desk-mats">4mm Stitched XXL Desk Mats (Avg £29.99/unit)</option>
          <option value="44.99|canvas-prints">1.25&quot; Pine Stretched Canvas Wall Art (Avg £44.99/unit)</option>
          <option value="34.99|blankets">300 GSM Coral Fleece Throws &amp; Cushions (Avg £34.99/unit)</option>
          <option value="39.99|hoodies">Heavyweight Studio Graphic Hoodies &amp; Tees (Avg £39.99/unit)</option>
        </select>
      </div>
      <div>
        <label for="pwp-b2b-qty" style="display:block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:6px;">2. Total Unit Quantity (Mix &amp; Match Allowed)</label>
        <input id="pwp-b2b-qty" type="number" min="2" max="1000" value="25" style="width:100%;padding:10px;border:1px solid #DEDAD0;border-radius:0px;font-size:14px;font-weight:700;">
      </div>
      <div style="display:flex;align-items:flex-end;">
        <button type="button" id="pwp-b2b-calc-btn" style="width:100%;padding:11px 16px;background:#111110;color:#FFF;border:none;border-radius:0px;font-size:14px;font-weight:700;cursor:pointer;">Calculate Trade Quote →</button>
      </div>
    </div>

    <div id="pwp-b2b-result" style="background:#F6F4EF;border:1px solid #DEDAD0;border-radius:0px;padding:18px;"></div>

    <script>
    (function() {
      function calcB2B() {
        var subVal = (document.getElementById('pwp-b2b-substrate').value || '29.99|desk-mats').split('|');
        var unitPrice = parseFloat(subVal[0]) || 29.99;
        var colHandle = subVal[1] || 'desk-mats';
        var qty = Math.max(2, parseInt(document.getElementById('pwp-b2b-qty').value, 10) || 25);
        var pct = 0.15;
        var code = 'STUDIO15';
        var tierName = 'Studio Multi-Item Bundle (15% Off 2–9 Units)';
        if (qty >= 50) { pct = 0.35; code = 'TRADE35'; tierName = 'Tier 3 Enterprise Trade (35% Off 50+ Units)'; }
        else if (qty >= 25) { pct = 0.25; code = 'TRADE25'; tierName = 'Tier 2 Commercial Trade (25% Off 25–49 Units)'; }
        else if (qty >= 10) { pct = 0.15; code = 'TRADE15'; tierName = 'Tier 1 Boutique Trade (15% Off 10–24 Units)'; }

        var retailTotal = unitPrice * qty;
        var netTotal = retailTotal * (1 - pct);
        var savings = retailTotal - netTotal;
        var netUnit = unitPrice * (1 - pct);

        if (typeof window.pwpGtagEvent === 'function') {
          window.pwpGtagEvent('b2b_quote_generated', { quantity: qty, discount_code: code, estimated_value: parseFloat(netTotal.toFixed(2)) });
        }

        document.getElementById('pwp-b2b-result').innerHTML =
          '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;">' +
            '<div>' +
              '<div style="font-size:12px;font-weight:700;color:#C85A32;text-transform:uppercase;">Qualified Tier: ' + tierName + '</div>' +
              '<div style="font-size:20px;font-weight:800;color:#111110;margin:4px 0;">Net Trade Total: £' + netTotal.toFixed(2) + ' <span style="font-size:14px;color:#15803D;">(You Save £' + savings.toFixed(2) + ' • £' + netUnit.toFixed(2) + '/unit)</span></div>' +
              '<div style="font-size:13px;color:#52525B;">Includes 100% Free Tracked UK, US, CA, AU &amp; EU Delivery • Active Checkout Code: <strong>' + code + '</strong></div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<a href="/collections/' + colHandle + '?discount=' + code + '" style="background:#C85A32;color:#FFF !important;padding:10px 18px;border-radius:0px;font-size:13.5px;font-weight:700;text-decoration:none !important;">Browse Catalog w/ Code ' + code + ' →</a>' +
              '<button type="button" onclick="window.print()" style="background:#FFF;color:#111110;border:1px solid #111110;padding:10px 14px;border-radius:0px;font-size:13px;font-weight:600;cursor:pointer;">Print PDF Spec Quote</button>' +
            '</div>' +
          '</div>';
      }
      var btn = document.getElementById('pwp-b2b-calc-btn');
      if (btn) btn.addEventListener('click', calcB2B);
      calcB2B();
    })();
    </script>
  </section>

  <h2 style="font-size:22px;font-weight:700;margin:28px 0 12px;">Popular B2B &amp; Interior Staging Substrates (1-Click 10-Unit Trade Packs)</h2>
  ${renderShoppableGrid(sampleProducts, 'B2B Trade Eligible', true)}
</div>`;

  await upsertShopifyPage(
    'trade-and-bulk-orders',
    'B2B Corporate Workspaces, Interior Staging & Bulk Trade Orders (15%–35% Off)',
    b2bHtml
  );
}

main().catch(console.error);
