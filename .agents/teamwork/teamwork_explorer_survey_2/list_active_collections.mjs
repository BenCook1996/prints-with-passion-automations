import fs from 'fs';
import path from 'path';

const allCols = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_collections.json'),
  'utf8'
));

console.log('--- ALL COLLECTIONS WITH > 0 PRODUCTS ---');
const activeCols = allCols.filter(c => (c.productsCount?.count ?? c.productsCount ?? 0) > 0);
console.log(`Total active collections: ${activeCols.length}`);
for (const c of activeCols) {
  const cnt = c.productsCount?.count ?? c.productsCount;
  console.log(`${c.handle.padEnd(50)} | count=${String(cnt).padStart(5)} | "${c.title}"`);
}
