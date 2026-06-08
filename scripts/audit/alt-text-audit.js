'use strict';

// Audits all product images for missing or placeholder alt text.
// Optionally auto-fills missing alts with a title-based default.
//
// Usage:
//   node scripts/audit/alt-text-audit.js               # audit only, write CSV
//   node scripts/audit/alt-text-audit.js --fill         # dry-run auto-fill
//   node scripts/audit/alt-text-audit.js --fill --apply # write auto-filled alts to store
//   node scripts/audit/alt-text-audit.js --fill --apply --confirm-production

const fs   = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '.env.local');
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

const REST_BASE = `https://${STORE}/admin/api/2026-01`;
const OUT_DIR   = path.join(__dirname, '..', '..', 'docs', 'audits');
const OUT_CSV   = path.join(OUT_DIR, 'alt-text-gaps.csv');
const LOGS_DIR  = path.join(__dirname, '..', '..', 'docs', 'migration', 'logs');

const FILL    = process.argv.includes('--fill');
const APPLY   = process.argv.includes('--apply');
const CONFIRM = process.argv.includes('--confirm-production');

const PLACEHOLDER_PATTERNS = [/^image\s*\d*$/i, /^img\s*\d*$/i, /^\d+$/, /^photo\s*\d*$/i];

function isPlaceholder(alt) {
  if (!alt) return true;
  const t = alt.trim();
  if (!t) return true;
  if (PLACEHOLDER_PATTERNS.some(re => re.test(t))) return true;
  if (t.match(/\.(jpe?g|png|webp|avif|gif)$/i)) return true;
  return false;
}

function defaultAlt(product, position) {
  const base = product.title.replace(/["""]/g, '"').trim();
  if (position === 1) return base;
  return `${base} — view ${position}`;
}

function csvCell(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}

const COLS = ['product_id', 'handle', 'image_position', 'image_id', 'image_src', 'current_alt', 'proposed_alt'];
function csvRow(obj) {
  return COLS.map(c => csvCell(obj[c])).join(',');
}

async function restGet(url) {
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return { data: await res.json(), link: res.headers.get('Link') };
}

async function restPut(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${url} → HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function getAllProducts() {
  const products = [];
  let url = `${REST_BASE}/products.json?fields=id,handle,title,images&limit=250`;
  while (url) {
    const { data, link } = await restGet(url);
    products.push(...data.products);
    const nextMatch = (link || '').match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }
  return products;
}

(async () => {
  if (APPLY && !CONFIRM) {
    process.stderr.write('PRODUCTION STORE: add --confirm-production to write alt text\n');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logPath = path.join(LOGS_DIR, `alt-text-audit-${ts}.jsonl`);
  const log = entry => fs.appendFileSync(logPath, JSON.stringify({ ...entry, ts: new Date().toISOString() }) + '\n');

  console.log(`Fetching all products from ${STORE}...\n`);
  const products = await getAllProducts();
  console.log(`Found ${products.length} products\n`);

  const gaps = [];
  let totalImages = 0;
  let gapCount = 0;

  for (const product of products) {
    for (const img of (product.images || [])) {
      totalImages++;
      if (isPlaceholder(img.alt)) {
        gapCount++;
        const proposed = FILL ? defaultAlt(product, img.position) : '';
        gaps.push({
          product_id:     product.id,
          handle:         product.handle,
          image_position: img.position,
          image_id:       img.id,
          image_src:      img.src,
          current_alt:    img.alt || '',
          proposed_alt:   proposed,
        });

        if (FILL && APPLY) {
          process.stdout.write(`  ${product.handle} img#${img.position} → "${proposed}" ... `);
          try {
            await restPut(
              `${REST_BASE}/products/${product.id}/images/${img.id}.json`,
              { image: { id: img.id, alt: proposed } }
            );
            console.log('ok');
            log({ op: 'alt_filled', handle: product.handle, image_id: img.id, alt: proposed });
          } catch (err) {
            console.log(`ERROR: ${err.message}`);
            log({ op: 'alt_error', handle: product.handle, image_id: img.id, error: err.message });
          }
        } else if (FILL) {
          console.log(`  [dry] ${product.handle} img#${img.position}: "${proposed}"`);
        }
      }
    }
  }

  const csv = [COLS.join(','), ...gaps.map(csvRow)].join('\n');
  fs.writeFileSync(OUT_CSV, csv);

  console.log(`\n── Alt Text Summary ──────────────────────────────────`);
  console.log(`Total images:          ${totalImages}`);
  console.log(`Missing / placeholder: ${gapCount}`);
  console.log(`Coverage:              ${((totalImages - gapCount) / totalImages * 100).toFixed(1)}%`);
  console.log(`Output:                ${OUT_CSV}`);
  if (FILL && APPLY) console.log(`Log:                   ${logPath}`);
  if (FILL && !APPLY) console.log('\nRe-run with --apply to write changes.');
  if (!FILL && gapCount > 0) console.log('\nRe-run with --fill to preview auto-fill defaults, or --fill --apply --confirm-production to write.');
})();
