import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  const ts = Date.now();
  console.log('--- INDEPENDENT VERIFICATION RUN ---');

  // Test 1: Homepage Checks
  const homeRes = await fetch(`https://printswithpassion.com/?_test=${ts}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationBot' }
  });
  console.log(`Homepage status: ${homeRes.status}`);
  const homeHtml = await homeRes.text();

  // 1.1 Title
  const title = (homeHtml.match(/<title>([^<]+)<\/title>/i)?.[1] || '').trim();
  console.log(`Title: "${title}" (length: ${title.length})`);
  if (title !== 'Canvas Wall Art, XXL Desk Mats & Home Decor | Prints With Passion') {
    throw new Error('Title verification failed');
  }

  // 1.2 Meta Description
  const metaMatch = homeHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const meta = (metaMatch?.[1] || '').trim();
  console.log(`Meta description: "${meta}"`);
  if (!meta.includes('archival framed canvas wall art') || !meta.includes('XXL stitched gaming desk mats')) {
    throw new Error('Meta description content verification failed');
  }
  if (meta.includes('&amp;quot;')) {
    throw new Error('Double escaped quotes found in meta description');
  }

  // 1.3 Exactly 1 H1
  const h1s = [...homeHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log(`H1 count: ${h1s.length}`);
  console.log(`H1 text:`, h1s);
  if (h1s.length !== 1) {
    throw new Error(`Expected exactly 1 H1, found ${h1s.length}`);
  }
  if (!h1s[0].includes('Canvas Wall Art')) {
    throw new Error('H1 missing commercial keywords');
  }

  // 1.4 Auth link
  const malformedAuth = [...homeHtml.matchAll(/href=["']\/https:\/\/printswithpassion\.com\/customer_authentication/gi)];
  console.log(`Malformed auth links: ${malformedAuth.length}`);
  if (malformedAuth.length > 0) {
    throw new Error('Malformed auth links found');
  }

  // 1.5 Typo on Homepage
  const homeTypos = [...homeHtml.matchAll(/printswithpasssion/gi)];
  console.log(`Homepage typo count: ${homeTypos.length}`);
  if (homeTypos.length > 0) {
    throw new Error('Email typo found on homepage');
  }

  // Test 2: Delivery & Return Page Typo Check
  const delivRes = await fetch(`https://printswithpassion.com/pages/delivery-return?_test=${ts}`);
  const delivHtml = await delivRes.text();
  const delivTypos = [...delivHtml.matchAll(/printswithpasssion/gi)];
  console.log(`/pages/delivery-return typo count: ${delivTypos.length}`);
  if (delivTypos.length > 0) {
    throw new Error('Email typo found on /pages/delivery-return');
  }
  const delivCorrect = [...delivHtml.matchAll(/printswithpassionbc@gmail\.com/gi)];
  console.log(`/pages/delivery-return correct email occurrences: ${delivCorrect.length}`);
  if (delivCorrect.length < 2) {
    throw new Error('Correct email missing on /pages/delivery-return');
  }

  // Test 3: Parent Collections Hub Check
  const parents = ['canvas-prints', 'desk-mats', 'pillow-cases', 'blankets', 'bath-mats', 'apparel'];
  const subs = JSON.parse(fs.readFileSync(path.join(__dirname, 'phase2_40_subcollections.json'), 'utf8'));

  for (const p of parents) {
    const res = await fetch(`https://printswithpassion.com/collections/${p}?_test=${ts}`);
    const html = await res.text();
    if (!html.includes('pwp-curated-hub')) {
      throw new Error(`Hub missing on /collections/${p}`);
    }
    let missing = 0;
    for (const s of subs) {
      if (!html.includes(`/collections/${s.handle}`)) {
        missing++;
      }
    }
    console.log(`/collections/${p}: Hub present, ${subs.length - missing}/${subs.length} sub-collections verified`);
    if (missing > 0) {
      throw new Error(`Missing sub-collections on /collections/${p}`);
    }
  }

  // Test 4: Negative Check - Subcollection should NOT have Hub
  const subRes = await fetch(`https://printswithpassion.com/collections/nature-mountain-landscape-canvas-wall-art?_test=${ts}`);
  const subHtml = await subRes.text();
  const hasHubOnSub = subHtml.includes('pwp-curated-hub');
  console.log(`Negative check: Hub present on sub-collection: ${hasHubOnSub} (Expected: false)`);
  if (hasHubOnSub) {
    throw new Error('Hub should not render on sub-collections!');
  }

  console.log('\n--- ALL INDEPENDENT VERIFICATION CHECKS PASSED PERFECTLY! ---');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
