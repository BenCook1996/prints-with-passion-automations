import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const footerStr = fs.readFileSync(path.join(__dirname, 'sections_footer.liquid'), 'utf8');
  if (footerStr.includes('pwp-clean-footer-nav')) {
    console.log('FOUND pwp-clean-footer-nav in sections/footer.liquid!');
    const lines = footerStr.split('\n');
    lines.forEach((l, i) => {
      if (l.includes('pwp-clean-footer-nav')) {
        console.log(`Line ${i + 1}: ${l}`);
      }
    });
  } else {
    console.log('Not in sections/footer.liquid');
  }

  // Check layout/theme.liquid
  const themeUrl = 'https://printswithpassion.com/';
  const res = await fetch(themeUrl);
  const html = await res.text();
  if (html.includes('pwp-site-footer')) {
    console.log('FOUND pwp-site-footer on live homepage!');
  }
}

main().catch(console.error);
