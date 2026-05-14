'use strict';
// cleanup-orphan-metaobjects.js
// Deletes ezquest_download metaobjects whose products field references
// one of the 4 deleted demo products. Run AFTER delete-demo-products.js.
//
// Usage:
//   node cleanup-orphan-metaobjects.js                           # dry-run
//   node cleanup-orphan-metaobjects.js --apply --confirm-production

const { runGuards } = require('./safety');

const STORE   = process.env.SHOPIFY_SHOP_DOMAIN   || 'ezquest-4.myshopify.com';
const TOKEN   = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VER = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE_URL = `https://${STORE}/admin/api/${API_VER}/graphql.json`;

// The 4 deleted product GIDs.
const DELETED_GIDS = new Set([
  'gid://shopify/Product/8832352190662',
  'gid://shopify/Product/8832352092358',
  'gid://shopify/Product/8832352813254',
  'gid://shopify/Product/8832352878790',
]);

const DELAY_MS = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function gql(query, variables) {
  await sleep(DELAY_MS);
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

async function fetchAllDownloads() {
  const nodes = [];
  let cursor = null;
  while (true) {
    const data = await gql(`
      query ($cursor: String) {
        metaobjects(type: "ezquest_download", first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            fields { key value }
          }
        }
      }
    `, { cursor });
    nodes.push(...data.metaobjects.nodes);
    if (!data.metaobjects.pageInfo.hasNextPage) break;
    cursor = data.metaobjects.pageInfo.endCursor;
  }
  return nodes;
}

async function deleteMetaobject(id) {
  const data = await gql(`
    mutation DeleteMetaobject($id: ID!) {
      metaobjectDelete(id: $id) {
        deletedId
        userErrors { field message }
      }
    }
  `, { id });
  const result = data.metaobjectDelete;
  if (result.userErrors && result.userErrors.length > 0) {
    throw new Error(result.userErrors.map(e => e.message).join(', '));
  }
  return result.deletedId;
}

async function main() {
  if (!TOKEN) { console.error('SHOPIFY_ADMIN_ACCESS_TOKEN not set'); process.exit(1); }

  const { dryRun, log } = runGuards(STORE, 'cleanup-orphan-metaobjects');

  console.log('Fetching all ezquest_download metaobjects...');
  const all = await fetchAllDownloads();
  console.log(`  ${all.length} total\n`);

  // Find orphans: metaobjects whose products field includes any deleted GID.
  const orphans = [];
  for (const mo of all) {
    const productsField = mo.fields.find(f => f.key === 'products');
    if (!productsField || !productsField.value) continue;

    let gids;
    try { gids = JSON.parse(productsField.value); } catch { continue; }
    if (!Array.isArray(gids)) continue;

    const hasDeleted = gids.some(g => DELETED_GIDS.has(g));
    if (hasDeleted) {
      orphans.push({ ...mo, linkedGids: gids });
    }
  }

  if (orphans.length === 0) {
    console.log('No orphaned metaobjects found. Nothing to do.');
    return;
  }

  console.log(`Found ${orphans.length} orphaned metaobject(s):\n`);
  for (const mo of orphans) {
    const title = mo.fields.find(f => f.key === 'title')?.value || '(no title)';
    const externalUrl = mo.fields.find(f => f.key === 'external_url')?.value || '(no URL)';
    console.log(`  ${mo.handle}`);
    console.log(`    title: ${title}`);
    console.log(`    url:   ${externalUrl}`);
    console.log(`    refs:  ${mo.linkedGids.join(', ')}`);
    console.log('');
  }

  if (dryRun) {
    console.log('DRY RUN -- would delete the above metaobjects.');
    console.log('Pass --apply --confirm-production to execute.');
    return;
  }

  // Live delete
  let deleted = 0, errors = 0;

  for (const mo of orphans) {
    try {
      await deleteMetaobject(mo.id);
      console.log(`  DELETED: ${mo.handle}`);
      log({ action: 'delete', id: mo.id, handle: mo.handle, status: 'success' });
      deleted++;
    } catch (err) {
      console.error(`  ERROR deleting ${mo.handle}: ${err.message}`);
      log({ action: 'delete', id: mo.id, handle: mo.handle, status: 'error', error: err.message });
      errors++;
    }
  }

  console.log('');
  console.log('----------------------------------------------------------');
  console.log(`Done. Deleted: ${deleted} | Errors: ${errors}`);
}

main().catch(err => { console.error(err); process.exit(1); });
