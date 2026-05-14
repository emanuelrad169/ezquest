'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, sleep } = require('./lib');

const { store, token, base } = loadEnv();
const DOMAIN = 'ezq.com';
const OUT = path.join(__dirname, '..', '..', 'docs', `post-cutover-${new Date().toISOString().slice(0, 10)}.md`);

// ── Helpers ──────────────────────────────────────────────────────────────────

async function httpHead(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
    return { status: res.status, location: res.headers.get('location') };
  } catch (e) {
    return { status: 'ERR', error: e.message };
  }
}

async function getHtml(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return { status: res.status, html: await res.text() };
  } catch (e) {
    return { status: 'ERR', html: '', error: e.message };
  }
}

function extractMeta(html) {
  return {
    canonical: html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || null,
    ogUrl: html.match(/<meta property="og:url" content="([^"]+)"/)?.[1] || null,
    twitterUrl: html.match(/<meta name="twitter:url" content="([^"]+)"/)?.[1] || null,
    title: html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() || null,
  };
}

function check(label, passed, evidence) {
  const icon = passed ? '✅' : '❌';
  return { label, passed, evidence, formatted: `${icon} **${label}**\n   ${evidence}` };
}

// ── Checks ───────────────────────────────────────────────────────────────────

async function checkHomepage() {
  const { status, html } = await getHtml(`https://${DOMAIN}/`);
  if (status !== 200) return check('Homepage loads', false, `HTTP ${status}`);
  const meta = extractMeta(html);
  const canonOk = meta.canonical?.includes(DOMAIN);
  const ogOk = !meta.ogUrl || meta.ogUrl.includes(DOMAIN);
  const issues = [];
  if (!canonOk) issues.push(`canonical: ${meta.canonical || 'missing'}`);
  if (!ogOk) issues.push(`og:url: ${meta.ogUrl}`);
  const ok = canonOk && ogOk;
  return check('Homepage loads + canonical correct', ok,
    ok ? `HTTP 200 · canonical: ${meta.canonical}` : issues.join(' · '));
}

async function checkWwwRedirect() {
  const { status, location } = await httpHead(`https://www.${DOMAIN}/`);
  const ok = (status === 301 || status === 302) && location?.includes(DOMAIN);
  return check('www redirects to apex (or vice-versa)', ok,
    `HTTP ${status}${location ? ` → ${location}` : ''}`);
}

async function checkSsl() {
  try {
    const res = await fetch(`https://${DOMAIN}/`, { method: 'HEAD' });
    return check('SSL certificate valid', res.ok, `HTTPS connection succeeded · HTTP ${res.status}`);
  } catch (e) {
    return check('SSL certificate valid', false, `SSL error: ${e.message}`);
  }
}

async function checkSpotRedirects() {
  const SPOT = [
    { from: '/usb-c-hubs-docks.html', to: '/collections/hubs-adapters' },
    { from: '/about-ezquest.html', to: '/pages/our-story' },
    { from: '/magnetic-usb-c-m-2-nvme-ssd-enclosure-details.html', to: '/products/magnetic-usb-c-m-2-nvme-ssd-enclosure' },
    { from: '/warranty.html', to: '/pages/warranty' },
    { from: '/X48912-X48922-duraguard-usb-c-to-usb-a-charge-sync-cable.html', to: '/products/duraguard-usb-c-to-usb-a-charge-and-sync-cable' },
  ];
  const results = [];
  for (const { from, to } of SPOT) {
    const { status, location } = await httpHead(`https://${DOMAIN}${from}`);
    const loc = (location || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
    const want = to.replace(/\/$/, '');
    const ok = (status === 301 || status === 302) && loc === want;
    results.push({ from, to, ok, got: `${status}${location ? ` → ${location}` : ''}` });
    await sleep(200);
  }
  const allOk = results.every(r => r.ok);
  const evidence = results.map(r => `${r.ok ? '✓' : '✗'} ${r.from} → ${r.got}`).join('\n   ');
  return check('Spot redirects (5 sampled)', allOk, evidence);
}

async function checkPdpCanonical() {
  const { status, html } = await getHtml(`https://${DOMAIN}/products/magnetic-usb-c-m-2-nvme-ssd-enclosure`);
  if (status !== 200) return check('PDP canonical', false, `HTTP ${status}`);
  const meta = extractMeta(html);
  const ok = meta.canonical?.includes(DOMAIN) && meta.canonical?.includes('/products/');
  return check('PDP canonical correct', ok,
    ok ? meta.canonical : `canonical: ${meta.canonical || 'missing'}`);
}

async function checkCollectionCanonical() {
  const { status, html } = await getHtml(`https://${DOMAIN}/collections/hubs-adapters`);
  if (status !== 200) return check('Collection canonical', false, `HTTP ${status}`);
  const meta = extractMeta(html);
  const ok = meta.canonical?.includes(DOMAIN) && meta.canonical?.includes('/collections/');
  return check('Collection canonical correct', ok,
    ok ? meta.canonical : `canonical: ${meta.canonical || 'missing'}`);
}

async function checkSitemap() {
  const res = await fetch(`https://${DOMAIN}/sitemap.xml`);
  if (!res.ok) return check('Sitemap uses ezq.com', false, `HTTP ${res.status}`);
  const xml = await res.text();
  const hasLegacyDomain = xml.includes('myshopify.com') && !xml.includes('cdn.shopify.com');
  const locCount = (xml.match(/<loc>/g) || []).length;
  const firstLoc = xml.match(/<loc>([^<]+)<\/loc>/)?.[1] || '';
  const ok = firstLoc.includes(DOMAIN) && !hasLegacyDomain;
  return check('Sitemap <loc> entries use ezq.com', ok,
    `${locCount} URLs · first: ${firstLoc}${hasLegacyDomain ? ' · ⚠ contains myshopify.com' : ''}`);
}

async function checkNoJsErrors() {
  // Can't run headless browser here — flag for manual check
  return check('No JS console errors (manual)', null,
    'Open https://ezq.com in browser DevTools → Console tab. Confirm no red errors.');
}

// ── Run ───────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Post-cutover verification for https://${DOMAIN}\n`);

  const runners = [
    ['Homepage + canonical', checkHomepage],
    ['www redirect', checkWwwRedirect],
    ['SSL', checkSsl],
    ['Spot redirects', checkSpotRedirects],
    ['PDP canonical', checkPdpCanonical],
    ['Collection canonical', checkCollectionCanonical],
    ['Sitemap domain', checkSitemap],
    ['JS errors (manual)', checkNoJsErrors],
  ];

  const results = [];
  for (const [name, fn] of runners) {
    process.stdout.write(`  Checking: ${name}...`);
    const result = await fn().catch(e => check(name, false, `Error: ${e.message}`));
    results.push(result);
    const icon = result.passed === null ? '⚠ ' : result.passed ? '✅' : '❌';
    console.log(` ${icon}`);
    await sleep(300);
  }

  const automated = results.filter(r => r.passed !== null);
  const passed = automated.filter(r => r.passed).length;
  const total = automated.length;
  const allGreen = passed === total;

  const md = [
    `# Post-Cutover Verification`,
    ``,
    `**Date:** ${new Date().toISOString()}`,
    `**Domain:** https://${DOMAIN}`,
    `**Status:** ${allGreen ? '🟢 All automated checks passing' : `🔴 ${total - passed} check(s) failing`}`,
    ``,
    `## Automated checks (${passed}/${total} passing)`,
    ``,
    ...results.map(r => r.formatted),
    ``,
    `## Manual checks`,
    ``,
    `- [ ] Place a real test order → verify confirmation email arrives and order appears in admin`,
    `- [ ] Open DevTools Console on home, PDP, collection — confirm no JS errors`,
    `- [ ] Check browser lock icon on https://${DOMAIN} — SSL valid`,
    `- [ ] Verify admin → Online Store → Domains shows ezq.com as primary`,
    ``,
    `## Search Console`,
    ``,
    `- [ ] Submit https://${DOMAIN}/sitemap.xml to Google Search Console`,
    `- [ ] Submit to Bing Webmaster Tools`,
    `- [ ] Monitor Coverage report daily for first 7 days`,
    ``,
    `## Legacy site`,
    ``,
    `- [ ] Keep legacy ShopSite running for 30 days (rollback target)`,
    `- [ ] Decommission legacy at 30-day mark if traffic is stable`,
  ].join('\n');

  fs.writeFileSync(OUT, md);

  console.log(`\n── Result: ${passed}/${total} automated checks passing`);
  console.log(allGreen ? '🟢 Cutover verified.' : '🔴 Fix failing checks before submitting to Search Console.');
  console.log(`\nReport saved to ${path.relative(process.cwd(), OUT)}`);

  if (!allGreen) process.exit(1);
})();
