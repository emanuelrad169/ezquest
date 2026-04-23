#!/usr/bin/env node
/* eslint-disable no-console */

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { loadAdminEnv } = require("./shopify-admin/lib/env");
const { createAdminClient } = require("./shopify-admin/lib/admin-client");

const DEFAULT_IMAGE_DIRS = [
  "public/images/homepage",
  "public/images/collections",
  "public/images/category-cards",
  "public/images/lifestyle",
  "public/images/support",
  "public/images/missing",
  "public/images/promo-banners"
];

const IMAGE_DIRS = process.env.EZQ_IMAGE_DIRS
  ? process.env.EZQ_IMAGE_DIRS.split(path.delimiter).filter(Boolean)
  : DEFAULT_IMAGE_DIRS;

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

main().catch((error) => {
  console.error("FAILED:", error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun: false
  });

  const imagePaths = listImages();
  const results = [];

  for (const [dir, files] of groupByDir(imagePaths)) {
    console.log(`\n--- ${dir} (${files.length} files) ---`);

    for (const filePath of files) {
      const result = await uploadImage(client, filePath);
      results.push(result);
      console.log(`UPLOADED: ${result.filename} -> ${result.cdnUrl || "(processing)"}`);
      await delay(400);
    }
  }

  const urlMap = {};
  const fileMap = {};

  for (const result of results) {
    urlMap[result.filename] = result.cdnUrl;
    fileMap[result.filename] = result;
  }

  fs.writeFileSync("scripts/image-cdn-urls.json", JSON.stringify(urlMap, null, 2) + "\n");
  fs.writeFileSync("scripts/image-shopify-files.json", JSON.stringify(fileMap, null, 2) + "\n");

  console.log("\n=== COMPLETE ===");
  console.log(`Uploaded: ${results.length} / ${imagePaths.length}`);
  console.log("Saved: scripts/image-cdn-urls.json");
  console.log("Saved: scripts/image-shopify-files.json");
}

function listImages() {
  const imagePaths = [];

  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) {
      console.log(`SKIP (not found): ${dir}`);
      continue;
    }

    for (const file of fs.readdirSync(dir).sort()) {
      if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
      imagePaths.push(path.join(dir, file));
    }
  }

  return imagePaths;
}

function groupByDir(imagePaths) {
  const grouped = new Map();

  for (const filePath of imagePaths) {
    const dir = path.dirname(filePath);
    if (!grouped.has(dir)) grouped.set(dir, []);
    grouped.get(dir).push(filePath);
  }

  return grouped.entries();
}

async function uploadImage(client, filePath) {
  const filename = path.basename(filePath);
  const shopifyFilename = `ezquest-${filename}`;
  const mimeType = MIME_TYPES[path.extname(filename).toLowerCase()] || "image/png";
  const buffer = fs.readFileSync(filePath);

  const staged = await createStagedUpload(client, {
    filename: shopifyFilename,
    mimeType,
    fileSize: buffer.length
  });

  await postToStagedTarget(staged, buffer, shopifyFilename, mimeType);

  const file = await createShopifyFile(client, {
    filename: shopifyFilename,
    originalSource: staged.resourceUrl,
    alt: altFromFilename(filename)
  });

  const processed = await pollFile(client, file.id);

  return {
    filename,
    shopifyFilename,
    filePath,
    fileId: processed.id,
    fileStatus: processed.fileStatus,
    cdnUrl: processed.image?.url || processed.preview?.image?.url || null,
    width: processed.image?.width || null,
    height: processed.image?.height || null,
    fileReference: `shopify://shop_images/${shopifyFilename}`
  };
}

async function createStagedUpload(client, { filename, mimeType, fileSize }) {
  const mutation = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }
  `;

  const data = await client.graphql(mutation, {
    input: [{
      resource: "FILE",
      filename,
      mimeType,
      httpMethod: "POST",
      fileSize: String(fileSize)
    }]
  }, { label: `Create staged upload for ${filename}` });

  const result = data.stagedUploadsCreate;
  client.assertUserErrors(result.userErrors, `Create staged upload for ${filename}`);

  if (!result.stagedTargets || result.stagedTargets.length === 0) {
    throw new Error(`No staged upload target returned for ${filename}.`);
  }

  return result.stagedTargets[0];
}

async function postToStagedTarget(target, buffer, filename, mimeType) {
  const form = new FormData();

  for (const parameter of target.parameters) {
    form.append(parameter.name, parameter.value);
  }

  form.append("file", new Blob([buffer], { type: mimeType }), filename);

  const response = await fetch(target.url, {
    method: "POST",
    body: form
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Staged upload failed for ${filename}: HTTP ${response.status} ${body}`);
  }
}

async function createShopifyFile(client, { filename, originalSource, alt }) {
  const mutation = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          alt
          fileStatus
          createdAt
          ... on MediaImage {
            image { url width height altText }
            preview { image { url } }
          }
        }
        userErrors { code field message }
      }
    }
  `;

  const data = await client.graphql(mutation, {
    files: [{
      filename,
      contentType: "IMAGE",
      duplicateResolutionMode: "REPLACE",
      originalSource,
      alt
    }]
  }, { label: `Create Shopify file for ${filename}` });

  const result = data.fileCreate;
  client.assertUserErrors(result.userErrors, `Create Shopify file for ${filename}`);

  if (!result.files || result.files.length === 0) {
    throw new Error(`No Shopify file returned for ${filename}.`);
  }

  return result.files[0];
}

async function pollFile(client, fileId) {
  const query = `
    query fileNode($id: ID!) {
      node(id: $id) {
        ... on MediaImage {
          id
          fileStatus
          fileErrors { code message details }
          image { url width height altText }
          preview { image { url } }
        }
      }
    }
  `;

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const data = await client.graphql(query, { id: fileId }, { label: `Poll Shopify file ${fileId}`, retries: 1 });
    const file = data.node;

    if (!file) {
      throw new Error(`Unable to load uploaded Shopify file ${fileId}.`);
    }

    if (file.fileStatus === "READY") {
      return file;
    }

    if (file.fileStatus === "FAILED") {
      throw new Error(`Shopify file processing failed for ${fileId}: ${JSON.stringify(file.fileErrors)}`);
    }

    await delay(1500);
  }

  throw new Error(`Timed out waiting for Shopify file ${fileId} to process.`);
}

function altFromFilename(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
