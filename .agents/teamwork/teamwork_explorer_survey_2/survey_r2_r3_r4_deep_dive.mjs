import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

const DISCONTINUED_HANDLES = [
  'dog-collars', 'laundry-bags', 'duffle-bags', 'clutch-bags', 'phone-cases',
  'beach-towels', 'mugs', 'journals', 'wall-tapestry', 'puzzles',
  'shoes', 'hats', 'bottles', 'tote-bags', 'suitcases',
  'yoga-mats', 'makeup-bags', 'coasters', 'pet-mat', 'bottle-opener',
  'pet-bowls', 'bags', 'bags-1', 'pets-animals', 'can-cooler',
  'posters', 'rugs', 'mousepads'
];

async function fetchAllPagesGql() {
  let pages = [];
  let hasNextPage = true;
  let cursor = null;
  while (hasNextPage) {
    const q = `
      query GetPages($cursor: String) {
        pages(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            body
            publishedAt
            titleTag: metafield(namespace: "global", key: "title_tag") { value }
            descTag: metafield(namespace: "global", key: "description_tag") { value }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(q, { cursor });
    if (!res?.pages?.nodes) break;
    pages.push(...res.pages.nodes);
    hasNextPage = res.pages.pageInfo.hasNextPage;
    cursor = res.pages.pageInfo.endCursor;
  }
  return pages;
}

async function fetchAllArticlesGql() {
  let articles = [];
  let hasNextPage = true;
  let cursor = null;
  while (hasNextPage) {
    const q = `
      query GetArticles($cursor: String) {
        articles(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            body
            publishedAt
            blog { id handle title }
            titleTag: metafield(namespace: "global", key: "title_tag") { value }
            descTag: metafield(namespace: "global", key: "description_tag") { value }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(q, { cursor });
    if (!res?.articles?.nodes) break;
    articles.push(...res.articles.nodes);
    hasNextPage = res.articles.pageInfo.hasNextPage;
    cursor = res.articles.pageInfo.endCursor;
  }
  return articles;
}

async function checkAvadaPublications() {
  const q = `
    query GetAvadaPubs {
      collection(id: "gid://shopify/Collection/441651298615") {
        id
        handle
        title
        resourcePublications(first: 20) {
          nodes {
            isPublished
            publication {
              id
              name
            }
          }
        }
      }
      publications(first: 20) {
        nodes {
          id
          name
        }
      }
    }
  `;
  return await shopifyGraphQL(q);
}

async function main() {
  console.log('1. Fetching all pages...');
  const allPages = await fetchAllPagesGql();
  console.log(`Total pages fetched from Shopify: ${allPages.length}`);

  const sitemapPages = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_pages.json'),
    'utf8'
  ));
  console.log(`Total sitemap pages: ${sitemapPages.length}`);

  const pageByHandle = new Map(allPages.map(p => [p.handle, p]));

  // Audit 36 pages in sitemap
  const auditedPages = [];
  for (const url of sitemapPages) {
    const handle = url.split('/pages/')[1];
    const page = pageByHandle.get(handle);
    if (!page) {
      auditedPages.push({ url, handle, error: 'NOT_FOUND_IN_ADMIN' });
      continue;
    }

    const bodyH1s = [...(page.body || '').matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    const hasAmpInBody = (page.body || '').includes('&amp;');
    const hasAmpInTitle = (page.title || '').includes('&amp;');

    auditedPages.push({
      url,
      id: page.id,
      handle: page.handle,
      title: page.title,
      titleLength: page.title?.length,
      bodyLength: page.body?.length || 0,
      innerH1Count: bodyH1s.length,
      innerH1s: bodyH1s,
      hasAmpInBody,
      hasAmpInTitle,
      titleTag: page.titleTag?.value || null,
      titleTagLength: page.titleTag?.value?.length || 0,
      descTag: page.descTag?.value || null,
      descTagLength: page.descTag?.value?.length || 0,
      isGuidePage: handle.endsWith('-uk-guide') || handle.includes('-guide')
    });
  }

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_pages.json'),
    JSON.stringify(auditedPages, null, 2)
  );

  console.log(`Audited ${auditedPages.length} sitemap pages.`);
  const pagesWithInnerH1 = auditedPages.filter(p => p.innerH1Count > 0);
  const pagesWithAmp = auditedPages.filter(p => p.hasAmpInBody || p.hasAmpInTitle);
  const pagesMissingTitleTag = auditedPages.filter(p => !p.titleTag);
  const pagesMissingDescTag = auditedPages.filter(p => !p.descTag);

  console.log(`Pages with inner <h1> in body: ${pagesWithInnerH1.length}`);
  console.log(`Pages with &amp; in body/title: ${pagesWithAmp.length}`);
  console.log(`Pages missing title_tag metafield: ${pagesMissingTitleTag.length}`);
  console.log(`Pages missing description_tag metafield: ${pagesMissingDescTag.length}`);

  // 2. Fetch all articles
  console.log('\n2. Fetching all articles...');
  const allArticles = await fetchAllArticlesGql();
  console.log(`Total articles fetched from Shopify: ${allArticles.length}`);

  const sitemapArticles = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_articles.json'),
    'utf8'
  ));
  console.log(`Total sitemap articles: ${sitemapArticles.length}`);

  const articleByHandle = new Map(allArticles.map(a => [a.handle, a]));

  const auditedArticles = [];
  for (const url of sitemapArticles) {
    const handle = url.split('/blogs/news/')[1] || url.split('/blogs/')[1];
    const art = articleByHandle.get(handle);
    if (!art) {
      auditedArticles.push({ url, handle, error: 'NOT_FOUND_IN_ADMIN' });
      continue;
    }

    const titleTag = art.titleTag?.value || null;
    const descTag = art.descTag?.value || null;
    const bodyLinks = [...(art.body || '').matchAll(/href=["']([^"']+)["']/gi)].map(m => m[1]);
    const internalCollectionLinks = bodyLinks.filter(l => l.includes('/collections/'));
    const internalArticleLinks = bodyLinks.filter(l => l.includes('/blogs/'));

    auditedArticles.push({
      url,
      id: art.id,
      handle: art.handle,
      title: art.title,
      titleLength: art.title?.length,
      publishedAt: art.publishedAt,
      titleTag,
      titleTagLength: titleTag?.length || 0,
      descTag,
      descTagLength: descTag?.length || 0,
      totalLinks: bodyLinks.length,
      collectionLinksCount: internalCollectionLinks.length,
      articleLinksCount: internalArticleLinks.length,
      collectionLinks: internalCollectionLinks,
      articleLinks: internalArticleLinks
    });
  }

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json'),
    JSON.stringify(auditedArticles, null, 2)
  );

  console.log(`Audited ${auditedArticles.length} sitemap articles.`);

  // 3. Inspect avada-upsell-best-sellers publication status
  console.log('\n3. Checking avada-upsell-best-sellers publications...');
  const avadaPubs = await checkAvadaPublications();
  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/avada_publications.json'),
    JSON.stringify(avadaPubs, null, 2)
  );
  console.log('Avada publications info:');
  const pubNodes = avadaPubs?.collection?.resourcePublications?.nodes || [];
  for (const p of pubNodes) {
    console.log(`  Publication: "${p.publication?.name}" (ID: ${p.publication?.id}) - isPublished: ${p.isPublished}`);
  }

  // 4. Inspect frontpage collection constraints
  console.log('\n4. Checking frontpage collection...');
  const qFrontpage = await shopifyGraphQL(`
    query {
      collection(id: "gid://shopify/Collection/437768978743") {
        id
        handle
        title
        productsCount { count }
        ruleSet { rules { column relation condition } }
      }
    }
  `);
  console.log('Frontpage info:', JSON.stringify(qFrontpage, null, 2));

  // 5. Inspect the 28 discontinued collections details
  console.log('\n5. Checking the 28 discontinued collections details...');
  const allCols = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_collections.json'),
    'utf8'
  ));
  const colMap = new Map(allCols.map(c => [c.handle, c]));

  const discontinuedDetails = DISCONTINUED_HANDLES.map(h => {
    const c = colMap.get(h);
    return {
      handle: h,
      id: c?.id || null,
      title: c?.title || null,
      productsCount: c?.productsCount?.count ?? c?.productsCount ?? 0,
      updatedAt: c?.updatedAt
    };
  });

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/discontinued_28_details.json'),
    JSON.stringify(discontinuedDetails, null, 2)
  );
  console.log(`Mapped all 28 discontinued collections.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
