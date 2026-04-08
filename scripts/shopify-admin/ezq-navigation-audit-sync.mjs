import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");
const { findCollectionByHandle } = require("./lib/lookups");

const REPORT_PATH = "/tmp/ezq-navigation-audit-sync-report.json";
const PREVIEW_BASE_URL = process.env.EZQ_PREVIEW_BASE_URL || "http://127.0.0.1:9292";
const LAUNCH_COLLECTIONS = ["hubs-adapters", "docking-stations", "chargers-power", "accessories"];
const USE_CASE_HANDLES = ["balanced-everyday", "portable", "desk-ready", "chargers-power"];

function buildReferenceValue(ids) {
  return JSON.stringify(ids);
}

function buildOptionalReferenceValue(ids) {
  return ids.length > 0 ? buildReferenceValue(ids) : "";
}

function getCompareRole(product) {
  if (typeof product.compareRole === "string") {
    return product.compareRole;
  }

  return product.compareRole?.value || "";
}

function getCurrentUseCaseHandles(product) {
  if (Array.isArray(product.useCases)) {
    return product.useCases;
  }

  if (Array.isArray(product.currentUseCaseAssignments)) {
    return product.currentUseCaseAssignments;
  }

  return (product.useCases?.references?.nodes || []).map((node) => node.handle);
}

function mapCompareRole(role = "") {
  if (role === "balanced") return "balanced-everyday";
  if (role === "portable") return "portable";
  if (role === "desk") return "desk-ready";
  return "";
}

function normalizeSource(product) {
  return `${product.handle} ${product.title} ${product.productType}`.toLowerCase();
}

function inferDesiredCategory(product) {
  const currentLaunchCollections = (product.collections?.nodes || [])
    .map((collection) => collection.handle)
    .filter((handle) => LAUNCH_COLLECTIONS.includes(handle));

  if (currentLaunchCollections.length > 0) {
    return currentLaunchCollections[0];
  }

  if (product.productType === "Charger") {
    return "chargers-power";
  }

  if (product.productType === "Dock") {
    return "docking-stations";
  }

  if (product.productType === "Cable") {
    return "accessories";
  }

  return "hubs-adapters";
}

function shouldPreserveExistingUseCase(product, currentUseCase) {
  if (!currentUseCase) return false;
  if (!USE_CASE_HANDLES.includes(currentUseCase)) return false;
  if (product.productType === "Charger") return currentUseCase === "chargers-power";

  const mappedCompareRole = mapCompareRole(getCompareRole(product));
  if (mappedCompareRole) {
    return mappedCompareRole === currentUseCase;
  }

  return true;
}

function inferDesiredUseCase(product) {
  const currentUseCase = getCurrentUseCaseHandles(product)[0] || "";
  if (shouldPreserveExistingUseCase(product, currentUseCase)) {
    return currentUseCase;
  }

  const source = normalizeSource(product);

  if (product.productType === "Charger") {
    return "chargers-power";
  }

  const mappedCompareRole = mapCompareRole(getCompareRole(product));
  if (mappedCompareRole) {
    return mappedCompareRole;
  }

  if (product.productType === "Dock") {
    return "desk-ready";
  }

  if (product.productType === "Hub") {
    if (/travel|slim/.test(source)) {
      return "portable";
    }
    if (/dual display|dual hdmi|12-in-1|13-ports|13 ports|10-in-1|8-in-1/.test(source)) {
      return "desk-ready";
    }
    return "balanced-everyday";
  }

  if (product.productType === "Card Reader" || product.productType === "Enclosure") {
    if (/cfast|nvme/.test(source)) {
      return "desk-ready";
    }
    return "balanced-everyday";
  }

  if (product.productType === "Cable") {
    if (/coiled|travel|portable/.test(source)) {
      return "portable";
    }
    if (/right angled|right-angled/.test(source)) {
      return "desk-ready";
    }
    if (/hdmi|displayport|usb4|extension/.test(source)) {
      return "desk-ready";
    }
    return "balanced-everyday";
  }

  if (product.productType === "Adapter") {
    if (currentUseCase) {
      return currentUseCase;
    }
    if (/displayport|ethernet/.test(source)) {
      return "desk-ready";
    }
    if (/vga|dvi|mini adapter|2 pack|2-pack|90 degree|90-degree/.test(source)) {
      return "portable";
    }
    return "balanced-everyday";
  }

  return "balanced-everyday";
}

async function fetchAllActiveProducts(client) {
  const products = [];
  let after = null;
  const query = `
    query ActiveProducts($after: String) {
      products(first: 100, after: $after, sortKey: TITLE, query: "status:active") {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          status
          productType
          vendor
          onlineStoreUrl
          variants(first: 10) {
            nodes {
              sku
            }
          }
          collections(first: 20) {
            nodes {
              id
              handle
              title
            }
          }
          compareRole: metafield(namespace: "ezquest", key: "compare_role") {
            value
          }
          useCases: metafield(namespace: "ezquest", key: "use_cases") {
            references(first: 20) {
              nodes {
                ... on Metaobject {
                  id
                  handle
                }
              }
            }
          }
        }
      }
    }
  `;

  do {
    const data = await client.graphql(query, { after }, { label: "Fetch active products" });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);

  return products;
}

async function fetchUseCaseMetaobjects(client) {
  const query = `
    query UseCaseMetaobjects($type: String!) {
      metaobjects(first: 100, type: $type) {
        nodes {
          id
          handle
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { type: "ezquest_use_case" }, { label: "Fetch use case metaobjects" });
  return data.metaobjects.nodes;
}

async function setProductUseCases(client, productId, useCaseIds, handle) {
  const mutation = `
    mutation SetUseCases($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    {
      metafields: [
        {
          ownerId: productId,
          namespace: "ezquest",
          key: "use_cases",
          type: "list.metaobject_reference",
          value: buildOptionalReferenceValue(useCaseIds)
        }
      ]
    },
    { label: `Set product use cases ${handle}` }
  );

  client.assertUserErrors(data.metafieldsSet.userErrors, `Set product use cases ${handle}`);
}

async function addProductsToCollection(client, collectionId, productIds, handle) {
  if (productIds.length === 0) return;

  const mutation = `
    mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    { id: collectionId, productIds },
    { label: `Add products to collection ${handle}` }
  );

  client.assertUserErrors(data.collectionAddProducts.userErrors, `Add products to collection ${handle}`);
}

async function updateUseCaseMetaobject(client, metaobject, productIds) {
  const fieldsByKey = new Map((metaobject.fields || []).map((field) => [field.key, field.value || ""]));
  const mutation = `
    mutation UpdateUseCaseMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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

  const fields = [
    { key: "title", value: fieldsByKey.get("title") || "" },
    { key: "slug", value: fieldsByKey.get("slug") || metaobject.handle },
    { key: "description", value: fieldsByKey.get("description") || "" },
    { key: "sort_order", value: fieldsByKey.get("sort_order") || "" },
    { key: "products", value: buildOptionalReferenceValue(productIds) }
  ].filter((field) => field.value !== "");

  const data = await client.graphql(
    mutation,
    {
      id: metaobject.id,
      metaobject: { fields }
    },
    { label: `Update use case ${metaobject.handle}` }
  );

  client.assertUserErrors(data.metaobjectUpdate.userErrors, `Update use case ${metaobject.handle}`);
}

async function verifyCollectionPage(handle, productHandles) {
  try {
    const response = await fetch(`${PREVIEW_BASE_URL}/collections/${handle}`);
    const html = await response.text();
    return {
      handle,
      status: response.status,
      matchedProducts: productHandles.filter((productHandle) => html.includes(`/products/${productHandle}`))
    };
  } catch (error) {
    return {
      handle,
      status: 0,
      error: error.message,
      matchedProducts: []
    };
  }
}

async function verifyHomePageMenu(useCases, categories) {
  try {
    const response = await fetch(`${PREVIEW_BASE_URL}/`);
    const html = await response.text();

    return {
      status: response.status,
      useCaseTitlesPresent: useCases.every((useCase) => html.includes(useCase)),
      categoryTitlesPresent: categories.every((category) => html.includes(category))
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      useCaseTitlesPresent: false,
      categoryTitlesPresent: false
    };
  }
}

async function main() {
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  const products = await fetchAllActiveProducts(client);
  const useCaseMetaobjects = await fetchUseCaseMetaobjects(client);
  const useCaseIdByHandle = new Map(useCaseMetaobjects.map((metaobject) => [metaobject.handle, metaobject.id]));

  const auditRows = products.map((product) => {
    const sku = product.variants?.nodes?.[0]?.sku || "";
    const currentCategoryAssignments = (product.collections?.nodes || [])
      .map((collection) => collection.handle)
      .filter((handle) => LAUNCH_COLLECTIONS.includes(handle));
    const currentUseCaseAssignments = (product.useCases?.references?.nodes || []).map((node) => node.handle);
    const desiredCategory = inferDesiredCategory(product);
    const desiredUseCase = inferDesiredUseCase(product);
    const hasDesiredCategory = currentCategoryAssignments.includes(desiredCategory);
    const hasDesiredUseCase = currentUseCaseAssignments.includes(desiredUseCase);
    const categoryNavStatus = hasDesiredCategory ? "correct" : currentCategoryAssignments.length > 0 ? "incomplete" : "missing";
    const useCaseNavStatus = hasDesiredUseCase ? "correct" : currentUseCaseAssignments.length > 0 ? "conflicting" : "missing";

    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      sku,
      status: product.status,
      productType: product.productType,
      compareRole: product.compareRole?.value || "",
      currentCategoryAssignments,
      desiredCategory,
      currentUseCaseAssignments,
      desiredUseCase,
      categoryNavStatus,
      useCaseNavStatus
    };
  });

  const categoryCollectionByHandle = new Map();
  for (const handle of LAUNCH_COLLECTIONS) {
    const collection = await findCollectionByHandle(client, handle);
    if (collection) {
      categoryCollectionByHandle.set(handle, collection);
    }
  }

  const alreadyCorrect = auditRows.filter((row) => row.categoryNavStatus === "correct" && row.useCaseNavStatus === "correct");
  const missingCategory = auditRows.filter((row) => row.categoryNavStatus === "missing" || row.categoryNavStatus === "incomplete");
  const missingUseCase = auditRows.filter((row) => row.useCaseNavStatus === "missing");
  const conflictingAssignments = auditRows.filter((row) => row.useCaseNavStatus === "conflicting");

  const updates = {
    categoryAssignments: [],
    useCaseAssignments: [],
    useCaseMetaobjects: []
  };

  for (const row of missingCategory) {
    const collection = categoryCollectionByHandle.get(row.desiredCategory);
    if (!collection) continue;
    await addProductsToCollection(client, collection.id, [row.id], row.desiredCategory);
    updates.categoryAssignments.push({ product: row.handle, addedCollection: row.desiredCategory });
  }

  for (const row of [...missingUseCase, ...conflictingAssignments]) {
    const useCaseId = useCaseIdByHandle.get(row.desiredUseCase);
    if (!useCaseId) continue;
    await setProductUseCases(client, row.id, [useCaseId], row.handle);
    updates.useCaseAssignments.push({ product: row.handle, useCase: row.desiredUseCase });
  }

  const productIdsByUseCase = new Map(USE_CASE_HANDLES.map((handle) => [handle, []]));
  for (const row of auditRows) {
    const useCaseHandle = row.desiredUseCase;
    if (!productIdsByUseCase.has(useCaseHandle)) continue;
    productIdsByUseCase.get(useCaseHandle).push(row.id);
  }

  for (const metaobject of useCaseMetaobjects) {
    const productIds = productIdsByUseCase.get(metaobject.handle) || [];
    await updateUseCaseMetaobject(client, metaobject, productIds);
    updates.useCaseMetaobjects.push({ useCase: metaobject.handle, productCount: productIds.length });
  }

  const refreshedProducts = await fetchAllActiveProducts(client);
  const refreshedRows = refreshedProducts.map((product) => {
    const currentCategoryAssignments = (product.collections?.nodes || [])
      .map((collection) => collection.handle)
      .filter((handle) => LAUNCH_COLLECTIONS.includes(handle));
    const currentUseCaseAssignments = (product.useCases?.references?.nodes || []).map((node) => node.handle);
    const desiredCategory = inferDesiredCategory(product);
    const desiredUseCase = inferDesiredUseCase(product);
    return {
      handle: product.handle,
      desiredCategory,
      desiredUseCase,
      categoryOk: currentCategoryAssignments.includes(desiredCategory),
      useCaseOk: currentUseCaseAssignments.includes(desiredUseCase)
    };
  });

  const orphanedProducts = refreshedRows.filter((row) => !row.categoryOk && !row.useCaseOk).map((row) => row.handle);
  const collectionVerification = [];
  for (const handle of LAUNCH_COLLECTIONS) {
    const productHandles = refreshedRows.filter((row) => row.desiredCategory === handle).map((row) => row.handle);
    collectionVerification.push(await verifyCollectionPage(handle, productHandles.slice(0, 12)));
  }

  const homePageVerification = await verifyHomePageMenu(
    ["Balanced everyday", "Portable", "Desk-ready", "Chargers & power"],
    ["Hubs & adapters", "Docking stations", "Chargers & power", "Cables & accessories"]
  );

  const report = {
    totalLiveProductsAudited: auditRows.length,
    alreadyCorrect: alreadyCorrect.map((row) => row.handle),
    missingCategoryAssignment: missingCategory.map((row) => row.handle),
    missingUseCaseAssignment: missingUseCase.map((row) => row.handle),
    conflictingAssignments: conflictingAssignments.map((row) => ({
      handle: row.handle,
      currentUseCases: row.currentUseCaseAssignments,
      desiredUseCase: row.desiredUseCase,
      compareRole: row.compareRole
    })),
    updates,
    validation: {
      productsWithCorrectCategory: refreshedRows.filter((row) => row.categoryOk).length,
      productsWithCorrectUseCase: refreshedRows.filter((row) => row.useCaseOk).length,
      orphanedProducts,
      collectionVerification,
      homePageVerification
    },
    matrix: auditRows.map((row) => ({
      product_title: row.title,
      handle: row.handle,
      sku: row.sku,
      live_status: row.status,
      category_assignment: row.currentCategoryAssignments,
      use_case_assignment: row.currentUseCaseAssignments,
      category_navigation_status: row.categoryNavStatus,
      use_case_navigation_status: row.useCaseNavStatus,
      action_needed:
        row.categoryNavStatus === "correct" && row.useCaseNavStatus === "correct"
          ? "none"
          : `category:${row.desiredCategory} use_case:${row.desiredUseCase}`
    }))
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
