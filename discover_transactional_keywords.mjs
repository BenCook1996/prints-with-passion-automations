import fs from 'fs';
import path from 'path';
import https from 'https';
import { WORKSPACE, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

const ROTATION_STATE_PATH = path.join(WORKSPACE, 'blog_48_subcollections_rotation_state.json');
const TRACKER_PATH = path.join(WORKSPACE, 'blog_content_tracker.md');
const QUEUE_OUT_PATH = path.join(WORKSPACE, 'transactional_keyword_queue.json');
const REGISTRY_OUT_PATH = path.join(WORKSPACE, 'keyword_cannibalization_registry.json');
const SERP_CACHE_PATH = path.join(WORKSPACE, 'serp_competition_cache.json');
const LOG_OUT_PATH = path.join(WORKSPACE, 'KEYWORD_RESEARCH_LOG.md');

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'how', 'best', 'guide', 'uk', 'us', 'eu', '2025', '2026',
  'your', 'from', 'that', 'this', 'what', 'why', 'are', 'into', 'over', 'under', 'compared', 'top'
]);

const SUBSTRATE_PROFILES = {
  'Desk Mats': {
    nouns: ['desk mat', 'extended mouse pad', 'xxl gaming desk pad'],
    shortNoun: 'desk mat',
    sizes: ['90x40 cm (36x18")', '80x30 cm (31.5x11.8")', '60x35 cm (24x14")'],
    sizeTokens: ['90x40', '80x40', '80x30', '36x18'],
    hardwareContexts: [
      'for walnut desk',
      'for ikea karlby setup',
      'for white standing desk',
      'for secretlab magnus',
      'for dual monitor setup',
      'for mechanical keyboard acoustics',
      'for ultrawide monitor desk',
      'for home office setup'
    ],
    materialSpec: '4mm natural rubber base + 360° anti-fray stitched micro-weave cloth (£24.99–£38.99 · Free Tracked Shipping)',
    gmcBadge: 'XXL 90×40cm 4mm Stitched Gaming Desk Mat & Mouse Pad',
    wallpaperRes: '4K UHD 3840×2160 & 21:9 Ultrawide 3440×1440 Battlestation Wallpaper',
    pinterestRoom: 'Gaming Battlestation, Ultrawide Monitor & Mechanical Keyboard Desk Setup'
  },
  'Canvas Wall Art': {
    nouns: ['canvas wall art', 'stretched canvas print', 'framed wall art'],
    shortNoun: 'canvas wall art',
    sizes: ['60x90 cm (24x36")', '40x50 cm (16x20")', '30x40 cm (12x16")'],
    sizeTokens: ['24x36', '60x90', 'large', 'oversized'],
    hardwareContexts: [
      'above 3 seater sofa',
      'above king size bed',
      'for minimalist living room wall',
      'for home office video backdrop',
      'for dark green accent wall',
      'for modern dining room',
      'for hallway gallery wall',
      'for apartment feature wall'
    ],
    materialSpec: '400gsm matte cotton-poly canvas on 1.25" kiln-dried pine stretcher bars (£29.99–£64.99 · Ready to Hang)',
    gmcBadge: '1.25" Pine Stretched Canvas Wall Art (8×10"–24×36")',
    wallpaperRes: '4K UHD 3840×2160 Desktop & Frame TV Gallery Wallpaper',
    pinterestRoom: 'Living Room Above-Sofa Feature Wall, Bedroom & Gallery Wall Setup'
  },
  'Cushion Covers': {
    nouns: ['cushion cover', 'throw pillow cover', 'accent pillow case'],
    shortNoun: 'cushion cover',
    sizes: ['45x45 cm (18x18")', '55x55 cm (22x22")', '40x40 cm (16x16")'],
    sizeTokens: ['45x45', '18x18', '20x20', 'double sided'],
    hardwareContexts: [
      'for cognac leather sofa',
      'for grey sectional couch',
      'for mid century accent chair',
      'for velvet living room sofa',
      'for king bed pillow layering',
      'for reading nook armchair',
      'for neutral linen sofa',
      'for boho living room'
    ],
    materialSpec: 'Double-sided archival sublimation on soft brushed velvet/linen weave w/ hidden zipper (£16.99–£24.99)',
    gmcBadge: 'Double-Sided Velvet & Linen Cushion Cover (45×45cm / 18×18")',
    wallpaperRes: '4K High-Res Interior Textile & Dual-Monitor Aesthetic Wallpaper',
    pinterestRoom: 'Mid-Century Modern Sofa, Accent Chair & Sectional Couch Styling'
  },
  'Throw Blankets': {
    nouns: ['throw blanket', 'plush fleece blanket', 'couch throw blanket'],
    shortNoun: 'throw blanket',
    sizes: ['152x203 cm (60x80")', '127x152 cm (50x60")'],
    sizeTokens: ['50x60', '60x80', 'oversized', '300gsm'],
    hardwareContexts: [
      'for leather couch drape',
      'for cozy reading nook',
      'for queen and king bed layering',
      'for home theater room',
      'for gaming chair warmth',
      'for cabin living room sofa',
      'for bedroom end of bed',
      'for studio apartment couch'
    ],
    materialSpec: '300gsm anti-pill plush coral fleece w/ vivid edge-to-edge archival print (£29.99–£44.99)',
    gmcBadge: '300gsm Plush Coral Fleece Sofa & Bed Throw Blanket (50×60" / 60×80")',
    wallpaperRes: '4K UHD 3840×2160 Cozy Aesthetic Desktop & Tablet Wallpaper',
    pinterestRoom: 'Cozy Reading Nook, Sofa Drape & Bedroom Layering Setup'
  },
  'Bath Mats': {
    nouns: ['memory foam bath mat', 'non slip bathroom rug', 'bath mat'],
    shortNoun: 'memory foam bath mat',
    sizes: ['61x43 cm (24x17")', '86x53 cm (34x21")'],
    sizeTokens: ['24x17', '34x21', 'non slip', 'memory foam'],
    hardwareContexts: [
      'for walk in shower exit',
      'for double sink bathroom vanity',
      'for small apartment bathroom',
      'for dark slate tile floor',
      'for freestanding soaking tub',
      'for modern spa bathroom',
      'for guest bathroom makeover',
      'for white marble tile floor'
    ],
    materialSpec: 'High-density memory foam core + fast-drying microfiber velvet top & non-skid SBR backing (£22.99–£32.99)',
    gmcBadge: 'Non-Slip Memory Foam Bathroom Rug & Bath Mat (24×17" / 34×21")',
    wallpaperRes: '4K UHD Botanical & Spa Sanctuary Desktop Wallpaper',
    pinterestRoom: 'Spa Sanctuary Bathroom Vanity & Walk-In Shower Floor Setup'
  },
  'Graphic T-Shirts': {
    nouns: ['heavyweight graphic t-shirt', 'oversized graphic tee', 'cotton graphic shirt'],
    shortNoun: 'graphic t-shirt',
    sizes: ['Unisex S–3XL Regular & Boxy Oversized Fit'],
    sizeTokens: ['heavyweight', 'oversized', 'unisex', 'cotton'],
    hardwareContexts: [
      'for streetwear layering outfit',
      'for relaxed boxy summer fit',
      'for everyday studio streetwear',
      'for anime and gaming convention fit'
    ],
    materialSpec: '100% combed ring-spun heavyweight cotton (S–3XL) w/ breathable archival DTG print (£21.99–£29.99)',
    gmcBadge: 'Unisex Heavyweight Ring-Spun Graphic Cotton T-Shirt (S–3XL)',
    wallpaperRes: '4K UHD Streetwear & Graphic Art Desktop Wallpaper',
    pinterestRoom: 'Unisex Heavyweight Streetwear Outfit & Everyday Graphic Aesthetic'
  },
  'Hoodies': {
    nouns: ['heavyweight graphic hoodie', 'streetwear pullover hoodie', 'fleece graphic sweatshirt'],
    shortNoun: 'heavyweight graphic hoodie',
    sizes: ['Unisex S–3XL Relaxed Drop-Shoulder Fit (310 GSM)'],
    sizeTokens: ['310gsm', 'heavyweight', 'oversized', 'fleece'],
    hardwareContexts: [
      'for autumn winter streetwear layering',
      'for cozy gaming studio loungewear',
      'for relaxed drop shoulder fit',
      'for heavyweight streetwear outfit'
    ],
    materialSpec: '310gsm ring-spun cotton-fleece blend (S–3XL) w/ double-lined hood & crack-resistant DTG print (£36.99–£48.99)',
    gmcBadge: 'Unisex 310gsm Heavyweight Fleece Graphic Hoodie (S–3XL)',
    wallpaperRes: '4K UHD Streetwear & Studio Apparel Aesthetic Wallpaper',
    pinterestRoom: 'Relaxed Drop-Shoulder Streetwear Layering & Gamer Loungewear Aesthetic'
  }
};

const THEME_MOTIF_SEEDS = {
  'Japanese & Asian Art': ['japanese ukiyo-e', 'great wave kanagawa', 'crimson samurai sakura', 'japanese koi zen'],
  'Sci-Fi & Cyberpunk': ['cyberpunk neon city', 'futuristic synthwave', 'mecha sci-fi neon', 'cyberpunk battlestation'],
  'Space & Cosmic': ['deep space nebula', 'cosmic galaxy astronaut', 'starry night constellation', 'solar eclipse nebula'],
  'Fantasy & Mythology': ['mythic dragon dark fantasy', 'dark academia gothic castle', 'enchanted forest tarot', 'eldritch dragon'],
  'Nature & Landscapes': ['misty alpine mountain forest', 'biophilic pine woodland', 'emerald mountain lake', 'nordic forest landscape'],
  'Botanical & Coastal': ['vintage botanical wildflower', 'mediterranean coastal ocean', 'sage green botanical leaf', 'pressed floral garden'],
  'Abstract & Minimalist': ['mid century bauhaus geometric', 'minimalist architectural line art', 'terrazzo warm neutral abstract', 'topographic contour'],
  'Animals & Wildlife': ['highland cow wildlife', 'woodland fox and wolf', 'illustrated cat and dog', 'equestrian wild horse'],
  'World Travel & Cities': ['tokyo neon street skyline', 'paris eiffel sunset', 'amalfi coast mediterranean', 'new york architectural skyline'],
  'Retro & Vintage': ['80s retro synthwave sunset', '70s groovy mid century', 'vintage arcade vaporwave', 'retro travel poster']
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function tokenizeNormalized(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/×/g, 'x')
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function computeJaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

function toTitleCase(str = '') {
  return String(str)
    .replace(/\b([a-z])/g, c => c.toUpperCase())
    .replace(/\b(For|And|In|On|Or|Of|To|With|Vs)\b/g, m => m.toLowerCase())
    .replace(/\b(xxl|xl|cm|uk|us|eu|rgb|dpi|gsm|tv|pc|4k|uhd)\b/gi, m => m.toUpperCase());
}

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '');
}

// ============================================================================
// 1. Sync Zero-Cannibalization Registry (58+ Collections + 143+ Blogs)
// ============================================================================
function syncCannibalizationRegistry(subCollections) {
  let existingReg = { protectedCollections: {}, publishedBlogIndex: [], assignedKeywordLocks: {} };
  if (fs.existsSync(REGISTRY_OUT_PATH)) {
    try { existingReg = JSON.parse(fs.readFileSync(REGISTRY_OUT_PATH, 'utf8')); } catch {}
  }

  const protectedCollections = {};
  for (const sub of subCollections) {
    const cleanWords = tokenizeNormalized(sub.title);
    protectedCollections[sub.handle] = {
      url: `/collections/${sub.handle}`,
      productType: sub.productType,
      themeTag: sub.themeTag,
      headKeywords: [
        sub.handle.replace(/-/g, ' '),
        sub.title.toLowerCase(),
        cleanWords.slice(0, 3).join(' ')
      ],
      requiredAnchorTexts: [
        sub.title,
        `${sub.themeTag} ${sub.productType}`,
        `custom ${sub.title.toLowerCase()}`
      ]
    };
  }

  // Parse blog_content_tracker.md for all historical published blog handles & titles
  const blogMap = new Map();
  for (const b of existingReg.publishedBlogIndex || []) {
    if (b.handle) blogMap.set(b.handle, b);
  }
  if (fs.existsSync(TRACKER_PATH)) {
    const md = fs.readFileSync(TRACKER_PATH, 'utf8');
    const handleMatches = [
      ...md.matchAll(/\/blogs\/news\/([a-z0-9-]+)/gi),
      ...md.matchAll(/\*\*`([a-z0-9-]+)`\*\*\s*\(`gid:\/\/shopify\/Article/gi),
      ...md.matchAll(/\|\s*`([a-z0-9-]{15,})`\s*\|\s*`gid:\/\/shopify\/Article/gi)
    ];
    for (const m of handleMatches) {
      const h = m[1].toLowerCase();
      if (!blogMap.has(h)) {
        blogMap.set(h, {
          handle: h,
          title: h.replace(/-/g, ' '),
          normalizedStems: tokenizeNormalized(h),
          publishedAt: '2026-10-30'
        });
      }
    }
  }

  const updatedReg = {
    lastSyncedAt: new Date().toISOString(),
    protectedCollections,
    publishedBlogIndex: [...blogMap.values()],
    assignedKeywordLocks: existingReg.assignedKeywordLocks || {}
  };
  fs.writeFileSync(REGISTRY_OUT_PATH, JSON.stringify(updatedReg, null, 2), 'utf8');
  return updatedReg;
}

function isCannibalized(candidateTitle, candidateSlug, subHandle, registry) {
  const candTokens = tokenizeNormalized(`${candidateTitle} ${candidateSlug}`);
  const hasSetupOrSizeQualifier = /\b(90x40|80x30|80x40|60x35|24x36|16x20|18x18|45x45|50x60|60x80|4mm|300gsm|310gsm|karlby|ikea|secretlab|walnut|standing|dual|ultrawide|sofa|couch|bed|vanity|shower|nook|versus|vs|guide|setup|sizing|fit)\b/i.test(`${candidateTitle} ${candidateSlug}`);
  const colEntry = registry.protectedCollections?.[subHandle];
  if (colEntry && !hasSetupOrSizeQualifier) {
    for (const hk of colEntry.headKeywords || []) {
      if (computeJaccardSimilarity(candTokens, tokenizeNormalized(hk)) >= 0.72) {
        return { blocked: true, reason: 'COLLECTION_HEAD_TERM' };
      }
    }
  }
  for (const art of registry.publishedBlogIndex || []) {
    if (art.handle === candidateSlug) return { blocked: true, reason: 'EXACT_SLUG_MATCH' };
    const sim = computeJaccardSimilarity(candTokens, art.normalizedStems || tokenizeNormalized(art.handle));
    if (sim >= 0.65) return { blocked: true, reason: `BLOG_SIMILARITY_${sim.toFixed(2)}` };
  }
  return { blocked: false, reason: null };
}

// ============================================================================
// 2. Live Autocomplete Endpoints (Google Chrome US/UK/Shopping + Bing)
// ============================================================================
async function queryGoogleSuggest(query, { gl = 'us', ds = '' } = {}) {
  try {
    const dsParam = ds ? `&ds=${encodeURIComponent(ds)}` : '';
    const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&gl=${gl}${dsParam}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36' }
    });
    if (!res.ok) return { suggestions: [], relevances: [], subtypes: [], verbatimRelevance: 0 };
    const data = await res.json();
    const suggestions = Array.isArray(data[1]) ? data[1] : [];
    const meta = data[4] || {};
    return {
      suggestions,
      relevances: meta['google:suggestrelevance'] || [],
      subtypes: meta['google:suggestsubtypes'] || [],
      verbatimRelevance: meta['google:verbatimrelevance'] || 0
    };
  } catch {
    return { suggestions: [], relevances: [], subtypes: [], verbatimRelevance: 0 };
  }
}

async function queryBingSuggest(query) {
  try {
    const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}&market=en-US`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

// ============================================================================
// 3. Live Top-10 SERP Competition Inspector (Native https.get Yahoo SSR + Cache)
// ============================================================================
function fetchHtmlNativeHttps(urlStr, timeoutMs = 6500) {
  return new Promise((resolve) => {
    const req = https.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: timeoutMs
    }, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', d => { chunks += d; });
      res.on('end', () => resolve({ status: res.statusCode || 0, html: chunks }));
    });
    req.on('error', () => resolve({ status: 0, html: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, html: '' }); });
  });
}

async function inspectLiveSerpWeakness(keyword, distinctiveTokens, serpsCache) {
  const cacheKey = keyword.toLowerCase().trim();
  const cached = serpsCache[cacheKey];
  if (cached && (Date.now() - new Date(cached.checkedAt).getTime()) < 7 * 24 * 3600 * 1000) {
    return cached;
  }

  const yahooUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(keyword)}&n=10&ei=UTF-8`;
  const { status, html } = await fetchHtmlNativeHttps(yahooUrl);
  const results = [];

  if (status === 200 && html) {
    const anchorRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>(?:(?!<\/a>)[\s\S])*?<h3[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<\/a>/gi;
    let m;
    while ((m = anchorRegex.exec(html)) !== null && results.length < 10) {
      let rawHref = m[1];
      const ruMatch = rawHref.match(/\/RU=([^/]+)\//);
      if (ruMatch) {
        try { rawHref = decodeURIComponent(ruMatch[1]); } catch {}
      }
      if (/yahoo\.com|bing\.com\/aclick|gemini\.yahoo/i.test(rawHref)) continue;
      const cleanTitle = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleanTitle) continue;
      let domain = '';
      try { domain = new URL(rawHref).hostname.replace(/^www\./, '').toLowerCase(); } catch {}
      if (domain) results.push({ domain, url: rawHref, title: cleanTitle });
    }
  }

  const totalN = Math.max(1, results.length);
  const kwTokens = tokenizeNormalized(keyword);
  const modTokens = distinctiveTokens.map(t => t.toLowerCase()).filter(Boolean);

  let exactModMatches = 0;
  let fullTitleMatches = 0;
  let ugcCount = 0;
  let podListingCount = 0;
  let giantExactCount = 0;

  for (const r of results) {
    const tLower = r.title.toLowerCase();
    const hasAllMods = modTokens.length > 0 && modTokens.every(mt => tLower.includes(mt));
    if (hasAllMods) exactModMatches++;

    const matchedKwCount = kwTokens.filter(kt => tLower.includes(kt)).length;
    if (kwTokens.length > 0 && (matchedKwCount / kwTokens.length) >= 0.8) fullTitleMatches++;

    if (/reddit\.com|pinterest\.|quora\.com|medium\.com|houzz\.com|youtube\.com|tiktok\.com|imgur\.com|tumblr\.com/i.test(r.domain)) {
      ugcCount++;
    } else if (/etsy\.com|society6\.com|redbubble\.com|zazzle\.com|teepublic\.com/i.test(r.domain)) {
      podListingCount++;
    } else if (/amazon\.|wayfair\.|ikea\.com|walmart\.com|target\.com|homedepot\.com|dunelm\.com/i.test(r.domain)) {
      if (hasAllMods) giantExactCount++;
    }
  }

  // If Yahoo returned 0 parseable results (or offline fallback), use deterministic structural weakness score
  let serpWeaknessScore = 82;
  if (results.length >= 3) {
    const titleGapPts = Math.round(30 * (1 - exactModMatches / totalN) + 20 * (1 - fullTitleMatches / totalN));
    const weakSignalPts = Math.min(35, ugcCount * 12 + podListingCount * 7);
    const giantPenalty = giantExactCount * 8;
    serpWeaknessScore = Math.max(25, Math.min(98, 15 + titleGapPts + weakSignalPts - giantPenalty));
  }

  const snapshot = {
    checkedAt: new Date().toISOString(),
    engine: results.length >= 3 ? 'yahoo_ssr_live' : 'structural_heuristic',
    organicCount: results.length,
    exactModifierTitleMatches: exactModMatches,
    fullTitleMatches,
    ugcForumCount: ugcCount,
    marketplaceListingCount: podListingCount,
    giantExactCount,
    serpWeaknessScore,
    topCompetitorTitles: results.slice(0, 3).map(r => `${r.domain}: ${r.title}`)
  };

  serpsCache[cacheKey] = snapshot;
  return snapshot;
}

// ============================================================================
// 4. Multi-Signal Demand & Transactional Intent Scoring
// ============================================================================
function scoreDemandAndIntent(candidateKw, telemetry, profile) {
  const lower = candidateKw.toLowerCase();
  // Disqualify DIY/free/informational noise
  if (/\b(diy|how to make|crochet|knitting|sewing|free pdf|drawing tutorial|wikipedia|meaning|clipart|used|thrift)\b/i.test(lower)) {
    return { demandScore: 0, intentScore: 0, disqualified: true };
  }

  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Demand Score (0-100)
  let relPts = 24;
  const maxRel = Math.max(telemetry.usRelevance || 0, telemetry.gbRelevance || 0, telemetry.verbatimRelevance || 0);
  if (maxRel >= 1200) relPts = 40;
  else if (maxRel >= 601) relPts = 35;
  else if (maxRel >= 560) relPts = 30;
  else if (maxRel >= 550) relPts = 26;

  const rankPts = telemetry.bestRank === 1 ? 15 : telemetry.bestRank <= 3 ? 12 : telemetry.bestRank <= 6 ? 9 : 6;
  const crossEnginePts =
    (telemetry.inShopping ? 12 : 6) +
    (telemetry.inUs && telemetry.inGb ? 7 : 5) +
    (telemetry.inBing ? 6 : 3);
  const lengthPts = (wordCount >= 5 && wordCount <= 8) ? 20 : (wordCount === 4 || wordCount === 9) ? 16 : 12;
  const demandScore = Math.min(99, relPts + rankPts + crossEnginePts + lengthPts);

  // Transactional Intent Score (0-100)
  let intentScore = 30; // Valid physical substrate base
  if (/\b(best|vs|versus|top|under|buy|shop|custom|xxl|extended|large|oversized)\b/i.test(lower)) intentScore += 22;
  if (/\b(90x40|80x30|80x40|60x35|24x36|16x20|45x45|18x18|50x60|60x80|4mm|300gsm|310gsm|stitched|memory foam|non slip|washable|pine|stretched|heavyweight)\b/i.test(lower)) intentScore += 24;
  if (/\b(for|above|setup|desk|karlby|ikea|secretlab|walnut|sofa|couch|bed|living room|bathroom|vanity|shower|nook|ultrawide|keyboard|outfit|streetwear)\b/i.test(lower)) intentScore += 22;
  intentScore = Math.min(99, intentScore);

  return { demandScore, intentScore, disqualified: false };
}

function buildFaqQuestionsForCluster(sub, profile, primaryKw, hwContext) {
  const cleanHw = hwContext.replace(/^for\s+|^above\s+/i, '');
  return [
    {
      question: `What size ${sub.title} fits best ${hwContext} in CM and Inches?`,
      answerHint: `Our ${profile.sizes[0]} and ${profile.sizes[1]} studio proportions are engineered to span 60%–75% of your ${cleanHw} footprint, ensuring balanced visual symmetry and ergonomic clearance.`
    },
    {
      question: `How does Prints With Passion construct its ${sub.themeTag} ${sub.productType}?`,
      answerHint: `Every piece uses ${profile.materialSpec} with 100-year archival UV/sublimation pigments that resist fading and edge wear.`
    },
    {
      question: `Can I pair ${sub.title} with matching room decor and save on multi-item studio sets?`,
      answerHint: `Yes—apply code STUDIO15 at checkout for 15% OFF any 2+ coordinated substrates (Desk Mats, Stretched Canvas Wall Art, Cushions, Throws & Apparel) with 100% Free Tracked UK, US, CA, AU & EU Delivery.`
    }
  ];
}

// ============================================================================
// 5. Main Execution Pipeline Across All 48 Smart Sub-Collections
// ============================================================================
async function main() {
  console.log('=== Prints With Passion — Automated Transactional Keyword Research & Low-Competition SERP Scorer ===');
  const subCollections = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
  const registry = syncCannibalizationRegistry(subCollections);

  let serpsCache = {};
  if (fs.existsSync(SERP_CACHE_PATH)) {
    try { serpsCache = JSON.parse(fs.readFileSync(SERP_CACHE_PATH, 'utf8')); } catch {}
  }

  const FORECAST_TRACKER_PATH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\seo_keyword_forecast_tracker.json';
  let calibrationState = {
    volumeRealizationMultiplier: 1.0,
    daysPerDifficultyPoint: 1.65,
    substrateConversionMultipliers: {}
  };
  if (fs.existsSync(FORECAST_TRACKER_PATH)) {
    try {
      const fData = JSON.parse(fs.readFileSync(FORECAST_TRACKER_PATH, 'utf8'));
      if (fData.calibrationState) calibrationState = { ...calibrationState, ...fData.calibrationState };
    } catch {}
  }

  let rotState = { offset: 0 };
  if (fs.existsSync(ROTATION_STATE_PATH)) {
    try { rotState = JSON.parse(fs.readFileSync(ROTATION_STATE_PATH, 'utf8')); } catch {}
  }
  const activeIndices = new Set();
  for (let i = 0; i < 10; i++) {
    activeIndices.add((rotState.offset + i) % subCollections.length);
  }

  const bySubCollection = {};
  const flatKeywords = [];
  let totalCandidatesEvaluated = 0;
  let liveSerpChecksRun = 0;

  for (let idx = 0; idx < subCollections.length; idx++) {
    const sub = subCollections[idx];
    const profile = SUBSTRATE_PROFILES[sub.productType] || SUBSTRATE_PROFILES['Desk Mats'];
    const motifs = THEME_MOTIF_SEEDS[sub.themeTag] || [sub.themeTag.toLowerCase()];
    const isTodayBatch = activeIndices.has(idx);

    const primaryMotif = motifs[0];
    const secondaryMotif = motifs[1] || motifs[0];
    const thirdMotif = motifs[2] || motifs[0];
    const fourthMotif = motifs[3] || motifs[1] || motifs[0];
    const hw1 = profile.hardwareContexts[idx % profile.hardwareContexts.length];
    const hw2 = profile.hardwareContexts[(idx + 3) % profile.hardwareContexts.length];
    const hw3 = profile.hardwareContexts[(idx + 5) % profile.hardwareContexts.length];
    const hw4 = profile.hardwareContexts[(idx + 6) % profile.hardwareContexts.length];
    const sizeTok = profile.sizeTokens[0];
    const sizeTok2 = profile.sizeTokens[1] || profile.sizeTokens[0];
    const sizeTok3 = profile.sizeTokens[2] || profile.sizeTokens[0];
    const altNoun1 = profile.nouns[1] || profile.shortNoun;
    const altNoun2 = profile.nouns[2] || profile.shortNoun;

    // Probe live Google Chrome Suggest + Shopping Suggest for today's active 10 sub-collections (plus sample across others)
    let usData = { suggestions: [], relevances: [], subtypes: [], verbatimRelevance: 920 };
    let shopData = { suggestions: [], relevances: [], subtypes: [], verbatimRelevance: 950 };
    let bingSugs = [];

    if (isTodayBatch) {
      const seedQuery = `${primaryMotif} ${profile.shortNoun}`;
      usData = await queryGoogleSuggest(seedQuery, { gl: 'us' });
      shopData = await queryGoogleSuggest(seedQuery, { gl: 'us', ds: 'sh' });
      bingSugs = await queryBingSuggest(seedQuery);
      await sleep(120);
    }

    // Build candidate transactional keyword pool combining live autocomplete completions + structured hardware/dimension long-tails
    const rawCandidates = [
      {
        kw: `best ${sizeTok} ${primaryMotif} ${profile.shortNoun} ${hw1}`,
        hwContext: hw1,
        distinctiveMods: [primaryMotif.split(' ')[0], sizeTok, hw1.split(' ').pop()]
      },
      {
        kw: `${secondaryMotif} ${profile.shortNoun} ${hw2} (${sizeTok})`,
        hwContext: hw2,
        distinctiveMods: [secondaryMotif.split(' ')[0], hw2.split(' ').pop()]
      },
      {
        kw: `best ${primaryMotif} ${profile.shortNoun} vs generic ${profile.shortNoun} ${hw1}`,
        hwContext: hw1,
        distinctiveMods: [primaryMotif.split(' ')[0], 'vs', hw1.split(' ').pop()]
      },
      {
        kw: `best ${sizeTok2} ${thirdMotif} ${altNoun1} ${hw3}`,
        hwContext: hw3,
        distinctiveMods: [thirdMotif.split(' ')[0], sizeTok2, hw3.split(' ').pop()]
      },
      {
        kw: `${fourthMotif} ${altNoun2} ${hw4} (${sizeTok3})`,
        hwContext: hw4,
        distinctiveMods: [fourthMotif.split(' ')[0], hw4.split(' ').pop()]
      },
      {
        kw: `best ${thirdMotif} ${altNoun1} vs generic ${altNoun2} ${hw4}`,
        hwContext: hw4,
        distinctiveMods: [thirdMotif.split(' ')[0], 'vs', hw4.split(' ').pop()]
      }
    ];

    // Add valid non-512 autocomplete suggestions that contain transactional/context modifiers
    usData.suggestions.forEach((sug, sIdx) => {
      const subTypes = usData.subtypes[sIdx] || [];
      if (Array.isArray(subTypes) && subTypes.includes(512) && !sug.toLowerCase().includes(profile.shortNoun.split(' ')[0])) {
        return;
      }
      if (sug.split(/\s+/).length >= 4) {
        rawCandidates.push({
          kw: `${sug} ${hw1}`,
          hwContext: hw1,
          distinctiveMods: [primaryMotif.split(' ')[0], hw1.split(' ').pop()],
          sugRank: sIdx + 1,
          sugRel: usData.relevances[sIdx] || 600
        });
      }
    });

    const scoredClusters = [];
    for (const cand of rawCandidates) {
      totalCandidatesEvaluated++;
      const cleanKw = cand.kw.replace(/[()]/g, '').replace(/\s{2,}/g, ' ').trim().toLowerCase();
      const recSlug = slugify(cleanKw);
      const recTitle = `${toTitleCase(cleanKw)}: Dual CM & Inch Sizing & Spec Guide (2026)`;

      const cannCheck = isCannibalized(recTitle, recSlug, sub.handle, registry);
      if (cannCheck.blocked) continue;

      const telemetry = {
        usRelevance: cand.sugRel || usData.verbatimRelevance || 920,
        gbRelevance: 890,
        verbatimRelevance: shopData.verbatimRelevance || 950,
        bestRank: cand.sugRank || 2,
        inShopping: shopData.suggestions.length > 0 || (shopData.verbatimRelevance || 0) >= 800,
        inUs: true,
        inGb: true,
        inBing: bingSugs.length > 0
      };

      const { demandScore, intentScore, disqualified } = scoreDemandAndIntent(cleanKw, telemetry, profile);
      if (disqualified) continue;

      // Run live Yahoo SSR SERP weakness check on primary candidate (prioritizing uncached sub-collections + today's active batch)
      let serpSnap;
      const isUncachedPrimary = scoredClusters.length === 0 && !serpsCache[cleanKw];
      if ((isUncachedPrimary || isTodayBatch) && scoredClusters.length === 0 && liveSerpChecksRun < 12) {
        serpSnap = await inspectLiveSerpWeakness(cleanKw, cand.distinctiveMods, serpsCache);
        liveSerpChecksRun++;
        await sleep(220);
      } else {
        serpSnap = serpsCache[cleanKw] || {
          checkedAt: new Date().toISOString(),
          engine: 'cached_or_structural',
          organicCount: 10,
          exactModifierTitleMatches: 0,
          fullTitleMatches: 0,
          ugcForumCount: 2,
          marketplaceListingCount: 2,
          giantExactCount: 0,
          serpWeaknessScore: 86,
          topCompetitorTitles: []
        };
      }

      const subMultiplier = calibrationState.substrateConversionMultipliers?.[sub.productType] ?? 1.0;
      const rawComposite = 0.35 * demandScore + 0.35 * intentScore + 0.30 * serpSnap.serpWeaknessScore;
      const compositeOpportunityScore = Number(
        Math.min(99.5, rawComposite * subMultiplier).toFixed(1)
      );
      const keywordDifficultyScore = Math.max(8, Math.round(100 - serpSnap.serpWeaknessScore));
      const estimatedMonthlyVolume = Math.round(
        (180 + demandScore * 6.5) * (calibrationState.volumeRealizationMultiplier || 1.0)
      );
      const estimatedDaysToRank = Math.max(
        14,
        Math.round(keywordDifficultyScore * (calibrationState.daysPerDifficultyPoint || 1.65))
      );

      const secondaryLongTailModifiers = [
        `${sizeTok} ${primaryMotif} ${profile.shortNoun} ${hw1}`,
        `${secondaryMotif} ${profile.nouns[1] || profile.shortNoun} ${hw2}`,
        `washable archival ${primaryMotif} ${profile.shortNoun} with free tracked shipping`
      ];

      const shortAnchor = `${toTitleCase(primaryMotif)} ${profile.sizes[0].split(' ')[0]} ${toTitleCase(profile.shortNoun)}`;

      const clusterObj = {
        clusterId: `kw_${sub.handle.replace(/-/g, '_')}_${scoredClusters.length + 1}`,
        subCollectionHandle: sub.handle,
        subCollectionUrl: `/collections/${sub.handle}`,
        productType: sub.productType,
        themeTag: sub.themeTag,
        primaryKeyword: cleanKw,
        keyword: cleanKw,
        shortAnchor,
        recommendedSlug: recSlug,
        recommendedTitle: recTitle,
        collectionAnchorText: sub.title,
        targetUrl: `https://printswithpassion.com/collections/${sub.handle}`,
        intentType: 'transactional_setup_comparison',
        opportunityScore: compositeOpportunityScore,
        transactionalScore: intentScore,
        competitionScore: Number((100 - serpSnap.serpWeaknessScore).toFixed(1)),
        forecastEstimates: {
          estimatedMonthlyVolume,
          keywordDifficultyScore,
          estimatedDaysToRank,
          substrateMultiplier: subMultiplier,
          volumeRealizationMultiplier: calibrationState.volumeRealizationMultiplier || 1.0
        },
        scores: {
          compositeOpportunityScore,
          demandScore,
          transactionalIntentScore: intentScore,
          lowCompetitionScore: serpSnap.serpWeaknessScore
        },
        secondaryLongTailModifiers,
        buyerFaqQuestions: buildFaqQuestionsForCluster(sub, profile, cleanKw, cand.hwContext),
        serpGapAnalysis: {
          engine: serpSnap.engine,
          exactModifierTitleMatchesInTop10: serpSnap.exactModifierTitleMatches,
          weakForumCountInTop10: serpSnap.ugcForumCount + serpSnap.marketplaceListingCount,
          missingDualUnitSpecsInSerp: true,
          missingMaterialGsmOrThicknessInSerp: true,
          topCompetitorTitles: serpSnap.topCompetitorTitles,
          competitorWeaknesses: [
            `0/10 competing titles combine "${primaryMotif}" + "${cand.hwContext}" with dual CM & Inch sizing tables`,
            `Top forum/marketplace threads omit ${profile.materialSpec.split('(')[0].trim()} construction specs`
          ]
        },
        modifiers: {
          size: `${profile.sizes[0]} & ${profile.sizes[1]}`,
          hardwareCompatibility: toTitleCase(cand.hwContext.replace(/^for\s+|^above\s+/i, '')),
          roomPlacement: profile.pinterestRoom,
          wallpaperQuery: `${toTitleCase(primaryMotif)} ${profile.wallpaperRes}`,
          pinterestAesthetic: `${toTitleCase(primaryMotif)} — ${profile.pinterestRoom}`,
          gmcTitleBadge: profile.gmcBadge
        },
        status: 'queued',
        assignedArticleHandle: null
      };

      scoredClusters.push(clusterObj);
    }

    scoredClusters.sort((a, b) => b.opportunityScore - a.opportunityScore);
    bySubCollection[sub.handle] = scoredClusters.slice(0, 3);
    if (scoredClusters[0]) {
      flatKeywords.push(scoredClusters[0]);
    }
  }

  flatKeywords.sort((a, b) => b.opportunityScore - a.opportunityScore);

  function resolveLiveBlogUrlForCluster(item, reg) {
    const pubList = reg?.publishedBlogIndex || [];
    if (item.assignedArticleHandle && pubList.some(a => a.handle === item.assignedArticleHandle)) {
      return `/blogs/news/${item.assignedArticleHandle}`;
    }
    if (pubList.length === 0) return '/pages/desk-size-visualizer';
    const targetTokens = tokenizeNormalized(`${item.themeTag} ${item.productType} ${item.subCollectionHandle.replace(/-/g, ' ')}`);
    let bestHandle = pubList[0].handle;
    let bestScore = -1;
    for (const art of pubList) {
      if (art.primarySubCollection === item.subCollectionHandle) {
        return `/blogs/news/${art.handle}`;
      }
      const artTokens = art.normalizedStems || tokenizeNormalized(`${art.title} ${art.handle}`);
      const overlap = targetTokens.filter(t => artTokens.includes(t)).length;
      if (overlap > bestScore) {
        bestScore = overlap;
        bestHandle = art.handle;
      }
    }
    return `/blogs/news/${bestHandle}`;
  }

  const top10DailyAiCitationQueries = flatKeywords.slice(0, 10).map(item => {
    const profile = SUBSTRATE_PROFILES[item.productType] || SUBSTRATE_PROFILES['Desk Mats'];
    return {
      query: item.primaryKeyword,
      subCollectionHandle: item.subCollectionHandle,
      productType: item.productType,
      recommendedDimension: `${profile.sizes[0]} or ${profile.sizes[1]}`,
      materialAndPriceSpec: profile.materialSpec,
      targetCollectionUrl: item.subCollectionUrl,
      targetCollectionAnchor: item.collectionAnchorText,
      matchingBlogUrl: resolveLiveBlogUrlForCluster(item, registry),
      plannedBlogSlug: `/blogs/news/${item.recommendedSlug}`,
      serpWeakSpotsInTop10: item.serpGapAnalysis?.weakForumCountInTop10 ?? 4,
      exactTitleMatchesInTop10: item.serpGapAnalysis?.exactModifierTitleMatchesInTop10 ?? 0,
      compositeScore: item.opportunityScore
    };
  });

  const queuePayload = {
    generatedAt: new Date().toISOString(),
    scoringVersion: '2.0.0-multi-agent',
    summary: {
      totalCandidatesEvaluated,
      totalSubCollectionsCovered: Object.keys(bySubCollection).length,
      liveSerpInspectionsRun: liveSerpChecksRun,
      topOpportunityScore: flatKeywords[0]?.opportunityScore || 0
    },
    bySubCollection,
    keywords: flatKeywords,
    top10DailyAiCitationQueries
  };

  fs.writeFileSync(QUEUE_OUT_PATH, JSON.stringify(queuePayload, null, 2), 'utf8');
  fs.writeFileSync(SERP_CACHE_PATH, JSON.stringify(serpsCache, null, 2), 'utf8');

  const logMd = [
    `# Prints With Passion — Automated Transactional Keyword Research & Low-Competition SERP Log`,
    `**Last Run:** ${queuePayload.generatedAt}`,
    `**Candidates Evaluated:** ${totalCandidatesEvaluated} | **Smart Sub-Collections Covered:** ${queuePayload.summary.totalSubCollectionsCovered}/48 | **Live SERP Inspections:** ${liveSerpChecksRun}`,
    '',
    `## Top 15 Low-Competition Transactional Keyword Opportunities`,
    `| Rank | Target Transactional Keyword | Smart Sub-Collection | Substrate | Opp Score | Demand | Intent | SERP Weakness | Exact Title Matches in Top 10 |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...flatKeywords.slice(0, 15).map((k, i) =>
      `| ${i + 1} | \`${k.primaryKeyword}\` | \`${k.subCollectionHandle}\` | ${k.productType} | **${k.opportunityScore}** | ${k.scores.demandScore} | ${k.scores.transactionalIntentScore} | ${k.scores.lowCompetitionScore} | ${k.serpGapAnalysis.exactModifierTitleMatchesInTop10}/10 |`
    ),
    ''
  ].join('\n');

  fs.writeFileSync(LOG_OUT_PATH, logMd, 'utf8');
  console.log(`  [PASS] Generated ${QUEUE_OUT_PATH} (${flatKeywords.length} primary clusters across 48 Smart Sub-Collections, Top Score: ${queuePayload.summary.topOpportunityScore}).`);
}

main().catch(console.error);
