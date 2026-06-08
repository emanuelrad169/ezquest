'use strict';

// Imports normalized orders-shopify.json into Shopify as historical orders.
// Idempotent: checks for existing orders with matching legacy_order_id note attribute.
//
// Usage: node scripts/migration/data/import-orders.js [--apply] [--confirm-production]
//   --apply               make real API calls (default: dry-run)
//   --confirm-production  required when SHOPIFY_SHOP_DOMAIN is the production store

const fs   = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, shopifyPost, sleep } = require('../lib');
const { runGuards } = require('./safety');

const { base, token, store } = loadEnv();
const { dryRun, log } = runGuards(store, 'import-orders');

const INPUT = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'orders-shopify.json');

if (!fs.existsSync(INPUT)) {
  console.error(`Missing input: ${INPUT}`);
  console.error('Run normalize-orders.js first.');
  process.exit(1);
}

// Build a set of already-imported legacy IDs from existing migrated orders
async function fetchImportedLegacyIds() {
  const imported = new Set();
  let url = `${base}/orders.json?status=any&tag=migrated&limit=250&fields=id,note_attributes`;
  while (url) {
    const { json, link } = await shopifyGet(url, token);
    for (const order of json.orders) {
      const attr = (order.note_attributes || []).find(a => a.name === 'legacy_order_id');
      if (attr) imported.add(attr.value);
    }
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
    if (next) await sleep(250);
  }
  return imported;
}

(async () => {
  const orders = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  console.log(`Loaded ${orders.length} orders from orders-shopify.json`);

  let alreadyImported = new Set();
  if (!dryRun) {
    console.log('Checking for previously imported orders...');
    alreadyImported = await fetchImportedLegacyIds();
    console.log(`Found ${alreadyImported.size} already imported\n`);
  }

  let created = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const order of orders) {
    const legacyId = order._meta?.legacyId;

    if (!dryRun && legacyId && alreadyImported.has(String(legacyId))) {
      skipped++;
      continue;
    }

    // Strip internal _meta before sending to API
    const { _meta, ...shopifyOrder } = order;

    if (dryRun) {
      log({ action: 'dry_run_would_create', legacyId, email: order.email });
      console.log(`  [DRY RUN] Would create order #${legacyId} (${order.email})`);
      created++;
      await sleep(50);
      continue;
    }

    const { ok, status, json } = await shopifyPost(`${base}/orders.json`, token, {
      order: shopifyOrder,
    });
    log({ action: ok ? 'order_create' : 'order_fail', legacyId, shopifyId: json?.order?.id, email: order.email, status, error: ok ? undefined : JSON.stringify(json?.errors) });

    if (ok) {
      created++;
      if (created % 10 === 0) console.log(`  Created ${created}...`);
    } else {
      failed++;
      const errMsg = json?.errors ? JSON.stringify(json.errors) : `HTTP ${status}`;
      failures.push({ legacyId, email: order.email, error: errMsg });
      console.error(`  ✗ Order #${legacyId} (${order.email}): ${errMsg}`);
    }

    await sleep(500); // orders get a longer delay — heavier API operation
  }

  const date = new Date().toISOString().slice(0, 10);

  console.log(`\n── Result`);
  console.log(`Created:  ${created}`);
  console.log(`Skipped:  ${skipped} (already imported)`);
  console.log(`Failed:   ${failed}`);

  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  #${f.legacyId} (${f.email}): ${f.error}`));
  }

  // Verify customer linkage (live run only)
  if (!dryRun) {
    console.log('\nVerifying customer order linkage...');
    const emails = [...new Set(orders.map(o => o.email).filter(Boolean))];
    const sampleEmail = emails[0];
    if (sampleEmail) {
      const { json } = await shopifyGet(
        `${base}/customers/search.json?query=${encodeURIComponent('email:' + sampleEmail)}&fields=id,email,orders_count`,
        token
      );
      const customer = json.customers?.[0];
      if (customer) {
        console.log(`  Sample: ${sampleEmail} → orders_count: ${customer.orders_count}`);
      }
    }
  }

  if (failed > 0) process.exit(1);
})();
