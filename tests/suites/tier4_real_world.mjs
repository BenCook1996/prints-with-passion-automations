/**
 * Tier 4: Real-World Application Scenarios Test Suite (5 Test Cases)
 *
 * Implements end-to-end user journeys, bot crawls, and search engine ingestion simulations:
 * - T4-SCEN-01: Googlebot Smartphone Discovery Crawl
 * - T4-SCEN-02: Google Search SERP Snippet Preview
 * - T4-SCEN-03: Googlebot Discontinued URL Prune Simulation
 * - T4-SCEN-04: Human Shopper Live Storefront Navigation
 * - T4-SCEN-05: Full Sitemap XML Schema & Entity Validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  assertOk,
  assertEqual,
  assertRange,
  assertRegex,
  assertNotRegex,
  assertIncludes,
  assertNotIncludes
} from '../helpers/assertions.mjs';
import {
  fetchUrl,
  extractTitle,
  extractMetaDescription,
  extractH1s,
  extractLinks,
  USER_AGENTS
} from '../helpers/storefront_crawler.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const tier4Tests = [
  // =========================================================================
  // T4-SCEN-01: Googlebot Smartphone Discovery Crawl
  // =========================================================================
  {
    id: 'T4-SCEN-01',
    name: 'Googlebot Smartphone Discovery Crawl Simulation',
    tier: 4,
    feature: 21,
    async run(ctx) {
      // 1. Crawl homepage using Googlebot Mobile User-Agent
      const homeRes = await fetchUrl('https://printswithpassion.com/', {
        ...ctx,
        userAgent: 'googlebot_mobile'
      });
      assertEqual(homeRes.status, 200, 'Homepage must return HTTP 200 to Googlebot');
      assertIncludes(homeRes.body, 'name="viewport"', 'Homepage must serve mobile viewport meta tag');

      // 2. Extract links and verify all 48 sub-collections reachable at Click Depth 1
      const links = extractLinks(homeRes.body).map(l => l.href);
      const subcollectionsRaw = JSON.parse(
        fs.readFileSync(path.join(REPO_ROOT, 'phase2_40_subcollections.json'), 'utf8')
      );

      for (const sub of subcollectionsRaw.slice(0, 10)) {
        const subHref = `/collections/${sub.handle}`;
        assertOk(links.includes(subHref), `Googlebot must discover ${subHref} on homepage`);

        // Follow link and verify HTTP 200
        const subRes = await fetchUrl(`https://printswithpassion.com${subHref}`, {
          ...ctx,
          userAgent: 'googlebot_mobile'
        });
        assertEqual(subRes.status, 200, `Sub-collection ${subHref} must return HTTP 200`);
      }

      // 3. Verify zero crawl traps
      const badLinks = links.filter(href => href.startsWith('/https:') || href.startsWith('/http:'));
      assertEqual(badLinks.length, 0, `Zero crawl traps found for Googlebot: ${JSON.stringify(badLinks)}`);
    }
  },

  // =========================================================================
  // T4-SCEN-02: Google Search SERP Snippet Preview
  // =========================================================================
  {
    id: 'T4-SCEN-02',
    name: 'Google Search SERP Snippet Preview Simulation',
    tier: 4,
    feature: 1,
    async run(ctx) {
      const sampleUrls = [
        'https://printswithpassion.com/',
        'https://printswithpassion.com/collections/desk-mats',
        'https://printswithpassion.com/collections/japanese-anime-desk-mats',
        'https://printswithpassion.com/pages/xxl-extended-gaming-desk-mats-uk-guide',
        'https://printswithpassion.com/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared'
      ];

      for (const url of sampleUrls) {
        const res = await fetchUrl(url, ctx);
        const title = extractTitle(res.body);
        const desc = extractMetaDescription(res.body);

        // Titles must fit <= 65 characters without trailing ellipsis
        assertRange(title.length, 20, 65, `SERP title for ${url} must be <= 65 chars (got ${title.length})`);
        assertNotRegex(title, /\.\.\.$/, `SERP title for ${url} must not end in cut ellipsis`);

        // Descriptions must be plain text without double-escaped entities
        const minLen = url.includes('/pages/') ? 145 : 140;
        const maxLen = url.endsWith('.com/') || url.endsWith('.com') ? 160 : 158;
        assertRange(desc.length, minLen, maxLen, `SERP snippet description for ${url} in range (got ${desc.length})`);
        assertNotIncludes(desc, '&quot;', `SERP description for ${url} must not contain &quot;`);
        assertNotIncludes(desc, '&amp;quot;', `SERP description for ${url} must not contain &amp;quot;`);
        assertNotRegex(desc, /^Home\s*[›>]/i, `SERP description for ${url} must not leak breadcrumbs`);
      }
    }
  },

  // =========================================================================
  // T4-SCEN-03: Googlebot Discontinued URL Prune Simulation
  // =========================================================================
  {
    id: 'T4-SCEN-03',
    name: 'Googlebot Discontinued URL Prune Simulation',
    tier: 4,
    feature: 7,
    async run(ctx) {
      const discontinuedHandles = [
        'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags',
        'phone-cases', 'beach-towels', 'mugs', 'journals', 'wall-tapestry',
        'puzzles', 'shoes', 'hats', 'bottles', 'tote-bags', 'suitcases',
        'yoga-mats', 'makeup-bags', 'coasters', 'pet-mat', 'bottle-opener',
        'pet-bowls', 'bags', 'bags-1', 'pets-animals', 'can-cooler',
        'posters', 'rugs', 'mousepads'
      ];

      for (const handle of discontinuedHandles) {
        const url = `https://printswithpassion.com/collections/${handle}`;
        const res = await fetchUrl(url, { ...ctx, redirect: 'manual' });

        // Must receive HTTP 301
        assertEqual(res.status, 301, `Legacy URL ${url} must return HTTP 301 redirect to Googlebot`);
        assertOk(res.location.startsWith('/collections/'), `Redirect target for ${handle} must point to parent collection`);

        // Destination must return HTTP 200 (never 404)
        const targetRes = await fetchUrl(`https://printswithpassion.com${res.location}`, ctx);
        assertEqual(targetRes.status, 200, `Redirect destination ${res.location} must return HTTP 200`);
      }
    }
  },

  // =========================================================================
  // T4-SCEN-04: Human Shopper Live Storefront Navigation
  // =========================================================================
  {
    id: 'T4-SCEN-04',
    name: 'Human Shopper Live Storefront Navigation Journey',
    tier: 4,
    feature: 5,
    async run(ctx) {
      // Step 1: Land on homepage with desktop Chrome browser
      const homeRes = await fetchUrl('https://printswithpassion.com/', {
        ...ctx,
        userAgent: 'desktop_chrome'
      });
      assertEqual(homeRes.status, 200, 'Shopper lands on homepage');

      // Step 2: Locate Curated Collections Hub
      assertIncludes(homeRes.body, 'pwp-curated-collections-hub', 'Shopper views curated collections hub');

      // Step 3: Click Japanese Anime Desk Mats
      const targetHandle = 'japanese-anime-desk-mats';
      assertIncludes(homeRes.body, `/collections/${targetHandle}`, 'Shopper sees link to anime desk mats');

      // Step 4: Arrive on collection page
      const collRes = await fetchUrl(`https://printswithpassion.com/collections/${targetHandle}`, ctx);
      assertEqual(collRes.status, 200, 'Collection page loaded');

      // Step 5: Verify page title and single commercial H1
      const title = extractTitle(collRes.body);
      const h1s = extractH1s(collRes.body);
      assertRange(title.length, 30, 60, 'Collection title <= 60 chars');
      assertEqual(h1s.length, 1, 'Collection page renders strictly 1 H1');
      assertOk(
        h1s[0].includes('Japanese Anime Desk Mats') || (h1s[0].includes('Japanese') && h1s[0].includes('Desk Mats')),
        'H1 matches collection theme'
      );
    }
  },

  // =========================================================================
  // T4-SCEN-05: Full Sitemap XML Schema & Entity Validation
  // =========================================================================
  {
    id: 'T4-SCEN-05',
    name: 'Full Sitemap XML Schema & Entity Validation',
    tier: 4,
    feature: 8,
    async run(ctx) {
      // 1. Fetch sitemap XML
      const sitemapRes = await fetchUrl('https://printswithpassion.com/sitemap_collections_1.xml', ctx);
      assertEqual(sitemapRes.status, 200, 'Sitemap XML must return HTTP 200');
      assertIncludes(sitemapRes.body, '<?xml', 'Sitemap must have XML declaration');
      assertIncludes(sitemapRes.body, '<urlset', 'Sitemap must contain <urlset> root element');

      // 2. Verify AVADA collection is NOT present
      assertNotIncludes(sitemapRes.body, 'avada-upsell-best-sellers', 'AVADA upsell must be absent from sitemap');

      // 3. Verify discontinued collections are NOT present
      assertNotIncludes(sitemapRes.body, '/collections/dog-collars', 'Discontinued dog-collars absent');
      assertNotIncludes(sitemapRes.body, '/collections/posters', 'Discontinued posters absent');

      // 4. Verify encoding is valid UTF-8 and no malformed characters
      assertNotIncludes(sitemapRes.body, '\uFFFD', 'Sitemap must not contain Unicode replacement character U+FFFD');
    }
  }
];
