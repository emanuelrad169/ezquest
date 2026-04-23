#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs/promises");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

loadEnv();

const ROOT = process.cwd();
const STYLE_PATH = path.join(ROOT, "brand", "image-style.md");
const TEMPLATE_DIR = path.join(ROOT, "prompts", "templates");
const OUTPUT_ROOT = path.join(ROOT, "public", "images");

const FOLDERS = {
  homepage: "homepage",
  collection: "collections",
  "category-card": "category-cards",
  lifestyle: "lifestyle",
  support: "support",
  campaign: "campaigns",
  missing: "missing"
};

const SUPPORTED_GENERATION_SIZES = new Set([
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "auto"
]);

const NEGATIVE_BASELINE = [
  "No text in image.",
  "No fake logo marks.",
  "No product packshot.",
  "No plant.",
  "No keyboard.",
  "No monitor unless this asset explicitly requests a desk, compatibility, or display-support scene.",
  "No dark background.",
  "No busy composition.",
  "No clutter.",
  "No random props.",
  "No messy cables.",
  "No generic CGI feel.",
  "No exaggerated reflections.",
  "No neon lighting.",
  "No hands unless explicitly requested.",
  "No impossible ports.",
  "No distorted connectors."
];

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.generate && args.dryRun) {
    throw new Error("Use either --generate or --dry-run, not both.");
  }

  const manifestPath = path.resolve(ROOT, args.manifest || "prompts/shopify-images.json");
  const manifest = await readJson(manifestPath);
  const brandRules = await fs.readFile(STYLE_PATH, "utf8");
  const assets = Array.isArray(manifest) ? manifest : manifest.assets;

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error(`No assets found in manifest: ${manifestPath}`);
  }

  const selectedAssets = selectAssets(assets, args);
  validateAssets(selectedAssets);

  if (args.validate) {
    console.log(`Validated ${selectedAssets.length} image asset${selectedAssets.length === 1 ? "" : "s"}.`);
    return;
  }

  const shouldGenerate = Boolean(args.generate);

  if (shouldGenerate && !getApiKey()) {
    throw new Error("OPENAI_API_KEY or IMAGE_API_KEY is required when running with --generate.");
  }

  let prepared = 0;
  let generated = 0;
  let skipped = 0;

  for (const asset of selectedAssets) {
    const output = getOutputPaths(asset, args);
    const template = await fs.readFile(path.join(TEMPLATE_DIR, asset.template), "utf8");
    const prompt = renderPrompt(template, asset, brandRules);

    await fs.mkdir(path.dirname(output.imagePath), { recursive: true });
    const outputFormat = getOpenAIOutputFormat(output.imagePath);
    await fs.writeFile(output.promptPath, prompt);
    await fs.writeFile(output.metaPath, JSON.stringify(buildMetadata(asset, output, args, outputFormat), null, 2) + "\n");
    prepared += 1;

    if (!shouldGenerate) {
      console.log(`Prepared ${path.relative(ROOT, output.promptPath)}`);
      continue;
    }

    if (!args.force && await exists(output.imagePath)) {
      skipped += 1;
      console.log(`Skipped existing ${path.relative(ROOT, output.imagePath)}`);
      continue;
    }

    const rawPath = `${stripImageExtension(output.imagePath)}.openai-raw.${getFileExtensionForFormat(outputFormat)}`;
    await generateOpenAIImage({
      prompt,
      imagePath: rawPath,
      size: asset.generationSize,
      model: args.model,
      quality: args.quality,
      outputFormat
    });

    if (args.noResize) {
      await fs.rename(rawPath, output.imagePath);
    } else {
      await cropAndResizeWithSips({
        rawPath,
        outputPath: output.imagePath,
        generationSize: asset.generationSize,
        targetWidth: asset.targetWidth,
        targetHeight: asset.targetHeight
      });
      await fs.unlink(rawPath).catch(() => {});
    }

    generated += 1;
    console.log(`Generated ${path.relative(ROOT, output.imagePath)}`);

    if (args.delayMs > 0) {
      await sleep(args.delayMs);
    }
  }

  const action = shouldGenerate ? "Generated" : "Prepared";
  console.log(`${action} ${shouldGenerate ? generated : prepared} image asset${(shouldGenerate ? generated : prepared) === 1 ? "" : "s"}.`);
  if (skipped > 0) console.log(`Skipped ${skipped} existing image${skipped === 1 ? "" : "s"}. Use --force to replace.`);
}

function loadEnv() {
  try {
    const dotenv = require("dotenv");
    dotenv.config({ path: ".env.local", quiet: true });
    dotenv.config({ path: ".env", quiet: true });
  } catch (_error) {
    // dotenv is optional for this script; environment variables may already be set.
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: true,
    delayMs: 1500,
    quality: process.env.OPENAI_IMAGE_QUALITY || "high",
    model: process.env.OPENAI_IMAGE_MODEL || process.env.IMAGE_MODEL || "gpt-image-1.5"
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--generate") {
      args.generate = true;
      args.dryRun = false;
    } else if (arg === "--validate") args.validate = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--no-resize") args.noResize = true;
    else if (arg === "--manifest") args.manifest = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--only") args.only = argv[++index];
    else if (arg === "--limit") args.limit = Number(argv[++index]);
    else if (arg === "--delay-ms") args.delayMs = Number(argv[++index]);
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--quality") args.quality = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.limit != null && (!Number.isInteger(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  if (!Number.isFinite(args.delayMs) || args.delayMs < 0) {
    throw new Error("--delay-ms must be zero or a positive number.");
  }

  return args;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function selectAssets(assets, args) {
  let selected = assets;

  if (args.only) {
    selected = selected.filter((asset) => asset.id === args.only || asset.fileName === args.only);
  }

  if (args.limit) {
    selected = selected.slice(0, args.limit);
  }

  if (selected.length === 0) {
    throw new Error(args.only ? `No asset matched --only ${args.only}.` : "No image assets selected.");
  }

  return selected;
}

function validateAssets(assets) {
  for (const asset of assets) {
    const label = asset.id || asset.fileName || "(unknown)";

    for (const field of ["id", "fileName", "assetType", "template", "category", "purpose", "targetWidth", "targetHeight", "generationSize"]) {
      if (asset[field] == null || asset[field] === "") {
        throw new Error(`Asset ${label} is missing required field "${field}".`);
      }
    }

    if (!FOLDERS[asset.assetType]) {
      throw new Error(`Asset ${label} has unsupported assetType "${asset.assetType}".`);
    }

    if (!isSupportedImageFile(asset.fileName)) {
      throw new Error(`Asset ${label} must use a .png, .jpg, .jpeg, or .webp fileName.`);
    }

    if (!Number.isInteger(asset.targetWidth) || !Number.isInteger(asset.targetHeight)) {
      throw new Error(`Asset ${label} targetWidth and targetHeight must be integers.`);
    }

    if (!SUPPORTED_GENERATION_SIZES.has(asset.generationSize)) {
      throw new Error(`Asset ${label} has unsupported generationSize "${asset.generationSize}".`);
    }
  }
}

function getOutputPaths(asset, args = {}) {
  const imagePath = args.output
    ? path.join(path.resolve(ROOT, args.output), asset.fileName)
    : path.join(OUTPUT_ROOT, FOLDERS[asset.assetType], asset.fileName);
  const sidecarBase = stripImageExtension(imagePath);

  return {
    imagePath,
    promptPath: `${sidecarBase}.prompt.md`,
    metaPath: `${sidecarBase}.prompt.json`
  };
}

function renderPrompt(template, asset, brandRules) {
  let negativeBaseline = NEGATIVE_BASELINE;
  if (asset.allowDarkBackground) {
    negativeBaseline = negativeBaseline.filter((item) => item !== "No dark background.");
  }

  const values = {
    brand_rules: brandRules.trim(),
    category: asset.category,
    purpose: asset.purpose,
    canvas: formatCanvas(asset),
    composition: asset.composition || "One hero object with 1-2 supporting objects maximum. Preserve clean whitespace for Shopify overlay copy.",
    environment: asset.environment || "White or very light gray wall background.",
    product_hierarchy: formatProductHierarchy(asset.productHierarchy),
    reference_images: formatReferenceImages(asset.referenceImages),
    style_reference: asset.styleReference || "Match the approved EZQuest generated storefront style: light gray/white background, soft natural shadows, calm premium consumer-tech materials, consistent camera height, generous whitespace, and one clear hero object with restrained support.",
    extra_direction: asset.extraDirection || "Premium modern consumer tech product scene, minimal Apple Store style, clean white background, soft natural lighting, no text, no clutter, realistic materials, high-end commercial photography.",
    negative_constraints: formatList([].concat(negativeBaseline, asset.negativeConstraints || []))
  };

  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
    return match;
  });
}

function formatCanvas(asset) {
  const ratio = reduceRatio(asset.targetWidth, asset.targetHeight);
  return `${asset.targetWidth} x ${asset.targetHeight} px final Shopify-ready image (${ratio}). Generate at ${asset.generationSize}, then crop and resize to the final target.`;
}

function formatProductHierarchy(productHierarchy) {
  if (!productHierarchy) {
    return "Hero object: primary EZQuest category object.\nSupporting objects: 1-2 quiet supporting objects maximum.";
  }

  const lines = [];

  if (productHierarchy.hero) lines.push(`Hero object: ${productHierarchy.hero}`);

  if (Array.isArray(productHierarchy.supporting) && productHierarchy.supporting.length > 0) {
    lines.push("Supporting objects:");
    for (const item of productHierarchy.supporting.slice(0, 3)) lines.push(`- ${item}`);
  }

  return lines.join("\n");
}

function formatReferenceImages(referenceImages) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) {
    return "No specific product-reference file supplied. Preserve plausible EZQuest hardware forms and avoid inventing functional details.";
  }

  return [
    "Use these local reference paths only for product form, ports, materials, and proportions:",
    ...referenceImages.map((item) => `- ${item}`)
  ].join("\n");
}

function formatList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

function buildMetadata(asset, output, args, outputFormat) {
  return {
    id: asset.id,
    fileName: asset.fileName,
    assetType: asset.assetType,
    category: asset.category,
    targetWidth: asset.targetWidth,
    targetHeight: asset.targetHeight,
    generationSize: asset.generationSize,
    slot: asset.slot || null,
    section: asset.section || null,
    style: asset.style || null,
    imagePath: path.relative(ROOT, output.imagePath),
    promptPath: path.relative(ROOT, output.promptPath),
    template: path.join("prompts/templates", asset.template),
    provider: args.generate ? "openai-images-api" : "dry-run",
    model: args.generate ? args.model : null,
    quality: args.generate ? args.quality : null,
    outputFormat,
    resizedWith: args.noResize ? null : "sips"
  };
}

async function generateOpenAIImage({ prompt, imagePath, size, model, quality, outputFormat }) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      output_format: outputFormat,
      background: "opaque",
      n: 1
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Image generation failed: ${JSON.stringify(payload, null, 2)}`);
  }

  const image = payload.data && payload.data[0];

  if (image && image.b64_json) {
    await fs.writeFile(imagePath, Buffer.from(image.b64_json, "base64"));
    return;
  }

  if (image && image.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) throw new Error(`Image download failed: ${imageResponse.status}`);
    await fs.writeFile(imagePath, Buffer.from(await imageResponse.arrayBuffer()));
    return;
  }

  throw new Error("Image generation response did not include b64_json or url image data.");
}

async function cropAndResizeWithSips({ rawPath, outputPath, generationSize, targetWidth, targetHeight }) {
  const dimensions = parseSize(generationSize);
  const crop = getCenteredCrop(dimensions.width, dimensions.height, targetWidth, targetHeight);
  const cropPath = `${stripImageExtension(outputPath)}.crop.png`;

  if (crop.width !== dimensions.width || crop.height !== dimensions.height) {
    runSips(["--cropToHeightWidth", String(crop.height), String(crop.width), rawPath, "--out", cropPath]);
  } else {
    await fs.copyFile(rawPath, cropPath);
  }

  runSips(["--resampleHeightWidth", String(targetHeight), String(targetWidth), cropPath, "--out", outputPath]);
  await fs.unlink(cropPath).catch(() => {});
}

function runSips(args) {
  const result = spawnSync("sips", args, { encoding: "utf8" });

  if (result.error) {
    throw new Error(`sips failed to run. Use --no-resize to keep OpenAI native dimensions. ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`sips failed: ${result.stderr || result.stdout}`);
  }
}

function getCenteredCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (Math.abs(sourceRatio - targetRatio) < 0.001) {
    return { width: sourceWidth, height: sourceHeight };
  }

  if (sourceRatio > targetRatio) {
    return {
      width: Math.round(sourceHeight * targetRatio),
      height: sourceHeight
    };
  }

  return {
    width: sourceWidth,
    height: Math.round(sourceWidth / targetRatio)
  };
}

function parseSize(size) {
  if (size === "auto") {
    throw new Error("Cannot locally crop/resize generationSize auto. Use an explicit generationSize or --no-resize.");
  }

  const match = /^(\d+)x(\d+)$/.exec(size);
  if (!match) throw new Error(`Invalid generation size: ${size}`);

  return {
    width: Number(match[1]),
    height: Number(match[2])
  };
}

function getApiKey() {
  return process.env.OPENAI_API_KEY || process.env.IMAGE_API_KEY;
}

function isSupportedImageFile(fileName) {
  return /\.(png|jpe?g|webp)$/i.test(fileName);
}

function stripImageExtension(filePath) {
  return filePath.replace(/\.(png|jpe?g|webp)$/i, "");
}

function getOpenAIOutputFormat(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "jpeg";
  if (extension === ".webp") return "webp";
  return "png";
}

function getFileExtensionForFormat(outputFormat) {
  return outputFormat === "jpeg" ? "jpg" : outputFormat;
}

function reduceRatio(width, height) {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printHelp() {
  console.log(`EZQuest Shopify image generator

Usage:
  node scripts/generate-shopify-images.ts --manifest prompts/shopify-images.json --dry-run
  OPENAI_API_KEY=... node scripts/generate-shopify-images.ts --manifest prompts/shopify-images.json --generate

Options:
  --manifest <path>  JSON manifest with an assets array. Defaults to prompts/shopify-images.json.
  --output <dir>     Write images and sidecars to a specific output directory.
  --only <id|file>   Prepare or generate only one asset.
  --limit <n>        Prepare or generate the first n selected assets.
  --dry-run          Write prompt sidecars only. This is the default.
  --validate         Validate manifest fields without writing files.
  --generate         Call the OpenAI Images API and write PNG files.
  --force            Replace existing image files.
  --no-resize        Keep OpenAI native dimensions instead of using sips for final crops.
  --model <model>    Defaults to OPENAI_IMAGE_MODEL or gpt-image-1.5.
  --quality <value>  Defaults to OPENAI_IMAGE_QUALITY or high.
  --delay-ms <n>     Delay between API calls. Defaults to 1500.
  --help             Show this help.
`);
}
