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

async function fetchAsset(key) {
  const res = await fetch(`https://${domain}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`, {
    headers: { 'X-Shopify-Access-Token': accessToken }
  });
  const data = await res.json();
  return data.asset?.value || '';
}

async function main() {
  const settingsData = await fetchAsset('config/settings_data.json');
  console.log('settings_data.json contains delivery-return:', settingsData.includes('delivery-return'));
  if (settingsData.includes('delivery-return')) {
    const idx = settingsData.indexOf('delivery-return');
    console.log('Snippet in settings_data:', settingsData.slice(Math.max(0, idx - 100), Math.min(settingsData.length, idx + 100)));
  }

  const themeLiquid = await fetchAsset('layout/theme.liquid');
  console.log('layout/theme.liquid contains delivery-return:', themeLiquid.includes('delivery-return'));
  if (themeLiquid.includes('delivery-return')) {
    const idx = themeLiquid.indexOf('delivery-return');
    console.log('Snippet in theme.liquid:', themeLiquid.slice(Math.max(0, idx - 100), Math.min(themeLiquid.length, idx + 100)));
  }

  // Let's search where the modal HTML comes from in live DOM
  const res = await fetch('https://printswithpassion.com/');
  const html = await res.text();
  const idx = html.indexOf('printswithpasssion');
  if (idx !== -1) {
    console.log('Live DOM container around typo:');
    console.log(html.slice(Math.max(0, idx - 300), Math.min(html.length, idx + 400)));
  }
}

main().catch(console.error);
