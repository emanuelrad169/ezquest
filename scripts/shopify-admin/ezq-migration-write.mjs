import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");

const REPORT_PATH = "/tmp/ezq-migration-report.json";
const WRITE_REPORT_PATH = "/tmp/ezq-migration-write-report.json";

const SAFE_MATCH_HANDLES = new Set([
  "pro-series-usb-c-5in1-hub",
  "duraguard-usb-c-to-usb-a-charge-and-sync-cable",
  "duraguard-stereo-audio-cable",
  "ultraslim-wall-charger-dual-usb-c-70w",
  "worldtravel-65w-gan-5-port-pd-wall-charger",
  "worldtravel-35w-gan-5-port-pd-wall-charger"
]);

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

function downloadsFromSource(sourceProduct) {
  return (sourceProduct.downloads || []).map((entry, index) => {
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

async function fetchProductByHandle(client, handle) {
  const query = `
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          descriptionHtml
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

  const data = await client.graphql(mutation, { metafields }, { label: "Set EZQ migration metafields" });
  client.assertUserErrors(data.metafieldsSet.userErrors, "Set EZQ migration metafields");
  return data.metafieldsSet.metafields;
}

async function updateProductCore(client, productId, title, descriptionHtml) {
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
        title,
        descriptionHtml
      }
    },
    { label: `Update product core ${title}` }
  );

  client.assertUserErrors(data.productUpdate.userErrors, `Update product core ${title}`);
  return data.productUpdate.product;
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

async function createProductMedia(client, productId, handle, title, imageUrls) {
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
        alt: `${title} image ${index + 1}`,
        mediaContentType: "IMAGE",
        originalSource: url
      }))
    },
    { label: `Create media ${handle}` }
  );

  client.assertUserErrors(data.productCreateMedia.mediaUserErrors, `Create media ${handle}`);
  return data.productCreateMedia.media || [];
}

const writeReport = {
  tokenVerificationResult: "pending",
  productsSuccessfullyUpdated: [],
  imagesImportedPerProduct: [],
  metafieldsMetaobjectsUpdatedPerProduct: [],
  writeFailures: [],
  storefrontReadyVerificationNotes: [],
  safeMatchWritePassComplete: false
};

async function run() {
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  const sourceReport = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const sourceByHandle = new Map(sourceReport.sourceProducts.map((product) => [product.sourceHandle, product]));
  const matches = sourceReport.matched.filter((match) => SAFE_MATCH_HANDLES.has(match.matchedHandle));

  console.log("[ezq-write] Loading existing metaobjects");
  const specRowsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_spec_row")).map((entry) => [entry.handle, entry]));
  const downloadsByHandle = new Map((await listMetaobjectsByType(client, "ezquest_download")).map((entry) => [entry.handle, entry]));
  const compatibilityByHandle = new Map((await listMetaobjectsByType(client, "ezquest_compatibility_entry")).map((entry) => [entry.handle, entry]));

  writeReport.tokenVerificationResult = "success";

  for (const match of matches) {
    console.log(`[ezq-write] Processing ${match.matchedHandle}`);
    const sourceProduct = sourceByHandle.get(match.sourceHandle);
    if (!sourceProduct) {
      throw new Error(`Missing source snapshot for ${match.sourceHandle}`);
    }

    const product = await fetchProductByHandle(client, match.matchedHandle);
    if (!product) {
      throw new Error(`Matched Shopify product not found for ${match.matchedHandle}`);
    }

    const desiredHighlights = featureHighlightsFromSource(sourceProduct);
    const desiredSpecRows = specRowsFromSource(sourceProduct);
    const desiredCompatibilityEntries = compatibilityEntriesFromSource(sourceProduct);
    const desiredDownloads = downloadsFromSource(sourceProduct);
    const desiredImages = sourceProduct.galleryImages || [];

    console.log(`[ezq-write] Updating core product ${match.matchedHandle}`);
    await updateProductCore(client, product.id, sourceProduct.sourceTitle, combinedDescriptionHtml(sourceProduct));

    const specIds = [];
    console.log(`[ezq-write] Upserting ${desiredSpecRows.length} spec rows for ${match.matchedHandle}`);
    for (const specRow of desiredSpecRows) {
      const handle = `${match.matchedHandle}-spec-${String(specRow.sortOrder).padStart(2, "0")}-${slugify(specRow.label)}`;
      const id = await upsertMetaobject(client, specRowsByHandle, {
        type: "ezquest_spec_row",
        handle,
        fields: [
          { key: "label", value: specRow.label },
          { key: "spec_value", value: specRow.value },
          { key: "sort_order", value: String(specRow.sortOrder) }
        ]
      });
      specIds.push(id);
    }

    const downloadIds = [];
    console.log(`[ezq-write] Upserting ${desiredDownloads.length} downloads for ${match.matchedHandle}`);
    for (const download of desiredDownloads) {
      const handle = `${match.matchedHandle}-download-${String(download.sortOrder).padStart(2, "0")}-${slugify(download.title)}`;
      const id = await upsertMetaobject(client, downloadsByHandle, {
        type: "ezquest_download",
        handle,
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
    console.log(`[ezq-write] Upserting ${desiredCompatibilityEntries.length} compatibility entries for ${match.matchedHandle}`);
    for (const entry of desiredCompatibilityEntries) {
      const handle = `${match.matchedHandle}-compat-${String(entry.sortOrder).padStart(2, "0")}-${slugify(entry.title)}`;
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
        handle,
        fields
      });
      compatibilityIds.push(id);
    }

    console.log(`[ezq-write] Setting metafields for ${match.matchedHandle}`);
    await setProductMetafields(client, [
      { ownerId: product.id, namespace: "ezquest", key: "support_summary", type: "rich_text_field", value: richTextFromFragment(sourceProduct.tabs.Highlight) },
      { ownerId: product.id, namespace: "ezquest", key: "compatibility_summary", type: "rich_text_field", value: richTextFromFragment(sourceProduct.tabs.Compatibility) },
      { ownerId: product.id, namespace: "ezquest", key: "feature_highlights", type: "list.single_line_text_field", value: JSON.stringify(desiredHighlights) },
      { ownerId: product.id, namespace: "ezquest", key: "spec_rows", type: "list.metaobject_reference", value: buildReferenceValue(specIds) },
      { ownerId: product.id, namespace: "ezquest", key: "downloads", type: "list.metaobject_reference", value: buildReferenceValue(downloadIds) },
      { ownerId: product.id, namespace: "ezquest", key: "compatibility_entries", type: "list.metaobject_reference", value: buildReferenceValue(compatibilityIds) }
    ]);

    const existingMediaIds = (product.media?.nodes || []).map((node) => node.id).filter(Boolean);
    if (existingMediaIds.length > 0) {
      console.log(`[ezq-write] Replacing ${existingMediaIds.length} existing media items for ${match.matchedHandle}`);
      await deleteProductMedia(client, product.id, existingMediaIds, match.matchedHandle);
    }

    console.log(`[ezq-write] Creating ${desiredImages.length} media items for ${match.matchedHandle}`);
    const createdMedia = await createProductMedia(client, product.id, match.matchedHandle, sourceProduct.sourceTitle, desiredImages);
    console.log(`[ezq-write] Verifying ${match.matchedHandle}`);
    const verification = await fetchProductByHandle(client, match.matchedHandle);

    writeReport.productsSuccessfullyUpdated.push(match.matchedHandle);
    writeReport.imagesImportedPerProduct.push({
      product: match.matchedHandle,
      importedCount: createdMedia.length,
      sourceImageCount: desiredImages.length
    });
    writeReport.metafieldsMetaobjectsUpdatedPerProduct.push({
      product: match.matchedHandle,
      metafields: [
        "ezquest.support_summary",
        "ezquest.compatibility_summary",
        "ezquest.feature_highlights",
        "ezquest.spec_rows",
        "ezquest.downloads",
        "ezquest.compatibility_entries"
      ],
      metaobjects: {
        specRows: specIds.length,
        downloads: downloadIds.length,
        compatibilityEntries: compatibilityIds.length
      }
    });
    writeReport.storefrontReadyVerificationNotes.push({
      product: match.matchedHandle,
      title: verification?.title || sourceProduct.sourceTitle,
      mediaCount: verification?.media?.nodes?.length || 0,
      metafieldKeys: (verification?.metafields?.nodes || []).map((node) => node.key).sort()
    });
  }

  writeReport.safeMatchWritePassComplete = true;
  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.log(JSON.stringify(writeReport, null, 2));
}

run().catch((error) => {
  if (writeReport.tokenVerificationResult === "pending") {
    writeReport.tokenVerificationResult = "failed";
  }
  writeReport.writeFailures.push({ message: error.message });
  writeReport.safeMatchWritePassComplete = false;
  fs.writeFileSync(WRITE_REPORT_PATH, JSON.stringify(writeReport, null, 2));
  console.error(error.stack || error.message);
  process.exit(1);
});
