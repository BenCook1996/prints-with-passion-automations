import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const THEME_ID = '177936466293';
const ASSET_KEY = 'snippets/head.liquid';
const LOCAL_ASSET_PATH = path.join(REPO_ROOT, ASSET_KEY);
const TOKEN_PATH = path.join(REPO_ROOT, '.shopify_token.json');

async function getAccessToken(shopDomain) {
  const cfg = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: cfg.SHOPIFY_CLIENT_ID.trim(),
      client_secret: cfg.SHOPIFY_CLIENT_SECRET.trim(),
      grant_type: 'client_credentials'
    })
  });
  if (!res.ok) {
    throw new Error(`OAuth token request failed: HTTP ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function main() {
  console.log('='.repeat(80));
  console.log('DEPLOYING snippets/head.liquid TO LIVE SHOPIFY THEME ' + THEME_ID);
  console.log('='.repeat(80));

  const shopDomain = 'bencook96store.myshopify.com';
  console.log(`Target shop: ${shopDomain}`);

  const localContent = fs.readFileSync(LOCAL_ASSET_PATH, 'utf8');
  if (!localContent.includes(`replace: '&quot;', '"'`)) {
    throw new Error('Local snippets/head.liquid does not contain the required quote patch!');
  }
  console.log('Verified local snippets/head.liquid contains quote patch.');

  const token = await getAccessToken(shopDomain);
  console.log('Acquired Shopify Admin OAuth access token.');

  // Deploy via REST Asset API
  console.log(`Deploying asset "${ASSET_KEY}" to theme ${THEME_ID}...`);
  const putRes = await fetch(`https://${shopDomain}/admin/api/2025-01/themes/${THEME_ID}/assets.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({
      asset: {
        key: ASSET_KEY,
        value: localContent
      }
    })
  });

  const putData = await putRes.json();
  if (!putRes.ok) {
    console.error('Failed to update asset:', putData);
    throw new Error(`Asset update failed with HTTP ${putRes.status}`);
  }

  console.log('Successfully deployed asset to theme!');
  console.log('Response asset metadata:', {
    key: putData.asset.key,
    theme_id: putData.asset.theme_id,
    updated_at: putData.asset.updated_at,
    size: putData.asset.size
  });

  // Verify remote asset
  console.log('\nVerifying deployed asset by fetching it back from Shopify REST API...');
  const getRes = await fetch(`https://${shopDomain}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=${ASSET_KEY}`, {
    headers: {
      'X-Shopify-Access-Token': token
    }
  });

  const getData = await getRes.json();
  if (!getRes.ok) {
    throw new Error(`Failed to fetch back deployed asset: HTTP ${getRes.status}`);
  }

  const remoteValue = getData.asset.value;
  const remoteHasPatch = remoteValue.includes(`replace: '&quot;', '"'`);
  console.log(`Remote theme asset contains quote patch: ${remoteHasPatch}`);

  if (!remoteHasPatch) {
    throw new Error('Verification failed: remote asset does NOT contain quote patch!');
  }

  console.log('\nTHEME ASSET DEPLOYMENT & REMOTE VERIFICATION SUCCEEDED 100%!');
}

main().catch(err => {
  console.error('Fatal deployment error:', err);
  process.exit(1);
});
