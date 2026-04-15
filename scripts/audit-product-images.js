#!/usr/bin/env node
// Audits all products for missing images.
// Run: node scripts/audit-product-images.js

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
const HEADERS = { 'X-Shopify-Access-Token': TOKEN };

async function auditProductImages() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);
  let allProducts = [];
  let url = `https://${STORE}/admin/api/${VER}/products.json?limit=250&fields=id,handle,title,images,status`;

  while (url) {
    const res = await fetch(url, { headers: HEADERS });
    const data = await res.json();
    allProducts = allProducts.concat(data.products || []);
    const link = res.headers.get('link') || '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }

  const withImages = allProducts.filter(p => p.images?.length > 0);
  const noImages   = allProducts.filter(p => !p.images?.length);

  console.log(`Total products: ${allProducts.length}`);
  console.log(`With images:    ${withImages.length}`);
  console.log(`NO IMAGES:      ${noImages.length}\n`);

  if (noImages.length > 0) {
    console.log('=== PRODUCTS MISSING IMAGES ===\n');
    noImages.forEach(p => {
      const tag = p.status === 'active' ? '[ACTIVE]' : `[${p.status.toUpperCase()}]`;
      console.log(`  ${tag} ${p.title}`);
      console.log(`    Handle: ${p.handle}`);
      console.log(`    Admin:  https://${STORE}/admin/products/${p.id}\n`);
    });
  }

  console.log('=== PRODUCTS WITH IMAGES ===\n');
  withImages.forEach(p => {
    const count = p.images.length;
    console.log(`  ✓ ${p.title} (${count} image${count > 1 ? 's' : ''})`);
  });
}

auditProductImages().catch(err => { console.error('Fatal:', err); process.exit(1); });
