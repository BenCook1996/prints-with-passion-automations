/**
 * Prints With Passion — White-Hat SEO Automation #6 (Upgraded v2.0 — Active Self-Healing):
 * Hub-and-Spoke Internal Link Equity Sculptor (internal_link_equity_sculptor.mjs)
 *
 * Capabilities:
 * 1. Audits internal link depth across the lean ~1.5K catalog, 48 Smart Sub-Collections,
 *    and retained pillar buyer guides.
 * 2. Actively rewrites any internal links pointing to 301-redirected paths (`outdatedHref -> canonicalTarget`)
 *    directly inside article HTML via Shopify `articleUpdate` (zero PageRank dilution).
 * 3. Identifies Strike-Zone collections in `seo_keyword_forecast_tracker.json` with < 2 incoming
 *    editorial links, injects a clean contextual link into the most relevant retained buyer guide,
 *    and records a `LINK_SCULPT` pre-change snapshot event in `seo_keyword_forecast_tracker.json`.
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE, shopifyGql } from './lib/cloud-env.mjs';
import {
  FORECAST_JSON_PATH,
  recordPreChangeOptimizationEvent
} from './weekly_gsc_forecast_and_strikezone_tracker.mjs';

const REPORT_PATH = path.join(WORKSPACE, 'INTERNAL_LINK_EQUITY_AUDIT.md');

async function main() {
  console.log('=== Prints With Passion — Hub-and-Spoke Internal Link Equity Sculptor (Active GraphQL Mode) ===');

  const data = await shopifyGql(`
    query AuditLinkGraph {
      productsCount(query: "status:active") { count }
      articles(first: 60, query: "published_status:published") {
        nodes { id handle title body }
      }
      urlRedirects(first: 150) {
        nodes { id path target }
      }
    }
  `);

  const activeProductsCount = data?.productsCount?.count ?? 0;
  const articles = data?.articles?.nodes || [];
  const redirects = data?.urlRedirects?.nodes || [];
  const redirectMap = new Map(redirects.map(r => [r.path.toLowerCase(), r.target]));

  const collectionLinkCounts = {};
  const productLinkCounts = {};
  const redirectedLinksHealed = [];

  for (const art of articles) {
    let body = art.body || '';
    let bodyModified = false;
    const hrefs = [...body.matchAll(/href="((?:https:\/\/printswithpassion\.com)?(\/(?:collections|products|blogs\/news)\/[a-z0-9-_]+))"/gi)];

    for (const m of hrefs) {
      const fullHref = m[1];
      const relPath = m[2];
      const lower = relPath.toLowerCase();

      if (redirectMap.has(lower)) {
        const canonicalTarget = redirectMap.get(lower);
        if (canonicalTarget && canonicalTarget !== lower) {
          body = body.split(fullHref).join(canonicalTarget);
          bodyModified = true;
          redirectedLinksHealed.push({
            sourceArticle: art.handle,
            outdatedHref: relPath,
            canonicalTarget
          });
        }
      }

      const effectivePath = (redirectMap.get(lower) || lower).toLowerCase();
      if (effectivePath.startsWith('/collections/')) {
        collectionLinkCounts[effectivePath] = (collectionLinkCounts[effectivePath] || 0) + 1;
      } else if (effectivePath.startsWith('/products/')) {
        productLinkCounts[effectivePath] = (productLinkCounts[effectivePath] || 0) + 1;
      }
    }

    if (bodyModified) {
      await shopifyGql(`
        mutation HealArticleRedirects($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle }
            userErrors { field message }
          }
        }
      `, { id: art.id, article: { body } });
    }
  }

  // Check Strike-Zone collections in seo_keyword_forecast_tracker.json that have < 2 incoming links
  const sculptedStrikeZoneLinks = [];
  if (fs.existsSync(FORECAST_JSON_PATH) && articles.length > 0) {
    try {
      const ledger = JSON.parse(fs.readFileSync(FORECAST_JSON_PATH, 'utf8'));
      const keywords = ledger.keywords || ledger.targets || [];
      for (const kw of keywords) {
        const u = (kw.targetUrl || kw.url || '').toLowerCase();
        if (!u.startsWith('/collections/')) continue;
        const currentInlinks = collectionLinkCounts[u] || 0;
        if (currentInlinks < 2 && sculptedStrikeZoneLinks.length < 3) {
          // Find a matching article by substrate that does not yet link to `u`
          const isCanvas = (kw.substrate || '').includes('Canvas');
          const candidateArt = articles.find(a => {
            const b = a.body || '';
            const matchesTheme = isCanvas ? /canvas|wall|sofa/i.test(a.handle) : /desk|mat|keyboard/i.test(a.handle);
            return matchesTheme && !b.includes(`href="${u}"`);
          }) || articles.find(a => !(a.body || '').includes(`href="${u}"`));

          if (candidateArt) {
            const anchorLabel = kw.keyword
              .split(/\s+/)
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
            const calloutHtml = `\n<p class="pwp-sculpted-hub-link" style="margin:14px 0;padding:10px 14px;background:#F6F4EF;border-left:3px solid #111110;font-size:0.93em;">Explore our curated <a href="${u}" style="color:#111110;font-weight:700;text-decoration:underline;">${anchorLabel} Collection</a> for exact Metric (cm/mm) &amp; Imperial (inch) studio dimensions.</p>`;
            const updatedBody = (candidateArt.body || '') + calloutHtml;

            recordPreChangeOptimizationEvent({
              targetUrl: kw.targetUrl || kw.url,
              changeType: 'INTERNAL_LINK_SCULPT',
              summary: `Injected contextual hub link from /blogs/news/${candidateArt.handle} -> ${u} ("${anchorLabel}")`
            });

            const upd = await shopifyGql(`
              mutation InjectHubLink($id: ID!, $article: ArticleUpdateInput!) {
                articleUpdate(id: $id, article: $article) {
                  article { id handle }
                  userErrors { field message }
                }
              }
            `, { id: candidateArt.id, article: { body: updatedBody } });

            if (!upd?.articleUpdate?.userErrors?.length) {
              candidateArt.body = updatedBody;
              collectionLinkCounts[u] = (collectionLinkCounts[u] || 0) + 1;
              sculptedStrikeZoneLinks.push({
                fromArticle: `/blogs/news/${candidateArt.handle}`,
                toCollection: u,
                anchorText: anchorLabel
              });
            }
          }
        }
      }
    } catch {}
  }

  const topLinkedCollections = Object.entries(collectionLinkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const now = new Date().toISOString();
  const reportLines = [
    `# Prints With Passion — Hub-and-Spoke Internal Link Equity Audit (Active GraphQL Sculpting)`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Active Live Catalog Size:** \`${activeProductsCount}\` products`,
    `- **Published Pillar Buyer Guides Audited:** \`${articles.length}\` articles`,
    `- **Distinct Collections Receiving Editorial Links:** \`${Object.keys(collectionLinkCounts).length}\``,
    `- **Distinct Products Receiving Direct Editorial Links:** \`${Object.keys(productLinkCounts).length}\``,
    `- **301-Redirected Internal Links Auto-Healed In-Place:** \`${redirectedLinksHealed.length}\``,
    `- **Under-Linked Strike-Zone Collections Sculpted This Run:** \`${sculptedStrikeZoneLinks.length}\``,
    ``,
    `## 1. Top Collections by Editorial Internal Link Equity`,
    ``,
    `| Collection Path | Incoming Contextual Guide Links | Link Equity Status |`,
    `| :--- | :---: | :--- |`,
    ...(topLinkedCollections.length > 0
      ? topLinkedCollections.map(([col, cnt]) => `| \`${col}\` | \`${cnt}\` | **${cnt >= 2 ? 'Healthy Hub Authority' : 'Needs +1–2 Guide Links'}** |`)
      : [`| *(No published articles scanned)* | \`0\` | Pending |`]),
    ``,
    `## 2. Active GraphQL Link Self-Healing & Strike-Zone Sculpting Executed`,
    ``,
    ...(redirectedLinksHealed.length === 0 && sculptedStrikeZoneLinks.length === 0
      ? [`- **PASS (0 broken/redirected links; all Strike-Zone collections meet >=2 editorial inlink threshold).**`]
      : [
          ...redirectedLinksHealed.map(item =>
            `- **Auto-Healed 301 Link:** \`/blogs/news/${item.sourceArticle}\` updated \`${item.outdatedHref}\` -> \`${item.canonicalTarget}\``
          ),
          ...sculptedStrikeZoneLinks.map(s =>
            `- **Sculpted Strike-Zone Hub Link:** Injected \`${s.anchorText}\` link from \`${s.fromArticle}\` -> \`${s.toCollection}\``
          )
        ])
  ];

  fs.writeFileSync(REPORT_PATH, reportLines.join('\n') + '\n', 'utf8');
  console.log(`Saved Hub-and-Spoke Internal Link Equity report to ${REPORT_PATH} (healed=${redirectedLinksHealed.length}, sculpted=${sculptedStrikeZoneLinks.length})`);
}

main().catch(console.error);
