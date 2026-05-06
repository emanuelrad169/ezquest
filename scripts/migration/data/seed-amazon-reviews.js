'use strict';

// Seeds Amazon review metafields (ASIN, rating, review count) per product.
// Reads a CSV with columns: handle, asin, rating, count
// Idempotent — safe to run repeatedly; later values overwrite earlier ones.
// Dry-run by default. Pass --apply to write to the store.
//
// Usage:
//   node scripts/migration/data/seed-amazon-reviews.js amazon-reviews.csv
//   node scripts/migration/data/seed-amazon-reviews.js amazon-reviews.csv --apply
//   node scripts/migration/data/seed-amazon-reviews.js amazon-reviews.csv --apply --confirm-production
//
// CSV format (header row required):
//   handle,asin,rating,count
//   magnetic-usb-c-m-2-nvme-ssd-enclosure,B08R63NWGQ,4.6,127
//   usb-c-multimedia-hub-adapter-13-ports,B08XYZ1234,4.4,89

const fs   = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const STORE = process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN) {
  process.stderr.write('Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN\n');
  process.exit(1);
}

const { runGuards } = require('./safety.js');

const SELLER_ID = 'A34WE8HAFZHTZW';

// ─── CSV parse ────────────────────────────────────────────────────────────────

const inputFile = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!inputFile) {
  process.stderr.write('Usage: node seed-amazon-reviews.js <csv-file> [--apply] [--confirm-production]\n');
  process.exit(1);
}

function parseCSV(filePath) {
  const text = fs.readFileSync(path.resolve(filePath), 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cells.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

// ─── Shopify REST helpers ──────────────────────────────────────────────────────

const REST_BASE = `https://${STORE}/admin/api/2026-01`;

async function restGet(path) {
  const res = await fetch(`${REST_BASE}${path}`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`GET ${path} → HTTP ${res.status}`);
  return res.json();
}

async function productIdByHandle(handle) {
  const data = await restGet(`/products.json?handle=${encodeURIComponent(handle)}&fields=id,handle&limit=1`);
  return data.products?.[0]?.id || null;
}

async function setMetafield(productId, namespace, key, type, value) {
  const res = await fetch(`${REST_BASE}/products/${productId}/metafields.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      metafield: { namespace, key, type, value: String(value) },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST metafield ${key} → HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const { dryRun, log } = runGuards(STORE, 'seed-amazon-reviews');

  let rows;
  try {
    rows = parseCSV(inputFile);
  } catch (err) {
    process.stderr.write(`Cannot read CSV: ${err.message}\n`);
    process.exit(1);
  }
  console.log(`Loaded ${rows.length} rows from ${inputFile}\n`);

  let ok = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    const handle = row.handle || row.shopify_handle;
    const asin   = (row.asin || '').trim().toUpperCase();
    const rating  = parseFloat(row.rating);
    const count   = parseInt(row.count || row.review_count || '0', 10);

    if (!handle || !asin) {
      console.log(`  [skip] missing handle or asin: ${JSON.stringify(row)}`);
      skipped++;
      continue;
    }
    if (isNaN(rating) || rating < 0 || rating > 5) {
      console.log(`  [skip] invalid rating "${row.rating}" for ${handle}`);
      skipped++;
      continue;
    }

    process.stdout.write(`  ${handle} (${asin}, ${rating}, ${count} reviews) ... `);

    if (dryRun) {
      console.log('dry');
      log({ op: 'dry_run', handle, asin, rating, count });
      ok++;
      continue;
    }

    try {
      const productId = await productIdByHandle(handle);
      if (!productId) {
        console.log('NOT FOUND');
        log({ op: 'not_found', handle });
        skipped++;
        continue;
      }

      await Promise.all([
        setMetafield(productId, 'custom', 'amazon_asin',         'single_line_text_field', asin),
        setMetafield(productId, 'custom', 'amazon_rating',        'number_decimal',         rating.toFixed(1)),
        setMetafield(productId, 'custom', 'amazon_review_count',  'number_integer',         count),
        setMetafield(productId, 'custom', 'amazon_seller_id',     'single_line_text_field', SELLER_ID),
      ]);

      console.log('ok');
      log({ op: 'seeded', handle, productId, asin, rating, count });
      ok++;
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      log({ op: 'error', handle, error: err.message });
      errors++;
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Done: ${ok} ok, ${skipped} skipped, ${errors} errors`);
  if (errors > 0) process.exit(1);
})();
