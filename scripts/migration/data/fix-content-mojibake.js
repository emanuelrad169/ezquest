'use strict';
// fix-content-mojibake.js
// Fetches the 4 content metafields for all 54 products and replaces U+FFFD
// replacement characters (mojibake from the legacy HTML extract) with the
// correct Unicode characters.
//
// Usage:
//   node fix-content-mojibake.js                           # dry-run
//   node fix-content-mojibake.js --apply --confirm-production  # live write
//
// Output: docs/migration/mojibake-fixes-{date}.csv (diff log)
// Idempotent: only writes if value actually changed.

const fs   = require('fs');
const path = require('path');

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN   || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const METAFIELD_KEYS = [
  'product_features',
  'product_specifications',
  'product_highlight',
  'product_compatibility_html',
];

const DELAY_MS = 400;

// U+FFFD is the replacement character left by the mojibake.
// Rules are applied in order from most-specific to least-specific.
// All string literals use \uXXXX escapes to avoid source-file encoding issues.
const F = '�';
const RE = (pat, flags) => new RegExp(pat.replace(/F/g, F), flags);

const RULES = [
  // Double replacement char: U+00AE (R with circle) is 2 UTF-8 bytes,
  // so it produces 2x U+FFFD when the source was mis-decoded.
  [RE('FF', 'g'),                                      '®'],
  // Explicit trademark ligature: one U+FFFD followed by literal "TM"
  [RE('FTM', 'g'),                                     '™'],
  // Brand registered trademarks (must come before generic possessive/fallback)
  [RE('USB-CF', 'g'),                                  'USB-C®'],
  [RE('ThunderboltF', 'g'),                            'Thunderbolt®'],
  [RE('HDMIF', 'g'),                                   'HDMI®'],
  [RE('KevlarF', 'g'),                                 'Kevlar®'],
  // Bullet after <br> (lookahead: space or opening tag follows)
  [RE('(<br\\s*\\/?>\\s*)F(?=[\\s<])', 'g'),          '$1•'],
  // Possessives and contractions — before em-dash rule to avoid Mac—s
  [RE('F(?=s\\b)', 'g'),                               '’'],   // 's
  [RE('F(?=t\\b)', 'g'),                               '’'],   // 't
  [RE('F(?=re\\b)', 'g'),                              '’'],   // 're
  [RE('F(?=ve\\b)', 'g'),                              '’'],   // 've
  [RE('F(?=ll\\b)', 'g'),                              '’'],   // 'll
  // Inch mark: digit immediately before (13", 15", 16" — most common)
  [RE('(\\d)F(?=[,\\s<"\'&/])', 'g'),                 '$1”'],
  // Inch mark: 1-2 digit number + space + replacement + space + 1-2 digits
  // (e.g. “14 “ 15” in compatibility lists where the curly quote had a space).
  // Lookahead [^0-9.] after the following digits distinguishes screen sizes
  // (15, 16) from decimal dimensions (11.2, 22.3) — period disqualifies match.
  [RE('(?<!\\d)(\\d{1,2})\\s+F\\s+(?=\\d{1,2}[^0-9.])', 'g'), '$1” '],
  // Multiplier: digit + space + replacement + space (port counts, mm dimensions)
  // e.g. "5 x USB-C", "140 x 43 x 11.2 mm"
  [RE('(\\d)\\s+F\\s+', 'g'),                         '$1 × '],
  // Em dash: word chars immediately on both sides with no spaces
  // e.g. "charging power<em-dash>the perfect match"
  [RE('(\\w)F(\\w)', 'g'),                            '$1—$2'],
  // Default fallback: right single curly quote (covers Plug n', etc.)
  [RE('F', 'g'),                                       '’'],
];

function applyRules(text) {
  let out = text;
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

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
      console.warn(`    [429] rate limited — waiting ${(wait / 1000).toFixed(1)}s`);
      await sleep(wait);
      attempt++;
      if (attempt > 5) throw new Error(`${method} ${path_} — 429 after 5 retries`);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path_} — ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  }
}

const shopifyGet = (p)    => shopifyRequest('GET',  p);
const shopifyPut = (p, b) => shopifyRequest('PUT',  p, b);

async function fetchAllProducts() {
  const data = await shopifyGet('/products.json?limit=250&fields=id,handle,title');
  return data.products || [];
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'fix-content-mojibake');

  const date = new Date().toISOString().slice(0, 10);
  const CSV_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'migration', `mojibake-fixes-${date}.csv`);

  const csvLines = ['product_handle,metafield_key,before,after'];

  console.log('Fetching products...');
  const products = await fetchAllProducts();
  console.log(`  ${products.length} products found\n`);

  let checked = 0, fixed = 0, skipped = 0, errors = 0;

  for (const product of products) {
    let metafields;
    try {
      const data = await shopifyGet(`/products/${product.id}/metafields.json?namespace=custom`);
      metafields = (data.metafields || []).filter(mf => METAFIELD_KEYS.includes(mf.key));
    } catch (err) {
      console.error(`  x ${product.handle}: fetch error — ${err.message}`);
      errors++;
      continue;
    }

    if (metafields.length === 0) continue;
    checked++;

    for (const mf of metafields) {
      if (!mf.value.includes(F)) {
        skipped++;
        continue;
      }

      const fixed_value = applyRules(mf.value);

      if (fixed_value === mf.value) {
        skipped++;
        continue;
      }

      const origCount  = (mf.value.match(new RegExp(F, 'g')) || []).length;
      const remainCount = (fixed_value.match(new RegExp(F, 'g')) || []).length;

      console.log(`  ${product.handle} [${mf.key}]: ${origCount} replacement char(s) — ${origCount - remainCount} fixed, ${remainCount} remaining`);

      const escapeCsv = s => `"${s.replace(/"/g, '""').replace(/\n/g, ' ').slice(0, 300)}"`;
      csvLines.push([product.handle, mf.key, escapeCsv(mf.value), escapeCsv(fixed_value)].join(','));

      log({ action: dryRun ? 'dry_run' : 'fix', handle: product.handle, key: mf.key, replacements: origCount - remainCount });

      if (!dryRun) {
        try {
          await shopifyPut(`/products/${product.id}/metafields/${mf.id}.json`, {
            metafield: { id: mf.id, value: fixed_value, type: mf.type },
          });
          console.log(`    written`);
        } catch (err) {
          console.error(`    write error — ${err.message}`);
          log({ action: 'error', handle: product.handle, key: mf.key, error: err.message });
          errors++;
          continue;
        }
      }

      fixed++;
    }
  }

  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  fs.writeFileSync(CSV_PATH, csvLines.join('\n') + '\n');
  console.log(`\nDiff log: ${CSV_PATH}`);
  console.log('');
  console.log('---------------------------------------------------------');
  if (dryRun) {
    console.log(`Dry-run complete.`);
    console.log(`Products with metafields checked: ${checked}`);
    console.log(`Metafield writes that would be made: ${fixed}`);
    console.log(`Metafields already clean (skipped): ${skipped}`);
    console.log('Pass --apply --confirm-production to write for real.');
  } else {
    console.log(`Done. Fixed: ${fixed} | Skipped (clean): ${skipped} | Errors: ${errors}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
