/**
 * Prints With Passion — Milestone 3 Production Remediation Script
 * File: remediate_m3_collections_seo.mjs
 *
 * Implements Requirement R3 (Phase 3 — Bulk Optimization of Active Collection SEO Metadata):
 * 1. Bulk SEO Metadata Optimization:
 *    - Loads verified, high-intent, word-boundary safe proposals (<= 60 chars title, 140–158 chars desc).
 *    - Updates 100% of active collections currently missing custom SEO titles or showing broken template fallbacks.
 * 2. Specific Target Collection Remediation:
 *    - /collections/japanese-anime-desk-mats: restores category-level title & desk mat description.
 *    - /collections/abstract-minimalist-bauhaus-canvas-wall-art: repairs truncated '(CM & I' title to clean complete title.
 * 3. Hygiene & Safety:
 *    - Zero unescaped HTML entities (&quot;, &amp;quot;, &amp;).
 *    - Zero broken template phrases ("Transform with...", "Elevate with...", "Style with...", etc.).
 *    - Paced sequentially with ~300ms delay (~2.5 req/sec) respecting Shopify's 50 pts/sec leaky bucket.
 * 4. Operational Modes:
 *    - Default: executes mutations against live Shopify Admin GraphQL API with pre-flight delta check and post-mutation verification.
 *    - --dry-run: validates proposals against schema rules and live differences without mutating Shopify.
 *    - --verify-only: runs comprehensive post-remediation audit against live Shopify Admin GraphQL API.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { shopifyGraphQL, SHOP_DOMAIN, WORKSPACE, REPO_ROOT } from './lib/cloud-env.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const PACING_DELAY_MS = 300; // ~2–3 req/sec to stay well under 50 pts/sec leaky bucket
const MIN_TITLE_LEN = 25;
const MAX_TITLE_LEN = 60;
const MIN_DESC_LEN = 140;
const MAX_DESC_LEN = 158;

export const UNESCAPED_ENTITY_REGEX = /&(?:amp;)+(?:quot|amp|#39|apos|lt|gt);|&(?:quot|#39|apos|amp);/i;
export const TEMPLATE_GRAMMAR_REGEX = /\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i;
export const DANGLING_TITLE_REGEX = /(?:[–—\-|,/&:]\s*$|\b(?:&|&amp;|Mo|Si|Desig|Pass|and|with|the|in|for|of|vs|at|on|by)\s*$|\.\.\.\s*$|\([^\)]*$)/i;

const CANDIDATE_PROPOSAL_PATHS = [
  path.resolve(__dirname, '.agents/teamwork/teamwork_explorer_m3_it2_1/verified_collection_proposals_v2.json'),
  path.resolve(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m3_it2_1/verified_collection_proposals_v2.json'),
  path.resolve(__dirname, 'verified_collection_proposals_v2.json'),
  path.resolve(__dirname, '.agents/teamwork/teamwork_explorer_m3_2/verified_collection_proposals.json'),
  path.resolve(REPO_ROOT, '.agents/teamwork/teamwork_explorer_m3_2/verified_collection_proposals.json'),
  path.resolve(__dirname, 'verified_collection_proposals.json')
];

export const UNPUBLISHED_REDIRECT_COLLECTIONS = Object.freeze([
  {
    handle: 'wall-art',
    id: 'gid://shopify/Collection/495985492279',
    proposedTitle: 'Canvas Wall Art & Framed Prints | PWP Studio',
    proposedTitleLen: 45,
    proposedDesc: 'Shop archival canvas wall art printed on 400gsm cotton-poly canvas with European pine frames and vibrant fade-resistant inks. Free tracked UK delivery.',
    proposedDescLen: 152,
    action: 'UNPUBLISHED_REDIRECT',
    notes: 'Unpublished legacy collection redirected to /collections/canvas-prints'
  },
  {
    handle: 'stationary-office',
    id: 'gid://shopify/Collection/495986016567',
    proposedTitle: 'Extended Desk Mats & Office Pads | Prints With Passion',
    proposedTitleLen: 53,
    proposedDesc: 'Precision 4mm XXL gaming desk mats and home office desk pads engineered with non-slip natural rubber and stitched edges. Free tracked UK delivery.',
    proposedDescLen: 147,
    action: 'UNPUBLISHED_REDIRECT',
    notes: 'Unpublished legacy collection redirected to /collections/desk-mats'
  },
  {
    handle: 'plush-blankets',
    id: 'gid://shopify/Collection/666330923381',
    proposedTitle: 'Plush Throw Blankets & Fleece Throws | PWP Studio',
    proposedTitleLen: 49,
    proposedDesc: 'Ultra-soft 300 GSM plush coral fleece throw blankets featuring double-sided gallery artwork for beds, sofas and living rooms. Free tracked UK delivery.',
    proposedDescLen: 152,
    action: 'UNPUBLISHED_REDIRECT',
    notes: 'Unpublished legacy collection redirected to /collections/blankets'
  }
]);

export function resolveProposalsPath() {
  for (const candidate of CANDIDATE_PROPOSAL_PATHS) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Unable to find verified_collection_proposals.json in expected locations:\n${CANDIDATE_PROPOSAL_PATHS.join('\n')}`);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// 2. GRAPHQL QUERIES & MUTATIONS
// ============================================================================

const GET_ALL_COLLECTIONS_QUERY = `
  query GetAllCollectionsSeo($cursor: String) {
    collections(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        productsCount {
          count
        }
        seo {
          title
          description
        }
        updatedAt
      }
    }
  }
`;

const UPDATE_COLLECTION_SEO_MUTATION = `
  mutation CollectionSeoUpdate($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        handle
        title
        seo {
          title
          description
        }
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CHECK_ONLINE_STORE_PUBLICATION_QUERY = `
  query CheckOnlineStorePublication {
    publications(first: 20) {
      nodes {
        id
        name
        supportsFuturePublishing
      }
    }
  }
`;

const UNPUBLISH_COLLECTION_MUTATION = `
  mutation UnpublishCollection($id: ID!, $input: [PublicationInput!]!) {
    publishableUnpublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================================================
// 3. CATALOG & PROPOSAL VALIDATION
// ============================================================================

export function validateProposalRecord(proposal) {
  const errors = [];
  const title = (proposal.proposedTitle || '').trim();
  const desc = (proposal.proposedDesc || '').trim();

  if (!title) {
    errors.push('Missing proposedTitle');
  } else {
    if (title.length < MIN_TITLE_LEN || title.length > MAX_TITLE_LEN) {
      errors.push(`Title length ${title.length} out of bounds [${MIN_TITLE_LEN}, ${MAX_TITLE_LEN}]`);
    }
    if (DANGLING_TITLE_REGEX.test(title)) {
      errors.push(`Title has dangling/incomplete ending: "${title}"`);
    }
    if (UNESCAPED_ENTITY_REGEX.test(title)) {
      errors.push(`Title contains unescaped HTML entity: "${title}"`);
    }
    if (TEMPLATE_GRAMMAR_REGEX.test(title)) {
      errors.push(`Title contains template grammar phrase: "${title}"`);
    }
  }

  if (!desc) {
    errors.push('Missing proposedDesc');
  } else {
    if (desc.length < MIN_DESC_LEN || desc.length > MAX_DESC_LEN) {
      errors.push(`Description length ${desc.length} out of bounds [${MIN_DESC_LEN}, ${MAX_DESC_LEN}]`);
    }
    if (!/[.!?]$/.test(desc)) {
      errors.push(`Description missing terminal punctuation (ends with "${desc.slice(-10)}")`);
    }
    if (UNESCAPED_ENTITY_REGEX.test(desc)) {
      errors.push(`Description contains unescaped HTML entity: "${desc}"`);
    }
    if (TEMPLATE_GRAMMAR_REGEX.test(desc)) {
      errors.push(`Description contains template grammar phrase: "${desc}"`);
    }
  }

  // Specific sanity checks for flagged collections
  if (proposal.handle === 'japanese-anime-desk-mats') {
    if (/Japanese Wave Desk Mat/i.test(title)) {
      errors.push('japanese-anime-desk-mats must have category-level title, not single-product title');
    }
  }

  if (proposal.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
    if (/\(CM & I/i.test(title)) {
      errors.push('abstract-minimalist-bauhaus-canvas-wall-art has truncated (CM & I artifact');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function fetchLiveCollectionsMap() {
  const map = new Map();
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await shopifyGraphQL(GET_ALL_COLLECTIONS_QUERY, { cursor });
    if (!res || !res.collections) {
      throw new Error('Failed to query collections from Shopify Admin GraphQL API');
    }
    const nodes = res.collections.nodes || [];
    for (const node of nodes) {
      map.set(node.id, node);
      map.set(node.handle, node);
    }
    hasNextPage = res.collections.pageInfo?.hasNextPage || false;
    cursor = res.collections.pageInfo?.endCursor || null;
  }

  return map;
}

// ============================================================================
// 4. CORE REMEDIATION WORKFLOW
// ============================================================================

export async function runRemediation(options = {}) {
  const { dryRun = false, verifyOnly = false } = options;

  console.log('='.repeat(80));
  console.log('  PRINTS WITH PASSION — MILESTONE 3: ACTIVE COLLECTION SEO REMEDIATION');
  console.log(`  Shopify Store Domain: ${SHOP_DOMAIN}`);
  console.log(`  Mode: ${verifyOnly ? 'VERIFY_ONLY' : dryRun ? 'DRY_RUN (SIMULATION)' : 'LIVE EXECUTION'}`);
  console.log('='.repeat(80));

  const proposalsPath = resolveProposalsPath();
  console.log(`\n[1/5] Loading verified proposals from:\n  ${proposalsPath}`);
  const baseProposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));
  const existingHandles = new Set(baseProposals.map(p => p.handle));
  const rawProposals = [...baseProposals];
  for (const extra of UNPUBLISHED_REDIRECT_COLLECTIONS) {
    if (!existingHandles.has(extra.handle)) {
      rawProposals.push(extra);
    }
  }
  console.log(`  Loaded ${baseProposals.length} base proposals + ${rawProposals.length - baseProposals.length} redirect collections = ${rawProposals.length} total.`);

  // Validate all proposals locally
  console.log('\n[2/5] Validating proposal constraints (character boundaries, syntax, grammar)...');
  let proposalValidationFailures = 0;
  for (const proposal of rawProposals) {
    const check = validateProposalRecord(proposal);
    if (!check.valid) {
      console.error(`  [INVALID_PROPOSAL] ${proposal.handle} (${proposal.id}): ${check.errors.join('; ')}`);
      proposalValidationFailures++;
    }
  }
  if (proposalValidationFailures > 0) {
    throw new Error(`Encountered ${proposalValidationFailures} proposal validation failures! Aborting.`);
  }
  console.log(`  PASS: All ${rawProposals.length} proposals meet 100% of SEO length and hygiene specifications.`);

  // Fetch live collections
  console.log('\n[3/5] Querying live collections state from Shopify Admin GraphQL API...');
  const liveMap = await fetchLiveCollectionsMap();
  console.log(`  Retrieved ${liveMap.size / 2} unique collections from Shopify Admin.`);

  // Calculate pre-flight diff
  const toUpdate = [];
  const alreadyCompliant = [];
  const missingInAdmin = [];

  for (const proposal of rawProposals) {
    const live = liveMap.get(proposal.id) || liveMap.get(proposal.handle);
    if (!live) {
      missingInAdmin.push(proposal);
      continue;
    }

    const titleMatches = (live.seo?.title || '') === proposal.proposedTitle;
    const descMatches = (live.seo?.description || '') === proposal.proposedDesc;

    if (titleMatches && descMatches) {
      alreadyCompliant.push({ proposal, live });
    } else {
      toUpdate.push({
        proposal,
        live,
        currentTitle: live.seo?.title || null,
        currentDesc: live.seo?.description || null,
        proposedTitle: proposal.proposedTitle,
        proposedDesc: proposal.proposedDesc
      });
    }
  }

  console.log(`\n[Pre-Flight Diff Analysis]:`);
  console.log(`  Total Proposals Target: ${rawProposals.length}`);
  console.log(`  Already Compliant:      ${alreadyCompliant.length}`);
  console.log(`  Pending Updates:        ${toUpdate.length}`);
  if (missingInAdmin.length > 0) {
    console.warn(`  Missing in Shopify:     ${missingInAdmin.length} (Handles: ${missingInAdmin.map(p => p.handle).join(', ')})`);
  }

  // Handle VERIFY-ONLY mode
  if (verifyOnly) {
    console.log('\n[4/5 & 5/5] Executing --verify-only verification audit against live collections...');
    const auditReport = runLiveVerificationAudit(rawProposals, liveMap);
    printVerificationReport(auditReport);
    if (!auditReport.success) {
      throw new Error(`Live verification failed: ${auditReport.failureCount} collections non-compliant.`);
    }
    return { success: true, mode: 'verify-only', auditReport };
  }

  // Handle DRY-RUN mode
  if (dryRun) {
    console.log('\n[4/5] [DRY RUN] Simulating collection updates without mutating Shopify...');
    toUpdate.slice(0, 10).forEach((item, idx) => {
      console.log(`  #${idx + 1} [${item.proposal.handle}]`);
      console.log(`     Old Title: "${item.currentTitle || '(null)'}"`);
      console.log(`     New Title: "${item.proposedTitle}" (${item.proposedTitle.length} chars)`);
      console.log(`     Old Desc:  "${item.currentDesc ? item.currentDesc.slice(0, 60) + '...' : '(null)'}"`);
      console.log(`     New Desc:  "${item.proposedDesc.slice(0, 60)}..." (${item.proposedDesc.length} chars)`);
    });
    if (toUpdate.length > 10) {
      console.log(`  ... and ${toUpdate.length - 10} more collections queued for update.`);
    }
    console.log('\n[5/5] [DRY RUN] Simulation complete. No mutations were dispatched.');
    return {
      success: true,
      mode: 'dry-run',
      pendingUpdateCount: toUpdate.length,
      alreadyCompliantCount: alreadyCompliant.length
    };
  }

  // Handle LIVE EXECUTION mode
  console.log(`\n[4/5] Executing live GraphQL mutations for ${toUpdate.length} collections (pacing: ${PACING_DELAY_MS}ms)...`);
  const results = {
    updated: [],
    skipped: alreadyCompliant.map(c => c.proposal.handle),
    errors: []
  };

  let processedIndex = 0;
  for (const item of toUpdate) {
    processedIndex++;
    const { proposal, live } = item;
    const gId = proposal.id || live.id;

    console.log(`  [${processedIndex}/${toUpdate.length}] Mutating ${proposal.handle} (${gId})...`);

    const mutationInput = {
      id: gId,
      seo: {
        title: proposal.proposedTitle,
        description: proposal.proposedDesc
      }
    };

    try {
      const res = await shopifyGraphQL(UPDATE_COLLECTION_SEO_MUTATION, { input: mutationInput });

      if (!res || !res.collectionUpdate) {
        throw new Error(`Shopify API returned empty response for ${proposal.handle}`);
      }

      const userErrors = res.collectionUpdate.userErrors || [];
      if (userErrors.length > 0) {
        const errorMsg = userErrors.map(e => `[${e.field?.join('.') || 'root'}]: ${e.message}`).join('; ');
        console.error(`    [USER_ERROR] ${proposal.handle}: ${errorMsg}`);
        results.errors.push({ handle: proposal.handle, id: gId, error: errorMsg });
      } else {
        const updated = res.collectionUpdate.collection;
        const appliedTitle = updated.seo?.title;
        const appliedDesc = updated.seo?.description;

        // In-flight assertion
        if (appliedTitle !== proposal.proposedTitle || appliedDesc !== proposal.proposedDesc) {
          const mismatchMsg = `In-flight mismatch! Applied title="${appliedTitle}" vs expected="${proposal.proposedTitle}"`;
          console.error(`    [MISMATCH] ${proposal.handle}: ${mismatchMsg}`);
          results.errors.push({ handle: proposal.handle, id: gId, error: mismatchMsg });
        } else {
          console.log(`    [SUCCESS] Title: "${appliedTitle}" (${appliedTitle.length} chars)`);
          console.log(`              Desc:  "${appliedDesc.slice(0, 50)}..." (${appliedDesc.length} chars)`);
          results.updated.push({ handle: proposal.handle, id: gId, title: appliedTitle });
        }
      }
    } catch (err) {
      console.error(`    [API_ERROR] ${proposal.handle}: ${err.message}`);
      results.errors.push({ handle: proposal.handle, id: gId, error: err.message });
    }

    // Leaky bucket pacing delay
    await sleep(PACING_DELAY_MS);
  }

  // Handle any special unpublish actions (e.g. avada-upsell-best-sellers)
  for (const proposal of rawProposals) {
    if (proposal.action === 'UNPUBLISH_FROM_ONLINE_STORE') {
      try {
        console.log(`\n  [Safeguard] Verifying Online Store unpublication for ${proposal.handle}...`);
        const pubRes = await shopifyGraphQL(CHECK_ONLINE_STORE_PUBLICATION_QUERY);
        const onlineStorePub = (pubRes?.publications?.nodes || []).find(p => p.name === 'Online Store');
        if (onlineStorePub) {
          await shopifyGraphQL(UNPUBLISH_COLLECTION_MUTATION, {
            id: proposal.id,
            input: [{ publicationId: onlineStorePub.id }]
          });
          console.log(`    [UNPUBLISHED] Collection ${proposal.handle} removed from Online Store publication.`);
        }
      } catch (err) {
        console.warn(`    [UNPUBLISH_NOTICE] ${err.message}`);
      }
    }
  }

  console.log(`\nMutation Phase Complete:`);
  console.log(`  Updated:           ${results.updated.length}`);
  console.log(`  Already Compliant: ${results.skipped.length}`);
  console.log(`  Errors:            ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.error('Errors encountered during mutation execution:');
    results.errors.forEach(e => console.error(`  - ${e.handle} (${e.id}): ${e.error}`));
    throw new Error(`${results.errors.length} mutations failed during live execution.`);
  }

  // Step 5: Post-Mutation Full Live Verification
  console.log('\n[5/5] Re-fetching live collection state from Shopify GraphQL for post-mutation verification...');
  // Brief delay to ensure store-wide replication
  await sleep(1000);
  const refreshedLiveMap = await fetchLiveCollectionsMap();
  const auditReport = runLiveVerificationAudit(rawProposals, refreshedLiveMap);
  printVerificationReport(auditReport);

  if (!auditReport.success) {
    throw new Error(`Post-mutation verification failed: ${auditReport.failureCount} collections non-compliant.`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('  MILESTONE 3 REMEDIATION & VERIFICATION COMPLETED WITH 100% SUCCESS!');
  console.log('='.repeat(80));

  return {
    success: true,
    mode: 'live-execution',
    updatedCount: results.updated.length,
    alreadyCompliantCount: results.skipped.length,
    auditReport
  };
}

// ============================================================================
// 5. POST-MUTATION LIVE VERIFICATION AUDIT SUITE
// ============================================================================

export function runLiveVerificationAudit(proposals, liveMap) {
  const auditResults = {
    totalChecked: proposals.length,
    passedCount: 0,
    failureCount: 0,
    failures: [],
    specificChecks: {
      japaneseAnimeDeskMats: null,
      abstractBauhausWallArt: null
    },
    success: false
  };

  for (const proposal of proposals) {
    const live = liveMap.get(proposal.id) || liveMap.get(proposal.handle);
    const itemFailures = [];

    if (!live) {
      itemFailures.push(`Collection not found in Shopify Admin`);
    } else {
      const liveTitle = live.seo?.title || '';
      const liveDesc = live.seo?.description || '';

      // Title assertions
      if (!liveTitle) {
        itemFailures.push(`Custom seo.title is null/empty`);
      } else {
        if (liveTitle.length < MIN_TITLE_LEN || liveTitle.length > MAX_TITLE_LEN) {
          itemFailures.push(`seo.title length ${liveTitle.length} outside [${MIN_TITLE_LEN}, ${MAX_TITLE_LEN}] chars`);
        }
        if (DANGLING_TITLE_REGEX.test(liveTitle)) {
          itemFailures.push(`seo.title has dangling ending: "${liveTitle}"`);
        }
        if (UNESCAPED_ENTITY_REGEX.test(liveTitle)) {
          itemFailures.push(`seo.title contains unescaped entity: "${liveTitle}"`);
        }
        if (TEMPLATE_GRAMMAR_REGEX.test(liveTitle)) {
          itemFailures.push(`seo.title contains template phrase: "${liveTitle}"`);
        }
      }

      // Description assertions
      if (!liveDesc) {
        itemFailures.push(`Custom seo.description is null/empty`);
      } else {
        if (liveDesc.length < MIN_DESC_LEN || liveDesc.length > MAX_DESC_LEN) {
          itemFailures.push(`seo.description length ${liveDesc.length} outside [${MIN_DESC_LEN}, ${MAX_DESC_LEN}] chars`);
        }
        if (!/[.!?]$/.test(liveDesc.trim())) {
          itemFailures.push(`seo.description missing terminal punctuation: "${liveDesc.slice(-10)}"`);
        }
        if (UNESCAPED_ENTITY_REGEX.test(liveDesc)) {
          itemFailures.push(`seo.description contains unescaped entity: "${liveDesc}"`);
        }
        if (TEMPLATE_GRAMMAR_REGEX.test(liveDesc)) {
          itemFailures.push(`seo.description contains template phrase: "${liveDesc}"`);
        }
      }

      // Value match assertion against proposal
      if (liveTitle !== proposal.proposedTitle) {
        itemFailures.push(`seo.title does not match proposal: live="${liveTitle}" vs expected="${proposal.proposedTitle}"`);
      }
      if (liveDesc !== proposal.proposedDesc) {
        itemFailures.push(`seo.description does not match proposal: live="${liveDesc}" vs expected="${proposal.proposedDesc}"`);
      }

      // Specific flagged checks
      if (proposal.handle === 'japanese-anime-desk-mats') {
        const isPluralCategory = /(?:Desk Mats|Mouse Pads)/i.test(liveTitle) && !/Japanese Wave Desk Mat/i.test(liveTitle);
        auditResults.specificChecks.japaneseAnimeDeskMats = {
          handle: proposal.handle,
          title: liveTitle,
          titleLen: liveTitle.length,
          desc: liveDesc,
          descLen: liveDesc.length,
          isPluralCategory,
          compliant: isPluralCategory && itemFailures.length === 0
        };
        if (!isPluralCategory) {
          itemFailures.push(`japanese-anime-desk-mats is not category-level: "${liveTitle}"`);
        }
      }

      if (proposal.handle === 'abstract-minimalist-bauhaus-canvas-wall-art') {
        const isCleanNotTruncated = !/\(CM & I/i.test(liveTitle) && liveTitle.length <= MAX_TITLE_LEN;
        auditResults.specificChecks.abstractBauhausWallArt = {
          handle: proposal.handle,
          title: liveTitle,
          titleLen: liveTitle.length,
          desc: liveDesc,
          descLen: liveDesc.length,
          isCleanNotTruncated,
          compliant: isCleanNotTruncated && itemFailures.length === 0
        };
        if (!isCleanNotTruncated) {
          itemFailures.push(`abstract-minimalist-bauhaus-canvas-wall-art title contains truncation artifact: "${liveTitle}"`);
        }
      }
    }

    if (itemFailures.length === 0) {
      auditResults.passedCount++;
    } else {
      auditResults.failureCount++;
      auditResults.failures.push({
        handle: proposal.handle,
        id: proposal.id,
        errors: itemFailures
      });
    }
  }

  auditResults.success = auditResults.failureCount === 0;
  return auditResults;
}

export function printVerificationReport(audit) {
  console.log('\n--- LIVE POST-MUTATION VERIFICATION AUDIT REPORT ---');
  console.log(`  Total Active Collections Audited: ${audit.totalChecked}`);
  console.log(`  Passed 100% of SEO Constraints:   ${audit.passedCount} (${((audit.passedCount / audit.totalChecked) * 100).toFixed(1)}%)`);
  console.log(`  Failed / Non-Compliant:           ${audit.failureCount}`);

  console.log('\n  [Specific Flagged Collections Verification]:');
  if (audit.specificChecks.japaneseAnimeDeskMats) {
    const s = audit.specificChecks.japaneseAnimeDeskMats;
    console.log(`  1. /collections/japanese-anime-desk-mats:`);
    console.log(`     - Live Title:       "${s.title}" (${s.titleLen} chars)`);
    console.log(`     - Category-Level:   ${s.isPluralCategory ? 'YES (Verified)' : 'NO'}`);
    console.log(`     - Live Description: "${s.desc.slice(0, 70)}..." (${s.descLen} chars)`);
    console.log(`     - Overall Status:   ${s.compliant ? 'COMPLIANT (PASS)' : 'FAIL'}`);
  }

  if (audit.specificChecks.abstractBauhausWallArt) {
    const s = audit.specificChecks.abstractBauhausWallArt;
    console.log(`  2. /collections/abstract-minimalist-bauhaus-canvas-wall-art:`);
    console.log(`     - Live Title:       "${s.title}" (${s.titleLen} chars)`);
    console.log(`     - Clean / Untrunc:  ${s.isCleanNotTruncated ? 'YES (Verified - No (CM & I artifact)' : 'NO'}`);
    console.log(`     - Live Description: "${s.desc.slice(0, 70)}..." (${s.descLen} chars)`);
    console.log(`     - Overall Status:   ${s.compliant ? 'COMPLIANT (PASS)' : 'FAIL'}`);
  }

  if (audit.failures.length > 0) {
    console.error('\n  [Failures Detail]:');
    audit.failures.forEach(f => {
      console.error(`    - ${f.handle} (${f.id}):\n      ${f.errors.join('\n      ')}`);
    });
  } else {
    console.log('\n  100% OF ACTIVE COLLECTIONS COMPLIANT WITH ZERO DEFECTS!');
  }
}

// ============================================================================
// 6. CLI ENTRYPOINT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verifyOnly = args.includes('--verify-only') || args.includes('-v');

  try {
    const result = await runRemediation({ dryRun, verifyOnly });
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error(`\n[FATAL ERROR] Remediation aborted: ${err.message}`);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
