import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const head = fs.readFileSync(path.join(__dirname, 'snippets_head.liquid'), 'utf8');
  console.log('--- Occurrences of title in snippets_head.liquid ---');
  const titleMatches = [...head.matchAll(/<title[\s\S]*?<\/title>/gi)];
  titleMatches.forEach((m, i) => {
    console.log(`Title Match #${i + 1}:\n`, m[0]);
  });

  console.log('\n--- Occurrences of meta name="description" in snippets_head.liquid ---');
  const descMatches = [...head.matchAll(/<meta[^>]+name=["']description["'][\s\S]*?>/gi)];
  descMatches.forEach((m, i) => {
    console.log(`Desc Match #${i + 1}:\n`, m[0]);
  });

  // What about page_title?
  console.log('\n--- Occurrences of page_title ---');
  const lines = head.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('page_title') || l.includes('page_description')) {
      console.log(`Line ${i + 1}: ${l.trim()}`);
    }
  });
}

main().catch(console.error);
