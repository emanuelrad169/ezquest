'use strict';
// build-category-map.js
// Resolves legacy ezq.com product URLs → Shopify handles (via redirect CSV)
// → Shopify product IDs (via Admin API), and outputs:
//   docs/migration/category-product-map.json
//
// Usage:
//   node build-category-map.js

const fs   = require('fs');
const path = require('path');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN        || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION  || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const CSV_PATH  = path.join(__dirname, '..', '..', '..', 'docs', 'ezq-redirects.csv');
const OUT_PATH  = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'category-product-map.json');
const WARN_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'category-map-warnings.txt');

const DELAY_MS = 300;

// ── Authoritative category → legacy URL mapping (from task spec) ──────────────

const CATEGORIES = {
  'usb-c-hubs': {
    group: 'USB-C',
    label: 'USB-C Hubs',
    tag: 'nav-usb-c-hubs',
    legacyUrls: [
      '/4-port-USB-3-hub-adapter-with-USB-C-PD-3.html',
      '/USB-C-multimedia-charging-adapter-3-ports.html',
      '/USB-C-multimedia-hub-adapter-8-ports-with-4K-60Hz-power-delivery-3.html',
      '/dual-USB-C-multimedia-hub-13-ports.html',
      '/dual-hdmi-usb-c-multimedia-hub-adapter-12-ports.htm',
      '/usb-4-dual-display-8-in-1-hub-pro-series-details.html',
      '/usb-c-5-in-1-multimedia-hub-pro-series-details.html',
      '/usb-c-dual-display-12-in-1-multimedia-hub-pro-series-details.html',
      '/usb-c-gen-2-hub-adapter-7-ports.html',
      '/usb-c-multimedia-10-in-1-gen-2-hub.htm',
      '/usb-c-multimedia-7-in-1-hub-details.html',
      '/usb-c-multimedia-8-in-1-hub-details.html',
      '/usb-c-multimedia-hub-adapter-8-ports.html',
      '/usb-c-slim-gen-2-hub-adapter-6-in-1-details.html',
      '/x40225-usb-c-dual-hdmi-multimedia-hub-adapter-5-ports-with-power-delivery-3.0.html',
    ],
  },
  'usb-c-cables': {
    group: 'USB-C',
    label: 'USB-C Cables',
    tag: 'nav-usb-c-cables',
    legacyUrls: [
      '/c40012-duraguard-usb4-v2-1point2-meter-cable.htm',
      '/c41005-duraguard-usb4-v2-0point5-meter-extension-cable.html',
      '/duraguard-usbc-to-hdmi-8k-60hz-cable-with-hdr-details_ss103.html',
      '/duraguard-usb-c-to-hdmi-4k-60hz-cable-with-hdr-details.html',
      '/duraguard-usb-c-to-displayport-4k-60hz-cable-details.html',
      '/DuraGuard-USB-C-Right-Angled-Charge-Sync-100W-1.2-Meter-Cable.htm',
      '/DuraGuard-Coiled-USB-C-Charge-Sync-100W-1.5-Meter-Black-Cable.htm',
      '/duraguard-USB-C-to-USB-C-charge-and-sync-cable.html',
      '/X48912-X48922-duraguard-usb-c-to-usb-a-charge-sync-cable.html',
    ],
  },
  'usb-c-adapters': {
    group: 'USB-C',
    label: 'USB-C Adapters',
    tag: 'nav-usb-c-adapters',
    legacyUrls: [
      '/USB-C-to-HDMI-4K-60Hz-adapter.html',
      '/usb-c-to-displayport-4k-60hz-adapter.html',
      '/usb-c-to-dvi-adapter.html',
      '/x40013-USB-C-to-VGA-adapter.html',
      '/usb-c-to-gigabit-ethernet-adapter.html',
      '/usb-c-to-2.5-gigabit-ethernet-adapter.html',
      '/usb-c-female-to-usb-a-male-mini-adapter-2-pack.htm',
      '/gen2-double-sided-usb-c-female-to-usb-3-male-mini-adaptor.htm',
      '/x40100-duraguard-usb-c-to-usb-a-3.0-female-cable-adapter.html',
      '/usb-c-to-usb-3-mini-adapter.htm',
      '/usb-c-to-usb-c-female-90-degree-mini-adapter-2-pack.htm',
    ],
  },
  'usb-c-card-readers': {
    group: 'USB-C',
    label: 'USB-C Card Readers',
    tag: 'nav-usb-c-card-readers',
    legacyUrls: [
      '/USB-C-Cfast-2.0-card-reader-5-ports-with-UHS-II-SD-Micro-SD.html',
      '/usb-c-card-reader_ss42.html',
    ],
  },
  'usb-c-enclosures': {
    group: 'USB-C',
    label: 'USB-C Enclosures',
    tag: 'nav-usb-c-enclosures',
    legacyUrls: [
      '/magnetic-usb-c-m-2-nvme-ssd-enclosure-details.html',
    ],
  },
  'hdmi-cables-adapters': {
    group: 'Cables/Adapters',
    label: 'HDMI',
    tag: 'nav-cables-hdmi',
    legacyUrls: [
      '/USB-C-to-HDMI-4K-60Hz-adapter.html',
      '/mini-displayport-to-HDMI-4K-60Hz-cable.html',
      '/ultra-HD-high-speed-HDMI-10K-60Hz-cable.html',
      '/ultra-hd-high-speed-certified-hdmi-8k-60hz-cable-details.html',
      '/high-speed-hdmi-premium-certified-4k-60hz-cable.html',
    ],
  },
  'displayport-cables-adapters': {
    group: 'Cables/Adapters',
    label: 'DisplayPort',
    tag: 'nav-cables-displayport',
    legacyUrls: [
      '/USB-C-to-displayport-4K-60Hz-cable.html',
      '/usb-c-to-displayport-4k-60hz-adapter.html',
    ],
  },
  'mini-displayport-cables': {
    group: 'Cables/Adapters',
    label: 'Mini DisplayPort',
    tag: 'nav-cables-mini-displayport',
    legacyUrls: [
      '/mini-displayport-to-HDMI-4K-60Hz-cable.html',
    ],
  },
  'audio-cables': {
    group: 'Cables/Adapters',
    label: 'Audio',
    tag: 'nav-cables-audio',
    legacyUrls: [
      '/x49910-duraguard-stereo-audio-cable.html',
    ],
  },
  'wall-chargers': {
    group: 'Power',
    label: 'Wall Chargers',
    tag: 'nav-power-wall-chargers',
    legacyUrls: [
      '/UltraSlim-70W-GaN-II-Dual-USB-C-PD-Wall-Charger.html',
      '/worldtravel-65w-gan-5-port-with-pd-wall-charger-details.html',
      '/WorldTravel-35W-GaN-5-Port-with-PD-Wall-Charger.html',
      '/ultimatepower-120w-gan-usb-c-pd-wall-charger.html',
      '/ultimatepower-90w-gan-usb-c-pd-wall-charger.html',
      '/ultimatepower-65w-gan-usb-c-pd-wall-charger.html',
      '/65w-gan-usb-c-pd-wall-charger.htm',
      '/45w-gan-usb-c-pd-wall-charger.htm',
      '/mini-30w-gan-usb-c-pd-wall-charger.html',
    ],
  },
  'car-chargers': {
    group: 'Power',
    label: 'Car Chargers',
    tag: 'nav-power-car-chargers',
    legacyUrls: [
      '/usb-c-66w-car-charger-dual-port-with-display.htm',
      '/ultimatepower-usb-c-72w-car-charger-dual-port-with-display-details.html',
    ],
  },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadRedirectMap(csvPath) {
  const map = new Map();
  const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Redirect from')) continue;
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) continue;
    const from = trimmed.slice(0, commaIdx).trim();
    const to   = trimmed.slice(commaIdx + 1).trim();
    map.set(from, to);
  }
  return map;
}

function extractHandle(redirectTarget) {
  // Only product redirects yield a handle. Skip collection / page redirects.
  const m = redirectTarget.match(/^\/products\/([^?#]+)/);
  return m ? m[1] : null;
}

async function fetchProductByHandle(handle) {
  await sleep(DELAY_MS);
  const url = `${BASE}/products.json?handle=${encodeURIComponent(handle)}&fields=id,handle,title`;
  const res  = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': TOKEN },
  });
  if (!res.ok) throw new Error(`GET products?handle=${handle} → ${res.status}`);
  const data = await res.json();
  return data.products?.[0] || null;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  console.log('Loading redirect map from CSV...');
  const redirectMap = loadRedirectMap(CSV_PATH);
  console.log(`  ${redirectMap.size} redirects loaded\n`);

  const warnings   = [];
  const handleCache = new Map();   // handle → { id, title }
  const output     = {};

  for (const [catKey, cat] of Object.entries(CATEGORIES)) {
    console.log(`[${cat.group}] ${cat.label} (${cat.legacyUrls.length} URLs)`);
    const productIds = [];
    const seen       = new Set();

    for (const legacyUrl of cat.legacyUrls) {
      const redirectTarget = redirectMap.get(legacyUrl);

      if (!redirectTarget) {
        const w = `NO REDIRECT: ${legacyUrl} (category: ${catKey})`;
        console.log(`  ⚠  ${w}`);
        warnings.push(w);
        continue;
      }

      const handle = extractHandle(redirectTarget);

      if (!handle) {
        const w = `NON-PRODUCT REDIRECT: ${legacyUrl} → ${redirectTarget} (category: ${catKey})`;
        console.log(`  ⚠  ${w}`);
        warnings.push(w);
        continue;
      }

      if (seen.has(handle)) {
        // Dedup: same product appears via multiple legacy URLs in this category
        continue;
      }
      seen.add(handle);

      let product;
      if (handleCache.has(handle)) {
        product = handleCache.get(handle);
      } else {
        try {
          product = await fetchProductByHandle(handle);
          handleCache.set(handle, product);
        } catch (err) {
          const w = `API ERROR: ${handle} — ${err.message}`;
          console.error(`  ✗  ${w}`);
          warnings.push(w);
          continue;
        }
      }

      if (!product) {
        const w = `PRODUCT NOT FOUND: handle "${handle}" (legacy: ${legacyUrl}, category: ${catKey})`;
        console.log(`  ⚠  ${w}`);
        warnings.push(w);
        continue;
      }

      console.log(`  ✓  ${product.handle} (id: ${product.id}) — ${product.title}`);
      productIds.push(String(product.id));
    }

    output[catKey] = {
      group:  cat.group,
      label:  cat.label,
      tag:    cat.tag,
      handle: catKey,
      productIds,
    };

    console.log(`     → ${productIds.length} product(s) resolved\n`);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`Output written: ${OUT_PATH}`);

  if (warnings.length > 0) {
    fs.writeFileSync(WARN_PATH, warnings.join('\n') + '\n');
    console.log(`\n⚠  ${warnings.length} warning(s) written to ${WARN_PATH}`);
    console.log('Review before proceeding to apply-nav-tags.js.\n');
  } else {
    console.log('\nNo warnings — all legacy URLs resolved cleanly.');
  }

  // Summary
  console.log('\n────────────────────────────────────────────');
  console.log('Category summary:');
  for (const [catKey, cat] of Object.entries(output)) {
    const pad = ' '.repeat(Math.max(0, 32 - catKey.length));
    console.log(`  ${catKey}${pad} ${cat.productIds.length} products`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
