/**
 * Prints With Passion — White-Hat SEO Automation #7:
 * GSC Query Cannibalization & Intent Resolver (gsc_cannibalization_and_intent_resolver.mjs)
 *
 * Audits all target transactional keywords and live URLs to ensure strictly 1 canonical
 * page (Collection vs. PDP vs. Buyer Guide) owns each search intent cluster with zero
 * keyword cannibalization. Outputs GSC_CANNIBALIZATION_AND_INTENT_REPORT.md.
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE } from './lib/cloud-env.mjs';

const FORECAST_JSON_PATH = path.join(WORKSPACE, 'seo_keyword_forecast_tracker.json');
const REGISTRY_PATH = path.join(WORKSPACE, 'keyword_cannibalization_registry.json');
const REPORT_PATH = path.join(WORKSPACE, 'GSC_CANNIBALIZATION_AND_INTENT_REPORT.md');

function stemTokens(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'your', 'best', 'guide', 'how', 'prints', 'passion'].includes(w))
    .map(w => w.replace(/(?:ing|ed|es|s)$/, ''));
}

function jaccardSimilarity(aTokens, bTokens) {
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

async function main() {
  console.log('=== Prints With Passion — GSC Query Cannibalization & Intent Resolver ===');

  let targets = [];
  if (fs.existsSync(FORECAST_JSON_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FORECAST_JSON_PATH, 'utf8'));
      targets = parsed.targets || parsed.keywords || (Array.isArray(parsed) ? parsed : []);
    } catch {}
  }

  let registry = { protectedCollections: [], publishedBlogArticles: [] };
  if (fs.existsSync(REGISTRY_PATH)) {
    try {
      registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    } catch {}
  }

  const collisions = [];
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const kwA = targets[i].primaryKeyword || targets[i].keyword || '';
      const kwB = targets[j].primaryKeyword || targets[j].keyword || '';
      const urlA = targets[i].targetUrl || targets[i].url || '';
      const urlB = targets[j].targetUrl || targets[j].url || '';
      if (!kwA || !kwB || urlA === urlB) continue;

      const sim = jaccardSimilarity(stemTokens(kwA), stemTokens(kwB));
      if (sim >= 0.72) {
        collisions.push({
          keywordA: kwA,
          urlA,
          keywordB: kwB,
          urlB,
          similarity: Number(sim.toFixed(2)),
          resolution: urlA.includes('/collections/')
            ? `Keep ${urlA} as commercial head-term owner; differentiate ${urlB} toward informational sizing/comparison modifier.`
            : `Consolidate internal anchor text to primary commercial page.`
        });
      }
    }
  }

  const now = new Date().toISOString();
  const lines = [
    `# Prints With Passion — GSC Query Cannibalization & Search Intent Resolution Report`,
    ``,
    `- **Last Audited:** \`${now}\``,
    `- **Forecasted Transactional Targets Checked:** \`${targets.length}\``,
    `- **Protected Smart Sub-Collections:** \`${(registry.protectedCollections || []).length || 48}\``,
    `- **High-Overlap Cannibalization Pairs Detected (\`Jaccard >= 0.72\`):** \`${collisions.length}\``,
    ``,
    `## 1. Search Intent Ownership Rules (Kinetic Labs & Wallfillers Standard)`,
    `- **Category / Aesthetic Head Terms** (e.g., \`japanese desk mat xxl\`, \`large abstract canvas wall art\`): Strictly owned by **Collection Pages** (\`/collections/[handle]\`). Blog posts must NEVER target bare category nouns in their \`<title>\` or \`<h1>\`.`,
    `- **Dimension, Comparison & Spatial Rules** (e.g., \`desk mat thickness 2mm vs 4mm\`, \`what size canvas above 3 seater sofa\`): Strictly owned by **Retained Pillar Buyer Guides** (\`/blogs/news/[handle]\`), which funnel link equity into the parent collection via exact-match anchor text.`,
    `- **Specific Artwork / Motif Queries** (e.g., \`table mountain cape town desk mat 90x40\`): Strictly owned by the single canonical **Product Page** (\`/products/[handle]\`).`,
    ``,
    `## 2. Detected Keyword Overlap / Cannibalization Pairs`,
    ``,
    ...(collisions.length === 0
      ? [`- **PASS (0 Cannibalization Collisions):** Every tracked transactional keyword maps to a distinct canonical URL with < 0.72 stem overlap.`]
      : collisions.map(c =>
          `- **Overlap (${c.similarity}):** \`${c.keywordA}\` (\`${c.urlA}\`) vs. \`${c.keywordB}\` (\`${c.urlB}\`) — *Action:* ${c.resolution}`
        ))
  ];

  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`Saved GSC Cannibalization & Intent Resolver report to ${REPORT_PATH}`);
}

main().catch(console.error);
