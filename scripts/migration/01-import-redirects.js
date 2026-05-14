'use strict';

const path = require('path');
const { loadEnv, parseCSV, shopifyGet, shopifyPost, sleep } = require('./lib');

const { store, token, version, base } = loadEnv();

async function fetchExistingRedirects() {
  const all = [];
  let url = `${base}/redirects.json?limit=250`;
  while (url) {
    const { json, link } = await shopifyGet(url, token);
    all.push(...json.redirects);
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
    if (next) await sleep(250);
  }
  return new Set(all.map(r => r.path));
}

(async () => {
  const csvPath = path.join(__dirname, '..', '..', 'docs', 'ezq-redirects.csv');
  const redirects = parseCSV(csvPath);
  console.log(`Loaded ${redirects.length} redirects from docs/ezq-redirects.csv`);

  console.log('Fetching existing redirects from Shopify...');
  const existing = await fetchExistingRedirects();
  console.log(`Found ${existing.size} existing redirects in store\n`);

  let created = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const { from, to } of redirects) {
    if (existing.has(from)) {
      skipped++;
      continue;
    }
    const { ok, status, json } = await shopifyPost(`${base}/redirects.json`, token, {
      redirect: { path: from, target: to },
    });
    if (ok) {
      created++;
      if (created % 10 === 0) console.log(`  Created ${created}...`);
    } else {
      const errMsg = json?.errors ? JSON.stringify(json.errors) : `HTTP ${status}`;
      failed++;
      failures.push({ from, to, error: errMsg });
      console.error(`  ✗ ${from} → ${to}: ${errMsg}`);
    }
    await sleep(250);
  }

  console.log(`\n── Result ──────────────────────────────`);
  console.log(`Created:  ${created}`);
  console.log(`Skipped:  ${skipped} (already existed)`);
  console.log(`Failed:   ${failed}`);

  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ${f.from} → ${f.to}\n    ${f.error}`));
    process.exit(1);
  }

  console.log('\n✓ All redirects imported successfully. Run 02-verify-redirects.js next.');
})();
