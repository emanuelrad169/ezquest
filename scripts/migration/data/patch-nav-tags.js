'use strict';
// patch-nav-tags.js — one-shot targeted tag additions for collection parity.
// Idempotent: only adds tags not already present.
//
// Usage:
//   node patch-nav-tags.js                           # dry-run
//   node patch-nav-tags.js --apply --confirm-production

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN        || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION  || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const DELAY_MS = 400;

// { handle: [tags to add] }
const PATCHES = {
  // §1 — USB-C Hubs: add 2 card readers that legacy cross-lists in Hubs
  'usb-c-card-reader-ss42':                                    ['nav-usb-c-hubs'],
  'usb-c-cfast-2-0-card-reader-5-ports-with-uhs-ii-sd-micro-sd': ['nav-usb-c-hubs'],

  // §2 — Card Readers: add 4 multi-port hubs that include a card-reader slot
  'dual-hdmi-usb-c-multimedia-hub-adapter-12-ports':           ['nav-usb-c-card-readers'],
  'dual-usb-c-multimedia-hub-13-ports':                        ['nav-usb-c-card-readers'],
  'usb-c-multimedia-hub-adapter-8-ports-with-4k-60hz-power-delivery-3': ['nav-usb-c-card-readers'],
  'usb-c-multimedia-hub-adapter-8-ports':                      ['nav-usb-c-card-readers'],
};

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

  const { dryRun, log } = runGuards(STORE, 'patch-nav-tags');

  let updated = 0, skipped = 0, errors = 0;

  for (const [handle, tagsToAdd] of Object.entries(PATCHES)) {
    let data;
    try {
      data = await shopifyGet(`/products.json?handle=${handle}&fields=id,handle,tags`);
    } catch (err) {
      console.error(`  ✗ GET ${handle}: ${err.message}`);
      errors++;
      continue;
    }

    const product = data.products?.[0];
    if (!product) {
      console.error(`  ✗ NOT FOUND: ${handle}`);
      errors++;
      continue;
    }

    const existingTags = new Set(
      product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    );
    const newTags = tagsToAdd.filter(t => !existingTags.has(t));

    if (newTags.length === 0) {
      console.log(`  — ${handle}: already has ${tagsToAdd.join(', ')}`);
      log({ action: 'skip', handle, reason: 'already_tagged' });
      skipped++;
      continue;
    }

    const mergedTags = [...existingTags, ...newTags].join(', ');
    console.log(`  + ${handle}`);
    console.log(`      adding: ${newTags.join(', ')}`);

    log({ action: dryRun ? 'dry_run' : 'add_tags', handle, tags: newTags });

    if (!dryRun) {
      try {
        await shopifyPut(`/products/${product.id}.json`, {
          product: { id: product.id, tags: mergedTags },
        });
        console.log(`      written`);
        updated++;
      } catch (err) {
        console.error(`      ✗ write error: ${err.message}`);
        log({ action: 'error', handle, error: err.message });
        errors++;
      }
    } else {
      updated++;
    }
  }

  console.log('');
  console.log('──────────────────────────────────────────────────');
  if (dryRun) {
    console.log(`Dry-run. Would update: ${updated} | Already tagged: ${skipped} | Errors: ${errors}`);
    console.log('Pass --apply --confirm-production to write for real.');
  } else {
    console.log(`Done. Updated: ${updated} | Already tagged: ${skipped} | Errors: ${errors}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
