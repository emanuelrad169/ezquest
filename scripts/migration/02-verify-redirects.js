'use strict';

const path = require('path');
const fs = require('fs');
const { loadEnv, parseCSV, sleep } = require('./lib');

const { store } = loadEnv();
const BASE = `https://${store}`;

async function checkRedirect(from, expectedTo) {
  let res;
  try {
    res = await fetch(`${BASE}${from}`, { redirect: 'manual' });
  } catch (e) {
    return { ok: false, reason: `fetch error: ${e.message}` };
  }

  const status = res.status;
  if (status !== 301 && status !== 302) {
    // Password-protected stores return 302 to /password — treat as a known gate
    const loc = res.headers.get('location') || '';
    if (loc.includes('/password')) return { ok: false, reason: `store is password-protected (${status} → ${loc})` };
    return { ok: false, reason: `HTTP ${status} (expected 301/302)` };
  }

  const location = res.headers.get('location') || '';
  const norm = (s) => s.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';
  const got = norm(location);
  const want = norm(expectedTo);

  if (got === want) return { ok: true, status, got };
  // Tolerate Shopify appending a trailing slash to the root
  if (want === '/' && (got === '' || got === '/')) return { ok: true, status, got };
  return { ok: false, reason: `→ ${location} (expected ${expectedTo})`, status };
}

(async () => {
  const csvPath = path.join(__dirname, '..', '..', 'docs', 'ezq-redirects.csv');
  const redirects = parseCSV(csvPath);
  console.log(`Verifying ${redirects.length} redirects against https://${store}...\n`);

  let pass = 0, fail = 0;
  const failures = [];

  for (const { from, to } of redirects) {
    const result = await checkRedirect(from, to);
    if (result.ok) {
      pass++;
    } else {
      fail++;
      failures.push({ from, to, reason: result.reason });
    }
    // Light rate limiting — not hitting the API, just the storefront
    await sleep(100);
  }

  console.log(`── Result ──────────────────────────────`);
  console.log(`Pass: ${pass} / ${redirects.length}`);
  console.log(`Fail: ${fail}`);

  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ${f.from} → ${f.to}\n    ${f.reason}`));

    // Note: password-protected storefronts block all redirect checks
    const passwordGated = failures.filter(f => f.reason.includes('password-protected'));
    if (passwordGated.length === failures.length) {
      console.log('\n⚠  All failures are due to the store being password-protected.');
      console.log('   Remove the storefront password (Shopify admin → Online Store → Preferences),');
      console.log('   then re-run this script to verify redirects via HTTP.');
    }
  } else {
    console.log('\n✓ All redirects verified.');
  }

  // Save report
  const report = [
    `Redirect verification — ${new Date().toISOString()}`,
    `Store: ${store}`,
    `Total: ${redirects.length} | Pass: ${pass} | Fail: ${fail}`,
    '',
    ...(failures.length
      ? ['Failures:', ...failures.map(f => `  ${f.from} → ${f.to}\n    ${f.reason}`)]
      : ['All redirects passing.']),
  ].join('\n');

  const outPath = path.join(__dirname, '..', '..', 'docs', 'redirect-verify.txt');
  fs.writeFileSync(outPath, report);
  console.log(`\nReport saved to docs/redirect-verify.txt`);
})();
