#!/usr/bin/env node
// Full product image audit — saves missing list to scripts/missing-images.json
// Run: node scripts/audit-images.js

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

const env     = { ...parseEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };
const STORE   = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN   = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER     = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const HEADERS = { 'X-Shopify-Access-Token': TOKEN };

async function auditImages() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);
  let allProducts = [];
  let url = `https://${STORE}/admin/api/${VER}/products.json?limit=250&fields=id,handle,title,images,status,product_type`;

  while (url) {
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    allProducts = allProducts.concat(data.products || []);
    const link = res.headers.get('link') || '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
    if (url) await new Promise(r => setTimeout(r, 300));
  }

  const withImages = allProducts.filter(p => p.images?.length > 0);
  const noImages   = allProducts.filter(p => !p.images?.length);

  console.log('===== PRODUCT IMAGE AUDIT =====');
  console.log(`Total products:  ${allProducts.length}`);
  console.log(`With images:     ${withImages.length}`);
  console.log(`Missing images:  ${noImages.length}`);

  if (noImages.length > 0) {
    console.log('\n===== PRODUCTS MISSING IMAGES =====\n');
    const missingList = noImages.map(p => {
      console.log(`MISSING: ${p.title}`);
      console.log(`  Handle:  ${p.handle}`);
      console.log(`  Type:    ${p.product_type || '—'}`);
      console.log(`  Admin:   https://${STORE}/admin/products/${p.id}\n`);
      return { id: p.id, handle: p.handle, title: p.title, type: p.product_type || '' };
    });
    fs.writeFileSync('scripts/missing-images.json', JSON.stringify(missingList, null, 2));
    console.log('Saved: scripts/missing-images.json');
  } else {
    console.log('\nAll products have images.');
    fs.writeFileSync('scripts/missing-images.json', '[]');
  }

  console.log('\n===== PRODUCTS WITH IMAGES =====\n');
  withImages.forEach(p => {
    const files = p.images.map(i => i.src.split('?')[0].split('/').pop());
    console.log(`OK: ${p.title}`);
    console.log(`  ${p.images.length} image${p.images.length > 1 ? 's' : ''}: ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3} more` : ''}\n`);
  });
}

auditImages().catch(err => { console.error('Fatal:', err); process.exit(1); });
