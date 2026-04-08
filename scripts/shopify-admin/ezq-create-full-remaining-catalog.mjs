import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");
const { findPublicationByName, publishResourceToPublication } = require("./lib/publications");

const REPORT_PATH = "/tmp/ezq-migration-report.json";
const WRITE_REPORT_PATH = "/tmp/ezq-full-remaining-migration-report.json";
const PREVIEW_BASE_URL = process.env.EZQ_PREVIEW_BASE_URL || "http://127.0.0.1:9292";
const FILTER_HANDLES = new Set(
  String(process.env.EZQ_FILTER_HANDLES || "")
    .split(",")
    .map((value) => normalizeHandle(value))
    .filter(Boolean)
);
const COMPLETED_HANDLES = new Set([
  "pro-series-usb-c-5in1-hub",
  "duraguard-usb-c-to-usb-a-charge-and-sync-cable",
  "duraguard-stereo-audio-cable",
  "ultraslim-wall-charger-dual-usb-c-70w",
  "worldtravel-65w-gan-5-port-pd-wall-charger",
  "worldtravel-35w-gan-5-port-pd-wall-charger",
  "45w-gan-usb-c-pd-wall-charger",
  "65w-gan-usb-c-pd-wall-charger",
  "ultimatepower-90w-gan-usb-c-pd-wall-charger",
  "ultimatepower-120w-gan-usb-c-pd-wall-charger",
  "usb-c-slim-gen-2-hub-adapter-6-in-1",
  "usb-c-multimedia-7-in-1-hub",
  "usb-c-multimedia-8-in-1-hub"
]);
const STORY_FALLBACK_STRINGS = [
  "Designed for cleaner desk setups",
  "Ports, power, and display in one step",
  "Support stays close after purchase"
];

const writeReport = {
  totalRemainingSourceProductsProcessed: 0,
  productsCreated: [],
  productsUpdated: [],
  productsSkippedForManualReview: [],
  imagesImportedPerProduct: [],
  metafieldsMetaobjectsPopulatedPerProduct: [],
  collectionAssignmentsCompleted: [],
  storefrontVerificationResults: {
    productPages: [],
    collectionPages: [],
    adminChecks: []
  },
  compareEligibleFamiliesUnlocked: [],
  failuresOrMissingSourceData: [],
  isComplete: false
};

function decodeHtml(text = "") {
  return String(text)
    .replace(/&#(\d+);/g, (_, value) => String.fromCharCode(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCharCode(parseInt(value, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&trade;/gi, "")
    .replace(/&reg;/gi, "")
    .replace(/&mdash;/gi, "-")
    .replace(/&ndash;/gi, "-")
    .replace(/&bull;/gi, "-")
    .replace(/&hellip;/gi, "...")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\uFFFD/g, "-")
    .replace(/[\u0096\u0097]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeHandle(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\.html?$/i, "")
    .replace(/-details$/i, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanHtmlFragment(fragment = "") {
  return String(fragment)
    .replace(/<\/div>\s*$/gi, "")
    .replace(/^\s*<div[^>]*>/gi, "")
    .trim();
}

function slugify(value = "") {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listItemsFromHtml(fragment = "") {
  const clean = cleanHtmlFragment(fragment);
  let items = [...clean.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => decodeHtml(match[1]));

  // Some EZQ source tabs omit closing </li> tags, so treat the next <li> or list end as the boundary.
  if (items.length === 0 && /<li\b/i.test(clean)) {
    items = [...clean.matchAll(/<li[^>]*>([\s\S]*?)(?=<li\b|<\/ul>|<\/ol>|$)/gi)].map((match) => decodeHtml(match[1]));
  }

  if (items.length === 0) {
    items = [...clean.matchAll(/<(?:p|h[1-6])[^>]*>([\s\S]*?)<\/(?:p|h[1-6])>/gi)].map((match) => decodeHtml(match[1]));
  }

  if (items.length === 0) {
    items = decodeHtml(clean)
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [...new Set(items.filter(Boolean))];
}

function richTextFromFragment(fragment = "") {
  const clean = cleanHtmlFragment(fragment);
  const segments = [];

  for (const match of clean.matchAll(/<(h[1-6]|p|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

    if (tag === "ul" || tag === "ol") {
      for (const item of listItemsFromHtml(inner)) {
        segments.push(item);
      }
      continue;
    }

    const text = decodeHtml(inner);
    if (text) {
      segments.push(text);
    }
  }

  if (segments.length === 0) {
    const fallback = decodeHtml(clean);
    if (fallback) {
      segments.push(fallback);
    }
  }

  return JSON.stringify({
    type: "root",
    children: segments.map((segment) => ({
      type: "paragraph",
      children: [{ type: "text", value: segment }]
    }))
  });
}

function combinedDescriptionHtml(sourceProduct) {
  const parts = [];

  if (sourceProduct.shortDescription) {
    parts.push(`<p>${escapeHtml(sourceProduct.shortDescription)}</p>`);
  }

  const highlightHtml = cleanHtmlFragment(sourceProduct.tabs?.Highlight || "");
  if (highlightHtml) {
    parts.push(highlightHtml);
  }

  return parts.join("\n").trim();
}

function featureHighlightsFromSource(sourceProduct) {
  return listItemsFromHtml(sourceProduct.tabs?.Features || "");
}

function specRowsFromSource(sourceProduct) {
  return listItemsFromHtml(sourceProduct.tabs?.Specifications || "").map((line, index) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const colonIndex = normalized.indexOf(":");

    if (colonIndex > 0) {
      return {
        label: normalized.slice(0, colonIndex).trim(),
        value: normalized.slice(colonIndex + 1).trim() || normalized,
        sortOrder: index + 1
      };
    }

    return {
      label: normalized,
      value: normalized,
      sortOrder: index + 1
    };
  });
}

function compatibilityEntriesFromSource(sourceProduct) {
  return listItemsFromHtml(sourceProduct.tabs?.Compatibility || "").map((line, index) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const colonIndex = normalized.indexOf(":");
    const platform = colonIndex > 0 ? normalized.slice(0, colonIndex).trim() : "";
    const summary = colonIndex > 0 ? normalized.slice(colonIndex + 1).trim() : "";

    return {
      title: normalized,
      platform,
      summary,
      sortOrder: index + 1
    };
  });
}

function extractDownloadsFromTabHtml(fragment = "") {
  return [...String(fragment).matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)].map((match) => ({
    title: decodeHtml(match[2]),
    url: match[1]
  }));
}

function downloadsFromSource(sourceProduct) {
  const explicit = Array.isArray(sourceProduct.downloads) ? sourceProduct.downloads : [];
  const fallback = extractDownloadsFromTabHtml(sourceProduct.tabs?.Downloads || "");
  const combined = explicit.length > 0 ? explicit : fallback;

  return combined.map((entry, index) => {
    const title = decodeHtml(entry.title);
    const lower = title.toLowerCase();
    let downloadType = "Download";

    if (lower.includes("manual")) {
      downloadType = "Manual";
    } else if (lower.includes("datasheet")) {
      downloadType = "Datasheet";
    } else if (lower.includes("driver")) {
      downloadType = "Driver";
    }

    return {
      title,
      externalUrl: entry.url,
      downloadType,
      buttonLabel: "Open resource",
      sortOrder: index + 1
    };
  });
}

function buildReferenceValue(ids) {
  return JSON.stringify(ids);
}

function uniqueUrls(urls = []) {
  const seen = new Set();
  const result = [];

  for (const url of urls) {
    const normalized = String(url || "").trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function normalizeImageUrl(url = "") {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }

  try {
    return encodeURI(raw);
  } catch (_error) {
    return raw.replace(/ /g, "%20");
  }
}

function inferProductType(sourceProduct) {
  const title = String(sourceProduct.sourceTitle || "").toLowerCase();

  if (title.includes("card reader")) return "Card Reader";
  if (title.includes("enclosure")) return "Enclosure";
  if (title.includes("charger")) return "Charger";
  if (title.includes("cable")) return "Cable";
  if (title.includes("dock")) return "Dock";
  if (title.includes("hub")) return "Hub";
  if (title.includes("adapter")) return "Adapter";

  return "Accessory";
}

function inferCollectionHandles(sourceProduct, productType) {
  const categories = (sourceProduct.categories || []).map((category) => String(category).toLowerCase());
  const title = String(sourceProduct.sourceTitle || "").toLowerCase();

  if (
    categories.some((category) => category.includes("wall chargers") || category.includes("car chargers")) ||
    productType === "Charger" ||
    title.includes("charger")
  ) {
    return ["chargers-power"];
  }

  if (
    categories.some((category) =>
      category.includes("cables") ||
      category.includes("displayport") ||
      category.includes("hdmi") ||
      category.includes("mini-display") ||
      category.includes("audio")
    ) ||
    productType === "Cable"
  ) {
    return ["accessories"];
  }

  if (productType === "Dock") {
    return ["docking-stations"];
  }

  return ["hubs-adapters"];
}

function validateSourceProduct(sourceProduct) {
  const missing = [];
  if (!sourceProduct.sourceUrl) missing.push("sourceUrl");
  if (!sourceProduct.sourceTitle) missing.push("title");
  if (!sourceProduct.sourceHandle) missing.push("handle");
  if (!sourceProduct.sku && (!Array.isArray(sourceProduct.skuList) || sourceProduct.skuList.length === 0)) missing.push("sku");
  if (!sourceProduct.shortDescription) missing.push("short description");
  if (!sourceProduct.tabs?.Highlight) missing.push("highlight");
  if (!sourceProduct.tabs?.Features) missing.push("features");
  if (!sourceProduct.tabs?.Specifications) missing.push("specifications");
  if (!sourceProduct.tabs?.Compatibility) missing.push("compatibility");
  if (uniqueUrls(sourceProduct.galleryImages || []).length === 0) missing.push("gallery images");
  return missing;
}

async function listAllProducts(client) {
  const query = `
    query ListProducts($after: String) {
      products(first: 100, after: $after, sortKey: TITLE) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          status
          vendor
          productType
          variants(first: 20) {
            nodes {
              sku
            }
          }
        }
      }
    }
  `;

  const products = [];
  let after = null;

  do {
    const data = await client.graphql(query, { after }, { label: "List products for full remaining migration" });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);

  return products;
}

function classifyTargets(sourceProducts, liveProducts) {
  const skuMap = new Map();
  const handleMap = new Map();
  const titleMap = new Map();

  for (const product of liveProducts) {
    handleMap.set(normalizeHandle(product.handle), product);
    titleMap.set(normalizeText(product.title), product);
    for (const variant of product.variants?.nodes || []) {
      if (variant.sku) {
        skuMap.set(String(variant.sku).toUpperCase(), product);
      }
    }
  }

  const rows = [];

  for (const sourceProduct of sourceProducts) {
    let targetHandle = normalizeHandle(sourceProduct.sourceHandle);
    const skuMatches = [...new Map(
      (sourceProduct.skuList || [])
        .map((sku) => skuMap.get(String(sku).toUpperCase()))
        .filter(Boolean)
        .map((product) => [product.handle, product])
    ).values()];
    const handleMatch =
      handleMap.get(normalizeHandle(targetHandle)) ||
      handleMap.get(normalizeHandle(sourceProduct.sourceHandle)) ||
      null;
    const titleMatch = titleMap.get(normalizeText(sourceProduct.sourceTitle)) || null;

    let status = "SAFE_CREATE";
    let matchedHandle = null;
    let reason = "";

    if (normalizeHandle(sourceProduct.sourceHandle) === "usb-c-to-usb-3-mini-adapter") {
      targetHandle = "superspeed-gen-1-usb-c-to-usb-a-mini-adapter";
      status = "SAFE_UPDATE";
      matchedHandle = "superspeed-gen-1-usb-c-to-usb-a-mini-adapter";
      reason = "source page defaults to single-pack X40077";
    } else if (handleMatch) {
      status = "SAFE_UPDATE";
      matchedHandle = handleMatch.handle;
      reason = "handle";
    } else if (skuMatches.length === 1) {
      status = "SAFE_UPDATE";
      matchedHandle = skuMatches[0].handle;
      reason = "sku";
    } else if (skuMatches.length > 1) {
      status = "MANUAL_REVIEW";
      matchedHandle = skuMatches.map((product) => product.handle).join(", ");
      reason = "multiple sku matches";
    } else if (titleMatch) {
      status = "SAFE_UPDATE";
      matchedHandle = titleMatch.handle;
      reason = "title";
    }

    if (status === "SAFE_UPDATE" && COMPLETED_HANDLES.has(matchedHandle)) {
      continue;
    }

    rows.push({
      sourceHandle: sourceProduct.sourceHandle,
      targetHandle,
      title: sourceProduct.sourceTitle,
      sku: sourceProduct.sku,
      skuList: sourceProduct.skuList || [],
      categories: sourceProduct.categories || [],
      status,
      matchedHandle,
      reason
    });
  }

  if (FILTER_HANDLES.size === 0) {
    return rows;
  }

  return rows.filter((row) => {
    return (
      FILTER_HANDLES.has(normalizeHandle(row.sourceHandle)) ||
      FILTER_HANDLES.has(normalizeHandle(row.targetHandle)) ||
      FILTER_HANDLES.has(normalizeHandle(row.matchedHandle || ""))
    );
  });
}

async function fetchProductByHandle(client, handle) {
  const query = `
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          vendor
          productType
          onlineStoreUrl
          descriptionHtml
          collections(first: 20) {
            nodes {
              id
              handle
            }
          }
          variants(first: 20) {
            nodes {
              id
              sku
              price
              compareAtPrice
              inventoryPolicy
            }
          }
          media(first: 50) {
            nodes {
              ... on MediaImage {
                id
                alt
                image {
                  url
                }
              }
            }
          }
          metafields(first: 50, namespace: "ezquest") {
            nodes {
              id
              key
              type
              value
            }
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { query: `handle:${handle}` }, { label: `Lookup product ${handle}` });
  return data.products.nodes[0] || null;
}

async function createProduct(client, targetHandle, sourceProduct, productType) {
  const mutation = `
    mutation CreateProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          title
          handle
          variants(first: 10) {
            nodes {
              id
              sku
              price
            }
          }
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
      product: {
        title: sourceProduct.sourceTitle,
        handle: targetHandle,
        vendor: "EZQuest",
        productType,
        status: "ACTIVE",
        descriptionHtml: combinedDescriptionHtml(sourceProduct)
      }
    },
    { label: `Create product ${targetHandle}` }
  );

  client.assertUserErrors(data.productCreate.userErrors, `Create product ${targetHandle}`);
  return data.productCreate.product;
}

async function updateProductCore(client, productId, targetHandle, sourceProduct, productType) {
  const mutation = `
    mutation UpdateProduct($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          title
          handle
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
      product: {
        id: productId,
        title: sourceProduct.sourceTitle,
        handle: targetHandle,
        vendor: "EZQuest",
        productType,
        status: "ACTIVE",
        descriptionHtml: combinedDescriptionHtml(sourceProduct)
      }
    },
    { label: `Update product core ${targetHandle}` }
  );

  client.assertUserErrors(data.productUpdate.userErrors, `Update product core ${targetHandle}`);
  return data.productUpdate.product;
}

async function updateSingleVariant(client, productId, variantId, targetHandle, sourceProduct) {
  const mutation = `
    mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          sku
          price
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variantInput = {
    id: variantId,
    inventoryPolicy: "CONTINUE",
    inventoryItem: {
      tracked: false
    }
  };

  if (sourceProduct.price) {
    variantInput.price = sourceProduct.price;
    variantInput.compareAtPrice = null;
  }

  const resolvedSku =
    targetHandle === "superspeed-gen-1-usb-c-to-usb-a-mini-adapter"
      ? (sourceProduct.skuList?.[0] || "X40077")
      : sourceProduct.sku;

  if (resolvedSku) {
    variantInput.inventoryItem.sku = resolvedSku;
  }

  const data = await client.graphql(
    mutation,
    {
      productId,
      variants: [variantInput]
    },
    { label: `Update product variant ${targetHandle}` }
  );

  client.assertUserErrors(data.productVariantsBulkUpdate.userErrors, `Update product variant ${targetHandle}`);
  return data.productVariantsBulkUpdate.productVariants || [];
}

async function listMetaobjectsByType(client, type) {
  const query = `
    query MetaobjectsByType($type: String!) {
      metaobjects(first: 250, type: $type) {
        nodes {
          id
          handle
        }
      }
    }
  `;

  const data = await client.graphql(query, { type }, { label: `List metaobjects ${type}` });
  return data.metaobjects.nodes;
}

async function upsertMetaobject(client, existingByHandle, { type, handle, fields }) {
  const existing = existingByHandle.get(handle);

  if (!existing) {
    const mutation = `
      mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
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

    const data = await client.graphql(
      mutation,
      { metaobject: { type, handle, fields } },
      { label: `Create metaobject ${type}:${handle}` }
    );

    client.assertUserErrors(data.metaobjectCreate.userErrors, `Create metaobject ${type}:${handle}`);
    const created = data.metaobjectCreate.metaobject;
    existingByHandle.set(handle, created);
    return created.id;
  }

  const mutation = `
    mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
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

  const data = await client.graphql(
    mutation,
    { id: existing.id, metaobject: { fields } },
    { label: `Update metaobject ${type}:${handle}` }
  );

  client.assertUserErrors(data.metaobjectUpdate.userErrors, `Update metaobject ${type}:${handle}`);
  return data.metaobjectUpdate.metaobject.id;
}

async function setProductMetafields(client, metafields, handle) {
  const mutation = `
    mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(mutation, { metafields }, { label: `Set EZQuest metafields ${handle}` });
  client.assertUserErrors(data.metafieldsSet.userErrors, `Set EZQuest metafields ${handle}`);
  return data.metafieldsSet.metafields;
}

async function deleteProductMedia(client, productId, mediaIds, handle) {
  if (!mediaIds.length) {
    return [];
  }

  const mutation = `
    mutation DeleteProductMedia($productId: ID!, $mediaIds: [ID!]!) {
      productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
        deletedMediaIds
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    { productId, mediaIds },
    { label: `Delete media ${handle}` }
  );

  client.assertUserErrors(data.productDeleteMedia.mediaUserErrors, `Delete media ${handle}`);
  return data.productDeleteMedia.deletedMediaIds || [];
}

async function createProductMedia(client, productId, handle, sourceProduct) {
  const imageUrls = uniqueUrls(sourceProduct.galleryImages || []).map((url) => normalizeImageUrl(url)).filter(Boolean);
  if (!imageUrls.length) {
    return [];
  }

  const mutation = `
    mutation CreateProductMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
            alt
            status
            image {
              url
            }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    {
      productId,
      media: imageUrls.map((url, index) => ({
        alt: `${sourceProduct.sourceTitle} image ${index + 1}`,
        mediaContentType: "IMAGE",
        originalSource: url
      }))
    },
    { label: `Create media ${handle}` }
  );

  client.assertUserErrors(data.productCreateMedia.mediaUserErrors, `Create media ${handle}`);
  return data.productCreateMedia.media || [];
}

async function findCollectionDetailByHandle(client, handle) {
  const query = `
    query CollectionByHandle($query: String!) {
      collections(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          products(first: 250) {
            nodes {
              id
              handle
            }
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { query: `handle:${handle}` }, { label: `Lookup collection ${handle}` });
  return data.collections.nodes[0] || null;
}

async function addProductsToCollection(client, collectionId, productIds, handle) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return;
  }

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

async function syncCollections(client, productId, collectionHandles) {
  const resolvedCollections = [];

  for (const handle of collectionHandles) {
    const collection = await findCollectionDetailByHandle(client, handle);
    if (!collection) {
      throw new Error(`Required collection ${handle} was not found`);
    }
    resolvedCollections.push(collection);
  }

  for (const collection of resolvedCollections) {
    const existingIds = new Set((collection.products?.nodes || []).map((item) => item.id));
    if (!existingIds.has(productId)) {
      await addProductsToCollection(client, collection.id, [productId], collection.handle);
    }
  }

  return resolvedCollections.map((collection) => collection.handle);
}

async function verifyStorefrontProduct(handle, expected) {
  const response = await fetch(`${PREVIEW_BASE_URL}/products/${handle}`);
  const html = await response.text();
  const downloadTitles = (expected.downloadTitles || []).filter(Boolean);
  const downloadCount = Number(expected.downloadCount || 0);

  return {
    handle,
    status: response.status,
    storySectionPresent: html.includes("product-story-section"),
    fallbackContentUsed: STORY_FALLBACK_STRINGS.some((value) => html.includes(value)),
    specsRendered: expected.specCount > 0 ? html.includes("spec-label") : true,
    compatibilityRendered: expected.compatibilityCount > 0 ? html.includes("compatibility-card") : true,
    downloadsRendered:
      downloadCount > 0
        ? html.includes("Find downloads") ||
          html.includes(`${downloadCount} download`) ||
          downloadTitles.some((title) => html.includes(title))
        : true,
    bodyLength: html.length
  };
}

async function verifyStorefrontCollection(handle, productHandles) {
  const response = await fetch(`${PREVIEW_BASE_URL}/collections/${handle}`);
  const html = await response.text();

  return {
    handle,
    status: response.status,
    productsFound: productHandles.filter((productHandle) => html.includes(productHandle))
  };
}

function computeCompareFamilies(processedHandles) {
  const families = [];
  const created = new Set(processedHandles);

  const mobileHubHandles = [
    "usb-4-dual-display-8-in-1-hub-pro-series",
    "usb-c-dual-display-12-in-1-multimedia-hub-pro-series",
    "usb-c-multimedia-10-in-1-gen-2-hub",
    "usb-c-gen-2-hub-adapter-7-ports",
    "usb-c-multimedia-hub-adapter-8-ports",
    "dual-hdmi-usb-c-multimedia-hub-adapter-12-ports",
    "dual-usb-c-multimedia-hub-13-ports",
    "x40225-usb-c-dual-hdmi-multimedia-hub-adapter-5-ports-with-power-delivery-3.0",
    "usb-c-multimedia-hub-adapter-8-ports-with-4k-60hz-power-delivery-3"
  ];
  if (mobileHubHandles.some((handle) => created.has(handle))) {
    families.push("usb-c-mobile-hubs");
  }

  const displayAdapterHandles = [
    "usb-c-to-hdmi-4k-60hz-adapter",
    "usb-c-to-displayport-4k-60hz-adapter",
    "usb-c-to-dvi-adapter",
    "x40013-usb-c-to-vga-adapter"
  ];
  if (displayAdapterHandles.every((handle) => created.has(handle))) {
    families.push("usb-c-display-adapters");
  }

  const duraguardCableExpansionHandles = [
    "duraguard-usb-c-right-angled-charge-sync-100w-1.2-meter-cable",
    "duraguard-coiled-usb-c-charge-sync-100w-1.5-meter-black-cable",
    "duraguard-usb-c-to-usb-c-charge-and-sync-cable"
  ];
  if (duraguardCableExpansionHandles.every((handle) => created.has(handle) || handle === "duraguard-usb-c-to-usb-c-charge-and-sync-cable")) {
    families.push("duraguard-charge-and-sync-cables-expanded");
  }

  const chargerExtensionHandles = [
    "ultimatepower-65w-gan-usb-c-pd-wall-charger",
    "mini-30w-gan-usb-c-pd-wall-charger"
  ];
  if (chargerExtensionHandles.every((handle) => created.has(handle))) {
    families.push("ultimatepower-wall-chargers-expansion");
  }

  return families;
}

async function run() {
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  const sourceReport = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const sourceProducts = sourceReport.sourceProducts || [];
  const sourceByHandle = new Map(sourceProducts.map((product) => [product.sourceHandle, product]));
  const liveProducts = await listAllProducts(client);
  const targets = classifyTargets(sourceProducts, liveProducts);
  const publication = await findPublicationByName(client, "Online Store");
  const specRowsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_spec_row")).map((entry) => [entry.handle, entry]));
  const downloadsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_download")).map((entry) => [entry.handle, entry]));
  const compatibilityByHandle = new Map((await listMetaobjectsByType(client, "ezquest_compatibility_entry")).map((entry) => [entry.handle, entry]));

  writeReport.totalRemainingSourceProductsProcessed = targets.length;

  for (const target of targets) {
    if (target.status === "MANUAL_REVIEW") {
      writeReport.productsSkippedForManualReview.push({
        sourceHandle: target.sourceHandle,
        targetHandle: target.targetHandle,
        title: target.title,
        reason: target.reason,
        candidateHandle: target.matchedHandle || null
      });
      continue;
    }

    const sourceProduct = sourceByHandle.get(target.sourceHandle);
    if (!sourceProduct) {
      writeReport.failuresOrMissingSourceData.push({
        product: target.targetHandle,
        type: "source",
        message: `Missing source snapshot for ${target.sourceHandle}`
      });
      continue;
    }

    const productType = inferProductType(sourceProduct);
    const desiredCollections = inferCollectionHandles(sourceProduct, productType);
    const missingSourceFields = validateSourceProduct(sourceProduct);
    if (missingSourceFields.length > 0) {
      writeReport.failuresOrMissingSourceData.push({
        product: target.targetHandle,
        type: "missing_source_fields",
        fields: missingSourceFields
      });
    }

    try {
      const lookupHandle = target.matchedHandle || target.targetHandle;
      let product = await fetchProductByHandle(client, lookupHandle);
      let action = "updated";

      if (!product) {
        product = await createProduct(client, target.targetHandle, sourceProduct, productType);
        action = "created";
      }

      await updateProductCore(client, product.id, target.targetHandle, sourceProduct, productType);

      let latestProduct = await fetchProductByHandle(client, target.targetHandle);
      if (!latestProduct && lookupHandle !== target.targetHandle) {
        latestProduct = await fetchProductByHandle(client, lookupHandle);
      }

      if (!latestProduct) {
        throw new Error(`Could not refetch product after core update for ${target.targetHandle}`);
      }

      const variantNodes = latestProduct.variants?.nodes || [];
      let variantStrategy = "preserved";

      if (variantNodes.length === 1) {
        await updateSingleVariant(client, latestProduct.id, variantNodes[0].id, target.targetHandle, sourceProduct);
        variantStrategy = sourceProduct.sku ? "single_variant_synced" : "single_variant_price_only";
      } else if (variantNodes.length > 1) {
        variantStrategy = "multi_variant_preserved";
      }

      const collectionHandles = await syncCollections(client, latestProduct.id, desiredCollections);

      if (publication) {
        await publishResourceToPublication(client, latestProduct.id, publication.id);
      }

      const desiredHighlights = featureHighlightsFromSource(sourceProduct);
      const desiredSpecRows = specRowsFromSource(sourceProduct);
      const desiredCompatibilityEntries = compatibilityEntriesFromSource(sourceProduct);
      const desiredDownloads = downloadsFromSource(sourceProduct);

      const specIds = [];
      for (const specRow of desiredSpecRows) {
        const metaHandle = `${target.targetHandle}-spec-${String(specRow.sortOrder).padStart(2, "0")}-${slugify(specRow.label)}`;
        const id = await upsertMetaobject(client, specRowsByHandle, {
          type: "ezquest_spec_row",
          handle: metaHandle,
          fields: [
            { key: "label", value: specRow.label },
            { key: "spec_value", value: specRow.value },
            { key: "sort_order", value: String(specRow.sortOrder) }
          ]
        });
        specIds.push(id);
      }

      const downloadIds = [];
      for (const download of desiredDownloads) {
        const metaHandle = `${target.targetHandle}-download-${String(download.sortOrder).padStart(2, "0")}-${slugify(download.title)}`;
        const id = await upsertMetaobject(client, downloadsByHandle, {
          type: "ezquest_download",
          handle: metaHandle,
          fields: [
            { key: "title", value: download.title },
            { key: "download_type", value: download.downloadType },
            { key: "external_url", value: download.externalUrl },
            { key: "button_label", value: download.buttonLabel },
            { key: "products", value: buildReferenceValue([latestProduct.id]) },
            { key: "sort_order", value: String(download.sortOrder) }
          ]
        });
        downloadIds.push(id);
      }

      const compatibilityIds = [];
      for (const entry of desiredCompatibilityEntries) {
        const metaHandle = `${target.targetHandle}-compat-${String(entry.sortOrder).padStart(2, "0")}-${slugify(entry.title)}`;
        const fields = [
          { key: "title", value: entry.title },
          { key: "products", value: buildReferenceValue([latestProduct.id]) },
          { key: "sort_order", value: String(entry.sortOrder) }
        ];

        if (entry.platform) {
          fields.push({ key: "platform", value: entry.platform });
        }

        if (entry.summary) {
          fields.push({ key: "summary", value: entry.summary });
        }

        const id = await upsertMetaobject(client, compatibilityByHandle, {
          type: "ezquest_compatibility_entry",
          handle: metaHandle,
          fields
        });
        compatibilityIds.push(id);
      }

      await setProductMetafields(client, [
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "support_summary",
          type: "rich_text_field",
          value: richTextFromFragment(sourceProduct.tabs?.Highlight || "")
        },
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "compatibility_summary",
          type: "rich_text_field",
          value: richTextFromFragment(sourceProduct.tabs?.Compatibility || "")
        },
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "feature_highlights",
          type: "list.single_line_text_field",
          value: JSON.stringify(desiredHighlights)
        },
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "spec_rows",
          type: "list.metaobject_reference",
          value: buildReferenceValue(specIds)
        },
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "downloads",
          type: "list.metaobject_reference",
          value: buildReferenceValue(downloadIds)
        },
        {
          ownerId: latestProduct.id,
          namespace: "ezquest",
          key: "compatibility_entries",
          type: "list.metaobject_reference",
          value: buildReferenceValue(compatibilityIds)
        }
      ], target.targetHandle);

      const withMedia = await fetchProductByHandle(client, target.targetHandle);
      const existingMediaIds = (withMedia?.media?.nodes || []).map((node) => node.id).filter(Boolean);
      if (existingMediaIds.length > 0) {
        await deleteProductMedia(client, withMedia.id, existingMediaIds, target.targetHandle);
      }

      const createdMedia = await createProductMedia(client, withMedia?.id || latestProduct.id, target.targetHandle, sourceProduct);
      const verification = await fetchProductByHandle(client, target.targetHandle);

      if (!verification) {
        throw new Error(`Verification failed for ${target.targetHandle}`);
      }

      const adminCheck = {
        product: target.targetHandle,
        status: verification.status,
        vendor: verification.vendor,
        productType: verification.productType,
        variantStrategy,
        mediaCount: verification.media?.nodes?.length || 0,
        metafieldKeys: (verification.metafields?.nodes || []).map((node) => node.key).sort(),
        collectionHandles: (verification.collections?.nodes || []).map((node) => node.handle).sort()
      };

      if (action === "created") {
        writeReport.productsCreated.push({
          handle: target.targetHandle,
          title: sourceProduct.sourceTitle,
          sku: sourceProduct.sku || null
        });
      } else {
        writeReport.productsUpdated.push({
          handle: target.targetHandle,
          title: sourceProduct.sourceTitle,
          matchedExistingHandle: target.matchedHandle || target.targetHandle,
          skuPreserved: !sourceProduct.sku && variantStrategy !== "single_variant_synced"
        });
      }

      writeReport.imagesImportedPerProduct.push({
        product: target.targetHandle,
        importedCount: createdMedia.length,
        sourceImageCount: uniqueUrls(sourceProduct.galleryImages || []).length,
        featuredImage: uniqueUrls(sourceProduct.galleryImages || [])[0] || null
      });
      writeReport.metafieldsMetaobjectsPopulatedPerProduct.push({
        product: target.targetHandle,
        metafields: [
          "ezquest.feature_highlights",
          "ezquest.spec_rows",
          "ezquest.support_summary",
          "ezquest.compatibility_summary",
          "ezquest.compatibility_entries",
          "ezquest.downloads"
        ],
        metaobjects: {
          specRows: specIds.length,
          downloads: downloadIds.length,
          compatibilityEntries: compatibilityIds.length
        }
      });
      writeReport.collectionAssignmentsCompleted.push({
        product: target.targetHandle,
        collections: collectionHandles
      });
      writeReport.storefrontVerificationResults.adminChecks.push(adminCheck);
    } catch (error) {
      writeReport.failuresOrMissingSourceData.push({
        product: target.targetHandle,
        type: "migration_failure",
        message: error.message
      });
    }
  }

  const migratedHandles = [
    ...writeReport.productsCreated.map((entry) => entry.handle),
    ...writeReport.productsUpdated.map((entry) => entry.handle)
  ];

  for (const handle of migratedHandles) {
    const metafieldsEntry = writeReport.metafieldsMetaobjectsPopulatedPerProduct.find((entry) => entry.product === handle);
    const downloadsEntry = writeReport.metafieldsMetaobjectsPopulatedPerProduct.find((entry) => entry.product === handle);
    const sourceProduct = sourceProducts.find((product) => normalizeHandle(product.sourceHandle) === handle);

    try {
      const storefrontCheck = await verifyStorefrontProduct(handle, {
        specCount: metafieldsEntry?.metaobjects?.specRows || 0,
        compatibilityCount: metafieldsEntry?.metaobjects?.compatibilityEntries || 0,
        downloadCount: downloadsEntry?.metaobjects?.downloads || 0,
        downloadTitles: downloadsFromSource(sourceProduct || {}).map((entry) => entry.title)
      });
      writeReport.storefrontVerificationResults.productPages.push(storefrontCheck);
    } catch (error) {
      writeReport.storefrontVerificationResults.productPages.push({
        handle,
        status: 0,
        error: error.message
      });
    }
  }

  const productHandlesByCollection = new Map();
  for (const entry of writeReport.collectionAssignmentsCompleted) {
    for (const collectionHandle of entry.collections) {
      if (!productHandlesByCollection.has(collectionHandle)) {
        productHandlesByCollection.set(collectionHandle, []);
      }
      productHandlesByCollection.get(collectionHandle).push(entry.product);
    }
  }

  for (const [collectionHandle, productHandles] of productHandlesByCollection.entries()) {
    try {
      writeReport.storefrontVerificationResults.collectionPages.push(
        await verifyStorefrontCollection(collectionHandle, productHandles)
      );
    } catch (error) {
      writeReport.storefrontVerificationResults.collectionPages.push({
        handle: collectionHandle,
        status: 0,
        error: error.message
      });
    }
  }

  writeReport.compareEligibleFamiliesUnlocked = computeCompareFamilies(migratedHandles);
  writeReport.isComplete =
    writeReport.productsSkippedForManualReview.length === 1 &&
    writeReport.failuresOrMissingSourceData.every((entry) => entry.type !== "migration_failure");

  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.log(JSON.stringify(writeReport, null, 2));
}

run().catch((error) => {
  writeReport.failuresOrMissingSourceData.push({
    product: "global",
    type: "migration_failure",
    message: error.message
  });
  writeReport.isComplete = false;
  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.error(error.stack || error.message);
  process.exit(1);
});
