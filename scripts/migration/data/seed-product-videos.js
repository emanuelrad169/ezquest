'use strict';

// Seeds custom.product_video_url metafield per product from the extracted CSV.
// Idempotent — safe to run repeatedly.
// Dry-run by default. Pass --apply to write to the store.
//
// Usage:
//   node scripts/migration/data/seed-product-videos.js                  # dry-run
//   node scripts/migration/data/seed-product-videos.js --apply          # write
//   node scripts/migration/data/seed-product-videos.js --apply --confirm-production
//
// Input: docs/migration/legacy-videos-extracted.csv (from extract-legacy-videos.js)
// Only rows with video_kind == 'youtube' or 'vimeo' or 'mp4' and live == 'yes' are seeded.

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

const INPUT_CSV = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'legacy-videos-extracted.csv');

// ─── CSV parse ─────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  // Handles fully-quoted CSV lines: "val1","val2","val3"
  if (line.startsWith('"')) {
    return line.slice(1, -1).split('","').map(c => c.replace(/""/g, '"'));
  }
  return line.split(',').map(c => c.trim());
}

function parseCSV(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

// ─── Shopify REST ──────────────────────────────────────────────────────────────

const REST_BASE = `https://${STORE}/admin/api/2026-01`;

async function productIdByHandle(handle) {
  const res = await fetch(`${REST_BASE}/products.json?handle=${encodeURIComponent(handle)}&fields=id,handle&limit=1`, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`GET products → HTTP ${res.status}`);
  const data = await res.json();
  return data.products?.[0]?.id || null;
}

async function setMetafield(productId, key, type, value) {
  const res = await fetch(`${REST_BASE}/products/${productId}/metafields.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ metafield: { namespace: 'custom', key, type, value: String(value) } }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST metafield ${key} → HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const { dryRun, log } = runGuards(STORE, 'seed-product-videos');

  const allRows = parseCSV(INPUT_CSV);

  // Filter: live videos only, deduplicate by handle (prefer youtube over others)
  const seen = new Set();
  const eligible = allRows.filter(r => {
    const ok = r.live === 'yes'
      && ['youtube', 'vimeo', 'mp4'].includes(r.video_kind)
      && r.canonical_url && r.shopify_handle;
    if (!ok || seen.has(r.shopify_handle)) return false;
    seen.add(r.shopify_handle);
    return true;
  });

  console.log(`Eligible rows: ${eligible.length}\n`);

  let ok = 0, skipped = 0, errors = 0;

  for (const row of eligible) {
    const { shopify_handle, canonical_url, video_kind } = row;
    process.stdout.write(`  ${shopify_handle} [${video_kind}] ... `);

    if (dryRun) {
      console.log(`dry → ${canonical_url}`);
      log({ op: 'dry_run', handle: shopify_handle, url: canonical_url });
      ok++;
      continue;
    }

    try {
      const productId = await productIdByHandle(shopify_handle);
      if (!productId) {
        console.log('NOT FOUND in Shopify');
        log({ op: 'not_found', handle: shopify_handle });
        skipped++;
        continue;
      }

      await setMetafield(productId, 'product_video_url', 'url', canonical_url);
      console.log(`ok (id: ${productId})`);
      log({ op: 'seeded', handle: shopify_handle, productId, url: canonical_url });
      ok++;
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      log({ op: 'error', handle: shopify_handle, error: err.message });
      errors++;
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Done: ${ok} ok, ${skipped} skipped, ${errors} errors`);
  if (errors > 0) process.exit(1);
})();
