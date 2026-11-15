/**
 * Dedicated Unit + Originality + Live `/blogs/news` Comparison Suite
 * for editorial_companion_authority_engine.mjs
 */
import assert from 'node:assert/strict';
import {
  TECH_COMPANION_BLUEPRINTS,
  EDITORIAL_COMPANION_BLUEPRINTS,
  loadApprovedHubPaths,
  validateCompanionPost,
  checkCadenceGate
} from '../editorial_companion_authority_engine.mjs';
import { shopifyGql } from '../lib/cloud-env.mjs';

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    passed++;
    console.log(`PASS: ${label}`);
  } catch (err) {
    failed++;
    console.error(`FAIL: ${label} -> ${err.message}`);
  }
}

async function runSuite() {
  const approvedHubs = loadApprovedHubPaths();
  check('loads all 48+ curated hub paths plus parent collections', () => {
    assert.ok(approvedHubs.size >= 55, `Expected >= 55 hubs, got ${approvedHubs.size}`);
    assert.ok(approvedHubs.has('/collections/canvas-prints'));
    assert.ok(approvedHubs.has('/collections/desk-mats'));
    assert.ok(approvedHubs.has('/collections/pillow-cases'));
    assert.ok(approvedHubs.has('/pages/desk-size-visualizer'));
  });

  // Optionally load live /blogs/news corpus from Shopify so we verify real zero-duplication!
  let liveArticles = [];
  try {
    const res = await shopifyGql(`
      query LiveArticlesForDuplicationCheck {
        articles(first: 60, query: "published_status:published") {
          nodes { handle title body }
        }
      }
    `);
    liveArticles = res?.articles?.nodes || [];
  } catch (err) {
    console.warn(`[suite] Offline/no-token mode (${err.message}); testing pairwise & sample corpus.`);
  }

  const liveCorpus = liveArticles.map(a => `${a.title || ''}\n${a.body || ''}`);
  console.log(`[suite] Loaded ${liveCorpus.length} live Shopify /blogs/news articles for originality comparison.`);

  // 1. Validate all 8 Technical Blueprints
  for (let i = 0; i < TECH_COMPANION_BLUEPRINTS.length; i++) {
    const bp = TECH_COMPANION_BLUEPRINTS[i];
    const siblingBodies = [
      ...TECH_COMPANION_BLUEPRINTS.filter((_, idx) => idx !== i).map(x => x.bodyMarkdown),
      ...EDITORIAL_COMPANION_BLUEPRINTS.map(x => x.bodyMarkdown)
    ];
    check(`Tech blueprint #${i + 1} (${bp.id}) meets 600-1000w, 1-2 links, DEV tags & <0.05 Jaccard`, () => {
      const post = { platform: 'devto', ...bp };
      const res = validateCompanionPost(post, [...liveCorpus, ...siblingBodies], approvedHubs);
      assert.equal(res.valid, true, `Errors: ${res.errors.join('; ')} | wordCount=${res.wordCount} | jaccard=${res.originality.maxJaccard}`);
      console.log(`      [metrics] words=${res.wordCount}, links=${res.pwpLinks.length}, maxJaccard=${res.originality.maxJaccard}`);
    });
  }

  // 2. Validate all 8 Editorial Blueprints
  for (let i = 0; i < EDITORIAL_COMPANION_BLUEPRINTS.length; i++) {
    const bp = EDITORIAL_COMPANION_BLUEPRINTS[i];
    const siblingBodies = [
      ...TECH_COMPANION_BLUEPRINTS.map(x => x.bodyMarkdown),
      ...EDITORIAL_COMPANION_BLUEPRINTS.filter((_, idx) => idx !== i).map(x => x.bodyMarkdown)
    ];
    check(`Editorial blueprint #${i + 1} (${bp.id}) meets 600-1000w, 1-2 links & <0.05 Jaccard`, () => {
      const res = validateCompanionPost(bp, [...liveCorpus, ...siblingBodies], approvedHubs);
      assert.equal(res.valid, true, `Errors: ${res.errors.join('; ')} | wordCount=${res.wordCount} | jaccard=${res.originality.maxJaccard}`);
      console.log(`      [metrics] platform=${bp.platform}, words=${res.wordCount}, links=${res.pwpLinks.length}, maxJaccard=${res.originality.maxJaccard}`);
    });
  }

  // 3. Negative defect injection assertions
  const sampleBase = TECH_COMPANION_BLUEPRINTS[0];

  check('rejects under-600-word thin post', () => {
    const thin = { ...sampleBase, platform: 'devto', bodyMarkdown: 'Short post with https://printswithpassion.com/collections/desk-mats link only.' };
    const res = validateCompanionPost(thin, [], approvedHubs);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('outside required 600–1,000')));
  });

  check('rejects over-1000-word post', () => {
    const filler = Array(1050).fill('uniqueword').join(' ');
    const longPost = { ...sampleBase, platform: 'substack', bodyMarkdown: `${filler}\nhttps://printswithpassion.com/collections/canvas-prints` };
    const res = validateCompanionPost(longPost, [], approvedHubs);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('outside required 600–1,000')));
  });

  check('rejects zero links and 3+ links', () => {
    const bodyNoLink = sampleBase.bodyMarkdown.replace(/https:\/\/printswithpassion\.com[^\s)]+/g, 'https://example.org/test');
    const res0 = validateCompanionPost({ ...sampleBase, platform: 'devto', bodyMarkdown: bodyNoLink }, [], approvedHubs);
    assert.equal(res0.valid, false);
    assert.ok(res0.errors.some(e => e.includes('must be strictly 1–2')));

    const body3Links = `${sampleBase.bodyMarkdown}\nSee https://printswithpassion.com/collections/blankets too.`;
    const res3 = validateCompanionPost({ ...sampleBase, platform: 'devto', bodyMarkdown: body3Links }, [], approvedHubs);
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some(e => e.includes('must be strictly 1–2')));
  });

  check('rejects /products/ links and blocked/noindex domains', () => {
    const withProduct = `${sampleBase.bodyMarkdown}\nhttps://printswithpassion.com/products/some-mat`;
    const resProd = validateCompanionPost({ ...sampleBase, platform: 'devto', bodyMarkdown: withProduct }, [], approvedHubs);
    assert.equal(resProd.valid, false);
    assert.ok(resProd.errors.some(e => e.includes('/products/') || e.includes('strictly 1–2')));

    for (const badDomain of ['hometalk.com', 'telegra.ph', 'are.na']) {
      const withBlocked = `${sampleBase.bodyMarkdown} reference ${badDomain}`;
      const resBlk = validateCompanionPost({ ...sampleBase, platform: 'devto', bodyMarkdown: withBlocked }, [], approvedHubs);
      assert.equal(resBlk.valid, false);
      assert.ok(resBlk.errors.some(e => e.includes(badDomain)));
    }
  });

  check('rejects copy-pasted /blogs/news text and canonical_url', () => {
    const dupRes = validateCompanionPost(
      { ...sampleBase, platform: 'devto', canonical_url: 'https://printswithpassion.com/blogs/news/some-guide' },
      [sampleBase.bodyMarkdown],
      approvedHubs
    );
    assert.equal(dupRes.valid, false);
    assert.ok(dupRes.errors.some(e => e.includes('Originality gate failed')));
    assert.ok(dupRes.errors.some(e => e.includes('must NOT set canonical_url')));
  });

  check('rejects hyphenated DEV.to tags', () => {
    const badTags = validateCompanionPost({ ...sampleBase, platform: 'devto', tags: ['desk-setup', 'webdev'] }, [], approvedHubs);
    assert.equal(badTags.valid, false);
    assert.ok(badTags.errors.some(e => e.includes('Invalid DEV.to tag')));
  });

  check('cadence gate enforces max 2 runs per 7d and 60h cooldown unless --force', () => {
    const now = Date.UTC(2026, 10, 15, 8, 0, 0);
    const twoRecent = {
      runsHistory: [
        { timestamp: new Date(now - 72 * 3600 * 1000).toISOString() },
        { timestamp: new Date(now - 144 * 3600 * 1000).toISOString() }
      ]
    };
    const blocked = checkCadenceGate(twoRecent, now, { force: false, dryRun: false });
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.reason.includes('cadence_cap_reached'));

    const cooldownBlocked = checkCadenceGate(
      { runsHistory: [{ timestamp: new Date(now - 24 * 3600 * 1000).toISOString() }] },
      now,
      { force: false, dryRun: false }
    );
    assert.equal(cooldownBlocked.allowed, false);
    assert.ok(cooldownBlocked.reason.includes('cooldown_active'));

    const forced = checkCadenceGate(twoRecent, now, { force: true, dryRun: false });
    assert.equal(forced.allowed, true);
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
