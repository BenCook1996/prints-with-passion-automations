import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('--- 1. Querying Menus ---');
  const menuRes = await shopifyGraphQL(`
    query {
      menus(first: 20) {
        nodes {
          id
          handle
          title
          items {
            id
            title
            url
            type
            items {
              id
              title
              url
              type
            }
          }
        }
      }
    }
  `);
  console.log('Menus found:', menuRes?.menus?.nodes?.map(m => ({ id: m.id, handle: m.handle, title: m.title })));
  
  const footerMenu = menuRes?.menus?.nodes?.find(m => m.id === 'gid://shopify/Menu/221177086263' || m.handle === 'footer');
  console.log('Footer Menu Details:', JSON.stringify(footerMenu, null, 2));

  console.log('\n--- 2. Querying Pages with handle uk-product-catalog ---');
  const pageRes = await shopifyGraphQL(`
    query {
      pages(first: 50) {
        nodes {
          id
          handle
          title
        }
      }
    }
  `);
  const catalogPage = pageRes?.pages?.nodes?.find(p => p.handle === 'uk-product-catalog');
  console.log('Catalog Page found by handle:', catalogPage);

  if (catalogPage) {
    const catalogFull = await shopifyGraphQL(`
      query($id: ID!) {
        page(id: $id) {
          id
          handle
          title
          body
          seo {
            title
            description
          }
        }
      }
    `, { id: catalogPage.id });
    console.log('Catalog Page ID:', catalogFull?.page?.id);
    console.log('Catalog Page Body Length:', catalogFull?.page?.body?.length);
    console.log('Catalog Page Body preview (first 500 chars):', catalogFull?.page?.body?.slice(0, 500));
    fs.writeFileSync('./.agents/teamwork/teamwork_explorer_m4_3/current_catalog_body.html', catalogFull?.page?.body || '');
  }

  // Also check if gid://shopify/Page/140089884983 exists
  try {
    const p140 = await shopifyGraphQL(`
      query {
        page(id: "gid://shopify/Page/140089884983") {
          id
          handle
          title
        }
      }
    `);
    console.log('Page 140089884983:', p140?.page);
  } catch (err) {
    console.log('Page 140089884983 query error:', err.message);
  }

  console.log('\n--- 3. Listing All Pages in Shopify ---');
  const allPages = pageRes?.pages?.nodes || [];
  console.log(`Total Pages in Admin: ${allPages.length}`);
  allPages.forEach(p => console.log(`- ${p.handle} (${p.id}): "${p.title}"`));
}

main().catch(console.error);
