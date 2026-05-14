'use strict';

// Imports normalized customers-shopify.csv into Shopify.
// Idempotent: skips any email already in Shopify.
// Does NOT send welcome or password emails — those fire in Phase 6 post-cutover.
//
// Usage: node scripts/migration/data/import-customers.js [--apply] [--confirm-production]
//   --apply               make real API calls (default: dry-run)
//   --confirm-production  required when SHOPIFY_SHOP_DOMAIN is the production store

const fs   = require('fs');
const path = require('path');
const { loadEnv, shopifyGet, shopifyPost, sleep } = require('../lib');
const { runGuards } = require('./safety');

const { base, token, store } = loadEnv();
const { dryRun, log } = runGuards(store, 'import-customers');

const INPUT = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'customers-shopify.csv');
const REPORT_DIR = path.join(__dirname, '..', '..', '..', 'docs', 'migration');

if (!fs.existsSync(INPUT)) {
  console.error(`Missing input: ${INPUT}`);
  console.error('Run normalize-customers.js first.');
  process.exit(1);
}

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
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
  }).filter(r => r['Email']);
}

async function emailExists(email) {
  const { json } = await shopifyGet(
    `${base}/customers/search.json?query=${encodeURIComponent('email:' + email)}&fields=id,email&limit=1`,
    token
  );
  return json.customers?.length > 0 ? json.customers[0].id : null;
}

(async () => {
  const rows = parseCSV(fs.readFileSync(INPUT, 'utf8'));
  console.log(`Loaded ${rows.length} customers from ${INPUT}`);

  let created = 0, skipped = 0, failed = 0;
  const failures = [];

  for (const row of rows) {
    const email = row['Email'].toLowerCase();

    // Idempotency check — skip in dry-run (no writes, no need to query)
    if (!dryRun) {
      const existingId = await emailExists(email);
      if (existingId) {
        skipped++;
        log({ action: 'skip', email, reason: 'already_exists', shopifyId: existingId });
        await sleep(250);
        continue;
      }
    }

    const isTaxExempt = row['Tax Exempt'] === 'TRUE';
    const acceptsMarketing = row['Accepts Email Marketing'] === 'yes';

    const payload = {
      customer: {
        first_name: row['First Name'],
        last_name:  row['Last Name'],
        email,
        phone:      row['Phone']  || undefined,
        verified_email: true,
        send_email_invite: false,
        send_email_welcome: false,
        tax_exempt: isTaxExempt,
        tags: row['Tags'],
        note: row['Note'] || undefined,
        addresses: row['Default Address Address1'] ? [{
          company:      row['Default Address Company'],
          address1:     row['Default Address Address1'],
          address2:     row['Default Address Address2'],
          city:         row['Default Address City'],
          province_code: row['Default Address Province Code'],
          country_code: row['Default Address Country Code'],
          zip:          row['Default Address Zip'],
          phone:        row['Default Address Phone'] || undefined,
          default:      true,
        }] : undefined,
        email_marketing_consent: acceptsMarketing ? {
          state: 'subscribed',
          opt_in_level: 'single_opt_in',
        } : {
          state: 'not_subscribed',
        },
      },
    };

    if (dryRun) {
      log({ action: 'dry_run_would_create', email });
      console.log(`  [DRY RUN] Would create: ${email}`);
      created++;
      await sleep(50);
      continue;
    }

    const { ok, status, json } = await shopifyPost(`${base}/customers.json`, token, payload);
    log({ action: ok ? 'create' : 'fail', email, status, shopifyId: json?.customer?.id, error: ok ? undefined : JSON.stringify(json?.errors) });

    if (ok) {
      created++;
      if (created % 25 === 0) console.log(`  Created ${created}...`);
    } else {
      failed++;
      const errMsg = json?.errors ? JSON.stringify(json.errors) : `HTTP ${status}`;
      failures.push({ email, error: errMsg });
      console.error(`  ✗ ${email}: ${errMsg}`);
    }

    await sleep(250);
  }

  const date = new Date().toISOString().slice(0, 10);
  const report = [
    `# Customer Import Report — ${date}`,
    ``,
    `**Total in CSV:** ${rows.length}`,
    `**Created:** ${created}`,
    `**Skipped (already existed):** ${skipped}`,
    `**Failed:** ${failed}`,
    ``,
    ...(failures.length ? [
      `## Failures`,
      ``,
      ...failures.map(f => `- \`${f.email}\`: ${f.error}`),
    ] : ['## Result: clean import, 0 failures']),
    ``,
    `## Next step`,
    ``,
    `Phase 6 (post-cutover): send password-set invites via 06-send-invites.js`,
    `Do NOT send invites until ezq.com DNS cutover is confirmed live.`,
  ].join('\n');

  const reportPath = path.join(REPORT_DIR, `customer-import-${date}.md`);
  fs.writeFileSync(reportPath, report);

  console.log(`\n── Result`);
  console.log(`Created:  ${created}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Log:      docs/migration/migration-log.jsonl`);
  console.log(`Report:   docs/migration/customer-import-${date}.md`);

  if (failed > 0) process.exit(1);
})();
