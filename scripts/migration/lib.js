'use strict';

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const root = path.join(__dirname, '..', '..');
  for (const name of ['.env.local', '.env']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }

  const store = process.env.SHOPIFY_SHOP_DOMAIN || process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
  const version = process.env.SHOPIFY_ADMIN_API_VERSION || process.env.SHOPIFY_API_VERSION || '2026-01';
  const themeId = process.env.THEME_ID || '150294855878';

  const missing = [];
  if (!store) missing.push('SHOPIFY_SHOP_DOMAIN');
  if (!token) missing.push('SHOPIFY_ADMIN_ACCESS_TOKEN');
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    console.error('Add them to .env.local at the project root.');
    process.exit(1);
  }

  return { store, token, version, themeId, base: `https://${store}/admin/api/${version}` };
}

function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  const [, ...rows] = lines;
  return rows
    .map(line => {
      const [from, to] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      return { from, to };
    })
    .filter(r => r.from && r.to);
}

async function shopifyGet(url, token) {
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  if (res.status === 401) throw new Error('401 Unauthorized — token is expired or missing scopes. Regenerate at Shopify admin → Settings → Apps → Develop apps.');
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}: ${await res.text()}`);
  return { json: await res.json(), link: res.headers.get('link') };
}

async function shopifyPost(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('401 Unauthorized — token is expired or missing scopes.');
  return { ok: res.ok, status: res.status, json: await res.json() };
}

async function shopifyPut(url, token, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('401 Unauthorized — token is expired or missing scopes.');
  if (!res.ok) throw new Error(`PUT ${url} → HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { loadEnv, parseCSV, shopifyGet, shopifyPost, shopifyPut, sleep };
