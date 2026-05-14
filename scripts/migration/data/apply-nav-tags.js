'use strict';
// apply-nav-tags.js
// Reads docs/migration/category-product-map.json and applies nav-* tags to
// each product via the Shopify Admin REST API.
//
// Idempotent: only adds tags that are not already present.
//
// Usage:
//   node apply-nav-tags.js                           # dry-run
//   node apply-nav-tags.js --apply --confirm-production

const fs   = require('fs');
const path = require('path');

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN        || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION  || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const MAP_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'category-product-map.json');

const DELAY_MS = 400;

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

  const { dryRun, log } = runGuards(STORE, 'apply-nav-tags');

  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

  // Build: productId → Set<tag> to add
  const productTagsToAdd = new Map();
  for (const [, cat] of Object.entries(map)) {
    for (const id of cat.productIds) {
      if (!productTagsToAdd.has(id)) productTagsToAdd.set(id, new Set());
      productTagsToAdd.get(id).add(cat.tag);
    }
  }

  console.log(`Products requiring tag updates: ${productTagsToAdd.size}\n`);

  let updated = 0, skipped = 0, errors = 0;

  for (const [productId, tagsToAdd] of productTagsToAdd.entries()) {
    let productData;
    try {
      productData = await shopifyGet(`/products/${productId}.json?fields=id,handle,tags`);
    } catch (err) {
      console.error(`  ✗ GET product ${productId}: ${err.message}`);
      errors++;
      continue;
    }

    const product = productData.product;
    const existingTags = new Set(
      product.tags ? product.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    );

    const newTags = [...tagsToAdd].filter(t => !existingTags.has(t));

    if (newTags.length === 0) {
      console.log(`  — ${product.handle}: already has all tags (${[...tagsToAdd].join(', ')})`);
      log({ action: 'skip', id: productId, handle: product.handle, reason: 'tags_already_present' });
      skipped++;
      continue;
    }

    const mergedTags = [...existingTags, ...newTags].join(', ');
    console.log(`  + ${product.handle}`);
    console.log(`      adding: ${newTags.join(', ')}`);

    log({ action: dryRun ? 'dry_run' : 'add_tags', id: productId, handle: product.handle, tags: newTags });

    if (!dryRun) {
      try {
        await shopifyPut(`/products/${productId}.json`, {
          product: { id: productId, tags: mergedTags },
        });
        console.log(`      written`);
        updated++;
      } catch (err) {
        console.error(`      ✗ write error: ${err.message}`);
        log({ action: 'error', id: productId, handle: product.handle, error: err.message });
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
