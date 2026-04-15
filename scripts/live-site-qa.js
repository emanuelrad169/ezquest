#!/usr/bin/env node
// Live site QA — checks all 30 pages for HTTP status, OG tags, placeholder SVGs.
// Run: node scripts/live-site-qa.js

const SITE = 'https://ezquest-4.myshopify.com';

const pages = [
  { url: '/',                                name: 'Homepage' },
  { url: '/collections/hubs-adapters',       name: 'Hubs collection' },
  { url: '/collections/docking-stations',    name: 'Docking collection' },
  { url: '/collections/chargers-power',      name: 'Chargers collection' },
  { url: '/collections/accessories',         name: 'Accessories collection' },
  { url: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3', name: 'Product PDP' },
  { url: '/cart',                            name: 'Cart page' },
  { url: '/search?q=cable',                 name: 'Search results' },
  { url: '/pages/support',                   name: 'Support hub' },
  { url: '/pages/faq',                       name: 'FAQ' },
  { url: '/pages/compare',                   name: 'Compare' },
  { url: '/pages/help-me-choose',            name: 'Help me choose' },
  { url: '/pages/compatibility',             name: 'Compatibility' },
  { url: '/pages/downloads',                 name: 'Downloads' },
  { url: '/pages/manuals',                   name: 'Manuals' },
  { url: '/pages/firmware',                  name: 'Firmware' },
  { url: '/pages/user-guides',               name: 'User guides' },
  { url: '/pages/troubleshooting',           name: 'Troubleshooting' },
  { url: '/pages/warranty',                  name: 'Warranty' },
  { url: '/pages/contact',                   name: 'Contact' },
  { url: '/pages/ticket-submission',         name: 'Ticket submission' },
  { url: '/pages/about',                     name: 'About' },
  { url: '/pages/our-story',                 name: 'Our story' },
  { url: '/pages/where-to-buy',              name: 'Where to buy' },
  { url: '/pages/shipping-returns',          name: 'Shipping & returns' },
  { url: '/pages/cookie-policy',             name: 'Cookie policy' },
  { url: '/blogs/resources',                 name: 'Resources blog' },
  { url: '/pages/wishlist',                  name: 'Wishlist' },
  { url: '/404',                             name: '404 page', expectedStatus: 404 },
];

async function checkPage(page) {
  const start = Date.now();
  const expected = page.expectedStatus || 200;

  // retry once on connection error
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(SITE + page.url, {
        headers: { 'User-Agent': 'EZQuest-QA-Bot/1.0' },
        redirect: 'follow',
        signal: AbortSignal.timeout(10000)
      });
      const html  = await res.text();
      const ms    = Date.now() - start;

      return {
        ...page,
        status:         res.status,
        loads:          res.status === expected,
      hasTitle:       /<title>[^<]{4,}<\/title>/.test(html),
      hasNav:         html.includes('site-header'),
      hasFooter:      html.includes('site-footer') || html.includes('footer'),
      hasPlaceholderSvg: html.includes('placeholder-product.svg'),
      hasOGTitle:     html.includes('og:title'),
      hasCanonical:   html.includes('rel="canonical"'),
      timeMs:         ms
    };
    } catch (err) {
      if (attempt === 0) { await new Promise(r => setTimeout(r, 1000)); continue; }
      return { ...page, status: 'ERR', loads: false, error: err.message, timeMs: 0 };
    }
  }
}

async function run() {
  console.log(`\nRunning QA against ${SITE}\n`);
  const results = [];

  for (const page of pages) {
    const result = await checkPage(page);
    results.push(result);
    const icon       = result.loads ? '✓' : '✗';
    const placeholder = result.hasPlaceholderSvg ? ' [PLACEHOLDER-SVG]' : '';
    const noOG       = !result.hasOGTitle ? ' [NO-OG]' : '';
    const slow       = result.timeMs > 3000 ? ' [SLOW]' : '';
    console.log(
      `${icon} ${String(result.status).padEnd(3)} ${String(result.timeMs).padStart(5)}ms  ` +
      `${result.name.padEnd(26)}${placeholder}${noOG}${slow}`
    );
    await new Promise(r => setTimeout(r, 250));
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const pass    = results.filter(r => r.loads).length;
  const fail    = results.filter(r => !r.loads).length;
  const phSvg   = results.filter(r => r.hasPlaceholderSvg);
  const noOG    = results.filter(r => !r.hasOGTitle);
  const avgTime = Math.round(results.reduce((s, r) => s + (r.timeMs || 0), 0) / results.length);

  console.log('\n===== CHECKLIST STATUS =====\n');
  console.log(`Pages 200 OK:           ${pass}/${results.length}  ${pass === results.length ? 'PASS' : 'FAIL'}`);
  console.log(`placeholder-product.svg: ${phSvg.length === 0 ? 'PASS' : `FAIL (${phSvg.length} pages)`}`);
  console.log(`OG tags present:        ${noOG.length === 0 ? 'PASS' : `FAIL (${noOG.length} pages)`}`);
  console.log(`Avg response time:      ${avgTime}ms`);

  if (fail > 0) {
    console.log('\n===== FAILED PAGES =====');
    results.filter(r => !r.loads).forEach(r =>
      console.log(`  ✗ ${r.status}  ${r.name.padEnd(26)} ${SITE + r.url}`)
    );
  }

  if (phSvg.length > 0) {
    console.log('\n===== PAGES WITH PLACEHOLDER SVG =====');
    phSvg.forEach(r => console.log(`  ${r.name}  ${SITE + r.url}`));
  }

  if (noOG.length > 0) {
    console.log('\n===== PAGES MISSING OG TAGS =====');
    noOG.forEach(r => console.log(`  ${r.name}  ${SITE + r.url}`));
  }

  // Export JSON for report generation
  const reportPath = 'scripts/qa-results.json';
  require('fs').writeFileSync(reportPath, JSON.stringify({
    date: new Date().toISOString().split('T')[0],
    site: SITE,
    summary: { total: results.length, pass, fail, phSvg: phSvg.length, noOG: noOG.length, avgTime },
    results
  }, null, 2));
  console.log(`\nSaved: ${reportPath}`);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
