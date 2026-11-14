import fs from 'fs';

async function testQuery(query) {
  const tokenCfg = JSON.parse(fs.readFileSync('.shopify_token.json', 'utf8'));
  const res = await fetch('https://bencook96store.myshopify.com/admin/api/2025-01/graphql.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': tokenCfg.SHOPIFY_ADMIN_ACCESS_TOKEN
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  return data;
}

async function main() {
  const rArticle = await testQuery(`
    query {
      articles(first: 1) {
        nodes {
          id
          title
          handle
          publishedAt
          body
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
  `);
  console.log('Article errors:', rArticle.errors);

  const rPage = await testQuery(`
    query {
      pages(first: 1) {
        nodes {
          id
          title
          handle
          publishedAt
          body
          seo {
            title
            description
          }
        }
      }
    }
  `);
  console.log('Page errors:', rPage.errors);
}

main().catch(console.error);
