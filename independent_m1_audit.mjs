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

async function runComprehensiveAudit() {
  console.log('================================================================');
  console.log('REVIEWER 1 INDEPENDENT COMPREHENSIVE AUDIT — MILESTONE 1');
  console.log('================================================================');

  const ts = Date.now();
  const token = await getAccessToken();

  // -------------------------------------------------------------------------
  // 1. Shopify Admin API Asset Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 1. SHOPIFY ADMIN API THEME ASSET VERIFICATION ---');
  
  // 1.1 Page 703779766645
  const pageQuery = `query {
    page(id: "gid://shopify/Page/703779766645") {
      id
      title
      handle
      body
      updatedAt
    }
  }`;
  const pageRes = await shopifyGraphQL(pageQuery);
  const pageBody = pageRes?.page?.body || '';
  const pageTypos = (pageBody.match(/printswithpasssion/gi) || []).length;
  const pageCorrect = (pageBody.match(/printswithpassionbc@gmail\.com/gi) || []).length;
  console.log(`Page 703779766645 updatedAt: ${pageRes?.page?.updatedAt}`);
  console.log(`Page typos in Admin GraphQL: ${pageTypos} (Expected: 0)`);
  console.log(`Page correct emails in Admin GraphQL: ${pageCorrect} (Expected: >= 2)`);

  // 1.2 snippets/head.liquid
  const remoteHead = await getThemeAsset(token, 'snippets/head.liquid');
  const hasHeadTitle = remoteHead.includes('<title>Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion</title>');
  const hasHeadDesc = remoteHead.includes('Shop archival framed canvas wall art (1.25&quot; pine bars)');
  console.log(`Theme Asset snippets/head.liquid title override present: ${hasHeadTitle}`);
  console.log(`Theme Asset snippets/head.liquid meta description override present: ${hasHeadDesc}`);

  // 1.3 sections/header.liquid
  const remoteHeader = await getThemeAsset(token, 'sections/header.liquid');
  const hasLogoDiv = remoteHeader.includes("assign main_logo_tag = 'div'");
  const hasCleanAuth = remoteHeader.includes('href="{%- if customer -%}{{ routes.account_url }}{%- else -%}{{ routes.account_login_url }}{%- endif -%}"');
  const hasRogueSlash = remoteHeader.includes('href="/{%- if customer -%}{{ routes.account_url }}{%- else -%}{{ routes.account_login_url }}{%- endif -%}"');
  console.log(`Theme Asset sections/header.liquid logo assigned to div: ${hasLogoDiv}`);
  console.log(`Theme Asset sections/header.liquid clean auth link: ${hasCleanAuth}`);
  console.log(`Theme Asset sections/header.liquid rogue slash present: ${hasRogueSlash} (Expected: false)`);

  // 1.4 templates/index.json
  const remoteIndexJson = await getThemeAsset(token, 'templates/index.json');
  const parsedIndex = JSON.parse(remoteIndexJson);
  const heroLiquid = parsedIndex?.sections?.home_builder_HhUtjg?.blocks?.pwp_curatorial_hero?.settings?.liquid || '';
  const hasEnrichedHero = heroLiquid.includes('Art built for quiet rooms &mdash; Archival Framed Canvas Wall Art &amp; XXL Desk Mats');
  console.log(`Theme Asset templates/index.json enriched hero H1: ${hasEnrichedHero}`);

  // 1.5 snippets/pwp-curated-collections-hub.liquid
  const remoteHub = await getThemeAsset(token, 'snippets/pwp-curated-collections-hub.liquid');
  console.log(`Theme Asset snippets/pwp-curated-collections-hub.liquid length: ${remoteHub.length} bytes`);
  const hubH1s = (remoteHub.match(/<h1[^>]*>/gi) || []).length;
  console.log(`Theme Asset hub snippet H1 count: ${hubH1s} (Expected: 0)`);

  // 1.6 layout/theme.liquid
  const remoteLayout = await getThemeAsset(token, 'layout/theme.liquid');
  const hasHubRender = remoteLayout.includes("{% render 'pwp-curated-collections-hub' %}");
  console.log(`Theme Asset layout/theme.liquid renders hub snippet: ${hasHubRender}`);

  // -------------------------------------------------------------------------
  // 2. Live Storefront HTTP Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 2. LIVE STOREFRONT VERIFICATION (https://printswithpassion.com/) ---');

  const homeRes = await fetch(`https://printswithpassion.com/?_audit=${ts}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReviewerAuditBot/1.0' }
  });
  console.log(`Live Homepage HTTP Status: ${homeRes.status}`);
  const homeHtml = await homeRes.text();

  // Title analysis
  const titleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1] : '';
  console.log(`Live Title: "${rawTitle}"`);
  console.log(`Live Title character length: ${rawTitle.length}`);

  // Meta description analysis
  const metaRegex = /<meta[^>]+(?:name=["']description["'][^>]*|content=[^>]*name=["']description["'][^>]*)/i;
  const rawMetaTag = (homeHtml.match(metaRegex) || [''])[0];
  console.log(`Live Meta tag: ${rawMetaTag}`);
  const contentMatch = rawMetaTag.match(/content=["']([^"']*)["']/i);
  const rawContent = contentMatch ? contentMatch[1] : '';
  console.log(`Live Meta description content: "${rawContent}"`);
  console.log(`Live Meta description raw length: ${rawContent.length}`);
  const decodedContent = rawContent.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  console.log(`Live Meta description decoded length: ${decodedContent.length}`);
  console.log(`Contains raw &quot;: ${rawContent.includes('&quot;')}`);
  console.log(`Contains double-escaped &amp;quot;: ${rawContent.includes('&amp;quot;')}`);

  // H1 analysis
  const h1Matches = [...homeHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  console.log(`Live Homepage H1 count: ${h1Matches.length}`);
  h1Matches.forEach((m, i) => console.log(`   H1 #${i+1}: ${m[0].replace(/\s+/g, ' ')}`));

  // Logo tag analysis on homepage
  const logoDivMatch = homeHtml.match(/<div class="logo pwp-gallery-logo-wrap/i);
  const logoH1Match = homeHtml.match(/<h1 class="logo pwp-gallery-logo-wrap/i);
  console.log(`Live Logo tag is <div>: ${!!logoDivMatch}`);
  console.log(`Live Logo tag is <h1>: ${!!logoH1Match}`);

  // Customer auth URL analysis
  const malformedAuthMatches = [...homeHtml.matchAll(/href=["']\/https:\/\/printswithpassion\.com\/customer_authentication/gi)];
  console.log(`Live Malformed auth link count: ${malformedAuthMatches.length}`);

  // Typo check on Homepage
  const homeTypoMatches = [...homeHtml.matchAll(/printswithpasssion/gi)];
  console.log(`Live Homepage email typo count: ${homeTypoMatches.length}`);

  // -------------------------------------------------------------------------
  // 3. Live /pages/delivery-return Verification
  // -------------------------------------------------------------------------
  console.log('\n--- 3. LIVE /pages/delivery-return VERIFICATION ---');
  const delivRes = await fetch(`https://printswithpassion.com/pages/delivery-return?_audit=${ts}`);
  console.log(`Live /pages/delivery-return HTTP Status: ${delivRes.status}`);
  const delivHtml = await delivRes.text();
  const delivTypoMatches = [...delivHtml.matchAll(/printswithpasssion/gi)];
  const delivCorrectMatches = [...delivHtml.matchAll(/printswithpassionbc@gmail\.com/gi)];
  console.log(`Live /pages/delivery-return typo count: ${delivTypoMatches.length}`);
  console.log(`Live /pages/delivery-return correct email occurrences: ${delivCorrectMatches.length}`);

  // -------------------------------------------------------------------------
  // 4. Live Curated Hub Directory Verification (Homepage + 6 Parents)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. LIVE CURATED HUB DIRECTORY VERIFICATION ---');
  const subs = JSON.parse(fs.readFileSync(path.join(__dirname, 'phase2_40_subcollections.json'), 'utf8'));
  console.log(`Loaded ${subs.length} smart sub-collections from catalog schema.`);

  const targets = [
    { name: 'Homepage', url: `https://printswithpassion.com/?_audit=${ts}` },
    { name: 'Canvas Prints', url: `https://printswithpassion.com/collections/canvas-prints?_audit=${ts}` },
    { name: 'Desk Mats', url: `https://printswithpassion.com/collections/desk-mats?_audit=${ts}` },
    { name: 'Pillow Cases', url: `https://printswithpassion.com/collections/pillow-cases?_audit=${ts}` },
    { name: 'Blankets', url: `https://printswithpassion.com/collections/blankets?_audit=${ts}` },
    { name: 'Bath Mats', url: `https://printswithpassion.com/collections/bath-mats?_audit=${ts}` },
    { name: 'Apparel', url: `https://printswithpassion.com/collections/apparel?_audit=${ts}` }
  ];

  for (const t of targets) {
    const res = await fetch(t.url);
    const html = await res.text();
    const hasHub = html.includes('pwp-curated-hub');
    let missingSubs = [];
    for (const s of subs) {
      if (!html.includes(`/collections/${s.handle}`)) {
        missingSubs.push(s.handle);
      }
    }
    const hubH1 = [...(html.match(/<section[^>]*class=["'][^"']*pwp-curated-hub[\s\S]*?<\/section>/i)?.[0] || '').matchAll(/<h1[^>]*>/gi)];
    console.log(`${t.name} (${t.url}):`);
    console.log(`   Hub present: ${hasHub}`);
    console.log(`   Sub-collections present: ${subs.length - missingSubs.length} / ${subs.length}`);
    if (missingSubs.length > 0) {
      console.log(`   MISSING sub-collections:`, missingSubs);
    }
    console.log(`   H1 tags inside hub: ${hubH1.length}`);
  }

  // -------------------------------------------------------------------------
  // 5. Negative Verification (Pages where hub should NOT appear)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. NEGATIVE VERIFICATION (Hub Absent on Non-Parent Pages) ---');
  const negativeTargets = [
    { name: 'Sub-collection 1 (Anime Desk Mats)', url: `https://printswithpassion.com/collections/japanese-anime-desk-mats?_audit=${ts}` },
    { name: 'Sub-collection 2 (Mountain Canvas)', url: `https://printswithpassion.com/collections/nature-mountain-landscape-canvas-wall-art?_audit=${ts}` },
    { name: 'Static Page (Delivery Return)', url: `https://printswithpassion.com/pages/delivery-return?_audit=${ts}` },
    { name: 'Blog Article', url: `https://printswithpassion.com/blogs/news/uk-desk-mat-sizing-guide-60x35-vs-80x40-xxl?_audit=${ts}` }
  ];

  for (const nt of negativeTargets) {
    const res = await fetch(nt.url);
    const html = await res.text();
    const hasHub = html.includes('pwp-curated-hub');
    console.log(`${nt.name}: Hub present: ${hasHub} (Expected: false)`);
  }
}

runComprehensiveAudit().catch(console.error);
