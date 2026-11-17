import fs from 'fs';
import { SUBCOLLECTIONS_PATH } from './lib/cloud-env.mjs';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow'
];

const CORE_PARENT_HUB_PATHS = [
  '/collections/desk-mats',
  '/collections/canvas-prints',
  '/collections/blankets',
  '/collections/pillow-cases',
  '/collections/bath-mats',
  '/collections/t-shirts',
  '/collections/hoodies'
];

const CORE_PAGE_PATHS = [
  '/pages/desk-size-visualizer',
  '/pages/free-4k-wallpapers',
  '/pages/ai-catalog-directory',
  '/pages/desk-setup-hardware-compatibility-guide',
  '/pages/studio-quality-vs-generic-prints',
  '/pages/trade-and-bulk-orders',
  '/pages/studio-lookbook-social-feed'
];

async function archiveOnWaybackWithRetry(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const wbRes = await fetch(`https://web.archive.org/save/${url}`, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PrintsWithPassionArchiver/1.0)' }
      });
      if (wbRes.status < 500 || attempt === 2) {
        return wbRes.status;
      }
    } catch (e) {
      if (attempt === 2) return e.message;
    }
    await sleep(3000);
  }
  return 520;
}

async function main() {
  console.log('=== Pinging Multi-Engine IndexNow (IndexNow, Bing, Yandex), Google WebSub & Paced Wayback SavePageNow for Core Hubs, 48 Sub-Collections & Latest Blogs ===');
  const atomRes = await fetch('https://printswithpassion.com/blogs/news.atom', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PrintsWithPassionSEO/1.0)' }
  });
  const atomXml = await atomRes.text();
  const blogUrls = [...new Set(
    [...atomXml.matchAll(/https:\/\/printswithpassion\.com\/blogs\/news\/[a-z0-9-]+/gi)].map(m => m[0])
  )].slice(0, 10);

  let subCollectionUrls = [];
  try {
    if (fs.existsSync(SUBCOLLECTIONS_PATH)) {
      const subs = JSON.parse(fs.readFileSync(SUBCOLLECTIONS_PATH, 'utf8'));
      subCollectionUrls = subs
        .filter(s => s?.handle)
        .map(s => `https://printswithpassion.com/collections/${String(s.handle).trim()}`);
    }
  } catch (err) {
    console.warn(`[IndexNow] Could not read subcollections from ${SUBCOLLECTIONS_PATH}:`, err.message);
  }

  console.log(`Found ${blogUrls.length} latest published blog URLs and ${subCollectionUrls.length} Smart Sub-Collections.`);

  const KEY = '9c4e2f8a1b7d6e3c5a0f9b8d7e6f5a4c';
  const urlList = [...new Set([
    'https://printswithpassion.com/',
    'https://printswithpassion.com/en-nl',
    ...CORE_PARENT_HUB_PATHS.map(p => `https://printswithpassion.com${p}`),
    ...subCollectionUrls,
    ...CORE_PAGE_PATHS.map(p => `https://printswithpassion.com${p}`),
    'https://printswithpassion.com/blogs/news',
    ...blogUrls
  ])];

  console.log(`Submitting ${urlList.length} canonical & cleanup URLs to IndexNow endpoints...`);

  // 1. Multi-Endpoint IndexNow Fan-Out (api.indexnow.org, www.bing.com/indexnow, yandex.com/indexnow)
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const inRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'printswithpassion.com',
          key: KEY,
          keyLocation: `https://printswithpassion.com/${KEY}.txt`,
          urlList
        })
      });
      console.log(`  [IndexNow Fan-Out -> ${endpoint}] Submitted ${urlList.length} URLs -> HTTP ${inRes.status}`);
    } catch (e) {
      console.error(`  [IndexNow Fan-Out -> ${endpoint}] Error:`, e.message);
    }
  }

  // 2. Google WebSub Ping
  try {
    const wsRes = await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'hub.mode=publish&hub.url=' + encodeURIComponent('https://printswithpassion.com/blogs/news.atom')
    });
    console.log(`  [Google WebSub] /blogs/news.atom -> HTTP ${wsRes.status}`);
  } catch (e) {
    console.error('  [Google WebSub] Error:', e.message);
  }

  // 3. Paced Wayback SavePageNow on Top 2 Newest Blog URLs (3,000ms pacing + retry)
  for (let i = 0; i < Math.min(2, blogUrls.length); i++) {
    if (i > 0) await sleep(3000);
    const u = blogUrls[i];
    const status = await archiveOnWaybackWithRetry(u);
    console.log(`  [Wayback SavePageNow (3,000ms Paced)] ${u} -> HTTP ${status}`);
  }
}

main().catch(console.error);
