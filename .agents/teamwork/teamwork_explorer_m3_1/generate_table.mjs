import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audit = JSON.parse(fs.readFileSync(path.join(__dirname, 'live_collections_seo_audit.json'), 'utf8'));
const active69 = audit.filter(c => c.inSitemap);

let md = '| # | Handle | Shopify Collection GID | Current Admin Title | Current seo.title (Chars) | Current seo.description (Chars) | Special Flag |\n';
md += '|---|---|---|---|---|---|---|\n';

active69.forEach((c, i) => {
  const t = c.seoTitle ? `\`${c.seoTitle.replace(/\|/g, '\\|')}\` (${c.seoTitleLen})` : '*(null)* (0)';
  const d = c.seoDesc ? `"${c.seoDesc.slice(0, 45).replace(/\|/g, '\\|')}..." (${c.seoDescLen})` : '*(null)* (0)';
  const flag = c.specialNotes.length > 0 ? c.specialNotes.join('; ') : '—';
  md += `| ${i + 1} | \`${c.handle}\` | \`${c.id}\` | ${c.title.replace(/\|/g, '\\|')} | ${t} | ${d} | ${flag} |\n`;
});

fs.writeFileSync(path.join(__dirname, 'active_collections_table.md'), md, 'utf8');
console.log('Generated markdown table with', active69.length, 'rows');
