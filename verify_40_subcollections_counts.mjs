import fs from 'fs';
import { shopifyGraphQL, SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

async function main() {
  const subs = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
  const ids = subs.map(s => s.id);
  const data = await shopifyGraphQL(`
    query CheckCounts($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Collection {
          id
          handle
          title
          productsCount { count }
        }
      }
    }
  `, { ids });

  let zeroCount = 0;
  for (const c of data?.nodes || []) {
    if (!c) continue;
    const cnt = typeof c.productsCount === 'object' ? (c.productsCount?.count ?? 0) : (c.productsCount ?? 0);
    console.log(`${c.handle.padEnd(45)} | count=${String(cnt).padStart(5)} | ${c.title}`);
    if (cnt === 0) zeroCount++;
  }
  console.log(`\nTotal checked: ${(data?.nodes || []).length}, Zero-product collections: ${zeroCount}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
