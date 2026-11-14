/**
 * Deploys snippets/head.liquid to active theme gid://shopify/OnlineStoreTheme/177936466293
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SHOP_DOMAIN, LOCAL_TOKEN_PATH } from './lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THEME_ID = '177936466293';

async function getAccessToken() {
  const localCfg = JSON.parse(fs.readFileSync(LOCAL_TOKEN_PATH, 'utf8'));
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: localCfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: localCfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function putThemeAsset(token, key, value) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({
      asset: {
        key,
        value
      }
    })
  });
  if (!res.ok) throw new Error(`Failed to put asset ${key}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.asset;
}

async function main() {
  console.log('1. Authenticating with Shopify OAuth2...');
  const token = await getAccessToken();
  console.log('   Authenticated successfully.');

  console.log('2. Reading local snippets/head.liquid...');
  const localHeadPath = path.join(__dirname, 'snippets/head.liquid');
  const headContent = fs.readFileSync(localHeadPath, 'utf8');

  console.log(`   Read ${headContent.length} bytes.`);
  console.log('3. Uploading snippets/head.liquid to active theme', THEME_ID);
  const asset = await putThemeAsset(token, 'snippets/head.liquid', headContent);
  console.log(`   Successfully uploaded ${asset.key} (size: ${asset.size}, updated_at: ${asset.updated_at})`);
}

main().catch((err) => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
