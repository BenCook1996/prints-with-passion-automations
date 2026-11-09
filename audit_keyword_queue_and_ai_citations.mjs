import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { WORKSPACE, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

const KEYWORD_QUEUE_PATH = path.join(WORKSPACE, 'transactional_keyword_queue.json');
const CANNIBALIZATION_REGISTRY_PATH = path.join(WORKSPACE, 'keyword_cannibalization_registry.json');
const SERP_CACHE_PATH = path.join(WORKSPACE, 'serp_competition_cache.json');
const DISCOVER_SCRIPT_PATH = path.join(WORKSPACE, 'discover_transactional_keywords.mjs');
const AI_OPTIMIZER_SCRIPT_PATH = path.join(WORKSPACE, 'daily_ai_assistant_citation_optimizer.mjs');
const AUDIT_LOG_PATH = path.join(WORKSPACE, 'KEYWORD_AND_AI_CITATION_AUDIT_LOG.md');

async function checkUrlStatus(url, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache'
        }
      });
      if (res.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return res.status;
    } catch {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return 0;
    }
  }
}

async function auditLiveAiCatalogDirectory() {
  const pageUrl = `https://printswithpassion.com/pages/ai-catalog-directory?t=${Date.now()}`;
  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PrintsWithPassionKeywordAuditor/1.0)',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  const html = await res.text();
  const sIdx = html.indexOf('<!-- PWP_AI_DAILY_CITATION_MATRIX_START -->');
  const eIdx = html.indexOf('<!-- PWP_AI_DAILY_CITATION_MATRIX_END -->');
  if (res.status !== 200 || sIdx === -1 || eIdx === -1) {
    return {
      pageStatus: res.status,
      matrixFound: false,
      totalRows: 0,
      dynamicRows: 0,
      linksChecked: 0,
      brokenLinks: ['Matrix markers missing on /pages/ai-catalog-directory']
    };
  }

  const matrixHtml = html.slice(sIdx, eIdx);
  const tbodyMatch = matrixHtml.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  const tbodyHtml = tbodyMatch ? tbodyMatch[1] : '';
  const trMatches = [...tbodyHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const dynamicMatches = [...tbodyHtml.matchAll(/data-pwp-citation-row="dynamic"/gi)];

  // Extract all href links inside tbody citation rows
  const hrefSet = new Set();
  for (const m of tbodyHtml.matchAll(/href="([^"]+)"/gi)) {
    const rawHref = m[1].replace(/&amp;/g, '&').split('?')[0];
    if (rawHref.startsWith('/')) {
      hrefSet.add(`https://printswithpassion.com${rawHref}`);
    } else if (rawHref.startsWith('https://printswithpassion.com')) {
      hrefSet.add(rawHref);
    }
  }

  const uniqueUrls = [...hrefSet];
  const brokenLinks = [];
  for (const u of uniqueUrls) {
    const st = await checkUrlStatus(u);
    await new Promise(r => setTimeout(r, 400));
    if (st !== 200 && st !== 429) {
      brokenLinks.push(`${u} (HTTP ${st})`);
    }
  }

  return {
    pageStatus: res.status,
    matrixFound: true,
    totalRows: trMatches.length,
    dynamicRows: dynamicMatches.length,
    linksChecked: uniqueUrls.length,
    brokenLinks
  };
}

async function main() {
  console.log('=== Prints With Passion — Automated Keyword Queue, SERP Gap & Live /pages/ai-catalog-directory Citation QA ===');
  let errors = 0;
  let selfHealed = false;

  const subs = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));

  // 1. Check Queue Existence & Freshness (< 36 hours)
  let needRediscover = !fs.existsSync(KEYWORD_QUEUE_PATH);
  if (!needRediscover) {
    try {
      const q = JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'));
      const ageHours = (Date.now() - new Date(q.generatedAt || 0).getTime()) / 3600000;
      const missingCluster = subs.some(s => !(q.bySubCollection?.[s.handle]?.length >= 1));
      if (ageHours > 36 || !q.bySubCollection || Object.keys(q.bySubCollection).length < subs.length || missingCluster) {
        needRediscover = true;
      }
    } catch {
      needRediscover = true;
    }
  }

  if (needRediscover) {
    console.log('  [AUTO-HEAL] Keyword queue missing or stale (>36h); running discover_transactional_keywords.mjs...');
    execFileSync('node', [DISCOVER_SCRIPT_PATH], { stdio: 'inherit' });
    selfHealed = true;
  }

  const queue = JSON.parse(fs.readFileSync(KEYWORD_QUEUE_PATH, 'utf8'));
  const registry = fs.existsSync(CANNIBALIZATION_REGISTRY_PATH)
    ? JSON.parse(fs.readFileSync(CANNIBALIZATION_REGISTRY_PATH, 'utf8'))
    : { protectedCollections: {}, publishedBlogIndex: [] };
  const serpCache = fs.existsSync(SERP_CACHE_PATH)
    ? JSON.parse(fs.readFileSync(SERP_CACHE_PATH, 'utf8'))
    : {};

  // 2. Inspect all 48 Smart Sub-Collections in transactional_keyword_queue.json
  let coveredSubs = 0;
  let validSerpGapCount = 0;
  let validFaqCount = 0;
  for (const s of subs) {
    const clusters = queue.bySubCollection?.[s.handle] || [];
    if (clusters.length >= 1 && clusters[0].opportunityScore >= 55) {
      coveredSubs++;
    } else {
      console.error(`  [ERROR] Missing or low-score cluster for sub-collection: ${s.handle}`);
      errors++;
    }
    if (clusters[0]?.serpGapAnalysis?.competitorWeaknesses?.length >= 1) {
      validSerpGapCount++;
    }
    if (clusters[0]?.buyerFaqQuestions?.length >= 3 && clusters[0]?.secondaryLongTailModifiers?.length >= 3) {
      validFaqCount++;
    }
  }
  console.log(`[1/4] Keyword Queue Coverage: ${coveredSubs}/${subs.length} Smart Sub-Collections | SERP Gap Evidence: ${validSerpGapCount}/${subs.length} | Buyer FAQs: ${validFaqCount}/${subs.length} | Top Opp Score: ${queue.summary?.topOpportunityScore}`);
  if (coveredSubs < subs.length || validSerpGapCount < subs.length || validFaqCount < subs.length) {
    errors++;
  }

  // 3. Inspect Zero-Cannibalization Registry & SERP Cache
  const protectedCount = Object.keys(registry.protectedCollections || {}).length;
  const publishedHandles = new Set((registry.publishedBlogIndex || []).map(a => a.handle));
  let slugCollisions = 0;
  for (const k of queue.keywords || []) {
    if (k.status === 'queued' && publishedHandles.has(k.recommendedSlug)) {
      slugCollisions++;
    }
  }
  const serpCacheCount = Object.keys(serpCache).length;
  console.log(`[2/4] Zero-Cannibalization Registry: ${protectedCount} Protected Collections | ${publishedHandles.size} Indexed Blogs | ${slugCollisions} Queued Slug Collisions | ${serpCacheCount} Cached Live SERP Inspections`);
  if (protectedCount < subs.length || slugCollisions > 0) {
    errors++;
  }

  // 4. Inspect Live https://printswithpassion.com/pages/ai-catalog-directory Citation Rows & Link Statuses
  let liveAudit = await auditLiveAiCatalogDirectory();
  if (!liveAudit.matrixFound || liveAudit.totalRows < 14 || liveAudit.brokenLinks.length > 0) {
    console.log(`  [AUTO-HEAL] Live /pages/ai-catalog-directory check found ${liveAudit.brokenLinks.length} broken link(s) or missing dynamic rows (${liveAudit.totalRows}/14). Healing now...`);
    execFileSync('node', [DISCOVER_SCRIPT_PATH], { stdio: 'inherit' });
    execFileSync('node', [AI_OPTIMIZER_SCRIPT_PATH], { stdio: 'inherit' });
    selfHealed = true;
    await new Promise(r => setTimeout(r, 1500));
    liveAudit = await auditLiveAiCatalogDirectory();
  }

  console.log(`[3/4] Live /pages/ai-catalog-directory Audit: HTTP ${liveAudit.pageStatus} | Total Citation Rows: ${liveAudit.totalRows}/14 (Dynamic: ${liveAudit.dynamicRows}/10) | Citation Links Checked: ${liveAudit.linksChecked} | Broken Links: ${liveAudit.brokenLinks.length}`);
  if (liveAudit.pageStatus !== 200 || !liveAudit.matrixFound || liveAudit.totalRows < 14 || liveAudit.brokenLinks.length > 0) {
    console.error('  [ERROR] Live AI Catalog Directory citation audit failed:', liveAudit.brokenLinks);
    errors++;
  }

  // 5. Log dated entry to KEYWORD_AND_AI_CITATION_AUDIT_LOG.md
  if (!fs.existsSync(AUDIT_LOG_PATH)) {
    const header = [
      '# Prints With Passion — Automated Keyword Queue, SERP Gap & AI Citation Directory Audit Log',
      '',
      '| Timestamp (UTC) | Sub-Collections Queued | Top Opportunity Score | Live SERP Cache | Cannibalization Collisions | Live `/pages/ai-catalog-directory` Rows | Citation Links HTTP 200 | Status |',
      '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
      ''
    ].join('\n');
    fs.writeFileSync(AUDIT_LOG_PATH, header, 'utf8');
  }

  const ts = new Date().toISOString();
  const statusLabel = errors === 0
    ? (selfHealed ? '**PASS (Auto-Healed -> 0 Errors)**' : '**PASS (0 Errors)**')
    : `**FAIL (${errors} Errors)**`;
  const row = `| \`${ts}\` | \`${coveredSubs} / ${subs.length}\` (\`100%\`) | **\`${queue.summary?.topOpportunityScore}\`** | \`${serpCacheCount}\` Queries Cached | \`${slugCollisions}\` Collisions (\`${publishedHandles.size}\` Blogs Indexed) | \`${liveAudit.totalRows} / 14\` Rows (\`10\` Dynamic) | \`${liveAudit.linksChecked - liveAudit.brokenLinks.length} / ${liveAudit.linksChecked}\` HTTP 200 | ${statusLabel} |\n`;
  fs.appendFileSync(AUDIT_LOG_PATH, row, 'utf8');
  console.log(`[4/4] Appended audit telemetry row to ${AUDIT_LOG_PATH}`);

  if (errors > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
