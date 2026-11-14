import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function testAll48() {
  const subcollectionsPath = path.join(projectRoot, 'phase2_40_subcollections.json');
  const subcollections = JSON.parse(fs.readFileSync(subcollectionsPath, 'utf8'));

  console.log(`Testing HTTP response for all ${subcollections.length} sub-collections with pacing...`);

  let okCount = 0;
  let failures = [];

  for (let i = 0; i < subcollections.length; i++) {
    const s = subcollections[i];
    const url = `https://printswithpassion.com/collections/${s.handle}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (res.status === 200) {
        okCount++;
        console.log(`[${i + 1}/${subcollections.length}] 200 OK: /collections/${s.handle}`);
      } else {
        failures.push({ handle: s.handle, status: res.status });
        console.error(`[${i + 1}/${subcollections.length}] FAIL ${res.status}: /collections/${s.handle}`);
      }
    } catch (err) {
      failures.push({ handle: s.handle, error: err.message });
      console.error(`[${i + 1}/${subcollections.length}] ERROR: /collections/${s.handle} - ${err.message}`);
    }
    // Delay 250ms to be well within Cloudflare/Shopify rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log('\n--- RESULT ---');
  console.log(`Total: ${subcollections.length}`);
  console.log(`200 OK: ${okCount}`);
  console.log(`Failures: ${failures.length}`);

  if (failures.length > 0) {
    console.error('Failed items:', failures);
    process.exit(1);
  }
}

testAll48();
