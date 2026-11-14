import fs from 'fs';
import path from 'path';
import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  console.log('Fetching live pages from Shopify GraphQL API...');
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
            metafields(first: 20) {
              nodes {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;
    const res = await shopifyGraphQL(q, { cursor });
    if (!res?.pages?.nodes) {
      console.error('No pages nodes returned:', res);
      break;
    }
    pages.push(...res.pages.nodes);
    hasNextPage = res.pages.pageInfo.hasNextPage;
    cursor = res.pages.pageInfo.endCursor;
  }

  console.log(`Fetched ${pages.length} live pages from Shopify.`);
  
  const outPath = path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_m4_1/live_pages_raw.json');
  fs.writeFileSync(outPath, JSON.stringify(pages, null, 2), 'utf8');
  console.log(`Saved live pages to ${outPath}`);
}

main().catch(console.error);
