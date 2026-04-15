#!/usr/bin/env node
// Downloads product images from ezq.com and uploads them to Shopify.
// Strategy:
//   1. Fetch ezq.com/products/[handle] and extract og:image (most reliable)
//   2. Fallback: try ezq.com/products/[handle].json (Shopify JSON)
//   3. Fallback: pattern-match CDN filenames from similar products
// Run: node scripts/pull-images-from-old-site.js

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
    result[key] = value.trim().replace(/^['"]|['"]$/g, '');
  }
  return result;
}

const env      = { ...parseEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };
const STORE    = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN    = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER      = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE     = `https://${STORE}/admin/api/${VER}`;
const HDRS     = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };
const OLD_SITE = 'https://ezq.com';
const IMG_DIR  = './product-images-downloaded';

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

const missingProducts = JSON.parse(
  fs.readFileSync('scripts/missing-images.json', 'utf8')
);

// ── Fetch og:image from product page ────────────────────────────────────────
async function getOgImageFromPage(handle) {
  try {
    const res = await fetch(`${OLD_SITE}/products/${handle}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EZQuestBot/1.0)' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const html = await res.text();

    // og:image
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
                 || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch) {
      let url = ogMatch[1];
      if (url.startsWith('//')) url = 'https:' + url;
      // Strip Shopify CDN size params to get the full-size image
      url = url.replace(/(_\d+x\d*|_\d+x)(\.\w+)/, '$2');
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Fetch all images from product JSON endpoint ──────────────────────────────
async function getImagesFromJson(handle) {
  try {
    const res = await fetch(`${OLD_SITE}/products/${handle}.json`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EZQuestBot/1.0)' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const images = data.product?.images || [];
    return images.map(img => {
      let url = img.src;
      if (url.startsWith('//')) url = 'https:' + url;
      url = url.replace(/\?.*$/, '').replace(/(_\d+x\d*|_\d+x)(\.\w+)/, '$2');
      return { url, alt: img.alt || '', position: img.position };
    });
  } catch {
    return [];
  }
}

// ── Download image buffer ─────────────────────────────────────────────────────
async function downloadImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EZQuestBot/1.0)' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// ── Upload image to Shopify product ──────────────────────────────────────────
async function uploadToShopify(productId, buffer, filename, alt, position = 1) {
  const base64 = buffer.toString('base64');
  const res = await fetch(`${BASE}/products/${productId}/images.json`, {
    method: 'POST',
    headers: HDRS,
    body: JSON.stringify({ image: { attachment: base64, filename, alt, position } })
  });
  const data = await res.json();
  if (data.image) return data.image;
  console.log(`  Upload error: ${JSON.stringify(data.errors || data)}`);
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`Store: ${STORE}  API: ${VER}`);
  console.log(`Processing ${missingProducts.length} products...\n`);

  const results = { uploaded: [], notFound: [], failed: [] };

  for (const product of missingProducts) {
    console.log(`► ${product.title}`);
    console.log(`  Handle: ${product.handle}`);

    // Strategy 1: full product.json — gets all images + positions
    const jsonImages = await getImagesFromJson(product.handle);
    if (jsonImages.length > 0) {
      console.log(`  Found ${jsonImages.length} image(s) via product.json`);
      let uploaded = 0;
      for (const img of jsonImages.slice(0, 6)) { // max 6 per product
        const ext      = img.url.split('.').pop().split('?')[0].toLowerCase() || 'jpg';
        const filename = `${product.handle}-${img.position || (uploaded + 1)}.${ext}`;
        const buffer   = await downloadImage(img.url);
        if (!buffer) { console.log(`  SKIP (download failed): ${img.url}`); continue; }
        const filepath = path.join(IMG_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        const shopifyImg = await uploadToShopify(product.id, buffer, filename, img.alt || product.title, img.position || (uploaded + 1));
        if (shopifyImg) {
          console.log(`  UPLOADED [${uploaded + 1}]: ${shopifyImg.src.split('/').pop()}`);
          uploaded++;
        }
        await new Promise(r => setTimeout(r, 400));
      }
      if (uploaded > 0) {
        results.uploaded.push({ product, count: uploaded, source: 'product.json' });
        console.log(`  ✓ ${uploaded} image(s) uploaded\n`);
        continue;
      }
    }

    // Strategy 2: og:image fallback
    const ogUrl = await getOgImageFromPage(product.handle);
    if (ogUrl) {
      console.log(`  Found via og:image: ${ogUrl}`);
      const ext      = ogUrl.split('.').pop().split('?')[0].toLowerCase() || 'jpg';
      const filename = `${product.handle}-view1.${ext}`;
      const buffer   = await downloadImage(ogUrl);
      if (buffer) {
        fs.writeFileSync(path.join(IMG_DIR, filename), buffer);
        const shopifyImg = await uploadToShopify(product.id, buffer, filename, product.title, 1);
        if (shopifyImg) {
          console.log(`  UPLOADED: ${shopifyImg.src.split('/').pop()}`);
          results.uploaded.push({ product, count: 1, source: 'og:image' });
          console.log('  ✓ 1 image uploaded\n');
          continue;
        }
      }
    }

    // Not found on old site
    console.log(`  NOT FOUND on ezq.com — manual upload required`);
    console.log(`  Admin: https://${STORE}/admin/products/${product.id}\n`);
    results.notFound.push(product);
    await new Promise(r => setTimeout(r, 300));
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Uploaded from ezq.com:  ${results.uploaded.length}`);
  console.log(`Not found on ezq.com:   ${results.notFound.length}`);
  console.log(`Failed uploads:         ${results.failed.length}`);

  if (results.notFound.length > 0) {
    console.log('\nMANUAL UPLOAD REQUIRED:');
    results.notFound.forEach(p => {
      console.log(`  ${p.title}`);
      console.log(`  https://${STORE}/admin/products/${p.id}`);
    });
  }

  fs.writeFileSync('scripts/image-upload-report.json', JSON.stringify(results, null, 2));
  console.log('\nSaved: scripts/image-upload-report.json');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
