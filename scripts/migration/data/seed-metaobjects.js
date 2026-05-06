'use strict';

// Seeds EZQuest Support Center metaobject entries.
// Idempotent: uses metaobjectUpsert — safe to run multiple times.
// Dry-run by default. Pass --apply to write to the store.
//
// Usage:
//   node scripts/migration/data/seed-metaobjects.js            # dry-run
//   node scripts/migration/data/seed-metaobjects.js --apply    # write
//   node scripts/migration/data/seed-metaobjects.js --apply --confirm-production

const fs   = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const STORE = process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
if (!STORE || !TOKEN) {
  process.stderr.write('Missing SHOPIFY_SHOP_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN\n');
  process.exit(1);
}

const { runGuards } = require('./safety.js');

// ─── Seed data ────────────────────────────────────────────────────────────────
// Add entries here; the script will upsert all of them.
// Leave external_url blank if a file asset is used instead (set via admin).
// Products field requires product GIDs — set via admin after seeding.

const SEEDS = [
  // ── Downloads (ezquest_download) ──────────────────────────────────────────
  {
    type: 'ezquest_download',
    handle: 'download-hub-13port-qsg',
    fields: {
      title:         'Quick Start Guide',
      download_type: 'Quick Start',
      version:       '',
      platforms:     JSON.stringify(['Mac', 'Windows', 'Linux']),
      external_url:  '',
    },
  },
  {
    type: 'ezquest_download',
    handle: 'download-hub-13port-driver-win',
    fields: {
      title:         'USB Hub Driver — Windows',
      download_type: 'Driver',
      version:       '2.0.1',
      platforms:     JSON.stringify(['Windows']),
      external_url:  '',
    },
  },
  {
    type: 'ezquest_download',
    handle: 'download-hub-13port-driver-mac',
    fields: {
      title:         'USB Hub Driver — macOS',
      download_type: 'Driver',
      version:       '2.0.1',
      platforms:     JSON.stringify(['Mac']),
      external_url:  '',
    },
  },
  {
    type: 'ezquest_download',
    handle: 'download-ssd-enclosure-utility',
    fields: {
      title:         'SSD Enclosure Utility',
      download_type: 'Utility',
      version:       '1.3.0',
      platforms:     JSON.stringify(['Mac', 'Windows']),
      external_url:  '',
    },
  },

  // ── Manuals (ezquest_manual) ──────────────────────────────────────────────
  {
    type: 'ezquest_manual',
    handle: 'manual-hub-13port',
    fields: {
      title:       'USB-C Hub 13-Port — User Manual',
      manual_type: 'User Manual',
      version:     'Rev A',
      platforms:   JSON.stringify(['Mac', 'Windows', 'Linux']),
      external_url: '',
    },
  },
  {
    type: 'ezquest_manual',
    handle: 'manual-hub-8port',
    fields: {
      title:       'USB-C Hub 8-Port — User Manual',
      manual_type: 'User Manual',
      version:     'Rev A',
      platforms:   JSON.stringify(['Mac', 'Windows']),
      external_url: '',
    },
  },
  {
    type: 'ezquest_manual',
    handle: 'manual-ssd-enclosure',
    fields: {
      title:       'Magnetic USB-C NVMe SSD Enclosure — User Manual',
      manual_type: 'User Manual',
      version:     'Rev B',
      platforms:   JSON.stringify(['Mac', 'Windows']),
      external_url: '',
    },
  },
  {
    type: 'ezquest_manual',
    handle: 'manual-charger-120w',
    fields: {
      title:       'UltimatePower 120W GaN Charger — User Manual',
      manual_type: 'User Manual',
      version:     'Rev A',
      platforms:   JSON.stringify(['Universal']),
      external_url: '',
    },
  },

  // ── Firmware (ezquest_firmware) ───────────────────────────────────────────
  {
    type: 'ezquest_firmware',
    handle: 'firmware-hub-13port-win-121',
    fields: {
      title:         'Hub 13-Port Firmware Update — Windows',
      firmware_type: 'Firmware Update',
      version:       '1.2.1',
      platforms:     JSON.stringify(['Windows']),
      external_url:  '',
    },
  },
  {
    type: 'ezquest_firmware',
    handle: 'firmware-hub-13port-mac-121',
    fields: {
      title:         'Hub 13-Port Firmware Update — macOS',
      firmware_type: 'Firmware Update',
      version:       '1.2.1',
      platforms:     JSON.stringify(['Mac']),
      external_url:  '',
    },
  },
  {
    type: 'ezquest_firmware',
    handle: 'firmware-ssd-enclosure-200',
    fields: {
      title:         'NVMe SSD Enclosure Firmware Update',
      firmware_type: 'Firmware Update',
      version:       '2.0.0',
      platforms:     JSON.stringify(['Mac', 'Windows']),
      external_url:  '',
    },
  },

  // ── User Guides (ezquest_user_guide) ─────────────────────────────────────
  {
    type: 'ezquest_user_guide',
    handle: 'guide-hub-13port-mac-setup',
    fields: {
      title:      'Hub 13-Port — Mac Setup Guide',
      guide_type: 'Setup Guide',
      version:    '',
      platforms:  JSON.stringify(['Mac']),
      external_url: '',
    },
  },
  {
    type: 'ezquest_user_guide',
    handle: 'guide-hub-13port-win-setup',
    fields: {
      title:      'Hub 13-Port — Windows Setup Guide',
      guide_type: 'Setup Guide',
      version:    '',
      platforms:  JSON.stringify(['Windows']),
      external_url: '',
    },
  },
  {
    type: 'ezquest_user_guide',
    handle: 'guide-ssd-enclosure-compat',
    fields: {
      title:      'NVMe SSD Enclosure — Setup & Compatibility Guide',
      guide_type: 'Compatibility Guide',
      version:    '',
      platforms:  JSON.stringify(['Mac', 'Windows']),
      external_url: '',
    },
  },
];

// ─── GraphQL upsert ────────────────────────────────────────────────────────────

const GQL_ENDPOINT = `https://${STORE}/admin/api/2026-01/graphql.json`;

async function gql(query, variables) {
  const res = await fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.json();
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

const UPSERT_MUTATION = `
  mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
        handle
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

async function upsertEntry(entry, dryRun, log) {
  const { type, handle, fields } = entry;
  const fieldsList = Object.entries(fields)
    .filter(([, v]) => v !== '' && v != null)
    .map(([key, value]) => ({ key, value: String(value) }));

  if (dryRun) {
    console.log(`  [dry] would upsert ${type}/${handle} (${fieldsList.length} fields)`);
    log({ op: 'dry_run_would_upsert', type, handle });
    return { skipped: true };
  }

  const data = await gql(UPSERT_MUTATION, {
    handle: { type, handle },
    metaobject: { fields: fieldsList },
  });

  const result = data.metaobjectUpsert;
  if (result.userErrors?.length) {
    const errs = result.userErrors.map(e => `${e.field}: ${e.message}`).join('; ');
    log({ op: 'upsert_error', type, handle, errors: errs });
    return { error: errs };
  }

  log({ op: 'upserted', type, handle, id: result.metaobject.id });
  return { id: result.metaobject.id };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const { dryRun, log } = runGuards(STORE, 'seed-metaobjects');

  let ok = 0, errors = 0;

  for (const entry of SEEDS) {
    process.stdout.write(`  ${entry.type}/${entry.handle} ... `);
    try {
      const result = await upsertEntry(entry, dryRun, log);
      if (result.error) {
        console.log(`ERROR: ${result.error}`);
        errors++;
      } else {
        console.log(result.skipped ? 'skipped (dry)' : `ok (${result.id})`);
        ok++;
      }
    } catch (err) {
      console.log(`THROW: ${err.message}`);
      log({ op: 'exception', type: entry.type, handle: entry.handle, error: err.message });
      errors++;
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Done: ${ok} ok, ${errors} errors`);
  if (errors > 0) process.exit(1);
})();
