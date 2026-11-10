#!/usr/bin/env node
/**
 * Prints With Passion (printswithpassion.com) — Headless Cloud GSC, GA4 & GMC Sync
 *
 * Uses the shared free Google Cloud Service Account (`GCP_SERVICE_ACCOUNT_JSON`) to pull:
 *   1. Google Search Console (`sc-domain:printswithpassion.com`) 28d/7d Search Analytics & Sitemaps
 *   2. Google Analytics 4 (`363520144`) 28d sessions & e-commerce funnel events
 *   3. Google Merchant Center (`742631169`) `productstatuses.list` Free Listings approval status
 *
 * Writes updated telemetry to `gsc_ga4_latest_snapshot.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hasServiceAccountCredentials,
  getServiceAccountEmail,
  fetchGscSearchAnalytics,
  submitGscSitemap,
  fetchGa4FunnelReport,
  fetchGmcProductStatuses,
  formatIsoDateDaysAgo
} from './lib/google-cloud-api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, 'gsc_ga4_latest_snapshot.json');

const GSC_SITE_URL = process.env.PWP_GSC_SITE_URL || 'https://printswithpassion.com/';
const GA4_PROPERTY_ID = process.env.PWP_GA4_PROPERTY_ID || '363520144';
const GMC_MERCHANT_ID = process.env.PWP_GMC_MERCHANT_ID || '742631169';

async function runPwpCloudSync() {
  if (!hasServiceAccountCredentials()) {
    console.log('ℹ️  [PWP Cloud GSC/GA4/GMC Sync] GCP_SERVICE_ACCOUNT_JSON not set — using cached gsc_ga4_latest_snapshot.json.');
    return;
  }

  console.log(`[PWP Cloud GSC/GA4/GMC Sync] Authenticated as ${getServiceAccountEmail()}`);
  const nowIso = new Date().toISOString();
  const endDate = formatIsoDateDaysAgo(2);
  const start28d = formatIsoDateDaysAgo(30);

  let snapshot = { capturedAt: nowIso, gscRows: [], ga4Summary: {}, gmcSummary: {} };
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try {
      snapshot = { ...snapshot, ...JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')) };
    } catch {}
  }

  try {
    const rows = await fetchGscSearchAnalytics({
      siteUrl: GSC_SITE_URL,
      startDate: start28d,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 1000
    });
    snapshot.gscRows = rows;
    console.log(`✅ [PWP Cloud GSC] Pulled ${rows.length} query/page rows for ${GSC_SITE_URL}.`);
    await submitGscSitemap({ siteUrl: GSC_SITE_URL, feedpath: 'https://printswithpassion.com/sitemap.xml' }).catch(() => {});
  } catch (err) {
    console.warn(`[PWP Cloud GSC] Notice: ${err.message}`);
  }

  try {
    const ga4 = await fetchGa4FunnelReport({
      propertyId: GA4_PROPERTY_ID,
      keyEventNames: ['view_item', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'purchase']
    });
    snapshot.ga4Summary = { capturedAt: nowIso, ...ga4.summary, events: ga4.events };
    console.log(`✅ [PWP Cloud GA4] ${ga4.summary.activeUsers} active users, ${ga4.summary.sessions} sessions.`);
  } catch (err) {
    console.warn(`[PWP Cloud GA4] Notice: ${err.message}`);
  }

  try {
    const statuses = await fetchGmcProductStatuses({ merchantId: GMC_MERCHANT_ID });
    let approved = 0;
    let disapproved = 0;
    for (const s of statuses) {
      const dests = s.destinationStatuses || [];
      if (dests.some((d) => d.status === 'disapproved')) disapproved++;
      else approved++;
    }
    snapshot.gmcSummary = {
      capturedAt: nowIso,
      merchantId: GMC_MERCHANT_ID,
      totalChecked: statuses.length,
      approved,
      disapproved
    };
    console.log(`✅ [PWP Cloud GMC] Checked ${statuses.length} offers in GMC ${GMC_MERCHANT_ID} (Approved=${approved}, Disapproved=${disapproved}).`);
  } catch (err) {
    console.warn(`[PWP Cloud GMC] Notice: ${err.message}`);
  }

  snapshot.capturedAt = nowIso;
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
}

runPwpCloudSync().catch((err) => {
  console.error(err);
  process.exit(1);
});
