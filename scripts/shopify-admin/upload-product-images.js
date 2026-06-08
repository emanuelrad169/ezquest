#!/usr/bin/env node
// Uploads product images from local files via Shopify Admin REST API.
// Usage:
//   1. Put your image files in ./product-images/ (create that folder)
//   2. Fill in the IMAGE_MAP below: handle → relative file path
//   3. Run: node scripts/shopify-admin/upload-product-images.js
//
// Supported formats: jpg, jpeg, png, webp
// Shopify converts to WebP on CDN — any format works.
//
// The 5 active products currently missing images:
//   duraguard-stereo-audio-cable-90-degree          (ID: 8832352813254)
//   superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack (ID: 8832352878790)
//   usb-c-multimedia-hub                            (ID: 8832352026822)
//   usb-c-pro-dock                                  (ID: 8832352190662)
//   usb-c-travel-hub                                (ID: 8832352092358)

const fs   = require('fs');
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

const env     = { ...parseEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };
const STORE   = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN   = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER     = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE    = `https://${STORE}/admin/api/${VER}`;
const HEADERS = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

// ─── FILL IN with your actual image files ───────────────────────────────────
// Keys are product handles. Values are paths to local image files.
// Example: './product-images/usb-c-multimedia-hub.jpg'
const IMAGE_MAP = {
  'duraguard-stereo-audio-cable-90-degree':
    './product-images/duraguard-stereo-audio-cable-90-degree.jpg',
  'superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack':
    './product-images/superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack.jpg',
  'usb-c-multimedia-hub':
    './product-images/usb-c-multimedia-hub.jpg',
  'usb-c-pro-dock':
    './product-images/usb-c-pro-dock.jpg',
  'usb-c-travel-hub':
    './product-images/usb-c-travel-hub.jpg',
};
// ─────────────────────────────────────────────────────────────────────────────

async function getProductByHandle(handle) {
  const res = await fetch(
    `${BASE}/products.json?handle=${handle}&fields=id,title,handle&limit=1`,
    { headers: HEADERS }
  );
  const data = await res.json();
  return data.products?.[0] || null;
}

async function uploadImage(productId, imagePath, altText) {
  if (!fs.existsSync(imagePath)) {
    console.log(`  SKIP: file not found — ${imagePath}`);
    return false;
  }

  const imageData = fs.readFileSync(imagePath);
  const base64    = imageData.toString('base64');
  const filename  = path.basename(imagePath);

  const res = await fetch(
    `${BASE}/products/${productId}/images.json`,
    {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        image: {
          attachment: base64,
          filename,
          alt: altText,
          position: 1
        }
      })
    }
  );
  const data = await res.json();

  if (data.image) {
    console.log(`  UPLOADED: ${data.image.src.split('/').pop()} (position ${data.image.position})`);
    return true;
  }
  if (data.errors) {
    console.log(`  ERROR: ${JSON.stringify(data.errors)}`);
    return false;
  }
  return false;
}

async function main() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);
  console.log('Uploading product images...\n');

  let uploaded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const [handle, imagePath] of Object.entries(IMAGE_MAP)) {
    console.log(`Processing: ${handle}`);

    const product = await getProductByHandle(handle);
    if (!product) {
      console.log(`  NOT FOUND: product handle "${handle}" — check handle spelling`);
      skipped++;
      continue;
    }

    const success = await uploadImage(product.id, imagePath, product.title);
    if (success) { uploaded++; } else { skipped++; }

    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\nDone. Uploaded: ${uploaded}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log('Re-run: node scripts/audit-product-images.js to verify all images are present.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
