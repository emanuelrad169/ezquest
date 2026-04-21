#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const API_VERSION = '2024-01';
const DELAY_MS = 300;

const METAFIELD_DEFINITIONS = [
  {
    name: 'Spec rows',
    namespace: 'ezquest',
    key: 'spec_rows',
    type: 'json',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Highlights',
    namespace: 'ezquest',
    key: 'highlights',
    type: 'list.single_line_text_field',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Amazon URL',
    namespace: 'ezquest',
    key: 'amazon_url',
    type: 'url',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Rating',
    namespace: 'reviews',
    key: 'rating',
    type: 'rating',
    ownerType: 'PRODUCT',
  },
  {
    name: 'Rating count',
    namespace: 'reviews',
    key: 'rating_count',
    type: 'number_integer',
    ownerType: 'PRODUCT',
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

async function getDefinition(definition) {
  const query = `
    query GetMetafieldDefinitions($ownerType: MetafieldOwnerType!, $namespace: String!) {
      metafieldDefinitions(first: 250, ownerType: $ownerType, namespace: $namespace) {
        nodes {
          id
          namespace
          key
          type {
            name
          }
        }
      }
    }
  `;
  const data = await graphql(query, {
    ownerType: definition.ownerType,
    namespace: definition.namespace,
  });
  return data.metafieldDefinitions.nodes.find((node) => node.key === definition.key);
}

async function createDefinition(definition) {
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          namespace
          key
          type {
            name
          }
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
    definition: {
      name: definition.name,
      namespace: definition.namespace,
      key: definition.key,
      type: definition.type,
      ownerType: definition.ownerType,
    },
  });

  const result = data.metafieldDefinitionCreate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }
  return result.createdDefinition;
}

async function main() {
  for (const definition of METAFIELD_DEFINITIONS) {
    const label = `${definition.ownerType}.${definition.namespace}.${definition.key}`;

    try {
      const existing = await getDefinition(definition);
      if (existing) {
        console.log(`SKIP exists: ${label}`);
        continue;
      }

      await createDefinition(definition);
      console.log(`CREATED: ${label}`);
    } catch (error) {
      console.error(`ERROR: ${label}`);
      console.error(error.message);
    }
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('ERROR: setup-product-metafields failed');
  console.error(error.message);
  process.exitCode = 1;
});
