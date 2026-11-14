import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchAllAdminCollections() {
  const collections = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query getCollectionsPage($cursor: String) {
        collections(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            title
            productsCount { count }
            seo {
              title
              description
            }
            resourcePublications(first: 10) {
              nodes {
                isPublished
                publication {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `;

    const res = await shopifyGraphQL(query, { cursor });
    const colData = res?.collections;
    if (!colData) {
      console.error('Failed to get collections page. Response was:', res);
      break;
    }

    collections.push(...colData.nodes);
    hasNextPage = colData.pageInfo.hasNextPage;
    cursor = colData.pageInfo.endCursor;
  }

  return collections;
}

async function fetchSitemapCollections() {
  const sitemapUrl = 'https://printswithpassion.com/sitemap_collections_1.xml?from=437768978743&to=730430275957';
  const res = await fetch(sitemapUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!res.ok) {
    throw new Error(`Sitemap fetch returned HTTP ${res.status}`);
  }
  const xml = await res.text();
  const locMatches = [...xml.matchAll(/<loc>https:\/\/printswithpassion\.com\/collections\/([^<]+)<\/loc>/g)];
  return locMatches.map(m => m[1]);
}

async function run() {
  console.log('1. Fetching all collections from Shopify Admin...');
  const adminCollections = await fetchAllAdminCollections();
  console.log(`Fetched ${adminCollections.length} total collections from Admin API.`);

  console.log('2. Fetching sitemap_collections_1.xml...');
  const sitemapHandles = await fetchSitemapCollections();
  console.log(`Fetched ${sitemapHandles.length} collection handles from sitemap.`);
  const sitemapSet = new Set(sitemapHandles);

  const TEMPLATE_PHRASES = [
    'Transform with',
    'Elevate with',
    'Style with',
    'Refresh with',
    'Upgrade with',
    'Wear with',
    'Eliminate blank-wall echo'
  ];

  const processed = adminCollections.map((col, index) => {
    const handle = col.handle;
    const gid = col.id;
    const title = col.title;
    const productsCount = col.productsCount?.count ?? 0;
    const inSitemap = sitemapSet.has(handle);

    // Online Store publication status
    const pubNodes = col.resourcePublications?.nodes || [];
    const onlineStorePub = pubNodes.find(p => p.publication?.name === 'Online Store');
    const isPublishedOnlineStore = onlineStorePub ? onlineStorePub.isPublished : false;

    // SEO Title
    const seoTitle = col.seo?.title ?? null;
    const seoTitleLen = seoTitle ? seoTitle.length : 0;
    const hasCustomTitle = seoTitle !== null && seoTitle.trim() !== '';
    const titleExceeds60 = seoTitleLen > 60;

    // SEO Description
    const seoDesc = col.seo?.description ?? null;
    const seoDescLen = seoDesc ? seoDesc.length : 0;
    const hasCustomDesc = seoDesc !== null && seoDesc.trim() !== '';
    const descOutOfBounds = hasCustomDesc ? (seoDescLen < 140 || seoDescLen > 158) : true;

    // Entity & Template flaws
    const hasDoubleQuote = seoDesc ? (seoDesc.includes('&quot;') || seoDesc.includes('&amp;quot;')) : false;
    const hasLiteralQuote = seoDesc ? seoDesc.includes('"') : false;
    const hasDoubleAmp = seoDesc ? seoDesc.includes('&amp;') : false;
    const matchedTemplates = TEMPLATE_PHRASES.filter(tp => seoDesc && seoDesc.includes(tp));

    // Special Flags
    const isJapaneseAnimeDeskMats = handle === 'japanese-anime-desk-mats';
    const isBauhausCanvasWallArt = handle === 'abstract-minimalist-bauhaus-canvas-wall-art';
    const isAvadaUpsell = handle === 'avada-upsell-best-sellers';
    const isFrontpage = handle === 'frontpage';

    let specialNotes = [];
    if (isJapaneseAnimeDeskMats) {
      specialNotes.push('FLAG: Japanese Anime Desk Mats — R3 target (fix single-product title overwrite)');
    }
    if (isBauhausCanvasWallArt) {
      specialNotes.push('FLAG: Abstract Minimalist Bauhaus Canvas Wall Art — R3 target (fix mid-word truncation)');
    }
    if (isAvadaUpsell) {
      specialNotes.push('FLAG: AVADA Upsell Best Sellers — M2 unpublished target');
    }
    if (isFrontpage) {
      specialNotes.push('FLAG: Frontpage — core system collection, 0 products');
    }

    return {
      index: index + 1,
      handle,
      id: gid,
      title,
      productsCount,
      isPublishedOnlineStore,
      inSitemap,
      seoTitle,
      seoTitleLen,
      hasCustomTitle,
      titleExceeds60,
      seoDesc,
      seoDescLen,
      hasCustomDesc,
      descOutOfBounds,
      hasDoubleQuote,
      hasLiteralQuote,
      hasDoubleAmp,
      matchedTemplates,
      isJapaneseAnimeDeskMats,
      isBauhausCanvasWallArt,
      isAvadaUpsell,
      isFrontpage,
      specialNotes
    };
  });

  // Write full audit JSON
  const auditJsonPath = path.join(__dirname, 'live_collections_seo_audit.json');
  fs.writeFileSync(auditJsonPath, JSON.stringify(processed, null, 2), 'utf8');
  console.log(`Saved audit JSON to: ${auditJsonPath}`);

  // Summary Metrics
  console.log('\n======================================================');
  console.log('AUDIT SUMMARY METRICS');
  console.log('======================================================');
  console.log(`Total Admin Collections: ${processed.length}`);
  console.log(`Published on Online Store: ${processed.filter(c => c.isPublishedOnlineStore).length}`);
  console.log(`Present in sitemap_collections_1.xml: ${processed.filter(c => c.inSitemap).length}`);

  const notInSitemap = processed.filter(c => !c.inSitemap);
  console.log(`Collections in Admin but NOT in sitemap (${notInSitemap.length}):`);
  notInSitemap.forEach(c => console.log(` - ${c.handle} (id: ${c.id}, products: ${c.productsCount}, published: ${c.isPublishedOnlineStore})`));

  console.log('\n--- Title Metrics (All 73 Collections) ---');
  console.log(`Missing custom seo.title (null/empty): ${processed.filter(c => !c.hasCustomTitle).length}`);
  console.log(`seo.title > 60 chars: ${processed.filter(c => c.titleExceeds60).length}`);
  console.log(`seo.title <= 60 chars (populated): ${processed.filter(c => c.hasCustomTitle && !c.titleExceeds60).length}`);

  console.log('\n--- Description Metrics (All 73 Collections) ---');
  console.log(`Missing custom seo.description: ${processed.filter(c => !c.hasCustomDesc).length}`);
  console.log(`seo.description length out of bounds (<140 or >158): ${processed.filter(c => c.descOutOfBounds).length}`);
  console.log(`seo.description with &quot; or &amp;quot;: ${processed.filter(c => c.hasDoubleQuote).length}`);
  console.log(`seo.description with unescaped literal quotes ("): ${processed.filter(c => c.hasLiteralQuote).length}`);
  console.log(`seo.description with &amp;: ${processed.filter(c => c.hasDoubleAmp).length}`);
  console.log(`seo.description with template phrases: ${processed.filter(c => c.matchedTemplates.length > 0).length}`);

  console.log('\n--- Target Special Collections ---');
  const anime = processed.find(c => c.isJapaneseAnimeDeskMats);
  console.log('Japanese Anime Desk Mats:', JSON.stringify(anime, null, 2));

  const bauhaus = processed.find(c => c.isBauhausCanvasWallArt);
  console.log('Bauhaus Canvas Wall Art:', JSON.stringify(bauhaus, null, 2));
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
