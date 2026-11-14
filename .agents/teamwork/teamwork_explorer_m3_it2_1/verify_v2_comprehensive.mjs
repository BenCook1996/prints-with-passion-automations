import fs from 'fs';
import path from 'path';

const v1 = JSON.parse(
  fs.readFileSync('.agents/teamwork/teamwork_explorer_m3_2/verified_collection_proposals.json', 'utf8')
);
const v2 = JSON.parse(
  fs.readFileSync('.agents/teamwork/teamwork_explorer_m3_it2_1/verified_collection_proposals_v2.json', 'utf8')
);

console.log('='.repeat(80));
console.log('COMPREHENSIVE AUDIT OF VERIFIED_COLLECTION_PROPOSALS_V2.JSON');
console.log('='.repeat(80));

console.log(`V1 Total Collections: ${v1.length}`);
console.log(`V2 Total Collections: ${v2.length}`);
if (v1.length !== v2.length) {
  throw new Error(`Count mismatch: v1=${v1.length}, v2=${v2.length}`);
}

const v1Map = new Map(v1.map(p => [p.handle, p]));
const v2Map = new Map(v2.map(p => [p.handle, p]));

let totalChecked = 0;
let modifiedCount = 0;
let unmodifiedCount = 0;
let totalErrors = 0;

const diffs = [];

for (const p of v2) {
  totalChecked++;
  const old = v1Map.get(p.handle);
  if (!old) {
    console.error(`[ERROR] Collection ${p.handle} in v2 not found in v1!`);
    totalErrors++;
    continue;
  }

  // Check ID and actions match
  if (old.id !== p.id) {
    console.error(`[ERROR] ID mismatch for ${p.handle}: ${old.id} vs ${p.id}`);
    totalErrors++;
  }
  if (old.action !== p.action) {
    console.error(`[ERROR] Action mismatch for ${p.handle}`);
    totalErrors++;
  }

  // Check Title
  if (p.proposedTitle !== old.proposedTitle) {
    console.log(`[NOTE] Title modified for ${p.handle}: "${old.proposedTitle}" -> "${p.proposedTitle}"`);
  }
  if (p.proposedTitle.length > 60 || p.proposedTitle.length < 25) {
    console.error(`[ERROR] Title length violation for ${p.handle}: ${p.proposedTitle.length}`);
    totalErrors++;
  }

  // Check Desc
  const desc = p.proposedDesc;
  if (!desc) {
    console.error(`[ERROR] Missing desc for ${p.handle}`);
    totalErrors++;
    continue;
  }

  if (desc.includes('"')) {
    console.error(`[ERROR] Literal double quote in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (desc.includes('&quot;')) {
    console.error(`[ERROR] &quot; entity in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (desc.includes('&amp;quot;')) {
    console.error(`[ERROR] &amp;quot; entity in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (desc.includes('&amp;')) {
    console.error(`[ERROR] &amp; entity in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (desc.length < 140 || desc.length > 158) {
    console.error(`[ERROR] Desc length ${desc.length} out of bounds [140, 158] for ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (!/[.!?]$/.test(desc.trim())) {
    console.error(`[ERROR] Missing terminal punctuation in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (/\b(?:Transform|Elevate|Style|Wear|Refresh|Upgrade|Claim)\s+with\b/i.test(desc)) {
    console.error(`[ERROR] Banned template phrase in ${p.handle}: "${desc}"`);
    totalErrors++;
  }
  if (p.proposedDescLen !== desc.length) {
    console.error(`[ERROR] Stored length mismatch for ${p.handle}: recorded=${p.proposedDescLen}, actual=${desc.length}`);
    totalErrors++;
  }

  if (desc !== old.proposedDesc) {
    modifiedCount++;
    diffs.push({
      handle: p.handle,
      oldDesc: old.proposedDesc,
      oldLen: old.proposedDesc.length,
      newDesc: desc,
      newLen: desc.length
    });
  } else {
    unmodifiedCount++;
  }
}

console.log(`\nAudit Summary:`);
console.log(`- Total Collections Checked: ${totalChecked}`);
console.log(`- Remediated Collections:    ${modifiedCount}`);
console.log(`- Preserved Collections:     ${unmodifiedCount}`);
console.log(`- Total Constraint Violations: ${totalErrors}`);

console.log('\n' + '='.repeat(80));
console.log(`BEFORE & AFTER DIFF TABLE FOR ALL ${modifiedCount} REMEDIATED COLLECTIONS`);
console.log('='.repeat(80));

diffs.forEach((d, i) => {
  console.log(`\n[${i + 1}] ${d.handle}`);
  console.log(`  BEFORE (${d.oldLen}c): "${d.oldDesc}"`);
  console.log(`  AFTER  (${d.newLen}c): "${d.newDesc}"`);
});

if (totalErrors === 0 && modifiedCount === 28 && unmodifiedCount === 42) {
  console.log('\n' + '#'.repeat(80));
  console.log('ALL VERIFICATIONS PASSED WITH ZERO DEFECTS (100.0% COMPLIANT)');
  console.log('#'.repeat(80));
} else {
  console.error('\nVERIFICATION FAILED!');
  process.exit(1);
}
