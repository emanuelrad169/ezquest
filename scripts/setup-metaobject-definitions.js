#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const API_VERSION = '2024-01';
const DELAY_MS = 300;

const METAOBJECT_DEFINITIONS = [
  {
    type: 'ezquest_decision_guide_entry',
    name: 'EZQuest decision guide entry',
    fields: [
      { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
      { key: 'kicker', name: 'Kicker', type: 'single_line_text_field' },
      { key: 'description', name: 'Description', type: 'multi_line_text_field' },
      { key: 'shop_url', name: 'Shop URL', type: 'url' },
      { key: 'compare_url', name: 'Compare URL', type: 'url' },
    ],
  },
  {
    type: 'ezquest_comparison_group',
    name: 'EZQuest comparison group',
    fields: [
      { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
      { key: 'products', name: 'Products', type: 'list.product_reference' },
      { key: 'recommended', name: 'Recommended product', type: 'product_reference' },
    ],
  },
  {
    type: 'ezquest_compatibility_entry',
    name: 'EZQuest compatibility entry',
    fields: [
      { key: 'product', name: 'Product', type: 'product_reference', required: true },
      { key: 'device_brand', name: 'Device brand', type: 'single_line_text_field' },
      { key: 'device_model', name: 'Device model', type: 'single_line_text_field' },
      { key: 'os', name: 'OS', type: 'single_line_text_field' },
      { key: 'port_type', name: 'Port type', type: 'single_line_text_field' },
      { key: 'notes', name: 'Notes', type: 'multi_line_text_field' },
    ],
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

async function getDefinition(type) {
  const query = `
    query GetMetaobjectDefinition($type: String!) {
      metaobjectDefinitionByType(type: $type) {
        id
        type
      }
    }
  `;
  const data = await graphql(query, { type });
  return data.metaobjectDefinitionByType;
}

async function createDefinition(definition) {
  const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
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

  const payload = {
    type: definition.type,
    name: definition.name,
    access: { storefront: 'PUBLIC_READ' },
    fieldDefinitions: definition.fields.map((field) => ({
      key: field.key,
      name: field.name,
      type: field.type,
      required: Boolean(field.required),
    })),
  };

  const data = await graphql(mutation, { definition: payload });
  const result = data.metaobjectDefinitionCreate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }
  return result.metaobjectDefinition;
}

async function main() {
  for (const definition of METAOBJECT_DEFINITIONS) {
    try {
      const existing = await getDefinition(definition.type);
      if (existing) {
        console.log(`SKIP exists: ${definition.type}`);
        continue;
      }

      const created = await createDefinition(definition);
      console.log(`CREATED: ${created.type}`);
    } catch (error) {
      console.error(`ERROR: ${definition.type}`);
      console.error(error.message);
    }
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('ERROR: setup-metaobject-definitions failed');
  console.error(error.message);
  process.exitCode = 1;
});
