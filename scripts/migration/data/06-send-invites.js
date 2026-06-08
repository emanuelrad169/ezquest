'use strict';

// Phase 6 — Post-cutover: send "set your password" invites to migrated customers.
// Run ONLY after ezq.com DNS cutover is confirmed live and 07-post-cutover.js passes.
//
// Sends in three batches with 1-hour gap to let support triage:
//   Batch 1: regular customers (tag: migrated, NOT wholesale, NOT gift-card-holder)
//   Batch 2: wholesale customers (tag: wholesale)
//   Batch 3: gift card holders (list from gift-cards-reissued.csv)
//
// Usage: node scripts/migration/data/06-send-invites.js [--batch 1|2|3] [--dry-run]

const fs   = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, shopifyPost, sleep } = require('../lib');

const { base, token } = loadEnv();

const BATCH     = process.argv.includes('--batch') ? parseInt(process.argv[process.argv.indexOf('--batch') + 1], 10) : null;
const DRY_RUN   = process.argv.includes('--dry-run');
const LOG       = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'migration-log.jsonl');
const GC_CSV    = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'gift-cards-reissued.csv');

if (!BATCH || ![1, 2, 3].includes(BATCH)) {
  console.error('Usage: node 06-send-invites.js --batch 1|2|3 [--dry-run]');
  console.error('  Batch 1: regular migrated customers');
  console.error('  Batch 2: wholesale customers');
  console.error('  Batch 3: gift card holders (requires gift-cards-reissued.csv)');
  process.exit(1);
}

if (DRY_RUN) console.log('[DRY RUN] No invites will be sent\n');

function appendLog(entry) {
  fs.appendFileSync(LOG, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');
}

async function fetchCustomersByTag(tag) {
  const customers = [];
  let url = `${base}/customers.json?tag=${encodeURIComponent(tag)}&limit=250&fields=id,email,tags`;
  while (url) {
    const { json, link } = await shopifyGet(url, token);
    customers.push(...(json.customers || []));
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
    if (next) await sleep(250);
  }
  return customers;
}

async function sendInvite(customerId, email) {
  const { ok, status, json } = await shopifyPost(
    `${base}/customers/${customerId}/send_invite.json`,
    token,
    {}
  );
  return { ok, status, error: ok ? null : (json?.errors ? JSON.stringify(json.errors) : `HTTP ${status}`) };
}

(async () => {
  let customers = [];

  if (BATCH === 1) {
    console.log('Fetching regular migrated customers (not wholesale)...');
    const all = await fetchCustomersByTag('migrated');
    customers = all.filter(c => !c.tags?.includes('wholesale'));
    console.log(`Found ${customers.length} regular customers`);
  } else if (BATCH === 2) {
    console.log('Fetching wholesale customers...');
    customers = await fetchCustomersByTag('wholesale');
    console.log(`Found ${customers.length} wholesale customers`);
  } else if (BATCH === 3) {
    console.log('Fetching gift card holders...');
    if (!fs.existsSync(GC_CSV)) {
      console.error(`Gift card reissued CSV not found: ${GC_CSV}`);
      console.error('Run reissue-gift-cards.js first.');
      process.exit(1);
    }
    // Load emails from gift card CSV and look up their Shopify customer IDs
    const lines = fs.readFileSync(GC_CSV, 'utf8').trim().split('\n').slice(1);
    const emails = lines.map(l => l.split(',')[1]?.replace(/"/g, '').trim()).filter(Boolean);
    for (const email of emails) {
      const { json } = await shopifyGet(
        `${base}/customers/search.json?query=${encodeURIComponent('email:' + email)}&fields=id,email,tags&limit=1`,
        token
      );
      if (json.customers?.[0]) customers.push(json.customers[0]);
      await sleep(100);
    }
    console.log(`Found ${customers.length} gift card holder accounts`);
  }

  if (customers.length === 0) {
    console.log('No customers to invite.');
    return;
  }

  let sent = 0, failed = 0;
  const failures = [];

  for (const customer of customers) {
    if (DRY_RUN) {
      console.log(`  [dry] Would send invite to ${customer.email}`);
      sent++;
      continue;
    }

    const result = await sendInvite(customer.id, customer.email);
    if (result.ok) {
      sent++;
      appendLog({ action: 'invite_sent', customerId: customer.id, email: customer.email, batch: BATCH });
      if (sent % 25 === 0) console.log(`  Sent ${sent}...`);
    } else {
      failed++;
      failures.push({ email: customer.email, error: result.error });
      appendLog({ action: 'invite_fail', customerId: customer.id, email: customer.email, batch: BATCH, error: result.error });
      console.error(`  ✗ ${customer.email}: ${result.error}`);
    }
    await sleep(250);
  }

  console.log(`\n── Batch ${BATCH} complete`);
  console.log(`Sent: ${sent} | Failed: ${failed}`);

  if (BATCH < 3 && !DRY_RUN) {
    console.log(`\nWait 1 hour before running Batch ${BATCH + 1} to let support triage incoming questions.`);
    console.log(`Then: node scripts/migration/data/06-send-invites.js --batch ${BATCH + 1}`);
  }

  if (failed > 0) process.exit(1);
})();
