import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const headPath = path.join(__dirname, 'current_snippets_head.liquid');
const headerPath = path.join(__dirname, 'current_sections_header.liquid');
const indexPath = path.join(__dirname, 'current_templates_index.json');
const socialMetaPath = path.join(__dirname, 'current_snippets_social_meta.liquid');

const headContent = fs.readFileSync(headPath, 'utf8');
const headerContent = fs.readFileSync(headerPath, 'utf8');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const socialContent = fs.existsSync(socialMetaPath) ? fs.readFileSync(socialMetaPath, 'utf8') : '';

console.log('=== 1. HEAD.LIQUID ANALYSIS ===');
const headLines = headContent.split(/\r?\n/);
headLines.forEach((line, idx) => {
  if (line.includes('<title') || line.includes('</title>') || line.includes('name="description"')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});

console.log('\n--- Lines 40 to 65 of head.liquid ---');
for (let i = 39; i < 65 && i < headLines.length; i++) {
  console.log(`${i + 1}: ${headLines[i]}`);
}

console.log('\n=== 2. HEADER.LIQUID ANALYSIS ===');
const headerLines = headerContent.split(/\r?\n/);

console.log('\n--- Occurrences of main_logo_tag in header.liquid ---');
headerLines.forEach((line, idx) => {
  if (line.includes('main_logo_tag')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});

console.log('\n--- Lines 1055 to 1075 of header.liquid ---');
for (let i = 1054; i < 1075 && i < headerLines.length; i++) {
  console.log(`${i + 1}: ${headerLines[i]}`);
}

console.log('\n--- Occurrences of customer_authentication or routes.account in header.liquid ---');
headerLines.forEach((line, idx) => {
  if (line.includes('customer_authentication') || line.includes('routes.account_login_url') || line.includes('routes.account_url')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});

console.log('\n--- Lines 1790 to 1805 of header.liquid ---');
for (let i = 1789; i < 1805 && i < headerLines.length; i++) {
  console.log(`${i + 1}: ${headerLines[i]}`);
}

console.log('\n=== 3. TEMPLATES/INDEX.JSON ANALYSIS ===');
try {
  const indexJson = JSON.parse(indexContent);
  console.log('Sections order:', indexJson.order);
  const heroSection = indexJson.sections['home_builder_HhUtjg'];
  console.log('Section home_builder_HhUtjg type:', heroSection?.type);
  console.log('Section home_builder_HhUtjg blocks:');
  for (const [blockId, blockData] of Object.entries(heroSection?.blocks || {})) {
    console.log(`- Block [${blockId}] type=${blockData.type}:`, JSON.stringify(blockData.settings, null, 2));
  }
} catch (e) {
  console.error('JSON parse error on templates/index.json:', e.message);
}

console.log('\n=== 4. SOCIAL META TAGS ANALYSIS ===');
if (socialContent) {
  const socialLines = socialContent.split(/\r?\n/);
  socialLines.forEach((line, idx) => {
    if (line.includes('og:title') || line.includes('twitter:title') || line.includes('og:description') || line.includes('twitter:description')) {
      console.log(`Line ${idx + 1}: ${line}`);
    }
  });
}
