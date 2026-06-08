'use strict';
// seed-product-content.js
// Reads docs/migration/legacy-product-content.json and writes 4 content
// metafields (Features, Specifications, Highlight, Compatibility HTML) to
// each matching Shopify product.
//
// Usage:
//   node seed-product-content.js                          # dry-run
//   node seed-product-content.js --apply --confirm-production  # live write
//   node seed-product-content.js --apply --confirm-production --handle=magnetic-usb-c-m-2-nvme-ssd-enclosure
//
// Idempotent: skips write if existing metafield value matches.
// Rate: 250 ms between writes (~4 req/s, safe for standard plan).

const fs   = require('fs');
const path = require('path');

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN   || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const JSON_PATH   = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'legacy-product-content.json');
const MISSING_LOG = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'seed-content-missing-handles.txt');

// Section key in JSON → metafield key in Shopify
const SECTION_MAP = {
  Features:      'product_features',
  Specifications:'product_specifications',
  Highlight:     'product_highlight',
  Compatibility: 'product_compatibility_html',
  // Downloads intentionally omitted — handled by ezquest_download metaobjects
};

const DELAY_MS = 400; // ~2.5 req/s — comfortable below 4/s burst limit

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shopifyRequest(method, path_, body) {
  const opts = {
    method,
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  let attempt = 0;
  while (true) {
    await sleep(DELAY_MS);
    const res = await fetch(`${BASE}${path_}`, opts);
    if (res.status === 429) {
      const retryAfter = parseFloat(res.headers.get('Retry-After') || '2');
      const wait = Math.max(retryAfter * 1000, 2000) * Math.pow(1.5, attempt);
      console.warn(`    [429] rate limited — waiting ${(wait / 1000).toFixed(1)}s (attempt ${attempt + 1})`);
      await sleep(wait);
      attempt++;
      if (attempt > 5) throw new Error(`${method} ${path_} → 429 after 5 retries`);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path_} → ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
}

const shopifyGet  = (p)    => shopifyRequest('GET',  p);
const shopifyPost = (p, b) => shopifyRequest('POST', p, b);
const shopifyPut  = (p, b) => shopifyRequest('PUT',  p, b);

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'seed-product-content');

  // Optional single-handle filter
  const handleFilter = (process.argv.find(a => a.startsWith('--handle=')) || '').replace('--handle=', '') || null;

  const products = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  const filtered = handleFilter ? products.filter(p => p.handle === handleFilter) : products;

  if (handleFilter && filtered.length === 0) {
    console.error(`Handle not found in JSON: ${handleFilter}`);
    process.exit(1);
  }

  console.log(`Products to process: ${filtered.length}${handleFilter ? ` (filtered: ${handleFilter})` : ''}`);
  console.log('');

  const missing = [];
  let written = 0, skipped = 0, errors = 0;

  for (const entry of filtered) {
    const handle  = entry.handle;
    const sections = entry.sections || {};

    // 1. Resolve product ID by handle
    let product;
    try {
      const data = await shopifyGet(`/products.json?handle=${encodeURIComponent(handle)}&fields=id,handle,title`);
      product = (data.products || [])[0];
    } catch (err) {
      console.error(`  ✗ ${handle}: lookup error — ${err.message}`);
      log({ action: 'lookup', handle, status: 'error', error: err.message });
      errors++;
      continue;
    }

    if (!product) {
      console.warn(`  ⚠ ${handle}: product not found in Shopify — skipping`);
      log({ action: 'lookup', handle, status: 'missing' });
      missing.push(handle);
      continue;
    }

    console.log(`  → ${handle} (id: ${product.id})`);

    // 2. Fetch existing metafields for this product (skip in dry-run)
    const existingMap = {};
    if (!dryRun) {
      try {
        const data = await shopifyGet(`/products/${product.id}/metafields.json?namespace=custom`);
        for (const mf of (data.metafields || [])) existingMap[mf.key] = mf;
      } catch (err) {
        console.error(`    ✗ could not fetch existing metafields: ${err.message}`);
        errors++;
        continue;
      }
    }

    // 3. Write each section
    for (const [sectionKey, metafieldKey] of Object.entries(SECTION_MAP)) {
      const html = (sections[sectionKey] || '').trim();
      if (!html) {
        console.log(`     ${sectionKey}: (empty) — skip`);
        continue;
      }

      const existing = existingMap[metafieldKey];

      if (existing && existing.value === html) {
        console.log(`     ${sectionKey}: unchanged — skip`);
        skipped++;
        log({ action: 'skip', handle, key: metafieldKey, reason: 'unchanged' });
        continue;
      }

      if (dryRun) {
        const action = existing ? 'would update' : 'would create';
        console.log(`     ${sectionKey}: ${action} (${html.length} chars)`);
        log({ action: 'dry_run', handle, key: metafieldKey, chars: html.length, wouldUpdate: !!existing });
        continue;
      }

      // Live write
      await sleep(DELAY_MS);

      try {
        if (existing) {
          await shopifyPut(`/products/${product.id}/metafields/${existing.id}.json`, {
            metafield: { id: existing.id, value: html, type: 'multi_line_text_field' },
          });
          console.log(`     ${sectionKey}: updated (${html.length} chars)`);
          log({ action: 'update', handle, key: metafieldKey, chars: html.length, metafieldId: existing.id });
        } else {
          await shopifyPost(`/products/${product.id}/metafields.json`, {
            metafield: { namespace: 'custom', key: metafieldKey, value: html, type: 'multi_line_text_field' },
          });
          console.log(`     ${sectionKey}: created (${html.length} chars)`);
          log({ action: 'create', handle, key: metafieldKey, chars: html.length });
        }
        written++;
      } catch (err) {
        console.error(`     ${sectionKey}: ERROR — ${err.message}`);
        log({ action: 'error', handle, key: metafieldKey, error: err.message });
        errors++;
      }
    }
  }

  // 4. Write missing handles file
  if (missing.length > 0) {
    fs.writeFileSync(MISSING_LOG, missing.join('\n') + '\n');
    console.log(`\n⚠  ${missing.length} handle(s) not found in Shopify → ${MISSING_LOG}`);
  }

  console.log('');
  console.log('─────────────────────────────────────────────────────');
  if (dryRun) {
    console.log(`Dry-run complete. ${filtered.length - missing.length} products resolved.`);
    console.log(`${missing.length} missing handles.`);
    console.log('Pass --apply --confirm-production to write for real.');
  } else {
    console.log(`Done. Written: ${written} | Skipped (unchanged): ${skipped} | Errors: ${errors} | Missing: ${missing.length}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
