/**
 * health-check.js — Weekly store health audit
 * Run: node scripts/health-check.js
 * Output: .audit/weekly-health.md
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const BASE = `https://ezquest-4.myshopify.com`;
const H = { 'X-Shopify-Access-Token': T };

const PAGES = [
  ['/', 'Homepage'],
  ['/collections/hubs-adapters', 'Hubs collection'],
  ['/collections/chargers-power', 'Chargers collection'],
  ['/collections/accessories', 'Accessories collection'],
  ['/pages/support', 'Support'],
  ['/pages/faq', 'FAQ'],
  ['/pages/compatibility', 'Compatibility'],
  ['/pages/help-me-choose', 'Help me choose'],
  ['/pages/compare', 'Compare'],
  ['/pages/about', 'About'],
  ['/pages/our-story', 'Our story'],
  ['/pages/where-to-buy', 'Where to buy'],
  ['/pages/warranty', 'Warranty'],
  ['/pages/contact', 'Contact'],
  ['/pages/shipping-returns', 'Shipping & returns'],
  ['/blogs/resources', 'Blog'],
  ['/pages/llms', 'llms.txt page'],
  ['/robots.txt', 'robots.txt'],
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [`# EZQuest Weekly Health Check — ${now}\n`];
  let pass = 0, fail = 0;

  lines.push('## Page availability');
  for (const [p, name] of PAGES) {
    const r = await fetch(BASE + p, {
      headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow'
    }).catch(() => ({ status: 0 }));
    const ok = r.status === 200;
    const icon = ok ? '✅' : '❌';
    lines.push(`${icon} ${r.status} ${name.padEnd(22)} ${p}`);
    ok ? pass++ : fail++;
    await sleep(150);
  }
  lines.push(`\n**${pass}/${PAGES.length} pages passing**`);

  // Theme Check
  lines.push('\n## Theme Check');
  const themeCheck = spawnSync('npm', ['run', 'check'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  const checkOutput = `${themeCheck.stdout || ''}\n${themeCheck.stderr || ''}`;
  const summaryMatch = checkOutput.match(/with\s+(\d+)\s+total offenses?/i);
  const offenseCount = summaryMatch ? Number(summaryMatch[1]) : (themeCheck.status === 0 ? 0 : 'unknown');
  const hasErrors = /(?:\d+\s+errors?|\[error\])/i.test(checkOutput);
  const themeOk = themeCheck.status === 0 && offenseCount === 0;
  lines.push(`- Command exit: ${themeCheck.status === 0 ? 'pass' : 'fail'}`);
  lines.push(`- Offenses: ${offenseCount}`);
  lines.push(`- Errors: ${hasErrors ? 'yes' : 'no'}`);
  lines.push(themeOk ? '✅ Theme Check has 0 offenses.' : '⚠️ Theme Check is not at 0 offenses. Review warnings/errors before launch.');

  // Product count
  lines.push('\n## Inventory');
  const prodR = await fetch(
    `https://${S}/admin/api/2026-01/products/count.json`,
    { headers: H }
  ).then(r => r.json()).catch(() => ({}));
  lines.push(`- Products: ${prodR.count ?? 'error'}`);

  // Blog count
  const blogR = await fetch(
    `https://${S}/admin/api/2026-01/blogs.json`,
    { headers: H }
  ).then(r => r.json()).catch(() => ({}));
  const resourcesBlog = blogR.blogs?.find(b => b.handle === 'resources');
  if (resourcesBlog) {
    const artR = await fetch(
      `https://${S}/admin/api/2026-01/blogs/${resourcesBlog.id}/articles/count.json`,
      { headers: H }
    ).then(r => r.json()).catch(() => ({}));
    lines.push(`- Blog articles: ${artR.count ?? 'error'}`);
  }

  // Products missing images
  const allProds = await fetch(
    `https://${S}/admin/api/2026-01/products.json?limit=250&fields=id,title,images`,
    { headers: H }
  ).then(r => r.json()).catch(() => ({ products: [] }));
  const noImage = (allProds.products || []).filter(p => !p.images?.length);
  lines.push(`- Products missing images: ${noImage.length}${noImage.length ? ' ⚠️' : ' ✅'}`);
  noImage.forEach(p => lines.push(`  - ${p.title}`));

  // Summary
  lines.push('\n## Summary');
  if (fail === 0 && themeOk) {
    lines.push('✅ Storefront health check passed.');
  } else {
    lines.push(`⚠️ Health check needs attention: ${fail} page failure(s), Theme Check offenses: ${offenseCount}.`);
  }

  const out = lines.join('\n');
  fs.mkdirSync(path.join(__dirname, '../.audit'), { recursive: true });
  const outPath = path.join(__dirname, '../.audit/weekly-health.md');
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nSaved: .audit/weekly-health.md`);
})();
