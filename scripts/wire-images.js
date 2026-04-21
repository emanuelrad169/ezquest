#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const SHOPIFY_FILES_PATH = "scripts/image-shopify-files.json";

const WIRING = [
  ["hero-slide-1-desktop.png", "templates/index.json", ["sections", "hero", "blocks", "slide_1", "settings", "image"], "hero slide 1 desktop"],
  ["hero-slide-1-mobile.png", "templates/index.json", ["sections", "hero", "blocks", "slide_1", "settings", "image_mobile"], "hero slide 1 mobile"],
  ["hero-slide-2-desktop.png", "templates/index.json", ["sections", "hero", "blocks", "slide_2", "settings", "image"], "hero slide 2 desktop"],
  ["hero-slide-2-mobile.png", "templates/index.json", ["sections", "hero", "blocks", "slide_2", "settings", "image_mobile"], "hero slide 2 mobile"],
  ["hero-slide-3-desktop.png", "templates/index.json", ["sections", "hero", "blocks", "slide_3", "settings", "image"], "hero slide 3 desktop"],
  ["hero-slide-3-mobile.png", "templates/index.json", ["sections", "hero", "blocks", "slide_3", "settings", "image_mobile"], "hero slide 3 mobile"],
  ["hero-slide-4-desktop.png", "templates/index.json", ["sections", "hero", "blocks", "slide_4", "settings", "image"], "hero slide 4 desktop"],
  ["hero-slide-4-mobile.png", "templates/index.json", ["sections", "hero", "blocks", "slide_4", "settings", "image_mobile"], "hero slide 4 mobile"],

  ["collection-hubs.png", "templates/index.json", ["sections", "categories", "blocks", "category_1", "settings", "image"], "home collection card: Hubs & Adapters"],
  ["collection-docking-stations.png", "templates/index.json", ["sections", "categories", "blocks", "category_2", "settings", "image"], "home collection card: Docking Stations"],
  ["collection-chargers-power.png", "templates/index.json", ["sections", "categories", "blocks", "category_3", "settings", "image"], "home collection card: Chargers & Power"],
  ["collection-cables-accessories.png", "templates/index.json", ["sections", "categories", "blocks", "category_4", "settings", "image"], "home collection card: Cables & Accessories"],

  ["category-card-hubs.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f1", "settings", "image"], "feature bento: hub expansion"],
  ["category-card-chargers-power.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f2", "settings", "image"], "feature bento: USB-C charging"],
  ["category-card-cables-accessories.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f3", "settings", "image"], "feature bento: display/accessory support"],
  ["category-card-docking-stations.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f4", "settings", "image"], "feature bento: desk-ready docks"],
  ["lifestyle-charging-scene.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f5", "settings", "image"], "feature bento: power delivery"],
  ["lifestyle-travel-setup.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f6", "settings", "image"], "feature bento: travel-ready"],
  ["lifestyle-clean-desk-setup.png", "templates/index.json", ["sections", "feature_bento", "blocks", "f7", "settings", "image"], "feature bento: wired networking"],

  ["feature-banner-background.png", "templates/index.json", ["sections", "feature_banner", "settings", "image"], "home feature banner background"],
  ["cinematic-reveal-background.png", "templates/index.json", ["sections", "cinematic_reveal", "settings", "background_image"], "cinematic reveal background"],
  ["confidence-support-visual.png", "templates/index.json", ["sections", "confidence", "settings", "support_image"], "confidence support visual"],

  ["support-how-it-works.png", "templates/page.support.json", ["sections", "hero", "settings", "image"], "support page hero"],
  ["support-compatibility-scenes.png", "templates/page.compatibility.json", ["sections", "hero", "settings", "image"], "compatibility page hero"],
  ["support-multi-device-charging.png", "templates/page.help-me-choose.json", ["sections", "hero", "settings", "image"], "help-me-choose page hero"]
];

main();

function main() {
  if (!fs.existsSync(SHOPIFY_FILES_PATH)) {
    throw new Error(`${SHOPIFY_FILES_PATH} not found. Run scripts/upload-theme-images.js first.`);
  }

  const uploaded = JSON.parse(fs.readFileSync(SHOPIFY_FILES_PATH, "utf8"));
  const files = new Map();
  const reportRows = [];
  let wired = 0;

  ensureHeroSlide4();

  for (const [filename, filePath, settingPath, target] of WIRING) {
    const upload = uploaded[filename];
    if (!upload) throw new Error(`Missing uploaded Shopify file metadata for ${filename}.`);

    const parsed = files.get(filePath) || readJsonWithHeader(filePath);
    setDeep(parsed.data, settingPath, upload.fileReference);
    files.set(filePath, parsed);
    wired += 1;
    reportRows.push({ image: filename, cdnUrl: upload.cdnUrl, wiredTo: target, status: "wired" });
    console.log(`Wired ${filename} -> ${filePath} ${settingPath.join(".")}`);
  }

  for (const [filePath, parsed] of files) {
    writeJsonWithHeader(filePath, parsed);
  }

  writeAudit(reportRows);

  console.log(`Wired: ${wired} images into section settings`);
  console.log("Saved: .audit/images-wired.md");
}

function ensureHeroSlide4() {
  const filePath = "templates/index.json";
  const parsed = readJsonWithHeader(filePath);
  const hero = parsed.data.sections.hero;

  if (!hero.blocks.slide_4) {
    hero.blocks.slide_4 = {
      type: "slide",
      settings: {
        eyebrow: "Travel-ready",
        heading: "Keep the right ports and power in your travel kit",
        copy: "Compact chargers, cables, and adapters for hotel desks, meetings, and carry-light days.",
        primary_label: "Shop travel-ready power",
        primary_url: "/collections/chargers-power",
        secondary_label: "Shop hubs & adapters",
        secondary_url: "/collections/hubs-adapters"
      }
    };
  }

  if (!hero.block_order.includes("slide_4")) {
    hero.block_order.push("slide_4");
  }

  writeJsonWithHeader(filePath, parsed);
}

function readJsonWithHeader(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^\s*(\/\*[\s\S]*?\*\/\s*)/);
  const header = match ? match[1] : "";
  const body = header ? raw.slice(header.length) : raw;

  return {
    header,
    data: JSON.parse(body)
  };
}

function writeJsonWithHeader(filePath, parsed) {
  fs.writeFileSync(filePath, `${parsed.header}${JSON.stringify(parsed.data, null, 2)}\n`);
}

function setDeep(object, keys, value) {
  let cursor = object;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (cursor[key] == null || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
}

function writeAudit(rows) {
  const lines = [
    "## AI Images - Wired to Theme",
    "Date: 2026-04-20",
    "",
    "| Image | CDN URL | Wired to | Status |",
    "|-------|---------|----------|--------|"
  ];

  for (const row of rows) {
    lines.push(`| ${row.image} | ${row.cdnUrl || ""} | ${row.wiredTo} | ${row.status} |`);
  }

  lines.push("");
  lines.push(`Total: ${rows.length}/${rows.length} images wired`);
  lines.push("shopify theme check: pending");
  lines.push("");

  fs.writeFileSync(".audit/images-wired.md", lines.join("\n"));
}
