import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");

const PREVIEW_BASE_URL = process.env.EZQ_PREVIEW_BASE_URL || "http://127.0.0.1:9292";
const OUTPUT_PATH = "/tmp/ezq-final-remaining-migration-verification.json";
const REPORT_PATH = "/tmp/ezq-migration-report.json";
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

function listItemsFromHtml(fragment = "") {
  return [...String(fragment).matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => decodeHtml(match[1])).filter(Boolean);
}

function downloadsFromSource(sourceProduct) {
  const explicit = Array.isArray(sourceProduct.downloads) ? sourceProduct.downloads : [];
  const fallback = [...String(sourceProduct.tabs?.Downloads || "").matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)].map((match) => ({
    title: decodeHtml(match[2]),
    url: match[1]
  }));

  return explicit.length > 0 ? explicit : fallback;
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
          handle
          title
          status
          vendor
          productType
          collections(first: 20) {
            nodes {
              handle
            }
          }
          media(first: 50) {
            nodes {
              ... on MediaImage {
                id
              }
            }
          }
          metafields(first: 80, namespace: "ezquest") {
            nodes {
              key
            }
          }
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
    const data = await client.graphql(query, { after }, { label: "Final remaining migration verification" });
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);

  return products;
}

function classifyRemainingTargets(sourceProducts, liveProducts) {
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
    const targetHandle = normalizeHandle(sourceProduct.sourceHandle);
    const skuMatches = [...new Map(
      (sourceProduct.skuList || [])
        .map((sku) => skuMap.get(String(sku).toUpperCase()))
        .filter(Boolean)
        .map((product) => [product.handle, product])
    ).values()];
    const handleMatch = handleMap.get(targetHandle) || handleMap.get(normalizeHandle(sourceProduct.sourceHandle)) || null;
    const titleMatch = titleMap.get(normalizeText(sourceProduct.sourceTitle)) || null;

    let status = "SAFE_CREATE";
    let matchedHandle = null;

    if (targetHandle === "usb-c-to-usb-3-mini-adapter") {
      status = "MANUAL_REVIEW";
    } else if (handleMatch) {
      status = "SAFE_UPDATE";
      matchedHandle = handleMatch.handle;
    } else if (skuMatches.length === 1) {
      status = "SAFE_UPDATE";
      matchedHandle = skuMatches[0].handle;
    } else if (skuMatches.length > 1) {
      status = "MANUAL_REVIEW";
      matchedHandle = skuMatches.map((product) => product.handle).join(", ");
    } else if (titleMatch) {
      status = "SAFE_UPDATE";
      matchedHandle = titleMatch.handle;
    }

    if (status === "SAFE_UPDATE" && COMPLETED_HANDLES.has(matchedHandle)) {
      continue;
    }

    rows.push({
      sourceHandle: sourceProduct.sourceHandle,
      targetHandle,
      title: sourceProduct.sourceTitle,
      status,
      matchedHandle,
      sourceProduct
    });
  }

  return rows;
}

async function verifyProductPage(handle, sourceProduct) {
  const response = await fetch(`${PREVIEW_BASE_URL}/products/${handle}`);
  const html = await response.text();
  const downloadCount = downloadsFromSource(sourceProduct).length;

  return {
    handle,
    status: response.status,
    storySectionPresent: html.includes("product-story-section"),
    fallbackContentUsed: STORY_FALLBACK_STRINGS.some((value) => html.includes(value)),
    specsRendered: listItemsFromHtml(sourceProduct.tabs?.Specifications || "").length > 0 ? html.includes("spec-label") : true,
    compatibilityRendered: listItemsFromHtml(sourceProduct.tabs?.Compatibility || "").length > 0 ? html.includes("compatibility-card") : true,
    downloadsRendered: downloadCount > 0 ? html.includes("Find downloads") || html.includes(`${downloadCount} download`) : true
  };
}

async function verifyCollectionPage(handle, productHandles) {
  const response = await fetch(`${PREVIEW_BASE_URL}/collections/${handle}`);
  const html = await response.text();

  return {
    handle,
    status: response.status,
    productsFound: productHandles.filter((productHandle) => html.includes(productHandle))
  };
}

function compareFamiliesUnlocked(createdHandles) {
  const createdSet = new Set(createdHandles);
  const families = [];

  if (
    [
      "usb-c-to-hdmi-4k-60hz-adapter",
      "usb-c-to-displayport-4k-60hz-adapter",
      "usb-c-to-dvi-adapter",
      "x40013-usb-c-to-vga-adapter"
    ].every((handle) => createdSet.has(handle))
  ) {
    families.push("usb-c-display-adapters");
  }

  if (
    [
      "usb-4-dual-display-8-in-1-hub-pro-series",
      "usb-c-dual-display-12-in-1-multimedia-hub-pro-series",
      "usb-c-multimedia-10-in-1-gen-2-hub",
      "usb-c-gen-2-hub-adapter-7-ports",
      "usb-c-multimedia-hub-adapter-8-ports",
      "dual-hdmi-usb-c-multimedia-hub-adapter-12-ports",
      "dual-usb-c-multimedia-hub-13-ports",
      "x40225-usb-c-dual-hdmi-multimedia-hub-adapter-5-ports-with-power-delivery-3-0",
      "usb-c-multimedia-hub-adapter-8-ports-with-4k-60hz-power-delivery-3"
    ].some((handle) => createdSet.has(handle))
  ) {
    families.push("usb-c-mobile-hubs");
  }

  if (createdSet.has("ultimatepower-65w-gan-usb-c-pd-wall-charger") && createdSet.has("mini-30w-gan-usb-c-pd-wall-charger")) {
    families.push("ultimatepower-wall-chargers-expansion");
  }

  if (
    createdSet.has("duraguard-usb-c-right-angled-charge-sync-100w-1-2-meter-cable") &&
    createdSet.has("duraguard-coiled-usb-c-charge-sync-100w-1-5-meter-black-cable")
  ) {
    families.push("duraguard-charge-and-sync-cables-expanded");
  }

  return families;
}

async function run() {
  const sourceReport = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  const liveProducts = await listAllProducts(client);
  const rows = classifyRemainingTargets(sourceReport.sourceProducts || [], liveProducts);
  const handleMap = new Map(liveProducts.map((product) => [normalizeHandle(product.handle), product]));
  const manual = rows.filter((row) => row.status === "MANUAL_REVIEW");
  const safe = rows.filter((row) => row.status !== "MANUAL_REVIEW");

  const created = [];
  const updated = [];
  const images = [];
  const metafields = [];
  const collections = [];
  const storefrontProducts = [];

  for (const row of safe) {
    const lookupHandle = row.matchedHandle || row.targetHandle;
    const product = handleMap.get(normalizeHandle(lookupHandle));
    if (!product) {
      continue;
    }

    if (row.status === "SAFE_UPDATE") {
      updated.push({
        handle: product.handle,
        title: product.title
      });
    } else {
      created.push({
        handle: product.handle,
        title: product.title
      });
    }

    images.push({
      product: product.handle,
      importedCount: product.media?.nodes?.length || 0,
      sourceImageCount: (row.sourceProduct.galleryImages || []).length
    });
    metafields.push({
      product: product.handle,
      metafieldKeys: (product.metafields?.nodes || []).map((entry) => entry.key).sort()
    });
    collections.push({
      product: product.handle,
      collections: (product.collections?.nodes || []).map((entry) => entry.handle).sort()
    });
    storefrontProducts.push(await verifyProductPage(product.handle, row.sourceProduct));
  }

  const storefrontCollections = [];
  const uniqueCollectionHandles = [...new Set(collections.flatMap((entry) => entry.collections))];

  for (const collectionHandle of uniqueCollectionHandles) {
    const productHandles = collections
      .filter((entry) => entry.collections.includes(collectionHandle))
      .map((entry) => entry.product);

    storefrontCollections.push(await verifyCollectionPage(collectionHandle, productHandles));
  }

  const missing = [];
  for (const row of safe) {
    const fields = [];
    if (!row.sourceProduct.shortDescription) {
      fields.push("short description");
    }
    if (!row.sourceProduct.sku && (!Array.isArray(row.sourceProduct.skuList) || row.sourceProduct.skuList.length === 0)) {
      fields.push("sku");
    }
    if (fields.length > 0) {
      missing.push({
        product: row.targetHandle,
        fields
      });
    }
  }

  const result = {
    processed: rows.length,
    created,
    updated,
    manual,
    images,
    metafields,
    collections,
    storefrontProducts,
    storefrontCollections,
    compareFamilies: compareFamiliesUnlocked(created.map((entry) => entry.handle)),
    missing
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        path: OUTPUT_PATH,
        processed: result.processed,
        created: result.created.length,
        updated: result.updated.length,
        manual: result.manual.length,
        storefrontProducts: result.storefrontProducts.length,
        storefrontCollections: result.storefrontCollections.length
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
