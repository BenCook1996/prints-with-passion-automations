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
const themeId = 177936466293;

async function fetchRest(endpoint) {
  const res = await fetch(`https://${domain}/admin/api/2025-01/${endpoint}`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  return await res.json();
}

async function main() {
  const res = await fetchRest(`themes/${themeId}/assets.json`);
  const assets = res.assets || [];
  console.log(`Searching ${assets.length} assets for "delivery-return"...`);

  // Filter to liquid and json
  const candidates = assets.filter(a => a.key.endsWith('.liquid') || a.key.endsWith('.json'));
  for (const c of candidates) {
    const aRes = await fetchRest(`themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(c.key)}`);
    const val = aRes.asset?.value || '';
    if (val.includes('delivery-return')) {
      console.log(`Found "delivery-return" in asset: ${c.key}`);
      const idx = val.indexOf('delivery-return');
      console.log('Snippet:', val.slice(Math.max(0, idx - 50), Math.min(val.length, idx + 80)));
    }
  }
}

main().catch(console.error);
