import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const q = `
    query FindArticle {
      articles(first: 50, query: "handle:*student* OR title:*student*") {
        nodes {
          id
          handle
          title
          publishedAt
          blog { id handle title }
        }
      }
    }
  `;
  const res = await shopifyGraphQL(q);
  console.log('Search student:', JSON.stringify(res, null, 2));

  const q2 = `
    query FindByHandle {
      articles(first: 10, query: "handle:uk-student-room-rental-flat-decor-guide") {
        nodes {
          id
          handle
          title
          publishedAt
          blog { id handle title }
        }
      }
    }
  `;
  const res2 = await shopifyGraphQL(q2);
  console.log('Search exact handle:', JSON.stringify(res2, null, 2));

  // Also check if it's a Page instead of an Article!
  const q3 = `
    query FindPage {
      pages(first: 10, query: "handle:*student* OR title:*student*") {
        nodes {
          id
          handle
          title
        }
      }
    }
  `;
  const res3 = await shopifyGraphQL(q3);
  console.log('Search page:', JSON.stringify(res3, null, 2));
}

main().catch(console.error);
