'use strict';
// delete-demo-products.js
// Deletes the 4 demo placeholder products that have no legacy ezq.com counterpart.
//
// Usage:
//   node delete-demo-products.js                           # dry-run
//   node delete-demo-products.js --apply --confirm-production
//
// Pre-requisite: docs/migration/pre-delete-audit-{date}.md must exist.
// Safety rails: dry-run default, --apply + --confirm-production for live run.

const fs   = require('fs');
const path = require('path');

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN   || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const AUDIT_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'migration');

// Exact product IDs + expected handles — halt if handle does not match.
const TARGET_PRODUCTS = [
  { id: 8832352190662, handle: 'usb-c-pro-dock',                                     title: 'USB-C Pro Dock' },
  { id: 8832352092358, handle: 'usb-c-travel-hub',                                   title: 'USB-C Travel Hub' },
  { id: 8832352813254, handle: 'duraguard-stereo-audio-cable-90-degree',             title: 'DuraGuard Stereo Audio Cable 90 Degree' },
  { id: 8832352878790, handle: 'superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack', title: 'SuperSpeed Gen 1 USB-C to USB-A Mini Adapter 2 Pack' },
];

// Safety: refuse to delete these IDs under any circumstances.
const PROTECTED_IDS = new Set([8832352780486, 8832352846022]);

const DELAY_MS = 500;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shopifyRequest(method, path_, body) {
  const opts = {
    method,
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  await sleep(DELAY_MS);
  const res = await fetch(`${BASE}${path_}`, opts);
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`${method} ${path_} -- ${res.status}: ${text.slice(0, 200)}`);
  }
  return { status: res.status, body: res.status !== 204 ? await res.json().catch(() => null) : null };
}

function checkAuditExists() {
  const files = fs.readdirSync(AUDIT_DIR).filter(f => f.startsWith('pre-delete-audit-') && f.endsWith('.md'));
  if (files.length === 0) {
    console.error('\nAudit file not found. Run audit-pre-delete.js first.');
    console.error(`Expected: ${AUDIT_DIR}/pre-delete-audit-{date}.md\n`);
    process.exit(1);
  }
  const latest = files.sort().pop();
  console.log(`Audit verified: ${latest}\n`);
}

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'delete-demo-products');

  checkAuditExists();

  // Safety check: none of the target IDs may be in the protected list.
  for (const p of TARGET_PRODUCTS) {
    if (PROTECTED_IDS.has(p.id)) {
      console.error(`SAFETY HALT: id ${p.id} is in the protected list. Aborting.`);
      process.exit(1);
    }
  }

  console.log('Verifying products exist and handles match...\n');

  let verifyFailed = false;
  const verified = [];

  for (const target of TARGET_PRODUCTS) {
    const { body } = await shopifyRequest('GET', `/products/${target.id}.json?fields=id,handle,title`);
    const product = body?.product;

    if (!product) {
      console.log(`  NOT FOUND: id ${target.id} (${target.handle}) -- already deleted or ID wrong`);
      log({ action: 'verify', id: target.id, handle: target.handle, status: 'not_found' });
      continue;
    }

    if (product.handle !== target.handle) {
      console.error(`  HANDLE MISMATCH: id ${target.id}`);
      console.error(`    Expected: ${target.handle}`);
      console.error(`    Got:      ${product.handle}`);
      console.error('  Manifest is stale. Aborting.');
      verifyFailed = true;
      break;
    }

    console.log(`  OK: ${product.handle} (id: ${product.id})`);
    log({ action: 'verify', id: target.id, handle: target.handle, status: 'ok', title: product.title });
    verified.push(target);
  }

  if (verifyFailed) process.exit(1);

  if (verified.length === 0) {
    console.log('\nAll products already deleted. Nothing to do.');
    process.exit(0);
  }

  console.log('');

  if (dryRun) {
    console.log('DRY RUN -- would delete:');
    for (const p of verified) {
      console.log(`  DELETE /products/${p.id}.json  (${p.handle})`);
    }
    console.log('\nPass --apply --confirm-production to execute.');
    return;
  }

  // Live delete
  let deleted = 0, errors = 0;

  for (const p of verified) {
    try {
      const { status } = await shopifyRequest('DELETE', `/products/${p.id}.json`);
      if (status === 200 || status === 204) {
        console.log(`  DELETED: ${p.handle} (id: ${p.id})`);
        log({ action: 'delete', id: p.id, handle: p.handle, status: 'success', deleted_at: new Date().toISOString() });
        deleted++;
      } else if (status === 404) {
        console.log(`  SKIPPED (already gone): ${p.handle}`);
        log({ action: 'delete', id: p.id, handle: p.handle, status: 'already_deleted' });
      }
    } catch (err) {
      console.error(`  ERROR deleting ${p.handle}: ${err.message}`);
      log({ action: 'delete', id: p.id, handle: p.handle, status: 'error', error: err.message });
      errors++;
    }
  }

  // Verify count
  await sleep(1000);
  const countRes = await shopifyRequest('GET', '/products/count.json');
  const remaining = countRes.body?.count ?? '?';

  console.log('');
  console.log('----------------------------------------------------------');
  console.log(`Done. Deleted: ${deleted} | Errors: ${errors}`);
  console.log(`Products remaining in store: ${remaining}`);
  log({ action: 'summary', deleted, errors, remaining_count: remaining });
}

main().catch(err => { console.error(err); process.exit(1); });
