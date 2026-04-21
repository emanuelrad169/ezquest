#!/usr/bin/env node
/* eslint-disable no-console */

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const { loadAdminEnv } = require("./shopify-admin/lib/env");

const COLLECTION_IMAGES = {
  "hubs-adapters": "collection-hubs-hero.png",
  "chargers-power": "collection-chargers-hero.png",
  cables: "collection-cables-hero.png",
  accessories: "collection-accessories-hero.png"
};

const TYPE_ENDPOINTS = {
  custom: "custom_collections",
  smart: "smart_collections"
};

main().catch((error) => {
  console.error("FAILED:", error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const env = loadAdminEnv();
  const base = `https://${env.SHOPIFY_SHOP_DOMAIN}/admin/api/${env.SHOPIFY_ADMIN_API_VERSION}`;
  const headers = {
    "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    "Content-Type": "application/json"
  };

  const uploaded = JSON.parse(fs.readFileSync("scripts/image-shopify-files.json", "utf8"));
  const collections = await getCollections(base, headers);
  const rows = [];

  console.log("Found collections:", collections.map((collection) => collection.handle).join(", "));

  for (const [handle, filename] of Object.entries(COLLECTION_IMAGES)) {
    const collection = collections.find((item) => item.handle === handle);
    const upload = uploaded[filename];

    if (!collection) {
      console.log(`NOT FOUND: ${handle}`);
      rows.push({ collection: handle, image: filename, status: "not found" });
      continue;
    }

    if (!upload || !upload.cdnUrl) {
      console.log(`NO CDN URL: ${filename}`);
      rows.push({ collection: handle, image: filename, status: "missing upload" });
      continue;
    }

    console.log(`Setting image for ${handle} from ${filename}...`);
    const src = await setCollectionImage(base, headers, collection, upload.cdnUrl);
    console.log(`DONE: ${handle} -> ${src || "(processing)"}`);
    rows.push({ collection: handle, image: filename, imageUrl: upload.cdnUrl, resultUrl: src, status: "wired" });
    await delay(600);
  }

  fs.writeFileSync("scripts/collection-image-wiring-report.json", JSON.stringify(rows, null, 2) + "\n");
  console.log("Saved: scripts/collection-image-wiring-report.json");
}

async function getCollections(base, headers) {
  const collections = [];

  for (const [type, endpoint] of Object.entries(TYPE_ENDPOINTS)) {
    const response = await fetch(`${base}/${endpoint}.json?limit=250&fields=id,handle,title,image`, { headers });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(`Collection fetch failed for ${endpoint}: HTTP ${response.status} ${JSON.stringify(payload)}`);
    }

    for (const collection of payload[endpoint] || []) {
      collections.push({ ...collection, collectionType: type, endpoint });
    }
  }

  return collections;
}

async function setCollectionImage(base, headers, collection, imageUrl) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Image download failed for ${collection.handle}: HTTP ${imageResponse.status}`);
  }

  const attachment = Buffer.from(await imageResponse.arrayBuffer()).toString("base64");
  const endpoint = collection.endpoint;
  const singular = collection.collectionType === "smart" ? "smart_collection" : "custom_collection";

  const response = await fetch(`${base}/${endpoint}/${collection.id}.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      [singular]: {
        id: collection.id,
        image: { attachment }
      }
    })
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error(`Collection update failed for ${collection.handle}: HTTP ${response.status} ${JSON.stringify(payload)}`);
  }

  return payload[singular]?.image?.src || null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
