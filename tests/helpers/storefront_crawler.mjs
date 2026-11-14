/**
 * Storefront HTTP Crawler & HTML Parser Helper
 *
 * Provides resilient HTTP fetching with User-Agent spoofing, redirect inspection,
 * latency measurement, and robust zero-dependency HTML parsing for opaque-box SEO testing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

export const USER_AGENTS = {
  desktop_chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  googlebot_mobile: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  googlebot_desktop: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
};

let storefrontNextSlot = 0;
let storefrontQueue = Promise.resolve();

export async function enforceStorefrontPacing(pacingMs = 150) {
  if (pacingMs <= 0) return;
  const prevSlot = storefrontQueue;
  let release;
  storefrontQueue = new Promise(resolve => { release = resolve; });

  await prevSlot;

  try {
    const now = Date.now();
    const waitTime = Math.max(0, storefrontNextSlot - now);
    if (waitTime > 0) {
      await new Promise(r => setTimeout(r, waitTime));
    }
    storefrontNextSlot = Date.now() + pacingMs;
  } finally {
    release();
  }
}

let sitemapIndexCache = null;
let sitemapCacheTime = 0;

/**
 * Dynamically queries sitemap.xml to extract all child sitemap <loc> URLs
 * with XML &amp; unescaped to &.
 */
export async function getSitemapIndex(baseUrl = 'https://printswithpassion.com', options = {}) {
  const rootUrl = `${baseUrl.replace(/\/$/, '')}/sitemap.xml`;
  const res = await fetchUrl(rootUrl, { ...options, _skipSitemapResolve: true });
  if (res.status !== 200) {
    throw new Error(`Failed to fetch sitemap index from ${rootUrl}: HTTP ${res.status}`);
  }
  const matches = [...res.body.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)];
  return matches.map(m => m[1].replace(/&amp;/g, '&').trim());
}

/**
 * Resolves a bare child sitemap filename to its live partitioned URL with query params
 */
export async function resolveChildSitemapUrl(urlOrPattern, options = {}) {
  if (options.dryRun || urlOrPattern.includes('?')) return urlOrPattern;

  const matchChild = urlOrPattern.match(/(sitemap_[a-z]+_\d+\.xml)/i);
  if (!matchChild) return urlOrPattern;

  const childFilename = matchChild[1];
  const now = Date.now();
  if (!sitemapIndexCache || (now - sitemapCacheTime > 60000)) {
    try {
      sitemapIndexCache = await getSitemapIndex('https://printswithpassion.com', options);
      sitemapCacheTime = now;
    } catch {
      return urlOrPattern;
    }
  }

  const found = sitemapIndexCache.find(loc => loc.includes(childFilename));
  return found || urlOrPattern;
}

/**
 * Fetch a URL with configurable User-Agent, redirect manual handling, timeout, dynamic sitemap resolution, and dry-run support.
 */
export async function fetchUrl(url, options = {}) {
  const {
    userAgent = 'desktop_chrome',
    redirect = 'manual',
    timeout = 10000,
    dryRun = false,
    mockResponses = null,
    pacingMs = 150,
    maxRetries = 2,
    _retryCount = 0,
    _skipSitemapResolve = false
  } = options;

  let targetUrl = url;
  if (!dryRun && !_skipSitemapResolve) {
    targetUrl = await resolveChildSitemapUrl(url, options);
  }

  // If in dry-run mode, serve from recorded fixtures or mock table
  if (dryRun) {
    return serveDryRunResponse(targetUrl, { redirect, mockResponses });
  }

  // Enforce queue pacing for live HTTP requests
  await enforceStorefrontPacing(pacingMs);

  const uaHeader = USER_AGENTS[userAgent] || userAgent;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const startTime = Date.now();

  try {
    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': uaHeader,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect,
      signal: controller.signal
    });

    const latencyMs = Date.now() - startTime;
    clearTimeout(timer);

    // Auto-retry on HTTP 429 with backoff
    if (res.status === 429 && _retryCount < maxRetries) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '2', 10);
      await new Promise(r => setTimeout(r, Math.max(1000, retryAfter * 1000)));
      return fetchUrl(targetUrl, { ...options, _retryCount: _retryCount + 1 });
    }

    const location = res.headers.get('location') || '';
    let body = '';
    if (res.status === 200 || res.status === 404) {
      body = await res.text();
    }

    return {
      url: targetUrl,
      status: res.status,
      statusText: res.statusText,
      location,
      headers: Object.fromEntries(res.headers.entries()),
      body,
      latencyMs
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      if (_retryCount < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchUrl(targetUrl, { ...options, _retryCount: _retryCount + 1 });
      }
      throw new Error(`Request to ${targetUrl} timed out after ${timeout}ms`);
    }
    throw err;
  }
}

/**
 * Serves deterministic responses during offline/dry-run test execution
 */
function serveDryRunResponse(url, { redirect, mockResponses }) {
  if (mockResponses && mockResponses[url]) {
    return {
      url,
      status: mockResponses[url].status ?? 200,
      statusText: 'OK',
      location: mockResponses[url].location ?? '',
      headers: mockResponses[url].headers ?? {},
      body: mockResponses[url].body ?? '',
      latencyMs: 12
    };
  }

  const cleanUrl = url.replace('https://printswithpassion.com', '') || '/';

  // 1. Check legacy redirects
  const legacyRedirects = {
    '/collections/dog-collars': '/collections/apparel',
    '/collections/laundry-bags': '/collections/apparel',
    '/collections/duffle-bags': '/collections/apparel',
    '/collections/clutch-bags': '/collections/apparel',
    '/collections/phone-cases': '/collections/desk-mats',
    '/collections/beach-towels': '/collections/bath-mats',
    '/collections/mugs': '/collections/canvas-prints',
    '/collections/journals': '/collections/canvas-prints',
    '/collections/wall-tapestry': '/collections/canvas-prints',
    '/collections/puzzles': '/collections/canvas-prints',
    '/collections/shoes': '/collections/apparel',
    '/collections/hats': '/collections/apparel',
    '/collections/bottles': '/collections/canvas-prints',
    '/collections/tote-bags': '/collections/apparel',
    '/collections/suitcases': '/collections/apparel',
    '/collections/yoga-mats': '/collections/bath-mats',
    '/collections/makeup-bags': '/collections/apparel',
    '/collections/coasters': '/collections/desk-mats',
    '/collections/pet-mat': '/collections/bath-mats',
    '/collections/bottle-opener': '/collections/canvas-prints',
    '/collections/pet-bowls': '/collections/bath-mats',
    '/collections/bags': '/collections/apparel',
    '/collections/bags-1': '/collections/apparel',
    '/collections/pets-animals': '/collections/canvas-prints',
    '/collections/can-cooler': '/collections/canvas-prints',
    '/collections/posters': '/collections/canvas-prints',
    '/collections/rugs': '/collections/bath-mats',
    '/collections/mousepads': '/collections/desk-mats'
  };

  if (legacyRedirects[cleanUrl]) {
    return {
      url,
      status: 301,
      statusText: 'Moved Permanently',
      location: legacyRedirects[cleanUrl],
      headers: { location: legacyRedirects[cleanUrl] },
      body: '',
      latencyMs: 5
    };
  }

  // 2. Check sitemaps
  const cleanPath = cleanUrl.split('?')[0];
  if (cleanPath.endsWith('.xml')) {
    const sitemapFixture = path.join(FIXTURES_DIR, 'sitemaps_sample.xml');
    if (fs.existsSync(sitemapFixture)) {
      const content = fs.readFileSync(sitemapFixture, 'utf8');
      return {
        url,
        status: 200,
        statusText: 'OK',
        location: '',
        headers: { 'content-type': 'application/xml; charset=utf-8' },
        body: content,
        latencyMs: 8
      };
    }
  }

  // 3. Homepage or generic HTML fixture
  const homepageFixture = path.join(FIXTURES_DIR, 'homepage_sample.html');
  let body = '';
  if (fs.existsSync(homepageFixture)) {
    body = fs.readFileSync(homepageFixture, 'utf8');
  }

  // If specific subpage, synthesize minimal compliant DOM if needed
  if (cleanUrl.startsWith('/pages/')) {
    const handle = cleanUrl.replace('/pages/', '');
    body = `<!DOCTYPE html><html lang="en"><head>
      <title>${handle.replace(/-/g, ' ')} | Prints With Passion</title>
      <meta name="description" content="Explore our ${handle.replace(/-/g, ' ')} guide covering sizing, materials, framing options, and care instructions for your UK home decor.">
      <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
    </head><body>
      <h1>${handle.replace(/-/g, ' ')}</h1>
      <div class="page-content">
        <h2>Pillar Overview & Buyer's Guide</h2>
        <p>Comprehensive guide for UK decor enthusiasts with contact support at printswithpassionbc@gmail.com.</p>
      </div>
    </body></html>`;
  } else if (cleanUrl.startsWith('/blogs/news/')) {
    const handle = cleanUrl.replace('/blogs/news/', '');
    body = `<!DOCTYPE html><html lang="en"><head>
      <title>UK Desk Mat Sizing Guide: 60x35 vs 80x40 XXL | PWP</title>
      <meta name="description" content="Discover precision desk mat comparisons and sizing rules for ergonomic desk setups with archival micro-weave gaming pads. Free UK delivery on all orders.">
      <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
    </head><body>
      <h1>UK Desk Mat Sizing & Buyer's Guide</h1>
      <div class="article-content">
        <p>Check out our <a href="/collections/japanese-anime-desk-mats">Japanese Anime Desk Mats</a> and <a href="/blogs/news/uk-student-room-rental-flat-decor-guide">Student Flat Decor Guide</a>.</p>
      </div>
    </body></html>`;
  } else if (cleanUrl.startsWith('/collections/')) {
    const handle = cleanUrl.replace('/collections/', '');
    if (handle === 'japanese-anime-desk-mats') {
      body = `<!DOCTYPE html><html lang="en"><head>
        <title>Japanese Anime Desk Mats | 900x400 XXL Stitched Gaming Pads</title>
        <meta name="description" content="Shop Japanese anime desk mats in 900x400x4mm extended XXL dimensions with precision micro-weave surface, non-slip rubber base and edge stitching.">
        <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
      </head><body>
        <h1>Japanese Anime Desk Mats</h1>
        <div class="pwp-curated-collections-hub"></div>
      </body></html>`;
    } else if (handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
      body = `<!DOCTYPE html><html lang="en"><head>
        <title>Bauhaus & Minimalist Canvas Art | 1.25" Framed Wall Prints</title>
        <meta name="description" content="Discover Bauhaus and minimalist archival canvas wall art framed in solid 1.25-inch pine stretcher bars. Free UK delivery on curated studio art prints.">
        <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
      </head><body>
        <h1>Bauhaus & Minimalist Canvas Art</h1>
      </body></html>`;
    } else if (handle === 'avada-upsell-best-sellers') {
      body = `<!DOCTYPE html><html lang="en"><head>
        <title>AVADA Upsell Best Sellers</title>
        <meta name="robots" content="noindex, follow">
      </head><body><h1>Best Sellers</h1></body></html>`;
    } else if (handle === 'desk-mats') {
      body = `<!DOCTYPE html><html lang="en"><head>
        <title>Gaming Desk Mats | 4mm XXL Stitched Extended Desk Pads</title>
        <meta name="description" content="Shop 4mm thick XXL stitched gaming desk mats in 900x400mm dimensions. Precision micro-weave cloth surface, anti-slip rubber base and free tracked UK delivery.">
        <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
      </head><body>
        <h1>Gaming Desk Mats</h1>
        <div class="pwp-curated-collections-hub"></div>
      </body></html>`;
    } else {
      const name = handle.replace(/-/g, ' ');
      body = `<!DOCTYPE html><html lang="en"><head>
        <title>${name.charAt(0).toUpperCase() + name.slice(1)} | Prints With Passion</title>
        <meta name="description" content="Explore our ${name} collection featuring museum grade archival materials, non-slip rubber construction and durable framing. Free tracked UK delivery.">
        <link rel="canonical" href="https://printswithpassion.com${cleanUrl}">
      </head><body>
        <h1>${name.charAt(0).toUpperCase() + name.slice(1)}</h1>
        <div class="pwp-curated-collections-hub"></div>
      </body></html>`;
    }
  }

  return {
    url,
    status: 200,
    statusText: 'OK',
    location: '',
    headers: { 'content-type': 'text/html; charset=utf-8' },
    body,
    latencyMs: 10
  };
}

const HTML_ENTITY_MAP = {
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&'
};

/**
 * Single-pass HTML entity decoder preventing recursive double-unescaping
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  return str.replace(/&(?:quot|#39|apos|lt|gt|amp);/gi, match => {
    return HTML_ENTITY_MAP[match.toLowerCase()] || match;
  });
}

/**
 * Extracts raw, verbatim meta description content attribute without decoding
 */
export function extractRawMetaDescription(html) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  return match ? match[1].trim() : '';
}

/**
 * Extracts and decodes the <title> tag text from raw HTML using single-pass decoding
 */
export function extractTitle(html, options = {}) {
  if (!html) return '';
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) return '';
  if (options.raw) {
    return match[1].trim();
  }
  return decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts the meta description content from raw HTML
 */
export function extractMetaDescription(html, options = {}) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (!match) return '';
  if (options.raw) {
    return match[1].trim();
  }
  return decodeHtmlEntities(match[1]).replace(/\s+/g, ' ').trim();
}

/**
 * Extracts all <h1> text contents from raw HTML, stripping any nested HTML markup
 */
export function extractH1s(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  return matches.map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

/**
 * Extracts all <a> tags with href and text
 */
export function extractLinks(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const links = [];
  for (const m of matches) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      const isInternal = href.startsWith('/') || href.startsWith('https://printswithpassion.com');
      links.push({ href, text, isInternal, rawAttrs: attrs });
    }
  }
  return links;
}

/**
 * Extracts canonical link href
 */
export function extractCanonical(html) {
  if (!html) return '';
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
                html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  return match ? match[1].trim() : '';
}

/**
 * Extracts robots meta content
 */
export function extractRobots(html) {
  if (!html) return '';
  const match = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  return match ? match[1].trim() : '';
}

/**
 * Extracts and parses JSON-LD script blocks
 */
export function extractJsonLd(html) {
  if (!html) return [];
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const results = [];
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      results.push(parsed);
    } catch {}
  }
  return results;
}
