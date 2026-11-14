import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.liquid'));
  for (const f of files) {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    if (content.includes('customer_authentication')) {
      console.log(`\nFound customer_authentication in ${f}:`);
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('customer_authentication')) {
          console.log(`  Line ${i + 1}: ${line.trim()}`);
        }
      });
    }
    if (content.includes('printswithpasssion')) {
      console.log(`\nFound typo email in ${f}:`);
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('printswithpasssion')) {
          console.log(`  Line ${i + 1}: ${line.trim()}`);
        }
      });
    }
    // Check for logo inclusion
    if (content.includes('logo')) {
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('include \'logo\'') || line.includes('render \'logo\'') || line.includes('tag: \'h1\'') || line.includes('tag:\'h1\'')) {
          console.log(`\nLogo tag in ${f} (Line ${i + 1}): ${line.trim()}`);
        }
      });
    }
  }
}

main().catch(console.error);
