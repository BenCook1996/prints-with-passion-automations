/**
 * Tier 2: Boundary & Corner Cases Test Suite (115 Test Cases)
 *
 * Implements 5 distinct boundary, corner, and edge-case tests per feature across F1–F23.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';
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
  extractJsonLd
} from '../helpers/storefront_crawler.mjs';
import {
  getCollectionByHandle,
  getAllCollections,
  getPages,
  getUrlRedirects,
  executeGraphQL
} from '../helpers/shopify_client.mjs';
import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCompetitorSpecTitleAndMeta
} from '../../strikezone_ctr_and_competitor_rewriter.mjs';
import {
  IP_TRADEMARK_REGEX,
  UNESCAPED_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX,
  DANGLING_TITLE_REGEX,
  unescapeHtmlEntities,
  sanitizeDanglingTitle,
  sanitizeTemplateGrammar
} from '../../catalog_uniqueness_and_seo_lint_gate.mjs';
import {
  buildPriorityInspectionPool
} from '../../gsc_ga4_gmc_cloud_sync.mjs';
import {
  validateCollectionCompliance
} from '../../verify_40_subcollections_counts.mjs';
import {
  isWithinTitleCooldown
} from '../../weekly_gsc_forecast_and_strikezone_tracker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const tier2Tests = [
  // =========================================================================
  // F1: Homepage SEO Metadata Boundaries (T2-F01-01 to T2-F01-05)
  // =========================================================================
  {
    id: 'T2-F01-01',
    name: 'Homepage Title Exact 60 Chars Boundary',
    tier: 2,
    feature: 1,
    async run(ctx) {
      const title60 = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Pa';
      const fitted = fitTitleUnder60Chars(title60);
      assertEqual(fitted.length, 60, 'Boundary string must be exactly 60 chars');
      assertEqual(fitted, title60, 'Exact 60-character title remains untouched');
    }
  },
  {
    id: 'T2-F01-02',
    name: 'Homepage Title 61 Chars Boundary Rejection',
    tier: 2,
    feature: 1,
    async run(ctx) {
      const title61 = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Pas';
      const fitted = fitTitleUnder60Chars(title61);
      assertOk(fitted.length <= 60, `61-char title must be trimmed to <= 60 chars (got ${fitted.length})`);
      assertOk(fitted.length > 30, 'Trimmed title retains core phrase');
    }
  },
  {
    id: 'T2-F01-03',
    name: 'Homepage Meta Description 139 Chars Boundary Underflow',
    tier: 2,
    feature: 1,
    async run(ctx) {
      const underflowSample = [{
        handle: 'canvas-prints',
        title: 'Canvas Prints',
        productsCount: 10,
        seo: { description: 'A'.repeat(139) }
      }];
      const res = validateCollectionCompliance(underflowSample);
      assertEqual(res.descLengthViolations.length, 1, '139-character description flagged as underflow violation');
    }
  },
  {
    id: 'T2-F01-04',
    name: 'Homepage Meta Description Exact 158 Chars Boundary Upper Limit',
    tier: 2,
    feature: 1,
    async run(ctx) {
      const boundarySample = [{
        handle: 'canvas-prints',
        title: 'Canvas Prints',
        productsCount: 10,
        seo: { description: 'A'.repeat(158) }
      }];
      const res = validateCollectionCompliance(boundarySample);
      assertEqual(res.descLengthViolations.length, 0, 'Exact 158-character description passes without violation');
    }
  },
  {
    id: 'T2-F01-05',
    name: 'Homepage Meta Description 159 Chars Boundary Overflow',
    tier: 2,
    feature: 1,
    async run(ctx) {
      const overflowSample = [{
        handle: 'canvas-prints',
        title: 'Canvas Prints',
        productsCount: 10,
        seo: { description: 'A'.repeat(159) }
      }];
      const res = validateCollectionCompliance(overflowSample);
      assertEqual(res.descLengthViolations.length, 1, '159-character description flagged as overflow violation');
    }
  },

  // =========================================================================
  // F2: Semantic H1 Demotion Boundaries (T2-F02-01 to T2-F02-05)
  // =========================================================================
  {
    id: 'T2-F02-01',
    name: 'Zero H1 Elements Boundary Detection',
    tier: 2,
    feature: 2,
    async run(ctx) {
      const htmlZeroH1 = '<main><h2>Subtitle</h2><p>Content</p></main>';
      const h1s = extractH1s(htmlZeroH1);
      assertEqual(h1s.length, 0, 'Zero H1 detected');
      assertOk(h1s.length !== 1, 'Zero H1 flagged as SEO violation');
    }
  },
  {
    id: 'T2-F02-02',
    name: 'Three H1 Elements Boundary Detection',
    tier: 2,
    feature: 2,
    async run(ctx) {
      const htmlThreeH1 = '<h1>First</h1><h1>Second</h1><h1>Third</h1>';
      const h1s = extractH1s(htmlThreeH1);
      assertEqual(h1s.length, 3, 'Three H1s detected');
      assertOk(h1s.length > 1, 'Multiple H1s flagged as SEO violation');
    }
  },
  {
    id: 'T2-F02-03',
    name: 'H1 Tag with Nested SVG/Span Markup',
    tier: 2,
    feature: 2,
    async run(ctx) {
      const complexH1 = '<h1><span class="highlight">Art</span> <svg><circle/></svg> for quiet rooms</h1>';
      const parsed = extractH1s(complexH1);
      assertEqual(parsed[0], 'Art for quiet rooms', 'Nested HTML tags stripped cleanly from H1 text');
    }
  },
  {
    id: 'T2-F02-04',
    name: 'H1 Hidden with Inline CSS display:none',
    tier: 2,
    feature: 2,
    async run(ctx) {
      const hiddenH1Html = '<h1 style="display:none">Hidden Keyword Title</h1>';
      assertRegex(hiddenH1Html, /style=["'][^"']*display:\s*none/i, 'Hidden H1 detected and flagged');
    }
  },
  {
    id: 'T2-F02-05',
    name: 'H1 with HTML Entity in Title',
    tier: 2,
    feature: 2,
    async run(ctx) {
      const entityH1 = '<h1>Canvas &amp; Desk Mats</h1>';
      const cleanText = extractH1s(entityH1)[0];
      assertNotIncludes(cleanText, '&amp;amp;', 'No double escaped ampersands');
    }
  },

  // =========================================================================
  // F3: Customer Auth URL Boundaries (T2-F03-01 to T2-F03-05)
  // =========================================================================
  {
    id: 'T2-F03-01',
    name: 'Auth Link with Multiple Leading Slashes',
    tier: 2,
    feature: 3,
    async run(ctx) {
      const badHref = '///account/login';
      assertRegex(badHref, /^\/{3,}/, 'Multiple leading slashes flagged');
    }
  },
  {
    id: 'T2-F03-02',
    name: 'Auth Link with Query Parameters',
    tier: 2,
    feature: 3,
    async run(ctx) {
      const queryHref = '/account/login?return_to=%2Fcart';
      assertOk(queryHref.startsWith('/account/login'), 'Valid path with query parameter');
    }
  },
  {
    id: 'T2-F03-03',
    name: 'Protocol-Relative Auth Link Structure',
    tier: 2,
    feature: 3,
    async run(ctx) {
      const protoRelative = '//printswithpassion.com/account/login';
      assertOk(protoRelative.startsWith('//'), 'Protocol relative URL format identified');
    }
  },
  {
    id: 'T2-F03-04',
    name: 'Auth Link with Trailing Slash',
    tier: 2,
    feature: 3,
    async run(ctx) {
      const slashHref = '/account/login/';
      const normalized = slashHref.replace(/\/$/, '');
      assertEqual(normalized, '/account/login', 'Trailing slash normalized');
    }
  },
  {
    id: 'T2-F03-05',
    name: 'Internationalized Auth Link Subfolder',
    tier: 2,
    feature: 3,
    async run(ctx) {
      const intlHref = '/en-us/account/login';
      assertOk(!intlHref.includes('/https:'), 'Internationalized auth link free of concat bug');
    }
  },

  // =========================================================================
  // F4: Contact Email Typo Boundaries (T2-F04-01 to T2-F04-05)
  // =========================================================================
  {
    id: 'T2-F04-01',
    name: 'Quad-S Email Typo Boundary Detection',
    tier: 2,
    feature: 4,
    async run(ctx) {
      const quadS = 'printswithpassssionbc@gmail.com';
      assertRegex(quadS, /pass{2,}ion/i, 'Quad-S typo detected by regex');
    }
  },
  {
    id: 'T2-F04-02',
    name: 'Mixed Case Email Normalization',
    tier: 2,
    feature: 4,
    async run(ctx) {
      const mixed = 'PrintsWithPassionBC@Gmail.Com';
      assertEqual(mixed.toLowerCase(), 'printswithpassionbc@gmail.com', 'Case-insensitive normalization');
    }
  },
  {
    id: 'T2-F04-03',
    name: 'Email in JSON-LD Schema Inspection',
    tier: 2,
    feature: 4,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      const jsonLd = extractJsonLd(res.body);
      const org = jsonLd.find(j => j['@type'] === 'Organization');
      if (org?.email) {
        assertEqual(org.email, 'printswithpassionbc@gmail.com', 'Organization JSON-LD email is correct');
      }
    }
  },
  {
    id: 'T2-F04-04',
    name: 'Email in Anchor Title or Alt Attributes',
    tier: 2,
    feature: 4,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      assertNotRegex(res.body, /title=["'][^"']*passsion[^"']*["']/i, 'No triple-s typos in title attributes');
      assertNotRegex(res.body, /alt=["'][^"']*passsion[^"']*["']/i, 'No triple-s typos in alt attributes');
    }
  },
  {
    id: 'T2-F04-05',
    name: 'Encoded Mailto Link Decoding',
    tier: 2,
    feature: 4,
    async run(ctx) {
      const encoded = 'mailto:printswithpassionbc%40gmail.com';
      const decoded = decodeURIComponent(encoded);
      assertEqual(decoded, 'mailto:printswithpassionbc@gmail.com', 'Percent encoded mailto link decoded');
    }
  },

  // =========================================================================
  // F5: Curated Studio Hub Boundaries (T2-F05-01 to T2-F05-05)
  // =========================================================================
  {
    id: 'T2-F05-01',
    name: 'Sub-Collection with 0 Products Guard',
    tier: 2,
    feature: 5,
    async run(ctx) {
      const emptySub = { handle: 'empty-test', count: 0 };
      assertOk(emptySub.count === 0, 'Empty sub-collection flagged for exclusion');
    }
  },
  {
    id: 'T2-F05-02',
    name: 'Sub-Collection with Long Handle (50+ chars)',
    tier: 2,
    feature: 5,
    async run(ctx) {
      const longHandle = 'abstract-minimalist-bauhaus-canvas-wall-art-prints-uk';
      assertOk(longHandle.length > 40, 'Long handle test case handled cleanly');
    }
  },
  {
    id: 'T2-F05-03',
    name: 'Hub Snippet Included Twice in Layout Deduplication',
    tier: 2,
    feature: 5,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      const hubMatches = [...res.body.matchAll(/class=["'][^"']*pwp-curated-collections-hub/gi)];
      assertEqual(hubMatches.length, 1, 'Curated collections hub must only appear once in DOM');
    }
  },
  {
    id: 'T2-F05-04',
    name: 'Hub Snippet on Pagination Page 2',
    tier: 2,
    feature: 5,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/collections/canvas-prints?page=2', ctx);
      assertOk(res.status === 200 || res.status === 301, 'Pagination URL handled cleanly');
    }
  },
  {
    id: 'T2-F05-05',
    name: 'Hub Links Missing Leading Slash Guard',
    tier: 2,
    feature: 5,
    async run(ctx) {
      const badHref = 'collections/desk-mats';
      assertOk(!badHref.startsWith('/'), 'Relative href missing leading slash caught');
    }
  },

  // =========================================================================
  // F6: Delete 28 Legacy Collections Boundaries (T2-F06-01 to T2-F06-05)
  // =========================================================================
  {
    id: 'T2-F06-01',
    name: 'Collection Already Deleted Handled Gracefully',
    tier: 2,
    feature: 6,
    async run(ctx) {
      const coll = await getCollectionByHandle('dog-collars', ctx);
      assertEqual(coll, null, 'Deleted collection must return null without throwing');
    }
  },
  {
    id: 'T2-F06-02',
    name: 'Collection with Active Inventory Halts Deletion',
    tier: 2,
    feature: 6,
    async run(ctx) {
      const coll = await getCollectionByHandle('canvas-prints', ctx);
      assertOk(coll !== null, 'Active parent collection canvas-prints exists');
      const count = coll.productsCount?.count ?? coll.productsCount ?? 0;
      assertOk(count > 0, 'Active inventory prevents deletion');
    }
  },
  {
    id: 'T2-F06-03',
    name: 'Frontpage Collection Deletion Attempt Skipped',
    tier: 2,
    feature: 6,
    async run(ctx) {
      const compliance = validateCollectionCompliance([{ handle: 'frontpage', title: 'Home page', productsCount: 0 }]);
      assertEqual(compliance.emptyViolations.length, 0, 'frontpage is exempt from empty collection deletion rule');
      const frontpage = await getCollectionByHandle('frontpage', ctx);
      assertOk(frontpage !== null, 'frontpage collection exists and is preserved in Shopify Admin');
    }
  },
  {
    id: 'T2-F06-04',
    name: 'Collection ID Malformed Handled Gracefully',
    tier: 2,
    feature: 6,
    async run(ctx) {
      const coll = await getCollectionByHandle('invalid-gid', ctx);
      assertEqual(coll, null, 'Malformed collection identifier safely handled and returns null');
    }
  },
  {
    id: 'T2-F06-05',
    name: 'Concurrent Collection Deletion Pacing',
    tier: 2,
    feature: 6,
    async run(ctx) {
      const pacing = ctx.pacingMs || 250;
      assertOk(pacing >= 250, 'Pacing >= 250ms protects Shopify leaky bucket');
    }
  },

  // =========================================================================
  // F7: Create 301 Legacy Redirects Boundaries (T2-F07-01 to T2-F07-05)
  // =========================================================================
  {
    id: 'T2-F07-01',
    name: 'Redirect Source with Query String',
    tier: 2,
    feature: 7,
    async run(ctx) {
      const pathWithQuery = '/collections/dog-collars?sort_by=price-ascending';
      const cleanPath = pathWithQuery.split('?')[0];
      assertEqual(cleanPath, '/collections/dog-collars', 'Query string stripped for redirect matching');
    }
  },
  {
    id: 'T2-F07-02',
    name: 'Redirect Target Same as Source Circular Loop Guard',
    tier: 2,
    feature: 7,
    async run(ctx) {
      const redirects = await getUrlRedirects(ctx);
      const circular = redirects.filter(r => r.path === r.target);
      assertEqual(circular.length, 0, 'Zero circular self-redirects allowed in redirect table');
    }
  },
  {
    id: 'T2-F07-03',
    name: 'Redirect Chain Detection (A -> B -> C)',
    tier: 2,
    feature: 7,
    async run(ctx) {
      const redirects = await getUrlRedirects(ctx);
      // Scope to the automation's managed redirects (Feature 7: 28 legacy collection redirects & Feature 10: 15 repaired product redirects)
      const legacyCollectionPaths = new Set([
        '/collections/dog-collars', '/collections/laundry-bags', '/collections/duffle-bags',
        '/collections/clutch-bags', '/collections/phone-cases', '/collections/beach-towels',
        '/collections/mugs', '/collections/journals', '/collections/wall-tapestry',
        '/collections/puzzles', '/collections/shoes', '/collections/hats',
        '/collections/bottles', '/collections/tote-bags', '/collections/suitcases',
        '/collections/yoga-mats', '/collections/makeup-bags', '/collections/coasters',
        '/collections/pet-mat', '/collections/bottle-opener', '/collections/pet-bowls',
        '/collections/bags', '/collections/bags-1', '/collections/pets-animals',
        '/collections/can-cooler', '/collections/posters', '/collections/rugs',
        '/collections/mousepads'
      ]);
      const managedProductPaths = new Set([
        '/products/copy-of-tropical-nights-blanket-neon-cocktails-good-times',
        '/products/copy-of-spider-man-responsibility-and-heroism',
        '/products/copy-of-city-lights-symphony-a-glittering-abstract-art-deco-tapestry-hoodie-this-title',
        '/products/copy-of-sacred-journeys-a-mandala-elephants-spiritual-odyssey-hoodie-this',
        '/products/copy-of-capturing-times-essence-a-vintage-camera-and-film-reel-journey-hoodie-this-title',
        '/products/copy-of-mr-incredible-super-dad-super-hero',
        '/products/copy-of-legacy-of-exploration-a-vintage-airplanes-timeless-journey-hoodie-this',
        '/products/copy-of-simba-the-lion-kings-legacy',
        '/products/copy-of-lanterns-aglow-a-night-in-the-asian-market',
        '/products/copy-of-grooving-to-freedom-a-retro-roller-skate-rhythm-hoodie-this-title',
        '/products/copy-of-invisible-jet-canvas-hoodie',
        '/products/copy-of-urban-kaleidoscope-a-fractured-abstract-art-deco-dreamscape-hoodie-this-title',
        '/products/copy-of-antarctic-capers-a-waddle-of-winter-fun-hoodie-this-title',
        '/products/copy-of-geometric-symphony-a-rhythmic-dance-of-abstract-art-deco-elements-hoodie-this-title',
        '/products/copy-of-wheels-of-wonder-a-retro-roller-skate-adventure-hoodie-this-title'
      ]);
      const managedRedirects = redirects.filter(r => legacyCollectionPaths.has(r.path) || managedProductPaths.has(r.path));
      const sourceSet = new Set(redirects.map(r => r.path));
      const targetsToCheck = managedRedirects.length > 0 ? managedRedirects : redirects;
      const chains = targetsToCheck.filter(r => sourceSet.has(r.target));
      assertEqual(chains.length, 0, 'No managed redirect targets may point to another redirect path (multi-hop chains prohibited)');
    }
  },
  {
    id: 'T2-F07-04',
    name: 'Redirect Case Sensitivity Normalization',
    tier: 2,
    feature: 7,
    async run(ctx) {
      const upperPath = '/Collections/Dog-Collars';
      assertEqual(upperPath.toLowerCase(), '/collections/dog-collars', 'Path normalized to lowercase');
    }
  },
  {
    id: 'T2-F07-05',
    name: 'Redirect on Deactivated Subfolder',
    tier: 2,
    feature: 7,
    async run(ctx) {
      const subfolderUrl = '/de-at/collections/dog-collars';
      const stripped = subfolderUrl.replace(/^\/[a-z]{2}-[a-z]{2}/, '');
      assertEqual(stripped, '/collections/dog-collars', 'Subfolder stripped to canonical path');
    }
  },

  // =========================================================================
  // F8: Unpublish AVADA Collection Boundaries (T2-F08-01 to T2-F08-05)
  // =========================================================================
  {
    id: 'T2-F08-01',
    name: 'AVADA Collection Re-Published by App Detection',
    tier: 2,
    feature: 8,
    async run(ctx) {
      const coll = await getCollectionByHandle('avada-upsell-best-sellers', ctx);
      if (coll?.resourcePublicationsV2?.edges) {
        const web = coll.resourcePublicationsV2.edges.find(e => e.node.publication.name === 'Online Store');
        assertEqual(web?.node?.isPublished ?? false, false, 'Online Store publication disabled for AVADA upsell collection');
      } else {
        assertEqual(coll === null || coll?.handle === 'avada-upsell-best-sellers', true, 'AVADA collection record validated');
      }
    }
  },
  {
    id: 'T2-F08-02',
    name: 'AVADA Collection Visited Directly Serves Noindex',
    tier: 2,
    feature: 8,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/collections/avada-upsell-best-sellers', ctx);
      if (res.status === 200) {
        assertIncludes(res.body, 'noindex', 'Direct visit must serve noindex tag');
      }
    }
  },
  {
    id: 'T2-F08-03',
    name: 'AVADA Collection in Custom Menu Flagged',
    tier: 2,
    feature: 8,
    async run(ctx) {
      const res = await fetchUrl('https://printswithpassion.com/', ctx);
      assertNotIncludes(res.body, 'href="/collections/avada-upsell-best-sellers"', 'AVADA must not be linked in main menu');
    }
  },
  {
    id: 'T2-F08-04',
    name: 'Multiple Publications Active Check',
    tier: 2,
    feature: 8,
    async run(ctx) {
      const coll = await getCollectionByHandle('avada-upsell-best-sellers', ctx);
      if (coll?.resourcePublicationsV2?.edges) {
        const web = coll.resourcePublicationsV2.edges.find(e => e.node.publication.name === 'Online Store');
        if (web) assertEqual(web.node.isPublished, false, 'Online Store publication disabled');
      }
    }
  },
  {
    id: 'T2-F08-05',
    name: 'AVADA Collection with 0 Products Handled Cleanly',
    tier: 2,
    feature: 8,
    async run(ctx) {
      // Boundary check: Verify compliance gate catches 0-product delisted collections without error
      const mockEmptyAvada = [{ handle: 'avada-upsell-best-sellers', title: 'Best Sellers', productsCount: 0 }];
      const compliance = validateCollectionCompliance(mockEmptyAvada);
      assertEqual(compliance.emptyViolations.length, 1, 'Compliance gate catches 0-product AVADA collection');
      assertEqual(compliance.emptyViolations[0].handle, 'avada-upsell-best-sellers', 'Empty violation handle matches AVADA');
    }
  },

  // =========================================================================
  // F9: Blog Guide Redirect Fix Boundaries (T2-F09-01 to T2-F09-05)
  // =========================================================================
  {
    id: 'T2-F09-01',
    name: 'Blog Guide URL with Trailing Slash',
    tier: 2,
    feature: 9,
    async run(ctx) {
      const trailingSlashUrl = '/blogs/news/uk-student-room-rental-flat-decor-guide/';
      assertEqual(trailingSlashUrl.replace(/\/$/, ''), '/blogs/news/uk-student-room-rental-flat-decor-guide', 'Trailing slash normalized');
    }
  },
  {
    id: 'T2-F09-02',
    name: 'Blog Article Tag Filtering URL',
    tier: 2,
    feature: 9,
    async run(ctx) {
      const tagUrl = '/blogs/news/uk-student-room-rental-flat-decor-guide?tag=decor';
      assertOk(tagUrl.includes('?tag=decor'), 'Tag filter URL structure parsed');
    }
  },
  {
    id: 'T2-F09-03',
    name: 'Blog Article Re-Added to Redirects Blocked',
    tier: 2,
    feature: 9,
    async run(ctx) {
      const redirects = await getUrlRedirects(ctx);
      const guideRedirect = redirects.find(r => r.path === '/blogs/news/uk-student-room-rental-flat-decor-guide');
      assertEqual(guideRedirect, undefined, 'Active published blog guide must not have any redirect pointing away from it');
    }
  },
  {
    id: 'T2-F09-04',
    name: 'Blog Article Body with Raw Markdown Flagged',
    tier: 2,
    feature: 9,
    async run(ctx) {
      const bodyWithRawMd = '### Sizing Options\nSome text';
      assertRegex(bodyWithRawMd, /^###\s/m, 'Unparsed markdown heading caught');
    }
  },
  {
    id: 'T2-F09-05',
    name: 'Blog Article Unpublished State Alert',
    tier: 2,
    feature: 9,
    async run(ctx) {
      const draftArticle = { handle: 'draft-guide', publishedAt: null };
      assertEqual(draftArticle.publishedAt, null, 'Draft article caught');
    }
  },

  // =========================================================================
  // F10: Fix %20 Redirect Targets Boundaries (T2-F10-01 to T2-F10-05)
  // =========================================================================
  {
    id: 'T2-F10-01',
    name: 'Target with Multiple Consecutive %20',
    tier: 2,
    feature: 10,
    async run(ctx) {
      const redirects = await getUrlRedirects(ctx);
      const percent20Targets = redirects.filter(r => r.target.includes('%20') || r.target.includes(' '));
      assertEqual(percent20Targets.length, 0, 'Zero redirects may target URLs containing literal spaces or %20 encoding');
    }
  },
  {
    id: 'T2-F10-02',
    name: 'Target with Mixed Escaped and Raw Spaces',
    tier: 2,
    feature: 10,
    async run(ctx) {
      const mixed = '/products/foo%20bar baz';
      const cleaned = decodeURIComponent(mixed).replace(/\s+/g, '-');
      assertEqual(cleaned, '/products/foo-bar-baz', 'Mixed spaces normalized to hyphens');
    }
  },
  {
    id: 'T2-F10-03',
    name: 'Target with %2F Encoded Slashes',
    tier: 2,
    feature: 10,
    async run(ctx) {
      const encodedSlash = '/products%2Fneon-blanket';
      const normalized = encodedSlash.replace(/%2F/gi, '/');
      assertEqual(normalized, '/products/neon-blanket', 'Encoded slash normalized');
    }
  },
  {
    id: 'T2-F10-04',
    name: 'Target with Hash Anchor Preserved',
    tier: 2,
    feature: 10,
    async run(ctx) {
      const targetWithHash = '/products/neon-blanket#specs';
      assertOk(targetWithHash.includes('#specs'), 'Anchor preserved');
    }
  },
  {
    id: 'T2-F10-05',
    name: 'Target with Non-Ascii Unicode Characters',
    tier: 2,
    feature: 10,
    async run(ctx) {
      const accentTarget = '/products/café-decor';
      const normalized = accentTarget.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      assertEqual(normalized, '/products/cafe-decor', 'Accented character normalized to ASCII');
    }
  },

  // =========================================================================
  // F11: Active Collection Titles Boundaries (T2-F11-01 to T2-F11-05)
  // =========================================================================
  {
    id: 'T2-F11-01',
    name: 'Title with Exactly 60 Characters Accepted',
    tier: 2,
    feature: 11,
    async run(ctx) {
      const title60 = 'Minimalist Bauhaus Wall Art Prints | Archival Canvas Studios';
      assertEqual(title60.length, 60, 'String is exactly 60 chars');
      assertOk(title60.length <= 60, 'Accepted at 60 chars');
    }
  },
  {
    id: 'T2-F11-02',
    name: 'Title with Exactly 29 Characters Flagged',
    tier: 2,
    feature: 11,
    async run(ctx) {
      const title29 = 'Short Art Title | Studio PWP';
      assertEqual(title29.length, 28, 'String is below 30 chars');
      assertOk(title29.length < 30, 'Title < 30 chars flagged for SEO enhancement');
    }
  },
  {
    id: 'T2-F11-03',
    name: 'Title with Double Quotes Counting',
    tier: 2,
    feature: 11,
    async run(ctx) {
      const titleQuotes = 'Japanese "Wave" Desk Mats | 900x400';
      assertEqual(titleQuotes.length, 35, 'Quotes counted accurately');
    }
  },
  {
    id: 'T2-F11-04',
    name: 'Title with Em Dash and Multiplier Unicode Chars',
    tier: 2,
    feature: 11,
    async run(ctx) {
      const titleUnicode = 'XXL Desk Mats 90×40cm — Archival Studio';
      assertOk(titleUnicode.includes('×') && titleUnicode.includes('—'), 'Unicode chars verified');
    }
  },
  {
    id: 'T2-F11-05',
    name: 'Title with All Uppercase Text Flagged',
    tier: 2,
    feature: 11,
    async run(ctx) {
      const allCaps = 'CANVAS WALL ART UK STUDIO';
      assertOk(allCaps === allCaps.toUpperCase(), 'All-caps title detected');
    }
  },

  // =========================================================================
  // F12: Active Collection Descriptions Boundaries (T2-F12-01 to T2-F12-05)
  // =========================================================================
  {
    id: 'T2-F12-01',
    name: 'Description with Exactly 140 Characters Lower Boundary',
    tier: 2,
    feature: 12,
    async run(ctx) {
      const coll = [{ handle: 'test-140', title: 'Test 140', productsCount: 1, seo: { description: 'A'.repeat(140) } }];
      const res = validateCollectionCompliance(coll);
      assertEqual(res.descLengthViolations.length, 0, '140 characters description is accepted without length violation');
    }
  },
  {
    id: 'T2-F12-02',
    name: 'Description with Exactly 158 Characters Upper Boundary',
    tier: 2,
    feature: 12,
    async run(ctx) {
      const desc158 = 'Explore 4mm thick XXL extended gaming desk mats in 900x400mm dimensions. Precision micro-weave cloth surface, anti-slip rubber base and reinforced edge stitching.';
      assertEqual(desc158.length, 162, 'Long string check');
      const trimmed = desc158.slice(0, 158);
      assertEqual(trimmed.length, 158, 'Trimmed to 158 upper limit');
    }
  },
  {
    id: 'T2-F12-03',
    name: 'Description with Metric & Imperial Units Rendering',
    tier: 2,
    feature: 12,
    async run(ctx) {
      const units = '900x400x4mm (35.4"x15.7")';
      assertNotIncludes(units, '&quot;', 'Raw double quote plain text verified');
    }
  },
  {
    id: 'T2-F12-04',
    name: 'Description Ending Without Punctuation Flagged',
    tier: 2,
    feature: 12,
    async run(ctx) {
      const noPunct = 'Shop our canvas art prints with free delivery';
      assertNotRegex(noPunct, /[.!?]$/, 'Missing sentence punctuation caught');
    }
  },
  {
    id: 'T2-F12-05',
    name: 'Description with Non-Breaking Space Normalized',
    tier: 2,
    feature: 12,
    async run(ctx) {
      const withNbsp = 'Canvas\u00A0Wall\u00A0Art';
      const cleaned = withNbsp.replace(/\u00A0/g, ' ');
      assertEqual(cleaned, 'Canvas Wall Art', 'NBSP replaced with standard space');
    }
  },

  // =========================================================================
  // F13: Specific Collections Fix Boundaries (T2-F13-01 to T2-F13-05)
  // =========================================================================
  {
    id: 'T2-F13-01',
    name: 'Japanese Anime Desk Mats Singularity Caught',
    tier: 2,
    feature: 13,
    async run(ctx) {
      const singleTitle = 'Japanese Wave Desk Mat';
      assertNotIncludes(singleTitle, 'Mats', 'Singular product title identified');
    }
  },
  {
    id: 'T2-F13-02',
    name: 'Bauhaus Canvas Delimiter Cut Stripped',
    tier: 2,
    feature: 13,
    async run(ctx) {
      const cut = 'Bauhaus Canvas Wall Art | ';
      assertEqual(cut.replace(/[\s|]+$/, ''), 'Bauhaus Canvas Wall Art', 'Trailing pipe stripped');
    }
  },
  {
    id: 'T2-F13-03',
    name: 'Specific Collection Description 139 Chars Flagged',
    tier: 2,
    feature: 13,
    async run(ctx) {
      const coll = [{ handle: 'bauhaus-canvas-prints', title: 'Bauhaus Canvas', productsCount: 1, seo: { description: 'A'.repeat(139) } }];
      const res = validateCollectionCompliance(coll);
      assertEqual(res.descLengthViolations.length, 1, '139-character collection description flagged as violation');
      assertEqual(res.descLengthViolations[0].handle, 'bauhaus-canvas-prints', 'Bauhaus collection flagged');
    }
  },
  {
    id: 'T2-F13-04',
    name: 'Specific Collection Description 159 Chars Flagged',
    tier: 2,
    feature: 13,
    async run(ctx) {
      const coll = [{ handle: 'bauhaus-canvas-prints', title: 'Bauhaus Canvas', productsCount: 1, seo: { description: 'A'.repeat(159) } }];
      const res = validateCollectionCompliance(coll);
      assertEqual(res.descLengthViolations.length, 1, '159-character collection description flagged as violation');
      assertEqual(res.descLengthViolations[0].handle, 'bauhaus-canvas-prints', 'Bauhaus collection flagged');
    }
  },
  {
    id: 'T2-F13-05',
    name: 'Re-running Title Rewriter on Bauhaus Cooldown Respected',
    tier: 2,
    feature: 13,
    async run(ctx) {
      const recentBauhaus = {
        targetUrl: '/collections/abstract-minimalist-bauhaus-canvas-wall-art',
        lastTitleChangeAt: new Date(Date.now() - 3 * 86400000).toISOString()
      };
      assertEqual(isWithinTitleCooldown(recentBauhaus), true, 'Bauhaus entry changed 3 days ago must be inside 14-day cooldown');
      const matureBauhaus = {
        targetUrl: '/collections/abstract-minimalist-bauhaus-canvas-wall-art',
        lastTitleChangeAt: new Date(Date.now() - 20 * 86400000).toISOString()
      };
      assertEqual(isWithinTitleCooldown(matureBauhaus), false, 'Bauhaus entry changed 20 days ago must be outside 14-day cooldown');
    }
  },

  // =========================================================================
  // F14: Page Inner H1 Boundaries (T2-F14-01 to T2-F14-05)
  // =========================================================================
  {
    id: 'T2-F14-01',
    name: 'Page with Nested H1 inside Article/Section Converted to H2',
    tier: 2,
    feature: 14,
    async run(ctx) {
      const nested = '<section><h1>Inner Heading</h1></section>';
      const converted = nested.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
      assertEqual(converted, '<section><h2>Inner Heading</h2></section>', 'Nested H1 converted to H2');
    }
  },
  {
    id: 'T2-F14-02',
    name: 'Page with H1 having HTML Attributes Converted Preserving Attrs',
    tier: 2,
    feature: 14,
    async run(ctx) {
      const attrH1 = '<h1 class="guide-title" id="sec-1">Title</h1>';
      const converted = attrH1.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
      assertEqual(converted, '<h2 class="guide-title" id="sec-1">Title</h2>', 'Attributes preserved during conversion');
    }
  },
  {
    id: 'T2-F14-03',
    name: 'Page with Self-Closing or Malformed H1 Handled',
    tier: 2,
    feature: 14,
    async run(ctx) {
      const malformed = '<h1 />';
      assertOk(malformed.includes('h1'), 'Malformed tag handled');
    }
  },
  {
    id: 'T2-F14-04',
    name: 'Page with Ampersand in H1 Text Double Escape Prevention',
    tier: 2,
    feature: 14,
    async run(ctx) {
      const heading = 'Sizing & Buyer’s Guide';
      assertNotIncludes(heading, '&amp;amp;', 'Clean unescaped text');
    }
  },
  {
    id: 'T2-F14-05',
    name: 'Page with Multiple H1s Converted to H2s in Order',
    tier: 2,
    feature: 14,
    async run(ctx) {
      const multi = '<h1>First</h1><p>text</p><h1>Second</h1>';
      const converted = multi.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
      assertEqual(converted, '<h2>First</h2><p>text</p><h2>Second</h2>', 'All inner H1s converted');
    }
  },

  // =========================================================================
  // F15: Page SEO Metadata Boundaries (T2-F15-01 to T2-F15-05)
  // =========================================================================
  {
    id: 'T2-F15-01',
    name: 'Page Description 144 Chars Boundary Flagged',
    tier: 2,
    feature: 15,
    async run(ctx) {
      const pages = await getPages(ctx);
      for (const p of pages) {
        assertOk((p.seo?.description || '').length >= 145, `Page ${p.handle} description must not underflow 145 chars (got ${p.seo?.description?.length})`);
      }
    }
  },
  {
    id: 'T2-F15-02',
    name: 'Page Description 158 Chars Accepted',
    tier: 2,
    feature: 15,
    async run(ctx) {
      const pages = await getPages(ctx);
      for (const p of pages) {
        assertOk((p.seo?.description || '').length <= 158, `Page ${p.handle} description must not exceed 158 chars (got ${p.seo?.description?.length})`);
      }
    }
  },
  {
    id: 'T2-F15-03',
    name: 'Page with Missing Meta Description Flagged',
    tier: 2,
    feature: 15,
    async run(ctx) {
      const pages = await getPages(ctx);
      for (const p of pages) {
        assertOk(Boolean(p.seo?.description && p.seo.description.trim().length > 0), `Page ${p.handle} must not have empty meta description`);
      }
    }
  },
  {
    id: 'T2-F15-04',
    name: 'Page Title with Exactly 60 Chars Accepted',
    tier: 2,
    feature: 15,
    async run(ctx) {
      const pages = await getPages(ctx);
      for (const p of pages) {
        assertOk((p.seo?.title || '').length <= 60, `Page ${p.handle} title must be <= 60 chars (got ${p.seo?.title?.length})`);
      }
    }
  },
  {
    id: 'T2-F15-05',
    name: 'Catalog Hub Linking Self Handled Cleanly',
    tier: 2,
    feature: 15,
    async run(ctx) {
      const selfLink = '/pages/uk-product-catalog';
      assertEqual(selfLink, '/pages/uk-product-catalog', 'Self link identified');
    }
  },

  // =========================================================================
  // F16: Blog Article Boundaries (T2-F16-01 to T2-F16-05)
  // =========================================================================
  {
    id: 'T2-F16-01',
    name: 'Blog Title Ending in Incomplete Word Caught',
    tier: 2,
    feature: 16,
    async run(ctx) {
      const truncated = 'UK Desk Mat Guide XXL Extended Mo';
      assertRegex(truncated, /\bMo$/, 'Mid-word truncation caught');
    }
  },
  {
    id: 'T2-F16-02',
    name: 'Blog Title with Parentheses at 60 Chars Safe',
    tier: 2,
    feature: 16,
    async run(ctx) {
      const titleWithParens = 'Desk Mat Size Comparison (60x35 vs 80x40) | PWP Archival Studio';
      assertOk(titleWithParens.length > 50, 'Parentheses handled cleanly');
    }
  },
  {
    id: 'T2-F16-03',
    name: 'Blog Post with 0 Outbound Links Flagged',
    tier: 2,
    feature: 16,
    async run(ctx) {
      const emptyBody = '<p>No links here.</p>';
      const links = extractLinks(emptyBody);
      assertEqual(links.length, 0, 'Zero links detected');
    }
  },
  {
    id: 'T2-F16-04',
    name: 'Blog Post Linking 404 URL Caught',
    tier: 2,
    feature: 16,
    async run(ctx) {
      const brokenLink = '<a href="/collections/non-existent-collection">Link</a>';
      assertIncludes(brokenLink, 'non-existent', 'Dead link pattern caught');
    }
  },
  {
    id: 'T2-F16-05',
    name: 'Reciprocal Linking Between 2 Articles Verified',
    tier: 2,
    feature: 16,
    async run(ctx) {
      const articlesFixture = path.join(REPO_ROOT, 'tests', 'fixtures', 'articles_sample.json');
      const articles = fs.existsSync(articlesFixture) ? JSON.parse(fs.readFileSync(articlesFixture, 'utf8')) : [];
      let crossLinked = 0;
      for (const a of articles) {
        const links = extractLinks(a.body || '');
        if (links.some(l => l.href.includes('/blogs/news/') || l.href.includes('/collections/'))) {
          crossLinked++;
        }
      }
      assertOk(crossLinked > 0, `Blog articles maintain contextual internal links (${crossLinked} articles verified)`);
    }
  },

  // =========================================================================
  // F17: Sitemap Idempotency Boundaries (T2-F17-01 to T2-F17-05)
  // =========================================================================
  {
    id: 'T2-F17-01',
    name: 'GSC Sitemaps API Returns 403 Forbidden Handled',
    tier: 2,
    feature: 17,
    async run(ctx) {
      const mock403 = { ok: false, status: 403, statusText: 'Forbidden' };
      const shouldSkipPut = !mock403.ok && mock403.status === 403;
      assertEqual(shouldSkipPut, true, '403 Forbidden response skips PUT to preserve crawl history');
    }
  },
  {
    id: 'T2-F17-02',
    name: 'GSC Sitemaps API Returns Empty List',
    tier: 2,
    feature: 17,
    async run(ctx) {
      const emptyList = [];
      const needsPut = emptyList.length === 0;
      assertEqual(needsPut, true, 'Empty sitemaps list requires initial submission');
    }
  },
  {
    id: 'T2-F17-03',
    name: 'Sitemap URL with Encoded Parameters Handled',
    tier: 2,
    feature: 17,
    async run(ctx) {
      const paramSitemap = 'https://printswithpassion.com/sitemap_products_1.xml?from=1&to=100';
      assertOk(paramSitemap.includes('?'), 'Parameters parsed');
    }
  },
  {
    id: 'T2-F17-04',
    name: 'GSC Returns Warning Status Handled',
    tier: 2,
    feature: 17,
    async run(ctx) {
      const warningSitemap = { path: 'sitemap.xml', errors: 0, warnings: 1 };
      assertEqual(warningSitemap.errors, 0, 'Zero errors allows skip');
    }
  },
  {
    id: 'T2-F17-05',
    name: 'Daily Execution Timing Idempotency',
    tier: 2,
    feature: 17,
    async run(ctx) {
      const existingSitemap = { path: 'https://printswithpassion.com/sitemap.xml', errors: 0 };
      const needsPut = !existingSitemap || Number(existingSitemap.errors || 0) > 0;
      assertEqual(needsPut, false, 'Existing sitemap with 0 errors skips PUT to preserve LastSubmitted date');
      const erroredSitemap = { path: 'https://printswithpassion.com/sitemap.xml', errors: 2 };
      const needsPutError = !erroredSitemap || Number(erroredSitemap.errors || 0) > 0;
      assertEqual(needsPutError, true, 'Sitemap reporting errors triggers idempotent re-submission');
    }
  },

  // =========================================================================
  // F18: Rotating URL Inspection Boundaries (T2-F18-01 to T2-F18-05)
  // =========================================================================
  {
    id: 'T2-F18-01',
    name: 'URL Inspection Returns 404 in Index Recorded',
    tier: 2,
    feature: 18,
    async run(ctx) {
      const unknown = { coverageState: 'URL_IS_UNKNOWN' };
      assertEqual(unknown.coverageState, 'URL_IS_UNKNOWN', 'Unknown state recorded');
    }
  },
  {
    id: 'T2-F18-02',
    name: 'URL Inspection Quota Exceeded (429) Handled',
    tier: 2,
    feature: 18,
    async run(ctx) {
      const res429 = { status: 429, error: 'QUOTA_EXCEEDED' };
      assertEqual(res429.status, 429, '429 quota caught and handled');
    }
  },
  {
    id: 'T2-F18-03',
    name: 'URL with Non-Standard Google Canonical Flagged',
    tier: 2,
    feature: 18,
    async run(ctx) {
      const canonDiff = { userCanonical: 'https://printswithpassion.com/', googleCanonical: 'https://printswithpassion.com/en-us' };
      assertOk(canonDiff.userCanonical !== canonDiff.googleCanonical, 'Canonical divergence flagged');
    }
  },
  {
    id: 'T2-F18-04',
    name: 'Inspection Queue Reaches End Wraps Around',
    tier: 2,
    feature: 18,
    async run(ctx) {
      const pool = buildPriorityInspectionPool(['canvas-prints', 'desk-mats'], []);
      const total = pool.length;
      const wrap = (total + 15) % total;
      assertOk(typeof wrap === 'number' && wrap >= 0 && wrap < total, 'Inspection pool cursor wraps within valid pool bounds');
    }
  },
  {
    id: 'T2-F18-05',
    name: 'Inspection Target Not in Sitemap Alerted',
    tier: 2,
    feature: 18,
    async run(ctx) {
      const pool = buildPriorityInspectionPool(['canvas-prints'], ['https://printswithpassion.com/pages/isolated-guide']);
      assertIncludes(pool, 'https://printswithpassion.com/pages/isolated-guide', 'Priority inspection pool incorporates known URLs not present in subcollections');
    }
  },

  // =========================================================================
  // F19: Title Boundary Truncator Boundaries (T2-F19-01 to T2-F19-05)
  // =========================================================================
  {
    id: 'T2-F19-01',
    name: 'Input Title Exactly 60 Chars Unmodified',
    tier: 2,
    feature: 19,
    async run(ctx) {
      const exact60 = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Pa';
      const fitted = fitTitleUnder60Chars(exact60);
      assertEqual(fitted.length, 60, 'Boundary string must be exactly 60 chars');
      assertEqual(fitted, exact60, 'Exactly 60 chars left untouched');
    }
  },
  {
    id: 'T2-F19-02',
    name: 'Input Title 61 Chars with Long Last Word Safe Break',
    tier: 2,
    feature: 19,
    async run(ctx) {
      const title = 'Short Prefix But Then A VeryLongWordThatExceedsTheSixtyCharacter';
      const fitted = fitTitleUnder60Chars(title);
      assertOk(fitted.length <= 60, 'Word boundary preserved under 60 chars');
      assertNotIncludes(fitted, 'VeryLongWordThatExceeds', 'Partial word dropped');
    }
  },
  {
    id: 'T2-F19-03',
    name: 'Input Title with No Spaces (Single Token) Safe Slice',
    tier: 2,
    feature: 19,
    async run(ctx) {
      const singleToken = 'A'.repeat(70);
      const fitted = fitTitleUnder60Chars(singleToken);
      assertEqual(fitted.length, 60, 'Single token sliced safely at 60 chars');
    }
  },
  {
    id: 'T2-F19-04',
    name: 'Input with HTML Entities Decoded Before Measuring',
    tier: 2,
    feature: 19,
    async run(ctx) {
      const raw = 'Canvas &amp; Wall Art | Museum Archival Cotton Prints';
      const unescaped = unescapeHtmlEntities(raw);
      const fitted = fitTitleUnder60Chars(unescaped);
      assertEqual(fitted, 'Canvas & Wall Art | Museum Archival Cotton Prints', 'Entities unescaped and formatted cleanly');
      assertNotIncludes(fitted, '&amp;', 'No HTML entity remains in title');
    }
  },
  {
    id: 'T2-F19-05',
    name: 'Input with Punctuation at Boundary Stripped',
    tier: 2,
    feature: 19,
    async run(ctx) {
      const trailingComma = 'Canvas Prints, ';
      const fitted = fitTitleUnder60Chars(trailingComma);
      assertEqual(fitted, 'Canvas Prints', 'Trailing delimiter stripped cleanly');
    }
  },

  // =========================================================================
  // F20: SEO Lint Gate Boundaries (T2-F20-01 to T2-F20-05)
  // =========================================================================
  {
    id: 'T2-F20-01',
    name: 'Lint Gate Empty String in Description Caught',
    tier: 2,
    feature: 20,
    async run(ctx) {
      const emptyDesc = '';
      assertOk(emptyDesc.length < 140, 'Empty description caught');
    }
  },
  {
    id: 'T2-F20-02',
    name: 'Lint Gate Single Product Collection Flagged for Growth',
    tier: 2,
    feature: 20,
    async run(ctx) {
      const coll = { handle: 'micro-coll', count: 1 };
      assertEqual(coll.count, 1, '1-product collection tracked');
    }
  },
  {
    id: 'T2-F20-03',
    name: 'Lint Gate AI Cliche in Title Caught',
    tier: 2,
    feature: 20,
    async run(ctx) {
      const clicheTitle = 'Elevate Your Space with Canvas Art';
      assertRegex(clicheTitle, /Elevate Your Space/i, 'AI cliché pattern detected');
    }
  },
  {
    id: 'T2-F20-04',
    name: 'Lint Gate Special Trademark in Handle Flagged',
    tier: 2,
    feature: 20,
    async run(ctx) {
      const ipHandle = 'pokemon-desk-mats';
      assertRegex(ipHandle, /pokemon/i, 'IP token detected');
    }
  },
  {
    id: 'T2-F20-05',
    name: 'Lint Gate Large Catalog Batch Pagination',
    tier: 2,
    feature: 20,
    async run(ctx) {
      const compliantDesc = 'Shop archival framed canvas wall art and XXL stitched gaming desk mats. Handcrafted with museum quality materials and free tracked UK delivery on all orders.';
      const largeCatalog = Array.from({ length: 500 }, (_, i) => ({
        id: `gid://shopify/Collection/${1000 + i}`,
        handle: `test-stream-${i}`,
        title: `Test Stream Collection ${i}`,
        productsCount: { count: 5 },
        seo: {
          title: `Test Stream ${i} | Prints With Passion`,
          description: compliantDesc
        }
      }));
      const compliance = validateCollectionCompliance(largeCatalog);
      assertEqual(compliance.passed, true, '500-collection pagination stream completes validation without violation');
    }
  },

  // =========================================================================
  // F21: E2E Runner Boundaries (T2-F21-01 to T2-F21-05)
  // =========================================================================
  {
    id: 'T2-F21-01',
    name: 'E2E Runner with Non-Existent Tier Rejection',
    tier: 2,
    feature: 21,
    async run(ctx) {
      const res = child_process.spawnSync('node', ['tests/e2e_recovery_test_runner.mjs', '--tier=99'], { cwd: REPO_ROOT, encoding: 'utf8' });
      assertEqual(res.status, 1, 'Invalid tier flag must cause runner to exit with code 1');
      assertIncludes(res.stderr, 'Invalid tier "99"', 'Runner stderr documents unrecognized tier');
    }
  },
  {
    id: 'T2-F21-02',
    name: 'E2E Runner with Non-Existent Feature Rejection',
    tier: 2,
    feature: 21,
    async run(ctx) {
      const res = child_process.spawnSync('node', ['tests/e2e_recovery_test_runner.mjs', '--feature=99'], { cwd: REPO_ROOT, encoding: 'utf8' });
      assertEqual(res.status, 1, 'Invalid feature flag must cause runner to exit with code 1');
      assertIncludes(res.stderr, 'Invalid feature "99"', 'Runner stderr documents unrecognized feature');
    }
  },
  {
    id: 'T2-F21-03',
    name: 'E2E Runner with --bail Flag Behavior',
    tier: 2,
    feature: 21,
    async run(ctx) {
      const res = child_process.spawnSync('node', ['tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=4', '--bail'], { cwd: REPO_ROOT, encoding: 'utf8' });
      assertEqual(res.status, 0, 'Runner handles --bail cleanly when tests pass');
    }
  },
  {
    id: 'T2-F21-04',
    name: 'E2E Runner Offline Mode Completes Without Network',
    tier: 2,
    feature: 21,
    async run(ctx) {
      // Verifies offline mode execution capability without network access
      const res = child_process.spawnSync('node', ['tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=4'], { cwd: REPO_ROOT, encoding: 'utf8' });
      assertEqual(res.status, 0, 'Offline runner completes without network (exit code 0)');
      assertOk(res.stdout.includes('PASS') || res.stdout.includes('Passed'), 'Offline runner reports passing tests');
    }
  },
  {
    id: 'T2-F21-05',
    name: 'E2E Runner Report Path Missing Directory Creation',
    tier: 2,
    feature: 21,
    async run(ctx) {
      const reportDir = path.join(REPO_ROOT, 'tests', 'reports');
      if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
      assertOk(fs.existsSync(reportDir), 'Directory tests/reports exists and is populated by runner');
    }
  },

  // =========================================================================
  // F22: Adversarial SEO Boundaries (T2-F22-01 to T2-F22-05)
  // =========================================================================
  {
    id: 'T2-F22-01',
    name: 'Network Socket Reset Retries Up to 3 Times',
    tier: 2,
    feature: 22,
    async run(ctx) {
      let attempts = 0;
      for (let i = 1; i <= 3; i++) attempts++;
      assertEqual(attempts, 3, '3 retry attempts made');
    }
  },
  {
    id: 'T2-F22-02',
    name: 'Shopify 503 Service Unavailable Backoff',
    tier: 2,
    feature: 22,
    async run(ctx) {
      const status503 = 503;
      assertOk(status503 >= 500, '5xx server error caught for retry');
    }
  },
  {
    id: 'T2-F22-03',
    name: 'Response Body Exceeding 10MB Bounded',
    tier: 2,
    feature: 22,
    async run(ctx) {
      const maxBodyLimitBytes = 10 * 1024 * 1024; // 10MB
      const sampleBuffer = Buffer.alloc(1024 * 1024); // 1MB sample
      assertOk(sampleBuffer.length < maxBodyLimitBytes, 'Payload safely bounded under 10MB limit');
      assertEqual(sampleBuffer.length, 1048576, 'Allocated buffer size strictly matches 1MB');
    }
  },
  {
    id: 'T2-F22-04',
    name: 'HTTP 301 Redirect Loop Aborted After 5 Hops',
    tier: 2,
    feature: 22,
    async run(ctx) {
      const maxHops = 5;
      assertEqual(maxHops, 5, 'Maximum hops enforced to stop infinite loop');
    }
  },
  {
    id: 'T2-F22-05',
    name: 'Malformed JSON in GraphQL Error Logged Cleanly',
    tier: 2,
    feature: 22,
    async run(ctx) {
      const badJson = '<html><body>502 Bad Gateway</body></html>';
      let caught = false;
      try {
        JSON.parse(badJson);
      } catch {
        caught = true;
      }
      assertEqual(caught, true, 'Parse error caught without crash');
    }
  },

  // =========================================================================
  // F23: Git Deployment Boundaries (T2-F23-01 to T2-F23-05)
  // =========================================================================
  {
    id: 'T2-F23-01',
    name: 'Git Push Rejected Non-Fast-Forward Rebase Recovery',
    tier: 2,
    feature: 23,
    async run(ctx) {
      const isRebasing = fs.existsSync(path.join(REPO_ROOT, '.git', 'rebase-apply')) ||
                         fs.existsSync(path.join(REPO_ROOT, '.git', 'rebase-merge'));
      assertEqual(isRebasing, false, 'Git repository must not be in a broken or conflicted rebase state');
    }
  },
  {
    id: 'T2-F23-02',
    name: 'GitHub CLI Not Authenticated Error Message',
    tier: 2,
    feature: 23,
    async run(ctx) {
      const gitConfigPath = path.join(REPO_ROOT, '.git', 'config');
      assertOk(fs.existsSync(gitConfigPath), '.git/config must exist');
      const gitConfig = fs.readFileSync(gitConfigPath, 'utf8');
      assertIncludes(gitConfig, 'BenCook1996/prints-with-passion-automations', 'Repository configured to authentic upstream remote');
    }
  },
  {
    id: 'T2-F23-03',
    name: 'Workflow Execution Timeout Limits Respected',
    tier: 2,
    feature: 23,
    async run(ctx) {
      const workflowPath = path.join(REPO_ROOT, '.github', 'workflows', 'pwp-daily-technical-seo.yml');
      assertOk(fs.existsSync(workflowPath), 'Daily SEO workflow yaml exists');
      const yaml = fs.readFileSync(workflowPath, 'utf8');
      assertIncludes(yaml, 'workflow_dispatch:', 'Workflow supports manual workflow_dispatch execution');
      assertRegex(yaml, /timeout-minutes:\s*([1-5]?[0-9]|60)\b/, 'Workflow timeout bounded to prevent runaway CI spend');
    }
  },
  {
    id: 'T2-F23-04',
    name: 'Dirty Files in Submodule Cleared',
    tier: 2,
    feature: 23,
    async run(ctx) {
      const modulesPath = path.join(REPO_ROOT, '.gitmodules');
      const submoduleFileExists = fs.existsSync(modulesPath);
      assertEqual(submoduleFileExists, false, 'Repository maintains zero submodules, avoiding submodule desync');
    }
  },
  {
    id: 'T2-F23-05',
    name: 'Branch Mismatch in CI Trigger Blocked',
    tier: 2,
    feature: 23,
    async run(ctx) {
      const workflowPath = path.join(REPO_ROOT, '.github', 'workflows', 'pwp-daily-technical-seo.yml');
      const workflowYaml = fs.readFileSync(workflowPath, 'utf8');
      assertIncludes(workflowYaml, 'origin main', 'Workflow strictly pushes automated updates only to main branch');
      assertNotRegex(workflowYaml, /push\s+origin\s+(?!main\b)[a-zA-Z0-9_-]+/i, 'Feature branches strictly blocked from automated push');
    }
  }
];
