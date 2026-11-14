import fs from 'fs';
import path from 'path';
import assert from 'assert';

const rawData = JSON.parse(fs.readFileSync('ctr_copy_experiments.json', 'utf8'));

function sanitizeTemplateGrammar(desc) {
  if (!desc) return '';
  let cleaned = desc;
  cleaned = cleaned
    .replace(/^Transform\s+with\s+(?:Canvas\s+Wall\s+Art|Wall\s+Art)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Archival framed canvas wall art on 1.25" European pine frames. ')
    .replace(/^Wear\s+with\s+(?:Graphic\s+T-Shirts|T-Shirts)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Heavyweight cotton graphic t-shirts (S–3XL) with gallery-grade prints. ')
    .replace(/^Elevate\s+with\s+(?:Cushion\s+Covers|Pillow\s+Cases)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Soft velvet cushion covers (45x45cm / 18x18") with double-sided gallery art. ')
    .replace(/^Refresh\s+with\s+(?:Memory\s+Foam\s+Bath\s+Mats|Bath\s+Mats)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Ultra-soft memory foam bath mats (60x40cm / 24x16") with non-slip backing. ')
    .replace(/^Style\s+with\s+(?:Plush\s+Throw\s+Blankets|Blankets)(?:[^\.]|\.(?=\d))*\.\s*/i, 'Cozy 300 GSM plush fleece throw blankets (50x60" / 60x80") for beds and sofas. ')
    .replace(/^Upgrade\s+with\s+((?:[^\.]|\.(?=\d))+)\.\s*/i, 'Curated $1 for modern home decor. ')
    .replace(/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\s+/gi, 'Shop curated ');
  return cleaned.trim();
}

console.log('Testing against all collections in ctr_copy_experiments.json...');

let tested = 0;
let modified = 0;
for (const col of rawData.collections || []) {
  for (const field of ['previousSeoDescription', 'newSeoDescription']) {
    const original = col[field];
    if (!original) continue;
    tested++;
    const sanitized = sanitizeTemplateGrammar(original);
    if (sanitized !== original) {
      modified++;
      // Check for broken fragments:
      // 1. Should not contain broken fragments like 25" Pine Bars or 25" Pine Frame (unless preceded by 1.)
      const brokenFragmentRegex = /(?<!1\.)25"\s+Pine/i;
      assert.ok(!brokenFragmentRegex.test(sanitized), `Broken fragment in ${col.handle}: ${sanitized}`);
      // 2. Should not start with dangling closing parenthesis
      assert.ok(!sanitized.startsWith(')'), `Dangling close paren in ${col.handle}: ${sanitized}`);
      // 3. Should not have unclosed parens or unmatched closing parens
      const openParens = (sanitized.match(/\(/g) || []).length;
      const closeParens = (sanitized.match(/\)/g) || []).length;
      assert.strictEqual(openParens, closeParens, `Unbalanced parentheses in ${col.handle}: ${sanitized}`);
    }
  }
}

console.log(`Successfully tested ${tested} descriptions (${modified} modified). 100% CLEAN!`);
