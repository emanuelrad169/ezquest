'use strict';

// Audits product body_html for run-together words caused by missing line breaks.
// Detects camelCase-like merges (e.g., "USB-C portsGoogle Chromebook").
// Read-only — no store writes.
//
// Usage: node scripts/audit-description-linebreaks.js
// Output:
//   docs/migration/audit-descriptions-YYYYMMDD-prioritized.csv
//   docs/migration/audit-descriptions-summary.txt

const fs   = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const STORE = process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN) {
  process.stderr.write('Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN\n');
  process.exit(1);
}

// Full combined strings (leftPart + rightPart) that are intentional camelCase / proper nouns
const ALLOWLIST = new Set([
  // Apple ecosystem
  'MacBook', 'MacBooks', 'MacPro', 'MacMini', 'MacStudio', 'MagSafe',
  'AirPods', 'AirPlay', 'AirDrop', 'AirPort', 'AirTag',
  'macOS', 'tvOS', 'watchOS', 'iPadOS',
  // Google / Chrome
  'ChromeOS', 'ChromeBook',
  // Connectors & storage
  'DisplayPort', 'microSD', 'microUSB', 'microHDMI',
  // USB SuperSpeed branding
  'SuperSpeed',
  // Brands
  'OnePlus', 'YouTube', 'LinkedIn', 'GitHub', 'PowerPoint', 'ThinkPad',
  // EZQuest product lines
  'UltimatePower', 'UltraSlim', 'DuraGuard', 'WorldTravel',
  // Apple technologies
  'NetBoot',
  // Device brand names found in compatibility lists
  'ZenPad',
]);

// Regex: word ending in lowercase immediately followed by word starting with uppercase
const MERGE_RE = /(\w*[a-z])([A-Z]\w*)/g;

function stripHtml(html) {
  return (html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findMerges(text) {
  const hits = [];
  MERGE_RE.lastIndex = 0;
  let m;
  while ((m = MERGE_RE.exec(text)) !== null) {
    const leftPart  = m[1];
    const rightPart = m[2];
    const combined  = leftPart + rightPart;

    if (leftPart.length < 3) continue;
    if (ALLOWLIST.has(combined)) continue;

    const start   = Math.max(0, m.index - 40);
    const end     = Math.min(text.length, m.index + combined.length + 40);
    const context = text.slice(start, end).replace(/[\r\n]+/g, ' ').trim();

    hits.push({
      combined,
      leftPart,
      rightPart,
      context,
      suggestedFix: `${leftPart} ${rightPart}`,
    });
  }
  return hits;
}

function priority(count) {
  if (count > 3) return 'HIGH';
  if (count >= 2) return 'MEDIUM';
  return 'LOW';
}

function csvCell(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}

async function fetchAllProducts() {
  const all = [];
  let url = `https://${STORE}/admin/api/2026-01/products.json?limit=250&fields=id,title,handle,body_html,status`;
  while (url) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': TOKEN } });
    if (res.status === 401) throw new Error('401 Unauthorized — regenerate token');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const { products } = await res.json();
    all.push(...(products || []));
    const link = res.headers.get('link') || '';
    const next = link.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
  }
  return all;
}

(async () => {
  const date = new Date().toISOString().slice(0, 10);
  const OUT_DIR = path.join(__dirname, '..', 'docs', 'migration');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const OUT_CSV     = path.join(OUT_DIR, `audit-descriptions-${date}-prioritized.csv`);
  const OUT_SUMMARY = path.join(OUT_DIR, 'audit-descriptions-summary.txt');

  process.stderr.write(`Fetching products from ${STORE}...\n`);
  const products = await fetchAllProducts();
  process.stderr.write(`Scanned ${products.length} products\n`);

  const rows = [];
  let totalMatches = 0;

  for (const p of products) {
    const text = stripHtml(p.body_html);
    const hits = findMerges(text);
    if (!hits.length) continue;

    totalMatches += hits.length;
    rows.push({
      priority:      priority(hits.length),
      product_id:    p.id,
      handle:        p.handle,
      title:         p.title,
      match_count:   hits.length,
      first_match:   hits[0].combined,
      context:       hits[0].context,
      suggested_fix: hits[0].suggestedFix,
      admin_url:     `https://${STORE}/admin/products/${p.id}`,
    });
  }

  const ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  rows.sort((a, b) => ORDER[a.priority] - ORDER[b.priority] || a.title.localeCompare(b.title));

  const COLS = ['priority','product_id','handle','title','match_count','first_match','context','suggested_fix','admin_url'];
  const csv  = [COLS.join(','), ...rows.map(r => COLS.map(c => csvCell(r[c])).join(','))].join('\n');
  fs.writeFileSync(OUT_CSV, csv);

  const high   = rows.filter(r => r.priority === 'HIGH').length;
  const medium = rows.filter(r => r.priority === 'MEDIUM').length;
  const low    = rows.filter(r => r.priority === 'LOW').length;

  const summary = [
    `Scanned ${products.length} products`,
    `Found ${totalMatches} potential issues across ${rows.length} products`,
    `HIGH priority (>3 matches): ${high} products`,
    `MEDIUM priority (2-3 matches): ${medium} products`,
    `LOW priority (1 match): ${low} products`,
    `Output: ${OUT_CSV}`,
  ].join('\n');

  fs.writeFileSync(OUT_SUMMARY, summary);
  process.stderr.write(summary + '\n');
  process.stderr.write('\nFirst 10 rows for sanity check:\n');
  rows.slice(0, 10).forEach((r, i) => {
    process.stderr.write(`  ${i + 1}. [${r.priority}] "${r.title}" — ${r.match_count} match(es), first: "${r.first_match}"\n`);
    process.stderr.write(`     context: ...${r.context}...\n`);
  });
})();
