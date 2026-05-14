'use strict';
// restore-tm-symbols.js
// Restores trademark symbols (™ ®) and en-dashes (–) to 11 product titles
// that were corrupted by the earlier mojibake sweep.
//
// Usage:
//   node restore-tm-symbols.js                           # dry-run
//   node restore-tm-symbols.js --apply --confirm-production

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN        || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION  || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const DELAY_MS = 250;

const TITLE_FIXES = [
  { handle: 'c40012-duraguard-usb4-v2-1point2-meter-cable',             title: 'DuraGuard™ USB4 V2 1.2 Meter Cable' },
  { handle: 'c41005-duraguard-usb4-v2-0point5-meter-extension-cable',   title: 'DuraGuard™ USB4 One Meter Extension Cable' },
  { handle: 'duraguard-usb-c-to-usb-c-charge-and-sync-cable',          title: 'DuraGuard™ USB-C to USB-C Charge and Sync Cable (1.2 or 2 Meter)' },
  { handle: 'duraguard-usb-c-to-displayport-4k-60hz-cable',            title: 'DuraGuard™ USB-C to DisplayPort 4K 60Hz Cable' },
  { handle: 'duraguard-usb-c-to-hdmi-4k-60hz-cable-with-hdr',          title: 'DuraGuard™ USB-C to HDMI 4K 60Hz Cable with HDR' },
  { handle: 'duraguard-usbc-to-hdmi-8k-60hz-cable-with-hdr-details-ss103', title: 'DuraGuard™ USB-C to HDMI 8K 60Hz Cable with HDR' },
  { handle: 'duraguard-stereo-audio-cable',                             title: 'DuraGuard™ Stereo Audio Cable' },
  { handle: 'x40100-duraguard-usb-c-to-usb-a-3-0-female-cable-adapter', title: 'DuraGuard™ USB-C to USB-A 3.0 Female Cable Adapter' },
  { handle: 'pro-series-usb-c-5in1-hub',                               title: 'USB-C 5-in-1 Multimedia Hub – Pro Series' },
  { handle: 'usb-c-dual-display-12-in-1-multimedia-hub-pro-series',    title: 'USB-C Dual Display 12-in-1 Multimedia Hub – Pro Series' },
  { handle: 'ultra-hd-high-speed-hdmi-10k-60hz-cable',                 title: 'Ultra HD High Speed HDMI® 10K 60Hz Cable' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shopifyGet(path_) {
  await sleep(DELAY_MS);
  const res = await fetch(`${BASE}${path_}`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`GET ${path_} → ${res.status}`);
  return res.json();
}

async function shopifyPut(path_, body) {
  await sleep(DELAY_MS);
  const res = await fetch(`${BASE}${path_}`, {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${path_} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'restore-tm-symbols');

  let updated = 0, skipped = 0, errors = 0;

  for (const fix of TITLE_FIXES) {
    let data;
    try {
      data = await shopifyGet(`/products.json?handle=${fix.handle}&fields=id,handle,title`);
    } catch (err) {
      console.error(`  ✗ GET ${fix.handle}: ${err.message}`);
      errors++;
      continue;
    }

    const product = data.products?.[0];
    if (!product) {
      console.error(`  ✗ NOT FOUND: ${fix.handle}`);
      errors++;
      continue;
    }

    if (product.title === fix.title) {
      console.log(`  — ${fix.handle}: already correct`);
      log({ action: 'skip', handle: fix.handle, reason: 'already_correct' });
      skipped++;
      continue;
    }

    console.log(`  → ${fix.handle}`);
    console.log(`      was: ${product.title}`);
    console.log(`      now: ${fix.title}`);
    log({ action: dryRun ? 'dry_run' : 'update', handle: fix.handle, old_title: product.title, new_title: fix.title });

    if (!dryRun) {
      try {
        await shopifyPut(`/products/${product.id}.json`, {
          product: { id: product.id, title: fix.title },
        });
        console.log(`      written`);
        updated++;
      } catch (err) {
        console.error(`      ✗ write error: ${err.message}`);
        log({ action: 'error', handle: fix.handle, error: err.message });
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log('');
  console.log('─'.repeat(50));
  if (dryRun) {
    console.log(`Dry-run. Would update: ${updated} | Already correct: ${skipped} | Errors: ${errors}`);
    console.log('Pass --apply --confirm-production to write for real.');
  } else {
    console.log(`Done. Updated: ${updated} | Already correct: ${skipped} | Errors: ${errors}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
