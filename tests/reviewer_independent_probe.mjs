/**
 * Prints With Passion — Independent Reviewer M3-IT2-2 Deep Probe
 * File: tests/reviewer_independent_probe.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const STORE_BASE = 'https://printswithpassion.com';
const THEME_ID = '177936466293';
const SHOP_DOMAIN = 'bencook96store.myshopify.com';

const DELETED_LEGACY_COLLECTIONS = [
  'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
  'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles', 'shoes',
  'hats', 'bottles', 'tote-bags', 'suitcases', 'yoga-mats', 'makeup-bags',
  'coasters', 'pet-mat', 'bottle-opener', 'pet-bowls', 'bags', 'bags-1',
  'pets-animals', 'can-cooler', 'posters', 'rugs', 'mousepads'
];

const TARGET_SAMPLE_URLS = [
  '/collections/canvas-prints',
  '/collections/desk-mats',
  '/collections/japanese-anime-desk-mats',
  '/collections/abstract-minimalist-bauhaus-canvas-wall-art',
  '/collections/pillow-cases',
  '/collections/blankets',
  '/collections/hoodies',
  '/collections/bath-mats',
  '/collections/all-products',
  '/collections/frontpage'
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&');
}

function extractMetaTags(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';

  let rawDesc = '';
  const m1 = html.match(/<meta\b[^>]*?\bname=["']description["'][^>]*?\bcontent=(["'])(.*?)\1/i);
  if (m1) {
    rawDesc = m1[2].trim();
  } else {
    const m2 = html.match(/<meta\b[^>]*?\bcontent=(["'])(.*?)\1[^>]*?\bname=["']description["']/i);
    if (m2) {
      rawDesc = m2[2].trim();
    }
  }

  return { rawTitle, rawDesc };
}

async function getAccessToken(shopDomain) {
  const tokenPath = path.resolve(REPO_ROOT, '.shopify_token.json');
  const cfg = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: cfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: cfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  if (!res.ok) {
    throw new Error(`OAuth token request failed: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function verifyLiveThemeSnippet() {
  console.log('\n--- 1. VERIFYING LIVE THEME ASSET: snippets/head.liquid ---');
  const token = await getAccessToken(SHOP_DOMAIN);
  if (!token) {
    throw new Error('Could not acquire Shopify Admin OAuth Access Token');
  }

  const endpoint = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=snippets/head.liquid`;
  const resp = await fetch(endpoint, {
    headers: {
      'X-Shopify-Access-Token': token,
      'Accept': 'application/json'
    }
  });

  if (!resp.ok) {
    throw new Error(`Theme Asset API returned HTTP ${resp.status}: ${await resp.text()}`);
  }

  const json = await resp.json();
  const content = json.asset.value;
  console.log(`Theme ID: ${THEME_ID}`);
  console.log(`Updated at: ${json.asset.updated_at}`);
  console.log(`Asset size: ${content.length} bytes`);

  const lines = content.split('\n');
  let foundTargetLine = false;
  let exactLineNumber = -1;
  let exactLineContent = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("replace: '&quot;', '\"'")) {
      foundTargetLine = true;
      exactLineNumber = i + 1;
      exactLineContent = line.trim();
    }
  }

  if (foundTargetLine) {
    console.log(`[PASS] Found quote unescape patch at line ${exactLineNumber}:`);
    console.log(`       ${exactLineContent}`);
  } else {
    console.error('[FAIL] snippets/head.liquid DOES NOT contain quote unescape patch!');
  }

  return { foundTargetLine, exactLineNumber, exactLineContent, updatedAt: json.asset.updated_at };
}

async function verifySitemap() {
  console.log('\n--- 2. VERIFYING LIVE SITEMAP_COLLECTIONS_1.XML ---');
  const sitemapIndexResp = await fetch(`${STORE_BASE}/sitemap.xml`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Reviewer-Bot)' }
  });
  const indexText = await sitemapIndexResp.text();
  const colMatch = indexText.match(/<loc>([^<]*sitemap_collections[^<]*)<\/loc>/i);
  if (!colMatch) {
    throw new Error('Could not find sitemap_collections in sitemap.xml');
  }

  const colSitemapUrl = colMatch[1].replace(/&amp;/g, '&');
  console.log(`Sitemap Collections URL: ${colSitemapUrl}`);

  const colResp = await fetch(colSitemapUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Reviewer-Bot)' }
  });
  const colText = await colResp.text();

  const locs = [...colText.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`Total collections in live sitemap: ${locs.length}`);

  // Check avada-upsell-best-sellers
  const avadaPresent = locs.some(u => u.includes('avada-upsell-best-sellers'));
  console.log(`Checking 'avada-upsell-best-sellers': ${avadaPresent ? 'PRESENT (FAIL)' : 'ABSENT (PASS)'}`);

  // Check 28 deleted legacy collections
  const leakedLegacy = [];
  for (const legacy of DELETED_LEGACY_COLLECTIONS) {
    if (locs.some(u => u.endsWith(`/collections/${legacy}`))) {
      leakedLegacy.push(legacy);
    }
  }

  console.log(`Checking 28 deleted legacy collections: ${leakedLegacy.length === 0 ? 'ALL ABSENT (PASS)' : 'LEAKED: ' + leakedLegacy.join(', ')}`);

  return {
    totalCollections: locs.length,
    avadaPresent,
    leakedLegacy,
    colSitemapUrl,
    locs
  };
}

async function probeKeyCollections() {
  console.log('\n--- 3. PROBING KEY LIVE STOREFRONT COLLECTION URLS ---');
  const results = [];

  for (const path of TARGET_SAMPLE_URLS) {
    const fullUrl = `${STORE_BASE}${path}`;
    const resp = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Reviewer-Bot)',
        'Cache-Control': 'no-cache'
      }
    });

    const status = resp.status;
    const html = await resp.text();
    const { rawTitle, rawDesc } = extractMetaTags(html);
    const decodedTitle = decodeHtmlEntities(rawTitle);
    const decodedDesc = decodeHtmlEntities(rawDesc);

    const hasDoubleEscapedQuote = rawDesc.includes('&amp;quot;');
    const hasAnyDoubleEscaped = /&amp;(?:quot|amp|#39|apos|lt|gt);/i.test(rawDesc);
    const hasLiteralQuote = /"/.test(decodedDesc);
    const descLenValid = decodedDesc.length >= 140 && decodedDesc.length <= 158;
    const titleLenValid = decodedTitle.length >= 25 && decodedTitle.length <= 60;

    let specificCheck = 'N/A';
    if (path.includes('japanese-anime-desk-mats')) {
      const isPluralCategory = /(?:Desk Mats|Mouse Pads)/i.test(decodedTitle) && !/Japanese Wave Desk Mat/i.test(decodedTitle);
      specificCheck = isPluralCategory ? 'PASS (Plural category title)' : 'FAIL (Single product title)';
    } else if (path.includes('abstract-minimalist-bauhaus-canvas-wall-art')) {
      const isUntruncated = !/\(CM & I/i.test(decodedTitle);
      specificCheck = isUntruncated ? 'PASS (Clean untruncated title)' : 'FAIL (Hard truncated)';
    }

    const pass = status === 200 &&
                 !hasDoubleEscapedQuote &&
                 !hasAnyDoubleEscaped &&
                 !hasLiteralQuote &&
                 descLenValid &&
                 titleLenValid &&
                 (specificCheck === 'N/A' || specificCheck.startsWith('PASS'));

    console.log(`\nURL: ${path}`);
    console.log(`  HTTP Status:      ${status}`);
    console.log(`  Raw Title:        "${rawTitle}" (${decodedTitle.length}c) [Valid: ${titleLenValid}]`);
    console.log(`  Raw Description:  "${rawDesc}"`);
    console.log(`  Decoded Desc Len: ${decodedDesc.length}c [Valid: ${descLenValid}]`);
    console.log(`  Has &amp;quot;:   ${hasDoubleEscapedQuote}`);
    console.log(`  Has literal ":    ${hasLiteralQuote}`);
    if (specificCheck !== 'N/A') {
      console.log(`  Specific Check:   ${specificCheck}`);
    }
    console.log(`  OVERALL:          ${pass ? 'PASS' : 'FAIL'}`);

    results.push({
      path,
      status,
      rawTitle,
      decodedTitle,
      titleLen: decodedTitle.length,
      rawDesc,
      decodedDesc,
      descLen: decodedDesc.length,
      hasDoubleEscapedQuote,
      hasAnyDoubleEscaped,
      hasLiteralQuote,
      specificCheck,
      pass
    });
  }

  return results;
}

async function main() {
  console.log('='.repeat(80));
  console.log('REVIEWER M3-IT2-2: ADVERSARIAL & INDEPENDENT VERIFICATION SUITE');
  console.log('='.repeat(80));

  const themeResult = await verifyLiveThemeSnippet();
  const sitemapResult = await verifySitemap();
  const sampleResults = await probeKeyCollections();

  const allSamplesPass = sampleResults.every(r => r.pass);
  const sitemapPass = !sitemapResult.avadaPresent && sitemapResult.leakedLegacy.length === 0 && sitemapResult.totalCollections === 69;
  const themePass = themeResult.foundTargetLine;

  console.log('\n' + '='.repeat(80));
  console.log('INDEPENDENT AUDIT VERDICT SUMMARY');
  console.log('='.repeat(80));
  console.log(`1. Live Theme head.liquid Patch: ${themePass ? 'VERIFIED PASS' : 'FAILED'}`);
  console.log(`2. Live Sitemap Collections:     ${sitemapPass ? 'VERIFIED PASS (69 collections, 0 deleted, 0 avada)' : 'FAILED'}`);
  console.log(`3. Key Sample Collections SERP:  ${allSamplesPass ? 'VERIFIED PASS (10/10 samples compliant)' : 'FAILED'}`);

  const grandPass = allSamplesPass && sitemapPass && themePass;
  console.log(`\nGRAND AUDIT RESULT: ${grandPass ? 'ALL TESTS PASSED' : 'DEFECTS DETECTED'}`);

  const report = {
    themeResult,
    sitemapResult: {
      totalCollections: sitemapResult.totalCollections,
      avadaPresent: sitemapResult.avadaPresent,
      leakedLegacy: sitemapResult.leakedLegacy,
      colSitemapUrl: sitemapResult.colSitemapUrl
    },
    sampleResults,
    grandPass
  };

  fs.writeFileSync(
    path.resolve(REPO_ROOT, 'reviewer_independent_probe_results.json'),
    JSON.stringify(report, null, 2),
    'utf8'
  );
  console.log(`Detailed results saved to reviewer_independent_probe_results.json`);

  process.exit(grandPass ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal probe error:', err);
  process.exit(1);
});
