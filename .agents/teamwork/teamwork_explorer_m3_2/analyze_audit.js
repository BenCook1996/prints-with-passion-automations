import fs from 'fs';

const auditPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\active_collections_seo_audit.json';
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

console.log('Total in audit:', audit.length);
const unpublish = audit.filter(a => a.handle === 'avada-upsell-best-sellers');
console.log('Avada in audit:', unpublish.length);

const zeroProducts = audit.filter(a => a.productsCount === 0);
console.log('Zero products in audit:', zeroProducts.map(a => `${a.handle} (${a.title})`));

const hasCustomTitle = audit.filter(a => a.hasCustomTitle);
console.log('Has custom title:', hasCustomTitle.length);
hasCustomTitle.forEach(a => {
  console.log(`  ${a.handle} (${a.seoTitleLen}): "${a.seoTitle}"`);
});

const missingCustomTitle = audit.filter(a => !a.hasCustomTitle);
console.log('Missing custom title:', missingCustomTitle.length);
