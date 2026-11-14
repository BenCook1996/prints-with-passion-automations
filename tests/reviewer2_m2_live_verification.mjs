/**
 * Reviewer 2 Independent Verification Suite for Milestone 2 (Requirement R2)
 * File: tests/reviewer2_m2_live_verification.mjs
 */

import { shopifyGraphQL, SHOP_DOMAIN } from '../lib/cloud-env.mjs';

const PRIMARY_DOMAIN = 'printswithpassion.com';

const DISCONTINUED_28_COLLECTIONS = [
  { handle: 'dog-collars', id: 'gid://shopify/Collection/484418421047', target: '/collections/animals-wildlife' },
  { handle: 'laundry-bags', id: 'gid://shopify/Collection/486062588215', target: '/collections/apparel' },
  { handle: 'duffle-bags', id: 'gid://shopify/Collection/486062391607', target: '/collections/apparel' },
  { handle: 'clutch-bags', id: 'gid://shopify/Collection/486062653751', target: '/collections/apparel' },
  { handle: 'phone-cases', id: 'gid://shopify/Collection/484418224439', target: '/collections/home-living' },
  { handle: 'beach-towels', id: 'gid://shopify/Collection/444874228023', target: '/collections/bath-mats' },
  { handle: 'mugs', id: 'gid://shopify/Collection/491112530231', target: '/collections/home-living' },
  { handle: 'journals', id: 'gid://shopify/Collection/484418683191', target: '/collections/home-living' },
  { handle: 'wall-tapestry', id: 'gid://shopify/Collection/484716183863', target: '/collections/canvas-prints' },
  { handle: 'puzzles', id: 'gid://shopify/Collection/485993447735', target: '/collections/home-living' },
  { handle: 'shoes', id: 'gid://shopify/Collection/486062424375', target: '/collections/apparel' },
  { handle: 'hats', id: 'gid://shopify/Collection/486062522679', target: '/collections/apparel' },
  { handle: 'bottles', id: 'gid://shopify/Collection/486062719287', target: '/collections/home-living' },
  { handle: 'tote-bags', id: 'gid://shopify/Collection/491049681207', target: '/collections/apparel' },
  { handle: 'suitcases', id: 'gid://shopify/Collection/491068031287', target: '/collections/apparel' },
  { handle: 'yoga-mats', id: 'gid://shopify/Collection/491090837815', target: '/collections/bath-mats' },
  { handle: 'makeup-bags', id: 'gid://shopify/Collection/491806064951', target: '/collections/home-living' },
  { handle: 'coasters', id: 'gid://shopify/Collection/491808457015', target: '/collections/home-living' },
  { handle: 'pet-mat', id: 'gid://shopify/Collection/491808620855', target: '/collections/bath-mats' },
  { handle: 'bottle-opener', id: 'gid://shopify/Collection/491808817463', target: '/collections/home-living' },
  { handle: 'pet-bowls', id: 'gid://shopify/Collection/491808981303', target: '/collections/animals-wildlife' },
  { handle: 'bags', id: 'gid://shopify/Collection/484418289975', target: '/collections/apparel' },
  { handle: 'bags-1', id: 'gid://shopify/Collection/494964998455', target: '/collections/apparel' },
  { handle: 'pets-animals', id: 'gid://shopify/Collection/495985918263', target: '/collections/animals-wildlife' },
  { handle: 'can-cooler', id: 'gid://shopify/Collection/666332823925', target: '/collections/home-living' },
  { handle: 'posters', id: 'gid://shopify/Collection/438564192567', target: '/collections/canvas-prints' },
  { handle: 'rugs', id: 'gid://shopify/Collection/666330530165', target: '/collections/bath-mats' },
  { handle: 'mousepads', id: 'gid://shopify/Collection/666330595701', target: '/collections/desk-mats' },
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(options.headers || {})
        }
      });
      if (resp.status === 429) {
        const retryAfter = parseInt(resp.headers.get('retry-after') || '2', 10);
        console.log(`    [429 Throttled] Backing off ${retryAfter + 1}s on attempt ${attempt}...`);
        await sleep((retryAfter + 1) * 1000);
        continue;
      }
      return resp;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await sleep(1000 * attempt);
    }
  }
}

async function runReviewerVerification() {
  console.log('================================================================');
  console.log('REVIEWER 2 INDEPENDENT AUDIT & ADVERSARIAL STRESS TEST');
  console.log(`Target: ${PRIMARY_DOMAIN} (${SHOP_DOMAIN})`);
  console.log('Timestamp: ' + new Date().toISOString());
  console.log('================================================================\n');

  const report = {
    graphqlAudit: { pass: false, checks: {} },
    legacyRedirects: { pass: false, details: [] },
    edgeTargetsHealth: { pass: false, details: [] },
    blogArticle: { pass: false, details: {} },
    frontpageHealth: { pass: false, details: {} },
    avadaUpsellHealth: { pass: false, details: {} },
    percent20Redirects: { pass: false, details: [] },
    overallPassed: false
  };

  // --------------------------------------------------------------------------
  // PART 1: GRAPHQL STATE AUDIT
  // --------------------------------------------------------------------------
  console.log('>>> PART 1: Independent Shopify Admin GraphQL Audit');
  const auditRes = await shopifyGraphQL(`
    query ReviewerAudit {
      collectionsCount { count }
      frontpage: collection(id: "gid://shopify/Collection/437768978743") {
        id
        handle
        title
        productsCount { count }
      }
      avada: collection(id: "gid://shopify/Collection/441651298615") {
        id
        handle
        productsCount { count }
        resourcePublications(first: 20) {
          nodes {
            isPublished
            publication { id name }
          }
        }
      }
      rogueRedirect: urlRedirect(id: "gid://shopify/UrlRedirect/1701624414581") {
        id
        path
        target
      }
      article: article(id: "gid://shopify/Article/1016204886389") {
        id
        handle
        title
        isPublished
        publishedAt
      }
      legacyNodes: nodes(ids: [
        "gid://shopify/Collection/484418421047", "gid://shopify/Collection/486062588215",
        "gid://shopify/Collection/486062391607", "gid://shopify/Collection/486062653751",
        "gid://shopify/Collection/484418224439", "gid://shopify/Collection/444874228023",
        "gid://shopify/Collection/491112530231", "gid://shopify/Collection/484418683191",
        "gid://shopify/Collection/484716183863", "gid://shopify/Collection/485993447735",
        "gid://shopify/Collection/486062424375", "gid://shopify/Collection/486062522679",
        "gid://shopify/Collection/486062719287", "gid://shopify/Collection/491049681207",
        "gid://shopify/Collection/491068031287", "gid://shopify/Collection/491090837815",
        "gid://shopify/Collection/491806064951", "gid://shopify/Collection/491808457015",
        "gid://shopify/Collection/491808620855", "gid://shopify/Collection/491808817463",
        "gid://shopify/Collection/491808981303", "gid://shopify/Collection/484418289975",
        "gid://shopify/Collection/494964998455", "gid://shopify/Collection/495985918263",
        "gid://shopify/Collection/666332823925", "gid://shopify/Collection/438564192567",
        "gid://shopify/Collection/666330530165", "gid://shopify/Collection/666330595701"
      ]) {
        ... on Collection { id handle }
      }
    }
  `);

  const count = auditRes.collectionsCount?.count;
  const fp = auditRes.frontpage;
  const av = auditRes.avada;
  const rogue = auditRes.rogueRedirect;
  const art = auditRes.article;
  const surviving = (auditRes.legacyNodes || []).filter(Boolean);

  console.log(`- Collections Count: ${count} (Expected: 73)`);
  console.log(`- Surviving Legacy Collections: ${surviving.length} (Expected: 0)`);
  console.log(`- Frontpage Collection Handle: "${fp?.handle}" (Expected: "frontpage")`);
  console.log(`- Rogue Blog Redirect: ${rogue ? 'EXISTS (FAIL)' : 'NULL (PASS)'}`);
  console.log(`- Article isPublished: ${art?.isPublished} (Expected: true), publishedAt: ${art?.publishedAt}`);

  const avOnlinePub = (av?.resourcePublications?.nodes || []).find(p => p.publication.id === 'gid://shopify/Publication/124388507959');
  const avOtherPubs = (av?.resourcePublications?.nodes || []).filter(p => p.publication.id !== 'gid://shopify/Publication/124388507959');
  console.log(`- AVADA Online Store Published: ${avOnlinePub?.isPublished ?? false} (Expected: false / null)`);
  console.log(`- AVADA Other Active Publications: ${avOtherPubs.length} (Expected: >= 7)`);

  const graphqlPass = count === 73 &&
    surviving.length === 0 &&
    fp?.handle === 'frontpage' &&
    rogue === null &&
    art?.isPublished === true &&
    (!avOnlinePub || avOnlinePub.isPublished === false) &&
    avOtherPubs.length >= 7;

  report.graphqlAudit = {
    pass: graphqlPass,
    count,
    survivingCount: surviving.length,
    frontpageIntact: fp?.handle === 'frontpage',
    rogueNull: rogue === null,
    artPublished: art?.isPublished === true,
    avadaUnpublished: !avOnlinePub || avOnlinePub.isPublished === false,
    avadaOtherChannels: avOtherPubs.length
  };
  console.log(`GraphQL State Audit Result: ${graphqlPass ? 'PASS' : 'FAIL'}\n`);

  // --------------------------------------------------------------------------
  // PART 2: LIVE STOREFRONT 28 LEGACY REDIRECT CHECKS
  // --------------------------------------------------------------------------
  console.log('>>> PART 2: Live Storefront HTTP Probes (All 28 Legacy Collections)');
  let legacyPassing = 0;
  const distinctTargets = new Set();

  for (const item of DISCONTINUED_28_COLLECTIONS) {
    const url = `https://${PRIMARY_DOMAIN}/collections/${item.handle}`;
    await sleep(800); // 800ms pacing delay between probes to respect edge limits

    const resp = await fetchWithRetry(url, { method: 'HEAD', redirect: 'manual' });
    const location = resp.headers.get('location') || '';
    const status = resp.status;
    const is301 = status === 301;
    const matchesTarget = location.endsWith(item.target) || location === item.target;

    distinctTargets.add(item.target);

    const record = {
      handle: item.handle,
      status,
      location,
      expectedTarget: item.target,
      pass: is301 && matchesTarget
    };
    report.legacyRedirects.details.push(record);

    if (record.pass) {
      legacyPassing++;
      console.log(`  [PASS 301] /collections/${item.handle} -> ${location}`);
    } else {
      console.log(`  [FAIL] /collections/${item.handle} status=${status}, location=${location}, expected=${item.target}`);
    }
  }

  report.legacyRedirects.pass = legacyPassing === 28;
  console.log(`Legacy Collections 301 Probes: ${legacyPassing}/28 passing.\n`);

  // --------------------------------------------------------------------------
  // PART 3: REDIRECT DESTINATION HEALTH (NO CHAINS, NO 404s, NO LOOPS)
  // --------------------------------------------------------------------------
  console.log('>>> PART 3: Verifying Distinct Redirect Target Destinations Health');
  let targetsPassing = 0;
  for (const targetPath of distinctTargets) {
    const targetUrl = `https://${PRIMARY_DOMAIN}${targetPath}`;
    await sleep(800);

    const resp = await fetchWithRetry(targetUrl, { method: 'GET', redirect: 'manual' });
    const is200 = resp.status === 200;
    const record = {
      path: targetPath,
      status: resp.status,
      pass: is200
    };
    report.edgeTargetsHealth.details.push(record);

    if (is200) {
      targetsPassing++;
      console.log(`  [PASS 200] ${targetPath} serves HTTP 200 OK directly (no redirect chains)`);
    } else {
      console.log(`  [FAIL] ${targetPath} returned HTTP ${resp.status}`);
    }
  }
  report.edgeTargetsHealth.pass = targetsPassing === distinctTargets.size;
  console.log(`Target Health Probes: ${targetsPassing}/${distinctTargets.size} healthy.\n`);

  // --------------------------------------------------------------------------
  // PART 4: BLOG ARTICLE STOREFRONT PROBE
  // --------------------------------------------------------------------------
  console.log('>>> PART 4: Blog Guide Storefront HTTP Status & Content Check');
  const blogUrl = `https://${PRIMARY_DOMAIN}/blogs/news/uk-student-room-rental-flat-decor-guide`;
  await sleep(1000);
  const blogResp = await fetchWithRetry(blogUrl, { method: 'GET', redirect: 'manual' });
  const blogText = blogResp.status === 200 ? await blogResp.text() : '';
  const containsGuideTitle = blogText.includes('UK University Student Room & Rental Flat Decor Guide');
  const blogPass = blogResp.status === 200 && containsGuideTitle;

  report.blogArticle = {
    status: blogResp.status,
    location: blogResp.headers.get('location') || null,
    containsTitle: containsGuideTitle,
    pass: blogPass
  };
  console.log(`  Blog Guide HTTP Status: ${blogResp.status} (Expected: 200)`);
  console.log(`  Blog Guide Title in DOM: ${containsGuideTitle} (Expected: true)`);
  console.log(`  Blog Guide Result: ${blogPass ? 'PASS' : 'FAIL'}\n`);

  // --------------------------------------------------------------------------
  // PART 5: FRONTPAGE & AVADA STOREFRONT STATUS
  // --------------------------------------------------------------------------
  console.log('>>> PART 5: Frontpage Accessibility & AVADA Upsell Unpublishing Check');
  const frontpageUrl = `https://${PRIMARY_DOMAIN}/collections/frontpage`;
  await sleep(800);
  const fpResp = await fetchWithRetry(frontpageUrl, { method: 'GET', redirect: 'manual' });
  const fpPass = fpResp.status === 200;
  report.frontpageHealth = {
    status: fpResp.status,
    pass: fpPass
  };
  console.log(`  /collections/frontpage HTTP Status: ${fpResp.status} (Expected: 200, Not 404) -> ${fpPass ? 'PASS' : 'FAIL'}`);

  const avadaUrl = `https://${PRIMARY_DOMAIN}/collections/avada-upsell-best-sellers`;
  await sleep(800);
  const avResp = await fetchWithRetry(avadaUrl, { method: 'GET', redirect: 'manual' });
  // Since unpublished from Online Store, Shopify storefront returns HTTP 404 for this collection path
  const avPass = avResp.status === 404;
  report.avadaUpsellHealth = {
    status: avResp.status,
    pass: avPass
  };
  console.log(`  /collections/avada-upsell-best-sellers HTTP Status: ${avResp.status} (Expected: 404) -> ${avPass ? 'PASS' : 'FAIL'}\n`);

  // --------------------------------------------------------------------------
  // PART 6: AUDIT 15 %20 REDIRECTS IN GRAPHQL
  // --------------------------------------------------------------------------
  console.log('>>> PART 6: Verifying 15 Repaired %20 Redirects in Admin API');
  const percent20Res = await shopifyGraphQL(`
    query CheckPercent20Redirects {
      nodes(ids: [
        "gid://shopify/UrlRedirect/472276566327", "gid://shopify/UrlRedirect/472276926775",
        "gid://shopify/UrlRedirect/472277123383", "gid://shopify/UrlRedirect/472277680439",
        "gid://shopify/UrlRedirect/472277745975", "gid://shopify/UrlRedirect/472278139191",
        "gid://shopify/UrlRedirect/472278925623", "gid://shopify/UrlRedirect/472279482679",
        "gid://shopify/UrlRedirect/472377819447", "gid://shopify/UrlRedirect/472377884983",
        "gid://shopify/UrlRedirect/472378016055", "gid://shopify/UrlRedirect/472381817143",
        "gid://shopify/UrlRedirect/472381915447", "gid://shopify/UrlRedirect/472382374199",
        "gid://shopify/UrlRedirect/472382898487"
      ]) {
        ... on UrlRedirect { id path target }
      }
    }
  `);

  let cleanCount = 0;
  for (const node of (percent20Res?.nodes || [])) {
    const isClean = node && node.target && !node.target.includes('%20');
    if (isClean) {
      cleanCount++;
      report.percent20Redirects.push({ id: node.id, path: node.path, target: node.target, pass: true });
    } else {
      report.percent20Redirects.push({ id: node?.id, path: node?.path, target: node?.target, pass: false });
    }
  }
  const percent20Pass = cleanCount === 15;
  report.percent20Redirects.pass = percent20Pass;
  console.log(`  15 Redirects Audit: ${cleanCount}/15 targets completely free of %20 encoding -> ${percent20Pass ? 'PASS' : 'FAIL'}\n`);

  // Overall verdict
  report.overallPassed = report.graphqlAudit.pass &&
    report.legacyRedirects.pass &&
    report.edgeTargetsHealth.pass &&
    report.blogArticle.pass &&
    report.frontpageHealth.pass &&
    report.avadaUpsellHealth.pass &&
    report.percent20Redirects.pass;

  console.log('================================================================');
  console.log(`REVIEWER 2 INDEPENDENT AUDIT VERDICT: ${report.overallPassed ? 'ALL CHECKS PASSED' : 'FAILURES DETECTED'}`);
  console.log('================================================================\n');

  return report;
}

runReviewerVerification()
  .then(report => {
    if (report.overallPassed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
