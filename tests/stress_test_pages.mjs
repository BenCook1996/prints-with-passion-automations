import fs from 'fs';

const pages = JSON.parse(fs.readFileSync('tests/detailed_pages_audit.json', 'utf8'));

console.log('=== Adversarial Stress Test: Titles & Descriptions ===\n');

let failedTitles = 0;
let failedDescs = 0;

for (const p of pages) {
  // 1. Check title
  // Dangling prepositions, conjunctions, colons, dashes
  const danglingRegex = /(?:[–—\-|,/&:]\s*$|\b(?:and|with|the|in|for|of|vs|at|on|by|or|to)\s*$|\.\.\.\s*$)/i;
  if (danglingRegex.test(p.titleVal)) {
    console.warn(`[TITLE FLAW] Page ${p.handle}: Title "${p.titleVal}" ends with dangling token/punctuation!`);
    failedTitles++;
  }

  // 2. Check description
  // Must end with punctuation (. or !)
  if (!/[.!?]$/.test(p.descVal.trim())) {
    console.warn(`[DESC FLAW] Page ${p.handle}: Desc does not end in terminal punctuation: "${p.descVal}"`);
    failedDescs++;
  }

  // Check for template fragments
  if (/Transform with|Elevate with|Style with/i.test(p.descVal)) {
    console.warn(`[DESC FLAW] Page ${p.handle}: Desc contains broken template phrasing!`);
    failedDescs++;
  }
}

console.log(`Title Flaws: ${failedTitles}`);
console.log(`Desc Flaws: ${failedDescs}`);

// Check 35 link target matches
const catalogPage = pages.find(p => p.handle === 'uk-product-catalog');
const otherPageHandles = new Set(pages.filter(p => p.handle !== 'uk-product-catalog').map(p => p.handle));

console.log(`Total other pages: ${otherPageHandles.size}`);
