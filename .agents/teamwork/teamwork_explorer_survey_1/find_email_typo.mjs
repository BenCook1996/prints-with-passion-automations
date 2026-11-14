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

async function main() {
  const token = await getAccessToken();
  const themeId = '177936466293';

  // Check config/settings_data.json
  const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  const settingsStr = data.asset?.value || '';

  if (settingsStr.includes('printswithpasssion')) {
    console.log('FOUND typo in config/settings_data.json!');
    const idx = settingsStr.indexOf('printswithpasssion');
    console.log(settingsStr.slice(Math.max(0, idx - 150), idx + 200));
  } else {
    console.log('Typo NOT in config/settings_data.json.');
  }

  // Where on the live site did the typo appear?
  // Let's fetch the homepage HTML and find the exact surrounding HTML of the typo!
  const homeRes = await fetch('https://printswithpassion.com/');
  const homeHtml = await homeRes.text();
  let idx = 0;
  while ((idx = homeHtml.indexOf('printswithpasssion', idx)) !== -1) {
    console.log(`\nFound live typo at char ${idx}:`);
    console.log(homeHtml.slice(Math.max(0, idx - 200), idx + 250));
    idx += 'printswithpasssion'.length;
  }
}

main().catch(console.error);
