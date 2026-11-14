import { shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  const schema = await shopifyGraphQL(`
    query {
      articleType: __type(name: "Article") {
        fields {
          name
        }
      }
      pageType: __type(name: "Page") {
        fields {
          name
        }
      }
    }
  `);

  console.log('Article fields:', schema?.articleType?.fields?.map(f => f.name).join(', '));
  console.log('Page fields:', schema?.pageType?.fields?.map(f => f.name).join(', '));
}

main().catch(console.error);
