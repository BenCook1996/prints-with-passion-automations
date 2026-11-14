import fs from 'fs';
import path from 'path';

const allArticles = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_articles.json'),
  'utf8'
));

console.log(`Loaded ${allArticles.length} articles from all_articles.json`);

const match = allArticles.find(a => a.handle.includes('student') || a.title.toLowerCase().includes('student') || a.handle.includes('flat-decor'));
console.log('Match result:', match);

const allHandles = allArticles.map(a => a.handle);
console.log('Sample handles containing decor or guide:');
for (const h of allHandles.filter(h => h.includes('decor') || h.includes('room') || h.includes('guide'))) {
  console.log('  ', h);
}
