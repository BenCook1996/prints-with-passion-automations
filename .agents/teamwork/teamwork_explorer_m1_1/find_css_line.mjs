import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const headContent = fs.readFileSync(path.join(__dirname, 'current_snippets_head.liquid'), 'utf8');
const lines = headContent.split(/\r?\n/);
lines.forEach((l, idx) => {
  if (l.includes('pwp-gallery-hero__title')) {
    console.log(`Line ${idx + 1}: ${l}`);
  }
});
