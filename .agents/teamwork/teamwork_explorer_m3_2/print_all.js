import fs from 'fs';

const proposalsPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\fitted_collection_proposals.json';
const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));

console.log(`Index | Handle | TitleLen | DescLen | Title | Notes`);
proposals.forEach((p, i) => {
  if (p.action === 'UNPUBLISH_FROM_ONLINE_STORE') {
    console.log(`${i.toString().padStart(2)} | ${p.handle} | UNPUBLISH | ${p.notes}`);
  } else {
    console.log(`${i.toString().padStart(2)} | ${p.handle.padEnd(35)} | ${p.proposedTitle.length} | ${p.proposedDesc.length} | ${p.proposedTitle}`);
  }
});
