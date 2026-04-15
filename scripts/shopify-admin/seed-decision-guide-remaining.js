#!/usr/bin/env node
// Seeds the 3 missing decision guide entries (4–6) via GraphQL.
// Entries 1–3 already exist: balanced-everyday-setup, portable-travel-setup, desk-ready-workstation

const fs = require('fs');
const path = require('path');

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const contents = fs.readFileSync(filepath, 'utf8');
  const result = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const env = {
  ...parseEnvFile(path.join(process.cwd(), '.env.local')),
  ...process.env
};

const STORE = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VERSION = env.SHOPIFY_ADMIN_API_VERSION;
const GQL_URL = `https://${STORE}/admin/api/${VERSION}/graphql.json`;
const STORE_URL = `https://${STORE}`;

const headers = {
  'X-Shopify-Access-Token': TOKEN,
  'Content-Type': 'application/json'
};

const CREATE_MUTATION = `
  mutation MetaobjectCreate($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
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

const entries = [
  {
    handle: 'charging-and-power-layer',
    fields: [
      { key: 'title', value: 'Charging and power layer' },
      { key: 'role_label', value: 'Power first' },
      { key: 'summary', value: 'Best for setups that need reliable charging before expanding ports. Start here when your MacBook or iPad needs a dependable power source.' },
      { key: 'primary_label', value: 'View chargers' },
      { key: 'primary_url', value: `${STORE_URL}/collections/chargers-power` },
      { key: 'secondary_label', value: 'Compare options' },
      { key: 'secondary_url', value: `${STORE_URL}/pages/compare` },
      { key: 'workflows', value: JSON.stringify(['power-delivery']) },
      { key: 'sort_order', value: '40' }
    ]
  },
  {
    handle: 'cables-and-accessories',
    fields: [
      { key: 'title', value: 'Cables and accessories' },
      { key: 'role_label', value: 'Finish the setup' },
      { key: 'summary', value: 'Best for completing your cable path or adding the last adapter to a nearly finished desk. HDMI, USB-C, DisplayPort, and audio cables.' },
      { key: 'primary_label', value: 'View accessories' },
      { key: 'primary_url', value: `${STORE_URL}/collections/accessories` },
      { key: 'secondary_label', value: 'Browse all cables' },
      { key: 'secondary_url', value: `${STORE_URL}/collections/accessories` },
      { key: 'workflows', value: JSON.stringify(['cable-completion']) },
      { key: 'sort_order', value: '50' }
    ]
  },
  {
    handle: 'not-sure-yet',
    fields: [
      { key: 'title', value: 'Not sure yet?' },
      { key: 'role_label', value: 'Get help' },
      { key: 'summary', value: 'If the setup question is still open, start with the FAQ or compatibility page. Support responds within 1 business day.' },
      { key: 'primary_label', value: 'Read the FAQ' },
      { key: 'primary_url', value: `${STORE_URL}/pages/faq` },
      { key: 'secondary_label', value: 'Contact support' },
      { key: 'secondary_url', value: `${STORE_URL}/pages/contact` },
      { key: 'workflows', value: JSON.stringify(['support-first']) },
      { key: 'sort_order', value: '60' }
    ]
  }
];

async function gql(query, variables) {
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function createEntry(entry) {
  const data = await gql(CREATE_MUTATION, {
    metaobject: {
      type: 'ezquest_decision_guide_entry',
      handle: entry.handle,
      fields: entry.fields
    }
  });

  const result = data.data?.metaobjectCreate;
  const errors = result?.userErrors || [];

  if (errors.length > 0) {
    const alreadyTaken = errors.some(e => e.code === 'TAKEN' || e.message?.toLowerCase().includes('taken'));
    if (alreadyTaken) {
      console.log(`SKIP (exists): ${entry.handle}`);
    } else {
      console.log(`ERROR: ${entry.handle}`, JSON.stringify(errors));
    }
  } else {
    const obj = result?.metaobject;
    const title = entry.fields.find(f => f.key === 'title')?.value;
    console.log(`CREATED: "${title}" | handle: ${obj?.handle} | ID: ${obj?.id}`);
  }
}

(async () => {
  console.log('Seeding decision guide entries 4–6...\n');
  for (const entry of entries) {
    await createEntry(entry);
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nDone.');
})();
