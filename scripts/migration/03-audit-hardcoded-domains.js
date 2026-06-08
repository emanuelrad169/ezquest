'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, sleep } = require('./lib');

const { store, token, base, themeId } = loadEnv();

// Skip CDN URLs (cdn.shopify.com), JS comments, and Shopify's own
// platform-injected strings that appear in compiled/minified assets.
const IGNORE_PATTERNS = [
  /cdn\.shopify\.com/,
  /\/\/\s*myshopify/,        // JS comment
  /<!--.*myshopify/,          // Liquid comment
  /fonts\.shopifycdn\.com/,
];

function isIgnored(line) {
  return IGNORE_PATTERNS.some(re => re.test(line));
}

async function listLiquidAssets() {
  const { json } = await shopifyGet(`${base}/themes/${themeId}/assets.json`, token);
  return json.assets.filter(a =>
    a.key.endsWith('.liquid') ||
    a.key.endsWith('.json') ||
    (a.key.endsWith('.js') && !a.key.includes('assets/theme.') && !a.key.includes('assets/theme.min.'))
  );
}

async function getAssetContent(key) {
  const url = `${base}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const { json } = await shopifyGet(url, token);
  return json.asset?.value || null;
}

(async () => {
  console.log(`Scanning theme ${themeId} on ${store} for hardcoded myshopify.com references...\n`);

  const assets = await listLiquidAssets();
  console.log(`Found ${assets.length} text assets to scan`);

  const findings = [];
  let scanned = 0;

  for (const asset of assets) {
    const content = await getAssetContent(asset.key);
    scanned++;
    if (!content) continue;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('myshopify.com') && !isIgnored(line)) {
        findings.push({
          file: asset.key,
          line: i + 1,
          content: line.trim().slice(0, 300),
        });
      }
    }
    // Rate-limit: ~5 req/sec
    await sleep(200);
    if (scanned % 20 === 0) process.stdout.write(`  Scanned ${scanned}/${assets.length}...\r`);
  }

  console.log(`\nScanned ${scanned} assets.`);

  if (findings.length === 0) {
    console.log('\n✓ No hardcoded myshopify.com references found in theme assets.');
    console.log('  The domain references visible in live HTML are Shopify-platform injections');
    console.log('  (content_for_header, web pixels) — they auto-rewrite on domain change.');
  } else {
    console.log(`\n⚠  Found ${findings.length} hardcoded references:\n`);
    findings.forEach(f => {
      console.log(`${f.file}:${f.line}`);
      console.log(`  ${f.content}\n`);
    });
  }

  const lines = [
    `Theme domain audit — ${new Date().toISOString()}`,
    `Store: ${store} | Theme ID: ${themeId}`,
    `Assets scanned: ${scanned}`,
    `Hardcoded myshopify.com references: ${findings.length}`,
    '',
    ...(findings.length
      ? findings.map(f => `${f.file}:${f.line}\n  ${f.content}`)
      : ['CLEAN — no hardcoded domain references found.']),
  ];

  const outPath = path.join(__dirname, '..', '..', 'docs', 'myshopify-audit.txt');
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`Report saved to docs/myshopify-audit.txt`);
})();
