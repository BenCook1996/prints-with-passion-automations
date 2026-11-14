#!/usr/bin/env node
/**
 * Prints With Passion — End-to-End Recovery Test Runner
 *
 * Opaque-box, 4-tier automated test harness for GSC position recovery & storefront SEO overhaul.
 * Emits standard TAP v13 format, exports structured JSON diagnostics, and presents terminal summary.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { tier1Tests } from './suites/tier1_feature_coverage.mjs';
import { tier2Tests } from './suites/tier2_boundaries_corners.mjs';
import { tier3Tests } from './suites/tier3_cross_feature.mjs';
import { tier4Tests } from './suites/tier4_real_world.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'reports');

// Parse CLI flags
function parseArgs(args) {
  const options = {
    tier: 'all',
    feature: 'all',
    dryRun: false,
    json: false,
    verbose: false,
    bail: false,
    pacingMs: 250,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--bail') {
      options.bail = true;
    } else if (arg.startsWith('--tier=')) {
      options.tier = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--feature=')) {
      options.feature = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--pacing=')) {
      const ms = parseInt(arg.split('=')[1], 10);
      if (!isNaN(ms) && ms >= 0) options.pacingMs = ms;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Prints With Passion — E2E Recovery Test Runner (TAP v13)

Usage:
  node tests/e2e_recovery_test_runner.mjs [options]

Options:
  --tier=<1|2|3|4|all>      Select test tier to execute (default: all)
  --feature=<1..23|all>     Filter by specific feature ID (default: all)
  --dry-run                 Execute against offline fixtures in tests/fixtures/
  --json                    Export structured JSON report to tests/reports/e2e_report.json
  --verbose                 Print detailed step diagnostics and stack traces
  --bail                    Halt test execution on first failure
  --pacing=<ms>             Delay in ms between API calls (default: 250)
  --help                    Show this help screen
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Validate tier flag
  const validTiers = ['1', '2', '3', '4', 'all'];
  if (!validTiers.includes(options.tier)) {
    console.error(`Error: Invalid tier "${options.tier}". Valid options: ${validTiers.join(', ')}`);
    process.exit(1);
  }

  // Validate feature flag
  if (options.feature !== 'all') {
    const fNum = parseInt(options.feature, 10);
    if (isNaN(fNum) || fNum < 1 || fNum > 23) {
      console.error(`Error: Invalid feature "${options.feature}". Must be between 1 and 23 or "all".`);
      process.exit(1);
    }
  }

  // Select test suites based on tier
  let selectedTests = [];
  if (options.tier === '1' || options.tier === 'all') {
    selectedTests.push(...tier1Tests);
  }
  if (options.tier === '2' || options.tier === 'all') {
    selectedTests.push(...tier2Tests);
  }
  if (options.tier === '3' || options.tier === 'all') {
    selectedTests.push(...tier3Tests);
  }
  if (options.tier === '4' || options.tier === 'all') {
    selectedTests.push(...tier4Tests);
  }

  // Filter by feature if specified
  if (options.feature !== 'all') {
    const targetFeature = parseInt(options.feature, 10);
    selectedTests = selectedTests.filter(t => t.feature === targetFeature);
  }

  if (selectedTests.length === 0) {
    console.log('# No tests matched the selected filter criteria.');
    process.exit(0);
  }

  // Output TAP header
  console.log('TAP version 13');
  console.log(`1..${selectedTests.length}`);

  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  const overallStartTime = Date.now();

  const ctx = {
    dryRun: options.dryRun,
    verbose: options.verbose,
    pacingMs: options.pacingMs,
    tier: options.tier,
    feature: options.feature
  };

  for (let i = 0; i < selectedTests.length; i++) {
    const test = selectedTests[i];
    const testNum = i + 1;
    const testStartTime = Date.now();
    let pass = false;
    let errorDetails = null;

    try {
      await test.run(ctx);
      pass = true;
      passedCount++;
      console.log(`ok ${testNum} - [${test.id}] ${test.name}`);
      if (options.verbose) {
        console.log(`  --- # DURATION: ${Date.now() - testStartTime}ms`);
      }
    } catch (err) {
      pass = false;
      failedCount++;
      console.log(`not ok ${testNum} - [${test.id}] ${test.name}`);
      console.log('  ---');
      console.log(`  operator: ${err.operator || 'error'}`);
      console.log(`  expected: ${JSON.stringify(err.expected ?? 'pass')}`);
      console.log(`  actual:   ${JSON.stringify(err.actual ?? 'error')}`);
      console.log(`  message:  ${JSON.stringify(err.message)}`);
      if (options.verbose && err.stack) {
        console.log(`  stack:    |`);
        for (const line of err.stack.split('\n')) {
          console.log(`    ${line}`);
        }
      }
      console.log('  ---');

      errorDetails = {
        message: err.message,
        operator: err.operator,
        expected: err.expected,
        actual: err.actual,
        stack: err.stack
      };

      if (options.bail) {
        console.log(`Bail out! Execution halted on failure at test ${testNum}: [${test.id}] ${test.name}`);
        break;
      }
    }

    const testDurationMs = Date.now() - testStartTime;
    results.push({
      testNum,
      id: test.id,
      name: test.name,
      tier: test.tier,
      feature: test.feature,
      pass,
      durationMs: testDurationMs,
      error: errorDetails
    });
  }

  const overallDurationSec = ((Date.now() - overallStartTime) / 1000).toFixed(2);
  const totalRan = passedCount + failedCount + skippedCount;
  const isSuccess = failedCount === 0;

  // Print Summary Box
  console.log('\n==============================================================');
  console.log(' PRINTS WITH PASSION — E2E RECOVERY TEST RUNNER SUMMARY');
  console.log('==============================================================');
  console.log(` Mode:             ${options.dryRun ? 'OFFLINE FIXTURE (dry-run)' : 'LIVE STOREFRONT & API'}`);
  console.log(` Total Tests Run:  ${totalRan}`);
  console.log(` Passed:           ${passedCount}`);
  console.log(` Failed:           ${failedCount}`);
  console.log(` Skipped:          ${skippedCount}`);
  console.log(` Duration:         ${overallDurationSec}s`);
  console.log(` Final Verdict:    ${isSuccess ? 'PASS' : 'FAIL'}`);
  console.log('==============================================================\n');

  // Export JSON Report if requested
  if (options.json) {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
    const reportPath = path.join(REPORTS_DIR, 'e2e_report.json');

    const tierBreakdown = {
      tier1: { total: 0, passed: 0, failed: 0 },
      tier2: { total: 0, passed: 0, failed: 0 },
      tier3: { total: 0, passed: 0, failed: 0 },
      tier4: { total: 0, passed: 0, failed: 0 }
    };

    for (const r of results) {
      const key = `tier${r.tier}`;
      if (tierBreakdown[key]) {
        tierBreakdown[key].total++;
        if (r.pass) tierBreakdown[key].passed++;
        else tierBreakdown[key].failed++;
      }
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      mode: options.dryRun ? 'dry-run' : 'live',
      options: {
        tier: options.tier,
        feature: options.feature,
        pacingMs: options.pacingMs,
        bail: options.bail
      },
      summary: {
        total: totalRan,
        passed: passedCount,
        failed: failedCount,
        skipped: skippedCount,
        durationSeconds: parseFloat(overallDurationSec)
      },
      tiers: tierBreakdown,
      results
    };

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf8');
    console.log(`[Report] JSON test report successfully saved to: ${reportPath}`);
  }

  process.exit(isSuccess ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
