import fs from 'fs';

const spec = JSON.parse(fs.readFileSync('C:/Users/Benjamin/.gemini/antigravity/scratch/pwp-seo-blog-engine/.agents/teamwork/teamwork_explorer_m4_1/page_remediation_spec.json', 'utf8'));

console.log('Metadata:', JSON.stringify(spec.metadata, null, 2));
console.log('Page count:', spec.pages.length);

let errors = [];
spec.pages.forEach((p, idx) => {
  if (p.proposed_seo_title_length > 60) errors.push(`Page ${p.handle} title len > 60: ${p.proposed_seo_title_length}`);
  if (p.proposed_seo_description_length < 145 || p.proposed_seo_description_length > 158) {
    errors.push(`Page ${p.handle} desc len out of bounds: ${p.proposed_seo_description_length}`);
  }
  if (p.proposed_seo_title.includes('&amp;') || p.proposed_seo_title.includes('&quot;')) {
    errors.push(`Page ${p.handle} title has entities`);
  }
  if (p.proposed_seo_description.includes('&amp;') || p.proposed_seo_description.includes('&quot;')) {
    errors.push(`Page ${p.handle} desc has entities`);
  }
  if (!p.proposed_seo_description.endsWith('.')) {
    errors.push(`Page ${p.handle} desc missing period`);
  }
  if (p.has_inner_h1 && p.inner_h1_replacements.length === 0) {
    errors.push(`Page ${p.handle} missing h1 replacement`);
  }
});

console.log('Spec validation errors:', errors);
if (errors.length === 0) {
  console.log('PERFECT! 0 errors found across all 36 pages in page_remediation_spec.json');
}
