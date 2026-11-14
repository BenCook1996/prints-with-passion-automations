import fs from 'fs';
import path from 'path';

const pages = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_pages.json'),
  'utf8'
));

console.log(`=== AUDIT OF ALL ${pages.length} PAGES IN SITEMAP ===`);

const guidePages = pages.filter(p => p.isGuidePage);
const standardPages = pages.filter(p => !p.isGuidePage);

console.log(`Pillar Guide Pages: ${guidePages.length}`);
console.log(`Standard Pages: ${standardPages.length}`);

console.log('\n--- PILLAR GUIDE PAGES BREAKDOWN ---');
for (const p of guidePages) {
  console.log(`\nHandle: ${p.handle}`);
  console.log(`  ID: ${p.id}`);
  console.log(`  Title (${p.titleLength}): "${p.title}"`);
  console.log(`  Inner H1s (${p.innerH1Count}): ${JSON.stringify(p.innerH1s)}`);
  console.log(`  Title Tag: "${p.titleTag}"`);
  console.log(`  Desc Tag: "${p.descTag}"`);
  console.log(`  Has &amp; in Body: ${p.hasAmpInBody} | Title: ${p.hasAmpInTitle}`);
}

console.log('\n--- STANDARD PAGES BREAKDOWN ---');
for (const p of standardPages) {
  console.log(`\nHandle: ${p.handle}`);
  console.log(`  ID: ${p.id}`);
  console.log(`  Title: "${p.title}"`);
  console.log(`  Title Tag: "${p.titleTag}"`);
  console.log(`  Desc Tag: "${p.descTag}"`);
}
