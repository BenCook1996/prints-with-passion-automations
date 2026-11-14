import fs from 'fs';
import path from 'path';

const proposalsPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\fitted_collection_proposals.json';
const auditPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\active_collections_seo_audit.json';

const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

console.log(`Proposals total entries: ${proposals.length}`);
console.log(`Audit total entries: ${audit.length}`);

// Audit the proposals
const issues = [];
const templateRegex = /(?:Transform|Elevate|Style|Refresh|Upgrade|Wear|Accent)\s+with\b/i;
const entityRegex = /&(?:quot|amp|lt|gt|#39|#x27|#x26|amp;quot);/i;

proposals.forEach((p, idx) => {
  if (p.action === 'UNPUBLISH_FROM_ONLINE_STORE') {
    return;
  }
  const title = p.proposedTitle || '';
  const desc = p.proposedDesc || '';

  const titleLen = title.length;
  const descLen = desc.length;

  const itemIssues = [];

  if (titleLen === 0) {
    itemIssues.push('Empty title');
  } else if (titleLen > 60) {
    itemIssues.push(`Title too long (${titleLen} > 60)`);
  }

  if (descLen < 140 || descLen > 158) {
    itemIssues.push(`Desc length invalid (${descLen} chars, required 140-158)`);
  }

  if (templateRegex.test(title)) {
    itemIssues.push(`Title has template phrase: ${title.match(templateRegex)[0]}`);
  }
  if (templateRegex.test(desc)) {
    itemIssues.push(`Desc has template phrase: ${desc.match(templateRegex)[0]}`);
  }

  if (entityRegex.test(title)) {
    itemIssues.push(`Title has HTML entity: ${title.match(entityRegex)[0]}`);
  }
  if (entityRegex.test(desc)) {
    itemIssues.push(`Desc has HTML entity: ${desc.match(entityRegex)[0]}`);
  }

  // Check ending punctuation for complete sentence
  if (desc && !/[.!?]$/.test(desc.trim())) {
    itemIssues.push(`Desc does not end with sentence-ending punctuation (.!?): "${desc.slice(-10)}"`);
  }

  // Check specific collections
  if (p.handle === 'japanese-anime-desk-mats') {
    itemIssues.push(`[SPECIFIC] japanese-anime-desk-mats current title: "${title}"`);
  }
  if (p.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    itemIssues.push(`[SPECIFIC] abstract-minimalist-bauhaus-canvas-wall-art current title: "${title}"`);
  }

  if (itemIssues.length > 0) {
    issues.push({
      idx,
      handle: p.handle,
      id: p.id,
      title,
      titleLen,
      desc,
      descLen,
      itemIssues
    });
  }
});

console.log(`Found issues in ${issues.length} entries.`);
console.log(JSON.stringify(issues, null, 2));
