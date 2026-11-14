import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function fetchSitemap(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  return { xml, urls };
}

async function main() {
  console.log('Fetching sitemapindex from printswithpassion.com/sitemap.xml...');
  const index = await fetchSitemap('https://printswithpassion.com/sitemap.xml');
  console.log(`Found ${index.urls.length} sitemaps in index:`, index.urls);

  const collectionsUrl = index.urls.find(u => u.includes('sitemap_collections'));
  const pagesUrl = index.urls.find(u => u.includes('sitemap_pages'));
  const articlesUrl = index.urls.find(u => u.includes('sitemap_articles'));

  console.log(`Collections sitemap URL: ${collectionsUrl}`);
  console.log(`Pages sitemap URL: ${pagesUrl}`);
  console.log(`Articles sitemap URL: ${articlesUrl}`);

  const collectionsSitemap = await fetchSitemap(collectionsUrl);
  const pagesSitemap = await fetchSitemap(pagesUrl);
  const articlesSitemap = await fetchSitemap(articlesUrl);

  console.log(`Collections in sitemap_collections_1.xml: ${collectionsSitemap.urls.length}`);
  console.log(`Pages in sitemap_pages_1.xml: ${pagesSitemap.urls.length}`);
  console.log(`Articles in sitemap_articles_1.xml: ${articlesSitemap.urls.length}`);

  // Check avada-upsell-best-sellers in collections sitemap
  const avadaInSitemap = collectionsSitemap.urls.some(u => u.includes('avada-upsell-best-sellers'));
  console.log(`avada-upsell-best-sellers in sitemap_collections_1.xml: ${avadaInSitemap}`);

  // Check if any of the 28 discontinued collections are in sitemap
  const DISCONTINUED_HANDLES = [
    'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
    'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles',
    'shoes', 'hats', 'bottles', 'tote-bags', 'suitcases',
    'yoga-mats', 'makeup-bags', 'coasters', 'pet-mat', 'bottle-opener',
    'pet-bowls', 'bags', 'bags-1', 'pets-animals', 'can-cooler',
    'posters', 'rugs', 'mousepads'
  ];
  const discontinuedInSitemap = DISCONTINUED_HANDLES.filter(h => collectionsSitemap.urls.some(u => u.endsWith(`/collections/${h}`)));
  console.log(`Discontinued collections in sitemap: ${discontinuedInSitemap.length}`, discontinuedInSitemap);

  // Load all_collections.json and all_redirects.json
  const collections = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_collections.json'),
    'utf8'
  ));
  const redirects = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_redirects.json'),
    'utf8'
  ));

  // Check 15 %20 redirects
  console.log('\n=== ALL REDIRECTS WITH %20 ===');
  const percent20 = redirects.filter(r => r.target && r.target.includes('%20'));
  console.log(`Count: ${percent20.length}`);
  for (const r of percent20) {
    console.log(JSON.stringify(r));
  }

  // Check blog redirects vs active blog articles
  console.log('\n=== BLOG REDIRECTS VS ACTIVE BLOG ARTICLES ===');
  const activeArticlePaths = new Set(articlesSitemap.urls.map(u => new URL(u).pathname));
  const blogRedirects = redirects.filter(r => r.path && r.path.startsWith('/blogs/'));
  console.log(`Total blog redirects: ${blogRedirects.length}`);

  const activeBlogsRedirected = blogRedirects.filter(r => activeArticlePaths.has(r.path));
  console.log(`Active blog articles currently redirected (BROKEN!): ${activeBlogsRedirected.length}`);
  for (const r of activeBlogsRedirected) {
    console.log(`  CRITICAL MATCH: [${r.id}] ${r.path} -> ${r.target}`);
  }

  // Check all collections SEO metadata
  console.log('\n=== ACTIVE COLLECTIONS IN SITEMAP SEO AUDIT ===');
  const sitemapHandles = new Set(collectionsSitemap.urls.map(u => u.split('/collections/')[1]).filter(Boolean));
  const activeCollections = collections.filter(c => sitemapHandles.has(c.handle));
  console.log(`Active collections matching sitemap: ${activeCollections.length}`);

  let missingSeoTitle = 0;
  let doubleEscapedQuote = 0;
  let doubleEscapedAmp = 0;
  let templatePhrases = 0;

  const problematicCollections = [];

  for (const c of activeCollections) {
    const title = c.seo?.title || null;
    const desc = c.seo?.description || '';
    const hasNullTitle = !title || title.trim() === '';
    const hasDoubleQuote = desc.includes('&quot;') || desc.includes('&amp;quot;');
    const hasDoubleAmp = desc.includes('&amp;amp;') || desc.includes('&amp;');
    const hasTemplate = /^(Transform with|Elevate with|Style with|Refresh with)/i.test(desc.trim());

    if (hasNullTitle) missingSeoTitle++;
    if (hasDoubleQuote) doubleEscapedQuote++;
    if (hasDoubleAmp) doubleEscapedAmp++;
    if (hasTemplate) templatePhrases++;

    if (hasNullTitle || hasDoubleQuote || hasTemplate || c.handle === 'japanese-anime-desk-mats' || c.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
      problematicCollections.push({
        handle: c.handle,
        title: c.title,
        seoTitle: c.seo?.title,
        seoDesc: c.seo?.description,
        issues: {
          missingTitle: hasNullTitle,
          doubleQuote: hasDoubleQuote,
          doubleAmp: hasDoubleAmp,
          templatePhrase: hasTemplate
        }
      });
    }
  }

  console.log(`Collections with missing seo.title: ${missingSeoTitle} / ${activeCollections.length}`);
  console.log(`Collections with &quot; or &amp;quot; in seo.description: ${doubleEscapedQuote}`);
  console.log(`Collections with &amp; in seo.description: ${doubleEscapedAmp}`);
  console.log(`Collections with template phrase in seo.description: ${templatePhrases}`);

  // Inspect the two specific collections mentioned in R3
  console.log('\n=== R3 SPECIFIC COLLECTIONS ===');
  for (const h of ['japanese-anime-desk-mats', 'abstract-minimalist-bauhaus-canvas-wall-art']) {
    const col = collections.find(c => c.handle === h);
    if (col) {
      console.log(`Handle: ${h}`);
      console.log(`  ID: ${col.id}`);
      console.log(`  Title: "${col.title}"`);
      console.log(`  SEO Title: "${col.seo?.title}" (length: ${col.seo?.title?.length})`);
      console.log(`  SEO Desc: "${col.seo?.description}" (length: ${col.seo?.description?.length})`);
    } else {
      console.log(`Handle ${h} NOT FOUND in collections list`);
    }
  }

  // Save problematic collections summary
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/problematic_collections.json'),
    JSON.stringify(problematicCollections, null, 2)
  );

  // Save sitemap lists
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_collections.json'),
    JSON.stringify(collectionsSitemap.urls, null, 2)
  );
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_pages.json'),
    JSON.stringify(pagesSitemap.urls, null, 2)
  );
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_articles.json'),
    JSON.stringify(articlesSitemap.urls, null, 2)
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
