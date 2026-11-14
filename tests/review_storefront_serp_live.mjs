/**
 * Reviewer M3-2 Storefront SERP & Liquid Integration Audit Script
 * File: tests/review_storefront_serp_live.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL } from '../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const STORE_BASE = 'https://printswithpassion.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Sample key collection URLs required by prompt + representative active subcollections
const SAMPLE_COLLECTIONS = [
  'canvas-prints',
  'desk-mats',
  'japanese-anime-desk-mats',
  'abstract-minimalist-bauhaus-canvas-wall-art',
  'frontpage',
  'apparel',
  'hoodies',
  'pillow-cases',
  'blankets',
  'bath-mats',
  'nature-mountain-graphic-hoodies',
  'cyberpunk-neon-gaming-desk-mats',
  'botanical-floral-coastal-canvas-wall-art',
  'retro-vintage-synthwave-desk-mats',
  'space-cosmic-astronomy-canvas-wall-art',
  'fantasy-dragon-mythology-desk-mats'
];

const DELETED_LEGACY_HANDLES = [
  'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
  'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles', 'shoes',
  'hats', 'bottles', 'tote-bags', 'suitcases', 'yoga-mats', 'makeup-bags',
  'coasters', 'pet-mat', 'bottle-opener', 'pet-bowls', 'bags', 'bags-1',
  'pets-animals', 'can-cooler', 'posters', 'rugs', 'mousepads',
  'avada-upsell-best-sellers'
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

async function fetchStorefront(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${STORE_BASE}${pathOrUrl}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    redirect: 'follow'
  });
  const text = await res.text();
  return {
    status: res.status,
    url: res.url,
    text
  };
}

function extractMeta(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : null;
  const decodedTitle = rawTitle ? decodeHtmlEntities(rawTitle) : null;

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const rawDesc = descMatch ? descMatch[1].trim() : null;
  const decodedDesc = rawDesc ? decodeHtmlEntities(rawDesc) : null;

  return {
    rawTitle,
    decodedTitle,
    rawDesc,
    decodedDesc
  };
}

async function runStorefrontAudit() {
  console.log('='.repeat(80));
  console.log('  MILESTONE 3: STOREFRONT SERP & LIQUID INTEGRATION AUDIT');
  console.log('='.repeat(80));

  const proposalsPath = path.resolve(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m3_2/verified_collection_proposals.json');
  const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));
  const proposalMap = new Map(proposals.map(p => [p.handle, p]));

  // Query Shopify Admin GraphQL
  const gqlQuery = `
    query GetAllAdminSeo {
      collections(first: 250) {
        nodes {
          handle
          seo {
            title
            description
          }
        }
      }
    }
  `;
  const gqlRes = await shopifyGraphQL(gqlQuery);
  const adminMap = new Map((gqlRes?.collections?.nodes || []).map(c => [c.handle, c.seo]));

  console.log(`\n[Part 1] Live Storefront SERP Inspection for ${SAMPLE_COLLECTIONS.length} Sample Collections...`);
  const findings = [];

  for (const handle of SAMPLE_COLLECTIONS) {
    const urlPath = `/collections/${handle}`;
    const pageResp = await fetchStorefront(urlPath);
    const meta = extractMeta(pageResp.text);
    const adminSeo = adminMap.get(handle);
    const proposal = proposalMap.get(handle);

    const issues = [];

    if (pageResp.status !== 200) {
      issues.push(`HTTP ${pageResp.status} returned for ${urlPath}`);
    }

    // Title checks
    if (!meta.decodedTitle) {
      issues.push('Missing <title> tag');
    } else {
      if (meta.decodedTitle.length > 60) {
        issues.push(`<title> length ${meta.decodedTitle.length} > 60 chars: "${meta.decodedTitle}"`);
      }
      if (/(?:[–—\-|,/&:]\s*$|\.\.\.\s*$|\([^\)]*$)/.test(meta.decodedTitle)) {
        issues.push(`<title> has dangling/cut ending: "${meta.decodedTitle}"`);
      }
      if (adminSeo?.title && meta.decodedTitle !== adminSeo.title) {
        issues.push(`Storefront title "${meta.decodedTitle}" (${meta.decodedTitle.length}c) != Admin seo.title "${adminSeo.title}" (${adminSeo.title.length}c)`);
      }
    }

    // Meta Description checks
    if (!meta.rawDesc) {
      issues.push('Missing <meta name="description"> tag');
    } else {
      // Check length of decoded plain text
      if (meta.decodedDesc.length < 140 || meta.decodedDesc.length > 158) {
        issues.push(`Decoded meta description length ${meta.decodedDesc.length} outside [140, 158] chars: "${meta.decodedDesc}"`);
      }
      if (!/[.!?]$/.test(meta.decodedDesc.trim())) {
        issues.push(`Meta description missing terminal punctuation: "${meta.decodedDesc.slice(-10)}"`);
      }

      // Check double-escaped entities in raw HTML
      if (/&amp;quot;/i.test(meta.rawDesc)) {
        issues.push(`INTEGRITY/ESCAPE DEFECT: Raw HTML meta description contains &amp;quot;: "${meta.rawDesc}"`);
      }
      if (/&amp;amp;/i.test(meta.rawDesc)) {
        issues.push(`INTEGRITY/ESCAPE DEFECT: Raw HTML meta description contains &amp;amp;: "${meta.rawDesc}"`);
      }
      if (/&amp;#39;/i.test(meta.rawDesc)) {
        issues.push(`INTEGRITY/ESCAPE DEFECT: Raw HTML meta description contains &amp;#39;: "${meta.rawDesc}"`);
      }

      // Check robotic template phrases
      if (/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i.test(meta.decodedDesc)) {
        issues.push(`Meta description contains broken template phrase: "${meta.decodedDesc}"`);
      }
    }

    // Specific flagged collections
    if (handle === 'japanese-anime-desk-mats') {
      if (/Japanese Wave Desk Mat/i.test(meta.decodedTitle || '')) {
        issues.push(`japanese-anime-desk-mats retains single product title`);
      }
      if (!/(?:Desk Mats|Mouse Pads)/i.test(meta.decodedTitle || '')) {
        issues.push(`japanese-anime-desk-mats lacks plural category title`);
      }
    }

    if (handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
      if (/\(CM & I/i.test(meta.decodedTitle || '')) {
        issues.push(`abstract-minimalist-bauhaus-canvas-wall-art retains (CM & I artifact`);
      }
    }

    if (issues.length > 0) {
      console.log(`\n  [FAIL] ${handle}`);
      console.log(`         URL:   ${STORE_BASE}${urlPath}`);
      console.log(`         Title: "${meta.decodedTitle}" (${meta.decodedTitle ? meta.decodedTitle.length : 0} chars)`);
      console.log(`         Raw Desc: "${meta.rawDesc}"`);
      issues.forEach(iss => console.log(`         * ${iss}`));
      findings.push({ handle, urlPath, issues, meta });
    } else {
      console.log(`  [PASS] ${handle.padEnd(45)} | Title (${meta.decodedTitle.length}c) | Desc (${meta.decodedDesc.length}c)`);
    }
  }

  // [Part 2] Live Sitemap collections audit
  console.log(`\n[Part 2] Probing Live Sitemap index and collections sitemap...`);
  const sitemapIndexResp = await fetchStorefront('/sitemap.xml');
  const locMatches = [...sitemapIndexResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  const colSitemapUrl = locMatches.find(u => u.includes('sitemap_collections'));

  console.log(`  Collections Sitemap loc in sitemap.xml: ${colSitemapUrl}`);
  const colSitemapResp = await fetchStorefront(colSitemapUrl);
  const colUrls = [...colSitemapResp.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`  Total collections present in live sitemap: ${colUrls.length}`);

  const sitemapHandles = new Set(colUrls.map(u => {
    const parts = u.split('/collections/');
    return parts.length > 1 ? parts[1].replace(/\/$/, '') : null;
  }).filter(Boolean));

  const sitemapIssues = [];
  if (sitemapHandles.has('avada-upsell-best-sellers')) {
    sitemapIssues.push('Unpublished avada-upsell-best-sellers IS PRESENT in sitemap_collections_1.xml!');
  } else {
    console.log('  [PASS] avada-upsell-best-sellers is absent from live sitemap.');
  }

  const legacyPresent = DELETED_LEGACY_HANDLES.filter(h => sitemapHandles.has(h));
  if (legacyPresent.length > 0) {
    sitemapIssues.push(`Deleted legacy collections present in sitemap: ${legacyPresent.join(', ')}`);
  } else {
    console.log(`  [PASS] All 29 deleted legacy collections are absent from live sitemap.`);
  }

  // Check that all 48 subcollections are in sitemap
  const subcollectionsPath = path.resolve(REPO_ROOT, 'phase2_40_subcollections.json');
  if (fs.existsSync(subcollectionsPath)) {
    const subcollections = JSON.parse(fs.readFileSync(subcollectionsPath, 'utf8'));
    const missingSubs = subcollections.filter(s => !sitemapHandles.has(s.handle));
    if (missingSubs.length > 0) {
      sitemapIssues.push(`Missing subcollections from sitemap: ${missingSubs.map(s => s.handle).join(', ')}`);
    } else {
      console.log(`  [PASS] All ${subcollections.length} curated subcollections are present in live sitemap.`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('  AUDIT SUMMARY');
  console.log(`  Sampled Storefront Pages: ${SAMPLE_COLLECTIONS.length}`);
  console.log(`  Storefront Failures:      ${findings.length}`);
  console.log(`  Sitemap Issues:           ${sitemapIssues.length}`);
  const totalIssues = findings.reduce((acc, f) => acc + f.issues.length, 0) + sitemapIssues.length;
  console.log(`  Total Issues:             ${totalIssues}`);
  console.log(`  Verdict:                  ${totalIssues === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
  console.log('='.repeat(80));

  return {
    success: totalIssues === 0,
    totalIssues,
    findings,
    sitemapIssues,
    colSitemapUrl,
    totalCollectionsInSitemap: colUrls.length
  };
}

runStorefrontAudit()
  .then(res => {
    process.exit(res.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
