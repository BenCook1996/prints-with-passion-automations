import fs from 'fs';

const articles = JSON.parse(fs.readFileSync('./.agents/teamwork/teamwork_explorer_survey_2/audited_articles.json', 'utf8'));

console.log('=== ARTICLE INTERNAL LINK AUDIT ===');
articles.forEach((a, idx) => {
  console.log(`\n${idx + 1}. [${a.handle}] (Links: ${a.totalLinks}, Cols: ${a.collectionLinksCount}, Arts: ${a.articleLinksCount})`);
  console.log(`   Collections: ${JSON.stringify(a.collectionLinks.slice(0, 5))}${a.collectionLinks.length > 5 ? ' ...' : ''}`);
  console.log(`   Articles:    ${JSON.stringify(a.articleLinks)}`);
});
