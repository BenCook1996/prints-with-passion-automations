import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch';
const files = fs.readdirSync(scratchDir);

for (const file of files) {
  if (!file.endsWith('.json') && !file.endsWith('.txt') && !file.endsWith('.log') && !file.endsWith('.mjs')) continue;
  try {
    const fullPath = path.join(scratchDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.size > 5 * 1024 * 1024) continue; // skip huge files
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('ALL SITEMAP COLLECTIONS') || (content.includes('Discovered - currently not indexed') && content.includes('/collections/'))) {
      console.log(`Match in: ${file}`);
    }
  } catch (err) {}
}
