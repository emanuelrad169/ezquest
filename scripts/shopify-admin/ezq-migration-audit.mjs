import fs from "fs";
import path from "path";

const CATEGORY_URLS = [
  "https://ezq.com/usb-c-hubs-docks.html",
  "https://ezq.com/usb-c-cables.html",
  "https://ezq.com/usb-c-adapters.html",
  "https://ezq.com/usb-c-card-reader.html",
  "https://ezq.com/usb-c-enclosure.html",
  "https://ezq.com/hdmi-cables-adapters.html",
  "https://ezq.com/displayport-cables-adapters.html",
  "https://ezq.com/mini-displayport-thunderbolt-3.html",
  "https://ezq.com/audio-cables-adapters.html",
  "https://ezq.com/wall-chargers.html",
  "https://ezq.com/car-chargers.html"
];

const OUTPUT_PATH = "/tmp/ezq-migration-report.json";
const CACHE_DIR = process.env.EZQ_CACHE_DIR || "/tmp/ezq-migration-cache";
const PREVIEW_PRODUCTS_PATH = process.env.EZQ_PREVIEW_PRODUCTS_PATH || "/tmp/ezq-preview-products.json";

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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugFromUrl(url) {
  return new URL(url).pathname.split("/").pop().replace(/\.(html?|htm)$/i, "");
}

function normalizeTitle(text = "") {
  return decodeHtml(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSkuList(text = "") {
  return unique(
    String(text)
      .split(/[\s,/|]+/)
      .map((value) => value.trim())
      .filter((value) => /[a-z0-9]/i.test(value))
      .map((value) => value.toUpperCase())
  );
}

function cachePathForUrl(url) {
  return path.join(CACHE_DIR, new URL(url).pathname.split("/").pop());
}

function fetchText(url) {
  const cachePath = cachePathForUrl(url);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`Missing cached source HTML for ${url} at ${cachePath}`);
  }

  return fs.readFileSync(cachePath, "utf8");
}

async function discoverSourceProducts() {
  const productsByUrl = new Map();

  for (const categoryUrl of CATEGORY_URLS) {
    const html = fetchText(categoryUrl);
    const categoryTitle = decodeHtml((html.match(/<title>([^<]+)<\/title>/i) || [])[1] || slugFromUrl(categoryUrl));
    const matches = html.matchAll(/<a class="squarelink" href="([^"]+)" title="([^"]*)">/gi);

    for (const match of matches) {
      const sourceUrl = match[1];
      const existing = productsByUrl.get(sourceUrl) || {
        sourceUrl,
        sourceHandle: slugFromUrl(sourceUrl),
        sourceTitle: decodeHtml(match[2]),
        categories: []
      };

      existing.categories.push(categoryTitle);
      if (!existing.sourceTitle) {
        existing.sourceTitle = decodeHtml(match[2]);
      }

      productsByUrl.set(sourceUrl, existing);
    }
  }

  return [...productsByUrl.values()].map((product) => ({
    ...product,
    categories: unique(product.categories)
  }));
}

function extractImages(html) {
  const imageUrls = [];

  for (const match of html.matchAll(/largeimage:'([^']+)'/gi)) {
    imageUrls.push(match[1]);
  }

  const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/i) || [])[1];
  if (ogImage) {
    imageUrls.unshift(ogImage);
  }

  return unique(imageUrls);
}

function extractDownloads(downloadsHtml) {
  return [...downloadsHtml.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)].map((match) => ({
    title: decodeHtml(match[2]),
    url: match[1]
  }));
}

function extractTabContent(html) {
  const navLabels = new Map();

  for (const match of html.matchAll(/<a href="#([^"]+)"[^>]*>([^<]+)<\/a>/gi)) {
    navLabels.set(match[1], decodeHtml(match[2]));
  }

  const tabs = {};
  const panels = html.matchAll(
    /<div role="tabpanel" class="tab-pane[^"]*" id="([^"]+)">([\s\S]*?)(?=<div role="tabpanel" class="tab-pane|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/gi
  );

  for (const match of panels) {
    tabs[match[1]] = {
      id: match[1],
      label: navLabels.get(match[1]) || match[1],
      html: match[2].trim(),
      text: decodeHtml(match[2])
    };
  }

  return tabs;
}

async function hydrateSourceProducts(products) {
  const hydrated = [];

  for (const product of products) {
    const html = fetchText(product.sourceUrl);
    const tabs = extractTabContent(html);
    const downloadsHtml = tabs.field22?.html || tabs.downloads?.html || "";
    const images = extractImages(html);

    hydrated.push({
      ...product,
      sourceTitle: decodeHtml((html.match(/<h1 id="bbnme"[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || product.sourceTitle),
      sku: decodeHtml((html.match(/content="sku:([^"]+)"/i) || [])[1] || ""),
      skuList: parseSkuList(decodeHtml((html.match(/content="sku:([^"]+)"/i) || [])[1] || "")),
      shortDescription: decodeHtml((html.match(/<h2 class="productsubtext">([\s\S]*?)<\/h2>/i) || [])[1] || ""),
      longDescription: tabs.highlights?.text || "",
      price: (html.match(/itemprop="price" class="hidden">\s*([0-9.]+)/i) || [])[1] || "",
      compareAtPrice: "",
      productFamily: product.categories[0] || "",
      variantNames: [],
      featuredImage: images[0] || "",
      galleryImages: images,
      tabs: {
        Features: tabs.materials?.html || "",
        Specifications: tabs.specifications?.html || "",
        Highlight: tabs.highlights?.html || "",
        Compatibility: tabs.field2?.html || "",
        Downloads: downloadsHtml
      },
      downloads: extractDownloads(downloadsHtml)
    });
  }

  return hydrated;
}

async function fetchPreviewProducts() {
  if (!fs.existsSync(PREVIEW_PRODUCTS_PATH)) {
    throw new Error(`Missing cached preview catalog at ${PREVIEW_PRODUCTS_PATH}`);
  }

  const payload = JSON.parse(fs.readFileSync(PREVIEW_PRODUCTS_PATH, "utf8"));
  return payload.products || [];
}

function buildMatchReport(sourceProducts, shopifyProducts) {
  const byHandle = new Map(shopifyProducts.map((product) => [product.handle, product]));
  const byTitle = new Map(shopifyProducts.map((product) => [normalizeTitle(product.title), product]));
  const bySku = new Map();

  for (const product of shopifyProducts) {
    for (const variant of product.variants || []) {
      if (variant.sku) {
        bySku.set(variant.sku, product);
      }
    }
  }

  const matched = [];
  const missing = [];
  const manualReview = [];

  for (const sourceProduct of sourceProducts) {
    let match = null;
    let rule = null;

    if (byHandle.has(sourceProduct.sourceHandle)) {
      match = byHandle.get(sourceProduct.sourceHandle);
      rule = "exact handle";
    } else if ((sourceProduct.skuList || []).some((sku) => bySku.has(sku))) {
      const skuMatches = unique(
        sourceProduct.skuList
          .map((sku) => bySku.get(sku))
          .filter(Boolean)
          .map((product) => product.handle)
      );

      if (skuMatches.length === 1) {
        match = byHandle.get(skuMatches[0]);
        rule = "exact SKU";
      } else if (skuMatches.length > 1) {
        manualReview.push({
          sourceTitle: sourceProduct.sourceTitle,
          sourceHandle: sourceProduct.sourceHandle,
          sourceSku: sourceProduct.sku,
          sourceSkuList: sourceProduct.skuList,
          reason: "Source SKU list maps to multiple Shopify products",
          candidateHandles: skuMatches
        });
        continue;
      }
    } else if (byTitle.has(normalizeTitle(sourceProduct.sourceTitle))) {
      match = byTitle.get(normalizeTitle(sourceProduct.sourceTitle));
      rule = "exact title";
    }

    if (match) {
      matched.push({
        sourceTitle: sourceProduct.sourceTitle,
        sourceHandle: sourceProduct.sourceHandle,
        sourceSku: sourceProduct.sku,
        sourceSkuList: sourceProduct.skuList,
        matchedTitle: match.title,
        matchedHandle: match.handle,
        rule
      });
    } else {
      missing.push({
        sourceTitle: sourceProduct.sourceTitle,
        sourceHandle: sourceProduct.sourceHandle,
        sourceSku: sourceProduct.sku,
        sourceSkuList: sourceProduct.skuList,
        categories: sourceProduct.categories
      });
    }
  }

  return { matched, missing, manualReview };
}

const sourceProducts = await hydrateSourceProducts(await discoverSourceProducts());
const shopifyProducts = await fetchPreviewProducts();
const { matched, missing, manualReview } = buildMatchReport(sourceProducts, shopifyProducts);

const report = {
  generatedAt: new Date().toISOString(),
  sourceCount: sourceProducts.length,
  shopifyCount: shopifyProducts.length,
  matchedCount: matched.length,
  missingCount: missing.length,
  manualReviewCount: manualReview.length,
  matched,
  missing,
  manualReview,
  sourceProducts
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));

console.log(JSON.stringify({
  sourceCount: report.sourceCount,
  shopifyCount: report.shopifyCount,
  matchedCount: report.matchedCount,
  missingCount: report.missingCount,
  manualReviewCount: report.manualReviewCount,
  matched,
  manualReview,
  missingSample: missing.slice(0, 20),
  outputPath: OUTPUT_PATH
}, null, 2));
