import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function fetchAllArticles() {
  let articles = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query GetAllArticles($cursor: String) {
        articles(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            title
            isPublished
            publishedAt
            seo {
              title
              description
            }
            blog {
              id
              handle
              title
            }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(query, { cursor });
    if (!res?.articles?.nodes) {
      console.error('Failed to fetch articles:', res);
      break;
    }
    articles.push(...res.articles.nodes);
    hasNextPage = res.articles.pageInfo.hasNextPage;
    cursor = res.articles.pageInfo.endCursor;
  }
  return articles;
}

async function fetchAllPages() {
  let pages = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const query = `
      query GetAllPages($cursor: String) {
        pages(first: 100, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            handle
            title
            body
            isPublished
            seo {
              title
              description
            }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(query, { cursor });
    if (!res?.pages?.nodes) {
      console.error('Failed to fetch pages:', res);
      break;
    }
    pages.push(...res.pages.nodes);
    hasNextPage = res.pages.pageInfo.hasNextPage;
    cursor = res.pages.pageInfo.endCursor;
  }
  return pages;
}

async function main() {
  console.log('Fetching all articles from Shopify Admin...');
  const articles = await fetchAllArticles();
  console.log(`Total articles in Shopify Admin: ${articles.length}`);

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_articles.json'),
    JSON.stringify(articles, null, 2)
  );

  console.log('\nLooking for uk-student-room-rental-flat-decor-guide in Shopify articles:');
  const studentGuide = articles.find(a => a.handle.includes('uk-student-room-rental-flat-decor-guide'));
  if (studentGuide) {
    console.log('FOUND student guide article in Admin:');
    console.log(JSON.stringify(studentGuide, null, 2));
  } else {
    console.log('NOT FOUND in Shopify articles!');
  }

  console.log('\nChecking all articles in sitemap vs Shopify Admin:');
  const sitemapArticles = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_articles.json'),
    'utf8'
  ));
  console.log(`Sitemap articles count: ${sitemapArticles.length}`);
  for (const u of sitemapArticles) {
    const handle = u.split('/blogs/news/')[1] || u.split('/blogs/')[1];
    const match = articles.find(a => a.handle === handle);
    console.log(`  ${handle.padEnd(65)} | Admin Match: ${match ? `YES (Published: ${match.isPublished})` : 'NO'}`);
  }

  console.log('\nFetching all pages from Shopify Admin...');
  const pages = await fetchAllPages();
  console.log(`Total pages in Shopify Admin: ${pages.length}`);

  fs.writeFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_pages.json'),
    JSON.stringify(pages, null, 2)
  );

  const sitemapPages = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_pages.json'),
    'utf8'
  ));
  console.log(`\nSitemap pages count: ${sitemapPages.length}`);
  console.log('Pages matching sitemap:');
  for (const u of sitemapPages) {
    const handle = u.split('/pages/')[1];
    const match = pages.find(p => p.handle === handle);
    console.log(`  ${handle.padEnd(50)} | Admin Match: ${match ? `YES (Published: ${match.isPublished})` : 'NO'}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
