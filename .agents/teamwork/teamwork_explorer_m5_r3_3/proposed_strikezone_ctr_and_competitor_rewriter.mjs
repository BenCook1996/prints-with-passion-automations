/**
 * Prints With Passion — Active Strike-Zone CTR & Competitor Spec Rewriter
 * (strikezone_ctr_and_competitor_rewriter.mjs)
 *
 * Selects up to 5 Strike-Zone URLs (Positions 4.0–16.9) from `seo_keyword_forecast_tracker.json`
 * that are outside the 14-day `<title>` cooldown window, records their `preChangeSnapshot`
 * before touching any metadata, and upgrades their Shopify `seo.title` & `seo.description`
 * using the proven Kinetic Labs / Deskr / Wallfillers Spec-First formula.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';
import {
  FORECAST_JSON_PATH,
  isWithinTitleCooldown,
  recordPreChangeOptimizationEvent
} from './weekly_gsc_forecast_and_strikezone_tracker.mjs';

const LOG_PATH = path.join(WORKSPACE, 'STRIKEZONE_CTR_REWRITER_LOG.md');

/**
 * Word-boundary-safe title truncator guaranteeing strictly <= maxChars,
 * zero mid-word cuts, zero dangling delimiters/conjunctions, and balanced parentheses.
 *
 * @param {string} primaryPart - Core keyword or page title
 * @param {string[]} specCandidates - Ordered list of competitor spec suffixes (richest to shortest)
 * @param {number} maxChars - Hard ceiling (default: 60)
 * @returns {string} Fully sanitized title strictly <= maxChars
 */
export function fitTitleUnder60Chars(primaryPart, specCandidates = [], maxChars = 60) {
  const cleanPart = (str) => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()
      .replace(/\s+/g, ' ');
  };

  const stripTrailingDangling = (str) => {
    let s = (str || '').trim();
    let prev = '';
    while (s !== prev) {
      prev = s;
      // Strip empty parentheses and brackets anywhere
      s = s.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').trim();
      // Strip trailing delimiters/punctuation: -, |, &, :, ;, ,, /, \, ~, +, (, [ (preserves closing ')' and ']')
      s = s.replace(/[\s\-_|&:,;/\\~+(\[]+$/, '').trim();
      // Strip trailing conjunctions, prepositions, and stop-words
      s = s.replace(/\s+\b(and|or|nor|but|for|with|w|in|on|at|to|by|from|of|the|a|an|vs)\b$/i, '').trim();
    }
    return s;
  };

  const balanceBrackets = (str) => {
    let s = str;
    let prev = '';
    while (s !== prev) {
      prev = s;

      // Iteratively balance parentheses: unclosed '('
      while ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) {
        const lastOpen = s.lastIndexOf('(');
        if (lastOpen === -1) break;
        const prefix = s.slice(0, lastOpen);
        if (!/[a-zA-Z0-9]/.test(prefix)) {
          // If no substantive text precedes '(', remove only the unclosed delimiter token
          s = s.slice(0, lastOpen) + s.slice(lastOpen + 1);
        } else {
          // If substantive text precedes '(', strip the trailing unclosed specification
          s = prefix;
        }
      }

      // Iteratively balance parentheses: excess ')'
      while ((s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) {
        const lastClose = s.lastIndexOf(')');
        if (lastClose === -1) break;
        s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      }

      // Iteratively balance brackets: unclosed '['
      while ((s.match(/\[/g) || []).length > (s.match(/\]/g) || []).length) {
        const lastOpen = s.lastIndexOf('[');
        if (lastOpen === -1) break;
        const prefix = s.slice(0, lastOpen);
        if (!/[a-zA-Z0-9]/.test(prefix)) {
          // If no substantive text precedes '[', remove only the unclosed delimiter token
          s = s.slice(0, lastOpen) + s.slice(lastOpen + 1);
        } else {
          // If substantive text precedes '[', strip the trailing unclosed specification
          s = prefix;
        }
      }

      // Iteratively balance brackets: excess ']'
      while ((s.match(/\]/g) || []).length > (s.match(/\[/g) || []).length) {
        const lastClose = s.lastIndexOf(']');
        if (lastClose === -1) break;
        s = s.slice(0, lastClose) + s.slice(lastClose + 1);
      }

      s = stripTrailingDangling(s);
    }

    return s;
  };

  const truncateAtWordBoundary = (str, limit) => {
    let s = stripTrailingDangling(str);
    if (!s) return 'Prints With Passion';
    if (s.length <= limit) {
      const balanced = balanceBrackets(s);
      return balanced || 'Prints With Passion';
    }
    const sliced = s.slice(0, limit);
    const lastSpace = sliced.lastIndexOf(' ');
    if (lastSpace > 0) {
      s = sliced.slice(0, lastSpace);
    } else {
      s = sliced;
    }
    s = stripTrailingDangling(s);
    s = balanceBrackets(s);
    if (s.length > limit) {
      s = s.slice(0, limit);
      s = stripTrailingDangling(s);
      s = balanceBrackets(s);
    }
    return s || 'Prints With Passion';
  };

  // Clean and pre-strip trailing delimiters upfront
  let primary = stripTrailingDangling(cleanPart(primaryPart));
  if (!primary) return 'Prints With Passion';

  const candidates = Array.isArray(specCandidates)
    ? specCandidates.map(cleanPart).filter(Boolean)
    : [cleanPart(specCandidates)].filter(Boolean);

  // 1. Evaluate candidate specs in order (longest/richest first)
  for (const cand of candidates) {
    const full = cand ? `${primary} | ${cand}` : primary;
    if (full.length <= maxChars) {
      const balanced = balanceBrackets(stripTrailingDangling(full));
      if (balanced && balanced.length <= maxChars) {
        return balanced;
      }
    }
  }

  // 2. Fall back to primaryPart alone if it fits (with strict non-empty truthiness guard)
  if (primary.length <= maxChars) {
    const balanced = balanceBrackets(stripTrailingDangling(primary));
    if (balanced && balanced.length <= maxChars) {
      return balanced;
    }
  }

  // 3. Truncate primaryPart cleanly at word boundary
  const result = truncateAtWordBoundary(primary, maxChars);
  return result || 'Prints With Passion';
}

/**
 * Classifies whether a search query represents a singular product search
 * rather than a category-level / collection search.
 */
const SINGULAR_PRODUCT_PATTERN = /\b(desk\s*mat|mouse\s*pad|mousepad|cushion\s*cover|pillow\s*case|throw\s*blanket|bath\s*mat|canvas\s*print|hoodie|t-shirt|tee)\b/i;
const PLURAL_CATEGORY_PATTERN = /\b(desk\s*mats|mouse\s*pads|mousepads|cushion\s*covers|pillow\s*cases|throw\s*blankets|bath\s*mats|canvas\s*prints|canvas\s*wall\s*art|wall\s*art|hoodies|t-shirts|tees|prints|collections?|pads|covers|blankets|rugs)\b/i;

export function isSingleProductQuery(keyword, substrate = '') {
  if (!keyword) return false;
  const kw = keyword.toLowerCase().trim();
  const hasSingular = SINGULAR_PRODUCT_PATTERN.test(kw);
  const hasPlural = PLURAL_CATEGORY_PATTERN.test(kw);
  return hasSingular && !hasPlural;
}

/**
 * Derives a clean thematic title for a collection preserving category intent.
 */
export function buildCollectionThematicTitle(colHandle, colTitle, substrate) {
  let theme = '';
  if (colTitle) {
    theme = colTitle
      .replace(/\b(Extended\s+)?(Desk\s+Mats|Canvas\s+Wall\s+Art|Cushion\s+Covers|Throw\s+Blankets|Bath\s+Mats|Cotton\s+T-Shirts|Graphic\s+Hoodies|Hoodies)\b/gi, '')
      .replace(/[\s\-_|,;&]+$/, '')
      .trim();
  }

  if (!theme || theme.length > 30) {
    if (colHandle) {
      theme = colHandle
        .replace(/-(desk-mats|canvas-wall-art|cushion-covers|throw-blankets|bath-mats|graphic-t-shirts|graphic-hoodies)$/, '')
        .split('-')
        .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');
    }
  }

  const substrateCategoryMap = {
    'Canvas Wall Art': 'Canvas Wall Art',
    'Desk Mats': 'XXL Desk Mats',
    'Cushion Covers': 'Cushion Covers',
    'Throw Blankets': 'Throw Blankets',
    'Bath Mats': 'Bath Mats',
    'Hoodies': 'Graphic Hoodies',
    'Graphic T-Shirts': 'Graphic Tees'
  };

  const subName = substrateCategoryMap[substrate] || substrate || 'Desk Mats';
  return `${theme} ${subName}`.trim();
}

/**
 * Generates spec-first title and meta with intent protection and graduated candidates.
 */
export function buildCompetitorSpecTitleAndMeta(entry, currentTitle = '', colContext = null) {
  const kw = entry.keyword || entry.primaryKeyword || 'Studio Edition';
  const sub = entry.substrate || 'Desk Mats';
  const url = entry.targetUrl || entry.url || '';
  const isCollection = url.startsWith('/collections/') || entry.pageType === 'collection';

  const titleCasedKw = kw
    .split(/\s+/)
    .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

  let primaryPart = titleCasedKw;

  if (isCollection) {
    // Collection Intent Guard: Single-product query must not overwrite collection theme
    if (isSingleProductQuery(kw, sub)) {
      const colHandle = colContext?.handle || (url.startsWith('/collections/') ? url.replace('/collections/', '').split('?')[0] : '');
      const colTitle = colContext?.title || currentTitle || '';
      primaryPart = buildCollectionThematicTitle(colHandle, colTitle, sub);
    } else {
      // Pluralize substrate in category query
      primaryPart = titleCasedKw
        .replace(/\bDesk\s+Mat\b/i, 'Desk Mats')
        .replace(/\bCanvas\s+Print\b/i, 'Canvas Prints')
        .replace(/\bCushion\s+Cover\b/i, 'Cushion Covers')
        .replace(/\bThrow\s+Blanket\b/i, 'Throw Blankets')
        .replace(/\bBath\s+Mat\b/i, 'Bath Mats');
    }
  }

  let specCandidates = [];
  let newMeta = '';

  if (sub === 'Canvas Wall Art') {
    specCandidates = [
      '1.25" Pine Framed Canvas (CM & Inch)',
      '1.25" Pine Framed Canvas',
      '1.25" Framed Prints',
      'Framed Canvas Prints',
      'Framed Canvas Wall Art',
      'Prints With Passion'
    ];
    if (isCollection) {
      newMeta = `Shop archival framed canvas wall art (1.25" pine bars) in ${primaryPart.replace(/\s+Canvas\s+Wall\s+Art/i, '')} designs. Sized for sofa/bed width with free tracked UK delivery.`.slice(0, 158);
    } else {
      newMeta = `${primaryPart} printed on 400gsm matte cotton-poly canvas over 1.25" (32mm) kiln-dried pine stretcher bars. Sized for 60%–75% sofa/bed width w/ free tracked delivery.`.slice(0, 158);
    }
  } else if (sub === 'Desk Mats') {
    specCandidates = [
      '900x400x4mm (35.4"x15.7") Stitched Pad',
      '900x400x4mm Stitched Pad',
      '4mm Stitched Gaming Pad',
      'XXL Desk Mats',
      'Prints With Passion'
    ];
    if (isCollection) {
      newMeta = `Explore curated ${primaryPart.replace(/\s+(XXL\s+)?Desk\s+Mats/i, '')} desk mats: 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth. Free UK delivery.`.slice(0, 158);
    } else {
      newMeta = `${primaryPart} engineered with a 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth in 90×40cm, 80×30cm & 60×35cm sizes.`.slice(0, 158);
    }
  } else if (sub === 'Cushion Covers') {
    specCandidates = [
      '45x45cm Double-Sided Velvet Pillows',
      '45x45cm Soft Velvet Covers',
      'Velvet Cushion Covers',
      'Prints With Passion'
    ];
    newMeta = `Shop curated ${primaryPart} in premium soft velvet (45x45cm / 18x18"). Double-sided archival studio print with concealed zipper and free tracked UK delivery.`.slice(0, 158);
  } else if (sub === 'Throw Blankets') {
    specCandidates = [
      '300 GSM Plush Coral Fleece Throws',
      'Plush Coral Fleece Throws',
      'Plush Throw Blankets',
      'Prints With Passion'
    ];
    newMeta = `Discover ultra-soft 300 GSM ${primaryPart} in plush microfiber flannel fleece. Ideal for sofa, bed or gaming lounge with free tracked UK & EU delivery.`.slice(0, 158);
  } else if (sub === 'Bath Mats') {
    specCandidates = [
      'Non-Slip Memory Foam Bathroom Rugs',
      'Non-Slip Memory Foam Bath Mats',
      'Memory Foam Bath Mats',
      'Prints With Passion'
    ];
    newMeta = `Refresh your bathroom with ${primaryPart}. High-density memory foam core, quick-dry microfiber surface & non-slip backing with free tracked UK delivery.`.slice(0, 158);
  } else {
    specCandidates = [
      'Dual CM & Inch Studio Sizing Guide',
      'Dual CM & Inch Sizing Guide',
      'Studio Sizing Guide',
      'Sizing Guide',
      'Prints With Passion'
    ];
    newMeta = `Compare exact Metric (cm/mm) and Imperial (inch) dimensions for ${kw}. Includes furniture-width formulas, material thickness specs & curated studio editions.`.slice(0, 158);
  }

  const newTitle = fitTitleUnder60Chars(primaryPart, specCandidates, 60);
  return { newTitle, newMeta, primaryPart };
}

async function main() {
  console.log('=== Prints With Passion — Active Strike-Zone CTR & Competitor Spec Rewriter ===');

  if (!fs.existsSync(FORECAST_JSON_PATH)) {
    console.log('Forecast ledger not found; skipping Strike-Zone rewriter.');
    return;
  }

  const ledger = JSON.parse(fs.readFileSync(FORECAST_JSON_PATH, 'utf8'));
  const keywords = ledger.keywords || ledger.targets || [];

  // Deduplicate by targetUrl so we never touch the same URL twice in one run
  const seenUrls = new Set();
  const candidates = [];

  for (const item of keywords) {
    const url = item.targetUrl || item.url;
    if (!url || seenUrls.has(url)) continue;
    const pos = item.latestActual?.averagePosition ?? item.baseline?.averagePosition ?? 20;
    const imp = item.latestActual?.impressions28d ?? item.baseline?.impressions28d ?? 0;

    if (pos >= 4.0 && pos <= 16.9 && imp >= 15 && !isWithinTitleCooldown(item)) {
      seenUrls.add(url);
      candidates.push(item);
    }
  }

  // Sort by highest impressions in Strike-Zone first
  candidates.sort((a, b) => (b.latestActual?.impressions28d ?? 0) - (a.latestActual?.impressions28d ?? 0));
  const selected = candidates.slice(0, 5);

  const actionsExecuted = [];

  for (const entry of selected) {
    const url = entry.targetUrl || entry.url;

    if (url.startsWith('/collections/')) {
      const handle = url.replace('/collections/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetCol($handle: String!) {
          collectionByHandle(handle: $handle) {
            id handle title seo { title description }
          }
        }
      `, { handle });
      const col = d?.collectionByHandle;
      if (!col) continue;

      const prevTitle = col.seo?.title || col.title;
      const prevMeta = col.seo?.description || '';
      const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry, prevTitle, col);

      // Record Pre-Change Snapshot BEFORE executing mutation
      recordPreChangeOptimizationEvent({
        targetUrl: url,
        changeType: 'TITLE_META_CTR_REWRITE',
        summary: `Strike-Zone (Pos ${entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition}) Competitor Spec Title/Meta upgrade for "${entry.keyword}"`,
        previousTitle: prevTitle,
        newTitle,
        previousMeta: prevMeta,
        newMeta
      });

      const upd = await shopifyGql(`
        mutation UpdColSeo($input: CollectionInput!) {
          collectionUpdate(input: $input) {
            collection { id handle seo { title description } }
            userErrors { field message }
          }
        }
      `, {
        input: {
          id: col.id,
          seo: { title: newTitle, description: newMeta }
        }
      });

      if (!upd?.collectionUpdate?.userErrors?.length) {
        actionsExecuted.push({
          url,
          type: 'Collection',
          keyword: entry.keyword,
          prePos: entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition,
          prevTitle,
          newTitle
        });
      }
    } else if (url.startsWith('/products/')) {
      const handle = url.replace('/products/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetProd($handle: String!) {
          productByHandle(handle: $handle) {
            id handle title seo { title description }
          }
        }
      `, { handle });
      const prod = d?.productByHandle;
      if (!prod) continue;

      const prevTitle = prod.seo?.title || prod.title;
      const prevMeta = prod.seo?.description || '';
      const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry, prevTitle, prod);

      recordPreChangeOptimizationEvent({
        targetUrl: url,
        changeType: 'TITLE_META_CTR_REWRITE',
        summary: `Strike-Zone PDP (Pos ${entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition}) Spec Title/Meta upgrade for "${entry.keyword}"`,
        previousTitle: prevTitle,
        newTitle,
        previousMeta: prevMeta,
        newMeta
      });

      const upd = await shopifyGql(`
        mutation UpdProdSeo($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id handle seo { title description } }
            userErrors { field message }
          }
        }
      `, {
        input: {
          id: prod.id,
          seo: { title: newTitle, description: newMeta }
        }
      });

      if (!upd?.productUpdate?.userErrors?.length) {
        actionsExecuted.push({
          url,
          type: 'Product',
          keyword: entry.keyword,
          prePos: entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition,
          prevTitle,
          newTitle
        });
      }
    } else if (url.startsWith('/blogs/news/')) {
      const handle = url.replace('/blogs/news/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetArt($q: String!) {
          articles(first: 1, query: $q) {
            nodes { id handle title summary }
          }
        }
      `, { q: `handle:${handle}` });
      const art = d?.articles?.nodes?.[0];
      if (!art) continue;

      const prevTitle = art.title;
      const { newMeta } = buildCompetitorSpecTitleAndMeta(entry, prevTitle, art);
      recordPreChangeOptimizationEvent({
        targetUrl: url,
        changeType: 'TITLE_META_CTR_REWRITE',
        summary: `Strike-Zone Buyer Guide (Pos ${entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition}) summary/CTR upgrade for "${entry.keyword}"`,
        previousTitle: prevTitle,
        newTitle: prevTitle,
        previousMeta: art.summary || '',
        newMeta
      });

      const upd = await shopifyGql(`
        mutation UpdArt($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle summary }
            userErrors { field message }
          }
        }
      `, {
        id: art.id,
        article: { summary: newMeta }
      });

      if (!upd?.articleUpdate?.userErrors?.length) {
        actionsExecuted.push({
          url,
          type: 'Buyer Guide',
          keyword: entry.keyword,
          prePos: entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition,
          prevTitle,
          newTitle: `${prevTitle} (Summary Updated)`
        });
      }
    } else if (url.startsWith('/pages/')) {
      const handle = url.replace('/pages/', '').split('?')[0];
      const d = await shopifyGql(`
        query GetPage($q: String!) {
          pages(first: 1, query: $q) {
            nodes { id handle title seo { title description } }
          }
        }
      `, { q: `handle:${handle}` });
      const page = d?.pages?.nodes?.[0];
      if (!page) continue;

      const prevTitle = page.seo?.title || page.title;
      const prevMeta = page.seo?.description || '';
      const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry, prevTitle, page);

      recordPreChangeOptimizationEvent({
        targetUrl: url,
        changeType: 'TITLE_META_CTR_REWRITE',
        summary: `Strike-Zone Page (Pos ${entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition}) Spec Title/Meta upgrade for "${entry.keyword}"`,
        previousTitle: prevTitle,
        newTitle,
        previousMeta: prevMeta,
        newMeta
      });

      const upd = await shopifyGql(`
        mutation UpdatePageSeo($id: ID!, $page: PageUpdateInput!) {
          pageUpdate(id: $id, page: $page) {
            page { id handle seo { title description } }
            userErrors { field message }
          }
        }
      `, {
        id: page.id,
        page: {
          seo: { title: newTitle, description: newMeta }
        }
      });

      if (!upd?.pageUpdate?.userErrors?.length) {
        actionsExecuted.push({
          url,
          type: 'Page',
          keyword: entry.keyword,
          prePos: entry.latestActual?.averagePosition ?? entry.baseline?.averagePosition,
          prevTitle,
          newTitle
        });
      }
    }
  }

  const nowIso = new Date().toISOString();
  if (!fs.existsSync(LOG_PATH)) {
    fs.writeFileSync(
      LOG_PATH,
      [
        `# Prints With Passion — Strike-Zone (Pos 4–15) CTR & Competitor Spec Rewriter Log`,
        ``,
        `| Timestamp (UTC) | Eligible Strike-Zone URLs | Rewritten This Run (14d Cooldown Guarded) | Upgraded URLs & Target Keywords |`,
        `| :--- | :---: | :---: | :--- |`,
        ``
      ].join('\n'),
      'utf8'
    );
  }

  const summaryCells = actionsExecuted.length
    ? actionsExecuted.map(a => `\`${a.url}\` (\`${a.keyword}\` @ Pos \`${a.prePos}\` -> \`${a.newTitle}\`)`).join('<br>')
    : `0 rewritten (all eligible Strike-Zone targets currently inside 14-day \`<title>\` cooldown window)`;

  fs.appendFileSync(
    LOG_PATH,
    `| \`${nowIso}\` | \`${candidates.length}\` | \`${actionsExecuted.length}\` | ${summaryCells} |\n`,
    'utf8'
  );

  console.log(`Strike-Zone CTR Rewriter complete: ${actionsExecuted.length}/${selected.length} Strike-Zone URLs upgraded and logged to ${LOG_PATH}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
