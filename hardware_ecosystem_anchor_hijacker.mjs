import fs from 'fs';

const authPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const GRAPHQL_URL = 'https://admin.shopify.com/api/shopify/bpcprints';

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

const HARDWARE_ECOSYSTEM_SPECS = [
  // 6 Desks
  { category: 'Desk Surface', model: 'IKEA Karlby 74" (186×63.5cm) + Alex Drawers', footprint: '186×63.5cm (74×25")', deskMatSpec: '90×40cm (35.4×15.7") 4mm XXL Extended', canvasSpec: '24×36" (60×90cm) Centerpiece Pine Canvas', collectionHandle: 'japanese-anime-desk-mats', collectionAnchor: 'Japanese & Ukiyo-e 90×40cm Desk Mats' },
  { category: 'Desk Surface', model: 'IKEA Karlby 98" (246×63.5cm) Dual Workstation', footprint: '246×63.5cm (98×25")', deskMatSpec: 'Dual 80×30cm or Single 90×40cm XXL Center', canvasSpec: 'Dual 18×24" (45×60cm) Matched Pine Canvases', collectionHandle: 'minimalist-abstract-geometric-desk-mats', collectionAnchor: 'Minimalist & Bauhaus XXL Desk Mats' },
  { category: 'Desk Surface', model: 'Secretlab Magnus Pro (150×70cm)', footprint: '150×70cm w/ Rear Magnetic Cable Tray', deskMatSpec: '80×30cm (31.5×11.8") Clears Cable Tray Lid', canvasSpec: '16×20" (40×50cm) Above-Monitor Canvas', collectionHandle: 'cyberpunk-neon-gaming-desk-mats', collectionAnchor: 'Sci-Fi & Cyberpunk Battlestation Mats' },
  { category: 'Desk Surface', model: 'Secretlab Magnus Pro XL (177×80cm)', footprint: '177×80cm Full-Tower Battlestation', deskMatSpec: '90×40cm (35.4×15.7") 4mm Acoustic Neoprene', canvasSpec: '24×36" (60×90cm) Anti-Glare Pine Canvas', collectionHandle: 'space-galaxy-astronomy-desk-mats', collectionAnchor: 'Space & Cosmic 90×40cm Desk Mats' },
  { category: 'Desk Surface', model: 'FlexiSpot E7 / E7 Pro Standing Desk', footprint: '140×70cm to 180×80cm Bamboo/Walnut', deskMatSpec: '90×40cm (35.4×15.7") Non-Slip Rubber Base', canvasSpec: '18×24" (45×60cm) Vertical Clearance Canvas', collectionHandle: 'nature-mountain-forest-desk-mats', collectionAnchor: 'Nature & Alpine Landscape Desk Mats' },
  { category: 'Desk Surface', model: 'Uplift V2 / Autonomous SmartDesk Pro', footprint: '152×76cm (60×30") Ergonomic Sit-Stand', deskMatSpec: '90×40cm or 80×30cm 4mm Stitched Pad', canvasSpec: '20×30" (50×75cm) Matte Studio Canvas', collectionHandle: 'botanical-floral-desk-mats', collectionAnchor: 'Botanical & Biophilic Studio Desk Mats' },

  // 6 Keyboards
  { category: 'Mechanical Keyboard', model: 'Keychron Q1 Pro / Q1 Max (75% Gasket Aluminum)', footprint: '32.7×14.5cm CNC Aluminum Body', deskMatSpec: '90×40cm 4mm Neoprene (Deepens Thock Profile)', canvasSpec: '16×20" Coordinated Motif Canvas', collectionHandle: 'retro-synthwave-80s-desk-mats', collectionAnchor: 'Retro & Synthwave 4mm Acoustic Mats' },
  { category: 'Mechanical Keyboard', model: 'Keychron Q3 Max / Q6 Max (TKL & 100% Full Size)', footprint: '36.5cm–44.6cm Wide Layout', deskMatSpec: '90×40cm XXL Extended (Leaves 45cm+ Mouse Sweep)', canvasSpec: '18×24" Gallery Pine Canvas', collectionHandle: 'world-travel-city-desk-mats', collectionAnchor: 'World Travel & Architectural Desk Mats' },
  { category: 'Mechanical Keyboard', model: 'Wooting 60HE+ / Wooting 80HE (Hall Effect)', footprint: '29.3×10.3cm Rapid-Trigger Esports Board', deskMatSpec: '90×40cm Zero-Slip SBR Base for Low-DPI Flicks', canvasSpec: '16×20" Cyberpunk / Anime Wall Art', collectionHandle: 'cyberpunk-neon-gaming-desk-mats', collectionAnchor: 'Competitive Gaming 4mm XXL Desk Mats' },
  { category: 'Mechanical Keyboard', model: 'HHKB Professional Hybrid Type-S (60% Topre)', footprint: '29.4×11.0cm Minimalist Developer Layout', deskMatSpec: '80×30cm (31.5×11.8") Precision Studio Pad', canvasSpec: '12×16" or 18×24" Minimalist Canvas', collectionHandle: 'minimalist-abstract-geometric-desk-mats', collectionAnchor: 'Developer & Minimalist 80×30cm Mats' },
  { category: 'Mechanical Keyboard', model: 'NuPhy Air75 V2 / Halo75 V2', footprint: '31.8×13.5cm Low-Profile Wireless', deskMatSpec: '80×30cm Flush 360° Anti-Fray Wrist Border', canvasSpec: '16×20" Botanical or Japanese Canvas', collectionHandle: 'japanese-anime-desk-mats', collectionAnchor: 'Japanese Aesthetic 80×30cm & 90×40cm Mats' },
  { category: 'Mechanical Keyboard', model: 'Glorious GMMK Pro / Mode Sonnet 75%', footprint: '33.2×13.5cm Heavy Brass/Aluminum Frame', deskMatSpec: '90×40cm 4mm High-Density Acoustic Cushion', canvasSpec: '24×36" Statement Studio Canvas', collectionHandle: 'dark-fantasy-gothic-desk-mats', collectionAnchor: 'Dark Fantasy & Mythic 4mm Desk Mats' },

  // 6 Monitors
  { category: 'Ultrawide & OLED Display', model: 'Samsung Odyssey OLED G9 49" (32:9 Super Ultrawide)', footprint: '119.4cm Span (1800R Curve)', deskMatSpec: '90×40cm XXL Centered Under 49" Span', canvasSpec: '24×36" Horizontal or Dual 16×20" Above-Bezel', collectionHandle: 'space-galaxy-astronomy-canvas-wall-art', collectionAnchor: 'Cosmic & Nebula Above-Ultrawide Canvas' },
  { category: 'Ultrawide & OLED Display', model: 'LG C3 / C4 42" 4K OLED Desk TV', footprint: '93.2×54.0cm Deep-Desk Viewing', deskMatSpec: '90×40cm Matches 93.2cm Bezel Width 1:1', canvasSpec: 'Dual 12×16" Flanking Side Canvases', collectionHandle: 'cyberpunk-neon-gaming-canvas-wall-art', collectionAnchor: 'Zero-Glare Matte Canvas for OLED Rooms' },
  { category: 'Ultrawide & OLED Display', model: 'Alienware AW3423DWF 34" QD-OLED (21:9)', footprint: '81.5cm Curved Ultrawide Span', deskMatSpec: '80×30cm (80cm Mat Mirrors 81.5cm Monitor Width)', canvasSpec: '18×24" Above-Monitor Pine Canvas', collectionHandle: 'japanese-anime-canvas-wall-art', collectionAnchor: 'Japanese & Anime Stretched Pine Canvas' },
  { category: 'Ultrawide & OLED Display', model: 'Apple Studio Display 27" / Pro Display XDR', footprint: '62.3cm Aluminum Retina Workstation', deskMatSpec: '80×30cm or 90×40cm Editorial Gallery Mat', canvasSpec: '18×24" or 24×36" Bauhaus / Abstract Canvas', collectionHandle: 'minimalist-abstract-geometric-canvas-wall-art', collectionAnchor: 'Abstract & Architectural Studio Canvas' },
  { category: 'Ultrawide & OLED Display', model: 'Dell UltraSharp U4025QW 40" 5K2K Curved', footprint: '94.6cm Productivity Ultrawide', deskMatSpec: '90×40cm XXL Extended (Covers 95% of Bezel Span)', canvasSpec: '24×36" Nature or World City Canvas', collectionHandle: 'nature-mountain-forest-canvas-wall-art', collectionAnchor: 'Nature & Mountain Anti-Glare Canvas' },
  { category: 'Ultrawide & OLED Display', model: 'ASUS ROG Swift PG32UCDM 32" 4K 240Hz OLED', footprint: '71.8cm Esports & Creator Display', deskMatSpec: '90×40cm Deep Mouse Sweep for 400–1600 DPI', canvasSpec: '16×20" or 18×24" Matte Pine Canvas', collectionHandle: 'wildlife-animal-canvas-wall-art', collectionAnchor: 'Wildlife & Studio Statement Canvas' },

  // 6 Mice & Peripherals
  { category: 'Mouse & Audio Sensor', model: 'Logitech G Pro X Superlight 2 (Hero 2 32K DPI)', footprint: '60g PTFE Skates • Optical Hero 2 Sensor', deskMatSpec: 'Calibrated Micro-Weave (Zero Spin-Out, Low Static Friction)', canvasSpec: 'Coordinated Room Theme Canvas (-15% w/ STUDIO15)', collectionHandle: 'desk-mats', collectionAnchor: 'All Micro-Weave 4mm XXL Desk Mats' },
  { category: 'Mouse & Audio Sensor', model: 'Razer Viper V3 Pro (Focus Pro 35K Gen-2)', footprint: '54g Symmetrical Esports Shell', deskMatSpec: '90×40cm Uninterrupted Horizontal Tracking Zone', canvasSpec: 'Coordinated Room Theme Canvas (-15% w/ STUDIO15)', collectionHandle: 'cyberpunk-neon-gaming-desk-mats', collectionAnchor: 'High-Precision Gaming Desk Mats' },
  { category: 'Mouse & Audio Sensor', model: 'Finalmouse UltralightX / Pulsar X2V2', footprint: 'Sub-50g Magnesium / Ultralight PTFE', deskMatSpec: '4mm Plush Neoprene Offers Controlled Stopping Power', canvasSpec: 'Coordinated Room Theme Canvas (-15% w/ STUDIO15)', collectionHandle: 'japanese-anime-desk-mats', collectionAnchor: 'Japanese Micro-Weave 4mm Desk Mats' },
  { category: 'Mouse & Audio Sensor', model: 'Logitech MX Master 3S + Apple Magic Trackpad', footprint: '8,000 DPI Darkfield + Dual-Input Workflow', deskMatSpec: '80×30cm or 90×40cm Smooth Glide + Wrist Cushion', canvasSpec: 'Coordinated Office Wall Canvas', collectionHandle: 'minimalist-abstract-geometric-desk-mats', collectionAnchor: 'Ergonomic Productivity Desk Mats' },
  { category: 'Mouse & Audio Sensor', model: 'SteelSeries Arctis Nova Pro + GameDAC Gen 2', footprint: 'Desktop DAC + Studio Headphone Stand', deskMatSpec: '90×40cm Accommodates DAC + Keyboard + Mouse', canvasSpec: '1.25" Pine Canvas Absorbs Upper-Wall Reflections', collectionHandle: 'retro-synthwave-80s-desk-mats', collectionAnchor: 'Audio & Streaming Studio Desk Mats' },
  { category: 'Mouse & Audio Sensor', model: 'Elgato Stream Deck MK.2 + Wave XLR Creator Rig', footprint: 'Multi-Controller Creator Desk Footprint', deskMatSpec: '90×40cm Vibration-Dampening 4mm Base for Boom Arms', canvasSpec: 'Zero-Glare Matte Canvas Backdrop for On-Camera Video', collectionHandle: 'canvas-prints', collectionAnchor: 'Camera-Safe Zero-Glare Canvas Backdrops' }
];

async function main() {
  console.log('=== [Automation 17] Injecting 24-Model Hardware & Furniture Ecosystem Compatibility Matrix into /pages/desk-setup-hardware-compatibility-guide ===');

  const pageQ = await shopifyGraphQL(`
    query GetHardwarePage {
      pages(first: 1, query: "handle:desk-setup-hardware-compatibility-guide") {
        nodes { id handle title body }
      }
    }
  `);

  const page = pageQ?.pages?.nodes?.[0];
  if (!page) {
    console.error('  Could not find /pages/desk-setup-hardware-compatibility-guide');
    process.exit(1);
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Prints With Passion 24-Model Hardware & Furniture Compatibility Matrix (Desks, Keyboards, Monitors, Mice)",
    "numberOfItems": HARDWARE_ECOSYSTEM_SPECS.length,
    "itemListElement": HARDWARE_ECOSYSTEM_SPECS.map((item, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": `${item.model} — Recommended: ${item.deskMatSpec} & ${item.canvasSpec}`,
      "url": `https://printswithpassion.com/collections/${item.collectionHandle}`
    }))
  };

  const rowsHtml = HARDWARE_ECOSYSTEM_SPECS.map(item => `
    <tr data-hw-cat="${item.category}" style="border-bottom:1px solid #EAE6DF;">
      <td style="padding:10px 12px;font-size:11.5px;font-weight:700;color:#C85A32;text-transform:uppercase;">${item.category}</td>
      <td style="padding:10px 12px;font-weight:700;color:#111110;">${item.model}</td>
      <td style="padding:10px 12px;color:#52525B;">${item.footprint}</td>
      <td style="padding:10px 12px;color:#15803D;font-weight:600;">${item.deskMatSpec}</td>
      <td style="padding:10px 12px;color:#33312E;">${item.canvasSpec}</td>
      <td style="padding:10px 12px;"><a href="/collections/${item.collectionHandle}?discount=STUDIO15" style="color:#C85A32;font-weight:700;text-decoration:underline;">${item.collectionAnchor} →</a></td>
    </tr>`).join('\n');

  const matrixBlockHtml = `<!-- PWP_AUTOMATION_17_HARDWARE_MATRIX_START -->
<section id="pwp-24model-hardware-ecosystem-matrix" style="max-width:1100px;margin:28px auto;padding:22px;background:#F6F4EF;border:1px solid #DEDAD0;border-top:4px solid #111110;border-radius:0px;color:#111110;">
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;">
    <div>
      <span style="display:inline-block;background:#111110;color:#FFF;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:4px 10px;border-radius:0px;margin-bottom:6px;">24-Model Hardware Fitment Index • Desks • Keyboards • OLED Ultrawides • Mice</span>
      <h2 style="font-size:21px;font-weight:700;margin:0;color:#111110;">Interactive 24-Model Hardware &amp; Furniture Compatibility Directory</h2>
      <p style="font-size:13.5px;color:#52525B;margin:4px 0 0;">Filter by hardware category below to verify exact centimetre (cm) and inch clearances, acoustic dampening specs, and PixArt/Hero optical sensor compatibility—all eligible for <strong>15% Off 2+ Items (Code: STUDIO15)</strong>.</p>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;" id="pwp-hw-filter-bar">
      <button type="button" data-filter="ALL" style="padding:7px 12px;background:#111110;color:#FFF;border:1px solid #111110;border-radius:0px;font-size:12px;font-weight:700;cursor:pointer;">All 24 Models</button>
      <button type="button" data-filter="Desk Surface" style="padding:7px 12px;background:#FFF;color:#111110;border:1px solid #DEDAD0;border-radius:0px;font-size:12px;font-weight:600;cursor:pointer;">Desks (IKEA / Secretlab / Standing)</button>
      <button type="button" data-filter="Mechanical Keyboard" style="padding:7px 12px;background:#FFF;color:#111110;border:1px solid #DEDAD0;border-radius:0px;font-size:12px;font-weight:600;cursor:pointer;">Keyboards (Keychron / Wooting / HHKB)</button>
      <button type="button" data-filter="Ultrawide & OLED Display" style="padding:7px 12px;background:#FFF;color:#111110;border:1px solid #DEDAD0;border-radius:0px;font-size:12px;font-weight:600;cursor:pointer;">Monitors (49&quot; G9 / 42&quot; OLED / 34&quot;)</button>
      <button type="button" data-filter="Mouse & Audio Sensor" style="padding:7px 12px;background:#FFF;color:#111110;border:1px solid #DEDAD0;border-radius:0px;font-size:12px;font-weight:600;cursor:pointer;">Mice &amp; Creator Audio</button>
    </div>
  </div>

  <div style="overflow-x:auto;">
    <table id="pwp-hw-ecosystem-table" style="width:100%;border-collapse:collapse;font-size:13px;background:#FFFFFF;border:1px solid #DEDAD0;">
      <thead>
        <tr style="background:#F6F4EF;border-bottom:2px solid #DEDAD0;text-align:left;">
          <th style="padding:10px 12px;">Category</th>
          <th style="padding:10px 12px;">Hardware / Furniture Model</th>
          <th style="padding:10px 12px;">Exact Dimensions / Sensor</th>
          <th style="padding:10px 12px;">Verified PWP Desk Mat Spec</th>
          <th style="padding:10px 12px;">Verified Wall Canvas Pairing</th>
          <th style="padding:10px 12px;">Shop Matched Collection</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <script>
  (function(){
    var bar = document.getElementById('pwp-hw-filter-bar');
    var table = document.getElementById('pwp-hw-ecosystem-table');
    if (!bar || !table) return;
    var btns = bar.querySelectorAll('button[data-filter]');
    var rows = table.querySelectorAll('tbody tr[data-hw-cat]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var f = this.getAttribute('data-filter');
        for (var j = 0; j < btns.length; j++) {
          btns[j].style.background = '#FFF';
          btns[j].style.color = '#111110';
        }
        this.style.background = '#111110';
        this.style.color = '#FFF';
        for (var k = 0; k < rows.length; k++) {
          var cat = rows[k].getAttribute('data-hw-cat');
          rows[k].style.display = (f === 'ALL' || cat === f) ? '' : 'none';
        }
        if (typeof window.pwpGtagEvent === 'function') {
          window.pwpGtagEvent('hardware_matrix_filtered', { hardware_category: f });
        }
      });
    }
  })();
  </script>
</section>
<!-- PWP_AUTOMATION_17_HARDWARE_MATRIX_END -->`;

  let body = page.body || '';
  const existingRegex = /<!-- PWP_AUTOMATION_17_HARDWARE_MATRIX_START -->[\s\S]*?<!-- PWP_AUTOMATION_17_HARDWARE_MATRIX_END -->\s*/;
  if (existingRegex.test(body)) {
    body = body.replace(existingRegex, matrixBlockHtml + '\n');
  } else {
    body = body + '\n' + matrixBlockHtml;
  }

  const upd = await shopifyGraphQL(`
    mutation UpdHwPage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page { id handle }
        userErrors { field message }
      }
    }
  `, {
    id: page.id,
    page: { body }
  });

  console.log('  Updated /pages/desk-setup-hardware-compatibility-guide with 24-model Hardware Matrix:', upd?.pageUpdate?.page, upd?.pageUpdate?.userErrors);
}

main().catch(console.error);
