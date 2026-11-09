#!/usr/bin/env node
/**
 * Prints With Passion (bpcprints) — Dual-Mode Cloud & Local Shopify Admin GraphQL Client
 *
 * Cloud Mode (Preferred, Zero Expiry):
 *   When `process.env.SHOPIFY_ADMIN_ACCESS_TOKEN` (`shpat_...`) is set, sends requests directly to:
 *   `https://bpcprints.myshopify.com/admin/api/2025-10/graphql.json`
 *   with header `X-Shopify-Access-Token: shpat_...` (never expires, no browser cookie required).
 *
 * Local Fallback Mode:
 *   Reads `fresh_auth_20261028.json` and calls `https://admin.shopify.com/api/shopify/bpcprints`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_LOCAL_AUTH = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\brain\\07bfb7d6-9234-4f9d-b17c-a75686424c5d\\scratch\\fresh_auth_20261028.json';
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'bpcprints.myshopify.com';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

export function hasShopifyCloudToken() {
  const tok = (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN || '').trim();
  return tok.startsWith('shpat_') || tok.startsWith('shpca_') || tok.length > 20;
}

export async function shopifyCloudGql(query, variables = {}) {
  const adminToken = (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN || '').trim();
  if (adminToken) {
    const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(25000)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Shopify Admin API error (HTTP ${res.status}): ${txt.slice(0, 240)}`);
    }
    const json = await res.json();
    return json.data;
  }

  // Fallback to local fresh_auth_20261028.json
  const authPath = process.env.PWP_AUTH_PATH || DEFAULT_LOCAL_AUTH;
  if (!fs.existsSync(authPath)) {
    throw new Error('Neither SHOPIFY_ADMIN_ACCESS_TOKEN nor local fresh_auth_20261028.json found.');
  }
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const res = await fetch('https://admin.shopify.com/api/shopify/bpcprints', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Cookie: auth.shopifyCookie,
      'x-csrf-token': auth.shopifyCsrf,
      Origin: 'https://admin.shopify.com',
      Referer: 'https://admin.shopify.com/store/bpcprints'
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(25000)
  });
  const json = await res.json();
  return json.data;
}
