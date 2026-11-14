import fs from 'fs';
import path from 'path';
import {
  UNESCAPED_ENTITY_REGEX,
  TEMPLATE_GRAMMAR_REGEX,
  DANGLING_TITLE_REGEX,
  IP_TRADEMARK_REGEX
} from '../../../catalog_uniqueness_and_seo_lint_gate.mjs';

const proposalsPath = 'C:\\Users\\Benjamin\\.gemini\\antigravity\\scratch\\pwp-seo-blog-engine\\.agents\\teamwork\\teamwork_explorer_m3_2\\verified_collection_proposals.json';
const proposals = JSON.parse(fs.readFileSync(proposalsPath, 'utf8'));

console.log(`Auditing ${proposals.length} verified proposals against official Lint Gate regexes...\n`);

let errors = 0;

proposals.forEach((p, idx) => {
  const title = p.proposedTitle || '';
  const desc = p.proposedDesc || '';

  // 1. Length checks
  if (title.length < 25 || title.length > 60) {
    console.error(`[FAIL] #${idx} ${p.handle}: Title length invalid (${title.length})`);
    errors++;
  }
  if (desc.length < 140 || desc.length > 158) {
    console.error(`[FAIL] #${idx} ${p.handle}: Desc length invalid (${desc.length})`);
    errors++;
  }

  // 2. Dangling title check
  if (DANGLING_TITLE_REGEX.test(title)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Title ends dangling: "${title}"`);
    errors++;
  }

  // 3. Unescaped entities check
  if (UNESCAPED_ENTITY_REGEX.test(title)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Title contains unescaped entity: "${title}"`);
    errors++;
  }
  if (UNESCAPED_ENTITY_REGEX.test(desc)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Desc contains unescaped entity: "${desc}"`);
    errors++;
  }

  // 4. Template grammar check
  if (TEMPLATE_GRAMMAR_REGEX.test(title)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Title contains template grammar: "${title}"`);
    errors++;
  }
  if (TEMPLATE_GRAMMAR_REGEX.test(desc)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Desc contains template grammar: "${desc}"`);
    errors++;
  }

  // 5. IP / Trademark check
  if (IP_TRADEMARK_REGEX.test(title)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Title matched IP trademark token: "${title}"`);
    errors++;
  }
  if (IP_TRADEMARK_REGEX.test(desc)) {
    console.error(`[FAIL] #${idx} ${p.handle}: Desc matched IP trademark token: "${desc}"`);
    errors++;
  }

  // 6. Ending punctuation check
  if (!/[.!?]$/.test(desc.trim())) {
    console.error(`[FAIL] #${idx} ${p.handle}: Desc missing terminal punctuation: "${desc.slice(-15)}"`);
    errors++;
  }
});

if (errors === 0) {
  console.log('ALL 70 PROPOSALS PASSED 100% OF LINT GATE REGEX CHECKS WITH ZERO ERRORS!');
} else {
  console.error(`Total errors encountered: ${errors}`);
  process.exit(1);
}
