import fs from 'fs';
import path from 'path';

// Import shopifyGraphQL from project lib
const projectLibPath = path.resolve('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/lib/cloud-env.mjs');
const { shopifyGraphQL } = await import(`file:///${projectLibPath.replace(/\\/g, '/')}`);

const PAGE_SPEC_PATH = path.resolve('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json');
const ARTICLE_SPEC_PATH = path.resolve('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json');
const LINKING_SPEC_PATH = path.resolve('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_3/internal_linking_spec.json');

const pageSpec = JSON.parse(fs.readFileSync(PAGE_SPEC_PATH, 'utf8'));
const articleSpec = JSON.parse(fs.readFileSync(ARTICLE_SPEC_PATH, 'utf8'));
const linkingSpec = JSON.parse(fs.readFileSync(LINKING_SPEC_PATH, 'utf8'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('=== Milestone 4 Forensic Independent Audit (Complete Census) ===\n');

  const results = {
    pagesAudit: [],
    articlesAudit: [],
    footerMenuAudit: null,
    violations: [],
    summary: { totalChecks: 0, passedChecks: 0, failedChecks: 0 }
  };

  function check(condition, desc) {
    results.summary.totalChecks++;
    if (condition) {
      results.summary.passedChecks++;
    } else {
      results.summary.failedChecks++;
      results.violations.push(desc);
      console.error(`[FAIL] ${desc}`);
    }
  }

  // =========================================================================
  // 1. AUDIT ALL 36 LIVE PAGES VIA LIVE GRAPHQL
  // =========================================================================
  console.log(`Auditing all ${pageSpec.pages.length} pages against live Shopify Admin...`);
  let pagesAudited = 0;

  for (const p of pageSpec.pages) {
    pagesAudited++;
    await sleep(250);
    const res = await shopifyGraphQL(`
      query getPageDetail {
        page(id: "${p.page_id}") {
          id
          handle
          title
          updatedAt
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    `);

    const page = res?.page;
    check(page != null, `Page ${p.handle} exists in live Shopify Admin`);
    if (!page) continue;

    // Check 1: 0 inner H1 tags in body
    const h1Count = page.body ? (page.body.match(/<h1\b/gi) || []).length : 0;
    check(h1Count === 0, `Page ${p.handle} body has 0 <h1> tags (found ${h1Count})`);

    // Check 2: zero double-escaped entities
    check(!/&amp;quot;/i.test(page.body || ''), `Page ${p.handle} has 0 &amp;quot; entities`);
    check(!/&amp;amp;/i.test(page.body || ''), `Page ${p.handle} has 0 &amp;amp; entities`);

    // Check 3: titleTag length between 15 and 60 chars
    const titleVal = page.titleTag?.value || '';
    check(titleVal.length >= 15 && titleVal.length <= 60, `Page ${p.handle} title_tag <= 60 chars (is ${titleVal.length}: "${titleVal}")`);
    check(!titleVal.includes('&amp;'), `Page ${p.handle} title_tag contains 0 &amp;`);

    // Check 4: descTag length between 145 and 158 chars
    const descVal = page.descTag?.value || '';
    check(descVal.length >= 145 && descVal.length <= 158, `Page ${p.handle} desc_tag in 145..158 chars (is ${descVal.length})`);
    check(!descVal.includes('&amp;'), `Page ${p.handle} desc_tag contains 0 &amp;`);
    check(!/^Home\s*[›>]/i.test(descVal), `Page ${p.handle} desc_tag does not leak breadcrumbs`);

    // Check 5: contact-us specific typo check
    if (p.handle === 'contact-us') {
      check(!descVal.includes('printswithpasssionbc@gmail.com'), 'contact-us desc_tag free of typo');
      check(!page.body.includes('printswithpasssionbc@gmail.com'), 'contact-us body free of typo');
      check(page.body.includes('printswithpassionbc@gmail.com'), 'contact-us body contains corrected email');
    }

    // Check 6: uk-product-catalog specific directory links check
    if (p.handle === 'uk-product-catalog') {
      const pageLinks = page.body.match(/href="\/pages\/[^"]+"/g) || [];
      const uniquePageLinks = new Set(pageLinks.map((l) => l.replace('href="', '').replace('"', '')));
      check(uniquePageLinks.size >= 35, `uk-product-catalog links >= 35 static pages (found ${uniquePageLinks.size})`);
    }

    results.pagesAudit.push({
      handle: p.handle,
      h1Count,
      titleTagLen: titleVal.length,
      descTagLen: descVal.length,
      updatedAt: page.updatedAt
    });
  }
  console.log(`✓ Completed 100% census of ${pagesAudited} pages.`);

  // =========================================================================
  // 2. AUDIT ALL 26 LIVE ARTICLES VIA LIVE GRAPHQL
  // =========================================================================
  console.log(`\nAuditing all ${articleSpec.articles.length} articles against live Shopify Admin...`);
  const crossLinkSpecs = linkingSpec.blogCrossLinkingSpecification?.articleRemediationSpecs || [];
  const crossLinkHandles = new Set(crossLinkSpecs.map((c) => c.handle));

  let articlesAudited = 0;
  for (const a of articleSpec.articles) {
    articlesAudited++;
    await sleep(250);
    const res = await shopifyGraphQL(`
      query getArticleDetail {
        article(id: "${a.id}") {
          id
          handle
          title
          updatedAt
          body
          titleTag: metafield(namespace: "global", key: "title_tag") { value }
          descTag: metafield(namespace: "global", key: "description_tag") { value }
        }
      }
    `);

    const article = res?.article;
    check(article != null, `Article ${a.handle} exists in live Shopify Admin`);
    if (!article) continue;

    // Check 1: Title not ending in "Extended Mo" or hard truncation
    check(!/Extended Mo$/i.test(article.title), `Article ${a.handle} title does not end in "Extended Mo"`);
    check(article.title.length <= 70, `Article ${a.handle} title reasonable length (is ${article.title.length})`);

    // Check 2: TitleTag length between 15 and 60 chars
    const titleVal = article.titleTag?.value || '';
    check(titleVal.length >= 15 && titleVal.length <= 60, `Article ${a.handle} title_tag <= 60 chars (is ${titleVal.length}: "${titleVal}")`);
    check(!titleVal.includes('&amp;'), `Article ${a.handle} title_tag contains 0 &amp;`);

    // Check 3: DescTag length between 140 and 158 chars
    const descVal = article.descTag?.value || '';
    check(descVal.length >= 140 && descVal.length <= 158, `Article ${a.handle} desc_tag 140..158 chars (is ${descVal.length})`);
    check(!descVal.includes('&amp;'), `Article ${a.handle} desc_tag contains 0 &amp;`);

    // Check 4: Contextual cross-link block present
    if (crossLinkHandles.has(a.handle)) {
      const hasCrossLinks = article.body && article.body.includes('pwp-related-guides-and-collections');
      check(hasCrossLinks, `Article ${a.handle} contains pwp-related-guides-and-collections block`);
    }

    results.articlesAudit.push({
      handle: a.handle,
      title: article.title,
      titleTagLen: titleVal.length,
      descTagLen: descVal.length,
      updatedAt: article.updatedAt
    });
  }
  console.log(`✓ Completed 100% census of ${articlesAudited} articles.`);

  // =========================================================================
  // 3. AUDIT LIVE FOOTER MENU VIA GRAPHQL
  // =========================================================================
  console.log('\nAuditing Footer Navigation Menu against live Shopify Admin...');
  await sleep(250);
  const menuRes = await shopifyGraphQL(`
    query getFooterMenuDetail {
      menu(id: "gid://shopify/Menu/221177086263") {
        id
        title
        handle
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
  console.log(`Footer menu contains ${menuItems.length} items.`);

  check(menuItems.length >= 16, `Footer menu contains >= 16 items (found ${menuItems.length})`);
  check(menuUrls.includes('/pages/about-us'), 'Footer menu links /pages/about-us');
  check(menuUrls.includes('/pages/uk-product-catalog'), 'Footer menu links /pages/uk-product-catalog');
  check(menuUrls.includes('/pages/studio-lookbook-social-feed'), 'Footer menu links /pages/studio-lookbook-social-feed');

  results.footerMenuAudit = {
    totalItems: menuItems.length,
    items: menuItems
  };

  console.log('\n===============================================================');
  console.log(`FORENSIC CENSUS SUMMARY: ${results.summary.passedChecks} passed, ${results.summary.failedChecks} failed.`);
  console.log('===============================================================');

  const outPath = path.resolve('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_auditor_m4_1/independent_audit_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved detailed raw report to: ${outPath}`);

  if (results.summary.failedChecks > 0) {
    console.error(`\n❌ Forensic audit discovered ${results.summary.failedChecks} violations!`);
    process.exit(1);
  } else {
    console.log(`\n✅ All live Shopify Admin objects are 100% genuine, authentic, and verified!`);
  }
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
