/**
 * Prints With Passion — Full Storefront Audit for All 69 Active Collections
 * File: tests/audit_all_storefront_collections.mjs
 * 
 * Milestone 3 Iteration 2 Upgraded Storefront SERP Verification Suite:
 * - Automated HTTP probe across all 69 active collections discovered from live sitemap.
 * - HTTP status 200 OK assertion.
 * - Zero double-escaped entities in <title> and <meta name="description"> (&amp;quot;, &amp;amp;, &amp;#39;, etc.).
 * - Zero unescaped HTML tags or malformed attribute syntax.
 * - Zero literal double quotes in plain text description.
 * - Rendered description length strictly between 140 and 158 characters.
 * - Grammatically complete descriptions with terminal punctuation (. ! ?).
 * - Zero broken robotic template phrases ("Transform with...", "Elevate with...", etc.).
 * - Rendered title length strictly between 25 and 60 characters, word-boundary clean.
 * - Category-level plural title checks for /collections/japanese-anime-desk-mats.
 * - Complete title repair check for /collections/abstract-minimalist-bauhaus-canvas-wall-art.
 * - CDN cache resilience with automatic retry on cache miss.
 * - Strict non-zero exit code (process.exit(1)) on any verification failure.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const STORE_BASE = 'https://printswithpassion.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MIN_TITLE_LEN = 25;
const MAX_TITLE_LEN = 60;
const MIN_DESC_LEN = 140;
const MAX_DESC_LEN = 158;
const PACING_DELAY_MS = 250;

// Assertion Regexes
const DOUBLE_ESCAPED_ENTITY_REGEX = /&amp;(?:quot|amp|#39|apos|lt|gt|ndash|mdash|#\d+|#[xX][0-9a-fA-F]+);/i;
const UNESCAPED_TAG_REGEX = /[<>]/;
const TEMPLATE_PHRASE_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;
const TERMINAL_PUNCTUATION_REGEX = /[.!?]$/;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';

  // Robust attribute extraction: handles single/double quotes and attribute ordering
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

async function fetchStorefront(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    redirect: 'follow'
  });
  const text = await res.text();
  return { status: res.status, text, finalUrl: res.url };
}

function auditStorefrontPage(html, handle, status) {
  const issues = [];
  const { rawTitle, rawDesc } = extractMetaTags(html);
  const decodedTitle = decodeHtmlEntities(rawTitle);
  const decodedDesc = decodeHtmlEntities(rawDesc);

  // 1. HTTP Status Check
  if (status !== 200) {
    issues.push(`HTTP status returned ${status} instead of 200 OK`);
  }

  // 2. Title Assertions
  if (!rawTitle) {
    issues.push('Missing <title> tag in <head>');
  } else {
    if (DOUBLE_ESCAPED_ENTITY_REGEX.test(rawTitle)) {
      issues.push(`Double-escaped entity in raw <title>: "${rawTitle}"`);
    }
    if (decodedTitle.length > MAX_TITLE_LEN) {
      issues.push(`Decoded title length ${decodedTitle.length} > ${MAX_TITLE_LEN}: "${decodedTitle}"`);
    }
    if (decodedTitle.length < MIN_TITLE_LEN) {
      issues.push(`Decoded title length ${decodedTitle.length} < ${MIN_TITLE_LEN}: "${decodedTitle}"`);
    }
    if (DANGLING_TITLE_REGEX.test(decodedTitle)) {
      issues.push(`Dangling/truncated title ending: "${decodedTitle}"`);
    }
    if (TEMPLATE_PHRASE_REGEX.test(decodedTitle)) {
      issues.push(`Template phrase in title: "${decodedTitle}"`);
    }
  }

  // 3. Specific Collection Title Checks
  if (handle === 'japanese-anime-desk-mats') {
    if (/Japanese Wave Desk Mat/i.test(decodedTitle)) {
      issues.push(`Single product title retained on japanese-anime-desk-mats: "${decodedTitle}"`);
    }
    if (!/(?:Desk Mats|Mouse Pads)/i.test(decodedTitle)) {
      issues.push(`Lacks category-level plural phrase (Desk Mats/Mouse Pads): "${decodedTitle}"`);
    }
  }

  if (handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    if (/\(CM & I/i.test(decodedTitle)) {
      issues.push(`Truncation artifact '(CM & I' retained in title: "${decodedTitle}"`);
    }
  }

  // 4. Meta Description Assertions
  if (!rawDesc) {
    issues.push('Missing <meta name="description"> tag in <head>');
  } else {
    // 4a. Entity hygiene
    if (DOUBLE_ESCAPED_ENTITY_REGEX.test(rawDesc)) {
      issues.push(`DOUBLE-ESCAPED ENTITY detected in raw HTML meta description: "${rawDesc}"`);
    }
    if (/&amp;quot;/i.test(rawDesc)) {
      issues.push(`VERBATIM DEFECT: Raw meta description contains &amp;quot;: "${rawDesc}"`);
    }
    if (/&amp;amp;/i.test(rawDesc)) {
      issues.push(`VERBATIM DEFECT: Raw meta description contains &amp;amp;: "${rawDesc}"`);
    }
    if (UNESCAPED_TAG_REGEX.test(rawDesc)) {
      issues.push(`Raw HTML tag delimiter (< or >) in meta description: "${rawDesc}"`);
    }

    // 4b. Decoded text entity residue
    if (/&(?:quot|amp|#39|apos|lt|gt);/i.test(decodedDesc)) {
      issues.push(`Entity artifact remained after single decoding: "${decodedDesc}"`);
    }

    // 4c. Zero literal double quote check (per copy remediation v2 standard)
    if (/"/.test(decodedDesc)) {
      issues.push(`Literal double quote (") found in meta description (should use standard word e.g. -inch/in.): "${decodedDesc}"`);
    }

    // 4d. Character length boundary [140, 158]
    if (decodedDesc.length < MIN_DESC_LEN || decodedDesc.length > MAX_DESC_LEN) {
      issues.push(`Decoded meta description length ${decodedDesc.length} outside [${MIN_DESC_LEN}, ${MAX_DESC_LEN}]: "${decodedDesc}"`);
    }

    // 4e. Grammar & punctuation
    if (!TERMINAL_PUNCTUATION_REGEX.test(decodedDesc.trim())) {
      issues.push(`Meta description missing terminal punctuation (. ! ?): "${decodedDesc.slice(-15)}"`);
    }

    // 4f. Robotic template phrases
    if (TEMPLATE_PHRASE_REGEX.test(decodedDesc)) {
      issues.push(`Robotic template phrase detected: "${decodedDesc}"`);
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
    rawTitle,
    decodedTitle,
    rawDesc,
    decodedDesc
  };
}

async function main() {
  console.log('='.repeat(80));
  console.log('PRINTS WITH PASSION — STOREFRONT COLLECTION SERP VERIFICATION');
  console.log('Auditing 100% of Active Collections on Production Storefront');
  console.log('='.repeat(80));

  // 1. Fetch live sitemap index to locate collections sitemap with query params
  console.log('\n[Phase 1] Discovering active collections from sitemap...');
  const sitemapIndexResp = await fetchStorefront(`${STORE_BASE}/sitemap.xml`);
  const locMatches = [...sitemapIndexResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const colSitemapUrl = locMatches.find(u => u.includes('sitemap_collections'));

  if (!colSitemapUrl) {
    console.error('FATAL: Could not locate sitemap_collections in sitemap.xml');
    process.exit(1);
  }

  console.log(`Collections sitemap target: ${colSitemapUrl}`);
  const colSitemapResp = await fetchStorefront(colSitemapUrl);
  const collectionUrls = [...colSitemapResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`Total active collections in sitemap: ${collectionUrls.length}`);

  if (collectionUrls.length < 65) {
    console.error(`FATAL: Unexpectedly low collection count in sitemap: ${collectionUrls.length} (expected ~69)`);
    process.exit(1);
  }

  // 2. Audit each collection on live storefront
  console.log('\n[Phase 2] Probing live storefront HTML for each collection...');
  let passedCount = 0;
  let failedCount = 0;
  const failureDetails = [];
  const auditRecords = [];

  for (let i = 0; i < collectionUrls.length; i++) {
    const url = collectionUrls[i];
    const handle = url.split('/collections/')[1];
    await sleep(PACING_DELAY_MS);

    let resp = await fetchStorefront(url);
    let audit = auditStorefrontPage(resp.text, handle, resp.status);

    // CDN Cache Retry: if failed, re-probe with cache-busting timestamp once after brief sleep
    if (!audit.compliant) {
      await sleep(1000);
      const cacheBustUrl = `${url}?cb=${Date.now()}`;
      const retryResp = await fetchStorefront(cacheBustUrl);
      const retryAudit = auditStorefrontPage(retryResp.text, handle, retryResp.status);
      if (retryAudit.compliant) {
        console.log(`   [RETRY PASS on cache-bust]: ${handle}`);
        audit = retryAudit;
      }
    }

    if (audit.compliant) {
      passedCount++;
      console.log(`[${i + 1}/${collectionUrls.length}] PASS: ${handle.padEnd(42)} | Title (${audit.decodedTitle.length}c) | Desc (${audit.decodedDesc.length}c)`);
    } else {
      failedCount++;
      console.log(`[${i + 1}/${collectionUrls.length}] FAIL: ${handle}`);
      audit.issues.forEach(iss => console.log(`   * ${iss}`));
      failureDetails.push({
        handle,
        url,
        issues: audit.issues,
        rawTitle: audit.rawTitle,
        decodedTitle: audit.decodedTitle,
        rawDesc: audit.rawDesc,
        decodedDesc: audit.decodedDesc
      });
    }

    auditRecords.push({
      handle,
      url,
      passed: audit.compliant,
      titleLen: audit.decodedTitle.length,
      descLen: audit.decodedDesc.length,
      issues: audit.issues
    });
  }

  // 3. Unpublished Redirect Verification
  console.log('\n[Phase 3] Auditing unpublished legacy redirect collections...');
  const redirectHandles = ['wall-art', 'stationary-office', 'plush-blankets'];
  const redirectIssues = [];
  for (const rHandle of redirectHandles) {
    const rUrl = `${STORE_BASE}/collections/${rHandle}`;
    await sleep(PACING_DELAY_MS);
    const rResp = await fetchStorefront(rUrl);
    // Should redirect away from the unpublished handle
    if (rResp.finalUrl === rUrl && rResp.status === 200) {
      redirectIssues.push(`Unpublished collection /collections/${rHandle} did not redirect (returned HTTP 200 on same URL)`);
    } else {
      console.log(`[PASS] Unpublished collection redirected: ${rHandle} -> ${rResp.finalUrl}`);
    }
  }

  // 4. Summary & JSON output
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT SUMMARY');
  console.log(`Total Active Collections Audited: ${collectionUrls.length}`);
  console.log(`Passed Storefront HTML:          ${passedCount} (${((passedCount / collectionUrls.length) * 100).toFixed(1)}%)`);
  console.log(`Failed Storefront HTML:          ${failedCount}`);
  console.log(`Redirect Hygiene Issues:         ${redirectIssues.length}`);
  console.log('='.repeat(80));

  const totalFailures = failedCount + redirectIssues.length;
  const auditReport = {
    timestamp: new Date().toISOString(),
    totalAudited: collectionUrls.length,
    passedCount,
    failedCount,
    redirectIssues,
    success: totalFailures === 0,
    failureDetails
  };

  fs.writeFileSync(
    path.resolve(REPO_ROOT, 'storefront_audit_results.json'),
    JSON.stringify(auditReport, null, 2),
    'utf8'
  );
  console.log(`Report written to ${path.resolve(REPO_ROOT, 'storefront_audit_results.json')}`);

  if (totalFailures > 0) {
    console.error(`\nFAILED: ${totalFailures} verification issue(s) detected. Gate check failed.`);
    process.exit(1);
  } else {
    console.log(`\nSUCCESS: 100% of active storefront collections meet all SEO and entity purity requirements.`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
