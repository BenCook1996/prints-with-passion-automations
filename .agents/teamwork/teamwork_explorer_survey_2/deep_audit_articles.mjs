import fs from 'fs';
import path from 'path';

const articles = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json'),
  'utf8'
));

console.log(`=== AUDIT OF ALL ${articles.length} SITEMAP BLOG ARTICLES ===`);

for (const a of articles) {
  console.log(`\nHandle: ${a.handle}`);
  console.log(`  ID: ${a.id}`);
  console.log(`  Title (${a.titleLength}): "${a.title}"`);
  console.log(`  Title Tag (${a.titleTagLength}): "${a.titleTag}"`);
  console.log(`  Desc Tag (${a.descTagLength}): "${a.descTag}"`);
  console.log(`  Links count: Total=${a.totalLinks}, Collections=${a.collectionLinksCount}, Articles=${a.articleLinksCount}`);
  if (a.collectionLinksCount > 0) {
    console.log(`    Col links: ${a.collectionLinks.join(', ')}`);
  }
}
