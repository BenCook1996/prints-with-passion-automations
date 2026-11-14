import fs from 'fs';
import { LOCAL_TOKEN_PATH, SHOP_DOMAIN, shopifyGraphQL } from '../../../lib/cloud-env.mjs';

async function main() {
  // Query schema for mutations affecting shop or preferences
  const schemaQuery = `
    query IntrospectShopMutations {
      __schema {
        mutationType {
          fields {
            name
            description
            args {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    }
  `;
  const schemaData = await shopifyGraphQL(schemaQuery);
  const mutations = schemaData?.__schema?.mutationType?.fields || [];
  const relevantMutations = mutations.filter(m => 
    m.name.toLowerCase().includes('shop') || 
    m.name.toLowerCase().includes('preference') ||
    m.name.toLowerCase().includes('seo')
  );
  console.log('Relevant Mutations:');
  for (const m of relevantMutations) {
    console.log(`- ${m.name}: ${m.args.map(a => a.name).join(', ')}`);
  }
}

main().catch(console.error);
