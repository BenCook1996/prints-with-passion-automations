/**
 * Prints With Passion — Milestone 4 (Phase 4: Page & Article SEO Remediation)
 * Script: remediate_pages_and_articles_seo.mjs
 *
 * Implements full production remediation directly against live Shopify Admin GraphQL API:
 * 1. 36 Static Pages:
 *    - Demotes inner <h1> to <h2> inside page.body (25 affected pages)
 *    - Sanitizes &amp; entities to & across all page bodies
 *    - Replaces /pages/uk-product-catalog body with proposed_uk_product_catalog.html
 *    - Sets word-boundary-safe seo.title (global.title_tag <= 60 chars)
 *    - Sets plain-text seo.description (global.description_tag 145–158 chars)
 *    - Fixes contact-us email typo (printswithpasssionbc@gmail.com -> printswithpassionbc@gmail.com)
 * 2. 26 Blog Articles:
 *    - Repairs truncated/oversized titles (repairing "Extended Mo", dangling tokens, etc.)
 *    - Sets word-boundary-safe seo.title (global.title_tag <= 60 chars)
 *    - Sets plain-text seo.description (global.description_tag 145–158 chars)
 *    - Injects contextual cross-linking blocks (pwp-related-guides-and-collections)
 * 3. Footer Navigation Menu (gid://shopify/Menu/221177086263):
 *    - Adds /pages/about-us, /pages/uk-product-catalog, and /pages/studio-lookbook-social-feed
 *      while strictly preserving all 13 existing menu item IDs.
 * 4. Post-Remediation Verification:
 *    - Queries all updated entities and validates against strict quality gates.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL } from './lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pacing helper (250ms spacing between calls = max 4 calls/sec, respecting 50 pt/sec limit)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGraphQLWithRetry(query, variables = {}, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sleep(250);
      const res = await shopifyGraphQL(query, variables);
      if (res && Object.keys(res).length > 0) {
        return res;
      }
      if (attempt < maxRetries) {
        console.warn(`[WARN] Empty GraphQL response on attempt ${attempt}. Retrying in ${1000 * attempt}ms...`);
        await sleep(1000 * attempt);
      }
    } catch (err) {
      console.warn(`[WARN] GraphQL call failed on attempt ${attempt}/${maxRetries}: ${err.message}`);
      if (attempt === maxRetries) {
        throw err;
      }
      await sleep(1500 * attempt);
    }
  }
  throw new Error('GraphQL call exceeded max retries');
}

// ---------------------------------------------------------------------------
// 1. Authoritative Specification Paths
// ---------------------------------------------------------------------------
const PAGE_SPEC_PATH = path.join(
  __dirname,
  '.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json'
);
const ARTICLE_SPEC_PATH = path.join(
  __dirname,
  '.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json'
);
const LINKING_SPEC_PATH = path.join(
  __dirname,
  '.agents/teamwork/teamwork_explorer_m4_3/internal_linking_spec.json'
);
const CATALOG_HTML_PATH = path.join(
  __dirname,
  '.agents/teamwork/teamwork_explorer_m4_3/proposed_uk_product_catalog.html'
);

function loadSpecs() {
  if (!fs.existsSync(PAGE_SPEC_PATH)) throw new Error(`Missing page spec: ${PAGE_SPEC_PATH}`);
  if (!fs.existsSync(ARTICLE_SPEC_PATH)) throw new Error(`Missing article spec: ${ARTICLE_SPEC_PATH}`);
  if (!fs.existsSync(LINKING_SPEC_PATH)) throw new Error(`Missing linking spec: ${LINKING_SPEC_PATH}`);
  if (!fs.existsSync(CATALOG_HTML_PATH)) throw new Error(`Missing catalog HTML: ${CATALOG_HTML_PATH}`);

  const pageSpec = JSON.parse(fs.readFileSync(PAGE_SPEC_PATH, 'utf8'));
  const articleSpec = JSON.parse(fs.readFileSync(ARTICLE_SPEC_PATH, 'utf8'));
  const linkingSpec = JSON.parse(fs.readFileSync(LINKING_SPEC_PATH, 'utf8'));
  const catalogHtml = fs.readFileSync(CATALOG_HTML_PATH, 'utf8');

  return { pageSpec, articleSpec, linkingSpec, catalogHtml };
}

// ---------------------------------------------------------------------------
// 2. Remediate 36 Pages
// ---------------------------------------------------------------------------
async function remediatePages(pageSpec, catalogHtml) {
  console.log('\n===============================================================');
  console.log('PHASE 1: REMEDIATING 36 STATIC PAGES');
  console.log('===============================================================');

  const pageUpdateMutation = `
    mutation pageUpdate($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          handle
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  let totalPagesProcessed = 0;
  let h1DemotionsApplied = 0;
  let ampSanitizationsApplied = 0;

  for (const p of pageSpec.pages) {
    totalPagesProcessed++;
    console.log(`[PAGE ${totalPagesProcessed}/36] Processing: ${p.handle} (${p.page_id})...`);

    // 1. Fetch live page body
    const fetchRes = await callGraphQLWithRetry(`
      query getPageBody {
        page(id: "${p.page_id}") {
          id
          handle
          title
          body
        }
      }
    `);

    const livePage = fetchRes?.page;
    if (!livePage) {
      throw new Error(`Page not found: ${p.page_id} (${p.handle})`);
    }

    let updatedBody = livePage.body || '';

    // If this is the UK Product Catalog, replace body entirely with proposed catalog HTML
    if (p.handle === 'uk-product-catalog') {
      updatedBody = catalogHtml;
      console.log(`  -> Installed comprehensive 35-page directory catalog HTML.`);
    } else {
      // Demote inner <h1> to <h2>
      if (/<h1\b/i.test(updatedBody)) {
        const prevBody = updatedBody;
        updatedBody = updatedBody.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, '<h2$1>$2</h2>');
        if (prevBody !== updatedBody) {
          h1DemotionsApplied++;
          console.log(`  -> Demoted inner <h1> to <h2>.`);
        }
      }

      // Sanitize &amp; entities to &
      if (updatedBody.includes('&amp;')) {
        const ampCount = (updatedBody.match(/&amp;/g) || []).length;
        updatedBody = updatedBody.replace(/&amp;/g, '&');
        ampSanitizationsApplied += ampCount;
        console.log(`  -> Sanitized ${ampCount} &amp; entities to &.`);
      }

      // Ensure contact-us email typo is fixed in body if present
      if (p.handle === 'contact-us' && updatedBody.includes('printswithpasssionbc@gmail.com')) {
        updatedBody = updatedBody.replace(/printswithpasssionbc@gmail\.com/g, 'printswithpassionbc@gmail.com');
        console.log(`  -> Fixed printswithpasssionbc@gmail.com typo in contact-us body.`);
      }
    }

    // Prepare metafields
    const metafields = [
      {
        namespace: 'global',
        key: 'title_tag',
        value: p.proposed_seo_title,
        type: 'string'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: p.proposed_seo_description,
        type: 'string'
      }
    ];

    const variables = {
      id: p.page_id,
      page: {
        body: updatedBody,
        metafields
      }
    };

    const updateRes = await callGraphQLWithRetry(pageUpdateMutation, variables);
    const userErrors = updateRes?.pageUpdate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(`pageUpdate failed on ${p.handle}: ${JSON.stringify(userErrors)}`);
    }

    console.log(`  ✓ Updated metadata: title="${p.proposed_seo_title}" (${p.proposed_seo_title.length}c), desc=${p.proposed_seo_description.length}c`);
  }

  console.log(`\nPages Remediation Complete: 36/36 pages updated.`);
  console.log(`H1 demotions: ${h1DemotionsApplied}, &amp; sanitized: ${ampSanitizationsApplied}.`);
}

// ---------------------------------------------------------------------------
// 3. Remediate 26 Blog Articles
// ---------------------------------------------------------------------------
async function remediateArticles(articleSpec, linkingSpec) {
  console.log('\n===============================================================');
  console.log('PHASE 2: REMEDIATING 26 BLOG ARTICLES');
  console.log('===============================================================');

  const articleUpdateMutation = `
    mutation articleUpdate($id: ID!, $article: ArticleUpdateInput!) {
      articleUpdate(id: $id, article: $article) {
        article {
          id
          title
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const crossLinkSpecs = linkingSpec.blogCrossLinkingSpecification?.articleRemediationSpecs || [];
  const crossLinkMap = new Map();
  for (const cls of crossLinkSpecs) {
    crossLinkMap.set(cls.id, cls.calloutBlock);
    crossLinkMap.set(cls.handle, cls.calloutBlock);
  }

  let totalArticlesProcessed = 0;
  let titlesRepaired = 0;
  let crossLinksInjected = 0;

  for (const a of articleSpec.articles) {
    totalArticlesProcessed++;
    console.log(`[ARTICLE ${totalArticlesProcessed}/26] Processing: ${a.handle} (${a.id})...`);

    // 1. Fetch live article
    const fetchRes = await callGraphQLWithRetry(`
      query getArticle {
        article(id: "${a.id}") {
          id
          handle
          title
          body
        }
      }
    `);

    const liveArticle = fetchRes?.article;
    if (!liveArticle) {
      throw new Error(`Article not found: ${a.id} (${a.handle})`);
    }

    let updatedTitle = a.remediatedTitle || liveArticle.title;
    if (updatedTitle !== liveArticle.title) {
      titlesRepaired++;
      console.log(`  -> Repaired title: "${liveArticle.title}" -> "${updatedTitle}" (${updatedTitle.length}c)`);
    }

    let updatedBody = liveArticle.body || '';
    const calloutBlock = crossLinkMap.get(a.id) || crossLinkMap.get(a.handle);

    if (calloutBlock) {
      if (!updatedBody.includes('pwp-related-guides-and-collections')) {
        updatedBody = updatedBody.trim() + '\n' + calloutBlock;
        crossLinksInjected++;
        console.log(`  -> Injected contextual cross-linking callout block.`);
      } else {
        console.log(`  -> Cross-linking block already present.`);
      }
    }

    const metafields = [
      {
        namespace: 'global',
        key: 'title_tag',
        value: a.seoTitle,
        type: 'string'
      },
      {
        namespace: 'global',
        key: 'description_tag',
        value: a.seoDescription,
        type: 'string'
      }
    ];

    const variables = {
      id: a.id,
      article: {
        title: updatedTitle,
        body: updatedBody,
        metafields
      }
    };

    const updateRes = await callGraphQLWithRetry(articleUpdateMutation, variables);
    const userErrors = updateRes?.articleUpdate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(`articleUpdate failed on ${a.handle}: ${JSON.stringify(userErrors)}`);
    }

    console.log(`  ✓ Updated metadata: title_tag="${a.seoTitle}" (${a.seoTitle.length}c), desc_tag=${a.seoDescription.length}c`);
  }

  console.log(`\nArticles Remediation Complete: 26/26 articles updated.`);
  console.log(`Titles repaired: ${titlesRepaired}, Cross-link blocks injected: ${crossLinksInjected}.`);
}

// ---------------------------------------------------------------------------
// 4. Remediate Footer Navigation Menu
// ---------------------------------------------------------------------------
async function remediateFooterMenu(linkingSpec) {
  console.log('\n===============================================================');
  console.log('PHASE 3: REMEDIATING FOOTER NAVIGATION MENU');
  console.log('===============================================================');

  const menuId = linkingSpec.footerMenuSpecification?.menuId || 'gid://shopify/Menu/221177086263';

  // 1. Fetch current live menu
  const fetchRes = await callGraphQLWithRetry(`
    query getMenu {
      menu(id: "${menuId}") {
        id
        title
        handle
        items {
          id
          title
          type
          url
          resourceId
          tags
        }
      }
    }
  `);

  const menu = fetchRes?.menu;
  if (!menu) {
    throw new Error(`Menu not found: ${menuId}`);
  }

  console.log(`Current footer menu has ${menu.items.length} items.`);

  // Preserve existing items with their IDs
  const preservedItems = menu.items.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    url: item.url,
    resourceId: item.resourceId
  }));

  const existingUrls = new Set(preservedItems.map((i) => i.url));

  const itemsToAdd = [
    {
      title: 'About Us',
      type: 'PAGE',
      url: '/pages/about-us',
      resourceId: 'gid://shopify/Page/688935666037'
    },
    {
      title: 'UK Product Catalog & Directory',
      type: 'PAGE',
      url: '/pages/uk-product-catalog',
      resourceId: 'gid://shopify/Page/703791300981'
    },
    {
      title: 'Studio Lookbook & Room Inspiration',
      type: 'PAGE',
      url: '/pages/studio-lookbook-social-feed',
      resourceId: 'gid://shopify/Page/703875121525'
    }
  ];

  const finalItems = [...preservedItems];
  for (const item of itemsToAdd) {
    if (!existingUrls.has(item.url)) {
      finalItems.push(item);
      console.log(`  -> Adding missing menu item: ${item.title} (${item.url})`);
    } else {
      console.log(`  -> Item already present: ${item.title} (${item.url})`);
    }
  }

  const menuUpdateMutation = `
    mutation menuUpdate($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        menu {
          id
          title
          handle
          items {
            id
            title
            url
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const updateRes = await callGraphQLWithRetry(menuUpdateMutation, {
    id: menuId,
    title: menu.title,
    handle: menu.handle,
    items: finalItems
  });

  const userErrors = updateRes?.menuUpdate?.userErrors || [];
  if (userErrors.length > 0) {
    throw new Error(`menuUpdate failed: ${JSON.stringify(userErrors)}`);
  }

  const updatedItemsCount = updateRes?.menuUpdate?.menu?.items?.length || 0;
  console.log(`\nFooter Menu Remediation Complete: ${updatedItemsCount} total items in menu.`);
}

// ---------------------------------------------------------------------------
// 5. Post-Remediation Verification Gate
// ---------------------------------------------------------------------------
async function verifyRemediation(pageSpec, articleSpec, linkingSpec) {
  console.log('\n===============================================================');
  console.log('PHASE 4: LIVE POST-REMEDIATION VERIFICATION');
  console.log('===============================================================');

  const crossLinkSpecs = linkingSpec.blogCrossLinkingSpecification?.articleRemediationSpecs || [];
  const crossLinkHandles = new Set(crossLinkSpecs.map((c) => c.handle));

  let passedChecks = 0;
  let failedChecks = 0;

  function assert(condition, message) {
    if (condition) {
      passedChecks++;
    } else {
      failedChecks++;
      console.error(`  [FAIL] ${message}`);
    }
  }

  // 1. Verify Pages
  console.log('Verifying 36 pages in Shopify Admin...');
  for (const p of pageSpec.pages) {
    const res = await callGraphQLWithRetry(`
      query checkPage {
        page(id: "${p.page_id}") {
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
    assert(page != null, `Page ${p.handle} exists in Admin`);
    if (!page) continue;

    // Check inner H1 demotion
    const h1Count = (page.body?.match(/<h1\b/gi) || []).length;
    assert(h1Count === 0, `Page ${p.handle} body has 0 <h1> tags (got ${h1Count})`);

    // Check entity hygiene (no double-escaped entities in body, no &amp; in metadata)
    const hasDoubleEscapedQuot = /&amp;quot;/i.test(page.body || '');
    assert(!hasDoubleEscapedQuot, `Page ${p.handle} body has 0 &amp;quot; double-escaped entities`);

    const hasDoubleAmp = /&amp;amp;/i.test(page.body || '');
    assert(!hasDoubleAmp, `Page ${p.handle} body has 0 &amp;amp; double-escaped entities`);

    // Check titleTag length & entities
    const titleVal = page.titleTag?.value || '';
    assert(
      titleVal.length >= 15 && titleVal.length <= 60,
      `Page ${p.handle} title_tag length <= 60 (got ${titleVal.length}: "${titleVal}")`
    );
    assert(!titleVal.includes('&amp;'), `Page ${p.handle} title_tag has 0 &amp; entities`);

    // Check descTag length & entities
    const descVal = page.descTag?.value || '';
    assert(
      descVal.length >= 145 && descVal.length <= 158,
      `Page ${p.handle} desc_tag length 145-158 (got ${descVal.length})`
    );
    assert(!descVal.includes('&amp;'), `Page ${p.handle} desc_tag has 0 &amp; entities`);

    // Check contact-us email hygiene
    if (p.handle === 'contact-us') {
      assert(
        !descVal.includes('printswithpasssionbc@gmail.com'),
        'Page contact-us desc_tag must not contain typo printswithpasssionbc@gmail.com'
      );
      assert(
        !page.body.includes('printswithpasssionbc@gmail.com') &&
          page.body.includes('printswithpassionbc@gmail.com'),
        'Page contact-us body must contain corrected email printswithpassionbc@gmail.com'
      );
    }

    // Check uk-product-catalog directory links
    if (p.handle === 'uk-product-catalog') {
      const pageLinks = page.body.match(/href="\/pages\/[^"]+"/g) || [];
      const uniquePageLinks = new Set(pageLinks.map((l) => l.replace('href="', '').replace('"', '')));
      assert(
        uniquePageLinks.size >= 35,
        `Page uk-product-catalog links at least 35 static pages (got ${uniquePageLinks.size})`
      );
    }
  }

  // 2. Verify Articles
  console.log('\nVerifying 26 articles in Shopify Admin...');
  for (const a of articleSpec.articles) {
    const res = await callGraphQLWithRetry(`
      query checkArticle {
        article(id: "${a.id}") {
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
    assert(article != null, `Article ${a.handle} exists in Admin`);
    if (!article) continue;

    // Check title not ending in "Extended Mo"
    assert(
      !/Extended Mo$/i.test(article.title),
      `Article ${a.handle} title must not end in "Extended Mo" (got "${article.title}")`
    );

    // Check title length
    assert(
      article.title.length <= 70,
      `Article ${a.handle} title length reasonable (got ${article.title.length})`
    );

    // Check titleTag length
    const titleVal = article.titleTag?.value || '';
    assert(
      titleVal.length >= 15 && titleVal.length <= 60,
      `Article ${a.handle} title_tag <= 60 chars (got ${titleVal.length}: "${titleVal}")`
    );

    // Check descTag length
    const descVal = article.descTag?.value || '';
    assert(
      descVal.length >= 140 && descVal.length <= 158,
      `Article ${a.handle} desc_tag 140-158 chars (got ${descVal.length})`
    );

    // Check cross links present for the 25 core articles
    if (crossLinkHandles.has(a.handle)) {
      assert(
        article.body.includes('pwp-related-guides-and-collections'),
        `Article ${a.handle} contains cross-links block`
      );
    }
  }

  // 3. Verify Footer Menu
  console.log('\nVerifying Footer Navigation Menu...');
  const menuRes = await callGraphQLWithRetry(`
    query checkFooterMenu {
      menu(id: "gid://shopify/Menu/221177086263") {
        id
        items {
          title
          url
        }
      }
    }
  `);

  const menuItems = menuRes?.menu?.items || [];
  const menuUrls = menuItems.map((i) => i.url);
  assert(menuItems.length >= 16, `Footer menu has >= 16 items (got ${menuItems.length})`);
  assert(menuUrls.includes('/pages/about-us'), 'Footer menu links /pages/about-us');
  assert(menuUrls.includes('/pages/uk-product-catalog'), 'Footer menu links /pages/uk-product-catalog');
  assert(
    menuUrls.includes('/pages/studio-lookbook-social-feed'),
    'Footer menu links /pages/studio-lookbook-social-feed'
  );

  console.log('\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passedChecks} checks passed, ${failedChecks} checks failed.`);
  console.log('===============================================================');

  if (failedChecks > 0) {
    throw new Error(`Post-remediation verification failed with ${failedChecks} errors.`);
  }
}

// ---------------------------------------------------------------------------
// Main Execution
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting Milestone 4 SEO Remediation...');
  const startTime = Date.now();

  const { pageSpec, articleSpec, linkingSpec, catalogHtml } = loadSpecs();

  // Step 1: Remediate 36 Pages
  await remediatePages(pageSpec, catalogHtml);

  // Step 2: Remediate 26 Articles
  await remediateArticles(articleSpec, linkingSpec);

  // Step 3: Remediate Footer Menu
  await remediateFooterMenu(linkingSpec);

  // Step 4: Verify All Entities
  await verifyRemediation(pageSpec, articleSpec, linkingSpec);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 Milestone 4 remediation and verification completed successfully in ${durationSec}s!`);
}

main().catch((err) => {
  console.error('\n❌ Remediation script encountered fatal error:', err);
  process.exit(1);
});
