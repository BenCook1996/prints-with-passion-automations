import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const content = fs.readFileSync(path.join(__dirname, 'sections_header.liquid'), 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    if (line.includes('header__line-additional_button') || line.includes('customer_authentication') || line.includes('customer_login_url') || line.includes('customer_register_url')) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  });
}

main().catch(console.error);
