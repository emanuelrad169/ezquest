'use strict';
// create-nav-collections.js
// Creates 11 automated Shopify smart collections for the mega-menu nav structure.
// Each collection uses a tag rule (tag equals nav-*) so products auto-populate
// when apply-nav-tags.js has run.
//
// Idempotent: skips collections whose handle already exists.
//
// Usage:
//   node create-nav-collections.js                           # dry-run
//   node create-nav-collections.js --apply --confirm-production

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN        || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION  || '2026-01';
const BASE    = `https://${STORE}/admin/api/${API_VER}`;

const DELAY_MS = 400;

// Collection definitions — in display order (matches mega-menu left→right)
const COLLECTIONS = [
  // ── Group 1: USB-C ───────────────────────────────────────────────────────────
  {
    handle: 'usb-c-hubs',
    title:  'USB-C Hubs',
    tag:    'nav-usb-c-hubs',
    body_html: '<p>Multi-port USB-C hubs for desktop, travel, and dual-display setups. Power Delivery passthrough, HDMI, USB-A, SD card, and more.</p>',
  },
  {
    handle: 'usb-c-cables-collection',
    title:  'USB-C Cables',
    tag:    'nav-usb-c-cables',
    body_html: '<p>DuraGuard USB-C cables built for 100W charging, 4K display output, and USB4 transfer speeds. Coiled, right-angle, and straight profiles.</p>',
  },
  {
    handle: 'usb-c-adapters',
    title:  'USB-C Adapters',
    tag:    'nav-usb-c-adapters',
    body_html: '<p>Compact USB-C adapters for HDMI, DisplayPort, VGA, DVI, Ethernet, and USB-A connections. Plug-and-play with Mac and PC.</p>',
  },
  {
    handle: 'usb-c-card-readers',
    title:  'USB-C Card Readers',
    tag:    'nav-usb-c-card-readers',
    body_html: '<p>High-speed USB-C card readers supporting CFast 2.0, UHS-II SD, and Micro SD formats for photographers and videographers.</p>',
  },
  {
    handle: 'usb-c-enclosures',
    title:  'USB-C Enclosures',
    tag:    'nav-usb-c-enclosures',
    body_html: '<p>Magnetic USB-C M.2 NVMe SSD enclosures. Tool-free assembly, 40Gbps transfer, and a sleek aluminum build.</p>',
  },
  // ── Group 2: Cables / Adapters ────────────────────────────────────────────────
  {
    handle: 'hdmi-cables-adapters',
    title:  'HDMI Cables & Adapters',
    tag:    'nav-cables-hdmi',
    body_html: '<p>Premium HDMI cables and adapters supporting 4K 60Hz, 8K 60Hz, and 10K resolutions. Certified, braided, and built to last.</p>',
  },
  {
    handle: 'displayport-cables-adapters',
    title:  'DisplayPort Cables & Adapters',
    tag:    'nav-cables-displayport',
    body_html: '<p>USB-C to DisplayPort cables and adapters delivering 4K 60Hz video to monitors, projectors, and multi-display setups.</p>',
  },
  {
    handle: 'mini-displayport-cables',
    title:  'Mini DisplayPort Cables',
    tag:    'nav-cables-mini-displayport',
    body_html: '<p>Active Mini DisplayPort to HDMI cables with 4K 60Hz support. Compatible with Thunderbolt 1 and 2 ports on older Macs and PCs.</p>',
  },
  {
    handle: 'audio-cables',
    title:  'Audio Cables',
    tag:    'nav-cables-audio',
    body_html: '<p>DuraGuard stereo audio cables with reinforced connectors and premium shielding for headphones, speakers, and AV equipment.</p>',
  },
  // ── Group 3: Power ────────────────────────────────────────────────────────────
  {
    handle: 'wall-chargers',
    title:  'Wall Chargers',
    tag:    'nav-power-wall-chargers',
    body_html: '<p>GaN wall chargers from 30W to 120W. Multi-port, travel-ready designs with USB-C PD for laptops, phones, and tablets.</p>',
  },
  {
    handle: 'car-chargers',
    title:  'Car Chargers',
    tag:    'nav-power-car-chargers',
    body_html: '<p>USB-C car chargers with dual ports and 66–72W output. Built-in LED display, GaN efficiency, and fast-charge compatibility.</p>',
  },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function shopifyRequest(method, path_, body) {
  await sleep(DELAY_MS);
  const opts = {
    method,
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path_}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path_} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function fetchExistingHandles() {
  const data = await shopifyRequest('GET', '/smart_collections.json?limit=250&fields=id,handle,title');
  const handles = new Map();
  for (const c of data.smart_collections || []) {
    handles.set(c.handle, { id: c.id, title: c.title });
  }
  return handles;
}

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'create-nav-collections');

  console.log('Checking existing smart collections...');
  const existing = await fetchExistingHandles();
  console.log(`  ${existing.size} smart collections found in store\n`);

  let created = 0, skipped = 0, errors = 0;

  for (const col of COLLECTIONS) {
    if (existing.has(col.handle)) {
      const ex = existing.get(col.handle);
      console.log(`  — ${col.handle}: already exists (id: ${ex.id}, title: "${ex.title}")`);
      log({ action: 'skip', handle: col.handle, reason: 'already_exists', existing_id: ex.id });
      skipped++;
      continue;
    }

    const payload = {
      smart_collection: {
        title:      col.title,
        handle:     col.handle,
        body_html:  col.body_html,
        sort_order: 'best-selling',
        rules: [
          { column: 'tag', relation: 'equals', condition: col.tag },
        ],
        disjunctive: false,
      },
    };

    console.log(`  + ${col.handle} (tag: ${col.tag})`);
    log({ action: dryRun ? 'dry_run' : 'create', handle: col.handle, tag: col.tag });

    if (!dryRun) {
      try {
        const data = await shopifyRequest('POST', '/smart_collections.json', payload);
        const c = data.smart_collection;
        console.log(`      created: id ${c.id}, url /collections/${c.handle}`);
        log({ action: 'created', handle: col.handle, id: c.id });
        created++;
      } catch (err) {
        console.error(`      ✗ error: ${err.message}`);
        log({ action: 'error', handle: col.handle, error: err.message });
        errors++;
      }
    } else {
      created++;
    }
  }

  console.log('');
  console.log('──────────────────────────────────────────────────');
  if (dryRun) {
    console.log(`Dry-run. Would create: ${created} | Already exist: ${skipped} | Errors: ${errors}`);
    console.log('Pass --apply --confirm-production to create for real.');
  } else {
    console.log(`Done. Created: ${created} | Already existed: ${skipped} | Errors: ${errors}`);
    if (created > 0) {
      console.log('\nNote: Collections populate as soon as products have the nav-* tags.');
      console.log('Run apply-nav-tags.js --apply --confirm-production if not done yet.');
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
