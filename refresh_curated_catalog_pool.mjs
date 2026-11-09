import fs from 'fs';

const authPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const CATALOG_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\curated_catalog.json';
const COUNTS_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\blog_product_link_counts.json';
const POOL_STATE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\catalog_pool_cursor_state.json';
const SUBCOLLECTIONS_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\phase2_40_subcollections.json';
const KEYWORD_QUEUE_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\transactional_keyword_queue.json';
const GRAPHQL_URL = 'https://admin.shopify.com/api/shopify/bpcprints';

const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const subsList = fs.existsSync(SUBCOLLECTIONS_PATH) ? JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8')) : [];
const keywordQueue = fs.existsSync(KEYWORD_QUEUE_PATH) ? JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8')) : { bySubCollection: {} };

const UNSAFE_OR_CLONE_HANDLE_REGEX = /(^lk\d+-|phoenix-marie|brandi-love|logan-paul|magic-johnson|kim-kardashian|kendal-jenner|elon-musk|dwayne-johnson|gordon-ramsay|margot-robbie|john-travolta|sandy-and-danny|jk-rowling|ant-man|dr-strange|draco-malfoy|eleven-stranger-things|galactus|green-lantern|hagrid|indiana-jones|jack-sparrow|master-chief|ron-weasley|snape|ultron|willy-wonka|wonder-woman|storm-trooper|c-c-3po|wookiee|peter-pan|beauty-and-the-beast|yamal-spain|giannis|follow-exact-style-to-produce|character-sheet|kevnef-photo|wowposters|image-alt-text|comfortable-fabric-will-keep-you-warm|-edition-(i|ii|iii|iv|v|vi)\b|-(ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi)-(xxl|xl|stretched|square|plush|memory|graphic))/i;

function isCleanBrandSafeProduct(handle = '', title = '') {
  if (!handle || handle.length < 8) return false;
  if (UNSAFE_OR_CLONE_HANDLE_REGEX.test(handle) || UNSAFE_OR_CLONE_HANDLE_REGEX.test(title)) return false;
  return true;
}

function matchSubCollectionAndKeyword(productType, title = '', handle = '', tags = []) {
  const byType = subsList.filter(s => s.productType === productType);
  const text = `${title} ${handle} ${(tags || []).join(' ')}`.toLowerCase();
  let matchedSub = byType.find(s => (tags || []).includes(s.themeTag));
  if (!matchedSub) {
    for (const s of byType) {
      const kws = s.themeTag.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
      if (kws.some(kw => text.includes(kw))) {
        matchedSub = s;
        break;
      }
    }
  }
  matchedSub = matchedSub || byType[0] || subsList[0] || { handle: 'desk-mats', themeTag: 'Abstract & Geometric' };
  const clusterList = keywordQueue?.bySubCollection?.[matchedSub.handle];
  const topCluster = Array.isArray(clusterList) ? clusterList[0] : clusterList;
  return {
    subCollectionHandle: matchedSub.handle,
    themeTag: matchedSub.themeTag,
    primaryKeyword: topCluster?.primaryKeyword || `${matchedSub.themeTag.toLowerCase()} ${productType.toLowerCase()}`,
    hardwareCompatibility: topCluster?.modifiers?.hardwareCompatibility || null
  };
}

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
  return json.data;
}

const PRODUCT_TYPES = [
  'Desk Mats',
  'Canvas Wall Art',
  'Cushion Covers',
  'Throw Blankets',
  'Bath Mats',
  'Graphic T-Shirts',
  'Hoodies'
];

async function main() {
  const catalog = fs.existsSync(CATALOG_PATH)
    ? JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
    : {};
  const counts = fs.existsSync(COUNTS_PATH)
    ? JSON.parse(fs.readFileSync(COUNTS_PATH, 'utf8'))
    : {};
  let poolState = { cursorsByType: {}, totalPruned: 0 };
  if (fs.existsSync(POOL_STATE_PATH)) {
    try { poolState = JSON.parse(fs.readFileSync(POOL_STATE_PATH, 'utf8')); } catch {}
  }

  // 1. Prune any legacy unsafe/IP/Roman-numeral/clone handles & normalize schema on existing catalog entries
  let pruned = 0;
  for (const [h, item] of Object.entries(catalog)) {
    if (!isCleanBrandSafeProduct(h, item.title)) {
      delete catalog[h];
      delete counts[h];
      pruned++;
      continue;
    }
    const canonType = item.productType || item.type || 'Desk Mats';
    const meta = matchSubCollectionAndKeyword(canonType, item.title, h, item.tags);
    catalog[h] = { ...item, type: canonType, productType: canonType, ...meta };
  }

  let added = 0;
  for (const pt of PRODUCT_TYPES) {
    const cursor = poolState.cursorsByType?.[pt] || null;
    const data = await shopifyGraphQL(`
      query GetByType($q: String!, $cursor: String) {
        products(first: 40, after: $cursor, sortKey: CREATED_AT, reverse: false, query: $q) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productType
            tags
            featuredImage { url altText }
            variants(first: 1) {
              nodes { price compareAtPrice }
            }
          }
        }
      }
    `, { q: `product_type:'${pt}' AND status:active`, cursor });

    const nodes = data?.products?.nodes || [];
    for (const p of nodes) {
      if (!p.featuredImage?.url) continue;
      if (!isCleanBrandSafeProduct(p.handle, p.title)) continue;
      if (!catalog[p.handle]) added++;
      const meta = matchSubCollectionAndKeyword(p.productType, p.title, p.handle, p.tags || []);
      catalog[p.handle] = {
        id: p.id,
        handle: p.handle,
        title: p.title,
        type: p.productType,
        productType: p.productType,
        tags: p.tags || [],
        ...meta,
        price: p.variants?.nodes?.[0]?.price || '34.99',
        compareAtPrice: p.variants?.nodes?.[0]?.compareAtPrice || '44.99',
        imgUrl: p.featuredImage.url,
        altText: p.featuredImage.altText || `${p.title} — Prints With Passion Studio`
      };
      if (counts[p.handle] === undefined) {
        counts[p.handle] = 0;
      }
    }
    poolState.cursorsByType = poolState.cursorsByType || {};
    poolState.cursorsByType[pt] = data?.products?.pageInfo?.hasNextPage ? data.products.pageInfo.endCursor : null;
  }

  // Remove orphaned handles in counts that are not in clean catalog
  for (const h of Object.keys(counts)) {
    if (!catalog[h]) delete counts[h];
  }
  for (const h of Object.keys(catalog)) {
    if (counts[h] === undefined) counts[h] = 0;
  }

  poolState.totalPruned = (poolState.totalPruned || 0) + pruned;
  poolState.lastRun = new Date().toISOString();
  fs.writeFileSync(POOL_STATE_PATH, JSON.stringify(poolState, null, 2), 'utf8');
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  fs.writeFileSync(COUNTS_PATH, JSON.stringify(counts, null, 2), 'utf8');
  console.log(`Refreshed curated_catalog.json: +${added} new active products added, -${pruned} unsafe/clone handles pruned (total clean pool: ${Object.keys(catalog).length} products across 7 substrates).`);
}

main().catch(console.error);
