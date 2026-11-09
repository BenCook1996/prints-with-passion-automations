/**
 * Prints With Passion — White-Hat SEO Automation #5:
 * Competitor SERP Diff & Content-Gap Radar (competitor_serp_diff_and_gap_radar.mjs)
 *
 * Benchmarks Prints With Passion's kept collections & buyer guides against
 * top organic competitors (Kinetic Labs, Deskr, Wallfillers, Akua Home) and
 * live SERP intent patterns, outputting COMPETITOR_SERP_GAP_RADAR.md.
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE } from './lib/cloud-env.mjs';

const FORECAST_JSON_PATH = path.join(WORKSPACE, 'seo_keyword_forecast_tracker.json');
const REPORT_OUT_PATH = path.join(WORKSPACE, 'COMPETITOR_SERP_GAP_RADAR.md');

const COMPETITOR_BENCHMARKS = [
  {
    competitor: 'Kinetic Labs (kineticlabs.com)',
    niche: 'XXL Mechanical Keyboard Desk Mats',
    targetUrlExample: 'https://kineticlabs.com/desk-mats',
    winningPatterns: {
      pageType: 'CollectionPage + ItemList (24–48 curated products)',
      copyWordCount: '120–160 words (concise, spec-first, zero promo fluff)',
      schemaUsed: 'WebSite + CollectionPage + BreadcrumbList + ItemList (Zero FAQPage on collections)',
      titleFormula: '[Theme / Aesthetic] Desk Mats | 900x400x4mm Extended Mouse Pads',
      internalLinksPerPage: '18–32 clean category/product links (no sitewide link farm)'
    }
  },
  {
    competitor: 'Deskr (deskr.co)',
    niche: 'Gaming & Topographic Desk Pads',
    targetUrlExample: 'https://deskr.co/collections/desk-pads',
    winningPatterns: {
      pageType: 'CollectionPage + Dual-Unit Spec PDPs',
      copyWordCount: '140–200 words (Metric mm/cm + Imperial inch specs side-by-side)',
      schemaUsed: 'Product + Offer + AggregateRating (verified customer reviews)',
      titleFormula: '[Design Name] Desk Pad — 900x400x4mm (35.4"x15.7") Stitched Mousepad',
      internalLinksPerPage: '20–30 contextual links'
    }
  },
  {
    competitor: 'Wallfillers (wallfillers.co.uk)',
    niche: 'Stretched Canvas Wall Art (UK/US)',
    targetUrlExample: 'https://www.wallfillers.co.uk/collections/large-canvas-wall-art',
    winningPatterns: {
      pageType: 'Room-Intent CollectionPage (Above Sofa / Over Bed / Home Office)',
      copyWordCount: '150–220 words (57-inch eye-level rule + 60%–75% furniture width rule)',
      schemaUsed: 'CollectionPage + BreadcrumbList + Product Offer',
      titleFormula: '[Style / Colour] Canvas Wall Art | Ready-to-Hang Pine Framed Prints',
      internalLinksPerPage: '24–36 room & colour filter links'
    }
  },
  {
    competitor: 'Akua Home (akuahome.co.uk)',
    niche: 'Minimalist & Architectural Wall Decor',
    targetUrlExample: 'https://akuahome.co.uk/collections/all',
    winningPatterns: {
      pageType: 'Curated Gallery Collection + Editorial Sizing Guides',
      copyWordCount: '110–180 words (museum cotton-linen weave, kiln-dried pine bars, zero discount code spam)',
      schemaUsed: 'CollectionPage + BreadcrumbList + BlogPosting',
      titleFormula: '[Minimalist / Abstract] Framed Canvas Art | Archival Studio Editions',
      internalLinksPerPage: '16–24 clean 4-column footer & editorial links'
    }
  }
];

async function checkLivePwpPageMetrics(url) {
  try {
    const t0 = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } });
    const ttfbMs = Date.now() - t0;
    const html = await res.text();
    const sizeKb = Math.round(html.length / 1024);
    const title = ((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
    const hasCollectionFaq = /"@type"\s*:\s*"FAQPage"/i.test(html) && url.includes('/collections/');
    const studio15Count = (html.match(/STUDIO15/g) || []).length;
    const internalLinks = new Set(
      [...html.matchAll(/href="(\/(?:collections|products|pages|blogs)\/[^"#?]+)"/gi)].map(m => m[1])
    ).size;

    return {
      url,
      status: res.status,
      ttfbMs,
      sizeKb,
      title,
      hasCollectionFaq,
      studio15Count,
      internalLinks,
      passesLeanBudget: sizeKb < 750 && !hasCollectionFaq && studio15Count <= 2 && internalLinks <= 65
    };
  } catch (err) {
    return { url, status: 0, error: err.message, passesLeanBudget: false };
  }
}

async function main() {
  console.log('=== Prints With Passion — Competitor SERP Diff & Content-Gap Radar ===');
  const sampleUrls = [
    'https://printswithpassion.com/collections/desk-mats',
    'https://printswithpassion.com/collections/japanese-anime-desk-mats',
    'https://printswithpassion.com/collections/canvas-prints',
    'https://printswithpassion.com/collections/abstract-minimalist-bauhaus-canvas-wall-art',
    'https://printswithpassion.com/products/table-mountain-cape-town-xxl-desk-mat'
  ];

  const liveChecks = [];
  for (const u of sampleUrls) {
    liveChecks.push(await checkLivePwpPageMetrics(u));
  }

  let forecastTargets = [];
  if (fs.existsSync(FORECAST_JSON_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FORECAST_JSON_PATH, 'utf8'));
      forecastTargets = parsed.targets || parsed.keywords || (Array.isArray(parsed) ? parsed : []);
    } catch {}
  }

  const now = new Date().toISOString();
  const lines = [
    `# Prints With Passion — Weekly Competitor SERP Diff & Content-Gap Radar`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Benchmark Competitors:** Kinetic Labs (\`kineticlabs.com\`), Deskr (\`deskr.co\`), Wallfillers (\`wallfillers.co.uk\`), Akua Home (\`akuahome.co.uk\`)`,
    `- **Forecasted Transactional Targets Tracked:** \`${forecastTargets.length}\``,
    ``,
    `## 1. Competitor Structural Benchmarks vs. PWP Target Rules`,
    ``,
    `| Competitor | Niche | Winning Page Type | Copy Length | Schema Formula | Internal Link Density |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...COMPETITOR_BENCHMARKS.map(b =>
      `| **${b.competitor}** | ${b.niche} | ${b.winningPatterns.pageType} | \`${b.winningPatterns.copyWordCount}\` | \`${b.winningPatterns.schemaUsed}\` | \`${b.winningPatterns.internalLinksPerPage}\` |`
    ),
    ``,
    `## 2. Live Storefront Diff vs. Competitor Lean-Page Standards`,
    ``,
    `| Live PWP URL | HTTP | HTML Payload | Internal Links | Collection FAQ Spam | Promo Code Repeats | Competitor Parity Status |`,
    `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |`,
    ...liveChecks.map(c =>
      `| \`${c.url.replace('https://printswithpassion.com', '')}\` | \`${c.status}\` | \`${c.sizeKb || 0} KB\` | \`${c.internalLinks || 0}\` | \`${c.hasCollectionFaq ? 'DETECTED (Strip)' : 'Clean (0)'}\` | \`${c.studio15Count || 0}\` | **${c.passesLeanBudget ? 'PASS (Competitor Parity)' : 'ACTION NEEDED (De-Bloat)'}** |`
    ),
    ``,
    `## 3. Prioritized Weekly Replication Actions`,
    `1. **Collection Above-the-Fold Spec Density (Kinetic Labs / Deskr Pattern):** Keep collection intro copy between **120–200 human words** focused on physical dimensions (\`900x400x4mm\` / \`35.4"x15.7"\`, \`1.25" kiln-dried pine stretcher bars\`, \`300 GSM coral fleece\`) with zero injected \`FAQPage\` JSON-LD.`,
    `2. **Spatial & Furniture-Width Intent Matching (Wallfillers Pattern):** Ensure canvas & throw collections reference furniture-width proportions (\`60%–75% of sofa/desk span\` and \`57-inch eye-level center hang\`).`,
    `3. **Footer & Internal Link Discipline (Akua Home Pattern):** Keep total unique internal links per collection page below **65 links** so PageRank concentrates on the ~1,500 curated designs and 48 sub-collections.`
  ];

  fs.writeFileSync(REPORT_OUT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`Saved Competitor SERP Diff & Content-Gap Radar report to ${REPORT_OUT_PATH}`);
}

main().catch(console.error);
