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
  const res = await fetchGraphQL(`{
    page(id: "gid://shopify/Page/703779766645") {
      id
      title
      handle
      body
    }
  }`);
  const page = res.data?.data?.page;
  console.log('=== EXACT BEFORE BODY ===');
  console.log(page.body);

  const cleanBody = page.body.replaceAll('printswithpasssionbc@gmail.com', 'printswithpassionbc@gmail.com');
  console.log('=== EXACT AFTER BODY ===');
  console.log(cleanBody);

  console.log('=== DIFF CHECK ===');
  console.log('Before length:', page.body.length);
  console.log('After length:', cleanBody.length);
  console.log('Has typo in After:', cleanBody.includes('printswithpasssionbc@gmail.com'));
  console.log('Has clean in After:', cleanBody.includes('printswithpassionbc@gmail.com'));
}

main().catch(console.error);
