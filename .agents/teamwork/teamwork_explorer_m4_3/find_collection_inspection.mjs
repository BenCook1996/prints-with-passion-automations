import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch';
const files = fs.readdirSync(scratchDir);

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  try {
    const fullPath = path.join(scratchDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('coverageState') && content.includes('/collections/')) {
      console.log(`Found coverageState with /collections/ in: ${file}`);
    }
    if (content.includes('lastCrawlTime') && content.includes('/collections/')) {
      console.log(`Found lastCrawlTime with /collections/ in: ${file}`);
    }
  } catch (err) {}
}
