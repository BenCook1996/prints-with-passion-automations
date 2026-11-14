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

  // Get asset list
  const listRes = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const listData = await listRes.json();
  const allAssets = listData.assets.map(a => a.key);

  // Targets to search
  // We want to find:
  // 1. "pwp-gallery-logo-wrap" or "logo" or "ARCHIVAL PRINT STUDIO"
  // 2. "customer_authentication"
  // 3. "printswithpasssion"
  // 4. "page_description" or "page_title"
  // 5. "Art built for quiet rooms"

  const interestingAssets = allAssets.filter(k => 
    k.startsWith('snippets/') || 
    k.startsWith('sections/') || 
    k.startsWith('layout/') || 
    k.startsWith('config/') ||
    k === 'templates/index.json'
  );

  console.log(`Searching through ${interestingAssets.length} assets...`);

  const results = {
    logoH1: [],
    customerAuth: [],
    typoEmail: [],
    pageTitleMeta: [],
    heroTitle: []
  };

  // Process in batches
  for (let i = 0; i < interestingAssets.length; i += 10) {
    const batch = interestingAssets.slice(i, i + 10);
    await Promise.all(batch.map(async (key) => {
      try {
        const res = await fetch(`https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`, {
          headers: { 'X-Shopify-Access-Token': token }
        });
        if (!res.ok) return;
        const d = await res.json();
        const content = d.asset?.value || '';

        if (content.includes('pwp-gallery-logo-wrap') || content.includes('ARCHIVAL PRINT STUDIO')) {
          results.logoH1.push(key);
        }
        if (content.includes('customer_authentication')) {
          results.customerAuth.push(key);
        }
        if (content.includes('printswithpasssion')) {
          results.typoEmail.push(key);
        }
        if (content.includes('page_description') || content.includes('<title>')) {
          results.pageTitleMeta.push(key);
        }
        if (content.includes('Art built for quiet rooms')) {
          results.heroTitle.push(key);
        }
      } catch (e) {
        console.error(`Error fetching ${key}:`, e.message);
      }
    }));
  }

  console.log('--- Search Results ---');
  console.log('Logo H1 found in:', results.logoH1);
  console.log('Customer Auth found in:', results.customerAuth);
  console.log('Typo email found in:', results.typoEmail);
  console.log('Page Title / Meta found in:', results.pageTitleMeta);
  console.log('Hero title found in:', results.heroTitle);
}

main().catch(console.error);
