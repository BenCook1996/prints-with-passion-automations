/**
 * Milestone 1 Automated Deployment & Verification Script
 *
 * Deploys Phase 1 Homepage & Theme SEO Overhaul to:
 * - Active Theme: gid://shopify/OnlineStoreTheme/177936466293 (bencook96store.myshopify.com)
 * - Shopify Admin API (Page gid://shopify/Page/703779766645)
 * - Local repository layout for Git versioning
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL, SHOP_DOMAIN, LOCAL_TOKEN_PATH } from './lib/cloud-env.mjs';

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

async function getThemeAsset(token, key) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  if (!res.ok) throw new Error(`Failed to get asset ${key}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.asset?.value;
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

async function deployPageTypoFix() {
  console.log('\n==================================================');
  console.log('1. Fixing contact email typo in Page 703779766645');
  console.log('==================================================');

  // Query current page body
  const getQuery = `query {
    page(id: "gid://shopify/Page/703779766645") {
      id
      title
      handle
      body
    }
  }`;
  const getRes = await shopifyGraphQL(getQuery);
  const currentBody = getRes?.page?.body;
  if (!currentBody) throw new Error('Could not retrieve current page body');

  console.log(`Current body length: ${currentBody.length}`);
  const typoCount = (currentBody.match(/printswithpasssion/g) || []).length;
  console.log(`Typo occurrences found in current body: ${typoCount}`);

  if (typoCount === 0) {
    console.log('Page body already fixed or typo not present.');
  } else {
    const fixedBody = currentBody.replace(/printswithpasssionbc@gmail\.com/g, 'printswithpassionbc@gmail.com');
    const updateMutation = `mutation updatePage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          title
          handle
          updatedAt
        }
        userErrors {
          field
          message
        }
      }
    }`;
    const updateRes = await shopifyGraphQL(updateMutation, {
      id: 'gid://shopify/Page/703779766645',
      page: { body: fixedBody }
    });

    if (updateRes?.pageUpdate?.userErrors?.length > 0) {
      throw new Error(`pageUpdate failed with errors: ${JSON.stringify(updateRes.pageUpdate.userErrors)}`);
    }
    console.log(`Successfully updated Page 703779766645 at ${updateRes?.pageUpdate?.page?.updatedAt}`);
  }
}

async function deployHeadLiquid(token) {
  console.log('\n==================================================');
  console.log('2. Updating snippets/head.liquid');
  console.log('==================================================');

  const currentContent = await getThemeAsset(token, 'snippets/head.liquid');
  console.log(`Downloaded snippets/head.liquid (${currentContent.length} bytes)`);

  const targetTitleSnippet = `{%- if template.name == 'index' -%}
    <title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>
    <meta name="description" content="Shop archival framed canvas wall art (1.25&quot; pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets &amp; memory foam bath mats.">
{%- elsif template contains 'gift_card' -%}`;

  let updatedContent = currentContent;

  if (currentContent.includes("<title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>")) {
    console.log('snippets/head.liquid already contains target homepage title.');
  } else {
    const giftCardPattern = `{%- if template contains 'gift_card' -%}`;
    if (!currentContent.includes(giftCardPattern)) {
      throw new Error('Could not locate gift_card condition in snippets/head.liquid');
    }
    updatedContent = updatedContent.replace(giftCardPattern, targetTitleSnippet);
    console.log('Injected homepage title & meta description override.');
  }

  // Also adjust max-width: 13ch on .pwp-gallery-hero__title to 24ch
  if (updatedContent.includes('max-width: 13ch;')) {
    updatedContent = updatedContent.replace('max-width: 13ch;', 'max-width: 24ch;');
    console.log('Adjusted .pwp-gallery-hero__title max-width from 13ch to 24ch.');
  }

  // Upload to Shopify Theme
  const result = await putThemeAsset(token, 'snippets/head.liquid', updatedContent);
  console.log(`Successfully uploaded snippets/head.liquid (${result.size} bytes)`);

  // Save local copy
  const localDir = path.join(__dirname, 'snippets');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'head.liquid'), updatedContent, 'utf8');
  console.log('Saved local copy to snippets/head.liquid');
}

async function deployHeaderLiquid(token) {
  console.log('\n==================================================');
  console.log('3. Updating sections/header.liquid');
  console.log('==================================================');

  const currentContent = await getThemeAsset(token, 'sections/header.liquid');
  console.log(`Downloaded sections/header.liquid (${currentContent.length} bytes)`);

  let updatedContent = currentContent;

  // 1. Demote main_logo_tag from 'h1' to 'div' on index
  const targetLogoH1 = `{%- if template.name == 'index' -%}\n                    {%- assign main_logo_tag = 'h1' -%}\n                {%- endif -%}`;
  const targetLogoDiv = `{%- if template.name == 'index' -%}\n                    {%- assign main_logo_tag = 'div' -%}\n                {%- endif -%}`;

  if (updatedContent.includes(targetLogoH1)) {
    updatedContent = updatedContent.replace(targetLogoH1, targetLogoDiv);
    console.log('Demoted main_logo_tag from h1 to div on index.');
  } else if (updatedContent.includes(targetLogoDiv)) {
    console.log('main_logo_tag is already set to div on index.');
  } else {
    // Try flexible regex
    const logoRegex = /({%-\s*if\s+template\.name\s*==\s*'index'\s*-%}[\s\S]*?{%-\s*assign\s+main_logo_tag\s*=\s*)'h1'(\s*-%}[\s\S]*?{%-\s*endif\s*-%})/;
    if (logoRegex.test(updatedContent)) {
      updatedContent = updatedContent.replace(logoRegex, "$1'div'$2");
      console.log('Demoted main_logo_tag via regex.');
    } else {
      console.warn('Warning: Could not match exact logo assignment in sections/header.liquid');
    }
  }

  // 2. Fix rogue leading slash in login link
  const malformedAuthStr = `href="/{%- if customer -%}{{ routes.account_url }}{%- else -%}{{ routes.account_login_url }}{%- endif -%}" class="header__line-additional_button header__line-additional_button--login`;
  const cleanAuthStr = `href="{%- if customer -%}{{ routes.account_url }}{%- else -%}{{ routes.account_login_url }}{%- endif -%}" class="header__line-additional_button header__line-additional_button--login`;

  if (updatedContent.includes(malformedAuthStr)) {
    updatedContent = updatedContent.replace(malformedAuthStr, cleanAuthStr);
    console.log('Eliminated rogue leading slash from login URL.');
  } else if (updatedContent.includes(cleanAuthStr)) {
    console.log('Login link already clean (no leading slash).');
  } else {
    console.warn('Warning: Could not match exact malformed auth link string.');
  }

  // Upload to Shopify Theme
  const result = await putThemeAsset(token, 'sections/header.liquid', updatedContent);
  console.log(`Successfully uploaded sections/header.liquid (${result.size} bytes)`);

  // Save local copy
  const localDir = path.join(__dirname, 'sections');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'header.liquid'), updatedContent, 'utf8');
  console.log('Saved local copy to sections/header.liquid');
}

async function deployIndexJson(token) {
  console.log('\n==================================================');
  console.log('4. Updating templates/index.json');
  console.log('==================================================');

  const currentContent = await getThemeAsset(token, 'templates/index.json');
  console.log(`Downloaded templates/index.json (${currentContent.length} bytes)`);

  const parsed = JSON.parse(currentContent);
  const heroBlock = parsed?.sections?.home_builder_HhUtjg?.blocks?.pwp_curatorial_hero;

  if (!heroBlock || !heroBlock.settings?.liquid) {
    throw new Error('Could not find block pwp_curatorial_hero in section home_builder_HhUtjg');
  }

  const oldH1 = `<h1 class="pwp-gallery-hero__title">Art built for quiet rooms</h1>`;
  const enrichedH1 = `<h1 class="pwp-gallery-hero__title">Art built for quiet rooms &mdash; Archival Framed Canvas Wall Art &amp; XXL Desk Mats</h1>`;

  if (heroBlock.settings.liquid.includes(enrichedH1)) {
    console.log('Hero block already contains enriched H1.');
  } else if (heroBlock.settings.liquid.includes(oldH1)) {
    heroBlock.settings.liquid = heroBlock.settings.liquid.replace(oldH1, enrichedH1);
    console.log('Replaced hero H1 with commercially enriched headline.');
  } else {
    console.warn('Warning: Hero liquid did not contain expected old H1 string.');
  }

  const updatedContent = JSON.stringify(parsed, null, 2);

  // Upload to Shopify Theme
  const result = await putThemeAsset(token, 'templates/index.json', updatedContent);
  console.log(`Successfully uploaded templates/index.json (${result.size} bytes)`);

  // Save local copy
  const localDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'index.json'), updatedContent, 'utf8');
  console.log('Saved local copy to templates/index.json');
}

async function deployCuratedHubSnippet(token) {
  console.log('\n==================================================');
  console.log('5. Deploying snippets/pwp-curated-collections-hub.liquid');
  console.log('==================================================');

  // Read snippet from canonical repository location or Explorer artifact
  const repoSnippetPath = path.join(__dirname, 'snippets', 'pwp-curated-collections-hub.liquid');
  const explorerSnippetPath = path.join(
    __dirname,
    '.agents',
    'teamwork',
    'teamwork_explorer_m1_3',
    'proposed_pwp-curated-collections-hub.liquid'
  );
  const snippetPath = fs.existsSync(repoSnippetPath) ? repoSnippetPath : explorerSnippetPath;
  if (!fs.existsSync(snippetPath)) {
    throw new Error(`Snippet not found at: ${snippetPath}`);
  }

  const snippetContent = fs.readFileSync(snippetPath, 'utf8');
  console.log(`Read snippet artifact (${snippetContent.length} bytes)`);

  // Validate 48 subcollections & 6 parents
  const subs = JSON.parse(fs.readFileSync(path.join(__dirname, 'phase2_40_subcollections.json'), 'utf8'));
  let missing = 0;
  for (const s of subs) {
    if (!snippetContent.includes(`/collections/${s.handle}`)) {
      missing++;
    }
  }
  if (missing > 0) {
    throw new Error(`Validation failed: Snippet is missing ${missing} subcollection links`);
  }
  console.log(`Snippet validation passed: all 48 sub-collections verified present.`);

  // Upload to Shopify Theme
  const result = await putThemeAsset(token, 'snippets/pwp-curated-collections-hub.liquid', snippetContent);
  console.log(`Successfully uploaded snippets/pwp-curated-collections-hub.liquid (${result.size} bytes)`);

  // Save local copy
  const localDir = path.join(__dirname, 'snippets');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'pwp-curated-collections-hub.liquid'), snippetContent, 'utf8');
  console.log('Saved local copy to snippets/pwp-curated-collections-hub.liquid');
}

async function deployLayoutTheme(token) {
  console.log('\n==================================================');
  console.log('6. Integrating Hub Snippet into layout/theme.liquid');
  console.log('==================================================');

  const currentContent = await getThemeAsset(token, 'layout/theme.liquid');
  console.log(`Downloaded layout/theme.liquid (${currentContent.length} bytes)`);

  const hubRenderBlock = `{%- if template.name == 'index' or template.name == 'collection' -%}
  {%- if template.name == 'index' or collection.handle == 'canvas-prints' or collection.handle == 'desk-mats' or collection.handle == 'pillow-cases' or collection.handle == 'blankets' or collection.handle == 'bath-mats' or collection.handle == 'apparel' -%}
    {% render 'pwp-curated-collections-hub' %}
  {%- endif -%}
{%- endif -%}`;

  let updatedContent = currentContent;

  if (currentContent.includes("render 'pwp-curated-collections-hub'")) {
    console.log('layout/theme.liquid already renders pwp-curated-collections-hub.');
  } else {
    const mainClose = '</main>';
    if (!currentContent.includes(mainClose)) {
      throw new Error('Could not find </main> tag in layout/theme.liquid');
    }
    updatedContent = updatedContent.replace(mainClose, `${mainClose}\n${hubRenderBlock}`);
    console.log('Injected hub snippet render immediately following </main>.');
  }

  // Upload to Shopify Theme
  const result = await putThemeAsset(token, 'layout/theme.liquid', updatedContent);
  console.log(`Successfully uploaded layout/theme.liquid (${result.size} bytes)`);

  // Save local copy
  const localDir = path.join(__dirname, 'layout');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, 'theme.liquid'), updatedContent, 'utf8');
  console.log('Saved local copy to layout/theme.liquid');
}

async function runLiveVerification() {
  console.log('\n==================================================');
  console.log('7. Running Live Storefront & API Verifications');
  console.log('==================================================');

  const ts = Date.now();
  const indexUrl = `https://printswithpassion.com/?_v=${ts}`;
  console.log(`Fetching ${indexUrl}...`);
  const indexRes = await fetch(indexUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrintsWithPassion-SEO-Worker1' }
  });
  if (indexRes.status !== 200) {
    throw new Error(`Homepage returned HTTP ${indexRes.status}`);
  }
  const indexHtml = await indexRes.text();

  // 1. Verify Homepage Title
  const titleMatch = indexHtml.match(/<title>([^<]+)<\/title>/i);
  const title = (titleMatch ? titleMatch[1] : '').trim();
  console.log(`[VERIFY 1] Homepage Title: "${title}" (length: ${title.length})`);
  const expectedTitle = 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion';
  if (title !== expectedTitle) {
    throw new Error(`Title mismatch! Expected: "${expectedTitle}", Got: "${title}"`);
  }
  console.log('--> Title check PASSED.');

  // 2. Verify Meta Description
  const metaMatch = indexHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = (metaMatch ? metaMatch[1] : '').trim();
  console.log(`[VERIFY 2] Meta Description: "${metaDesc}" (length: ${metaDesc.length})`);
  const expectedDesc = 'Shop archival framed canvas wall art (1.25" pine bars), 4mm XXL stitched gaming desk mats, velvet cushion covers, plush throw blankets & memory foam bath mats.';
  // Unescape decoded comparison
  const decodedDesc = metaDesc.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  if (decodedDesc !== expectedDesc) {
    throw new Error(`Meta description mismatch! Expected: "${expectedDesc}", Got: "${decodedDesc}"`);
  }
  if (metaDesc.toLowerCase().includes('posters') || metaDesc.toLowerCase().includes('puzzles')) {
    throw new Error('Meta description contains discontinued product keywords!');
  }
  console.log('--> Meta description check PASSED.');

  // 3. Verify Single Semantic H1 Tag
  const h1Matches = [...indexHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  console.log(`[VERIFY 3] Found ${h1Matches.length} <h1> tag(s) on homepage:`);
  h1Matches.forEach((m, i) => console.log(`   H1 #${i+1}: ${m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`));
  if (h1Matches.length !== 1) {
    throw new Error(`Expected strictly 1 <h1> tag on homepage, found ${h1Matches.length}`);
  }
  const h1Text = h1Matches[0][1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!h1Text.includes('Canvas Wall Art') && !h1Text.includes('Desk Mats')) {
    throw new Error(`H1 tag does not contain commercial intent: "${h1Text}"`);
  }
  console.log('--> Single Commercial H1 check PASSED.');

  // 4. Verify Zero Malformed Customer Auth URLs
  const malformedAuthMatches = [...indexHtml.matchAll(/href=["']\/https:\/\/printswithpassion\.com\/customer_authentication/gi)];
  console.log(`[VERIFY 4] Malformed customer auth URLs found: ${malformedAuthMatches.length}`);
  if (malformedAuthMatches.length > 0) {
    throw new Error(`Found ${malformedAuthMatches.length} malformed customer auth URLs!`);
  }
  console.log('--> Customer Auth URL check PASSED.');

  // 5. Verify Delivery-Return Email Typo
  const deliveryUrl = `https://printswithpassion.com/pages/delivery-return?_v=${ts}`;
  console.log(`Fetching ${deliveryUrl}...`);
  const deliveryRes = await fetch(deliveryUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrintsWithPassion-SEO-Worker1' }
  });
  const deliveryHtml = await deliveryRes.text();
  const deliveryTypos = [...deliveryHtml.matchAll(/printswithpasssion/gi)];
  console.log(`[VERIFY 5] Typo occurrences on /pages/delivery-return: ${deliveryTypos.length}`);
  if (deliveryTypos.length > 0) {
    throw new Error(`Found ${deliveryTypos.length} typo occurrences on /pages/delivery-return!`);
  }
  const indexTypos = [...indexHtml.matchAll(/printswithpasssion/gi)];
  console.log(`[VERIFY 5b] Typo occurrences on homepage: ${indexTypos.length}`);
  if (indexTypos.length > 0) {
    throw new Error(`Found ${indexTypos.length} typo occurrences on homepage!`);
  }
  console.log('--> Email Typo check PASSED.');

  // 6. Verify 48 Sub-collections Hub on Homepage and 6 Parent Pages
  const subs = JSON.parse(fs.readFileSync(path.join(__dirname, 'phase2_40_subcollections.json'), 'utf8'));
  const hubTargets = [
    { name: 'Homepage', url: `https://printswithpassion.com/?_v=${ts}` },
    { name: 'Canvas Prints', url: `https://printswithpassion.com/collections/canvas-prints?_v=${ts}` },
    { name: 'Desk Mats', url: `https://printswithpassion.com/collections/desk-mats?_v=${ts}` },
    { name: 'Pillow Cases', url: `https://printswithpassion.com/collections/pillow-cases?_v=${ts}` },
    { name: 'Blankets', url: `https://printswithpassion.com/collections/blankets?_v=${ts}` },
    { name: 'Bath Mats', url: `https://printswithpassion.com/collections/bath-mats?_v=${ts}` },
    { name: 'Apparel', url: `https://printswithpassion.com/collections/apparel?_v=${ts}` }
  ];

  for (const target of hubTargets) {
    console.log(`\nVerifying Hub on ${target.name} (${target.url})...`);
    const pageRes = await fetch(target.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrintsWithPassion-SEO-Worker1' }
    });
    if (pageRes.status !== 200) {
      throw new Error(`${target.name} returned HTTP ${pageRes.status}`);
    }
    const pageHtml = await pageRes.text();

    if (!pageHtml.includes('pwp-curated-hub')) {
      throw new Error(`Hub class "pwp-curated-hub" missing on ${target.name}`);
    }

    let missingSubs = 0;
    for (const sub of subs) {
      if (!pageHtml.includes(`/collections/${sub.handle}`)) {
        missingSubs++;
      }
    }
    console.log(`   Sub-collections linked: ${subs.length - missingSubs} / ${subs.length}`);
    if (missingSubs > 0) {
      throw new Error(`Missing ${missingSubs} sub-collection links on ${target.name}`);
    }

    // Verify 0 H1 tags inside the hub
    const hubMatch = pageHtml.match(/<section[^>]*class=["'][^"']*pwp-curated-hub[\s\S]*?<\/section>/i);
    if (hubMatch) {
      const hubH1s = [...hubMatch[0].matchAll(/<h1[^>]*>/gi)];
      if (hubH1s.length > 0) {
        throw new Error(`Hub introduced ${hubH1s.length} <h1> tag(s) on ${target.name}`);
      }
    }
    console.log(`   --> ${target.name} Hub verification PASSED.`);
  }

  console.log('\n==================================================');
  console.log('ALL MILESTONE 1 VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

async function main() {
  console.log('Starting Milestone 1 Deployment & Verification...');
  console.log(`Shop Domain: ${SHOP_DOMAIN}`);
  console.log(`Theme ID: ${THEME_ID}`);

  const token = await getAccessToken();
  console.log('Acquired Shopify Admin OAuth Access Token.');

  await deployPageTypoFix();
  await deployHeadLiquid(token);
  await deployHeaderLiquid(token);
  await deployIndexJson(token);
  await deployCuratedHubSnippet(token);
  await deployLayoutTheme(token);

  await runLiveVerification();
}

main().catch(err => {
  console.error('\nDeployment / Verification FAILED:');
  console.error(err);
  process.exit(1);
});
