import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_TOKEN_PATH, SHOP_DOMAIN, shopifyGraphQL } from '../../../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Search in index.json or sections
  const indexStr = fs.readFileSync(path.join(__dirname, 'templates_index.json'), 'utf8');
  if (indexStr.includes('100% Free Replacement') || indexStr.includes('Defective Items')) {
    console.log('FOUND in templates/index.json!');
  } else {
    console.log('Not in templates/index.json');
  }

  // 2. Search in all pages via GraphQL
  const pagesQuery = `
    query GetPages {
      pages(first: 50) {
        nodes {
          id
          title
          handle
          body
        }
      }
    }
  `;
  const pagesData = await shopifyGraphQL(pagesQuery);
  for (const p of pagesData?.pages?.nodes || []) {
    if (p.body && p.body.includes('printswithpasssion')) {
      console.log(`FOUND typo in Page: "${p.title}" (/pages/${p.handle})`);
    }
  }

  // 3. Search in shop policies
  const shopPoliciesQuery = `
    query GetShopPolicies {
      shop {
        shopPolicies {
          type
          title
          body
        }
      }
    }
  `;
  const policyData = await shopifyGraphQL(shopPoliciesQuery);
  for (const pol of policyData?.shop?.shopPolicies || []) {
    if (pol.body && pol.body.includes('printswithpasssion')) {
      console.log(`FOUND typo in Shop Policy: "${pol.title}" (${pol.type})`);
    }
  }

  // 4. Where in live HTML is that section located? Look at parent element
  const homeRes = await fetch('https://printswithpassion.com/');
  const homeHtml = await homeRes.text();
  const idx = homeHtml.indexOf('100% Free Replacement');
  if (idx !== -1) {
    console.log('\nLive HTML snippet containing guarantee (from char ' + Math.max(0, idx - 600) + '):');
    console.log(homeHtml.slice(Math.max(0, idx - 600), idx + 600));
  }
}

main().catch(console.error);
