import fs from 'fs';
import path from 'path';

const audit = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/active_collections_seo_audit.json'),
  'utf8'
));

console.log('Sample collection SEO descriptions:');
for (const a of audit.slice(0, 15)) {
  console.log(`\nHandle: ${a.handle} (${a.title})`);
  console.log(`  Title: "${a.seoTitle}"`);
  console.log(`  Desc (${a.seoDescLen}): "${a.seoDesc}"`);
}
