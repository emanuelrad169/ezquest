import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");
const { findPublicationByName, publishResourceToPublication } = require("./lib/publications");

const REPORT_PATH = "/tmp/ezq-migration-report.json";
const WRITE_REPORT_PATH = "/tmp/ezq-ultimatepower-create-report.json";
const TARGET_HANDLES = [
  "45w-gan-usb-c-pd-wall-charger",
  "65w-gan-usb-c-pd-wall-charger",
  "ultimatepower-90w-gan-usb-c-pd-wall-charger",
  "ultimatepower-120w-gan-usb-c-pd-wall-charger"
];
const REQUIRED_COLLECTION_HANDLE = "chargers-power";
const OPTIONAL_SUBCOLLECTION_HANDLES = ["wall-chargers"];

const writeReport = {
  productsCreated: [],
  sourceUrlsUsed: [],
  imagesImportedPerProduct: [],
  metafieldsMetaobjectsPopulatedPerProduct: [],
  missingOrIncompleteData: [],
  validationResult: {
    tokenVerified: false,
    productCountVerified: false,
    collectionAssignmentsVerified: false,
    storefrontChecks: []
  },
  readyForBatch4Compare: false
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
    .slice(0, 50);
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

async function createProduct(client, sourceProduct) {
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
        handle: sourceProduct.sourceHandle,
        vendor: "EZQuest",
        productType: "Charger",
        status: "ACTIVE",
        descriptionHtml: combinedDescriptionHtml(sourceProduct)
      }
    },
    { label: `Create product ${sourceProduct.sourceHandle}` }
  );

  client.assertUserErrors(data.productCreate.userErrors, `Create product ${sourceProduct.sourceHandle}`);
  return data.productCreate.product;
}

async function updateProductCore(client, productId, sourceProduct) {
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
        vendor: "EZQuest",
        productType: "Charger",
        status: "ACTIVE",
        descriptionHtml: combinedDescriptionHtml(sourceProduct)
      }
    },
    { label: `Update product core ${sourceProduct.sourceHandle}` }
  );

  client.assertUserErrors(data.productUpdate.userErrors, `Update product core ${sourceProduct.sourceHandle}`);
  return data.productUpdate.product;
}

async function updateSingleVariant(client, productId, variantId, sourceProduct) {
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

  const data = await client.graphql(
    mutation,
    {
      productId,
      variants: [
        {
          id: variantId,
          price: sourceProduct.price || "0.00",
          compareAtPrice: null,
          inventoryPolicy: "CONTINUE",
          inventoryItem: {
            sku: sourceProduct.sku || null,
            tracked: false
          }
        }
      ]
    },
    { label: `Update product variant ${sourceProduct.sourceHandle}` }
  );

  client.assertUserErrors(data.productVariantsBulkUpdate.userErrors, `Update product variant ${sourceProduct.sourceHandle}`);
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

async function setProductMetafields(client, metafields) {
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

  const data = await client.graphql(mutation, { metafields }, { label: "Set EZQ product creation metafields" });
  client.assertUserErrors(data.metafieldsSet.userErrors, "Set EZQ product creation metafields");
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

async function createProductMedia(client, productId, sourceProduct) {
  const imageUrls = uniqueUrls(sourceProduct.galleryImages || []);
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
    { label: `Create media ${sourceProduct.sourceHandle}` }
  );

  client.assertUserErrors(data.productCreateMedia.mediaUserErrors, `Create media ${sourceProduct.sourceHandle}`);
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

async function syncCollections(client, productId) {
  const requiredCollection = await findCollectionDetailByHandle(client, REQUIRED_COLLECTION_HANDLE);
  if (!requiredCollection) {
    throw new Error(`Required collection ${REQUIRED_COLLECTION_HANDLE} was not found`);
  }

  const desiredCollections = [requiredCollection];

  for (const handle of OPTIONAL_SUBCOLLECTION_HANDLES) {
    const collection = await findCollectionDetailByHandle(client, handle);
    if (collection) {
      desiredCollections.push(collection);
    }
  }

  for (const collection of desiredCollections) {
    const existingIds = new Set((collection.products?.nodes || []).map((item) => item.id));
    if (existingIds.has(productId)) {
      continue;
    }
    await addProductsToCollection(client, collection.id, [productId], collection.handle);
  }

  return desiredCollections.map((collection) => collection.handle);
}

function validateSourceProduct(sourceProduct) {
  const missing = [];
  if (!sourceProduct.sourceUrl) {
    missing.push("sourceUrl");
  }
  if (!sourceProduct.sourceTitle) {
    missing.push("title");
  }
  if (!sourceProduct.sourceHandle) {
    missing.push("handle");
  }
  if (!sourceProduct.sku) {
    missing.push("sku");
  }
  if (!sourceProduct.shortDescription) {
    missing.push("short description");
  }
  if (!sourceProduct.tabs?.Highlight) {
    missing.push("highlight");
  }
  if (!sourceProduct.tabs?.Features) {
    missing.push("features");
  }
  if (!sourceProduct.tabs?.Specifications) {
    missing.push("specifications");
  }
  if (!sourceProduct.tabs?.Compatibility) {
    missing.push("compatibility");
  }
  if (uniqueUrls(sourceProduct.galleryImages || []).length === 0) {
    missing.push("gallery images");
  }
  return missing;
}

async function run() {
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  writeReport.validationResult.tokenVerified = true;

  const publication = await findPublicationByName(client, "Online Store");
  const sourceReport = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const sourceByHandle = new Map(sourceReport.sourceProducts.map((product) => [product.sourceHandle, product]));

  const specRowsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_spec_row")).map((entry) => [entry.handle, entry]));
  const downloadsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_download")).map((entry) => [entry.handle, entry]));
  const compatibilityByHandle = new Map((await listMetaobjectsByType(client, "ezquest_compatibility_entry")).map((entry) => [entry.handle, entry]));

  for (const handle of TARGET_HANDLES) {
    const sourceProduct = sourceByHandle.get(handle);
    if (!sourceProduct) {
      throw new Error(`Missing source snapshot for ${handle}`);
    }

    writeReport.sourceUrlsUsed.push({
      handle,
      sourceUrl: sourceProduct.sourceUrl
    });

    const missingSourceFields = validateSourceProduct(sourceProduct);
    if (missingSourceFields.length > 0) {
      writeReport.missingOrIncompleteData.push({
        product: handle,
        missing: missingSourceFields
      });
    }

    let product = await fetchProductByHandle(client, handle);
    let created = false;

    if (!product) {
      product = await createProduct(client, sourceProduct);
      created = true;
    }

    await updateProductCore(client, product.id, sourceProduct);

    const variantId = product.variants?.nodes?.[0]?.id || (await fetchProductByHandle(client, handle))?.variants?.nodes?.[0]?.id;
    if (!variantId) {
      throw new Error(`Missing default variant for ${handle}`);
    }
    await updateSingleVariant(client, product.id, variantId, sourceProduct);

    const collectionHandles = await syncCollections(client, product.id);

    if (publication) {
      await publishResourceToPublication(client, product.id, publication.id);
    }

    const desiredHighlights = featureHighlightsFromSource(sourceProduct);
    const desiredSpecRows = specRowsFromSource(sourceProduct);
    const desiredCompatibilityEntries = compatibilityEntriesFromSource(sourceProduct);
    const desiredDownloads = downloadsFromSource(sourceProduct);

    const specIds = [];
    for (const specRow of desiredSpecRows) {
      const metaHandle = `${handle}-spec-${String(specRow.sortOrder).padStart(2, "0")}-${slugify(specRow.label)}`;
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
      const metaHandle = `${handle}-download-${String(download.sortOrder).padStart(2, "0")}-${slugify(download.title)}`;
      const id = await upsertMetaobject(client, downloadsByHandle, {
        type: "ezquest_download",
        handle: metaHandle,
        fields: [
          { key: "title", value: download.title },
          { key: "download_type", value: download.downloadType },
          { key: "external_url", value: download.externalUrl },
          { key: "button_label", value: download.buttonLabel },
          { key: "products", value: buildReferenceValue([product.id]) },
          { key: "sort_order", value: String(download.sortOrder) }
        ]
      });
      downloadIds.push(id);
    }

    const compatibilityIds = [];
    for (const entry of desiredCompatibilityEntries) {
      const metaHandle = `${handle}-compat-${String(entry.sortOrder).padStart(2, "0")}-${slugify(entry.title)}`;
      const fields = [
        { key: "title", value: entry.title },
        { key: "products", value: buildReferenceValue([product.id]) },
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
      { ownerId: product.id, namespace: "ezquest", key: "support_summary", type: "rich_text_field", value: richTextFromFragment(sourceProduct.tabs.Highlight) },
      { ownerId: product.id, namespace: "ezquest", key: "compatibility_summary", type: "rich_text_field", value: richTextFromFragment(sourceProduct.tabs.Compatibility) },
      { ownerId: product.id, namespace: "ezquest", key: "feature_highlights", type: "list.single_line_text_field", value: JSON.stringify(desiredHighlights) },
      { ownerId: product.id, namespace: "ezquest", key: "spec_rows", type: "list.metaobject_reference", value: buildReferenceValue(specIds) },
      { ownerId: product.id, namespace: "ezquest", key: "downloads", type: "list.metaobject_reference", value: buildReferenceValue(downloadIds) },
      { ownerId: product.id, namespace: "ezquest", key: "compatibility_entries", type: "list.metaobject_reference", value: buildReferenceValue(compatibilityIds) }
    ]);

    const latest = await fetchProductByHandle(client, handle);
    const existingMediaIds = (latest?.media?.nodes || []).map((node) => node.id).filter(Boolean);
    if (existingMediaIds.length > 0) {
      await deleteProductMedia(client, product.id, existingMediaIds, handle);
    }

    const createdMedia = await createProductMedia(client, product.id, sourceProduct);
    const verification = await fetchProductByHandle(client, handle);

    if (!verification) {
      throw new Error(`Verification failed for ${handle}`);
    }

    writeReport.productsCreated.push({
      handle,
      title: sourceProduct.sourceTitle,
      sku: sourceProduct.sku,
      action: created ? "created" : "updated"
    });
    writeReport.imagesImportedPerProduct.push({
      product: handle,
      importedCount: createdMedia.length,
      sourceImageCount: uniqueUrls(sourceProduct.galleryImages || []).length,
      featuredImage: uniqueUrls(sourceProduct.galleryImages || [])[0] || null
    });
    writeReport.metafieldsMetaobjectsPopulatedPerProduct.push({
      product: handle,
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
      },
      collections: collectionHandles
    });
    writeReport.validationResult.storefrontChecks.push({
      product: handle,
      status: verification.status,
      vendor: verification.vendor,
      productType: verification.productType,
      mediaCount: verification.media?.nodes?.length || 0,
      metafieldKeys: (verification.metafields?.nodes || []).map((node) => node.key).sort(),
      collectionHandles: (verification.collections?.nodes || []).map((node) => node.handle).sort(),
      onlineStoreUrl: verification.onlineStoreUrl || null
    });
  }

  writeReport.validationResult.productCountVerified = writeReport.productsCreated.length === TARGET_HANDLES.length;
  writeReport.validationResult.collectionAssignmentsVerified = writeReport.validationResult.storefrontChecks.every((entry) => {
    return Array.isArray(entry.collectionHandles) && entry.collectionHandles.includes(REQUIRED_COLLECTION_HANDLE);
  });

  writeReport.readyForBatch4Compare =
    writeReport.validationResult.tokenVerified &&
    writeReport.validationResult.productCountVerified &&
    writeReport.validationResult.collectionAssignmentsVerified &&
    writeReport.validationResult.storefrontChecks.every((entry) => {
      const keys = new Set(entry.metafieldKeys || []);
      return (
        entry.mediaCount > 0 &&
        keys.has("feature_highlights") &&
        keys.has("spec_rows") &&
        keys.has("support_summary") &&
        keys.has("compatibility_summary") &&
        keys.has("compatibility_entries") &&
        keys.has("downloads")
      );
    });

  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.log(JSON.stringify(writeReport, null, 2));
}

run().catch((error) => {
  writeReport.readyForBatch4Compare = false;
  writeReport.validationResult.error = error.message;
  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.error(error.stack || error.message);
  process.exit(1);
});
