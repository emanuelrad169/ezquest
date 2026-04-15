#!/usr/bin/env node
// Attempts to create navigation menus via Admin API.
// Note: The Shopify Admin REST API does not expose a /menus.json endpoint.
// This script will print all menu items for manual creation if the API is unavailable.
// Run: node scripts/shopify-admin/create-navigation.js

const fs = require('fs');
const path = require('path');

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const contents = fs.readFileSync(filepath, 'utf8');
  const result = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }
  return result;
}

const env = { ...parseEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };
const STORE   = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN   = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER     = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const HEADERS = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

const menus = [
  {
    title: 'Main menu',
    handle: 'main-menu',
    items: [
      { title: 'Shop by setup',           url: '/pages/help-me-choose' },
      { title: 'Browse product families', url: '/collections' },
      { title: 'Compare',                 url: '/pages/compare' },
      { title: 'Support',                 url: '/pages/support' },
      { title: 'Resources',               url: '/blogs/resources' },
      { title: 'About',                   url: '/pages/about' }
    ]
  },
  {
    title: 'Footer',
    handle: 'footer',
    items: [
      { title: 'About EZQuest',     url: '/pages/about' },
      { title: 'Our Story',         url: '/pages/our-story' },
      { title: 'Where to Buy',      url: '/pages/where-to-buy' },
      { title: 'Resources',         url: '/blogs/resources' },
      { title: 'Hubs & Adapters',   url: '/collections/hubs-adapters' },
      { title: 'Docking Stations',  url: '/collections/docking-stations' },
      { title: 'Chargers & Power',  url: '/collections/chargers-power' },
      { title: 'Accessories',       url: '/collections/accessories' },
      { title: 'Privacy Policy',    url: '/policies/privacy-policy' },
      { title: 'Terms of Service',  url: '/policies/terms-of-service' },
      { title: 'Refund Policy',     url: '/policies/refund-policy' },
      { title: 'Shipping & Returns',url: '/pages/shipping-returns' },
      { title: 'Cookie Policy',     url: '/pages/cookie-policy' }
    ]
  },
  {
    title: 'Support navigation',
    handle: 'support-nav',
    items: [
      { title: 'Support',          url: '/pages/support' },
      { title: 'FAQ',              url: '/pages/faq' },
      { title: 'Downloads',        url: '/pages/downloads' },
      { title: 'Manuals',          url: '/pages/manuals' },
      { title: 'Firmware',         url: '/pages/firmware' },
      { title: 'User Guides',      url: '/pages/user-guides' },
      { title: 'Compatibility',    url: '/pages/compatibility' },
      { title: 'Troubleshooting',  url: '/pages/troubleshooting' },
      { title: 'Warranty',         url: '/pages/warranty' },
      { title: 'Contact',          url: '/pages/contact' },
      { title: 'Submit a ticket',  url: '/pages/ticket-submission' }
    ]
  }
];

function printMenuItems(menu) {
  console.log(`\n  ─── ${menu.title} (handle: ${menu.handle}) ───`);
  menu.items.forEach((item, i) => {
    console.log(`  ${(i + 1).toString().padStart(2)}. ${item.title.padEnd(26)} ${item.url}`);
  });
}

async function tryCreateMenu(menu) {
  // Shopify REST API does not have /menus.json — this will 404.
  // The attempt is made so the exact error is captured for diagnostics.
  const res = await fetch(`https://${STORE}/admin/api/${VER}/menus.json`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      menu: {
        title: menu.title,
        handle: menu.handle,
        items: menu.items.map(item => ({ title: item.title, url: item.url, type: 'HTTP' }))
      }
    })
  });

  if (res.status === 404) return { ok: false, reason: 'API endpoint not available (404)' };
  if (res.status === 403) return { ok: false, reason: 'Permission denied (403) — scope: write_online_store_pages required' };

  const text = await res.text();
  if (!text) return { ok: false, reason: `HTTP ${res.status} — empty response (endpoint likely not available)` };
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, reason: `HTTP ${res.status} — unparseable response` }; }
  if (data.menu) return { ok: true, menu: data.menu };
  return { ok: false, reason: JSON.stringify(data.errors || data) };
}

async function main() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);
  console.log('Attempting to create navigation menus via Admin REST API...\n');

  let anyFailed = false;

  for (const menu of menus) {
    const result = await tryCreateMenu(menu);
    if (result.ok) {
      console.log(`CREATED: ${menu.title} (${menu.handle}) — ${result.menu.items_count || menu.items.length} items`);
    } else {
      console.log(`MANUAL REQUIRED: ${menu.title} — ${result.reason}`);
      anyFailed = true;
    }
    await new Promise(r => setTimeout(r, 400));
  }

  if (anyFailed) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MANUAL ACTION REQUIRED — Admin → Online Store → Navigation');
    console.log('Create menus with these EXACT handles:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const menu of menus) printMenuItems(menu);
    console.log('\nHandle spelling must be exact — theme Liquid references these handles directly.');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
