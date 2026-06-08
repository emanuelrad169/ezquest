'use strict';

// Reissues legacy gift card balances as new Shopify gift cards.
// TREAT OUTPUT AS CONFIDENTIAL — gift card codes are equivalent to cash.
//
// Pre-conditions:
//   - Client accountant has signed off on reissuance (not escheatment)
//   - Legacy codes have been voided in the legacy system BEFORE running this
//   - Input CSV has columns: legacy_code, holder_email, remaining_balance,
//     original_value, expires_at (YYYY-MM-DD or blank)
//
// Usage: node scripts/migration/data/reissue-gift-cards.js <input.csv> [--apply] [--confirm-production]
//   --apply               make real API calls (default: dry-run)
//   --confirm-production  required when SHOPIFY_SHOP_DOMAIN is the production store
//
// Output:
//   docs/migration/gift-cards-reissued.csv  — new codes + holder emails (CONFIDENTIAL)
//   docs/migration/gift-card-reconciliation.txt — balance reconciliation

const fs   = require('fs');
const path = require('path');
const { loadEnv, shopifyPost, sleep } = require('../lib');
const { runGuards } = require('./safety');

const { base, token, store } = loadEnv();
const { dryRun, log } = runGuards(store, 'reissue-gift-cards');

const INPUT = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!INPUT) {
  console.error('Usage: node reissue-gift-cards.js <gift-cards-export.csv> [--apply] [--confirm-production]');
  process.exit(1);
}
if (!fs.existsSync(INPUT)) {
  console.error(`File not found: ${INPUT}`);
  process.exit(1);
}

const OUT_CSV   = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'gift-cards-reissued.csv');
const OUT_RECON = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'gift-card-reconciliation.txt');

// Add .gitignore entry for the output file if not already present
const GITIGNORE = path.join(__dirname, '..', '..', '..', '.gitignore');
const SENSITIVE_ENTRY = 'docs/migration/gift-cards-reissued.csv';
if (fs.existsSync(GITIGNORE)) {
  const gi = fs.readFileSync(GITIGNORE, 'utf8');
  if (!gi.includes(SENSITIVE_ENTRY)) {
    fs.appendFileSync(GITIGNORE, `\n# Gift card codes — treat as cash, never commit\n${SENSITIVE_ENTRY}\n`);
    console.log(`Added ${SENSITIVE_ENTRY} to .gitignore`);
  }
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase().replace(/ /g, '_'));
  return lines.slice(1).map(line => {
    const fields = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur);
    const row = {};
    headers.forEach((h, i) => { row[h] = (fields[i] || '').replace(/^"|"$/g, '').trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

function parseBalance(str) {
  const n = parseFloat(String(str).replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

(async () => {
  const cards = parseCSV(fs.readFileSync(INPUT, 'utf8'));
  console.log(`Loaded ${cards.length} gift cards from ${INPUT}`);

  const legacyTotal = cards.reduce((s, c) => s + parseBalance(c.remaining_balance || c.balance || 0), 0);
  console.log(`Legacy outstanding balance: $${legacyTotal.toFixed(2)}`);
  console.log('Confirm with client accountant before proceeding.\n');

  let reissued = 0, failed = 0;
  let shopifyTotal = 0;
  const results = [];
  const failures = [];

  for (const card of cards) {
    const balance = parseBalance(card.remaining_balance || card.balance || 0);
    const legacyCode = card.legacy_code || card.code || '';
    const holderEmail = (card.holder_email || card.email || '').toLowerCase().trim();

    if (balance <= 0) {
      console.log(`  Skipping ${legacyCode}: zero balance`);
      continue;
    }

    const payload = {
      gift_card: {
        initial_value: balance.toFixed(2),
        code: null, // let Shopify generate — avoids legacy code format conflicts
        note: `Reissued from legacy code ${legacyCode} on ${new Date().toISOString().slice(0, 10)}. Holder: ${holderEmail}`,
        ...(card.expires_at ? { expires_on: card.expires_at } : {}),
      },
    };

    if (dryRun) {
      log({ action: 'dry_run_would_reissue', legacyCode, holderEmail, balance });
      console.log(`  [DRY RUN] Would reissue $${balance.toFixed(2)} for ${holderEmail} (legacy: ${legacyCode})`);
      reissued++;
      shopifyTotal += balance;
      results.push({ legacyCode, holderEmail, balance: balance.toFixed(2), newCode: '[DRY_RUN]', shopifyId: '[DRY_RUN]', expiresAt: card.expires_at || '' });
      await sleep(50);
      continue;
    }

    const { ok, status, json } = await shopifyPost(`${base}/gift_cards.json`, token, payload);
    log({ action: ok ? 'gift_card_reissue' : 'gift_card_fail', legacyCode, holderEmail, balance, status, shopifyId: json?.gift_card?.id, error: ok ? undefined : JSON.stringify(json?.errors) });

    if (ok) {
      const newCode = json.gift_card.code;
      const shopifyId = json.gift_card.id;
      reissued++;
      shopifyTotal += balance;
      results.push({
        legacyCode, holderEmail, balance: balance.toFixed(2), newCode, shopifyId, expiresAt: card.expires_at || '',
      });
    } else {
      failed++;
      const errMsg = json?.errors ? JSON.stringify(json.errors) : `HTTP ${status}`;
      failures.push({ legacyCode, holderEmail, balance, error: errMsg });
      console.error(`  ✗ ${legacyCode} (${holderEmail}): ${errMsg}`);
    }

    await sleep(500);
  }

  // Write reissued cards CSV (confidential)
  const csvLines = [
    '"Legacy Code","Holder Email","Balance","New Shopify Code","Shopify ID","Expires At"',
    ...results.map(r =>
      `"${r.legacyCode}","${r.holderEmail}","${r.balance}","${r.newCode}","${r.shopifyId}","${r.expiresAt}"`),
  ];
  fs.writeFileSync(OUT_CSV, csvLines.join('\n'));

  // Reconciliation
  const diff = Math.abs(shopifyTotal - legacyTotal);
  const reconciled = diff < 0.01;
  const recon = [
    `Gift Card Reconciliation — ${new Date().toISOString()}`,
    ``,
    `Legacy outstanding balance: $${legacyTotal.toFixed(2)}`,
    `Shopify reissued balance:   $${shopifyTotal.toFixed(2)}`,
    `Difference:                 $${diff.toFixed(2)}`,
    ``,
    reconciled
      ? `✓ RECONCILED — balances match within $0.01`
      : `✗ DISCREPANCY — investigate before sending gift card emails to holders`,
    ``,
    `Cards reissued: ${reissued}`,
    `Cards failed:   ${failed}`,
    ...(failures.length ? [
      ``,
      `Failures:`,
      ...failures.map(f => `  ${f.legacyCode} (${f.holderEmail}) $${f.balance}: ${f.error}`),
    ] : []),
  ].join('\n');
  fs.writeFileSync(OUT_RECON, recon);

  console.log(`\n── Result`);
  console.log(`Reissued: ${reissued} | Failed: ${failed}`);
  console.log(`Legacy total: $${legacyTotal.toFixed(2)} | Shopify total: $${shopifyTotal.toFixed(2)}`);
  console.log(reconciled ? `✓ Reconciled` : `✗ DISCREPANCY $${diff.toFixed(2)} — do not send emails until resolved`);
  console.log(`\n⚠  docs/migration/gift-cards-reissued.csv contains live codes — treat as cash`);
  console.log(`   Do NOT email holders until DNS cutover is complete and ezq.com is live.`);

  if (failed > 0 || !reconciled) process.exit(1);
})();
