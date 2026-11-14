import fs from 'fs';

const proposalsPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\verified_collection_proposals.json';
const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));

console.log(`Checking uniqueness across ${proposals.length} proposals...\n`);

const titleMap = new Map();
const descMap = new Map();
let duplicateTitles = 0;
let duplicateDescs = 0;

proposals.forEach(p => {
  if (titleMap.has(p.proposedTitle)) {
    console.error(`[DUPLICATE TITLE] "${p.proposedTitle}" shared by ${p.handle} and ${titleMap.get(p.proposedTitle)}`);
    duplicateTitles++;
  } else {
    titleMap.set(p.proposedTitle, p.handle);
  }

  if (descMap.has(p.proposedDesc)) {
    console.error(`[DUPLICATE DESC] "${p.proposedDesc}" shared by ${p.handle} and ${descMap.get(p.proposedDesc)}`);
    duplicateDescs++;
  } else {
    descMap.set(p.proposedDesc, p.handle);
  }
});

if (duplicateTitles === 0 && duplicateDescs === 0) {
  console.log(`PASS: All ${proposals.length} titles are 100% unique!`);
  console.log(`PASS: All ${proposals.length} descriptions are 100% unique!`);
} else {
  console.error(`FAIL: ${duplicateTitles} duplicate titles, ${duplicateDescs} duplicate descriptions.`);
  process.exit(1);
}
