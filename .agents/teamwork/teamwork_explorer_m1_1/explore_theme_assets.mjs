import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCAL_TOKEN_PATH = path.join(REPO_ROOT, '.shopify_token.json');
const SHOP_DOMAIN = 'bencook96store.myshopify.com';
const THEME_ID = '177936466293';

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
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function getAsset(token, themeId, key) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  if (!res.ok) throw new Error(`Asset fetch ${key} failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.asset?.value || null;
}

async function main() {
  console.log('Authenticating with Shopify Admin API...');
  const token = await getAccessToken();
  console.log('Authenticated successfully.');

  // 1. Fetch snippets/head.liquid
  console.log('\nFetching snippets/head.liquid...');
  const headLiquid = await getAsset(token, THEME_ID, 'snippets/head.liquid');
  fs.writeFileSync(path.join(__dirname, 'current_snippets_head.liquid'), headLiquid, 'utf8');
  console.log('snippets/head.liquid length:', headLiquid.length);

  // 2. Fetch sections/header.liquid
  console.log('\nFetching sections/header.liquid...');
  const headerLiquid = await getAsset(token, THEME_ID, 'sections/header.liquid');
  fs.writeFileSync(path.join(__dirname, 'current_sections_header.liquid'), headerLiquid, 'utf8');
  console.log('sections/header.liquid length:', headerLiquid.length);

  // 3. Fetch templates/index.json
  console.log('\nFetching templates/index.json...');
  const indexJsonStr = await getAsset(token, THEME_ID, 'templates/index.json');
  fs.writeFileSync(path.join(__dirname, 'current_templates_index.json'), indexJsonStr, 'utf8');
  console.log('templates/index.json length:', indexJsonStr.length);

  // 4. Fetch snippets/head-get-social-meta-tags.liquid if exists
  try {
    const socialMeta = await getAsset(token, THEME_ID, 'snippets/head-get-social-meta-tags.liquid');
    fs.writeFileSync(path.join(__dirname, 'current_snippets_social_meta.liquid'), socialMeta, 'utf8');
    console.log('snippets/head-get-social-meta-tags.liquid length:', socialMeta.length);
  } catch (err) {
    console.log('Could not fetch head-get-social-meta-tags.liquid:', err.message);
  }

  // 5. Fetch layout/theme.liquid
  try {
    const themeLiquid = await getAsset(token, THEME_ID, 'layout/theme.liquid');
    fs.writeFileSync(path.join(__dirname, 'current_layout_theme.liquid'), themeLiquid, 'utf8');
    console.log('layout/theme.liquid length:', themeLiquid.length);
  } catch (err) {
    console.log('Could not fetch layout/theme.liquid:', err.message);
  }

  console.log('\nAll assets downloaded successfully.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
