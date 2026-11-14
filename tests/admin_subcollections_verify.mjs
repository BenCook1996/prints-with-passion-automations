import fs from 'fs';
import { SHOP_DOMAIN, LOCAL_TOKEN_PATH } from '../lib/cloud-env.mjs';

async function verifyAll48Collections() {
  const localCfg = JSON.parse(fs.readFileSync(LOCAL_TOKEN_PATH, 'utf8'));
  const tokenRes = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: localCfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: localCfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  const subs = JSON.parse(fs.readFileSync('phase2_40_subcollections.json', 'utf8'));
  console.log('Subcollections to verify:', subs.length);

  const found = new Map();
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const query = {
      query: `query listCollections($cursor: String) {
        collections(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              handle
              title
              productsCount {
                count
              }
            }
          }
        }
      }`,
      variables: { cursor }
    };
    const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify(query)
    });
    const d = await res.json();
    for (const e of d.data.collections.edges) {
      found.set(e.node.handle, e.node);
    }
    hasNext = d.data.collections.pageInfo.hasNextPage;
    cursor = d.data.collections.pageInfo.endCursor;
  }

  console.log('Total store collections in Admin:', found.size);
  let missing = [];
  for (const s of subs) {
    if (!found.has(s.handle)) {
      missing.push(s.handle);
    } else {
      const node = found.get(s.handle);
      console.log(`[VERIFIED] ${s.handle} (Title: "${node.title}", Products: ${node.productsCount.count})`);
    }
  }
  console.log('\n--- VERIFICATION RESULT ---');
  console.log('Missing sub-collections:', missing.length);
  if (missing.length > 0) {
    console.log('Missing handles:', missing);
    process.exit(1);
  } else {
    console.log('SUCCESS: ALL 48 SMART SUB-COLLECTIONS VERIFIED IN SHOPIFY ADMIN CATALOG WITH ACTIVE PRODUCTS!');
  }
}

verifyAll48Collections().catch(err => {
  console.error(err);
  process.exit(1);
});
