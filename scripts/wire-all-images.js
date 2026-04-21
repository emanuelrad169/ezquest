#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");

const SHOPIFY_FILES_PATH = "scripts/image-shopify-files.json";

const TARGETS = {
  about_hero: [{ file: "templates/page.about.json", section: "hero", key: "image" }],
  about_brand_story: [{ file: "templates/page.about.json", section: "brand_belief", key: "background_image" }],
  about_values: [{ file: "templates/page.about.json", section: "features", key: "image" }],
  story_hero: [{ file: "templates/page.our-story.json", section: "story", key: "hero_image" }],
  support_hero: [{ file: "templates/page.support.json", section: "hub", key: "image" }],
  faq_hero: [{ file: "templates/page.faq.json", section: "hero", key: "image" }],
  downloads_hero: [{ file: "templates/page.downloads.json", section: "hero", key: "image" }],
  where_to_buy_hero: [{ file: "templates/page.where-to-buy.json", section: "hero", key: "image" }],
  blog_hero: [
    { file: "templates/blog.json", section: "main", key: "hero_image" },
    { file: "templates/blog.resources.json", section: "hero", key: "image" }
  ],
  blog_article_default: [
    { file: "templates/blog.json", section: "main", key: "default_article_image" },
    { file: "templates/article.json", section: "main", key: "default_article_image" }
  ],
  og_default: [{ file: "config/settings_data.json", section: null, key: "share_image" }]
};

const COLLECTION_INDEX_SETTINGS = {
  "card-hubs-collections.png": "hubs_image",
  "card-chargers-collections.png": "chargers_image",
  "card-cables-collections.png": "cables_image",
  "card-accessories-collections.png": "accessories_image"
};

const HOMEPAGE_FEATURE_BLOCKS = {
  "feature-duraguard.png": {
    id: "f8",
    settings: {
      size: "normal",
      card_style: "light",
      stat: "DuraGuard",
      label: "Braided cable durability",
      sublabel: ""
    }
  },
  "feature-warranty.png": {
    id: "f9",
    settings: {
      size: "normal",
      card_style: "light",
      stat: "2-year",
      label: "Warranty coverage",
      sublabel: ""
    }
  },
  "feature-compatibility.png": {
    id: "f10",
    settings: {
      size: "wide",
      card_style: "light",
      stat: "Works with",
      label: "Mac, iPad, and Windows setups",
      sublabel: ""
    }
  }
};

const STORY_TIMELINE_BLOCK = {
  id: "story_timeline",
  settings: {
    eyebrow: "Timeline",
    title: "Product thinking shaped around real setups",
    copy: "From hubs to power and support, each accessory is designed to make the next connection feel clearer.",
    link_label: "",
    link: ""
  }
};

main();

function main() {
  if (!fs.existsSync(SHOPIFY_FILES_PATH)) {
    throw new Error(`${SHOPIFY_FILES_PATH} not found. Run scripts/upload-theme-images.js first.`);
  }

  const uploaded = JSON.parse(fs.readFileSync(SHOPIFY_FILES_PATH, "utf8"));
  const sidecars = readSidecars("public/images");
  const files = new Map();
  const rows = [];
  let wired = 0;
  let skipped = 0;

  for (const meta of sidecars) {
    const upload = uploaded[meta.fileName];
    if (!upload) {
      continue;
    }

    const reference = upload.fileReference;

    if (meta.slot === "collection_hero") {
      rows.push(row(meta, upload, "collection object via Admin API", "deferred"));
      console.log(`DEFER collection hero ${meta.fileName} -> Admin API`);
      skipped += 1;
      continue;
    }

    if (meta.slot === "collection_index_card") {
      const key = COLLECTION_INDEX_SETTINGS[meta.fileName];
      if (!key) {
        rows.push(row(meta, upload, "list-collections", "not found"));
        console.log(`NOT FOUND collection index mapping for ${meta.fileName}`);
        skipped += 1;
        continue;
      }
      setSectionSetting(files, "templates/list-collections.json", "main", key, reference);
      rows.push(row(meta, upload, `templates/list-collections.json main.${key}`, "wired"));
      console.log(`WIRED ${meta.fileName} -> templates/list-collections.json main.${key}`);
      wired += 1;
      continue;
    }

    if (meta.slot === "story_timeline") {
      setSectionSetting(files, "templates/page.our-story.json", "story", "timeline_image", reference);
      rows.push(row(meta, upload, "templates/page.our-story.json story.timeline_image", "wired"));
      console.log(`WIRED ${meta.fileName} -> templates/page.our-story.json story.timeline_image`);
      wired += 1;
      continue;
    }

    if (meta.slot && meta.slot.startsWith("feature_")) {
      const block = HOMEPAGE_FEATURE_BLOCKS[meta.fileName];
      if (!block) {
        rows.push(row(meta, upload, "homepage feature bento", "not found"));
        console.log(`NOT FOUND homepage feature mapping for ${meta.fileName}`);
        skipped += 1;
        continue;
      }
      wireHomepageFeature(files, block, reference);
      rows.push(row(meta, upload, `templates/index.json feature_bento.${block.id}`, "wired"));
      console.log(`WIRED ${meta.fileName} -> templates/index.json feature_bento.${block.id}`);
      wired += 1;
      continue;
    }

    const targets = TARGETS[meta.slot] || [];
    if (targets.length === 0) {
      continue;
    }

    for (const target of targets) {
      setSectionSetting(files, target.file, target.section, target.key, reference);
      rows.push(row(meta, upload, `${target.file} ${target.section || "current"}.${target.key}`, "wired"));
      console.log(`WIRED ${meta.fileName} -> ${target.file} ${target.section || "current"}.${target.key}`);
      wired += 1;
    }
  }

  for (const [filePath, parsed] of files) {
    writeJsonWithHeader(filePath, parsed);
  }

  fs.writeFileSync("scripts/image-wiring-report.json", JSON.stringify(rows, null, 2) + "\n");
  console.log(`\nWired: ${wired}`);
  console.log(`Deferred/skipped: ${skipped}`);
  console.log("Saved: scripts/image-wiring-report.json");
}

function readSidecars(root) {
  const sidecars = [];
  for (const filePath of walk(root)) {
    if (!filePath.endsWith(".prompt.json")) continue;
    const meta = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!meta.fileName || !meta.slot) continue;
    sidecars.push(meta);
  }
  return sidecars.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  for (const name of fs.readdirSync(dir).sort()) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) entries.push(...walk(filePath));
    else entries.push(filePath);
  }
  return entries;
}

function setSectionSetting(files, filePath, sectionKey, settingKey, value) {
  const parsed = getJson(files, filePath);

  if (sectionKey == null) {
    if (!parsed.data.current) parsed.data.current = {};
    parsed.data.current[settingKey] = value;
    return;
  }

  if (!parsed.data.sections || !parsed.data.sections[sectionKey]) {
    throw new Error(`Section ${sectionKey} not found in ${filePath}`);
  }

  if (!parsed.data.sections[sectionKey].settings) {
    parsed.data.sections[sectionKey].settings = {};
  }

  parsed.data.sections[sectionKey].settings[settingKey] = value;
}

function wireStoryTimeline(files, value) {
  const parsed = getJson(files, "templates/page.our-story.json");
  const section = parsed.data.sections.story;
  if (!section) throw new Error("Section story not found in templates/page.our-story.json");

  if (!section.blocks) section.blocks = {};
  if (!section.block_order) section.block_order = [];

  const blockId = STORY_TIMELINE_BLOCK.id;
  const current = section.blocks[blockId] || { type: "story", settings: {} };
  current.type = "story";
  current.settings = { ...STORY_TIMELINE_BLOCK.settings, ...current.settings, image: value };
  section.blocks[blockId] = current;

  if (!section.block_order.includes(blockId)) section.block_order.push(blockId);
}

function wireHomepageFeature(files, block, value) {
  const parsed = getJson(files, "templates/index.json");
  const section = parsed.data.sections.feature_bento;
  if (!section) throw new Error("Section feature_bento not found in templates/index.json");

  if (!section.blocks) section.blocks = {};
  if (!section.block_order) section.block_order = [];

  const current = section.blocks[block.id] || { type: "feature", settings: {} };
  current.type = "feature";
  current.settings = { ...block.settings, ...current.settings, image: value };
  section.blocks[block.id] = current;

  if (!section.block_order.includes(block.id)) section.block_order.push(block.id);
}

function getJson(files, filePath) {
  if (!files.has(filePath)) {
    files.set(filePath, readJsonWithHeader(filePath));
  }
  return files.get(filePath);
}

function readJsonWithHeader(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^\s*(\/\*[\s\S]*?\*\/\s*)/);
  const header = match ? match[1] : "";
  const body = header ? raw.slice(header.length) : raw;
  return { header, data: JSON.parse(body) };
}

function writeJsonWithHeader(filePath, parsed) {
  fs.writeFileSync(filePath, `${parsed.header}${JSON.stringify(parsed.data, null, 2)}\n`);
}

function row(meta, upload, wiredTo, status) {
  return {
    image: meta.fileName,
    slot: meta.slot,
    section: meta.section,
    cdnUrl: upload.cdnUrl,
    fileReference: upload.fileReference,
    wiredTo,
    status
  };
}
