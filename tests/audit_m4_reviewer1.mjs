import { shopifyGraphQL } from '../lib/cloud-env.mjs';
import fs from 'fs';

async function audit() {
  console.log('=== Reviewer 1: Milestone 4 Independent Verification ===\n');

  // 1. Fetch all pages (36 expected)
  const pagesQuery = `
    query getAllPages {
      pages(first: 100) {
        edges {
          node {
            id
            handle
            title
            body
            titleTag: metafield(namespace: "global", key: "title_tag") { value }
            descTag: metafield(namespace: "global", key: "description_tag") { value }
          }
        }
      }
    }
  `;

  console.log('Fetching all pages from Shopify Admin GraphQL API...');
  const pagesRes = await shopifyGraphQL(pagesQuery);
  const pages = pagesRes?.pages?.edges?.map(e => e.node) || [];
  console.log(`Found ${pages.length} pages in Shopify Admin.`);

  const auditResults = {
    totalPages: pages.length,
    h1Violations: [],
    ampViolations: [],
    titleTagViolations: [],
    descTagViolations: [],
    contactUsAudit: {},
    catalogLinksAudit: {},
    menuAudit: {}
  };

  const allPageHandles = new Set(pages.map(p => p.handle));

  for (const page of pages) {
    const { id, handle, title, body, titleTag, descTag } = page;
    const bodyStr = body || '';
    const titleVal = titleTag?.value || '';
    const descVal = descTag?.value || '';

    // Check inner H1s in body
    const h1Matches = bodyStr.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || [];
    if (h1Matches.length > 0) {
      auditResults.h1Violations.push({
        id,
        handle,
        count: h1Matches.length,
        samples: h1Matches.slice(0, 2)
      });
    }

    // Check &amp; entities in body
    const ampMatches = bodyStr.match(/&amp;/g) || [];
    if (ampMatches.length > 0) {
      auditResults.ampViolations.push({
        id,
        handle,
        count: ampMatches.length
      });
    }

    // Check title_tag
    if (!titleVal) {
      auditResults.titleTagViolations.push({
        id,
        handle,
        reason: 'Missing title_tag'
      });
    } else {
      if (titleVal.length > 60) {
        auditResults.titleTagViolations.push({
          id,
          handle,
          length: titleVal.length,
          value: titleVal,
          reason: 'title_tag exceeds 60 characters'
        });
      }
      if (titleVal.includes('&amp;')) {
        auditResults.titleTagViolations.push({
          id,
          handle,
          value: titleVal,
          reason: 'title_tag contains &amp;'
        });
      }
      if (/[:\-\|,\s]$/.test(titleVal)) {
        auditResults.titleTagViolations.push({
          id,
          handle,
          value: titleVal,
          reason: 'title_tag has dangling trailing character'
        });
      }
    }

    // Check description_tag
    if (!descVal) {
      auditResults.descTagViolations.push({
        id,
        handle,
        reason: 'Missing description_tag'
      });
    } else {
      if (descVal.length < 145 || descVal.length > 158) {
        auditResults.descTagViolations.push({
          id,
          handle,
          length: descVal.length,
          value: descVal,
          reason: `description_tag length ${descVal.length} outside 145-158 bounds`
        });
      }
      if (descVal.includes('&amp;')) {
        auditResults.descTagViolations.push({
          id,
          handle,
          value: descVal,
          reason: 'description_tag contains &amp;'
        });
      }
      if (/^(Home|Collections?)\s*[/›>]/i.test(descVal) || /\.\.\.$/.test(descVal)) {
        auditResults.descTagViolations.push({
          id,
          handle,
          value: descVal,
          reason: 'description_tag contains breadcrumb or truncation ellipsis'
        });
      }
    }

    // Specific audit: contact-us
    if (handle === 'contact-us') {
      const hasTypoInBody = bodyStr.includes('printswithpasssionbc@gmail.com');
      const hasCorrectInBody = bodyStr.includes('printswithpassionbc@gmail.com');
      const hasTypoInDesc = descVal.includes('printswithpasssionbc@gmail.com');
      const hasCorrectInDesc = descVal.includes('printswithpassionbc@gmail.com');
      auditResults.contactUsAudit = {
        id,
        hasTypoInBody,
        hasCorrectInBody,
        hasTypoInDesc,
        hasCorrectInDesc,
        titleVal,
        descVal
      };
    }

    // Specific audit: uk-product-catalog
    if (handle === 'uk-product-catalog') {
      const linkRegex = /href="\/pages\/([a-zA-Z0-9_\-]+)"/g;
      const linkedHandles = new Set();
      let match;
      while ((match = linkRegex.exec(bodyStr)) !== null) {
        linkedHandles.add(match[1]);
      }
      const otherPages = pages.filter(p => p.handle !== 'uk-product-catalog');
      const missingLinks = otherPages.filter(p => !linkedHandles.has(p.handle)).map(p => p.handle);

      auditResults.catalogLinksAudit = {
        id,
        totalLinkedHandles: linkedHandles.size,
        expectedLinks: otherPages.length,
        missingLinks,
        allOtherPagesCovered: missingLinks.length === 0
      };
    }
  }

  // 2. Fetch and audit footer menu
  console.log('Fetching footer navigation menu from Shopify Admin...');
  const menuQuery = `
    query getFooterMenu {
      menu(id: "gid://shopify/Menu/221177086263") {
        id
        title
        handle
        items {
          id
          title
          url
          type
          resourceId
        }
      }
    }
  `;
  const menuRes = await shopifyGraphQL(menuQuery);
  const menu = menuRes?.menu;
  const menuItems = menu?.items || [];
  const menuUrls = menuItems.map(i => i.url);

  auditResults.menuAudit = {
    id: menu?.id,
    title: menu?.title,
    handle: menu?.handle,
    totalItems: menuItems.length,
    items: menuItems.map(i => ({ title: i.title, url: i.url })),
    hasAboutUs: menuUrls.includes('/pages/about-us'),
    hasUkCatalog: menuUrls.includes('/pages/uk-product-catalog'),
    hasStudioLookbook: menuUrls.includes('/pages/studio-lookbook-social-feed')
  };

  console.log('\n--- AUDIT RESULTS SUMMARY ---');
  console.log(`Total Pages: ${auditResults.totalPages}`);
  console.log(`H1 Violations (should be 0): ${auditResults.h1Violations.length}`);
  console.log(`&amp; Violations in Body (should be 0): ${auditResults.ampViolations.length}`);
  console.log(`Title Tag Violations (should be 0): ${auditResults.titleTagViolations.length}`);
  console.log(`Desc Tag Violations (should be 0): ${auditResults.descTagViolations.length}`);
  console.log('Contact Us Audit:', JSON.stringify(auditResults.contactUsAudit, null, 2));
  console.log('Catalog Links Audit:', JSON.stringify(auditResults.catalogLinksAudit, null, 2));
  console.log(`Footer Menu Total Items (should be 16): ${auditResults.menuAudit.totalItems}`);
  console.log(`Footer Menu has required links: About Us=${auditResults.menuAudit.hasAboutUs}, UK Catalog=${auditResults.menuAudit.hasUkCatalog}, Studio Lookbook=${auditResults.menuAudit.hasStudioLookbook}`);

  fs.writeFileSync('tests/audit_m4_reviewer1_results.json', JSON.stringify(auditResults, null, 2), 'utf8');
  console.log('\nSaved full audit data to tests/audit_m4_reviewer1_results.json');
}

audit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
