#!/usr/bin/env node
// Creates (or updates) the /pages/wishlist Shopify page with template_suffix: wishlist
// Run: node scripts/shopify-admin/create-wishlist-page.js

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
const STORE  = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN  = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER    = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE   = `https://${STORE}/admin/api/${VER}`;
const HEADERS = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

async function createWishlistPage() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);

  // Try to create
  const createRes = await fetch(`${BASE}/pages.json`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      page: {
        title: 'Your Wishlist',
        handle: 'wishlist',
        body_html: '',
        template_suffix: 'wishlist',
        published: true
      }
    })
  });
  const createData = await createRes.json();

  if (createData.page) {
    console.log('CREATED: /pages/wishlist');
    console.log('  ID:', createData.page.id);
    console.log('  Handle:', createData.page.handle);
    console.log('  Template suffix:', createData.page.template_suffix);
    return;
  }

  const errMsg = JSON.stringify(createData.errors || createData);
  if (errMsg.includes('taken') || errMsg.includes('has already been taken')) {
    console.log('Page handle "wishlist" already exists — updating template suffix...');
    await updateExistingPage();
  } else {
    console.log('ERROR creating page:', errMsg);
    process.exit(1);
  }
}

async function updateExistingPage() {
  const listRes = await fetch(`${BASE}/pages.json?handle=wishlist&limit=1`, { headers: HEADERS });
  const listData = await listRes.json();
  const page = listData.pages?.[0];

  if (!page) {
    console.log('ERROR: could not find page with handle "wishlist".');
    console.log('Create manually: Admin → Online Store → Pages → Add page');
    console.log('  Title: Your Wishlist');
    console.log('  Handle: wishlist');
    console.log('  Template suffix: wishlist');
    return;
  }

  if (page.template_suffix === 'wishlist') {
    console.log('ALREADY CORRECT: /pages/wishlist has template_suffix = wishlist');
    console.log('  ID:', page.id, '  Published:', page.published_at ? 'yes' : 'no');
    return;
  }

  const updateRes = await fetch(`${BASE}/pages/${page.id}.json`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify({ page: { template_suffix: 'wishlist', published: true } })
  });
  const updateData = await updateRes.json();
  console.log('UPDATED: template_suffix →', updateData.page?.template_suffix);
  console.log('  ID:', updateData.page?.id);
}

createWishlistPage().catch(err => { console.error('Fatal:', err); process.exit(1); });
