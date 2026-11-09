/**
 * Prints With Passion — White-Hat SEO Automation #9:
 * Review Rich-Snippet & Earned Authority Seeding Tracker (review_schema_and_earned_authority_tracker.mjs)
 *
 * Replaces artificial self-syndication (Telegraph/dpaste) with genuine trust & authority signals:
 * 1. Audits top hero products for valid Product Offer & Review/AggregateRating readiness.
 * 2. Maintains a vetted, white-hat Earned Media, Creator Seeding & Community Participation
 *    pipeline in EARNED_AUTHORITY_OPPORTUNITIES.md.
 */
import fs from 'fs';
import path from 'path';
import { WORKSPACE } from './lib/cloud-env.mjs';

const REPORT_PATH = path.join(WORKSPACE, 'EARNED_AUTHORITY_OPPORTUNITIES.md');

const EARNED_AUTHORITY_CHANNELS = [
  {
    channel: 'YouTube & TikTok Desk-Setup Creator Seeding (Physical Sample Gifting)',
    targetQueryCluster: 'best desk mats / aesthetic desk setup 2026 / mechanical keyboard desk pad',
    whiteHatMechanism: 'Gift 1 flagship 900x400x4mm Desk Mat + 1 coordinated Stretched Canvas to mid-tier workspace/tech creators (10K–150K subscribers) for honest on-camera desk tour inclusion.',
    expectedSeoImpact: 'High-trust branded search lift ("prints with passion desk mat") + natural dofollow links in YouTube descriptions, Linktree/Beacons pages, and companion blog posts.'
  },
  {
    channel: 'Interior Design & Home Staging Editorial Roundups (Digital PR)',
    targetQueryCluster: 'large canvas wall art uk / above sofa wall decor / home office wall art ideas',
    whiteHatMechanism: 'Respond to journalist requests (Connectively/HARO, ResponseSource, #JournoRequest) with our 57-inch eye-level hanging formula and dual Metric/Imperial furniture-width sizing data.',
    expectedSeoImpact: 'DR 50–80 editorial backlinks from interior design magazines, property staging blogs, and UK/US home decor publications.'
  },
  {
    channel: 'Verified Customer Photo Reviews (Judge.me / Google Merchant Product Ratings)',
    targetQueryCluster: 'Product-level conversion & Google Shopping star ratings',
    whiteHatMechanism: 'Post-delivery review request (14 days after fulfillment) incentivizing real customer setup photos of their desk mat or canvas print.',
    expectedSeoImpact: 'Unlocks genuine AggregateRating stars in organic Product snippets and Google Merchant Center Free Listings, lifting SERP CTR by 20%–35%.'
  },
  {
    channel: 'Organic Community Participation (r/battlestations, r/desksetup, r/MechanicalKeyboards, Pinterest)',
    targetQueryCluster: 'Visual discovery & setup inspiration',
    whiteHatMechanism: 'Zero spam link-dropping. Share genuine high-resolution photography of real physical samples and native Pinterest Pins linked to curated collections.',
    expectedSeoImpact: 'Sustains the 68% engagement rate seen in GA4 Organic Social while driving real referral traffic and repeat branded searches.'
  }
];

async function main() {
  console.log('=== Prints With Passion — Review Schema & Earned Authority Tracker ===');

  const sampleHeroUrl = 'https://printswithpassion.com/products/table-mountain-cape-town-xxl-desk-mat';
  let hasProductSchema = false;
  let hasOfferSchema = false;
  let hasAggregateRating = false;

  try {
    const html = await (await fetch(sampleHeroUrl)).text();
    hasProductSchema = /"@type"\s*:\s*"Product"/i.test(html);
    hasOfferSchema = /"offers"\s*:/i.test(html) || /"@type"\s*:\s*"Offer"/i.test(html);
    hasAggregateRating = /"aggregateRating"\s*:/i.test(html);
  } catch {}

  const now = new Date().toISOString();
  const lines = [
    `# Prints With Passion — Review Rich-Snippet & Earned Authority Tracker`,
    ``,
    `- **Last Updated:** \`${now}\``,
    `- **Policy:** 100% White-Hat Earned Authority (Zero Telegraph/dpaste/paste-site link schemes)`,
    `- **Hero PDP Structured Data Check (\`${sampleHeroUrl.replace('https://printswithpassion.com', '')}\`):**`,
    `  - \`Product\` Schema Present: \`${hasProductSchema}\``,
    `  - \`Offer\` Schema Present: \`${hasOfferSchema}\``,
    `  - \`AggregateRating\` Schema Present: \`${hasAggregateRating ? 'Yes (Active)' : 'Pending Verified Customer Reviews (Never fake rating schema)'}\``,
    ``,
    `## 1. White-Hat Authority & Creator Seeding Playbook`,
    ``,
    `| Authority Channel | Target Query Cluster | Execution Mechanism | Expected Organic SEO Impact |`,
    `| :--- | :--- | :--- | :--- |`,
    ...EARNED_AUTHORITY_CHANNELS.map(c =>
      `| **${c.channel}** | ${c.targetQueryCluster} | ${c.whiteHatMechanism} | ${c.expectedSeoImpact} |`
    )
  ];

  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`Saved Earned Authority & Review Schema report to ${REPORT_PATH}`);
}

main().catch(console.error);
