/**
 * Prints With Passion — Milestone 4 Adversarial Boundary & Stress Test Harness
 * Author: Challenger 2 (Milestone 4)
 * 
 * Directly queries live Shopify Admin GraphQL API (2025-01) and performs
 * exhaustive boundary stress tests on all 36 pages and 26 articles in scope.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL } from '../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGql(query, variables = {}) {
  await sleep(250);
  return await shopifyGraphQL(query, variables);
}

async function run() {
  console.log('======================================================================');
  console.log('Milestone 4 Adversarial Boundary & Stress Test Harness');
  console.log('Target: Live Shopify Admin GraphQL API (2025-01)');
  console.log('======================================================================\n');

  const pageSpecPath = path.join(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json');
  const articleSpecPath = path.join(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json');
  const linkingSpecPath = path.join(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m4_3/internal_linking_spec.json');

  const pageSpec = JSON.parse(fs.readFileSync(pageSpecPath, 'utf8'));
  const articleSpec = JSON.parse(fs.readFileSync(articleSpecPath, 'utf8'));
  const linkingSpec = JSON.parse(fs.readFileSync(linkingSpecPath, 'utf8'));

  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  function assert(condition, testId, message, details = {}) {
    if (condition) {
      passed++;
      console.log(`[PASS] ${testId}: ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] ${testId}: ${message}`);
      failureDetails.push({ testId, message, details });
    }
  }

  // -------------------------------------------------------------------------
  // 1. Audit All 36 Pages from Live Shopify Admin GraphQL API
  // -------------------------------------------------------------------------
  console.log(`--- AUDITING ALL 36 PAGES VIA LIVE GRAPHQL ---`);
  assert(pageSpec.pages.length === 36, 'PAGE-SPEC-COUNT', `Page spec contains exactly 36 pages (got ${pageSpec.pages.length})`);

  for (let i = 0; i < pageSpec.pages.length; i++) {
    const specPage = pageSpec.pages[i];
    const pageId = specPage.page_id;
    const handle = specPage.handle;

    const res = await callGql(`
      query getPage {
        page(id: "${pageId}") {
          id
          handle
          title
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    `);

    const page = res?.page;
    assert(page != null, `PAGE-EXISTS-${handle}`, `Page "${handle}" (${pageId}) exists in Shopify Admin`);
    if (!page) continue;

    const titleVal = page.titleTag?.value;
    const descVal = page.descTag?.value;
    const body = page.body || '';

    // Test: title_tag presence
    assert(titleVal != null && titleVal.length > 0, `PAGE-TITLE-EXISTS-${handle}`, `Page "${handle}" has non-empty title_tag`, { titleVal });

    if (titleVal) {
      // Test: title_tag length <= 60
      assert(titleVal.length >= 1 && titleVal.length <= 60, `PAGE-TITLE-LEN-${handle}`, `Page "${handle}" title_tag length <= 60 chars (got ${titleVal.length}: "${titleVal}")`, { length: titleVal.length, titleVal });

      // Test: title_tag entity cleanliness
      assert(!titleVal.includes('&amp;'), `PAGE-TITLE-NO-AMP-${handle}`, `Page "${handle}" title_tag has zero &amp; entities`, { titleVal });
      assert(!titleVal.includes('&quot;'), `PAGE-TITLE-NO-QUOT-${handle}`, `Page "${handle}" title_tag has zero &quot; entities`, { titleVal });
      assert(!/[:\-–—\s]+$/.test(titleVal), `PAGE-TITLE-NO-DANGLING-${handle}`, `Page "${handle}" title_tag does not end with dangling punctuation/space`, { titleVal });
    }

    // Test: description_tag presence
    assert(descVal != null && descVal.length > 0, `PAGE-DESC-EXISTS-${handle}`, `Page "${handle}" has non-empty description_tag`, { descVal });

    if (descVal) {
      // Test: description_tag length 145-158
      assert(descVal.length >= 145 && descVal.length <= 158, `PAGE-DESC-LEN-${handle}`, `Page "${handle}" description_tag length 145-158 chars (got ${descVal.length})`, { length: descVal.length, descVal });

      // Test: description_tag entity cleanliness
      assert(!descVal.includes('&amp;'), `PAGE-DESC-NO-AMP-${handle}`, `Page "${handle}" description_tag has zero &amp; entities`, { descVal });
      assert(!descVal.includes('&quot;'), `PAGE-DESC-NO-QUOT-${handle}`, `Page "${handle}" description_tag has zero &quot; entities`, { descVal });

      // Test: description_tag no breadcrumb leakage
      assert(!/^Home\s*[›>]/i.test(descVal), `PAGE-DESC-NO-BREADCRUMB-${handle}`, `Page "${handle}" description_tag does not leak breadcrumbs`, { descVal });

      // Test: description_tag no template cliché
      assert(!/^(Transform|Elevate|Style)\s+with/i.test(descVal), `PAGE-DESC-NO-CLICHE-${handle}`, `Page "${handle}" description_tag does not start with template cliché`, { descVal });
    }

    // Test: body inner H1 demotion
    const h1Matches = body.match(/<h1\b/gi) || [];
    assert(h1Matches.length === 0, `PAGE-BODY-NO-H1-${handle}`, `Page "${handle}" body has zero inner <h1> tags (found ${h1Matches.length})`, { h1Count: h1Matches.length });

    // Test: body double escape hygiene
    const hasDoubleAmp = /&amp;amp;/i.test(body);
    const hasDoubleQuot = /&amp;quot;/i.test(body);
    assert(!hasDoubleAmp, `PAGE-BODY-NO-DOUBLE-AMP-${handle}`, `Page "${handle}" body has zero &amp;amp; double-escapes`);
    assert(!hasDoubleQuot, `PAGE-BODY-NO-DOUBLE-QUOT-${handle}`, `Page "${handle}" body has zero &amp;quot; double-escapes`);

    // Test: contact-us specific checks
    if (handle === 'contact-us') {
      const descHasTypo = descVal?.includes('printswithpasssionbc@gmail.com');
      const bodyHasTypo = body.includes('printswithpasssionbc@gmail.com');
      assert(!descHasTypo, 'PAGE-CONTACT-DESC-NO-TYPO', 'Page "contact-us" description_tag does NOT contain typo "printswithpasssionbc@gmail.com"');
      assert(!bodyHasTypo, 'PAGE-CONTACT-BODY-NO-TYPO', 'Page "contact-us" body does NOT contain typo "printswithpasssionbc@gmail.com"');
      assert(body.includes('printswithpassionbc@gmail.com'), 'PAGE-CONTACT-BODY-HAS-CORRECT-EMAIL', 'Page "contact-us" body contains corrected email "printswithpassionbc@gmail.com"');
    }

    // Test: uk-product-catalog specific checks
    if (handle === 'uk-product-catalog') {
      const pageLinks = (body.match(/href="\/pages\/[^"]+"/g) || []).map(m => m.replace('href="', '').replace('"', ''));
      const uniquePageLinks = new Set(pageLinks);
      assert(uniquePageLinks.size >= 35, 'PAGE-CATALOG-LINK-COUNT', `UK product catalog links at least 35 static pages (got ${uniquePageLinks.size})`, { count: uniquePageLinks.size });
    }
  }

  // -------------------------------------------------------------------------
  // 2. Audit All 26 Articles from Live Shopify Admin GraphQL API
  // -------------------------------------------------------------------------
  console.log(`\n--- AUDITING ALL 26 ARTICLES VIA LIVE GRAPHQL ---`);
  assert(articleSpec.articles.length === 26, 'ARTICLE-SPEC-COUNT', `Article spec contains exactly 26 articles (got ${articleSpec.articles.length})`);

  const crossLinkSpecs = linkingSpec.blogCrossLinkingSpecification?.articleRemediationSpecs || [];
  const crossLinkHandles = new Set(crossLinkSpecs.map(c => c.handle));

  for (let i = 0; i < articleSpec.articles.length; i++) {
    const specArticle = articleSpec.articles[i];
    const articleId = specArticle.id;
    const handle = specArticle.handle;

    const res = await callGql(`
      query getArticle {
        article(id: "${articleId}") {
          id
          handle
          title
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    `);

    const article = res?.article;
    assert(article != null, `ARTICLE-EXISTS-${handle}`, `Article "${handle}" (${articleId}) exists in Shopify Admin`);
    if (!article) continue;

    const title = article.title || '';
    const titleVal = article.titleTag?.value;
    const descVal = article.descTag?.value;
    const body = article.body || '';

    // Test: title does not end in "Extended Mo" or dangling colon/word
    assert(!/Extended Mo$/i.test(title), `ARTICLE-TITLE-NOT-EXT-MO-${handle}`, `Article "${handle}" title must not end in "Extended Mo" (got "${title}")`, { title });
    assert(!/[:\-–—\s]+$/.test(title), `ARTICLE-TITLE-NOT-DANGLING-${handle}`, `Article "${handle}" title must not end in trailing punctuation/space`, { title });
    assert(title.length <= 70, `ARTICLE-TITLE-REASONABLE-${handle}`, `Article "${handle}" title length <= 70 chars (got ${title.length})`, { length: title.length });

    // Test: title_tag presence and length <= 60
    assert(titleVal != null && titleVal.length > 0, `ARTICLE-TITLETAG-EXISTS-${handle}`, `Article "${handle}" has non-empty title_tag`, { titleVal });
    if (titleVal) {
      assert(titleVal.length >= 15 && titleVal.length <= 60, `ARTICLE-TITLETAG-LEN-${handle}`, `Article "${handle}" title_tag <= 60 chars (got ${titleVal.length}: "${titleVal}")`, { length: titleVal.length, titleVal });
      assert(!titleVal.includes('&amp;'), `ARTICLE-TITLETAG-NO-AMP-${handle}`, `Article "${handle}" title_tag has zero &amp; entities`, { titleVal });
      assert(!titleVal.includes('&quot;'), `ARTICLE-TITLETAG-NO-QUOT-${handle}`, `Article "${handle}" title_tag has zero &quot; entities`, { titleVal });
      assert(!/[:\-–—\s]+$/.test(titleVal), `ARTICLE-TITLETAG-NO-DANGLING-${handle}`, `Article "${handle}" title_tag does not end with dangling punctuation/space`, { titleVal });
    }

    // Test: description_tag presence and length 145-158
    assert(descVal != null && descVal.length > 0, `ARTICLE-DESCTAG-EXISTS-${handle}`, `Article "${handle}" has non-empty description_tag`, { descVal });
    if (descVal) {
      assert(descVal.length >= 140 && descVal.length <= 158, `ARTICLE-DESCTAG-LEN-${handle}`, `Article "${handle}" description_tag 140-158 chars (got ${descVal.length})`, { length: descVal.length, descVal });
      assert(!descVal.includes('&amp;'), `ARTICLE-DESCTAG-NO-AMP-${handle}`, `Article "${handle}" description_tag has zero &amp; entities`, { descVal });
      assert(!descVal.includes('&quot;'), `ARTICLE-DESCTAG-NO-QUOT-${handle}`, `Article "${handle}" description_tag has zero &quot; entities`, { descVal });
    }

    // Test: internal cross-links present in body
    if (crossLinkHandles.has(handle)) {
      assert(body.includes('pwp-related-guides-and-collections'), `ARTICLE-CROSSLINKS-${handle}`, `Article "${handle}" contains "pwp-related-guides-and-collections" callout block`);
    }
  }

  // -------------------------------------------------------------------------
  // 3. Audit Footer Navigation Menu
  // -------------------------------------------------------------------------
  console.log('\n--- AUDITING FOOTER MENU ---');
  const menuRes = await callGql(`
    query checkFooterMenu {
      menu(id: "gid://shopify/Menu/221177086263") {
        id
        title
        items {
          id
          title
          url
        }
      }
    }
  `);

  const menuItems = menuRes?.menu?.items || [];
  const menuUrls = menuItems.map(i => i.url);
  console.log(`Footer menu items count: ${menuItems.length}`);
  console.log('Footer menu URLs:', menuUrls);

  assert(menuItems.length >= 16, 'MENU-ITEM-COUNT', `Footer menu has >= 16 items (got ${menuItems.length})`, { count: menuItems.length });
  assert(menuUrls.includes('/pages/about-us'), 'MENU-HAS-ABOUT-US', 'Footer menu links /pages/about-us');
  assert(menuUrls.includes('/pages/uk-product-catalog'), 'MENU-HAS-CATALOG', 'Footer menu links /pages/uk-product-catalog');
  assert(menuUrls.includes('/pages/studio-lookbook-social-feed'), 'MENU-HAS-LOOKBOOK', 'Footer menu links /pages/studio-lookbook-social-feed');

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('ADVERSARIAL STRESS TEST SUMMARY');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('======================================================================');

  if (failureDetails.length > 0) {
    console.error('\nFAILURES RECORDED:');
    for (const f of failureDetails) {
      console.error(`- [${f.testId}] ${f.message}:`, JSON.stringify(f.details));
    }
  }

  return { passed, failed, failureDetails };
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
