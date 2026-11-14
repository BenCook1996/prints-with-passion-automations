/**
 * Empirical Mutation Testing Harness — Gate 2 Adversarial Sensitivity Verification
 *
 * Exercises the remediated test runner against 10 controlled defect injections:
 * 1. Extra H1 on Homepage DOM (Target: T1-F02-01)
 * 2. Malformed Customer Auth URL on Homepage DOM (Target: T1-F03-01)
 * 3. Contact Email Quad-S Typo on Homepage DOM (Target: T1-F04-01)
 * 4. Curated Collections Hub Snippet Removed from Homepage (Target: T1-F05-01)
 * 5. Literal %20 in Shopify Redirect Target (Target: T1-F10-01)
 * 6. Collection Description Length Underflow (<140 chars) (Target: T1-F12-01)
 * 7. Unescaped HTML Entity &quot; in Collections JSON (Target: T1-F12-02)
 * 8. Ellipsis Truncation in Collection Title (Target: T1-F11-04)
 * 9. Pillar Page Meta Description Underflow (<145 chars) (Target: T1-F15-02)
 * 10. Delisted AVADA Collection Leaked into Sitemaps XML (Target: T4-SCEN-05)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import child_process from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

const scenarios = [
  {
    id: 'MUT-01',
    name: 'Extra H1 Tag in Homepage HTML DOM',
    targetFixture: path.join(FIXTURES_DIR, 'homepage_sample.html'),
    targetFeature: 'F2',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=2'],
    mutate(original) {
      return original.replace(
        '<body class="template-index">',
        '<body class="template-index">\n    <h1>Spurious Extra H1 Heading</h1>'
      );
    },
    expectedFailingTest: 'T1-F02-01'
  },
  {
    id: 'MUT-02',
    name: 'Malformed Customer Auth URL with Leading Slash Concat',
    targetFixture: path.join(FIXTURES_DIR, 'homepage_sample.html'),
    targetFeature: 'F3',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=3'],
    mutate(original) {
      return original.replace('href="/account/login"', 'href="/https://printswithpassion.com/account/login"');
    },
    expectedFailingTest: 'T1-F03-01'
  },
  {
    id: 'MUT-03',
    name: 'Quadruple-s Contact Email Typo on Homepage',
    targetFixture: path.join(FIXTURES_DIR, 'homepage_sample.html'),
    targetFeature: 'F4',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=4'],
    mutate(original) {
      return original.replace(/printswithpassionbc@gmail\.com/g, 'printswithpasssionbc@gmail.com');
    },
    expectedFailingTest: 'T1-F04-01'
  },
  {
    id: 'MUT-04',
    name: 'Curated Collections Hub Snippet Removed from Homepage',
    targetFixture: path.join(FIXTURES_DIR, 'homepage_sample.html'),
    targetFeature: 'F5',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=5'],
    mutate(original) {
      return original.replace(/class="pwp-curated-collections-hub"/g, 'class="deprecated-hub-container"');
    },
    expectedFailingTest: 'T1-F05-01'
  },
  {
    id: 'MUT-05',
    name: 'Literal %20 Encoded Space in Shopify Redirect Target',
    targetFixture: path.join(FIXTURES_DIR, 'redirects_sample.json'),
    targetFeature: 'F10',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=10'],
    mutate(original) {
      const data = JSON.parse(original);
      data[0].target = '/collections/neon%20throw%20blanket';
      return JSON.stringify(data, null, 2);
    },
    expectedFailingTest: 'T1-F10-01'
  },
  {
    id: 'MUT-06',
    name: 'Collection Description Length Underflow (<140 chars)',
    targetFixture: path.join(FIXTURES_DIR, 'collections_sample.json'),
    targetFeature: 'F12',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=12'],
    mutate(original) {
      const data = JSON.parse(original);
      data[0].seo.description = 'Too short description for commercial collection.';
      return JSON.stringify(data, null, 2);
    },
    expectedFailingTest: 'T1-F12-01'
  },
  {
    id: 'MUT-07',
    name: 'Unescaped &quot; HTML Entity in Collection Description',
    targetFixture: path.join(FIXTURES_DIR, 'collections_sample.json'),
    targetFeature: 'F12',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=12'],
    mutate(original) {
      const data = JSON.parse(original);
      data[0].seo.description = 'Shop archival framed canvas &quot;wall art&quot; and XXL stitched gaming desk mats handcrafted with archival pigment inks in the UK with free tracked delivery.';
      return JSON.stringify(data, null, 2);
    },
    expectedFailingTest: 'T1-F12-02'
  },
  {
    id: 'MUT-08',
    name: 'Ellipsis Truncation in Collection Title in Catalog JSON',
    targetFixture: path.join(FIXTURES_DIR, 'collections_sample.json'),
    targetFeature: 'F11',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=11'],
    mutate(original) {
      const data = JSON.parse(original);
      data[0].seo.title = 'Canvas Wall Art, XXL Desk Mats & Modern Home Decor...';
      return JSON.stringify(data, null, 2);
    },
    expectedFailingTest: 'T1-F11-04'
  },
  {
    id: 'MUT-09',
    name: 'Pillar Page Meta Description Underflow (<145 chars)',
    targetFixture: path.join(FIXTURES_DIR, 'pages_sample.json'),
    targetFeature: 'F15',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=1', '--feature=15'],
    mutate(original) {
      const data = JSON.parse(original);
      data[0].seo.description = 'UK definitive buyer guide covering archival frame construction, depth options, and hanging hardware for modern British living spaces decor.';
      return JSON.stringify(data, null, 2);
    },
    expectedFailingTest: 'T1-F15-02'
  },
  {
    id: 'MUT-10',
    name: 'Delisted AVADA Collection Leaked into Sitemap XML',
    targetFixture: path.join(FIXTURES_DIR, 'sitemaps_sample.xml'),
    targetFeature: 'Tier 4 Scenario 5',
    testCommand: ['node', 'tests/e2e_recovery_test_runner.mjs', '--dry-run', '--tier=4'],
    mutate(original) {
      return original.replace(
        '</urlset>',
        '  <url>\n    <loc>https://printswithpassion.com/collections/avada-upsell-best-sellers</loc>\n  </url>\n</urlset>'
      );
    },
    expectedFailingTest: 'T4-SCEN-05'
  }
];

async function runEmpiricalMutationTesting() {
  console.log('==============================================================');
  console.log(' EMPIRICAL CHALLENGER — ADVERSARIAL MUTATION TEST HARNESS');
  console.log('==============================================================\n');

  // Capture baseline fixture contents
  const baselineFixtures = {};
  const fixtureFiles = fs.readdirSync(FIXTURES_DIR).map(f => path.join(FIXTURES_DIR, f));
  for (const f of fixtureFiles) {
    if (fs.statSync(f).isFile()) {
      baselineFixtures[f] = fs.readFileSync(f, 'utf8');
    }
  }

  const results = [];
  let allSensitive = true;

  for (const scen of scenarios) {
    console.log(`>>> [${scen.id}] ${scen.name} (${scen.targetFeature})`);

    // 1. Read original fixture
    const originalFixtureContent = baselineFixtures[scen.targetFixture];

    // 2. Apply mutation
    const mutatedContent = scen.mutate(originalFixtureContent);
    if (mutatedContent === originalFixtureContent) {
      throw new Error(`Mutation ${scen.id} did not modify fixture content!`);
    }
    fs.writeFileSync(scen.targetFixture, mutatedContent, 'utf8');

    // 3. Execute test runner against mutated fixture
    const [bin, ...args] = scen.testCommand;
    const mutateRun = child_process.spawnSync(bin, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    });

    const mutateExitCode = mutateRun.status;
    const mutateStdout = mutateRun.stdout || '';
    const mutateStderr = mutateRun.stderr || '';

    // Verify sensitivity: must exit with non-zero and produce TAP 'not ok'
    const failedLines = mutateStdout
      .split('\n')
      .filter(l => l.startsWith('not ok'));

    const caughtTarget = failedLines.some(l => l.includes(scen.expectedFailingTest));
    const passedMutation = mutateExitCode === 1 && failedLines.length > 0 && caughtTarget;

    console.log(`    Mutated Run: ExitCode = ${mutateExitCode} (expected 1)`);
    console.log(`    TAP 'not ok' lines: ${failedLines.length}`);
    failedLines.forEach(l => console.log(`      ${l.trim()}`));
    console.log(`    Caught Expected Target [${scen.expectedFailingTest}]: ${caughtTarget ? 'YES' : 'NO'}`);

    if (!passedMutation) {
      allSensitive = false;
      console.error(`    FAILED SENSITIVITY: Mutation was NOT properly caught!`);
      if (mutateStderr) console.error(`    Stderr: ${mutateStderr}`);
    }

    // 4. Revert fixture
    fs.writeFileSync(scen.targetFixture, originalFixtureContent, 'utf8');

    // 5. Re-run test to verify clean reversion
    const cleanRun = child_process.spawnSync(bin, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    });

    const cleanExitCode = cleanRun.status;
    const cleanStdout = cleanRun.stdout || '';
    const cleanPassed = cleanExitCode === 0 && !cleanStdout.includes('not ok');

    console.log(`    Clean Run after Revert: ExitCode = ${cleanExitCode} (expected 0), Clean: ${cleanPassed ? 'YES' : 'NO'}\n`);

    if (!cleanPassed) {
      allSensitive = false;
      console.error(`    FAILED REVERSION: Clean test failed after restoring fixture!`);
    }

    results.push({
      scenarioId: scen.id,
      name: scen.name,
      feature: scen.targetFeature,
      expectedFailingTest: scen.expectedFailingTest,
      mutateExitCode,
      notOkCount: failedLines.length,
      caughtTarget,
      cleanExitCode,
      cleanPassed,
      sensitive: passedMutation && cleanPassed
    });
  }

  // 6. Verify fixture byte-for-byte baseline restoration
  let allFixturesRestored = true;
  for (const [filePath, baselineContent] of Object.entries(baselineFixtures)) {
    const currentContent = fs.readFileSync(filePath, 'utf8');
    if (currentContent !== baselineContent) {
      allFixturesRestored = false;
      console.error(`Fixture integrity mismatch: ${filePath}`);
    }
  }

  console.log(`==============================================================`);
  console.log(` Fixture Integrity Check:    ${allFixturesRestored ? '100% RESTORED TO BASELINE' : 'CORRUPTED'}`);
  console.log(` Total Scenarios Tested:     ${scenarios.length}`);
  console.log(` Fully Sensitive Scenarios:  ${results.filter(r => r.sensitive).length} / ${scenarios.length}`);
  console.log(` Overall Gate 2 Verdict:     ${allSensitive && allFixturesRestored ? 'PASS (APPROVE)' : 'FAIL (REQUEST_CHANGES)'}`);
  console.log(`==============================================================`);

  const reportPath = path.join(REPO_ROOT, 'tests', 'reports', 'challenger_mutation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    overallVerdict: allSensitive && allFixturesRestored ? 'APPROVE' : 'REQUEST_CHANGES',
    allSensitive,
    allFixturesRestored,
    scenariosTestedCount: scenarios.length,
    scenariosPassedCount: results.filter(r => r.sensitive).length,
    results
  }, null, 2), 'utf8');
  console.log(`\nAdversarial mutation report written to: ${reportPath}`);

  if (!allSensitive || !allFixturesRestored) {
    process.exit(1);
  }
}

runEmpiricalMutationTesting().catch(err => {
  console.error('Fatal error in mutation test harness:', err);
  process.exit(1);
});
