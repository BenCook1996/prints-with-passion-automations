import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

const DISCONTINUED_HANDLES = [
  'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
  'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles',
  'shoes', 'hats', 'bottles', 'tote-bags', 'suitcases',
  'yoga-mats', 'makeup-bags', 'coasters', 'pet-mat', 'bottle-opener',
  'pet-bowls', 'bags', 'bags-1', 'pets-animals', 'can-cooler',
  'posters', 'rugs', 'mousepads'
];

async function fetchAllCollections() {
  let collections = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query GetAllCollections($cursor: String) {
        collections(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            title
            productsCount { count }
            updatedAt
            seo {
              title
              description
            }
            ruleSet {
              appliedDisjunctively
            }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(query, { cursor });
    if (!res?.collections?.nodes) {
      console.error('Failed to fetch collections:', res);
      break;
    }
    collections.push(...res.collections.nodes);
    hasNextPage = res.collections.pageInfo.hasNextPage;
    cursor = res.collections.pageInfo.endCursor;
  }
  return collections;
}

async function fetchAllRedirects() {
  let redirects = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query GetAllRedirects($cursor: String) {
        urlRedirects(first: 250, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            path
            target
          }
        }
      }
    `;
    const res = await shopifyGraphQL(query, { cursor });
    if (!res?.urlRedirects?.nodes) {
      console.error('Failed to fetch urlRedirects:', res);
      break;
    }
    redirects.push(...res.urlRedirects.nodes);
    hasNextPage = res.urlRedirects.pageInfo.hasNextPage;
    cursor = res.urlRedirects.pageInfo.endCursor;
  }
  return redirects;
}

async function main() {
  console.log('Fetching all collections...');
  const collections = await fetchAllCollections();
  console.log(`Total collections in Shopify Admin: ${collections.length}`);

  // Save collections dump for deep analysis
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_collections.json'),
    JSON.stringify(collections, null, 2)
  );

  const collectionByHandle = new Map(collections.map(c => [c.handle, c]));

  console.log('\n--- DISCONTINUED 28 COLLECTIONS AUDIT ---');
  const foundDiscontinued = [];
  const missingDiscontinued = [];

  for (const h of DISCONTINUED_HANDLES) {
    const col = collectionByHandle.get(h);
    if (col) {
      const cnt = col.productsCount?.count ?? col.productsCount ?? 0;
      foundDiscontinued.push({
        handle: h,
        id: col.id,
        title: col.title,
        productsCount: cnt,
        seo: col.seo
      });
      console.log(`FOUND: ${h.padEnd(20)} | ID: ${col.id} | Count: ${cnt} | Title: "${col.title}"`);
    } else {
      missingDiscontinued.push(h);
      console.log(`NOT IN SHOPIFY ADMIN: ${h.padEnd(20)}`);
    }
  }

  console.log(`\nFound in Shopify Admin: ${foundDiscontinued.length} / ${DISCONTINUED_HANDLES.length}`);
  if (missingDiscontinued.length > 0) {
    console.log(`Missing handles in Admin: ${missingDiscontinued.join(', ')}`);
  }

  // Check avada-upsell-best-sellers
  console.log('\n--- AVADA UPSELL BEST SELLERS ---');
  const avada = collectionByHandle.get('avada-upsell-best-sellers');
  if (avada) {
    console.log(`Found avada-upsell-best-sellers: ID: ${avada.id}, Count: ${avada.productsCount?.count}, Title: "${avada.title}"`);
  } else {
    console.log('avada-upsell-best-sellers NOT FOUND in collections list');
  }

  // Check frontpage
  console.log('\n--- FRONTPAGE COLLECTION ---');
  const frontpage = collectionByHandle.get('frontpage');
  if (frontpage) {
    console.log(`Found frontpage: ID: ${frontpage.id}, Count: ${frontpage.productsCount?.count}, Title: "${frontpage.title}"`);
  } else {
    console.log('frontpage NOT FOUND');
  }

  // Audit redirects
  console.log('\nFetching all urlRedirects...');
  const redirects = await fetchAllRedirects();
  console.log(`Total urlRedirects in Shopify: ${redirects.length}`);

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_redirects.json'),
    JSON.stringify(redirects, null, 2)
  );

  const percent20Redirects = redirects.filter(r => r.target && r.target.includes('%20'));
  console.log(`\nRedirects with %20 in target: ${percent20Redirects.length}`);
  for (const r of percent20Redirects) {
    console.log(`  [${r.id}] ${r.path} -> ${r.target}`);
  }

  const blogRedirects = redirects.filter(r => r.path && r.path.includes('/blogs/'));
  console.log(`\nRedirects originating from /blogs/: ${blogRedirects.length}`);
  for (const r of blogRedirects) {
    console.log(`  [${r.id}] ${r.path} -> ${r.target}`);
  }

  const studentGuideRedirect = redirects.filter(r => r.path && r.path.includes('uk-student-room-rental-flat-decor-guide'));
  console.log(`\nSpecific search for 'uk-student-room-rental-flat-decor-guide' redirects: ${studentGuideRedirect.length}`);
  for (const r of studentGuideRedirect) {
    console.log(`  MATCH: [${r.id}] ${r.path} -> ${r.target}`);
  }

  // Redirects for the 28 discontinued collections
  console.log('\nChecking existing redirects for the 28 discontinued collection handles...');
  const existingDiscontinuedRedirects = redirects.filter(r => {
    return DISCONTINUED_HANDLES.some(h => r.path === `/collections/${h}` || r.path === `/collections/${h}/`);
  });
  console.log(`Existing redirects for discontinued collections: ${existingDiscontinuedRedirects.length}`);
  for (const r of existingDiscontinuedRedirects) {
    console.log(`  [${r.id}] ${r.path} -> ${r.target}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
