#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const STORE = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = '2024-01';
const DELAY_MS = 350;

if (!STORE) {
  console.error('ERROR: Missing SHOPIFY_STORE or SHOPIFY_SHOP_DOMAIN');
  process.exit(1);
}

if (!TOKEN) {
  console.error('ERROR: Missing SHOPIFY_ADMIN_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  process.exit(1);
}

const NORMALIZED_STORE = STORE.replace(/^https?:\/\//, '').replace(/\/$/, '');
const BASE = 'https://' + NORMALIZED_STORE + '/admin/api/' + API_VERSION;
const headers = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json',
};

const SPEC_SETS = {
  hubsAndDocks: [
    { label: 'Interface', value: 'USB-C' },
    { label: 'USB-A 3.0 ports', value: '4× 5Gbps' },
    { label: 'Display output', value: '4K@30Hz via HDMI' },
    { label: 'Power delivery', value: 'Up to 100W pass-through' },
    { label: 'Ethernet', value: '1× Gigabit RJ45' },
    { label: 'Card reader', value: 'SD + microSD (UHS-I)' },
    { label: 'Compatibility', value: 'macOS, Windows, iPadOS' },
    { label: 'Driver required', value: 'None on macOS/Windows 11' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  chargers: [
    { label: 'Total wattage', value: 'See product title' },
    { label: 'Technology', value: 'GaN II' },
    { label: 'USB-C ports', value: '2× USB-C PD' },
    { label: 'USB-A ports', value: '1× USB-A' },
    { label: 'Input', value: '100-240V AC (universal)' },
    { label: 'Compatibility', value: 'All USB-C devices' },
    { label: 'Certifications', value: 'UL, FCC, CE' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  cables: [
    { label: 'Connector A', value: 'USB-C' },
    { label: 'Connector B', value: 'See product title' },
    { label: 'Data transfer', value: 'Up to 10Gbps' },
    { label: 'Power delivery', value: 'Up to 100W' },
    { label: 'Video', value: '4K@60Hz (USB-C to USB-C)' },
    { label: 'Jacket', value: 'DuraGuard braided nylon' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  adaptersAndAccessories: [
    { label: 'Interface', value: 'USB-C' },
    { label: 'Output', value: 'See product title' },
    { label: 'Transfer speed', value: 'Up to 10Gbps' },
    { label: 'Compatibility', value: 'macOS, Windows, iPadOS' },
    { label: 'Driver required', value: 'None' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  default: [
    { label: 'Compatibility', value: 'macOS, Windows' },
    { label: 'Warranty', value: '2 years limited' },
  ],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function shopifyGet(path) {
  const res = await fetch(BASE + path, { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.errors) {
    throw new Error(JSON.stringify(data.errors || data, null, 2));
  }

  return data;
}

async function getAllProducts() {
  const data = await shopifyGet('/products.json?limit=250&fields=id,handle,title,product_type');
  const products = Array.isArray(data.products) ? data.products : [];
  const productMap = new Map();

  products.forEach((product) => {
    if (!product.handle) return;
    productMap.set(product.handle, {
      id: product.id,
      title: product.title,
      product_type: product.product_type,
    });
  });

  console.log('Handles found:');
  products
    .map((product) => product.handle)
    .filter(Boolean)
    .sort()
    .forEach((handle) => console.log('- ' + handle));

  return productMap;
}

function getSpecsForHandle(handle) {
  if (handle.includes('hub') || handle.includes('dock')) {
    return SPEC_SETS.hubsAndDocks;
  }

  if (handle.includes('charger') || handle.includes('gan')) {
    return SPEC_SETS.chargers;
  }

  if (handle.includes('cable')) {
    return SPEC_SETS.cables;
  }

  if (handle.includes('adapter') || handle.includes('enclosure') || handle.includes('reader')) {
    return SPEC_SETS.adaptersAndAccessories;
  }

  return SPEC_SETS.default;
}

async function setSpecMetafield(productId, specs) {
  const res = await fetch(BASE + '/products/' + productId + '/metafields.json', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      metafield: {
        namespace: 'ezquest',
        key: 'spec_rows',
        type: 'json',
        value: JSON.stringify(specs),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (data.errors || !res.ok) {
    const msg = JSON.stringify(data.errors || data);
    if (msg.includes('taken') || msg.includes('duplicate')) {
      return 'EXISTS';
    }
    return 'ERROR: ' + msg;
  }

  return 'CREATED';
}

async function main() {
  const productsByHandle = await getAllProducts();

  let created = 0;
  let exists = 0;
  let errors = 0;

  for (const [handle, product] of productsByHandle.entries()) {
    const specs = getSpecsForHandle(handle);
    const result = await setSpecMetafield(product.id, specs);

    if (result === 'CREATED') {
      created += 1;
      console.log('CREATED | ' + product.title);
    } else if (result === 'EXISTS') {
      exists += 1;
      console.log('EXISTS  | ' + product.title);
    } else {
      errors += 1;
      console.log(result + ' | ' + product.title);
    }

    await delay(DELAY_MS);
  }

  console.log('Seeded:', created, '| Skipped:', exists, '| Errors:', errors);
}

main().catch((error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
