/**
 * audit-product-descriptions.js — Flag products with missing or thin descriptions
 * Run: node scripts/audit-product-descriptions.js
 * Output: .audit/product-descriptions-YYYY-MM-DD.md
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const H = { 'X-Shopify-Access-Token': T };

const MIN_WORDS = 60;
const MIN_CHARS = 300;

function wordCount(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

(async () => {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [`# Product Description Audit — ${now}\n`];

  const r = await fetch(
    `https://${S}/admin/api/2026-01/products.json?limit=250&fields=id,title,handle,body_html,status`,
    { headers: H }
  ).then(r => r.json()).catch(() => ({ products: [] }));

  const products = r.products || [];
  lines.push(`Total products: ${products.length}\n`);

  const missing = [];
  const thin = [];
  const ok = [];

  for (const p of products) {
    const html = p.body_html || '';
    const plain = stripHtml(html);
    const words = wordCount(html);
    const chars = plain.length;

    if (!html || chars < 10) {
      missing.push({ title: p.title, handle: p.handle, words, chars });
    } else if (words < MIN_WORDS || chars < MIN_CHARS) {
      thin.push({ title: p.title, handle: p.handle, words, chars, preview: plain.slice(0, 80) });
    } else {
      ok.push(p.title);
    }
  }

  lines.push(`## ❌ Missing descriptions (${missing.length})`);
  if (missing.length === 0) {
    lines.push('_None — all products have descriptions._');
  } else {
    missing.forEach(p => lines.push(`- [${p.title}](/products/${p.handle}) — ${p.chars} chars`));
  }

  lines.push(`\n## ⚠️ Thin descriptions (<${MIN_WORDS} words or <${MIN_CHARS} chars) (${thin.length})`);
  if (thin.length === 0) {
    lines.push('_None — all descriptions meet the minimum threshold._');
  } else {
    thin.forEach(p => lines.push(
      `- [${p.title}](/products/${p.handle}) — ${p.words} words, ${p.chars} chars\n  > "${p.preview}..."`
    ));
  }

  lines.push(`\n## ✅ Passing (${ok.length})`);
  ok.forEach(t => lines.push(`- ${t}`));

  lines.push('\n## Summary');
  lines.push(`- Missing: ${missing.length}`);
  lines.push(`- Thin: ${thin.length}`);
  lines.push(`- Passing: ${ok.length}/${products.length}`);

  if (missing.length + thin.length > 0) {
    lines.push('\n### Recommended action');
    lines.push(`Write descriptions of at least ${MIN_WORDS} words per product.`);
    lines.push('Focus on: primary use case, compatibility, key specs, and differentiators.');
  }

  const out = lines.join('\n');
  fs.mkdirSync(path.join(__dirname, '../.audit'), { recursive: true });
  const outPath = path.join(__dirname, `../.audit/product-descriptions-${now}.md`);
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nSaved: .audit/product-descriptions-${now}.md`);
})();
