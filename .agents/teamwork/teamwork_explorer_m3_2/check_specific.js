import fs from 'fs';

const auditPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_survey_2\\active_collections_seo_audit.json';
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

const anime = audit.find(a => a.handle === 'japanese-anime-desk-mats');
console.log('ANIME CURRENT AUDIT:');
console.log(JSON.stringify(anime, null, 2));

const bauhaus = audit.find(a => a.handle === 'abstract-minimalist-bauhaus-canvas-wall-art');
console.log('\nBAUHAUS CURRENT AUDIT:');
console.log(JSON.stringify(bauhaus, null, 2));
