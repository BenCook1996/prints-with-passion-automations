import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const tokenPath = path.join(REPO_ROOT, '.shopify_token.json');
const tokenCfg = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

let accessToken = null;
if (tokenCfg.SHOPIFY_CLIENT_ID && tokenCfg.SHOPIFY_CLIENT_SECRET) {
  const res = await fetch(`https://${tokenCfg.shopDomain || 'bencook96store.myshopify.com'}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: tokenCfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: tokenCfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  if (res.ok) {
    const data = await res.json();
    accessToken = data.access_token;
  }
}
if (!accessToken) {
  accessToken = tokenCfg.accessToken || tokenCfg.SHOPIFY_ADMIN_ACCESS_TOKEN;
}

const domain = tokenCfg.shopDomain || 'bencook96store.myshopify.com';

async function fetchRest(endpoint, method = 'GET', body = null) {
  const url = `https://${domain}/admin/api/2025-01/${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: res.status, data: await res.json() };
}

async function fetchGraphQL(query, variables = {}) {
  const url = `https://${domain}/admin/api/2025-01/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query, variables })
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  console.log('=== 1. FULL REST SHOP OBJECT ===');
  const shopRest = await fetchRest('shop.json');
  console.log(JSON.stringify(shopRest.data, null, 2));

  console.log('\n=== 2. GRAPHQL SHOP FIELDS ===');
  const shopFieldsGql = await fetchGraphQL(`{
    __type(name: "Shop") {
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }`);
  const fields = shopFieldsGql.data?.data?.__type?.fields?.map(f => f.name) || [];
  console.log('Shop GraphQL fields count:', fields.length);
  console.log('Shop GraphQL fields:', fields.filter(f => 
    f.toLowerCase().includes('email') || 
    f.toLowerCase().includes('desc') || 
    f.toLowerCase().includes('meta') || 
    f.toLowerCase().includes('title') ||
    f.toLowerCase().includes('contact')
  ));

  console.log('\n=== 3. GRAPHQL MUTATIONS RELATED TO SHOP ===');
  const mutationsGql = await fetchGraphQL(`{
    __schema {
      mutationType {
        fields {
          name
        }
      }
    }
  }`);
  const mutations = mutationsGql.data?.data?.__schema?.mutationType?.fields?.map(m => m.name) || [];
  console.log('Shop-related mutations:', mutations.filter(m => m.toLowerCase().includes('shop')));

  console.log('\n=== 4. DELIVERY-RETURN FULL BODY ===');
  const pageRes = await fetchGraphQL(`{
    page(id: "gid://shopify/Page/703779766645") {
      id
      title
      handle
      body
    }
  }`);
  const drPage = pageRes.data?.data?.page;
  console.log('delivery-return ID:', drPage?.id);
  console.log('delivery-return title:', drPage?.title);
  console.log('delivery-return full body:\n', drPage?.body);

  console.log('\n=== 5. SCAN BLOG ARTICLES ===');
  const blogsRes = await fetchGraphQL(`{
    blogs(first: 10) {
      edges {
        node {
          id
          title
          handle
          articles(first: 50) {
            edges {
              node {
                id
                title
                handle
                contentHtml
              }
            }
          }
        }
      }
    }
  }`);
  const blogs = blogsRes.data?.data?.blogs?.edges?.map(e => e.node) || [];
  let typoFoundInBlogs = 0;
  for (const b of blogs) {
    const articles = b.articles?.edges?.map(e => e.node) || [];
    console.log(`Blog "${b.title}" (${b.handle}) has ${articles.length} articles.`);
    for (const a of articles) {
      if (a.contentHtml?.includes('printswithpasssion') || a.title?.includes('printswithpasssion')) {
        console.log(`Typo found in article: ${a.title} (${a.handle}) - ${a.id}`);
        typoFoundInBlogs++;
      }
    }
  }
  if (typoFoundInBlogs === 0) console.log('Zero typos found across all blog articles.');

  console.log('\n=== 6. SCAN ACTIVE THEME ASSETS FOR TYPO ===');
  const themeId = 177936466293;
  const assetsRes = await fetchRest(`themes/${themeId}/assets.json`);
  const assets = assetsRes.data?.assets || [];
  console.log(`Found ${assets.length} assets in theme ${themeId}.`);

  const typoAssets = [];
  // Scan snippets, sections, layout, config, templates
  const checkAssets = assets.filter(a => 
    a.key.startsWith('snippets/') || 
    a.key.startsWith('sections/') || 
    a.key.startsWith('layout/') || 
    a.key.startsWith('config/') ||
    a.key.startsWith('templates/') ||
    a.key.startsWith('locales/')
  );
  console.log(`Checking ${checkAssets.length} relevant theme asset files...`);
  
  for (const a of checkAssets) {
    const assetDetail = await fetchRest(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(a.key)}`);
    const val = assetDetail.data?.asset?.value || '';
    if (val.includes('printswithpasssion')) {
      console.log(`Typo found in theme asset: ${a.key}`);
      typoAssets.push(a.key);
      const idx = val.indexOf('printswithpasssion');
      console.log('Snippet:', val.slice(Math.max(0, idx - 50), Math.min(val.length, idx + 100)));
    }
  }
  if (typoAssets.length === 0) console.log('Zero typos found in checked theme assets.');

  console.log('\n=== 7. CHECK ONLINE STORE PREFERENCES / SHOP DESCRIPTION ===');
  // Let's check shop metafields or shop settings
  const shopMetafields = await fetchGraphQL(`{
    shop {
      metafields(first: 20) {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
  }`);
  console.log('Shop Metafields:', JSON.stringify(shopMetafields.data, null, 2));
}

main().catch(console.error);
