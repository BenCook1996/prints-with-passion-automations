import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const redirects = JSON.parse(fs.readFileSync(
    path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_redirects.json'),
    'utf8'
  ));

  const blogRedirects = redirects.filter(r => r.path && r.path.startsWith('/blogs/'));
  console.log(`Checking ${blogRedirects.length} blog redirects against Shopify articles...`);

  const newsRedirects = blogRedirects.filter(r => r.path.startsWith('/blogs/news/'));
  console.log(`Of which ${newsRedirects.length} start with /blogs/news/`);

  for (const r of newsRedirects) {
    const handle = r.path.replace('/blogs/news/', '');
    const q = `
      query FindArticle($query: String) {
        articles(first: 5, query: $query) {
          nodes {
            id
            handle
            title
            publishedAt
          }
        }
      }
    `;
    const res = await shopifyGraphQL(q, { query: `handle:${handle}` });
    const match = res?.articles?.nodes?.find(a => a.handle === handle);
    if (match) {
      console.log(`MATCHED ARTICLE IN ADMIN:`);
      console.log(`  Redirect ID: ${r.id} | Path: ${r.path} -> ${r.target}`);
      console.log(`  Article ID: ${match.id} | Title: "${match.title}" | PublishedAt: ${match.publishedAt}`);
    }
  }
}

main().catch(console.error);
