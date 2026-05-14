'use strict';

// Safety rails shared by all import scripts.
// Call runGuards() at the top of each script, before any API work.

const fs   = require('fs');
const path = require('path');

const PRODUCTION_STORES = ['ezquest-4.myshopify.com'];
const READINESS_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'migration-readiness.md');
const LOGS_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'logs');

function isDryRun() {
  return !process.argv.includes('--apply');
}

function checkProductionGuard(store) {
  const isProd = PRODUCTION_STORES.some(s => store.includes(s.split('.')[0]));
  if (isProd && !process.argv.includes('--confirm-production')) {
    console.error(`\n🔴 PRODUCTION STORE DETECTED: ${store}`);
    console.error('   Import scripts refuse to run against production without explicit confirmation.');
    console.error('   Add --confirm-production to the command if you are certain.');
    console.error('   For dry-run against production data: omit --apply (already the default).\n');
    process.exit(1);
  }
}

function checkReadinessGate() {
  if (!fs.existsSync(READINESS_PATH)) {
    console.error(`\n🔴 migration-readiness.md not found at ${READINESS_PATH}`);
    console.error('   Run scripts/migration/05-readiness-report.js first.\n');
    process.exit(1);
  }
  const content = fs.readFileSync(READINESS_PATH, 'utf8');
  if (!content.includes('🟢 READY FOR DNS CUTOVER')) {
    console.error('\n🔴 Infrastructure gates are not all green.');
    console.error(`   Check ${READINESS_PATH} and resolve failing gates before importing data.\n`);
    process.exit(1);
  }
}

function createRequestLogger(scriptName) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logPath = path.join(LOGS_DIR, `${scriptName}-${ts}.jsonl`);

  function log(entry) {
    fs.appendFileSync(logPath, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
  }

  return { log, logPath };
}

function runGuards(store, scriptName) {
  checkProductionGuard(store);
  checkReadinessGate();

  const dryRun = isDryRun();
  const { log, logPath } = createRequestLogger(scriptName);

  if (dryRun) {
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│  DRY RUN — no API calls will be made                │');
    console.log('│  Pass --apply to execute for real                   │');
    console.log('└─────────────────────────────────────────────────────┘');
  } else {
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│  LIVE RUN — API calls WILL be made                  │');
    console.log('└─────────────────────────────────────────────────────┘');
  }
  console.log(`Request log: ${logPath}\n`);

  return { dryRun, log, logPath };
}

module.exports = { runGuards, isDryRun, createRequestLogger };
