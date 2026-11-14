import fs from 'fs';
import path from 'path';

const rawPagesPath = path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_m4_1/live_pages_raw.json');
const pages = JSON.parse(fs.readFileSync(rawPagesPath, 'utf8'));

console.log('List of all 36 pages:');
pages.forEach((p, i) => {
  console.log(`${i+1}. ${p.handle} (ID: ${p.id})`);
  console.log(`   Title: "${p.title}"`);
  console.log(`   TitleTag: ${JSON.stringify(p.titleTag?.value || null)}`);
  console.log(`   DescTag: ${JSON.stringify(p.descTag?.value || null)}`);
});
