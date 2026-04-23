#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PROMO_DIR = "public/images/promo-banners";

main();

function main() {
  const result = spawnSync(process.execPath, ["scripts/upload-theme-images.js"], {
    stdio: "inherit",
    env: {
      ...process.env,
      EZQ_IMAGE_DIRS: PROMO_DIR
    }
  });

  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    return;
  }

  const promoFiles = fs.readdirSync(PROMO_DIR)
    .filter((file) => /\.(png|jpe?g|webp)$/i.test(file))
    .sort();
  const cdnUrls = JSON.parse(fs.readFileSync("scripts/image-cdn-urls.json", "utf8"));
  const shopifyFiles = JSON.parse(fs.readFileSync("scripts/image-shopify-files.json", "utf8"));
  const promoUrls = {};
  const promoFileRefs = {};

  for (const file of promoFiles) {
    promoUrls[file] = cdnUrls[file] || null;
    promoFileRefs[file] = shopifyFiles[file] || null;
  }

  fs.writeFileSync("scripts/promo-banner-urls.json", JSON.stringify(promoUrls, null, 2) + "\n");
  fs.writeFileSync("scripts/promo-banner-files.json", JSON.stringify(promoFileRefs, null, 2) + "\n");

  console.log("\nSaved: scripts/promo-banner-urls.json");
  console.log("Saved: scripts/promo-banner-files.json");
  console.log(`Promo banners uploaded: ${Object.keys(promoUrls).length}`);
}
