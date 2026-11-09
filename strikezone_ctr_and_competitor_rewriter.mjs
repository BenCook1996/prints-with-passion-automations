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
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';
import {
  FORECAST_JSON_PATH,
  isWithinTitleCooldown,
  recordPreChangeOptimizationEvent
} from './weekly_gsc_forecast_and_strikezone_tracker.mjs';

const LOG_PATH = path.join(WORKSPACE, 'STRIKEZONE_CTR_REWRITER_LOG.md');

function buildCompetitorSpecTitleAndMeta(entry, currentTitle = '') {
  const kw = entry.keyword || entry.primaryKeyword || 'Studio Edition';
  const sub = entry.substrate || 'Desk Mats';
  const titleCasedKw = kw
    .split(/\s+/)
    .map(w => (/^(uk|xxl|xl|mm|cm|gsm|tkl|rgb)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

  if (sub === 'Canvas Wall Art') {
    const newTitle = `${titleCasedKw} | 1.25" Pine Framed Canvas (CM & Inch)`.slice(0, 66);
    const newMeta = `${titleCasedKw} printed on 400gsm matte cotton-poly canvas over 1.25" (32mm) kiln-dried pine stretcher bars. Sized for 60%–75% sofa/bed width w/ free tracked delivery.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  if (sub === 'Desk Mats') {
    const newTitle = `${titleCasedKw} | 900x400x4mm (35.4"x15.7") Stitched Pad`.slice(0, 66);
    const newMeta = `${titleCasedKw} engineered with a 4mm high-density natural rubber base, 360° anti-fray stitched edges & micro-woven cloth in 90×40cm, 80×30cm & 60×35cm sizes.`.slice(0, 158);
    return { newTitle, newMeta };
  }

  const newTitle = `${titleCasedKw} | Dual CM & Inch Studio Sizing Guide`.slice(0, 66);
  const newMeta = `Compare exact Metric (cm/mm) and Imperial (inch) dimensions for ${kw}. Includes furniture-width formulas, material thickness specs & curated studio editions.`.slice(0, 158);
  return { newTitle, newMeta };
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
    const { newTitle, newMeta } = buildCompetitorSpecTitleAndMeta(entry);

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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
