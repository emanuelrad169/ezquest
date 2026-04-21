#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const API_VERSION = '2024-01';
const DELAY_MS = 300;
const METAOBJECT_TYPE = 'ezquest_decision_guide_entry';

const ENTRIES = [
  {
    title: 'Everyday hybrid desk',
    kicker: 'Most balanced',
    description: 'Best for daily desks that need ports, power, and display.',
    shop_url: '/collections/hubs-adapters',
    compare_url: '/pages/compare',
  },
  {
    title: 'Mobile and travel-first',
    kicker: 'Most portable',
    description: 'Best for hotel desks, meetings, and lightweight carry.',
    shop_url: '/collections/hubs-adapters',
    compare_url: '/pages/compare',
  },
  {
    title: 'Permanent workstation',
    kicker: 'Most desk-ready',
    description: 'Best for desks needing displays, Ethernet, peripherals.',
    shop_url: '/collections/docking-stations',
    compare_url: '/pages/compare',
  },
  {
    title: 'Charging and power layer',
    kicker: 'Power first',
    description: 'Best for setups that need reliable power before ports.',
    shop_url: '/collections/chargers-power',
    compare_url: '/pages/compare',
  },
  {
    title: 'Cables and accessories',
    kicker: 'Finish the setup',
    description: 'Best for tightening cable paths or completing the last step.',
    shop_url: '/collections/accessories',
    compare_url: '/pages/support',
  },
  {
    title: 'Not sure yet?',
    kicker: 'Get help',
    description: 'Talk to EZQuest support before you decide.',
    shop_url: '/pages/contact',
    compare_url: '/pages/faq',
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEnv() {
  const store = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!store) throw new Error('Missing SHOPIFY_STORE in .env');
  if (!token) throw new Error('Missing SHOPIFY_ADMIN_TOKEN in .env');

  return {
    store: store.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    token,
  };
}

function handleize(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function graphql(query, variables = {}) {
  const { store, token } = getEnv();
  const res = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  await sleep(DELAY_MS);

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }

  return json.data;
}

async function getMetaobjectByHandle(type, handle) {
  const query = `
    query GetMetaobjectByHandle($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
        handle
        type
      }
    }
  `;
  const data = await graphql(query, { handle: { type, handle } });
  return data.metaobjectByHandle;
}

async function createMetaobject(entry) {
  const mutation = `
    mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
          type
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const data = await graphql(mutation, {
    metaobject: {
      type: METAOBJECT_TYPE,
      handle: handleize(entry.title),
      fields: [
        { key: 'title', value: entry.title },
        { key: 'kicker', value: entry.kicker },
        { key: 'description', value: entry.description },
        { key: 'shop_url', value: entry.shop_url },
        { key: 'compare_url', value: entry.compare_url },
      ],
    },
  });

  const result = data.metaobjectCreate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }
  return result.metaobject;
}

async function main() {
  for (const entry of ENTRIES) {
    const handle = handleize(entry.title);

    try {
      const existing = await getMetaobjectByHandle(METAOBJECT_TYPE, handle);
      if (existing) {
        console.log(`SKIP exists: ${entry.title}`);
        continue;
      }

      const created = await createMetaobject(entry);
      console.log(`CREATED: ${entry.title} (${created.handle})`);
    } catch (error) {
      console.error(`ERROR: ${entry.title}`);
      console.error(error.message);
    }
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('ERROR: seed-decision-guide failed');
  console.error(error.message);
  process.exitCode = 1;
});
