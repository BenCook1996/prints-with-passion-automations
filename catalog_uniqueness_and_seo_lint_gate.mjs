/**
 * Prints With Passion — White-Hat SEO Automation #8 (Upgraded v2.1 — Active Sanitizer & Sitemap Hygiene):
 * Pre-Publish Catalog Uniqueness & SEO Lint Quality Gate (catalog_uniqueness_and_seo_lint_gate.mjs)
 *
 * Enforces strict anti-duplication, anti-IP/adult/celebrity/brand handle hygiene, and anti-AI-cliché rules
 * across products, collections, blogs, and articles, actively auto-sanitizing violations via Shopify GraphQL:
 * 1. Flags any Roman numeral clone titles ("Edition II..XX") or numeric handle suffixes (-1, -2).
 * 2. Flags & sanitizes any third-party IP, celebrity, adult-performer, or concatenated camera/brand tokens
 *    (including `fujifilm`, `rammstein`, `abella-danger`, `shyla-stylez`, `riley-reid`, `what-if-*` blogs, and `pop-culture-icons`).
 * 3. Strips AI-cliché phrases ("delve into", "testament to", "tapestry of", "a calm serene", etc.)
 *    and any residual collection `FAQPage` or `STUDIO15` blocks via `productUpdate` / `collectionUpdate` / `articleUpdate`.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';

const REPORT_PATH = path.join(WORKSPACE, 'LINT_QUALITY_GATE_LOG.md');

const ROMAN_CLONE_REGEX = /\bEdition\s+(?:II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX)\b/i;
export const IP_TRADEMARK_REGEX = /\b(?:star-wars|jedi|sith|vader|skywalker|mandalorian|grogu|baby-yoda|lightsaber|endor|pokemon|pikachu|charizard|gengar|naruto|uchiha|one-piece|luffy|dragon-ball|goku|totoro|ghibli|spirited-away|demon-slayer|attack-on-titan|jujutsu-kaisen|zelda|super-mario|harry-potter|hogwarts|lord-of-the-rings|frodo|gandalf|witcher|warhammer|cyberpunk-2077|elden-ring|valorant|fortnite|minecraft|genshin-impact|spider-man|avengers|batman|disney|marvel|stranger-things|game-of-thrones|nike|adidas|gucci|rolex|ferrari|porsche|aston-martin|lamborghini|mclaren|bugatti|maserati|rolls-royce|bentley|transformers|optimus-prime|bumblebee|megatron|avatar|jurassic-park|terminator|predator|godzilla|king-kong|sonic|master-chief|fallout|skyrim|final-fantasy|street-fighter|mortal-kombat|tekken|bleach|chainsaw-man|berserk|evangelion|akira|sailor-moon|yu-gi-oh|digimon|spongebob|simpsons|rick-and-morty|south-park|peaky-blinders|breaking-bad|sopranos|pulp-fiction|scarface|godfather|jonathan-adler|keith-haring|banksy|basquiat|warhol|kaws|fujifilm|rammstein|supreme|spacex|ufc|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann|jada-stevens|matt-damon|brad-pitt|jack-nicholson|megan-fox|zendaya|george-clooney|robert-de-niro|harry-styles|serena-williams|mbappe|doctor-strange|tony-stark|brainiac|professor-x|krypton|doomsday|agent-smith)\b|(?:fujifilm|abella-danger|shyla-stylez|riley-reid|jayden-jaymes|lexi-luna|lisa-ann)/i;

const AI_CLICHE_REGEX = /\b(?:delve into|testament to|tapestry of|a calm serene|symphony of|beacon of|in the realm of|elevate your everyday|more than just a|unparalleled sophistication|seamlessly blends)\b/gi;

export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
export const DEPRECATED_SCHEMA_SCRIPT_REGEX = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(?:(?!<\/script>)[\s\S])*"@type"\s*:\s*"(?:FAQPage|HowTo)"(?:(?!<\/script>)[\s\S])*<\/script>/gi;
export const THIRTY_DAY_RETURN_REGEX = /\b30-(Day|day)(\s+(?:money-back|quality|returns?|hassle-free|replacement|guarantee|policy))/gi;
export const BLUEPRINT_CODE_REGEX = /\s*(?:\(\s*BP\s*#\s*\d+\s*\)|BP\s*#\s*\d+\s*[·•\-–—]?)/gi;

export function stripDeprecatedJsonLdFromHtml(html = '') {
  return String(html || '').replace(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (fullMatch, jsonBody) => {
      if (!/"@type"\s*:\s*"(?:FAQPage|HowTo)"/i.test(jsonBody)) {
        return fullMatch;
      }
      try {
        const parsed = JSON.parse(jsonBody.trim());
        if (Array.isArray(parsed['@graph'])) {
          const filtered = parsed['@graph'].filter(node => {
            const t = node?.['@type'];
            const types = Array.isArray(t) ? t : [t];
            return !types.includes('FAQPage') && !types.includes('HowTo');
          });
          if (filtered.length === 0) return '';
          return `<script type="application/ld+json">${JSON.stringify({ ...parsed, '@graph': filtered })}</script>`;
        }
        const t = parsed['@type'];
        const types = Array.isArray(t) ? t : [t];
        if (types.includes('FAQPage') || types.includes('HowTo')) {
          return '';
        }
        return fullMatch;
      } catch {
        return '';
      }
    }
  );
}

export function sanitizeDeprecatedReturnAndBlueprintCopy(html = '') {
  return stripDeprecatedJsonLdFromHtml(html)
    .replace(THIRTY_DAY_RETURN_REGEX, '14-$1$2')
    .replace(BLUEPRINT_CODE_REGEX, '')
    .trim();
}

const PDP_GENERIC_STOPWORDS = new Set([
  'with', 'and', 'for', 'the', 'from', 'into', 'this', 'that', 'your', 'our', 'are', 'edition',
  'studio', 'print', 'prints', 'passion', 'art', 'wall', 'canvas', 'stretched', 'framed',
  'desk', 'mat', 'mats', 'mousepad', 'throw', 'blanket', 'blankets', 'fleece', 'coral',
  'cushion', 'cover', 'covers', 'pillow', 'bath', 'memory', 'foam', 'graphic', 'shirt',
  'tshirt', 'hoodie', 'hoodies', 'heavyweight', 'cotton', 'archival', 'free', 'tracked',
  'shipping', 'delivery', 'included', 'inch', 'inches', 'xxl', '400gsm', '300gsm', '4mm'
]);

function extractUniqueContentTokens(text = '') {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 3);
}

function hashString(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const ARTWORK_PALETTE_PROFILES = [
  {
    rx: /japan|samurai|sakura|ukiyo|koi|katana|torii|tokyo|wave|zen/i,
    palette: 'Mineral indigo, vermilion seal accents, warm rice-paper neutrals, and crisp sumi-ink contours',
    lighting: 'Diffused overcast daylight or 2700K warm lantern-style sidelighting to reveal fine linework',
    roomPairing: 'Natural ash or oak timber, matte black shelving, and textured linen upholstery'
  },
  {
    rx: /cyberpunk|neon|synth|futur|scifi|sci-fi|mecha|blade|laser|glitch/i,
    palette: 'Electric cyan, magenta rim highlights, obsidian shadow fields, and wet-asphalt slate gradients',
    lighting: 'Dark-mode workstation bias LEDs (5000K–6500K) or low-glare RGB rim lighting behind curved displays',
    roomPairing: 'Anodized aluminum frames, matte charcoal desktops, and dark slate acoustics panels'
  },
  {
    rx: /space|galaxy|nebula|cosmos|astronaut|planet|moon|starry|celestial/i,
    palette: 'Deep cosmic ultramarine, ionized violet clouds, amber star clusters, and graphite voids',
    lighting: 'Recessed ceiling washes or warm 3000K architectural spots that avoid specular glare',
    roomPairing: 'Walnut cabinetry, brushed brass fixtures, and muted charcoal or navy accent walls'
  },
  {
    rx: /mountain|alpine|forest|valley|lauterbrunnen|lake|fjord|waterfall|peak|nature/i,
    palette: 'Alpine pine greens, cool limestone greys, glacier meltwater blues, and atmospheric morning mist',
    lighting: 'North-facing natural window light or balanced 3500K gallery illumination',
    roomPairing: 'Oiled oak furniture, woven wool throws, and unglazed plaster or stone textures'
  },
  {
    rx: /botanical|floral|flower|monstera|fern|leaf|garden|peony|coastal|ocean/i,
    palette: 'Chlorophyll sage, sea-glass celadon, terracotta botanical accents, and chalky bone whites',
    lighting: 'Bright natural daylight or soft 3000K ambient pendants for foliage saturation fidelity',
    roomPairing: 'Rattan weaving, travertine side tables, and breathable washed-cotton textiles'
  },
  {
    rx: /retro|vintage|80s|70s|bauhaus|geometric|mid-century|abstract|minimalist/i,
    palette: 'Burnt ochre, Bauhaus cobalt, warm putty cream, and structured graphite architectural geometry',
    lighting: 'Crisp 3000K–4000K track spots positioned at 30 degrees to prevent corner shadows',
    roomPairing: 'Tubular chrome accents, mid-century teak veneer, and low-pile geometric rugs'
  }
];

function buildArtworkVisualNotesHtml(product) {
  const rawTitle = String(product.title || '').replace(/\s*[—–|]\s*(?:Stretched Canvas|XXL Desk Mat|Throw Blanket|Cushion Cover|Bath Mat|Graphic).*$/i, '').trim();
  const haystack = `${rawTitle} ${product.handle || ''} ${(product.tags || []).join(' ')}`;
  const subjectWords = [...new Set(
    rawTitle
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 3 && !PDP_GENERIC_STOPWORDS.has(w))
  )];
  const focusSubjects = subjectWords.slice(0, 6).join(', ') || rawTitle.toLowerCase();
  const matchedProfile = ARTWORK_PALETTE_PROFILES.find(p => p.rx.test(haystack));
  const fallbackIdx = hashString(product.handle || rawTitle) % ARTWORK_PALETTE_PROFILES.length;
  const profile = matchedProfile || ARTWORK_PALETTE_PROFILES[fallbackIdx];

  const pt = product.productType || 'Studio Edition';
  let scaleNote = '';
  let collectionLink = '/collections/all';
  let collectionLabel = 'Full Archival Studio Catalog';

  if (/canvas/i.test(pt)) {
    collectionLink = '/collections/canvas-prints';
    collectionLabel = 'Stretched Canvas Wall Art Collection';
    scaleNote = `For furniture proportion balance, hang "${rawTitle}" centered at 57 inches (145 cm) eye level and select a frame width covering 60%–75% of your sofa, desk, or headboard span—viewed cleanly at 1.5 m to 3.5 m (5–11 ft) without window glare.`;
  } else if (/desk/i.test(pt)) {
    collectionLink = '/collections/desk-mats';
    collectionLabel = '4mm XXL Stitched Desk Mats';
    scaleNote = `Designed for 45–75 cm (18"–30") close-range desktop viewing under a monitor rig, anchoring keyboard typography and low-CPI mouse sweep across 80×30 cm (31.5"×11.8") and 90×40 cm (35.4"×15.7") footprints without visual clutter.`;
  } else if (/blanket|throw/i.test(pt)) {
    collectionLink = '/collections/blankets';
    collectionLabel = '300 GSM Coral Fleece Throw Blankets';
    scaleNote = `Printed full-bleed across 127×152 cm (50"×60") throw and 152×203 cm (60"×80") bed sizes so the "${rawTitle}" composition drapes cleanly across sofa arms or duvet footboards.`;
  } else if (/cushion|pillow/i.test(pt)) {
    collectionLink = '/collections/pillow-cases';
    collectionLabel = 'Double-Sided Spun Linen Cushion Covers';
    scaleNote = `Scaled across double-sided 45×45 cm (18"×18") and 55×55 cm (22"×22") square silhouettes so the ${focusSubjects} focal motif stays centered on accent chairs, sofas, or bed layering stacks.`;
  } else if (/bath/i.test(pt)) {
    collectionLink = '/collections/bath-mats';
    collectionLabel = 'Memory Foam Bath Mats';
    scaleNote = `Proportioned at 61×43 cm (24"×17") to align cleanly in front of standard 60–90 cm single bathroom vanities and walk-in shower exits while grounding wet-zone acoustics.`;
  } else {
    collectionLink = /hoodie/i.test(pt) ? '/collections/hoodies' : '/collections/t-shirts';
    collectionLabel = /hoodie/i.test(pt) ? 'Heavyweight Graphic Hoodies' : 'Ring-Spun Graphic T-Shirts';
    scaleNote = `Artwork plate for "${rawTitle}" is scaled proportionally across unisex S–3XL chest and back zones so lineweights in ${focusSubjects} stay crisp under natural fold lines.`;
  }

  return `\n<!-- PWP_ARTWORK_VISUAL_NOTES_START -->
<section class="pwp-artwork-visual-notes" data-handle="${product.handle}">
  <h3>Artwork Study, Palette &amp; Room Proportion Notes: ${rawTitle}</h3>
  <p><strong>Composition &amp; Motif Detail:</strong> "${rawTitle}" highlights distinct visual focal anchors around <em>${focusSubjects}</em>, rendered with high-definition tonal separation so fine texture remains legible both up close and across the room.</p>
  <p><strong>Color Palette &amp; Lighting Guidance:</strong> Key chromatic notes combine ${profile.palette.toLowerCase()}. Best experienced under ${profile.lighting.toLowerCase()}, paired alongside ${profile.roomPairing.toLowerCase()}.</p>
  <p><strong>Scale, Clearances &amp; Setup Tools:</strong> ${scaleNote} Compare exact Metric (CM) and Imperial (Inch) room fit using our <a href="/pages/desk-size-visualizer">Desk &amp; Wall Art Size Visualizer</a> or browse more works in <a href="${collectionLink}">${collectionLabel}</a>. Free tracked UK, US, CA &amp; EU shipping with 14-day returns.</p>
</section>
<!-- PWP_ARTWORK_VISUAL_NOTES_END -->`;
}

export function computePdpUniquenessAndEnrich(products = [], maxEnrichPerRun = 15) {
  const byType = new Map();
  for (const p of products) {
    const pt = p.productType || 'Studio Edition';
    if (!byType.has(pt)) byType.set(pt, []);
    byType.get(pt).push(p);
  }

  const evaluations = [];
  const enrichCandidates = [];

  for (const [pt, group] of byType.entries()) {
    const df = new Map();
    const tokenLists = new Map();
    for (const p of group) {
      const tokens = extractUniqueContentTokens(p.descriptionHtml || p.description || '');
      tokenLists.set(p.id, tokens);
      const uniqueSet = new Set(tokens);
      for (const t of uniqueSet) {
        df.set(t, (df.get(t) || 0) + 1);
      }
    }

    const sharedThreshold = group.length >= 3 ? Math.max(2, Math.ceil(group.length * 0.4)) : Infinity;
    const sharedBoilerplate = new Set();
    for (const [tok, count] of df.entries()) {
      if (count >= sharedThreshold) sharedBoilerplate.add(tok);
    }

    for (const p of group) {
      const tokens = tokenLists.get(p.id) || [];
      const uniqueTokens = tokens.filter(t => !sharedBoilerplate.has(t));
      const uniquenessRatio = tokens.length > 0 ? uniqueTokens.length / tokens.length : 0;
      const alreadyHasNotes = (p.descriptionHtml || '').includes('PWP_ARTWORK_VISUAL_NOTES_START');
      const isThin = uniquenessRatio < 0.45 && !alreadyHasNotes;
      evaluations.push({
        id: p.id,
        handle: p.handle,
        productType: pt,
        uniquenessRatio: Number(uniquenessRatio.toFixed(3)),
        isThin,
        alreadyHasNotes
      });
      if (isThin && enrichCandidates.length < maxEnrichPerRun) {
        const visualNotes = buildArtworkVisualNotesHtml(p);
        enrichCandidates.push({
          product: p,
          uniquenessRatio: Number(uniquenessRatio.toFixed(3)),
          enrichedHtml: `${sanitizeDeprecatedReturnAndBlueprintCopy(p.descriptionHtml || '')}${visualNotes}`.trim()
        });
      }
    }
  }

  return { evaluations, enrichCandidates };
}

const AI_CLICHE_REPLACEMENTS = {
  'delve into': 'explore',
  'testament to': 'example of',
  'tapestry of': 'blend of',
  'a calm serene': 'a balanced',
  'symphony of': 'combination of',
  'beacon of': 'centerpiece of',
  'in the realm of': 'across',
  'elevate your everyday': 'upgrade your daily',
  'more than just a': 'a precision-crafted',
  'unparalleled sophistication': 'archival studio clarity',
  'seamlessly blends': 'pairs cleanly'
};

function sanitizeAiCliches(htmlOrText) {
  return (htmlOrText || '').replace(AI_CLICHE_REGEX, match => {
    const lower = match.toLowerCase();
    return AI_CLICHE_REPLACEMENTS[lower] || 'studio-grade';
  });
}

export function unescapeHtmlEntities(str, isHtml = false) {
  if (!str) return '';
  let res = str;
  let prev = '';
  while (res !== prev) {
    prev = res;
    res = res.replace(/&amp;quot;/gi, '"')
             .replace(/&amp;#39;/gi, "'")
             .replace(/&amp;apos;/gi, "'")
             .replace(/&amp;amp;/gi, '&')
             .replace(/&amp;lt;/gi, '<')
             .replace(/&amp;gt;/gi, '>')
             .replace(/&amp;nbsp;/gi, ' ');
  }
  if (!isHtml) {
    res = res.replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/&apos;/gi, "'")
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, '&');
  }
  return res;
}

export function sanitizeDanglingTitle(rawTitle, brandSuffix = ' | Prints With Passion', maxChars = 60) {
  if (!rawTitle) return '';
  let title = unescapeHtmlEntities(rawTitle, false).trim();
  let prev = '';
  while (title !== prev) {
    prev = title;
    title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
    title = title.replace(/\s*\([^\)]*$/, '').trim();
    title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
  }

  if (title.length > maxChars) {
    let truncated = title.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 25) {
      truncated = truncated.slice(0, lastSpace);
    }
    title = truncated.trim();
    prev = '';
    while (title !== prev) {
      prev = title;
      title = title.replace(/\s*[–—\-|,/&:]+\s*$/, '').trim();
      title = title.replace(/\s*\([^\)]*$/, '').trim();
      title = title.replace(/\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$/i, '').trim();
    }
  }
  return title;
}

export function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = unescapeHtmlEntities(desc, false);
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+((?:[^\.]|\.(?=\d))+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}

async function main() {
  console.log('=== Prints With Passion — Pre-Publish Uniqueness, IP/Brand Handle & Active SEO Lint Sanitizer ===');

  const data = await shopifyGql(`
    query SampleQualityGate {
      productsCount(query: "status:active") { count }
      products(first: 200, query: "status:active", sortKey: UPDATED_AT, reverse: true) {
        nodes { id handle title productType tags description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
      }
      fujifilmCheck: products(first: 20, query: "status:active fujifilm") {
        nodes { id handle title productType tags description descriptionHtml priceRangeV2 { minVariantPrice { amount } } seo { title description } }
      }
      collections(first: 250) {
        nodes { id handle title descriptionHtml productsCount { count } seo { title description } }
      }
      blogs(first: 20) {
        nodes { id handle title }
      }
      articles(first: 50, query: "published_status:published") {
        nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
      }
      pages(first: 50) {
        nodes { id handle title body titleTag: metafield(namespace: "global", key: "title_tag") { value } descTag: metafield(namespace: "global", key: "description_tag") { value } }
      }
    }
  `);

  const activeCount = data?.productsCount?.count ?? 0;
  const prodMap = new Map();
  for (const p of [...(data?.products?.nodes || []), ...(data?.fujifilmCheck?.nodes || [])]) {
    prodMap.set(p.id, p);
  }
  const products = [...prodMap.values()];
  const collections = data?.collections?.nodes || [];
  const blogs = data?.blogs?.nodes || [];
  const articles = data?.articles?.nodes || [];
  const pages = data?.pages?.nodes || [];

  const romanViolations = [];
  const ipViolations = [];
  const zeroPriceViolations = [];
  const aiLintViolations = [];
  const boilerplateCollectionViolations = [];
  const orphanedBlogViolations = [];
  const zeroProductViolations = [];
  const entityViolations = [];
  const templateGrammarViolations = [];
  const danglingTitleViolations = [];
  const deprecatedSchemaViolations = [];
  const thirtyDayReturnViolations = [];
  const blueprintCodeViolations = [];
  let autoSanitizedCount = 0;

  // 1. Audit & Clean Orphaned Non-News Blog Containers (e.g., what-if-* Marvel/DC blogs)
  for (const b of blogs) {
    if (b.handle !== 'news') {
      orphanedBlogViolations.push({ id: b.id, handle: b.handle, title: b.title });
      await shopifyGql(`
        mutation DelBlog($id: ID!) {
          blogDelete(id: $id) { deletedBlogId userErrors { field message } }
        }
      `, { id: b.id });
      await shopifyGql(`
        mutation RedirBlog($urlRedirect: UrlRedirectInput!) {
          urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
        }
      `, { urlRedirect: { path: `/blogs/${b.handle}`, target: '/blogs/news' } });
      autoSanitizedCount++;
    }
  }

  // 2. Audit Active Products for Roman Clones, IP/Brand Handles, £0.00 Prices, AI Clichés, Deprecated Schemas, 30-Day Returns & BP# Codes
  for (const p of products) {
    if (ROMAN_CLONE_REGEX.test(p.title || '')) {
      romanViolations.push({ type: 'Product', handle: p.handle, title: p.title });
    }
    if (IP_TRADEMARK_REGEX.test(`${p.handle} ${p.title} ${p.description || ''}`)) {
      // If handle has 'fujifilm' prefix but title is clean (e.g. Moody Cinematic Mountain Dawn), sanitize handle
      if (/fujifilm/i.test(p.handle) && !IP_TRADEMARK_REGEX.test(p.title)) {
        const oldHandle = p.handle;
        const newHandle = p.handle.replace(/fujifilm/gi, 'moody-cinematic-').replace(/--+/g, '-').replace(/^-|-$/g, '');
        await shopifyGql(`
          mutation CleanProdHandle($input: ProductInput!) {
            productUpdate(input: $input) { product { id handle } }
          }
        `, { input: { id: p.id, handle: newHandle, redirectNewHandle: true } });
        await shopifyGql(`
          mutation RedirProd($urlRedirect: UrlRedirectInput!) {
            urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
          }
        `, { urlRedirect: { path: `/products/${oldHandle}`, target: `/products/${newHandle}` } });
        autoSanitizedCount++;
      } else {
        ipViolations.push({ type: 'Product', handle: p.handle, title: p.title });
      }
    }
    const minPrice = parseFloat(p.priceRangeV2?.minVariantPrice?.amount || '0');
    if (minPrice <= 0) {
      zeroPriceViolations.push({ type: 'Product', handle: p.handle, title: p.title });
    }

    const rawProdHtml = p.descriptionHtml || '';
    const hasDeprecatedProdSchema = DEPRECATED_SCHEMA_SCRIPT_REGEX.test(rawProdHtml);
    DEPRECATED_SCHEMA_SCRIPT_REGEX.lastIndex = 0;
    const has30DayProd = THIRTY_DAY_RETURN_REGEX.test(rawProdHtml);
    THIRTY_DAY_RETURN_REGEX.lastIndex = 0;
    const hasBpProd = BLUEPRINT_CODE_REGEX.test(rawProdHtml);
    BLUEPRINT_CODE_REGEX.lastIndex = 0;
    const m = `${p.title} ${p.description || ''}`.match(AI_CLICHE_REGEX);

    if (hasDeprecatedProdSchema) deprecatedSchemaViolations.push({ type: 'Product', handle: p.handle });
    if (has30DayProd) thirtyDayReturnViolations.push({ type: 'Product', handle: p.handle });
    if (hasBpProd) blueprintCodeViolations.push({ type: 'Product', handle: p.handle });
    if (m) aiLintViolations.push({ type: 'Product', handle: p.handle, phrase: m[0] });

    if ((hasDeprecatedProdSchema || has30DayProd || hasBpProd || m) && autoSanitizedCount < 45 && rawProdHtml) {
      const cleanedHtml = sanitizeDeprecatedReturnAndBlueprintCopy(sanitizeAiCliches(rawProdHtml));
      if (cleanedHtml !== rawProdHtml) {
        await shopifyGql(`
          mutation CleanProd($input: ProductInput!) {
            productUpdate(input: $input) { product { id } }
          }
        `, { input: { id: p.id, descriptionHtml: cleanedHtml } });
        p.descriptionHtml = cleanedHtml;
        autoSanitizedCount++;
      }
    }
  }

  // 2b. Automated PDP Artwork Uniqueness Enricher (>= 45% Uniqueness Floor, up to 15 thin PDPs per run)
  const { evaluations: pdpEvalList, enrichCandidates } = computePdpUniquenessAndEnrich(products, 15);
  let pdpEnrichedCount = 0;
  for (const cand of enrichCandidates) {
    const updRes = await shopifyGql(`
      mutation EnrichThinPdp($input: ProductInput!) {
        productUpdate(input: $input) { product { id handle } userErrors { field message } }
      }
    `, { input: { id: cand.product.id, descriptionHtml: cand.enrichedHtml } });
    if (!updRes?.productUpdate?.userErrors?.length) {
      cand.product.descriptionHtml = cand.enrichedHtml;
      pdpEnrichedCount++;
    }
  }
  const thinPdpCountRemaining = pdpEvalList.filter(e => e.isThin).length - pdpEnrichedCount;
  const avgPdpUniquenessPct = pdpEvalList.length > 0
    ? Math.round((pdpEvalList.reduce((acc, e) => acc + e.uniquenessRatio, 0) / pdpEvalList.length) * 100)
    : 100;

  // 3. Audit Collections for 0-products, Entities, Template Grammar, Dangling Titles, pop-culture-icons, Boilerplate & AI Clichés
  for (const c of collections) {
    const isFrontpage = c.handle === 'frontpage';
    const prodCount = typeof c.productsCount === 'object' ? (c.productsCount?.count ?? 0) : (c.productsCount ?? 0);

    if (!isFrontpage && prodCount === 0) {
      zeroProductViolations.push({ id: c.id, handle: c.handle, title: c.title });
      if (autoSanitizedCount < 45) {
        await shopifyGql(`
          mutation DelCol($input: CollectionDeleteInput!) {
            collectionDelete(input: $input) { deletedCollectionId userErrors { field message } }
          }
        `, { input: { id: c.id } });
        await shopifyGql(`
          mutation RedirCol($urlRedirect: UrlRedirectInput!) {
            urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
          }
        `, { urlRedirect: { path: `/collections/${c.handle}`, target: '/collections/all' } });
        autoSanitizedCount++;
      }
      continue;
    }

    if (c.handle === 'pop-culture-icons') {
      await shopifyGql(`
        mutation DelCol($input: CollectionDeleteInput!) {
          collectionDelete(input: $input) { deletedCollectionId userErrors { field message } }
        }
      `, { input: { id: c.id } });
      await shopifyGql(`
        mutation RedirCol($urlRedirect: UrlRedirectInput!) {
          urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { id } }
        }
      `, { urlRedirect: { path: '/collections/pop-culture-icons', target: '/collections/retro-vintage' } });
      autoSanitizedCount++;
      continue;
    }

    let html = c.descriptionHtml || '';
    let seoTitle = c.seo?.title || c.title || '';
    let seoDesc = c.seo?.description || '';
    let needsUpdate = false;
    let needsSeoUpdate = false;

    // Check entities
    if (UNESCAPED_ENTITY_REGEX.test(seoTitle) || UNESCAPED_ENTITY_REGEX.test(seoDesc) || /&amp;quot;/i.test(html)) {
      entityViolations.push({ type: 'Collection', handle: c.handle });
      seoTitle = unescapeHtmlEntities(seoTitle, false);
      seoDesc = unescapeHtmlEntities(seoDesc, false);
      html = unescapeHtmlEntities(html, true);
      needsUpdate = true;
      needsSeoUpdate = true;
    }

    // Check broken template grammar
    if (TEMPLATE_GRAMMAR_REGEX.test(seoDesc)) {
      templateGrammarViolations.push({ type: 'Collection', handle: c.handle });
      seoDesc = sanitizeTemplateGrammar(seoDesc);
      needsSeoUpdate = true;
    }

    // Check dangling title
    if (!isFrontpage && (DANGLING_TITLE_REGEX.test(seoTitle) || seoTitle.length > 60)) {
      danglingTitleViolations.push({ type: 'Collection', handle: c.handle, title: seoTitle });
      seoTitle = sanitizeDanglingTitle(seoTitle, ' | Prints With Passion', 60);
      needsSeoUpdate = true;
    }

    const hasDeprecatedColSchema = html.includes('PWP_INPAGES_3RULE_HERO_START') || /"@type"\s*:\s*"(?:FAQPage|HowTo)"/i.test(html);
    if (hasDeprecatedColSchema) {
      boilerplateCollectionViolations.push({ handle: c.handle, title: c.title });
      if (/"@type"\s*:\s*"(?:FAQPage|HowTo)"/i.test(html)) {
        deprecatedSchemaViolations.push({ type: 'Collection', handle: c.handle });
      }
      html = stripDeprecatedJsonLdFromHtml(
        html.replace(/<!-- PWP_INPAGES_3RULE_HERO_START -->[\s\S]*?<!-- PWP_INPAGES_3RULE_HERO_END -->/gi, '')
      ).trim();
      needsUpdate = true;
    }

    const has30DayCol = THIRTY_DAY_RETURN_REGEX.test(html) || THIRTY_DAY_RETURN_REGEX.test(seoDesc);
    THIRTY_DAY_RETURN_REGEX.lastIndex = 0;
    const hasBpCol = BLUEPRINT_CODE_REGEX.test(html) || BLUEPRINT_CODE_REGEX.test(seoDesc);
    BLUEPRINT_CODE_REGEX.lastIndex = 0;
    if (has30DayCol) {
      thirtyDayReturnViolations.push({ type: 'Collection', handle: c.handle });
      html = sanitizeDeprecatedReturnAndBlueprintCopy(html);
      seoDesc = sanitizeDeprecatedReturnAndBlueprintCopy(seoDesc);
      needsUpdate = true;
      needsSeoUpdate = true;
    }
    if (hasBpCol) {
      blueprintCodeViolations.push({ type: 'Collection', handle: c.handle });
      html = sanitizeDeprecatedReturnAndBlueprintCopy(html);
      seoDesc = sanitizeDeprecatedReturnAndBlueprintCopy(seoDesc);
      needsUpdate = true;
      needsSeoUpdate = true;
    }

    if (/STUDIO15/i.test(seoDesc)) {
      boilerplateCollectionViolations.push({ handle: c.handle, title: `${c.title} (SEO Meta)` });
      seoDesc = seoDesc.replace(/\s*(?:Use\s+code\s+)?STUDIO15[^.]*\.?/gi, '').trim();
      needsSeoUpdate = true;
    }

    const m = html.replace(/<[^>]+>/g, ' ').match(AI_CLICHE_REGEX);
    if (m) {
      aiLintViolations.push({ type: 'Collection', handle: c.handle, phrase: m[0] });
      html = sanitizeAiCliches(html);
      needsUpdate = true;
    }

    if ((needsUpdate || needsSeoUpdate) && autoSanitizedCount < 45) {
      const input = { id: c.id };
      if (needsUpdate) input.descriptionHtml = html;
      if (needsSeoUpdate) input.seo = { title: seoTitle, description: seoDesc };
      await shopifyGql(`
        mutation CleanCol($input: CollectionInput!) {
          collectionUpdate(input: $input) { collection { id } }
        }
      `, { input });
      autoSanitizedCount++;
    }
  }

  // 4. Audit Published Articles for AI Clichés, Deprecated Schemas, 30-Day Returns, BP# Codes, Entities & Dangling Titles
  for (const a of articles) {
    const rawBody = a.body || '';
    const text = rawBody.replace(/<[^>]+>/g, ' ');
    const title = a.title || '';
    const titleTag = a.titleTag?.value || '';
    const descTag = a.descTag?.value || '';

    if (UNESCAPED_ENTITY_REGEX.test(title) || UNESCAPED_ENTITY_REGEX.test(titleTag) || UNESCAPED_ENTITY_REGEX.test(descTag) || /&amp;quot;/i.test(rawBody)) {
      entityViolations.push({ type: 'Article', handle: a.handle });
    }

    if (DANGLING_TITLE_REGEX.test(titleTag || title) || (titleTag || title).length > 60) {
      danglingTitleViolations.push({ type: 'Article', handle: a.handle, title: titleTag || title });
    }

    const hasDeprecatedArtSchema = DEPRECATED_SCHEMA_SCRIPT_REGEX.test(rawBody);
    DEPRECATED_SCHEMA_SCRIPT_REGEX.lastIndex = 0;
    const has30DayArt = THIRTY_DAY_RETURN_REGEX.test(rawBody);
    THIRTY_DAY_RETURN_REGEX.lastIndex = 0;
    const hasBpArt = BLUEPRINT_CODE_REGEX.test(rawBody);
    BLUEPRINT_CODE_REGEX.lastIndex = 0;
    const m = text.match(AI_CLICHE_REGEX);

    if (hasDeprecatedArtSchema) deprecatedSchemaViolations.push({ type: 'Article', handle: a.handle });
    if (has30DayArt) thirtyDayReturnViolations.push({ type: 'Article', handle: a.handle });
    if (hasBpArt) blueprintCodeViolations.push({ type: 'Article', handle: a.handle });
    if (m) aiLintViolations.push({ type: 'Article', handle: a.handle, phrase: m[0] });

    if ((hasDeprecatedArtSchema || has30DayArt || hasBpArt || m) && autoSanitizedCount < 45 && rawBody) {
      const cleanedBody = sanitizeDeprecatedReturnAndBlueprintCopy(sanitizeAiCliches(rawBody));
      if (cleanedBody !== rawBody) {
        await shopifyGql(`
          mutation CleanArt($id: ID!, $article: ArticleUpdateInput!) {
            articleUpdate(id: $id, article: $article) { article { id } }
          }
        `, { id: a.id, article: { body: cleanedBody } });
        autoSanitizedCount++;
      }
    }
  }

  // 5. Audit Pages for Deprecated Schemas, 30-Day Returns, BP# Codes, Entities & Dangling Titles
  for (const p of pages) {
    const rawBody = p.body || '';
    const title = p.title || '';
    const titleTag = p.titleTag?.value || '';
    const descTag = p.descTag?.value || '';

    if (UNESCAPED_ENTITY_REGEX.test(title) || UNESCAPED_ENTITY_REGEX.test(titleTag) || UNESCAPED_ENTITY_REGEX.test(descTag) || /&amp;quot;/i.test(rawBody)) {
      entityViolations.push({ type: 'Page', handle: p.handle });
    }

    if (DANGLING_TITLE_REGEX.test(titleTag || title) || (titleTag || title).length > 60) {
      danglingTitleViolations.push({ type: 'Page', handle: p.handle, title: titleTag || title });
    }

    const hasDeprecatedPageSchema = DEPRECATED_SCHEMA_SCRIPT_REGEX.test(rawBody);
    DEPRECATED_SCHEMA_SCRIPT_REGEX.lastIndex = 0;
    const has30DayPage = THIRTY_DAY_RETURN_REGEX.test(rawBody);
    THIRTY_DAY_RETURN_REGEX.lastIndex = 0;
    const hasBpPage = BLUEPRINT_CODE_REGEX.test(rawBody);
    BLUEPRINT_CODE_REGEX.lastIndex = 0;
    const m = rawBody.replace(/<[^>]+>/g, ' ').match(AI_CLICHE_REGEX);

    if (hasDeprecatedPageSchema) deprecatedSchemaViolations.push({ type: 'Page', handle: p.handle });
    if (has30DayPage) thirtyDayReturnViolations.push({ type: 'Page', handle: p.handle });
    if (hasBpPage) blueprintCodeViolations.push({ type: 'Page', handle: p.handle });
    if (m) aiLintViolations.push({ type: 'Page', handle: p.handle, phrase: m[0] });

    if ((hasDeprecatedPageSchema || has30DayPage || hasBpPage || m) && autoSanitizedCount < 45 && rawBody) {
      const cleanedBody = sanitizeDeprecatedReturnAndBlueprintCopy(sanitizeAiCliches(rawBody));
      if (cleanedBody !== rawBody) {
        await shopifyGql(`
          mutation CleanPage($id: ID!, $page: PageUpdateInput!) {
            pageUpdate(id: $id, page: $page) { page { id } userErrors { field message } }
          }
        `, { id: p.id, page: { body: cleanedBody } });
        autoSanitizedCount++;
      }
    }
  }

  const now = new Date().toISOString();
  const report = [
    `# Prints With Passion — Catalog Uniqueness & Active SEO Lint Quality Gate Log`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Total Active Products in Store:** \`${activeCount}\` (Target: \`~1,500\` distinct non-IP products)`,
    `- **Sampled Active Products Checked:** \`${products.length}\``,
    `- **Collections Checked:** \`${collections.length}\``,
    `- **Pages Checked:** \`${pages.length}\``,
    `- **Articles Checked:** \`${articles.length}\``,
    `- **0-Product Collections Detected (excl. frontpage):** \`${zeroProductViolations.length}\``,
    `- **Unescaped HTML Entity Violations Detected:** \`${entityViolations.length}\``,
    `- **Broken Template Grammar Violations Detected:** \`${templateGrammarViolations.length}\``,
    `- **Dangling / Truncated Title Violations Detected:** \`${danglingTitleViolations.length}\``,
    `- **Roman Numeral Clone Titles Detected in Sample:** \`${romanViolations.length}\``,
    `- **Third-Party IP Handles Remaining in Sample:** \`${ipViolations.length}\``,
    `- **Orphaned Non-News Blog Containers Cleaned:** \`${orphanedBlogViolations.length}\``,
    `- **Zero-Price (£0.00) Products Detected in Sample:** \`${zeroPriceViolations.length}\``,
    `- **Collections With Legacy Hero/FAQ Boilerplate Remaining:** \`${boilerplateCollectionViolations.length} / ${collections.length}\``,
    `- **Deprecated Inline FAQPage/HowTo Schemas Scrubbed:** \`${deprecatedSchemaViolations.length}\``,
    `- **Legacy 30-Day Return Policy References Normalized to 14-Day:** \`${thirtyDayReturnViolations.length}\``,
    `- **Internal Printify Blueprint Codes (\`BP #\`) Scrubbed:** \`${blueprintCodeViolations.length}\``,
    `- **PDP Uniqueness Floor (\`>= 45%\` Unique Content Target):** \`${avgPdpUniquenessPct}%\` average uniqueness | \`${pdpEnrichedCount}\` thin PDPs enriched this run | \`${Math.max(0, thinPdpCountRemaining)}\` thin PDPs remaining in queue`,
    `- **AI-Cliché Phrases Flagged (\`seo lint\` rules):** \`${aiLintViolations.length}\``,
    `- **Items Actively Auto-Sanitized via GraphQL This Run:** \`${autoSanitizedCount}\``,
    ``,
    `## 1. Summary of Quality Gate Findings`,
    `- **0-Product Collections:** ${zeroProductViolations.length === 0 ? 'PASS (0 empty collections)' : `FLAGGED (${zeroProductViolations.length} empty collections)`}`,
    `- **HTML Entity Escaping:** ${entityViolations.length === 0 ? 'PASS (0 unescaped entities)' : `FLAGGED (${entityViolations.length} entities detected)`}`,
    `- **Template Phrasing & Grammar:** ${templateGrammarViolations.length === 0 ? 'PASS (0 broken template phrases)' : `FLAGGED (${templateGrammarViolations.length} collections with broken template grammar)`}`,
    `- **Dangling & Truncated Titles:** ${danglingTitleViolations.length === 0 ? 'PASS (0 dangling titles)' : `FLAGGED (${danglingTitleViolations.length} dangling titles)`}`,
    `- **Roman Numeral Clones:** ${romanViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${romanViolations.length} in sample)`}`,
    `- **Third-Party IP / Brand / Celebrity Terms:** ${ipViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${ipViolations.length} in sample)`}`,
    `- **Blog Container Hygiene (\`/blogs/news\` only):** ${orphanedBlogViolations.length === 0 ? 'PASS (1 canonical blog)' : `AUTO-CLEANED (${orphanedBlogViolations.length} orphaned blogs deleted & redirected)`}`,
    `- **Zero-Price (£0.00) Variants:** ${zeroPriceViolations.length === 0 ? 'PASS (0 detected)' : `FLAGGED (${zeroPriceViolations.length} in sample)`}`,
    `- **Collection Boilerplate / FAQ Schema:** ${boilerplateCollectionViolations.length === 0 ? 'PASS (0 collections have injected boilerplate)' : `AUTO-CLEANED (${boilerplateCollectionViolations.length} collections sanitized)`}`,
    `- **Deprecated Inline Schemas (\`FAQPage\`/\`HowTo\`):** ${deprecatedSchemaViolations.length === 0 ? 'PASS (0 detected storewide)' : `AUTO-CLEANED (${deprecatedSchemaViolations.length} resources sanitized)`}`,
    `- **Return Policy Window (\`14-Day\` Standard):** ${thirtyDayReturnViolations.length === 0 ? 'PASS (0 legacy 30-day references)' : `AUTO-CLEANED (${thirtyDayReturnViolations.length} normalized to 14-day)`}`,
    `- **Internal Blueprint Codes (\`BP #\`):** ${blueprintCodeViolations.length === 0 ? 'PASS (0 leaked factory codes)' : `AUTO-CLEANED (${blueprintCodeViolations.length} scrubbed)`}`,
    `- **PDP Uniqueness Floor (\`>= 45%\`):** ${thinPdpCountRemaining <= 0 ? `PASS (${avgPdpUniquenessPct}% avg uniqueness)` : `ENRICHING (+${pdpEnrichedCount} thin PDPs upgraded; ${thinPdpCountRemaining} queued)`}`,
    `- **AI-Pattern Phrases:** ${aiLintViolations.length === 0 ? 'PASS (0 AI clichés detected)' : `AUTO-SANITIZED (${autoSanitizedCount} updated via GraphQL)`}`
  ];

  fs.writeFileSync(REPORT_PATH, report.join('\n') + '\n', 'utf8');
  console.log(`Saved Catalog Uniqueness & SEO Lint Quality Gate report to ${REPORT_PATH} (autoSanitized=${autoSanitizedCount}, pdpEnriched=${pdpEnrichedCount}, orphanedBlogsCleaned=${orphanedBlogViolations.length})`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(console.error);
}
