'use strict';

// Generates the Phase 7 reconciliation report.
// Run after all import phases complete, before lifting the DNS cutover hold.
//
// Usage: node scripts/migration/data/reconciliation-report.js

const fs   = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, sleep } = require('../lib');

const { base, token } = loadEnv();

const CUSTOMER_CSV = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'customers-shopify.csv');
const ORDERS_JSON  = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'orders-shopify.json');
const GC_RECON     = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'gift-card-reconciliation.txt');
const GC_CSV       = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'gift-cards-reissued.csv');
const OUT          = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'reconciliation.md');

function parseAmount(str) {
  const n = parseFloat(String(str).replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function csvRowCount(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8').trim().split(/\r?\n/).length - 1; // minus header
}

(async () => {
  console.log('Generating reconciliation report...\n');

  const sections = [];
  let allGreen = true;

  // ── Customers ──────────────────────────────────────────────────────────────
  const legacyCustomerCount = csvRowCount(CUSTOMER_CSV);
  let shopifyMigratedCount = 0;

  if (legacyCustomerCount !== null) {
    let url = `${base}/customers.json?tag=migrated&limit=250&fields=id`;
    while (url) {
      const { json, link } = await shopifyGet(url, token);
      shopifyMigratedCount += (json.customers || []).length;
      const next = link?.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
      if (next) await sleep(250);
    }
    const customerDiff = legacyCustomerCount - shopifyMigratedCount;
    const customerOk = Math.abs(customerDiff) === 0;
    if (!customerOk) allGreen = false;
    sections.push([
      `## Customers`,
      ``,
      `| | Count |`,
      `|---|---|`,
      `| Legacy export rows | ${legacyCustomerCount} |`,
      `| Shopify (tagged "migrated") | ${shopifyMigratedCount} |`,
      `| Difference | ${customerDiff} |`,
      ``,
      customerOk ? `✅ Reconciled` : `❌ Diff ${customerDiff} — check customers-rejected.csv for rows excluded from import`,
    ].join('\n'));
  } else {
    sections.push('## Customers\n\n⚠ customers-shopify.csv not found — run normalize-customers.js');
  }

  await sleep(300);

  // ── Orders ─────────────────────────────────────────────────────────────────
  if (fs.existsSync(ORDERS_JSON)) {
    const legacyOrders = JSON.parse(fs.readFileSync(ORDERS_JSON, 'utf8'));
    const legacyOrderCount = legacyOrders.length;
    const legacyRevenue = legacyOrders.reduce((s, o) => {
      const t = o.transactions?.[0]?.amount;
      return s + parseAmount(t);
    }, 0);

    let shopifyOrderCount = 0, shopifyRevenue = 0;
    let url = `${base}/orders.json?status=any&tag=migrated&limit=250&fields=id,total_price`;
    while (url) {
      const { json, link } = await shopifyGet(url, token);
      shopifyOrderCount += (json.orders || []).length;
      shopifyRevenue += (json.orders || []).reduce((s, o) => s + parseAmount(o.total_price), 0);
      const next = link?.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
      if (next) await sleep(250);
    }

    const orderCountDiff   = legacyOrderCount - shopifyOrderCount;
    const revenueDiff      = Math.abs(legacyRevenue - shopifyRevenue);
    const ordersOk = orderCountDiff === 0 && revenueDiff < 1.00;
    if (!ordersOk) allGreen = false;

    sections.push([
      `## Orders`,
      ``,
      `| | Count | Revenue |`,
      `|---|---|---|`,
      `| Legacy export | ${legacyOrderCount} | $${legacyRevenue.toFixed(2)} |`,
      `| Shopify (tagged "migrated") | ${shopifyOrderCount} | $${shopifyRevenue.toFixed(2)} |`,
      `| Difference | ${orderCountDiff} | $${revenueDiff.toFixed(2)} |`,
      ``,
      ordersOk ? `✅ Reconciled (revenue within $1.00 tolerance)` : `❌ Discrepancy — investigate before lifting freeze`,
    ].join('\n'));
  } else {
    sections.push('## Orders\n\n⚠ orders-shopify.json not found — run normalize-orders.js');
  }

  await sleep(300);

  // ── B2B / Wholesale ────────────────────────────────────────────────────────
  let wholesaleCount = 0;
  let url = `${base}/customers.json?tag=wholesale&limit=250&fields=id`;
  while (url) {
    const { json, link } = await shopifyGet(url, token);
    wholesaleCount += (json.customers || []).length;
    const next = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = next ? next[1] : null;
    if (next) await sleep(250);
  }
  sections.push([
    `## B2B / Wholesale`,
    ``,
    `| | Count |`,
    `|---|---|`,
    `| Customers tagged "wholesale" | ${wholesaleCount} |`,
    ``,
    `⚠ Pricing tier confirmation must be verified manually with client before lifting freeze.`,
  ].join('\n'));

  // ── Gift Cards ─────────────────────────────────────────────────────────────
  if (fs.existsSync(GC_RECON)) {
    const reconText = fs.readFileSync(GC_RECON, 'utf8');
    const gcOk = reconText.includes('✓ RECONCILED');
    if (!gcOk) allGreen = false;
    sections.push([
      `## Gift Cards`,
      ``,
      `From gift-card-reconciliation.txt:`,
      ``,
      '```',
      reconText.trim(),
      '```',
      ``,
      gcOk ? `✅ Reconciled — $0.00 discrepancy` : `❌ Discrepancy — DO NOT send gift card emails until resolved`,
    ].join('\n'));
  } else {
    sections.push('## Gift Cards\n\n⚠ gift-card-reconciliation.txt not found — run reissue-gift-cards.js or N/A if no gift cards');
  }

  // ── Write report ───────────────────────────────────────────────────────────
  const report = [
    `# Migration Reconciliation Report`,
    ``,
    `**Generated:** ${new Date().toISOString()}`,
    `**Status:** ${allGreen ? '🟢 All sections reconciled — ready to lift freeze' : '🔴 Discrepancies found — resolve before lifting freeze'}`,
    ``,
    `---`,
    ``,
    sections.join('\n\n---\n\n'),
    ``,
    `---`,
    ``,
    `## Sign-off`,
    ``,
    `- [ ] Reviewed by: __________________ Date: __________`,
    `- [ ] Client approved: ______________ Date: __________`,
    `- [ ] Accountant approved (gift cards): ____________ Date: __________`,
    ``,
    `## Next steps after sign-off`,
    ``,
    `1. Lift theme + DNS freeze (update docs/theme-freeze.md status to LIFTED)`,
    `2. Run Phase 6 invites in order: Batch 1 → wait 1 hr → Batch 2 → wait 1 hr → Batch 3`,
    `3. Update docs/migration-readiness.md data gates to ✅`,
    `4. Monitor GSC Coverage report daily for 7 days`,
    `5. Schedule 30-day legacy ShopSite decommission review`,
  ].join('\n');

  fs.writeFileSync(OUT, report);

  console.log(allGreen ? '🟢 All sections reconciled.' : '🔴 Discrepancies found — see report.');
  console.log(`Report saved to docs/migration/reconciliation.md`);
  if (!allGreen) process.exit(1);
})();
