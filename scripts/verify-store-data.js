#!/usr/bin/env node

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const API_VERSION = '2024-01';
const DELAY_MS = 300;

const METAOBJECT_TYPES = [
  'ezquest_decision_guide_entry',
  'ezquest_comparison_group',
  'ezquest_compatibility_entry',
];

const PRODUCT_METAFIELD_DEFINITIONS = [
  { namespace: 'ezquest', key: 'spec_rows', type: 'list.metaobject_reference', ownerType: 'PRODUCT' },
  { namespace: 'ezquest', key: 'highlights', type: 'list.single_line_text_field', ownerType: 'PRODUCT' },
  { namespace: 'ezquest', key: 'amazon_url', type: 'url', ownerType: 'PRODUCT' },
  { namespace: 'reviews', key: 'rating', type: 'rating', ownerType: 'PRODUCT' },
  { namespace: 'reviews', key: 'rating_count', type: 'number_integer', ownerType: 'PRODUCT' },
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

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  const links = linkHeader.split(',').map((part) => part.trim());
  const next = links.find((part) => part.includes('rel="next"'));
  if (!next) return null;
  const match = next.match(/<([^>]+)>/);
  return match ? match[1] : null;
}

async function rest(pathOrUrl) {
  const { store, token } = getEnv();
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `https://${store}/admin/api/${API_VERSION}${pathOrUrl}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
  });

  await sleep(DELAY_MS);

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(JSON.stringify(json, null, 2));
  }

  return {
    json,
    next: parseNextLink(res.headers.get('link')),
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

async function getAllProducts() {
  const products = [];
  let url = '/products.json?limit=250&fields=id,title,handle,images';

  while (url) {
    const result = await rest(url);
    products.push(...(result.json.products || []));
    url = result.next;
  }

  return products;
}

async function getAllPages() {
  const pages = [];
  let url = '/pages.json?limit=250&fields=id,title,handle,template_suffix';

  while (url) {
    const result = await rest(url);
    pages.push(...(result.json.pages || []));
    url = result.next;
  }

  return pages;
}

async function countMetaobjects(type) {
  const query = `
    query CountMetaobjects($type: String!, $cursor: String) {
      metaobjects(first: 250, type: $type, after: $cursor) {
        nodes {
          id
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  let count = 0;
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await graphql(query, { type, cursor });
    const connection = data.metaobjects;
    count += connection.nodes.length;
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return count;
}

async function getProductMetafieldDefinitions(namespace) {
  const query = `
    query GetMetafieldDefinitions($namespace: String!) {
      metafieldDefinitions(first: 250, ownerType: PRODUCT, namespace: $namespace) {
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
  const data = await graphql(query, { namespace });
  return data.metafieldDefinitions.nodes;
}

async function countProductsWithSpecRows() {
  const query = `
    query CountProductsWithSpecRows($cursor: String) {
      products(first: 100, after: $cursor) {
        nodes {
          id
          metafield(namespace: "ezquest", key: "spec_rows") {
            id
            value
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  let total = 0;
  let withSpecRows = 0;
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await graphql(query, { cursor });
    const connection = data.products;

    for (const product of connection.nodes) {
      total += 1;
      const value = product.metafield && product.metafield.value;
      if (value && value !== '[]') {
        withSpecRows += 1;
      }
    }

    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return { total, withSpecRows };
}

async function main() {
  try {
    const products = await getAllProducts();
    const withImages = products.filter((product) => product.images && product.images.length > 0);
    const withoutImages = products.filter((product) => !product.images || product.images.length === 0);

    console.log('Products');
    console.log(`- Total products: ${products.length}`);
    console.log(`- Products with images: ${withImages.length}`);
    console.log(`- Products without images: ${withoutImages.length}`);

    console.log('\nMetaobjects');
    for (const type of METAOBJECT_TYPES) {
      try {
        const count = await countMetaobjects(type);
        console.log(`- ${type}: ${count}`);
      } catch (error) {
        console.error(`ERROR: ${type}`);
        console.error(error.message);
      }
    }

    console.log('\nProduct metafield definitions');
    const definitionCache = new Map();
    for (const definition of PRODUCT_METAFIELD_DEFINITIONS) {
      try {
        if (!definitionCache.has(definition.namespace)) {
          definitionCache.set(
            definition.namespace,
            await getProductMetafieldDefinitions(definition.namespace)
          );
        }
        const existing = definitionCache
          .get(definition.namespace)
          .find((node) => node.key === definition.key);
        const label = `${definition.ownerType}.${definition.namespace}.${definition.key}`;
        if (existing) {
          const actualType = existing.type && existing.type.name;
          if (definition.namespace === 'ezquest' && definition.key === 'spec_rows') {
            const status = actualType === definition.type ? '✅' : `❌ expected ${definition.type}`;
            console.log(`ezquest.spec_rows: ${actualType} ${status}`);
          } else {
            const typeNote = actualType === definition.type ? definition.type : `${actualType} (expected ${definition.type})`;
            console.log(`SKIP exists: ${label} - ${typeNote}`);
          }
        } else {
          console.log(`ERROR missing: ${label}`);
        }
      } catch (error) {
        console.error(`ERROR: ${definition.namespace}.${definition.key}`);
        console.error(error.message);
      }
    }

    const specRowsStatus = await countProductsWithSpecRows();
    const specRowsComplete = specRowsStatus.withSpecRows === specRowsStatus.total ? '✅' : '❌';
    console.log(`Products with spec_rows set: ${specRowsStatus.withSpecRows}/${specRowsStatus.total} ${specRowsComplete}`);

    const pages = await getAllPages();
    console.log('\nPages');
    pages
      .sort((a, b) => a.handle.localeCompare(b.handle))
      .forEach((page) => {
        console.log(`- ${page.handle} | template_suffix: ${page.template_suffix || '(default)'}`);
      });

    console.log('\nDone.');
  } catch (error) {
    console.error('ERROR: verify-store-data failed');
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
