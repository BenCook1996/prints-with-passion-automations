import fs from 'fs';

const proposalsPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\fitted_collection_proposals.json';
const auditPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\active_collections_seo_audit.json';

const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

console.log('=== DETAILED PROPOSAL REVIEW ===\n');

proposals.forEach((p, idx) => {
  const a = audit.find(x => x.handle === p.handle);
  console.log(`[#${idx}] Handle: ${p.handle} (Products: ${a ? a.productsCount : 'unknown'})`);
  console.log(`Original Title: ${a ? a.title : 'N/A'}`);
  console.log(`Live SEO Title: ${a ? a.seoTitle : 'N/A'}`);
  console.log(`Proposed Title (${p.proposedTitle ? p.proposedTitle.length : 'N/A'}): ${p.proposedTitle}`);
  console.log(`Live SEO Desc:  ${a ? a.seoDesc : 'N/A'}`);
  console.log(`Proposed Desc  (${p.proposedDesc ? p.proposedDesc.length : 'N/A'}): ${p.proposedDesc}`);
  if (p.action) console.log(`Action: ${p.action} - ${p.notes}`);
  console.log('---');
});
