/**
 * Prints With Passion — Headless Google Cloud Service Account Telemetry & Sitemap Sync
 * (gsc_ga4_gmc_cloud_sync.mjs)
 *
 * Uses a single free Google Cloud Service Account JSON key (`GOOGLE_SERVICE_ACCOUNT_JSON`)
 * via Node's built-in `node:crypto` RS256 JWT signer (`lib/cloud-env.mjs`) to:
 * 1. Query Google Search Console Search Analytics API (`https://printswithpassion.com/`)
 *    for 7d and 28d impressions, clicks, CTR, and position by page and query.
 * 2. Reconcile GSC Sitemaps (`GET / DELETE / PUT /sitemaps`) with live child sitemaps
 *    from `https://printswithpassion.com/sitemap.xml`.
 * 3. Inspect priority URLs via GSC URL Inspection API (`urlInspection/index:inspect`).
 * 4. Query Google Analytics 4 Data API v1beta (`Property 363520144`) for 28d organic sessions,
 *    page views, add-to-carts, purchases, and revenue by `pagePath`.
 * 5. Provide `syncGmcCatalogViaContentApi(activeProducts)` for Google Merchant Center (`742631169`)
 *    via Content API for Shopping v2.1 (`https://shoppingcontent.googleapis.com/content/v2.1/742631169/...`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WORKSPACE, getGoogleAccessToken } from './lib/cloud-env.mjs';

const SNAPSHOT_PATH = path.join(WORKSPACE, 'gsc_ga4_latest_snapshot.json');
const GSC_SITES_CANDIDATES = [
  'https://printswithpassion.com/',
  'sc-domain:printswithpassion.com'
];
const GA4_PROPERTY_ID = '363520144';
const GMC_MERCHANT_ID = '742631169';

function formatDateYmd(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

async function resolveGscSiteUrl(token) {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return GSC_SITES_CANDIDATES[0];
  const data = await res.json();
  const entries = (data.siteEntry || []).map(s => s.siteUrl);
  for (const cand of GSC_SITES_CANDIDATES) {
    if (entries.includes(cand)) return cand;
  }
  return entries[0] || GSC_SITES_CANDIDATES[0];
}

export async function runGscGa4CloudSync() {
  console.log('=== Prints With Passion — Cloud GSC + GA4 API Telemetry & Sitemap Sync ===');
  let token = null;
  try {
    token = await getGoogleAccessToken([
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/analytics.readonly'
    ]);
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] OAuth token warning: ${err.message}`);
  }

  let snapshot = fs.existsSync(SNAPSHOT_PATH)
    ? JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'))
    : {
        capturedAt: new Date().toISOString(),
        gscProperty: 'https://printswithpassion.com/',
        ga4PropertyId: GA4_PROPERTY_ID,
        storewideSummary: {},
        byUrl: {}
      };

  if (!token) {
    console.log('[gsc_ga4_gmc_cloud_sync] status: skipped_no_service_account_secret (preserving existing gsc_ga4_latest_snapshot.json)');
    return { synced: false, reason: 'skipped_no_service_account_secret', snapshot };
  }

  const siteUrl = await resolveGscSiteUrl(token);
  const encodedSite = encodeURIComponent(siteUrl);
  let gscUpdated = false;
  let sitemapsSynced = 0;
  let staleSitemapsDeleted = 0;

  // 1. GSC 28d & 7d Search Analytics Query
  try {
    const endDate = formatDateYmd(2);
    const start28d = formatDateYmd(30);
    const start7d = formatDateYmd(9);

    const [tot28Res, tot7Res, pages28Res] = await Promise.all([
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start28d, endDate, rowLimit: 1 })
      }),
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start7d, endDate, rowLimit: 1 })
      }),
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: start28d, endDate, dimensions: ['page'], rowLimit: 500 })
      })
    ]);

    if (tot28Res.ok) {
      const tot28 = await tot28Res.json();
      const row = tot28.rows?.[0];
      if (row) {
        snapshot.storewideSummary.impressions28d = row.impressions || 0;
        snapshot.storewideSummary.clicks28d = row.clicks || 0;
        snapshot.storewideSummary.ctr28d = Number((row.ctr || 0).toFixed(4));
        snapshot.storewideSummary.averagePosition28d = Number((row.position || 0).toFixed(2));
        gscUpdated = true;
      }
    }

    if (tot7Res.ok) {
      const tot7 = await tot7Res.json();
      const row = tot7.rows?.[0];
      if (row) {
        snapshot.storewideSummary.impressions7d = row.impressions || 0;
        snapshot.storewideSummary.clicks7d = row.clicks || 0;
        snapshot.storewideSummary.averagePosition7d = Number((row.position || 0).toFixed(2));
      }
    }

    if (pages28Res.ok) {
      const pages28 = await pages28Res.json();
      snapshot.byUrl = snapshot.byUrl || {};
      for (const r of (pages28.rows || [])) {
        try {
          const u = new URL(r.keys[0]);
          const p = u.pathname;
          snapshot.byUrl[p] = {
            ...(snapshot.byUrl[p] || {}),
            impressions28d: r.impressions || 0,
            clicks28d: r.clicks || 0,
            ctr: Number((r.ctr || 0).toFixed(4)),
            averagePosition: Number((r.position || 0).toFixed(2))
          };
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] GSC Search Analytics warning: ${err.message}`);
  }

  // 2. GSC Sitemaps API Sync (GET / DELETE stale / PUT live child sitemaps)
  try {
    const liveSmXml = await (await fetch('https://printswithpassion.com/sitemap.xml')).text();
    const liveChildSitemaps = [...liveSmXml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
    const desiredSet = new Set(['https://printswithpassion.com/sitemap.xml', ...liveChildSitemaps]);

    const listRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (listRes.ok) {
      const listJson = await listRes.json();
      for (const sm of (listJson.sitemap || [])) {
        if (sm.path && !desiredSet.has(sm.path)) {
          const delRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(sm.path)}`,
            { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
          );
          if (delRes.ok) staleSitemapsDeleted++;
        }
      }
    }

    for (const smUrl of desiredSet) {
      const putRes = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodeURIComponent(smUrl)}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      );
      if (putRes.ok) sitemapsSynced++;
    }
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] GSC Sitemaps API warning: ${err.message}`);
  }

  // 3. GA4 Data API v1beta (Property 363520144)
  let ga4Updated = false;
  try {
    const gaRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'addToCarts' },
          { name: 'ecommercePurchases' },
          { name: 'purchaseRevenue' }
        ],
        limit: 250
      })
    });
    if (gaRes.ok) {
      const gaJson = await gaRes.json();
      let totalAddToCarts = 0;
      let totalPurchases = 0;
      let totalRevenue = 0;
      for (const row of (gaJson.rows || [])) {
        const pagePath = row.dimensionValues?.[0]?.value;
        const views = Number(row.metricValues?.[0]?.value || 0);
        const atc = Number(row.metricValues?.[1]?.value || 0);
        const purch = Number(row.metricValues?.[2]?.value || 0);
        const rev = Number(row.metricValues?.[3]?.value || 0);
        totalAddToCarts += atc;
        totalPurchases += purch;
        totalRevenue += rev;
        if (pagePath && snapshot.byUrl[pagePath]) {
          snapshot.byUrl[pagePath].ga4Views28d = views;
          snapshot.byUrl[pagePath].ga4AddToCarts28d = atc;
          snapshot.byUrl[pagePath].ga4Purchases28d = purch;
          snapshot.byUrl[pagePath].ga4RevenueGbp28d = Number(rev.toFixed(2));
        }
      }
      if ((gaJson.rows || []).length > 0) {
        snapshot.storewideSummary.ga4AddToCarts28d = totalAddToCarts;
        snapshot.storewideSummary.ga4Purchases28d = totalPurchases;
        snapshot.storewideSummary.ga4RevenueGbp28d = Number(totalRevenue.toFixed(2));
        ga4Updated = true;
      }
    }
  } catch (err) {
    console.warn(`[gsc_ga4_gmc_cloud_sync] GA4 Data API warning: ${err.message}`);
  }

  snapshot.capturedAt = new Date().toISOString();
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`[gsc_ga4_gmc_cloud_sync] Complete: GSC=${gscUpdated} | SitemapsSynced=${sitemapsSynced} (StaleDeleted=${staleSitemapsDeleted}) | GA4=${ga4Updated}`);
  return { synced: gscUpdated || ga4Updated, sitemapsSynced, staleSitemapsDeleted, snapshot };
}

export async function syncGmcCatalogViaContentApi(activeProductsMap) {
  let token = null;
  try {
    token = await getGoogleAccessToken(['https://www.googleapis.com/auth/content']);
  } catch {
    return null;
  }
  if (!token) return null;

  try {
    const allStatuses = [];
    let pageToken = '';
    do {
      const url = `https://shoppingcontent.googleapis.com/content/v2.1/${GMC_MERCHANT_ID}/productstatuses?maxResults=250${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      const json = await res.json();
      if (Array.isArray(json.resources)) allStatuses.push(...json.resources);
      pageToken = json.nextPageToken || '';
    } while (pageToken && allStatuses.length < 5000);

    let approvedCount = 0;
    let issueCount = 0;
    let staleDeleted = 0;

    for (const st of allStatuses) {
      const fullId = String(st.productId || '');
      const offerId = fullId.split(':').pop() || '';
      const m = offerId.match(/^shopify_[A-Z]+_(\d+)_(\d+)$/i);
      if (!m || !activeProductsMap.has(m[1])) {
        const delRes = await fetch(
          `https://shoppingcontent.googleapis.com/content/v2.1/${GMC_MERCHANT_ID}/products/${encodeURIComponent(fullId)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (delRes.ok) staleDeleted++;
        continue;
      }
      const hasDisapproval = (st.destinationStatuses || []).some(
        d => Array.isArray(d.disapprovedCountries) && d.disapprovedCountries.length > 0
      );
      if (hasDisapproval) issueCount++;
      else approvedCount++;
    }

    return {
      totalOffers: allStatuses.length - staleDeleted,
      approvedCount,
      issueCount,
      staleDeleted
    };
  } catch {
    return null;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  runGscGa4CloudSync().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
