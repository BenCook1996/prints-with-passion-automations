import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const query = `
    query getCollectionsTest {
      collectionsCount { count }
      collections(first: 5) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          productsCount { count }
          seo {
            title
            description
          }
        }
      }
    }
  `;

  try {
    const res = await shopifyGraphQL(query);
    console.log('Result:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }

  // Check sitemap.xml
  try {
    const sitemapRes = await fetch('https://printswithpassion.com/sitemap.xml');
    console.log('sitemap.xml status:', sitemapRes.status);
    const xml = await sitemapRes.text();
    console.log('sitemap.xml snippet:', xml.slice(0, 500));
  } catch (err) {
    console.error('sitemap.xml fetch error:', err);
  }
}

main();
