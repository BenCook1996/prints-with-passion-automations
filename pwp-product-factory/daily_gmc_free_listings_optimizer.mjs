import fs from 'fs';
import path from 'path';
import {
  shopifyGraphQL,
  SUBCOLLECTIONS_PATH,
  WORKSPACE,
  resolveFactoryFile,
  writeFactoryFileSync,
  appendFactoryFileSync
} from './lib/cloud-env.mjs';

const SEO_ROOT = fs.existsSync(path.join(WORKSPACE, 'transactional_keyword_queue.json'))
  ? WORKSPACE
  : path.resolve(WORKSPACE, '..', 'pwp-seo-blog-engine');
const KEYWORD_QUEUE_PATH = path.join(SEO_ROOT, 'transactional_keyword_queue.json');
const STATE_PATH = resolveFactoryFile('gmc_optimizer_state.json');
const LOG_PATH = resolveFactoryFile('GMC_FREE_LISTINGS_OPTIMIZATION_LOG.md');

const subsList = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
const keywordQueue = fs.existsSync(KEYWORD_QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'))
  : null;

function getKeywordClusterForSub(sub) {
  if (!keywordQueue || !sub) return null;
  const list = keywordQueue.bySubCollection?.[sub.handle];
  if (Array.isArray(list) && list.length > 0) {
    return list.find(c => c.status === 'queued') || list[0];
  }
  if (list && typeof list === 'object' && !Array.isArray(list)) {
    return list;
  }
  if (Array.isArray(keywordQueue.keywords)) {
    return keywordQueue.keywords.find(c => c.subCollectionHandle === sub.handle) || null;
  }
  return null;
}

const HIGH_MARGIN_HERO_TYPES = new Set(['Canvas Wall Art', 'Throw Blankets', 'Hoodies', 'Desk Mats']);

function matchSubCollectionForGmc(p) {
  const byType = subsList.filter(s => s.productType === p.productType);
  if (!byType.length) return subsList[0];
  const text = `${p.title} ${p.handle || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
  if (/japan|samurai|sakura|ukiyo|koi|katana|torii|tokyo|anime/.test(text)) {
    const m = byType.find(s => s.themeTag === 'Japanese & Asian Art');
    if (m) return m;
  }
  if (/cyberpunk|neon|synth|futur|cyborg|sci-fi|mecha/.test(text)) {
    const m = byType.find(s => s.themeTag === 'Sci-Fi & Cyberpunk');
    if (m) return m;
  }
  if (/space|galaxy|nebula|cosmos|astronaut|planet|moon|starry|celestial/.test(text)) {
    const m = byType.find(s => s.themeTag === 'Space & Cosmic');
    if (m) return m;
  }
  for (const s of byType) {
    const kws = s.themeTag.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    if (kws.some(kw => text.includes(kw))) return s;
  }
  return byType[0];
}

const DIMENSION_BADGE_BY_TYPE = {
  'Desk Mats': '900x400x4mm (35.4"x15.7")',
  'Canvas Wall Art': 'Gallery Wrapped 24×16" (60×40cm)',
  'Cushion Covers': 'Double-Sided 40×40 cm (16×16")',
  'Throw Blankets': '300gsm Coral Fleece 50×60" & 60×80"',
  'Bath Mats': 'Memory Foam 61×43 cm (24×17")',
  'Graphic T-Shirts': 'Heavyweight Cotton S–3XL',
  'Hoodies': 'Heavyweight Fleece S–3XL'
};

const MATERIAL_SPEC_BY_TYPE = {
  'Desk Mats': '4mm natural rubber base w/ 360° anti-fray stitched micro-weave cloth (900x400x4mm / 35.4"x15.7")',
  'Canvas Wall Art': '360gsm archival matte cotton-poly canvas stretched over 1.25" (32mm) kiln-dried pine gallery bars',
  'Cushion Covers': 'Double-sided archival print on heavyweight spun-poly linen weave w/ concealed zipper (40×40cm)',
  'Throw Blankets': '300gsm anti-pill plush coral fleece in 127×152cm (50×60") & 152×203cm (60×80") sofa/bed sizes',
  'Bath Mats': 'High-density memory foam core w/ fast-drying microfiber top & non-slip backing (61×43cm / 24×17")',
  'Graphic T-Shirts': '100% combed ring-spun heavyweight cotton (Unisex S–3XL) w/ breathable archival DTG print',
  'Hoodies': '310gsm ring-spun cotton-fleece blend (Unisex S–3XL) w/ double-lined hood & relaxed drop-shoulder fit'
};

const GMC_CLEAN_MATERIAL_BY_TYPE = {
  'Desk Mats': 'Micro-Textured Cloth Top with 4mm Non-Slip Natural Rubber Base',
  'Canvas Wall Art': '100% Cotton-Poly Blend Artist Canvas on Kiln-Dried Pinewood Frame',
  'Cushion Covers': '100% Heavyweight Spun-Poly Linen Weave with Concealed Zipper',
  'Throw Blankets': '100% Brushed Polyester Coral Fleece (300 GSM)',
  'Bath Mats': 'Plush Velvet Microfiber Top with Memory Foam Core & Non-Slip Backing',
  'Graphic T-Shirts': '100% Combed Ring-Spun Organic Cotton (180 GSM)',
  'Hoodies': '80% Ring-Spun Cotton / 20% Brushed Polyester Fleece (310 GSM)'
};

const GMC_GPC_BY_TYPE = {
  'Desk Mats': '505383',
  'Canvas Wall Art': '500044',
  'Cushion Covers': '4453',
  'Throw Blankets': '1985',
  'Bath Mats': '696',
  'Graphic T-Shirts': '212',
  'Hoodies': '5598'
};

function deriveColorFromProduct(p) {
  const hay = `${p.title || ''} ${p.handle || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
  const matches = [];
  const colorMap = [
    [/midnight blue|navy/i, 'Navy Blue'],
    [/gold|golden|amber/i, 'Gold'],
    [/crimson|ruby|red|scarlet|cherry/i, 'Crimson Red'],
    [/emerald|forest green|jade|sage|olive|green/i, 'Emerald Green'],
    [/teal|turquoise|cyan|aqua/i, 'Teal'],
    [/cobalt|sapphire|azure|blue/i, 'Cobalt Blue'],
    [/violet|purple|lavender|amethyst/i, 'Violet'],
    [/coral|peach|salmon|rose|pink/i, 'Coral Pink'],
    [/terracotta|rust|ochre|orange|copper|sunset/i, 'Terracotta Orange'],
    [/charcoal|slate|grey|gray|silver/i, 'Charcoal Grey'],
    [/ivory|cream|beige|sand|alabaster|white/i, 'Ivory White'],
    [/obsidian|onyx|black|dark|shadow|night|moonlight/i, 'Obsidian Black']
  ];
  for (const [rx, label] of colorMap) {
    if (rx.test(hay) && !matches.includes(label)) {
      matches.push(label);
      if (matches.length === 2) break;
    }
  }
  return matches.length > 0 ? matches.join(' / ') : 'Multicolor Fine Art';
}

const FORECAST_TRACKER_PATH = path.join(SEO_ROOT, 'seo_keyword_forecast_tracker.json');
function loadCooldownProtectedProductUrls() {
  const set = new Set();
  if (!fs.existsSync(FORECAST_TRACKER_PATH)) return set;
  try {
    const d = JSON.parse(fs.readFileSync(FORECAST_TRACKER_PATH, 'utf8'));
    for (const k of d.keywords || d.targets || []) {
      const u = k.targetUrl || k.url;
      if (u && k.lastTitleChangeAt && (Date.now() - new Date(k.lastTitleChangeAt).getTime()) / 86400000 < 14) {
        set.add(u);
      }
    }
  } catch {}
  return set;
}

async function main() {
  console.log('=== Prints With Passion — 8. Daily Google Merchant Center (GMC 742631169) Free Listings CTR Optimizer ===');
  let state = { afterCursor: null, totalOptimized: 0 };
  if (fs.existsSync(STATE_PATH)) {
    try { state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch {}
  }

  const nodes = [];
  let cursor = state.afterCursor;
  for (let page = 0; page < 2; page++) {
    const data = await shopifyGraphQL(`
      query GetGmcBatch($cursor: String) {
        products(first: 50, after: $cursor, sortKey: CREATED_AT, reverse: true, query: "status:active") {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productType
            tags
            seo { title description }
            variants(first: 1) { nodes { price title } }
            colorMeta: metafield(namespace: "mm-google-shopping", key: "color") { value }
            materialMeta: metafield(namespace: "mm-google-shopping", key: "material") { value }
            sizeMeta: metafield(namespace: "mm-google-shopping", key: "size") { value }
            customLabel0: metafield(namespace: "mm-google-shopping", key: "custom_label_0") { value }
            customLabel1: metafield(namespace: "mm-google-shopping", key: "custom_label_1") { value }
            customLabel2: metafield(namespace: "mm-google-shopping", key: "custom_label_2") { value }
            customLabel3: metafield(namespace: "mm-google-shopping", key: "custom_label_3") { value }
            customLabel4: metafield(namespace: "mm-google-shopping", key: "custom_label_4") { value }
          }
        }
      }
    `, { cursor });
    const pageNodes = data?.products?.nodes || [];
    nodes.push(...pageNodes);
    if (!data?.products?.pageInfo?.hasNextPage) {
      cursor = null;
      break;
    }
    cursor = data.products.pageInfo.endCursor;
  }

  let optimizedToday = 0;
  let errorsCount = 0;
  const cooldownProtectedUrls = loadCooldownProtectedProductUrls();

  for (const p of nodes) {
    const priceNum = parseFloat(p.variants?.nodes?.[0]?.price || '34.99');
    const priceTier = priceNum < 35 ? 'Under £35 Studio Gift' : '£35-£65 Studio Hero Edition';
    const marginTier = HIGH_MARGIN_HERO_TYPES.has(p.productType) ? 'High-Margin Studio Hero' : 'Core Studio Edition';
    const unifiedLabel4 = `${priceTier} | ${marginTier}`;
    const matchSub = matchSubCollectionForGmc(p);
    const kwCluster = getKeywordClusterForSub(matchSub);
    const badgeCandidate = kwCluster?.modifiers?.gmcTitleBadge;
    const dimBadge = (badgeCandidate && badgeCandidate.length <= 36)
      ? badgeCandidate
      : (DIMENSION_BADGE_BY_TYPE[p.productType] || 'Custom Studio Edition');
    const kwModifier = kwCluster?.primaryKeyword || `${matchSub.themeTag.toLowerCase()} ${(p.productType || 'studio decor').toLowerCase()}`;
    const kwSlug = (kwCluster?.recommendedSlug || kwModifier).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const hasDimInSeoTitle = /\b(cm|mm|inch|xxl|xl|gsm|S–3XL|30×40|40×40|24×16|50×60)\b/i.test(p.seo?.title || '');
    const isCooldownLocked = cooldownProtectedUrls.has(`/products/${p.handle}`);
    const gmcColor = deriveColorFromProduct(p);
    const gmcMaterial = GMC_CLEAN_MATERIAL_BY_TYPE[p.productType] || 'Archival Fine-Art Cotton-Poly Blend';
    const gmcSize = (p.variants?.nodes?.[0]?.title && p.variants.nodes[0].title !== 'Default Title')
      ? p.variants.nodes[0].title
      : dimBadge;
    const gmcGpc = GMC_GPC_BY_TYPE[p.productType] || '500044';

    if (
      p.colorMeta?.value !== gmcColor ||
      p.materialMeta?.value !== gmcMaterial ||
      p.sizeMeta?.value !== gmcSize ||
      p.customLabel0?.value !== p.productType ||
      p.customLabel1?.value !== matchSub.handle ||
      p.customLabel2?.value !== matchSub.themeTag ||
      p.customLabel3?.value !== kwSlug ||
      p.customLabel4?.value !== unifiedLabel4 ||
      (!hasDimInSeoTitle && !isCooldownLocked)
    ) {
      const cleanArtName = p.title.replace(/\s+—\s+.*$/, '').trim();
      const maxArtLen = Math.max(12, 65 - dimBadge.length);
      const cleanStem = cleanArtName.length > maxArtLen
        ? cleanArtName.slice(0, maxArtLen).replace(/\s+\S*$/, '').trim()
        : cleanArtName;
      const seoTitle = `${cleanStem} (${dimBadge})`.slice(0, 68);
      const materialSpec = MATERIAL_SPEC_BY_TYPE[p.productType] || `${dimBadge} studio print`;
      const seoDesc = `${cleanArtName} (${kwModifier}): ${materialSpec}. Free Tracked UK & US Delivery.`.slice(0, 158);

      const updateRes = await shopifyGraphQL(`
        mutation OptGmc($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id }
            userErrors { field message }
          }
        }
      `, {
        input: {
          id: p.id,
          seo: {
            title: (hasDimInSeoTitle || isCooldownLocked) ? p.seo.title : seoTitle,
            description: (isCooldownLocked && p.seo?.description) ? p.seo.description : seoDesc
          },
          metafields: [
            { namespace: 'mm-google-shopping', key: 'color', type: 'single_line_text_field', value: gmcColor },
            { namespace: 'mm-google-shopping', key: 'material', type: 'single_line_text_field', value: gmcMaterial },
            { namespace: 'mm-google-shopping', key: 'size', type: 'single_line_text_field', value: gmcSize },
            { namespace: 'mm-google-shopping', key: 'condition', type: 'single_line_text_field', value: 'new' },
            { namespace: 'mm-google-shopping', key: 'age_group', type: 'single_line_text_field', value: 'adult' },
            { namespace: 'mm-google-shopping', key: 'gender', type: 'single_line_text_field', value: 'unisex' },
            { namespace: 'mm-google-shopping', key: 'custom_product', type: 'boolean', value: 'true' },
            { namespace: 'mm-google-shopping', key: 'google_product_category', type: 'single_line_text_field', value: gmcGpc },
            { namespace: 'mm-google-shopping', key: 'custom_label_0', type: 'single_line_text_field', value: p.productType || 'Studio Decor' },
            { namespace: 'mm-google-shopping', key: 'custom_label_1', type: 'single_line_text_field', value: matchSub.handle },
            { namespace: 'mm-google-shopping', key: 'custom_label_2', type: 'single_line_text_field', value: matchSub.themeTag },
            { namespace: 'mm-google-shopping', key: 'custom_label_3', type: 'single_line_text_field', value: kwSlug },
            { namespace: 'mm-google-shopping', key: 'custom_label_4', type: 'single_line_text_field', value: unifiedLabel4 }
          ]
        }
      });
      if (updateRes?.productUpdate?.userErrors?.length) {
        console.warn(`[GMC Optimizer Warning] Product ${p.id}:`, updateRes.productUpdate.userErrors);
        errorsCount++;
      } else {
        optimizedToday++;
      }
      const processedCount = optimizedToday + errorsCount;
      if (processedCount % 20 === 0 || processedCount === nodes.length) {
        console.log(`[GMC Optimizer Progress] Processed ${processedCount}/${nodes.length} products (Enriched: ${optimizedToday}, Errors: ${errorsCount})...`);
      }
      await new Promise(r => setTimeout(r, 50));
    }
  }

  state.afterCursor = cursor;
  state.totalOptimized = (state.totalOptimized || 0) + optimizedToday;
  state.lastRun = new Date().toISOString();
  writeFactoryFileSync('gmc_optimizer_state.json', JSON.stringify(state, null, 2));

  const statusStr = errorsCount === 0 ? '**PASS (0 Errors)**' : `**WARNING (${errorsCount} Errors)**`;
  const row = `| \`${state.lastRun}\` | \`${nodes.length}\` Active Products | \`${optimizedToday}\` Enriched (\`color\`, \`material\`, \`size\`, \`custom_label_0..4\`) | \`${state.totalOptimized}\` Total | ${statusStr} |\n`;
  appendFactoryFileSync('GMC_FREE_LISTINGS_OPTIMIZATION_LOG.md', row);

  console.log(`Scanned ${nodes.length} active products; optimized ${optimizedToday} for GMC 742631169 Free Listings CTR (cumulative: ${state.totalOptimized}).`);
}

main().catch(console.error);
