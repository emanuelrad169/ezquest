/**
 * fix-product-descriptions.mjs
 *
 * Scans every product for body_html that has adjacent words with no space
 * between them (e.g. "USB-C portsGoogle Chromebook") and inserts a
 * line-break (<br>) between them so each item becomes its own line.
 *
 * Usage:
 *   node scripts/fix-product-descriptions.mjs
 *   node scripts/fix-product-descriptions.mjs --dry-run    ← preview only
 *
 * Requires a valid SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local
 * Get one: Shopify admin → Settings → Apps and sales channels →
 *          Develop apps → Create an app → Configure Admin API scopes
 *          (enable write_products) → Install → reveal API access token
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Load env ───────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env.local');

try {
  const raw = readFileSync(envPath, 'utf8');
  raw.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
} catch {
  console.error('Could not read .env.local');
  process.exit(1);
}

const SHOP    = process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const DRY_RUN = process.argv.includes('--dry-run');

if (!SHOP || !TOKEN) {
  console.error('Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

if (DRY_RUN) console.log('🔍  DRY RUN — no changes will be saved\n');

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fix a raw body_html string:
 * 1. Strip all tags to inspect plain text runs for camelCase joins
 * 2. Inside text nodes only, insert a <br> between lowerUPPER transitions
 *    that look like merged device names (not inside HTML tags / attributes)
 */
function fixBodyHtml(html) {
  if (!html) return html;

  // Split the HTML into alternating [text, tag, text, tag, …] segments.
  // We only modify text segments (even indices).
  const parts = html.split(/(<[^>]+>)/);

  const fixed = parts.map((part, i) => {
    if (i % 2 === 1) return part; // It's a tag — leave it alone

    // Insert a <br> between lowerUPPER boundary that looks like merged device names.
    // e.g. "USB-C portsGoogle" → "USB-C ports<br>Google"
    // \b before the lowercase group ensures we only match at a real word start,
    // not mid-word inside camelCase brand names like "UltimatePower".
    return part.replace(
      /\b([a-z]{4,})([A-Z][a-z]{3,})/g,
      (_, lower, upper) => lower + '<br>' + upper
    );
  });

  return fixed.join('');
}

function hasBrokenText(html) {
  if (!html) return false;
  // Check only text nodes (outside tags)
  const textOnly = html.replace(/<[^>]+>/g, '');
  return /\b[a-z]{4,}[A-Z][a-z]{3,}/.test(textOnly);
}

async function apiFetch(path, options = {}) {
  const url = `https://${SHOP}/admin/api/${VERSION}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Scanning products on ${SHOP}…\n`);

  // Fetch all products (Shopify max 250 per page)
  let allProducts = [];
  let url = `/products.json?limit=250&fields=id,title,body_html`;

  while (url) {
    const data = await apiFetch(url);
    allProducts = allProducts.concat(data.products || []);

    // Check Link header for next page (REST pagination)
    // fetch() follows no Link header automatically — we handle it manually
    // via the page_info cursor in the URL returned by Shopify.
    // Simple approach: if we got 250 results, there may be more.
    if ((data.products || []).length < 250) {
      url = null;
    } else {
      // NOTE: for full pagination support across 250+ products, use the
      // page_info cursor. For typical stores (<250 products) this loop exits.
      console.warn('  ⚠  More than 250 products found — only first 250 scanned.');
      console.warn('     Re-run with cursor pagination for complete coverage.');
      url = null;
    }
  }

  console.log(`  Total products: ${allProducts.length}`);

  const broken = allProducts.filter(p => hasBrokenText(p.body_html));
  console.log(`  Broken descriptions: ${broken.length}\n`);

  if (broken.length === 0) {
    console.log('✅  All product descriptions look clean.');
    return;
  }

  for (const product of broken) {
    const original = product.body_html;
    const fixed    = fixBodyHtml(original);

    if (original === fixed) {
      console.log(`  SKIP  ${product.title.slice(0, 55)} — regex found no fixable joins`);
      continue;
    }

    // Show a diff preview (first 200 chars of plain text before/after)
    const before = original.replace(/<[^>]+>/g, '').slice(0, 200);
    const after  = fixed.replace(/<[^>]+>/g, '').slice(0, 200);

    console.log(`  ──────────────────────────────────────────`);
    console.log(`  Product: ${product.title.slice(0, 60)}`);
    console.log(`  ID:      ${product.id}`);
    console.log(`  BEFORE:  ${before}`);
    console.log(`  AFTER:   ${after}`);

    if (!DRY_RUN) {
      await apiFetch(`/products/${product.id}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: { id: product.id, body_html: fixed } }),
      });
      console.log(`  ✅  Updated`);
    } else {
      console.log(`  (dry-run — not saved)`);
    }
    console.log();

    // Respect Shopify's rate limit (2 req/s on REST)
    await new Promise(r => setTimeout(r, 550));
  }

  if (!DRY_RUN) {
    console.log(`\n✅  Done. ${broken.length} product(s) updated.`);
  } else {
    console.log(`\nDry run complete. Run without --dry-run to apply changes.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
