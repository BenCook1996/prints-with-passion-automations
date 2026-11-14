import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const res = await shopifyGraphQL(`
    query GetAllCollections {
      collections(first: 100) {
        nodes {
          id
          handle
          title
          productsCount {
            count
          }
          seo {
            title
            description
          }
        }
      }
    }
  `);

  const nodes = res?.collections?.nodes || [];
  console.log('Total collections fetched:', nodes.length);
  const handles = nodes.map(n => n.handle);
  console.log('Handles:', JSON.stringify(handles, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
