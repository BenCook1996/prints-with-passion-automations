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
  console.log('=== 1. GraphQL Shop Query ===');
  const shopGql = await fetchGraphQL(`{
    shop {
      id
      name
      email
      contactEmail
      description
      myshopifyDomain
      url
    }
  }`);
  console.log('Shop GQL:', JSON.stringify(shopGql.data, null, 2));

  console.log('\n=== 2. Check Shop Metafields ===');
  const metafieldsGql = await fetchGraphQL(`{
    shop {
      metafields(first: 50) {
        edges {
          node {
            id
            namespace
            key
            value
            type
          }
        }
      }
    }
  }`);
  console.log('Shop Metafields:', JSON.stringify(metafieldsGql.data, null, 2));

  console.log('\n=== 3. Check Specific Theme Assets for Email Typo ===');
  const themeId = 177936466293;
  const targetKeys = [
    'config/settings_data.json',
    'locales/en.default.json',
    'templates/index.json',
    'sections/header.liquid',
    'sections/footer.liquid',
    'snippets/head.liquid',
    'layout/theme.liquid'
  ];

  for (const key of targetKeys) {
    const res = await fetchRest(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`);
    const val = res.data?.asset?.value || '';
    const hasTypo = val.includes('printswithpasssion');
    const hasCorrect = val.includes('printswithpassionbc@gmail.com');
    console.log(`Asset ${key}: size=${val.length}, hasTypo=${hasTypo}, hasCorrectEmail=${hasCorrect}`);
    if (hasTypo) {
      const idx = val.indexOf('printswithpasssion');
      console.log(`  -> Match context in ${key}:`, val.slice(Math.max(0, idx - 40), Math.min(val.length, idx + 80)));
    }
  }

  console.log('\n=== 4. Check all JSON templates in Theme for Typo ===');
  const assetsRes = await fetchRest(`themes/${themeId}/assets.json`);
  const jsonTemplates = (assetsRes.data?.assets || []).filter(a => a.key.startsWith('templates/') && a.key.endsWith('.json'));
  console.log(`Checking ${jsonTemplates.length} JSON templates...`);
  for (const t of jsonTemplates) {
    const res = await fetchRest(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(t.key)}`);
    const val = res.data?.asset?.value || '';
    if (val.includes('printswithpasssion')) {
      console.log(`Typo found in template: ${t.key}`);
    }
  }

  console.log('\n=== 5. Check all sections in Theme for Typo ===');
  const sectionAssets = (assetsRes.data?.assets || []).filter(a => a.key.startsWith('sections/'));
  console.log(`Checking ${sectionAssets.length} sections...`);
  for (const s of sectionAssets) {
    const res = await fetchRest(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(s.key)}`);
    const val = res.data?.asset?.value || '';
    if (val.includes('printswithpasssion')) {
      console.log(`Typo found in section: ${s.key}`);
    }
  }
}

main().catch(console.error);
