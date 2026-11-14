import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'live_collections_seo_audit.json'), 'utf8'));

const active69 = audit.filter(c => c.inSitemap);
const unpublished4 = audit.filter(c => !c.inSitemap);

console.log(`=== ACTIVE COLLECTIONS IN SITEMAP (${active69.length}) ===`);
active69.forEach(c => {
  console.log(`[${c.index}] handle: "${c.handle}"`);
  console.log(`    gid: ${c.id}`);
  console.log(`    title: "${c.title}" (products: ${c.productsCount})`);
  console.log(`    seo.title: ${c.seoTitle ? `"${c.seoTitle}" (${c.seoTitleLen} chars)` : 'null (0 chars)'}`);
  console.log(`    seo.desc: ${c.seoDesc ? `"${c.seoDesc.slice(0, 60)}..." (${c.seoDescLen} chars)` : 'null'}`);
  if (c.specialNotes.length > 0) {
    console.log(`    flags: ${c.specialNotes.join('; ')}`);
  }
});

console.log(`\n=== UNPUBLISHED / EXCLUDED COLLECTIONS (${unpublished4.length}) ===`);
unpublished4.forEach(c => {
  console.log(`[${c.index}] handle: "${c.handle}" | gid: ${c.id} | title: "${c.title}" | products: ${c.productsCount} | flags: ${c.specialNotes.join('; ')}`);
});
