import fs from 'fs';
import path from 'path';

const allCols = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/all_collections.json'),
  'utf8'
));
const sitemapCols = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/sitemap_collections.json'),
  'utf8'
));

const sitemapHandles = sitemapCols.map(u => u.split('/collections/')[1]).filter(Boolean);
const colMap = new Map(allCols.map(c => [c.handle, c]));

console.log(`Auditing all ${sitemapHandles.length} collections in sitemap_collections_1.xml:`);

const audit = [];
for (const h of sitemapHandles) {
  const c = colMap.get(h);
  if (!c) {
    audit.push({ handle: h, error: 'NOT_FOUND' });
    continue;
  }
  const title = c.seo?.title || null;
  const desc = c.seo?.description || null;
  audit.push({
    handle: h,
    id: c.id,
    title: c.title,
    productsCount: c.productsCount?.count ?? c.productsCount,
    seoTitle: title,
    seoTitleLen: title?.length || 0,
    hasCustomTitle: Boolean(title && title.trim()),
    seoDesc: desc,
    seoDescLen: desc?.length || 0,
    hasDoubleQuote: (desc || '').includes('&quot;') || (desc || '').includes('&amp;quot;'),
    hasDoubleAmp: (desc || '').includes('&amp;'),
    hasTemplatePhrase: /^(Transform with|Elevate with|Style with|Refresh with)/i.test((desc || '').trim())
  });
}

fs.writeFileSync(
  path.join(process.cwd(), '.agents/teamwork/teamwork_explorer_survey_2/active_collections_seo_audit.json'),
  JSON.stringify(audit, null, 2)
);

const missingTitle = audit.filter(a => !a.hasCustomTitle);
const withTemplatePhrase = audit.filter(a => a.hasTemplatePhrase);
const customTitles = audit.filter(a => a.hasCustomTitle);

console.log(`Total collections in sitemap: ${audit.length}`);
console.log(`Collections missing custom seo.title (seo.title === null): ${missingTitle.length}`);
console.log(`Collections with custom seo.title: ${customTitles.length}`);
for (const c of customTitles) {
  console.log(`  CUSTOM: ${c.handle.padEnd(45)} | Title (${c.seoTitleLen}): "${c.seoTitle}"`);
}
console.log(`Collections with broken template phrase in seo.description: ${withTemplatePhrase.length}`);
