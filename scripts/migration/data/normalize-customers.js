'use strict';

// Normalizes a ShopSite customer export CSV into Shopify's import format.
// Usage: node scripts/migration/data/normalize-customers.js <input.csv>
//
// Input columns (ShopSite typical export — adjust FIELD_MAP if different):
//   first_name, last_name, email, phone, company, address1, address2,
//   city, state, zip, country, accepts_marketing, tax_exempt, notes
//
// Output:
//   docs/migration/customers-shopify.csv    — ready for Shopify import
//   docs/migration/customers-rejected.csv   — rows that failed validation

const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Usage: node normalize-customers.js <shopsite-customers-export.csv>');
  process.exit(1);
}
if (!fs.existsSync(INPUT)) {
  console.error(`File not found: ${INPUT}`);
  process.exit(1);
}

const OUT_CLEAN    = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'customers-shopify.csv');
const OUT_REJECTED = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'customers-rejected.csv');

// Map ShopSite column names → normalized internal keys.
// Adjust if the actual export has different column headers.
const FIELD_MAP = {
  'first name':        'firstName',
  'firstname':         'firstName',
  'last name':         'lastName',
  'lastname':          'lastName',
  'email':             'email',
  'email address':     'email',
  'phone':             'phone',
  'telephone':         'phone',
  'company':           'company',
  'address1':          'address1',
  'address 1':         'address1',
  'street address':    'address1',
  'address2':          'address2',
  'address 2':         'address2',
  'city':              'city',
  'state':             'state',
  'province':          'state',
  'zip':               'zip',
  'postal code':       'zip',
  'country':           'country',
  'accepts marketing': 'acceptsMarketing',
  'newsletter':        'acceptsMarketing',
  'tax exempt':        'taxExempt',
  'tax_exempt':        'taxExempt',
  'wholesale':         'wholesale',
  'b2b':               'wholesale',
  'tier':              'tier',
  'price tier':        'tier',
  'notes':             'notes',
  'note':              'notes',
};

// ISO 3166-1 alpha-2 for US states to conform province codes to Shopify spec
const US_STATE_MAP = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA',
  'Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
  'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA',
  'Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC',
  'North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA',
  'Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD','Tennessee':'TN',
  'Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY',
  'District of Columbia':'DC','Puerto Rico':'PR',
};

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const headers = rawHeaders.map(h => h.toLowerCase());
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const fields = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur);
    const row = {};
    headers.forEach((h, i) => {
      const key = FIELD_MAP[h] || h;
      row[key] = (fields[i] || '').replace(/^"|"$/g, '').trim();
    });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return phone; // leave as-is if can't normalize
}

function normalizeCountry(country) {
  if (!country) return 'US';
  const c = country.trim().toUpperCase();
  if (c === 'US' || c === 'USA' || c === 'UNITED STATES') return 'US';
  if (c === 'CA' || c === 'CANADA') return 'CA';
  if (c === 'GB' || c === 'UK' || c === 'UNITED KINGDOM') return 'GB';
  if (c.length === 2) return c;
  return country.trim();
}

function normalizeState(state, country) {
  if (!state) return '';
  const s = state.trim();
  if (s.length === 2) return s.toUpperCase();
  return US_STATE_MAP[s] || s;
}

function stripHtml(text) {
  return (text || '').replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function buildTags(row) {
  const tags = ['migrated'];
  if (row.wholesale === 'yes' || row.wholesale === '1' || row.wholesale === 'true') {
    tags.push('wholesale');
  }
  if (row.tier) tags.push(`tier-${row.tier.toLowerCase().replace(/\s+/g, '-')}`);
  if (row.taxExempt === 'yes' || row.taxExempt === '1' || row.taxExempt === 'true') {
    tags.push('tax-exempt');
  }
  return tags.join(', ');
}

const SHOPIFY_HEADERS = [
  'First Name', 'Last Name', 'Email', 'Phone',
  'Accepts Email Marketing',
  'Default Address Company', 'Default Address Address1', 'Default Address Address2',
  'Default Address City', 'Default Address Province Code', 'Default Address Country Code',
  'Default Address Zip', 'Default Address Phone',
  'Tags', 'Tax Exempt', 'Note',
];

function toCSVRow(fields) {
  return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');
}

const raw = fs.readFileSync(INPUT, 'utf8');
const rows = parseCSV(raw);
console.log(`Parsed ${rows.length} rows from ${INPUT}`);

const seen = new Set();
const clean = [];
const rejected = [];

for (const row of rows) {
  const errors = [];
  const email = (row.email || '').toLowerCase().trim();

  if (!email) errors.push('missing email');
  else if (!validateEmail(email)) errors.push(`invalid email: ${email}`);
  else if (seen.has(email)) errors.push(`duplicate email: ${email}`);

  if (errors.length) {
    rejected.push({ ...row, _errors: errors.join('; ') });
    continue;
  }

  seen.add(email);

  const country = normalizeCountry(row.country);
  const state   = normalizeState(row.state, country);
  const phone   = normalizePhone(row.phone);
  const isTaxExempt = row.taxExempt === 'yes' || row.taxExempt === '1' || row.taxExempt === 'true';

  clean.push([
    row.firstName || '',
    row.lastName  || '',
    email,
    phone,
    row.acceptsMarketing === 'yes' || row.acceptsMarketing === '1' ? 'yes' : 'no',
    row.company  || '',
    row.address1 || '',
    row.address2 || '',
    row.city     || '',
    state,
    country,
    row.zip      || '',
    phone,
    buildTags(row),
    isTaxExempt ? 'TRUE' : 'FALSE',
    stripHtml(row.notes || ''),
  ]);
}

// Write clean CSV
const cleanLines = [toCSVRow(SHOPIFY_HEADERS), ...clean.map(toCSVRow)].join('\n');
fs.writeFileSync(OUT_CLEAN, cleanLines);

// Write rejected CSV
const rejectedHeaders = [...Object.keys(rows[0] || {}), '_errors'];
const rejectedLines = [
  toCSVRow(rejectedHeaders),
  ...rejected.map(r => toCSVRow(rejectedHeaders.map(h => r[h] || ''))),
].join('\n');
fs.writeFileSync(OUT_REJECTED, rejectedLines);

console.log(`\n── Result`);
console.log(`Clean:    ${clean.length} → docs/migration/customers-shopify.csv`);
console.log(`Rejected: ${rejected.length} → docs/migration/customers-rejected.csv`);
if (rejected.length) {
  console.log('\nRejected rows:');
  rejected.forEach(r => console.log(`  ${r.email || '(no email)'}: ${r._errors}`));
}
