import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_TOKEN_PATH, SHOP_DOMAIN } from '../../../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getAccessToken() {
  const localCfg = JSON.parse(fs.readFileSync(LOCAL_TOKEN_PATH, 'utf8'));
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: localCfg.SHOPIFY_CLIENT_ID,
      client_secret: localCfg.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials'
    })
  });
  const data = await res.json();
  return data.access_token;
}

async function getAsset(token, themeId, key) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset?.value || null;
}

async function main() {
  const token = await getAccessToken();
  const themeId = '177936466293';

  // 1. snippets/head.liquid
  const head = await getAsset(token, themeId, 'snippets/head.liquid');
  fs.writeFileSync(path.join(__dirname, 'snippets_head.liquid'), head, 'utf8');
  console.log('Saved snippets_head.liquid (length:', head.length, ')');

  // Find title & description logic in head.liquid
  const titleMatch = head.match(/<title[\s\S]*?<\/title>/i);
  console.log('Title tag in head.liquid:\n', titleMatch ? titleMatch[0] : 'NOT FOUND');

  const metaDescMatch = head.match(/<meta[^>]+name=["']description[\s\S]*?>/i);
  console.log('Meta desc tag in head.liquid:\n', metaDescMatch ? metaDescMatch[0] : 'NOT FOUND');

  // Let's check snippets starting with header or logo
  const listRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const listData = await listRes.json();
  const allKeys = listData.assets.map(a => a.key);

  const headerRelated = allKeys.filter(k => k.toLowerCase().includes('header') || k.toLowerCase().includes('logo'));
  console.log('\nHeader/Logo related assets:', headerRelated);

  const footerRelated = allKeys.filter(k => k.toLowerCase().includes('footer'));
  console.log('Footer related assets:', footerRelated);

  const accountRelated = allKeys.filter(k => k.toLowerCase().includes('account') || k.toLowerCase().includes('login') || k.toLowerCase().includes('auth'));
  console.log('Account/Auth related assets:', accountRelated);
}

main().catch(console.error);
