import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  fitTitleUnder60Chars as fixedFitTitleUnder60Chars
} from './test_proposed_fix.mjs';

import * as rewriter from '../../../strikezone_ctr_and_competitor_rewriter.mjs';
import * as gscSync from '../../../gsc_ga4_gmc_cloud_sync.mjs';

// Read the challenger harness source
const harnessPath = path.resolve('tests/challenger_m5_empirical_harness.mjs');
let harnessCode = fs.readFileSync(harnessPath, 'utf8');

// Replace relative paths so they resolve from our agent directory
harnessCode = harnessCode.replaceAll('../strikezone_ctr_and_competitor_rewriter.mjs', '../../../strikezone_ctr_and_competitor_rewriter.mjs');
harnessCode = harnessCode.replaceAll('../gsc_ga4_gmc_cloud_sync.mjs', '../../../gsc_ga4_gmc_cloud_sync.mjs');

// Replace the import of fitTitleUnder60Chars to use our fixed version
harnessCode = harnessCode.replace(
  `import {
  fitTitleUnder60Chars,
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../../../strikezone_ctr_and_competitor_rewriter.mjs';`,
  `import {
  isSingleProductQuery,
  buildCollectionThematicTitle,
  buildCompetitorSpecTitleAndMeta
} from '../../../strikezone_ctr_and_competitor_rewriter.mjs';
import { fitTitleUnder60Chars } from './test_proposed_fix.mjs';`
);

// Write to a temporary verification file in our state folder
const testFilePath = path.resolve('.agents/teamwork/teamwork_explorer_m5_r2_1_rep1/run_challenger_with_fix.mjs');
fs.writeFileSync(testFilePath, harnessCode, 'utf8');
console.log('Created run_challenger_with_fix.mjs successfully');
