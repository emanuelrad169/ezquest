import fs from "fs/promises";
import path from "path";

const REPORT_PATH = process.env.EZQ_REPORT_PATH || "/tmp/ezq-migration-report.json";
const OUTPUT_ROOT = path.resolve(process.cwd(), "public/ezq-products");
const MANIFEST_PATH = path.join(OUTPUT_ROOT, "manifest.json");

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function stripQuery(url) {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function inferExtension(url, contentType = "") {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();

  if (ext) {
    return ext;
  }

  if (contentType.includes("png")) {
    return ".png";
  }

  if (contentType.includes("webp")) {
    return ".webp";
  }

  if (contentType.includes("gif")) {
    return ".gif";
  }

  return ".jpg";
}

function guessLabel(url, index) {
  if (index === 0) {
    return "hero";
  }

  const filename = path.basename(new URL(url).pathname).toLowerCase();

  if (/(life|lifestyle|context|desk|setup|room|usage|environment)/.test(filename)) {
    return "lifestyle";
  }

  if (/(port|ports|io|side|rear|front|back)/.test(filename)) {
    return "ports";
  }

  if (/(detail|close|macro|texture|material)/.test(filename)) {
    return "detail";
  }

  if (/(diagram|spec|schematic|chart)/.test(filename)) {
    return "diagram";
  }

  if (/(angle|view|left|right|top|bottom)/.test(filename)) {
    return "angle";
  }

  return "gallery";
}

async function ensureEmptyProductDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
  await fs.mkdir(dirPath, { recursive: true });
}

async function downloadImage(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "EZQuest image extractor/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content type: ${contentType || "unknown"}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!buffer.length) {
    throw new Error("Empty response body");
  }

  return {
    buffer,
    contentType
  };
}

async function main() {
  const report = JSON.parse(await fs.readFile(REPORT_PATH, "utf8"));
  const sourceProducts = report.sourceProducts || [];
  const manifest = [];
  const failures = [];
  let totalImagesDownloaded = 0;

  await fs.rm(OUTPUT_ROOT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });

  for (const product of sourceProducts) {
    const productHandle = slugify(product.sourceHandle || product.sourceTitle || "product");
    const productDir = path.join(OUTPUT_ROOT, productHandle);
    const imageUrls = unique((product.galleryImages || []).map(stripQuery));
    const labelCounts = new Map();
    const savedPaths = [];

    await ensureEmptyProductDir(productDir);

    for (let index = 0; index < imageUrls.length; index += 1) {
      const imageUrl = imageUrls[index];

      try {
        const { buffer, contentType } = await downloadImage(imageUrl);
        const baseLabel = guessLabel(imageUrl, index);
        const nextCount = (labelCounts.get(baseLabel) || 0) + 1;
        labelCounts.set(baseLabel, nextCount);

        const label = nextCount === 1 ? baseLabel : `${baseLabel}-${nextCount}`;
        const extension = inferExtension(imageUrl, contentType);
        const filename = `${String(index + 1).padStart(2, "0")}-${label}${extension}`;
        const absolutePath = path.join(productDir, filename);
        const relativePath = path.posix.join("public", "ezq-products", productHandle, filename);

        await fs.writeFile(absolutePath, buffer);
        savedPaths.push(relativePath);
        totalImagesDownloaded += 1;
      } catch (error) {
        failures.push({
          product_handle: productHandle,
          source_url: product.sourceUrl,
          image_url: imageUrl,
          error: error.message
        });
      }
    }

    manifest.push({
      product_handle: productHandle,
      source_url: product.sourceUrl,
      image_count: savedPaths.length,
      hero_image: savedPaths[0] || "",
      image_paths: savedPaths
    });

    if (savedPaths.length !== imageUrls.length) {
      failures.push({
        product_handle: productHandle,
        source_url: product.sourceUrl,
        error: `Downloaded ${savedPaths.length} of ${imageUrls.length} expected images`
      });
    }
  }

  await fs.writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_products: manifest.length,
        total_images: totalImagesDownloaded,
        failed_downloads: failures.length,
        products: manifest
      },
      null,
      2
    )}\n`
  );

  console.log(
    JSON.stringify(
      {
        totalProductsProcessed: manifest.length,
        totalImagesDownloaded,
        missingOrFailedDownloads: failures,
        manifestFilePath: MANIFEST_PATH,
        complete: failures.length === 0
      },
      null,
      2
    )
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
