/**
 * Milestone 4 Iteration 2 Production Remediation Script
 *
 * 1. Updates descriptions in Shopify Admin for:
 *    - 7 Static Pages (from remediated_16_descriptions.json)
 *    - 3 Static Pages with entity cleanings: contact-us, size-guide, desk-size-visualizer
 *    - 9 Blog Articles (from remediated_16_descriptions.json)
 *    - 1 Blog Article with entity cleaning: ikea-karlby-alex-drawer-gaming-desk-setup-mat-guide-uk
 * 2. Updates footer menu in Shopify Admin (gid://shopify/Menu/221177086263):
 *    - Appends /pages/abstract-geometric-minimalist-wall-art-decor-uk
 * 3. Updates theme snippet snippets/pwp-clean-footer-nav.liquid:
 *    - Ensures all 4 unindexed pages (about-us, abstract-geometric, studio-lookbook, data-sharing-opt-out) are linked
 * 4. Synchronizes local spec files:
 *    - .agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json
 *    - .agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL, SHOP_DOMAIN, LOCAL_TOKEN_PATH } from './lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THEME_ID = '177936466293';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset?.value || null;
}

async function putThemeAsset(token, key, value) {
  const url = `https://${SHOP_DOMAIN}/admin/api/2025-01/themes/${THEME_ID}/assets.json`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ asset: { key, value } })
  });
  if (!res.ok) throw new Error(`Failed to put asset ${key}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.asset;
}

async function callGql(query, variables = {}, retries = 5) {
  for (let i = 1; i <= retries; i++) {
    try {
      await sleep(250);
      const res = await shopifyGraphQL(query, variables);
      if (res && Object.keys(res).length > 0) return res;
      if (i < retries) await sleep(1000 * i);
    } catch (err) {
      if (i === retries) throw err;
      await sleep(1500 * i);
    }
  }
  throw new Error('GQL query timed out');
}

// -------------------------------------------------------------------------
// Metadata to update
// -------------------------------------------------------------------------
const PAGE_UPDATES = [
  {
    handle: 'japanese-ukiyo-e-anime-desk-mats-wall-art-uk',
    id: 'gid://shopify/Page/703807062389',
    description: 'UK styling guide for Japanese anime, Great Wave ukiyo-e and samurai XXL desk mats and canvas prints: premium archival craft with free tracked UK shipping.'
  },
  {
    handle: 'space-cosmic-nebula-desk-mats-wall-art-uk',
    id: 'gid://shopify/Page/703807095157',
    description: 'UK astronomy guide for deep space, cosmic nebula and celestial desk mats and canvas prints: high-resolution astrophotography with free tracked UK shipping.'
  },
  {
    handle: 'botanical-floral-nature-wall-art-cushions-uk',
    id: 'gid://shopify/Page/703807160693',
    description: 'UK interior guide for botanical, forest landscape and floral canvas prints, velvet cushions and bath mats: biophilic styling with free tracked UK shipping.'
  },
  {
    handle: 'abstract-geometric-minimalist-wall-art-decor-uk',
    id: 'gid://shopify/Page/703807226229',
    description: 'UK styling guide for abstract geometry, Bauhaus minimalist line art canvas prints and XXL desk mats: contemporary modern decor with free tracked UK shipping.'
  },
  {
    handle: 'retro-vintage-pop-art-wall-art-desk-mats-uk',
    id: 'gid://shopify/Page/703807258997',
    description: 'UK guide to vintage 80s vaporwave, arcade and pop art desk mats and stretched canvas prints: nostalgic retro gaming workspaces with free tracked UK shipping.'
  },
  {
    handle: 'matching-home-office-desk-mat-and-canvas-sets-uk',
    id: 'gid://shopify/Page/703807324533',
    description: 'UK workspace guide for pairing 80x40cm XXL desk mats with matching 24x16 inch stretched canvas prints: cohesive office setups with free tracked UK shipping.'
  },
  {
    handle: 'trade-and-bulk-orders',
    id: 'gid://shopify/Page/703875252597',
    description: 'B2B trade program for interior stagers, corporate workspaces, boutique hotels and esports lounges: volume discounts up to 35% with free tracked UK shipping.'
  },
  {
    handle: 'contact-us',
    id: 'gid://shopify/Page/131838509367',
    description: 'Contact Prints With Passion UK customer care team for order inquiries, bespoke sizing and delivery tracking. Free tracked UK delivery on all art and decor.'
  },
  {
    handle: 'size-guide',
    id: 'gid://shopify/Page/138744529207',
    description: 'Complete UK and US size guide for framed canvas prints, XXL desk mats, cushion covers, throw blankets and bath mats in both metric (cm) and imperial (inches).'
  },
  {
    handle: 'desk-size-visualizer',
    id: 'gid://shopify/Page/703875154293',
    description: 'Interactive visualizer: preview 60×35cm, 80×40cm and 90×40cm XXL desk mats, mechanical keyboards and framed canvas prints across popular UK workspace setups.'
  }
];

const ARTICLE_UPDATES = [
  {
    handle: 'uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared',
    id: 'gid://shopify/Article/1016174772597',
    description: 'Compare 60x35 cm XL and 80x40 cm XXL extended desk mats for UK setups. Explore exact desk dimensions, keyboard clearance, mouse glide and free UK shipping.'
  },
  {
    handle: 'best-gifts-for-gamers-remote-workers-homeowners-uk',
    id: 'gid://shopify/Article/1016185258357',
    description: 'Explore curated gifts for UK gamers, remote workers and new homeowners under £40 to £65. Choose archival canvas art and XXL desk mats with free UK shipping.'
  },
  {
    handle: 'dual-monitor-ultrawide-desk-setup-mat-sizing-uk',
    id: 'gid://shopify/Article/1016192991605',
    description: 'Plan the ideal dual monitor or ultrawide desk setup with XL and XXL desk mats. Discover balanced workstation layouts, cable clearance and free UK shipping.'
  },
  {
    handle: 'cable-management-rgb-routing-desk-mat-uk',
    id: 'gid://shopify/Article/1016205607285',
    description: 'Achieve a clean battlestation with our UK desk mat cable management and RGB routing guide. Conceal wires, protect desk surfaces and enjoy free UK shipping.'
  },
  {
    handle: 'ergonomic-wrist-rest-vs-flat-desk-mat-uk',
    id: 'gid://shopify/Article/1016207343989',
    description: 'Compare ergonomic wrist rests against flat extended desk mats to prevent wrist strain. Discover typing posture tips, 4mm cushioning and free UK shipping.'
  },
  {
    handle: 'gallery-wall-layout-canvas-art-sizing-uk-guide',
    id: 'gid://shopify/Article/1016218124661',
    description: 'Plan a striking living room gallery wall with our canvas art sizing guide. Master eye-level placement rules, frame spacing formulas and free UK shipping.'
  },
  {
    handle: 'cloth-vs-glass-desk-mat-mouse-sensor-tracking-uk',
    id: 'gid://shopify/Article/1016218648949',
    description: 'Compare optical mouse sensor tracking on micro-woven cloth vs glass desk mats. Learn DPI control differences, stopping power, glide and free UK shipping.'
  },
  {
    handle: 'spill-proof-water-resistant-desk-mat-care-uk',
    id: 'gid://shopify/Article/1016220385653',
    description: 'Care for spill-proof and water-resistant extended desk mats. Discover easy methods to clean coffee and drink spills without stains, plus free UK shipping.'
  },
  {
    handle: 'japanese-ukiyo-e-asian-art-zen-styling-guide',
    id: 'gid://shopify/Article/1016297718133',
    description: 'Curate a serene sanctuary with Japanese Ukiyo-e and Asian zen decor. Pair traditional woodblock canvas prints, calligraphy desk mats and free UK shipping.'
  },
  {
    handle: 'ikea-karlby-alex-drawer-gaming-desk-setup-mat-guide-uk',
    id: 'gid://shopify/Article/1016194891829',
    description: 'Build the ultimate IKEA Karlby and Alex drawer desk setup. Discover best-fit XXL desk mat proportions, clean cable routing tips and free tracked UK delivery.'
  }
];

async function updatePageDescriptions() {
  console.log('\n===============================================================');
  console.log(`1. UPDATING ${PAGE_UPDATES.length} STATIC PAGE DESCRIPTIONS IN SHOPIFY ADMIN`);
  console.log('===============================================================');

  const pageMutation = `
    mutation updatePageMetafield($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          handle
          updatedAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const pageSpecPath = path.join(__dirname, '.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json');
  const pageSpec = JSON.parse(fs.readFileSync(pageSpecPath, 'utf8'));

  for (const p of PAGE_UPDATES) {
    const specPage = pageSpec.pages.find((x) => x.handle === p.handle);
    const pageId = specPage?.page_id || p.id;
    console.log(`Updating page: ${p.handle} (${p.description.length}c) -> ${pageId}`);
    if (p.description.length < 145 || p.description.length > 158) {
      throw new Error(`Length violation on page ${p.handle}: ${p.description.length} chars`);
    }
    if (p.description.includes('&')) {
      throw new Error(`Ampersand violation on page ${p.handle}`);
    }

    const variables = {
      id: pageId,
      page: {
        metafields: [
          {
            namespace: 'global',
            key: 'description_tag',
            value: p.description,
            type: 'string'
          }
        ]
      }
    };

    const res = await callGql(pageMutation, variables);
    const errors = res?.pageUpdate?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(`pageUpdate failed on ${p.handle}: ${JSON.stringify(errors)}`);
    }
    console.log(`  ✓ Page ${p.handle} updated successfully.`);
  }
}

async function updateArticleDescriptions() {
  console.log('\n===============================================================');
  console.log(`2. UPDATING ${ARTICLE_UPDATES.length} BLOG ARTICLE DESCRIPTIONS IN SHOPIFY ADMIN`);
  console.log('===============================================================');

  const articleMutation = `
    mutation updateArticleMetafield($id: ID!, $article: ArticleUpdateInput!) {
      articleUpdate(id: $id, article: $article) {
        article {
          id
          handle
          updatedAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const articleSpecPath = path.join(__dirname, '.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json');
  const articleSpec = JSON.parse(fs.readFileSync(articleSpecPath, 'utf8'));

  for (const a of ARTICLE_UPDATES) {
    const specArt = articleSpec.articles.find((x) => x.handle === a.handle);
    const articleId = specArt?.id || a.id;
    console.log(`Updating article: ${a.handle} (${a.description.length}c) -> ${articleId}`);
    if (a.description.length < 145 || a.description.length > 158) {
      throw new Error(`Length violation on article ${a.handle}: ${a.description.length} chars`);
    }
    if (a.description.includes('&')) {
      throw new Error(`Ampersand violation on article ${a.handle}`);
    }

    const variables = {
      id: articleId,
      article: {
        metafields: [
          {
            namespace: 'global',
            key: 'description_tag',
            value: a.description,
            type: 'string'
          }
        ]
      }
    };

    const res = await callGql(articleMutation, variables);
    const errors = res?.articleUpdate?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(`articleUpdate failed on ${a.handle}: ${JSON.stringify(errors)}`);
    }
    console.log(`  ✓ Article ${a.handle} updated successfully.`);
  }
}

async function updateFooterMenu() {
  console.log('\n===============================================================');
  console.log('3. UPDATING FOOTER MENU IN SHOPIFY ADMIN');
  console.log('===============================================================');

  const menuId = 'gid://shopify/Menu/221177086263';
  const getRes = await callGql(`
    query getMenu {
      menu(id: "${menuId}") {
        id
        title
        handle
        items {
          id
          title
          type
          url
          resourceId
        }
      }
    }
  `);

  const menu = getRes?.menu;
  if (!menu) throw new Error(`Could not fetch menu ${menuId}`);

  console.log(`Current menu has ${menu.items.length} items.`);

  const preservedItems = menu.items.map((i) => ({
    id: i.id,
    title: i.title,
    type: i.type,
    url: i.url,
    resourceId: i.resourceId
  }));

  const existingUrls = new Set(preservedItems.map((i) => i.url));
  const newGuideUrl = '/pages/abstract-geometric-minimalist-wall-art-decor-uk';

  if (!existingUrls.has(newGuideUrl)) {
    preservedItems.push({
      title: 'Abstract Geometric Wall Art & Decor Guide',
      type: 'PAGE',
      url: newGuideUrl,
      resourceId: 'gid://shopify/Page/703807226229'
    });
    console.log(`Adding ${newGuideUrl} to footer menu items.`);

    const menuUpdateMutation = `
      mutation menuUpdate($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
        menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
          menu {
            id
            title
            handle
            items {
              id
              title
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const res = await callGql(menuUpdateMutation, {
      id: menu.id,
      title: menu.title,
      handle: menu.handle,
      items: preservedItems
    });

    const errors = res?.menuUpdate?.userErrors || [];
    if (errors.length > 0) {
      throw new Error(`menuUpdate failed: ${JSON.stringify(errors)}`);
    }
    console.log(`✓ Footer menu updated: now has ${res.menuUpdate.menu.items.length} items.`);
  } else {
    console.log(`Item ${newGuideUrl} already present in footer menu.`);
  }
}

async function updateThemeCleanFooterNav() {
  console.log('\n===============================================================');
  console.log('4. UPDATING snippets/pwp-clean-footer-nav.liquid ON ACTIVE THEME');
  console.log('===============================================================');

  const token = await getAccessToken();
  const currentAsset = await getThemeAsset(token, 'snippets/pwp-clean-footer-nav.liquid');
  if (!currentAsset) {
    throw new Error('Could not retrieve snippets/pwp-clean-footer-nav.liquid from theme');
  }

  // Ensure Column 4 includes both abstract guide and data-sharing-opt-out if not present
  let updatedAsset = currentAsset;

  const targetLink1 = '/pages/abstract-geometric-minimalist-wall-art-decor-uk';
  const targetLink2 = '/pages/data-sharing-opt-out';

  if (!updatedAsset.includes(targetLink1)) {
    console.log(`Adding ${targetLink1} to pwp-clean-footer-nav.liquid`);
    // Insert into Column 2 (Setup Guides & Sizing)
    const anchor = '<li><a href="/blogs/news/uk-desk-mat-size-guide-60x35-xl-vs-80x40-xxl-compared">';
    updatedAsset = updatedAsset.replace(
      anchor,
      `<li><a href="${targetLink1}">Abstract &amp; Geometric Decor Guide</a></li>\n          ` + anchor
    );
  }

  if (!updatedAsset.includes(targetLink2)) {
    console.log(`Adding ${targetLink2} to pwp-clean-footer-nav.liquid`);
    // Insert into Column 4 (Studio & Standards)
    const anchor = '<li><a href="/policies/terms-of-service">Terms of Service</a></li>';
    updatedAsset = updatedAsset.replace(
      anchor,
      `${anchor}\n          <li><a href="${targetLink2}">Your Privacy Choices</a></li>`
    );
  }

  if (updatedAsset !== currentAsset) {
    console.log('Uploading updated snippets/pwp-clean-footer-nav.liquid to theme 177936466293...');
    const result = await putThemeAsset(token, 'snippets/pwp-clean-footer-nav.liquid', updatedAsset);
    console.log(`✓ Successfully updated snippets/pwp-clean-footer-nav.liquid (size: ${result.size})`);

    // Also write locally to keep repository in sync
    fs.writeFileSync(path.join(__dirname, 'snippets/pwp-clean-footer-nav.liquid'), updatedAsset, 'utf8');
    console.log('✓ Wrote local snippets/pwp-clean-footer-nav.liquid');
  } else {
    console.log('snippets/pwp-clean-footer-nav.liquid already contains all required links.');
  }
}

function updateLocalSpecs() {
  console.log('\n===============================================================');
  console.log('5. SYNCHRONIZING LOCAL SPECIFICATION FILES');
  console.log('===============================================================');

  const pageSpecPath = path.join(__dirname, '.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json');
  const articleSpecPath = path.join(__dirname, '.agents/teamwork/teamwork_explorer_m4_2/article_remediation_spec.json');

  const pageSpec = JSON.parse(fs.readFileSync(pageSpecPath, 'utf8'));
  const articleSpec = JSON.parse(fs.readFileSync(articleSpecPath, 'utf8'));

  let pageUpdatesCount = 0;
  for (const u of PAGE_UPDATES) {
    const page = pageSpec.pages.find((p) => p.handle === u.handle);
    if (page) {
      page.proposed_seo_description = u.description;
      page.proposed_seo_description_length = u.description.length;
      const descMeta = page.metafields_to_set?.find((m) => m.key === 'description_tag');
      if (descMeta) descMeta.value = u.description;
      pageUpdatesCount++;
    }
  }

  let articleUpdatesCount = 0;
  for (const u of ARTICLE_UPDATES) {
    const art = articleSpec.articles.find((a) => a.handle === u.handle);
    if (art) {
      art.seoDescription = u.description;
      const descMeta = art.metafields_to_set?.find((m) => m.key === 'description_tag');
      if (descMeta) descMeta.value = u.description;
      articleUpdatesCount++;
    }
  }

  fs.writeFileSync(pageSpecPath, JSON.stringify(pageSpec, null, 2), 'utf8');
  fs.writeFileSync(articleSpecPath, JSON.stringify(articleSpec, null, 2), 'utf8');
  console.log(`✓ Synchronized ${pageUpdatesCount} pages in page_remediation_spec.json`);
  console.log(`✓ Synchronized ${articleUpdatesCount} articles in article_remediation_spec.json`);
}

async function main() {
  console.log('=== STARTING MILESTONE 4 ITERATION 2 REMEDIATION EXECUTION ===');
  await updatePageDescriptions();
  await updateArticleDescriptions();
  await updateFooterMenu();
  await updateThemeCleanFooterNav();
  updateLocalSpecs();
  console.log('\n=== ALL REMEDIATIONS EXECUTED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('\n[FATAL] Remediation execution failed:', err);
  process.exit(1);
});
