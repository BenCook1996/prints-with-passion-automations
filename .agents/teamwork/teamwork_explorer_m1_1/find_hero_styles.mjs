import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = ['current_layout_theme.liquid', 'current_snippets_head.liquid', 'current_sections_header.liquid', 'current_templates_index.json'];
for (const file of files) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  if (content.includes('pwp-gallery-hero')) {
    console.log(`Found pwp-gallery-hero in ${file}`);
    const matches = content.match(/<style[\s\S]*?pwp-gallery-hero[\s\S]*?<\/style>/gi);
    if (matches) {
      console.log(`  Found in <style> block of ${file} (count: ${matches.length})`);
    }
  }
}
