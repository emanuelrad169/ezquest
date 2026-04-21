#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const API_VERSION = '2024-01';
const DELAY_MS = 350;
const SPEC_ROW_TYPE = 'ezquest_spec_row';

const STORE = process.env.SHOPIFY_STORE || process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!STORE) {
  console.error('ERROR: Missing SHOPIFY_STORE or SHOPIFY_SHOP_DOMAIN');
  process.exit(1);
}

if (!TOKEN) {
  console.error('ERROR: Missing SHOPIFY_ADMIN_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN');
  process.exit(1);
}

const NORMALIZED_STORE = STORE.replace(/^https?:\/\//, '').replace(/\/$/, '');
const GRAPHQL_URL = 'https://' + NORMALIZED_STORE + '/admin/api/' + API_VERSION + '/graphql.json';

const SPEC_SETS = {
  hubsAndDocks: [
    { label: 'Interface', value: 'USB-C' },
    { label: 'USB-A 3.0 ports', value: '4× 5Gbps' },
    { label: 'Display output', value: '4K@30Hz via HDMI' },
    { label: 'Power delivery', value: 'Up to 100W pass-through' },
    { label: 'Ethernet', value: '1× Gigabit RJ45' },
    { label: 'Card reader', value: 'SD + microSD (UHS-I)' },
    { label: 'Compatibility', value: 'macOS, Windows, iPadOS' },
    { label: 'Driver required', value: 'None on macOS/Windows 11' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  chargers: [
    { label: 'Total wattage', value: 'See product title' },
    { label: 'Technology', value: 'GaN II' },
    { label: 'USB-C ports', value: '2× USB-C PD' },
    { label: 'USB-A ports', value: '1× USB-A' },
    { label: 'Input', value: '100-240V AC (universal)' },
    { label: 'Compatibility', value: 'All USB-C devices' },
    { label: 'Certifications', value: 'UL, FCC, CE' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  cables: [
    { label: 'Connector A', value: 'USB-C' },
    { label: 'Connector B', value: 'See product title' },
    { label: 'Data transfer', value: 'Up to 10Gbps' },
    { label: 'Power delivery', value: 'Up to 100W' },
    { label: 'Video', value: '4K@60Hz (USB-C to USB-C)' },
    { label: 'Jacket', value: 'DuraGuard braided nylon' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  adaptersAndAccessories: [
    { label: 'Interface', value: 'USB-C' },
    { label: 'Output', value: 'See product title' },
    { label: 'Transfer speed', value: 'Up to 10Gbps' },
    { label: 'Compatibility', value: 'macOS, Windows, iPadOS' },
    { label: 'Driver required', value: 'None' },
    { label: 'Warranty', value: '2 years limited' },
  ],
  default: [
    { label: 'Compatibility', value: 'macOS, Windows' },
    { label: 'Warranty', value: '2 years limited' },
  ],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function handleize(value) {
  return String(value)
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/@/g, ' at ')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function getRequestedHandle() {
  return process.argv.slice(2).find((arg) => !arg.startsWith('-')) || '';
}

function getSpecsForHandle(handle) {
  if (handle.includes('hub') || handle.includes('dock')) {
    return SPEC_SETS.hubsAndDocks;
  }

  if (handle.includes('charger') || handle.includes('gan')) {
    return SPEC_SETS.chargers;
  }

  if (handle.includes('cable')) {
    return SPEC_SETS.cables;
  }

  if (handle.includes('adapter') || handle.includes('enclosure') || handle.includes('reader')) {
    return SPEC_SETS.adaptersAndAccessories;
  }

  return SPEC_SETS.default;
}

async function graphql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  await delay(DELAY_MS);

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }

  return json.data;
}

async function listProducts() {
  const query = `
    query ListProducts($cursor: String) {
      products(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          handle
          title
          productType
        }
      }
    }
  `;

  const products = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await graphql(query, { cursor });
    const connection = data.products;
    products.push(...connection.nodes);
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return products;
}

async function getMetaobjectByHandle(handle) {
  const query = `
    query GetSpecRow($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) {
        id
        handle
      }
    }
  `;

  const data = await graphql(query, { handle: { type: SPEC_ROW_TYPE, handle } });
  return data.metaobjectByHandle;
}

async function createSpecRow(handle, spec, sortOrder) {
  const mutation = `
    mutation CreateSpecRow($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await graphql(mutation, {
    metaobject: {
      type: SPEC_ROW_TYPE,
      handle,
      fields: [
        { key: 'label', value: spec.label },
        { key: 'spec_value', value: spec.value },
        { key: 'sort_order', value: String(sortOrder) },
      ],
    },
  });

  const result = data.metaobjectCreate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }

  return result.metaobject;
}

async function updateSpecRow(id, spec, sortOrder) {
  const mutation = `
    mutation UpdateSpecRow($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await graphql(mutation, {
    id,
    metaobject: {
      fields: [
        { key: 'label', value: spec.label },
        { key: 'spec_value', value: spec.value },
        { key: 'sort_order', value: String(sortOrder) },
      ],
    },
  });

  const result = data.metaobjectUpdate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }

  return result.metaobject;
}

async function ensureSpecRow(productHandle, spec, index) {
  const sortOrder = (index + 1) * 10;
  const handle = handleize(productHandle + '-spec-' + sortOrder + '-' + spec.label);
  const existing = await getMetaobjectByHandle(handle);

  if (existing) {
    const updated = await updateSpecRow(existing.id, spec, sortOrder);
    console.log('UPDATED spec row:', handle);
    return updated.id;
  }

  const created = await createSpecRow(handle, spec, sortOrder);
  console.log('CREATED spec row:', handle);
  return created.id;
}

async function setProductSpecRows(productId, specRowIds) {
  const mutation = `
    mutation SetProductSpecRows($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          handle
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await graphql(mutation, {
    product: {
      id: productId,
      metafields: [
        {
          namespace: 'ezquest',
          key: 'spec_rows',
          type: 'list.metaobject_reference',
          value: JSON.stringify(specRowIds),
        },
      ],
    },
  });

  const result = data.productUpdate;
  if (result.userErrors && result.userErrors.length) {
    throw new Error(JSON.stringify(result.userErrors, null, 2));
  }

  return result.product;
}

async function confirmProductSpecRows(productId) {
  const query = `
    query ConfirmProductSpecRows($id: ID!) {
      product(id: $id) {
        id
        handle
        metafield(namespace: "ezquest", key: "spec_rows") {
          id
          type
          value
          references(first: 50) {
            nodes {
              ... on Metaobject {
                id
                handle
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await graphql(query, { id: productId });
  const metafield = data.product && data.product.metafield;
  const references = metafield && metafield.references ? metafield.references.nodes : [];

  return {
    type: metafield ? metafield.type : '',
    value: metafield ? metafield.value : '',
    count: references.length,
  };
}

async function seedProduct(product) {
  const specs = getSpecsForHandle(product.handle);
  console.log('\nProduct:', product.title, '(' + product.handle + ')');

  const specRowIds = [];
  for (let index = 0; index < specs.length; index += 1) {
    const id = await ensureSpecRow(product.handle, specs[index], index);
    specRowIds.push(id);
  }

  await setProductSpecRows(product.id, specRowIds);
  const confirmation = await confirmProductSpecRows(product.id);
  console.log(
    'LINKED spec_rows:',
    confirmation.count + '/' + specRowIds.length,
    '| type:',
    confirmation.type || '(missing)'
  );
}

async function main() {
  const requestedHandle = getRequestedHandle();
  const products = await listProducts();
  const targetProducts = requestedHandle
    ? products.filter((product) => product.handle === requestedHandle)
    : products;

  if (requestedHandle && targetProducts.length === 0) {
    throw new Error('No product found with handle: ' + requestedHandle);
  }

  console.log('Products to process:', targetProducts.length);

  let succeeded = 0;
  let failed = 0;

  for (const product of targetProducts) {
    try {
      await seedProduct(product);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      console.error('ERROR product:', product.title, '(' + product.handle + ')');
      console.error(error.message);
    }
  }

  console.log('\nDone. Succeeded:', succeeded, '| Failed:', failed);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('ERROR:', error.message);
  process.exit(1);
});
