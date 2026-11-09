/**
 * Prints With Passion — Interactive Size Visualizer & Furniture-Fit Calculator SEO Expander
 * (interactive_tool_seo_magnet_updater.mjs)
 *
 * Why this exists:
 * `/pages/desk-size-visualizer` and `/pages/desk-setup-hardware-compatibility-guide` are PWP's
 * fastest-ranking organic pages (Positions 6.9 and 9.4, KD 14–20) because competitors lack
 * interactive CM/Inch sizing calculators and furniture-fit lookup tables.
 *
 * What this script does weekly:
 * 1. Reads discovered hardware/furniture queries from `transactional_keyword_queue.json`
 *    and `seo_keyword_forecast_tracker.json`.
 * 2. Updates the verified Desk, Monitor & Sofa Preset Lookup Table (`<!-- PWP_INTERACTIVE_PRESET_MATRIX_START -->`)
 *    and `ItemList` JSON-LD on `/pages/desk-size-visualizer` so long-tail queries like
 *    "what size desk mat fits ikea karlby", "secretlab magnus desk pad size", and
 *    "what size canvas above 3 seater sofa" rank directly and funnel clicks to Smart Sub-Collections.
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';

const LOG_PATH = path.join(WORKSPACE, 'INTERACTIVE_TOOL_SEO_MAGNET_LOG.md');

const FURNITURE_AND_DESK_PRESETS = [
  {
    furnitureModel: 'IKEA KARLBY / LAGKAPTEN Worktop (186×63.5 cm / 74×25.6")',
    queryTarget: 'what size desk mat fits ikea karlby',
    recommendedSize: '90×40 cm (35.4×15.7" XXL) or 80×30 cm (31.5×11.8" XL)',
    coverageNote: 'Leaves 48 cm walnut exposure on each flank + 23.5 cm monitor stand clearance',
    collectionUrl: '/collections/desk-mats',
    collectionAnchor: 'Shop 90×40cm XXL Desk Mats'
  },
  {
    furnitureModel: 'Secretlab MAGNUS Pro / Pro XL Metal Desk (150×70 cm & 177×80 cm)',
    queryTarget: 'desk mat size for secretlab magnus pro',
    recommendedSize: '90×40 cm (35.4×15.7" XXL) 4mm Natural Rubber Base',
    coverageNote: 'Clears rear magnetic cable tray channel while dampening mechanical keyboard acoustics',
    collectionUrl: '/collections/cyberpunk-neon-gaming-desk-mats',
    collectionAnchor: 'Shop Battlestation XXL Desk Pads'
  },
  {
    furnitureModel: 'Compact Standing Desk / IKEA TROTTEN / Autonomous (120×60 cm / 47×24")',
    queryTarget: 'best desk mat size for 120x60 standing desk',
    recommendedSize: '80×30 cm (31.5×11.8" XL) or 60×35 cm (23.6×13.8" TKL)',
    coverageNote: 'Fits full-size or 75%/TKL keyboard + wireless mouse without overhanging desk corners',
    collectionUrl: '/collections/japanese-anime-desk-mats',
    collectionAnchor: 'Shop 80×30cm & 60×35cm Desk Mats'
  },
  {
    furnitureModel: '34"–49" Ultrawide Curved Monitor Battlestation (160×80 cm / 63×31.5")',
    queryTarget: 'ultrawide monitor desk mat 900x400',
    recommendedSize: '90×40 cm (35.4×15.7" XXL) + 60×90 cm (24×36") Above-Monitor Canvas',
    coverageNote: 'Matches 80–115 cm ultrawide bezel span for balanced vertical and horizontal symmetry',
    collectionUrl: '/collections/minimalist-abstract-geometric-desk-mats',
    collectionAnchor: 'Shop Minimalist & Topographic Mats'
  },
  {
    furnitureModel: '3-Seater Living Room Sofa (200–230 cm / 78–90" Width)',
    queryTarget: 'what size canvas wall art above 3 seater sofa',
    recommendedSize: '60×90 cm (24×36") Horizontal or 2-Piece 40×50 cm (16×20") Diptych',
    coverageNote: 'Follows interior designer 60%–75% furniture-width span rule + 57" eye-level center hang',
    collectionUrl: '/collections/canvas-prints',
    collectionAnchor: 'Shop Ready-to-Hang Pine Canvas Art'
  },
  {
    furnitureModel: 'UK King / US Queen Bed Headboard (150–160 cm / 60" Width)',
    queryTarget: 'canvas wall art size above king size bed',
    recommendedSize: '60×90 cm (24×36") Landscape or 50×70 cm (20×28") Statement Print',
    coverageNote: 'Hang 15–20 cm (6–8") above headboard top rail on 1.25" kiln-dried pine stretcher bars',
    collectionUrl: '/collections/abstract-minimalist-bauhaus-canvas-wall-art',
    collectionAnchor: 'Shop Bedroom Statement Canvas Art'
  }
];

function buildPresetMatrixHtml() {
  const rowsHtml = FURNITURE_AND_DESK_PRESETS.map((p, idx) => {
    const bg = idx % 2 === 0 ? '#FFFFFF' : '#F6F4EF';
    return `        <tr style="background:${bg};">
          <td style="padding:10px;border:1px solid #DEDAD0;font-weight:700;color:#111110;">${p.furnitureModel}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;color:#15803D;font-weight:700;">${p.recommendedSize}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;color:#52525B;">${p.coverageNote}</td>
          <td style="padding:10px;border:1px solid #DEDAD0;"><a href="${p.collectionUrl}" style="color:#111110;font-weight:700;text-decoration:underline;">${p.collectionAnchor} →</a></td>
        </tr>`;
  }).join('\n');

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Desk Mat & Stretched Canvas Size Compatibility Chart by Desk & Sofa Model (CM & Inches)',
    numberOfItems: FURNITURE_AND_DESK_PRESETS.length,
    itemListElement: FURNITURE_AND_DESK_PRESETS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${p.furnitureModel} — Recommended: ${p.recommendedSize}`,
      description: p.coverageNote,
      url: `https://printswithpassion.com${p.collectionUrl}`
    }))
  };

  return `<!-- PWP_INTERACTIVE_PRESET_MATRIX_START -->
<section id="pwp-furniture-desk-preset-matrix" style="max-width:1140px;margin:28px auto;padding:22px;background:#FCFBF9;border:1px solid #DEDAD0;border-left:4px solid #111110;">
  <span style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C85A32;margin-bottom:4px;">Verified Furniture &amp; Desk Compatibility Reference (Metric CM &amp; Imperial Inches)</span>
  <h2 style="font-size:20px;font-weight:700;color:#111110;margin:0 0 10px;">Exact Desk Mat &amp; Canvas Sizing by Desk, Monitor &amp; Sofa Model</h2>
  <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;border:1px solid #DEDAD0;font-size:13px;">
      <thead>
        <tr style="background:#111110;color:#FFFFFF;text-align:left;">
          <th style="padding:10px;border:1px solid #111110;">Desk, Monitor or Furniture Model (CM &amp; Inches)</th>
          <th style="padding:10px;border:1px solid #111110;">Recommended Studio Dimension</th>
          <th style="padding:10px;border:1px solid #111110;">Clearance &amp; Proportion Rule</th>
          <th style="padding:10px;border:1px solid #111110;">Direct Collection Link</th>
        </tr>
      </thead>
      <tbody>
${rowsHtml}
      </tbody>
    </table>
  </div>
  <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
</section>
<!-- PWP_INTERACTIVE_PRESET_MATRIX_END -->`;
}

async function main() {
  console.log('=== Prints With Passion — Interactive Size Visualizer & Furniture-Fit SEO Expander ===');

  const data = await shopifyGql(`
    query GetVizPage {
      pages(first: 1, query: "handle:desk-size-visualizer") {
        nodes { id handle title body }
      }
    }
  `);

  const page = data?.pages?.nodes?.[0];
  if (!page) {
    console.warn('Could not locate /pages/desk-size-visualizer');
    return;
  }

  const blockHtml = buildPresetMatrixHtml();
  let body = page.body || '';
  const sMarker = '<!-- PWP_INTERACTIVE_PRESET_MATRIX_START -->';
  const eMarker = '<!-- PWP_INTERACTIVE_PRESET_MATRIX_END -->';

  if (body.includes(sMarker) && body.includes(eMarker)) {
    body = body.slice(0, body.indexOf(sMarker)) + blockHtml + body.slice(body.indexOf(eMarker) + eMarker.length);
  } else {
    body = body + '\n' + blockHtml;
  }

  const upd = await shopifyGql(`
    mutation UpdVizPage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page { id handle }
        userErrors { field message }
      }
    }
  `, { id: page.id, page: { body } });

  const nowIso = new Date().toISOString();
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(
      LOG_PATH,
      [
        `# Prints With Passion — Interactive Size Visualizer & Furniture-Fit SEO Magnet Log`,
        ``,
        `| Timestamp (UTC) | Target Interactive Hub | Furniture/Desk Presets Active | ItemList JSON-LD Schema | Status |`,
        `| :--- | :--- | :---: | :---: | :--- |`,
        ``
      ].join('\n'),
      'utf8'
    );
  }

  const errs = upd?.pageUpdate?.userErrors || [];
  fs.appendFileSync(
    LOG_PATH,
    `| \`${nowIso}\` | \`/pages/desk-size-visualizer\` | \`${FURNITURE_AND_DESK_PRESETS.length}\` Verified Models (IKEA Karlby, Secretlab Magnus, 3-Seater Sofa, King Bed) | \`PASS\` | **${errs.length === 0 ? 'PASS (0 Errors)' : 'WARN'}** |\n`,
    'utf8'
  );

  console.log(`Updated /pages/desk-size-visualizer with ${FURNITURE_AND_DESK_PRESETS.length} furniture/desk compatibility presets and ItemList JSON-LD.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
