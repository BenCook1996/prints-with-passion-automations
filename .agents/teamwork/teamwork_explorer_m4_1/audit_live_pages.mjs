import fs from 'fs';
import path from 'path';

const rawPagesPath = path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_m4_1/live_pages_raw.json');
const pages = JSON.parse(fs.readFileSync(rawPagesPath, 'utf8'));

console.log(`Total live pages: ${pages.length}\n`);

let h1CountTotal = 0;
let pagesWithH1 = [];
let pagesWithAmpBody = [];
let pagesWithAmpTitle = [];

for (const p of pages) {
  const h1Matches = p.body ? (p.body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || []) : [];
  if (h1Matches.length > 0) {
    h1CountTotal += h1Matches.length;
    pagesWithH1.push({
      handle: p.handle,
      id: p.id,
      title: p.title,
      count: h1Matches.length,
      matches: h1Matches
    });
  }

  const ampMatchesBody = p.body ? (p.body.match(/&amp;/g) || []) : [];
  if (ampMatchesBody.length > 0) {
    pagesWithAmpBody.push({
      handle: p.handle,
      count: ampMatchesBody.length
    });
  }

  const ampMatchesTitle = p.title ? (p.title.match(/&amp;/g) || []) : [];
  if (ampMatchesTitle.length > 0) {
    pagesWithAmpTitle.push({
      handle: p.handle,
      count: ampMatchesTitle.length
    });
  }

  if (p.handle === 'contact-us') {
    console.log('=== CONTACT US AUDIT ===');
    console.log('Title:', p.title);
    console.log('TitleTag:', p.titleTag);
    console.log('DescTag:', p.descTag);
    console.log('Body includes passsion (3 s):', p.body?.includes('printswithpasssionbc@gmail.com'));
    console.log('DescTag includes passsion (3 s):', p.descTag?.value?.includes('printswithpasssionbc@gmail.com'));
    console.log('Body snippet around email:', p.body?.match(/.{0,50}printswithpass+ionbc@gmail\.com.{0,50}/g));
    console.log('========================\n');
  }
}

console.log(`Pages with inner <h1>: ${pagesWithH1.length} (total inner <h1> tags: ${h1CountTotal})`);
pagesWithH1.forEach(p => {
  console.log(`  - [${p.handle}] (${p.count}): ${p.matches.join(' | ')}`);
});

console.log(`\nPages with &amp; in body: ${pagesWithAmpBody.length} (total occurrences: ${pagesWithAmpBody.reduce((a, b) => a + b.count, 0)})`);
console.log(`Pages with &amp; in title: ${pagesWithAmpTitle.length}`);
