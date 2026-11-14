import fs from 'fs';

const proposals = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\fitted_collection_proposals.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\active_collections_seo_audit.json', 'utf8'));

console.log('Total proposals:', proposals.length);

const fullList = proposals.map((p, idx) => {
  const a = audit.find(x => x.handle === p.handle) || {};
  return {
    index: idx,
    handle: p.handle,
    id: p.id,
    action: p.action,
    title: a.title,
    productsCount: a.productsCount,
    proposedTitle: p.proposedTitle,
    proposedTitleLen: p.proposedTitle ? p.proposedTitle.length : 0,
    proposedDesc: p.proposedDesc,
    proposedDescLen: p.proposedDesc ? p.proposedDesc.length : 0,
    notes: p.notes
  };
});

fs.writeFileSync(
  'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\combined_inventory.json',
  JSON.stringify(fullList, null, 2)
);

console.log('Saved combined_inventory.json');
