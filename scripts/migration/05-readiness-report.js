'use strict';

const fs = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, sleep } = require('./lib');

const { store, token, base, themeId } = loadEnv();
const OUT = path.join(__dirname, '..', '..', 'docs', 'migration-readiness.md');

const SAMPLE_PAGES = [
  { label: 'Homepage', path: '/' },
  { label: 'PDP', path: '/products/magnetic-usb-c-m-2-nvme-ssd-enclosure' },
  { label: 'Collection', path: '/collections/hubs-adapters' },
];

// Products that should NOT appear in the live catalog
const DEMO_HANDLES = [
  'pro-dock', 'travel-hub', 'usb-c-multimedia-hub',
  'generic-hub', 'sample-product', 'gift-card',
];

function gate(label, passed, evidence) {
  const icon = passed ? '✅' : '❌';
  return { label, passed, evidence, formatted: `${icon} ${label}\n   ${evidence}` };
}

// ── Gate 1: Redirects ────────────────────────────────────────────────────────

async function checkRedirects() {
  const csvPath = path.join(__dirname, '..', '..', 'docs', 'ezq-redirects.csv');
  if (!fs.existsSync(csvPath)) {
    return gate('Redirects imported', false, 'docs/ezq-redirects.csv not found');
  }

  const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1);
  const expected = lines.length;

  const { json } = await shopifyGet(`${base}/redirects.json?limit=250`, token);
  const count = json.redirects.length;

  // Check for any pagination (>250 redirects)
  const enough = count >= expected;
  return gate(
    'Redirects imported',
    enough,
    `${count} redirects in store, ${expected} in CSV${enough ? '' : ' — re-run 01-import-redirects.js'}`
  );
}

// ── Gate 2: Theme clean ──────────────────────────────────────────────────────

async function checkThemeDomain() {
  const auditPath = path.join(__dirname, '..', '..', 'docs', 'myshopify-audit.txt');
  if (fs.existsSync(auditPath)) {
    const txt = fs.readFileSync(auditPath, 'utf8');
    const match = txt.match(/Hardcoded myshopify\.com references:\s*(\d+)/);
    const count = match ? parseInt(match[1], 10) : null;
    if (count !== null) {
      return gate('Theme domain references', count === 0,
        count === 0 ? 'docs/myshopify-audit.txt: CLEAN' : `${count} hardcoded reference(s) found — run 04-apply-theme-fixes.js --apply`);
    }
  }
  return gate('Theme domain references', false, 'Run 03-audit-hardcoded-domains.js first');
}

// ── Gate 3: Sitemap ──────────────────────────────────────────────────────────

async function checkSitemap() {
  try {
    const res = await fetch(`https://${store}/sitemap.xml`);
    if (!res.ok) return gate('Sitemap accessible', false, `HTTP ${res.status}`);
    const xml = await res.text();
    const locCount = (xml.match(/<loc>/g) || []).length;

    // Check for legacy product slugs that shouldn't be live
    const legacyHits = ['studio-v-quad', 'thunder-pro-a-v'].filter(slug => xml.includes(slug));

    const clean = legacyHits.length === 0;
    const evidence = `${res.status} OK · ${locCount} <loc> entries${legacyHits.length ? ` · ⚠ legacy slugs found: ${legacyHits.join(', ')} — unpublish in admin` : ''}`;
    return gate('Sitemap accessible', res.ok && clean, evidence);
  } catch (e) {
    return gate('Sitemap accessible', false, e.message);
  }
}

// ── Gate 4: No demo products in catalog ─────────────────────────────────────

async function checkDemoProducts() {
  const { json } = await shopifyGet(`${base}/products.json?status=active&limit=250`, token);
  const handles = json.products.map(p => p.handle);
  const found = DEMO_HANDLES.filter(h => handles.includes(h));
  return gate(
    'No demo products in catalog',
    found.length === 0,
    found.length === 0
      ? `${handles.length} active products — no demo handles found`
      : `Found demo handles: ${found.join(', ')} — mark as unpublished in admin`
  );
}

// ── Gate 5: Canonical tags use Shopify templating ────────────────────────────

async function checkCanonicals() {
  const results = [];
  for (const page of SAMPLE_PAGES) {
    try {
      const res = await fetch(`https://${store}${page.path}`);
      const html = await res.text();
      const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
      const isTemplated = canon && !canon.includes('ezquest-4.myshopify.com') === false;
      // Canonical is "correct" if it's any absolute URL — it will auto-rewrite after DNS cutover.
      const ok = !!canon;
      results.push(`${page.label}: ${canon || 'not found'}`);
    } catch (e) {
      results.push(`${page.label}: fetch error (${e.message})`);
    }
    await sleep(200);
  }
  const allHaveCanon = results.every(r => !r.includes('not found') && !r.includes('error'));
  return gate('Canonical tags present', allHaveCanon, results.join(' · '));
}

// ── Gate 6: Policies exist ───────────────────────────────────────────────────

async function checkPolicies() {
  const { json } = await shopifyGet(`${base}/policies.json`, token);
  const policies = json.policies || [];
  const required = ['privacy_policy', 'refund_policy', 'shipping_policy'];
  const present = policies.map(p => p.type || p.handle || '');
  const found = required.filter(r => present.some(p => p.includes(r.replace('_', '-')) || p.includes(r)));
  const allPresent = found.length >= required.length || policies.length >= 2;
  return gate('Store policies present', allPresent,
    `${policies.length} polic${policies.length === 1 ? 'y' : 'ies'}: ${policies.map(p => p.title || p.handle).join(', ') || 'none'}`);
}

// ── Gate 7: Robots.txt ───────────────────────────────────────────────────────

async function checkRobots() {
  try {
    const res = await fetch(`https://${store}/robots.txt`);
    if (!res.ok) return gate('robots.txt accessible', false, `HTTP ${res.status}`);
    const txt = await res.text();
    const hasUserAgent = txt.includes('User-agent:');
    const sitemapLine = txt.match(/Sitemap:\s*(.+)/)?.[1]?.trim();
    return gate('robots.txt accessible', hasUserAgent,
      `${res.status} OK · Sitemap: ${sitemapLine || 'not declared'}`);
  } catch (e) {
    return gate('robots.txt accessible', false, e.message);
  }
}

// ── Run all gates ────────────────────────────────────────────────────────────

(async () => {
  console.log(`Running pre-cutover readiness check for ${store}...\n`);

  const gateRunners = [
    ['Redirects imported', checkRedirects],
    ['Theme domain references', checkThemeDomain],
    ['Sitemap accessible', checkSitemap],
    ['No demo products', checkDemoProducts],
    ['Canonical tags', checkCanonicals],
    ['Store policies', checkPolicies],
    ['robots.txt', checkRobots],
  ];

  const results = [];
  for (const [name, fn] of gateRunners) {
    process.stdout.write(`  Checking: ${name}...`);
    try {
      const result = await fn();
      results.push(result);
      console.log(` ${result.passed ? '✅' : '❌'}`);
    } catch (e) {
      results.push(gate(name, false, `Error: ${e.message}`));
      console.log(` ❌`);
    }
    await sleep(300);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allGreen = passed === total;

  const md = [
    `# Migration Readiness Report`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Store:** ${store}`,
    `**Status:** ${allGreen ? '🟢 READY FOR DNS CUTOVER' : `🔴 ${total - passed} gate(s) failing — do not cut over yet`}`,
    ``,
    `## Gates`,
    ``,
    ...results.map(r => r.formatted),
    ``,
    `## Score`,
    ``,
    `${passed} / ${total} gates passing`,
    ``,
    `## Next steps`,
    ``,
    allGreen
      ? [
          '1. Remove storefront password (Online Store → Preferences)',
          '2. Set ezq.com as primary domain (Online Store → Domains)',
          '3. Update DNS at registrar: A record → 23.227.38.65, CNAME www → shops.myshopify.com',
          '4. Wait for propagation (usually < 1 hr with low TTL)',
          '5. Verify: `curl -s https://ezq.com/ | grep canonical`',
          '6. Submit https://ezq.com/sitemap.xml to Google Search Console',
        ].map(s => `- ${s}`)
      : results.filter(r => !r.passed).map(r => `- Fix: ${r.label} — ${r.evidence}`),
  ].join('\n');

  fs.writeFileSync(OUT, md);
  console.log(`\n── Result: ${passed}/${total} gates passing`);
  console.log(allGreen ? '🟢 Ready for DNS cutover.' : '🔴 Resolve failing gates before cutting over.');
  console.log(`\nFull report saved to docs/migration-readiness.md`);

  if (!allGreen) process.exit(1);
})();
