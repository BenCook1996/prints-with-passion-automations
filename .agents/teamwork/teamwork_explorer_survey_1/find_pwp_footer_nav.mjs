import fs from 'fs';
import { LOCAL_TOKEN_PATH, SHOP_DOMAIN } from '../../../lib/cloud-env.mjs';

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

  // Check layout/theme.liquid
  const themeLiquid = await getAsset(token, themeId, 'layout/theme.liquid');
  if (themeLiquid && themeLiquid.includes('pwp-clean-footer-nav')) {
    console.log('FOUND pwp-clean-footer-nav in layout/theme.liquid!');
    const idx = themeLiquid.indexOf('pwp-clean-footer-nav');
    console.log(themeLiquid.slice(Math.max(0, idx - 200), idx + 200));
  } else {
    console.log('Not in layout/theme.liquid');
  }

  // Check footer-group.json
  const footerGroup = await getAsset(token, themeId, 'sections/footer-group.json');
  console.log('sections/footer-group.json:\n', footerGroup);
}

main().catch(console.error);
