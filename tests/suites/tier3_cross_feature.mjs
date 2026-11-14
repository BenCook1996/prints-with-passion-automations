/**
 * Tier 3: Pairwise Cross-Feature Interaction Test Suite (10 Test Cases)
 *
 * Validates complex interactions and state transitions between interconnected subsystems:
 * T3-PAIR-01 to T3-PAIR-10 as specified in spec_miner_e2e_1/handoff.md.
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
  extractLinks
} from '../helpers/storefront_crawler.mjs';
import {
  getCollectionByHandle,
  getAllCollections,
  getUrlRedirects,
  getPages,
  getArticles
} from '../helpers/shopify_client.mjs';
import {
  listSitemaps,
  inspectUrl
} from '../helpers/gsc_client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const tier3Tests = [
  // =========================================================================
  // T3-PAIR-01: F6 (Delete Legacy) + F7 (301 Redirects)
  // =========================================================================
  {
    id: 'T3-PAIR-01',
    name: 'Legacy Collection Deletion with Pre-Established 301 Redirects',
    tier: 3,
    feature: 6,
    async run(ctx) {
      // 1. Verify 301 redirect is established for legacy handle
      const res = await fetchUrl('https://printswithpassion.com/collections/dog-collars', ctx);
      assertEqual(res.status, 301, 'Legacy handle must return 301 redirect');
      assertOk(res.location.startsWith('/collections/'), 'Location header points to active collection');

      // 2. Verify collection record in Admin API is deleted (returns null)
      const coll = await getCollectionByHandle('dog-collars', ctx);
      assertEqual(coll, null, 'Deleted collection must return null in GraphQL');

      // 3. Verify destination URL resolves to HTTP 200
      const targetRes = await fetchUrl(`https://printswithpassion.com${res.location}`, ctx);
      assertEqual(targetRes.status, 200, 'Redirect destination must be healthy 200');
    }
  },

  // =========================================================================
  // T3-PAIR-02: F8 (Unpublish AVADA) + F17 (Sitemap Idempotency)
  // =========================================================================
  {
    id: 'T3-PAIR-02',
    name: 'Unpublishing AVADA Collection vs GSC Sitemap Idempotency',
    tier: 3,
    feature: 8,
    async run(ctx) {
      // 1. AVADA collection must be excluded from collections sitemap
      const sitemapRes = await fetchUrl('https://printswithpassion.com/sitemap_collections_1.xml', ctx);
      assertNotIncludes(sitemapRes.body, 'avada-upsell-best-sellers', 'AVADA handle must be absent from sitemap XML');

      // 2. GSC sitemaps list retains healthy status and does not churn PUTs
      const sitemaps = await listSitemaps(undefined, ctx);
      const healthySitemaps = sitemaps.filter(s => s.errors === 0);
      assertOk(healthySitemaps.length >= 7, 'Healthy child sitemaps preserved in GSC');
    }
  },

  // =========================================================================
  // T3-PAIR-03: F7 (301 Redirects) + F9 (Blog Guide Redirect Fix)
  // =========================================================================
  {
    id: 'T3-PAIR-03',
    name: 'Legacy 301 Redirect Collision Resolution on Published Blog Guide',
    tier: 3,
    feature: 9,
    async run(ctx) {
      // 1. Verify redirect table has no collision on blog guide
      const redirects = await getUrlRedirects(ctx);
      const collision = redirects.find(r => r.path.includes('uk-student-room-rental-flat-decor-guide'));
      assertEqual(collision, undefined, 'Conflicting redirect on blog guide must be removed');

      // 2. Storefront serves HTTP 200 for blog guide (NOT 301 to collections)
      const res = await fetchUrl('https://printswithpassion.com/blogs/news/uk-student-room-rental-flat-decor-guide', ctx);
      assertEqual(res.status, 200, 'Blog guide URL must serve HTTP 200 directly');
      assertOk(res.body.length > 100, 'Article content rendered cleanly');
    }
  },

  // =========================================================================
  // T3-PAIR-04: F11 (Collection Titles) + F19 (Title Truncator)
  // =========================================================================
  {
    id: 'T3-PAIR-04',
    name: 'Rewriting Collection Titles with Boundary Safe Truncator & Plural Guard',
    tier: 3,
    feature: 11,
    async run(ctx) {
      const {
        buildCompetitorSpecTitleAndMeta,
        fitTitleUnder60Chars,
        isSingleProductQuery
      } = await import('../../strikezone_ctr_and_competitor_rewriter.mjs');

      const entry = {
        keyword: 'Japanese Wave Desk Mat 900x400x4mm Stitched Gaming Pad Archival Quality',
        substrate: 'Desk Mats',
        targetUrl: '/collections/japanese-anime-desk-mats',
        pageType: 'collection'
      };

      assertOk(isSingleProductQuery(entry.keyword, entry.substrate), 'Single product keyword identified');
      const result = buildCompetitorSpecTitleAndMeta(
        entry,
        'Japanese Anime Desk Mats',
        { handle: 'japanese-anime-desk-mats', title: 'Japanese Anime Desk Mats' }
      );

      assertIncludes(result.newTitle, 'Desk Mats', 'Category plural guard converted Desk Mat -> Desk Mats');
      assertRange(result.newTitle.length, 20, 60, `Output title length fits <= 60 chars (got ${result.newTitle.length}: "${result.newTitle}")`);
      assertNotRegex(result.newTitle, /\bDesk Mat$/, 'Not single product noun');
    }
  },

  // =========================================================================
  // T3-PAIR-05: F12 (Collection Meta) + F20 (SEO Lint Gate)
  // =========================================================================
  {
    id: 'T3-PAIR-05',
    name: 'Rewritten Collection Descriptions Pass Storewide SEO Lint Gate',
    tier: 3,
    feature: 12,
    async run(ctx) {
      const colls = await getAllCollections(ctx);
      const active = colls.filter(c => c.productsCount?.count > 0);

      for (const c of active) {
        const desc = c.seo?.description || '';
        assertRange(desc.length, 140, 158, `Description for ${c.handle} must meet length gate`);
        assertNotIncludes(desc, '&quot;', `Description for ${c.handle} must not contain &quot;`);
        assertNotRegex(desc, /^Transform with /i, `Description for ${c.handle} must not use "Transform with" cliché`);
        assertNotRegex(desc, /^Elevate with /i, `Description for ${c.handle} must not use "Elevate with" cliché`);
      }
    }
  },

  // =========================================================================
  // T3-PAIR-06: F5 (48 Sub-Collection Hub) + F13 (Specific Collections Fix)
  // =========================================================================
  {
    id: 'T3-PAIR-06',
    name: 'Curated Studio Hub Links Match Canonical Repaired Handles with Zero Hops',
    tier: 3,
    feature: 5,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      assertIncludes(res.body, '/collections/japanese-anime-desk-mats', 'Anime desk mats linked in hub');
      assertIncludes(res.body, '/collections/abstract-minimalist-bauhaus-canvas-wall-art', 'Bauhaus canvas linked in hub');

      // Test direct access to both repaired handles
      const animeRes = await fetchUrl('https://printswithpassion.com/collections/japanese-anime-desk-mats', ctx);
      assertEqual(animeRes.status, 200, 'Anime collection returns direct 200 without redirect');
      const bauhausRes = await fetchUrl('https://printswithpassion.com/collections/abstract-minimalist-bauhaus-canvas-wall-art', ctx);
      assertEqual(bauhausRes.status, 200, 'Bauhaus collection returns direct 200 without redirect');
    }
  },

  // =========================================================================
  // T3-PAIR-07: F14 (Page Inner H1) + F15 (Page SEO Metadata & Links)
  // =========================================================================
  {
    id: 'T3-PAIR-07',
    name: 'Page Inner H1 Demotion Combined with Page SEO Metadata & Hub Linking',
    tier: 3,
    feature: 14,
    async run(ctx) {
      const pages = await getPages(ctx);
      const guideSample = pages.find(p => p.handle === 'xxl-extended-gaming-desk-mats-uk-guide');
      assertOk(guideSample, 'Gaming desk mats guide page exists');

      // 1. Check title length
      assertRange(guideSample.seo.title.length, 20, 60, 'Title <= 60 chars');
      // 2. Check description length
      assertRange(guideSample.seo.description.length, 145, 158, 'Description 145-158 chars');
      // 3. Check inner H1 demoted to H2 in body
      assertNotRegex(guideSample.body, /<h1\b/i, 'Zero H1s in page body');
      assertIncludes(guideSample.body, '<h2', 'Converted to H2 in page body');
    }
  },

  // =========================================================================
  // T3-PAIR-08: F16 (Blog Article Links) + F5 (Sub-Collection Hub)
  // =========================================================================
  {
    id: 'T3-PAIR-08',
    name: 'Contextual Internal Links in Articles Resolve to Active Curated Hub Collections',
    tier: 3,
    feature: 16,
    async run(ctx) {
      const articles = await getArticles(ctx);
      const subcollectionsRaw = JSON.parse(
        fs.readFileSync(path.join(REPO_ROOT, 'phase2_40_subcollections.json'), 'utf8')
      );
      const validSubHandles = new Set(subcollectionsRaw.map(s => s.handle));

      const firstArticle = articles[0];
      const links = extractLinks(firstArticle.body);
      const collectionLinks = links.filter(l => l.href.startsWith('/collections/')).map(l => l.href.replace('/collections/', ''));

      assertOk(collectionLinks.length > 0, 'Article contains links to collections');
      for (const handle of collectionLinks) {
        assertOk(validSubHandles.has(handle) || ['canvas-prints', 'desk-mats', 'blankets'].includes(handle), `Article links to valid active collection ${handle}`);
      }
    }
  },

  // =========================================================================
  // T3-PAIR-09: F1 (Homepage Meta) + F2 (Single H1) + F3 (Auth Link) + F4 (Email Typo)
  // =========================================================================
  {
    id: 'T3-PAIR-09',
    name: 'Full Integrated Homepage Theme Overhaul Verification',
    tier: 3,
    feature: 1,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);

      // F1: Title & meta
      const title = extractTitle(res.body);
      const desc = extractMetaDescription(res.body);
      assertRange(title.length, 30, 65, 'Title length <= 65');
      assertRange(desc.length, 140, 160, 'Description length 140-160');

      // F2: Single H1
      const h1s = extractH1s(res.body);
      assertEqual(h1s.length, 1, 'Exactly 1 H1 element');

      // F3: Clean Auth Link
      assertNotRegex(res.body, /href=["']\/https?:/i, 'No concat auth link bugs');

      // F4: Correct Email
      assertNotRegex(res.body, /\bprintswithpasssion(?:bc)?\b/i, 'Zero triple-s email typos');
      assertIncludes(res.body, 'printswithpassionbc@gmail.com', 'Correct contact email present');
    }
  },

  // =========================================================================
  // T3-PAIR-10: F17 (Sitemap Idempotency) + F18 (URL Inspection)
  // =========================================================================
  {
    id: 'T3-PAIR-10',
    name: 'Combined Cloud Sync Sitemap Verification and Rotating URL Inspection',
    tier: 3,
    feature: 17,
    async run(ctx) {
      const start = Date.now();

      // 1. Verify sitemaps list
      const sitemaps = await listSitemaps(undefined, ctx);
      assertOk(sitemaps.length > 0, 'Sitemaps queried');

      // 2. Perform 1 inspection
      const inspectRes = await inspectUrl('https://printswithpassion.com/', undefined, { ...ctx, delayMs: 100 });
      assertOk(inspectRes !== null, 'URL inspection completed');

      const elapsed = Date.now() - start;
      assertOk(elapsed < 10000, `Combined operations completed well within window (took ${elapsed}ms)`);
    }
  }
];
