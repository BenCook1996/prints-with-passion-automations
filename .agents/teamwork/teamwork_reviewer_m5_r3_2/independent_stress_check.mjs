import { fitTitleUnder60Chars } from '../../../strikezone_ctr_and_competitor_rewriter.mjs';
import { sanitizeTemplateGrammar, unescapeHtmlEntities } from '../../../catalog_uniqueness_and_seo_lint_gate.mjs';

console.log("=== Independent Reviewer Stress Check ===");

const cases = [
  { name: "Nested unclosed parens", input: "(((((((Canvas Print", candidates: [] },
  { name: "Delimiters only", input: "   & | -   ", candidates: [] },
  { name: "Mismatched brackets", input: "([UK Desk Mat)]", candidates: [] },
  { name: "60 chars + trailing delimiter", input: "Canvas Prints for Modern Living Room and Office Decor - Studio -", candidates: [] },
  { name: "Trailing conjunction", input: "Japanese Anime XXL Desk Mats for Living Room and Office with", candidates: [] },
  { name: "Tag preservation", input: "Japanese Anime Desk Mats [UK Edition]", candidates: [] },
  { name: "Empty bracket only", input: "[]", candidates: [] },
  { name: "Whitespace in brackets", input: "[   ]", candidates: [] },
];

for (const c of cases) {
  const out = fitTitleUnder60Chars(c.input, c.candidates, 60);
  console.log(`[${c.name}] => "${out}" (len: ${out.length})`);
}

const templateCases = [
  "Transform with Canvas Wall Art on 1.25\" x 2.50\" European pine frames. Free UK delivery.",
  "Upgrade with 1.25\" European Pine Bars for Canvas Wall Art. Handcrafted in UK.",
  "Elevate with Cushion Covers in 18x18\" soft velvet. Free UK delivery."
];

for (const tc of templateCases) {
  const out = sanitizeTemplateGrammar(tc);
  console.log(`[Template] => "${out}"`);
}
