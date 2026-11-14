import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const handles = ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel'];
  console.log('--- Verifying 6 Parent Collections ---');
  for (const h of handles) {
    const data = await shopifyGraphQL(`
      query GetCollection($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          productsCount { count }
        }
      }
    `, { handle: h });
    const c = data?.collectionByHandle;
    if (c) {
      console.log(`PARENT: ${h.padEnd(20)} | id: ${c.id} | count: ${c.productsCount?.count} | title: ${c.title}`);
    } else {
      console.error(`PARENT NOT FOUND: ${h}`);
    }
  }
}

main().catch(console.error);
