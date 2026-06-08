#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = process.cwd();
const STYLE_PATH = path.join(ROOT, "brand", "image-style.md");
const TEMPLATE_DIR = path.join(ROOT, "prompts", "templates");
const OUTPUT_ROOT = path.join(ROOT, "public", "images");

const TYPE_CONFIG = {
  "homepage-hero": {
    folder: "homepage-hero",
    defaultVariants: ["desktop", "mobile"],
    templates: { desktop: "homepage-hero.md", mobile: "mobile-crop.md" },
    canvas: {
      desktop: "2400 x 1200 desktop hero, wide 2:1 composition, Shopify overlay safe.",
      mobile: "1200 x 1600 mobile hero, portrait composition, Shopify overlay safe."
    },
    imageSize: { desktop: "1536x1024", mobile: "1024x1536" }
  },
  "collection-image": {
    folder: "collections",
    defaultVariants: ["standard"],
    templates: { standard: "collection-banner.md" },
    canvas: {
      standard: "1800 x 1200 collection image, balanced 3:2 composition."
    },
    imageSize: { standard: "1536x1024" }
  },
  "category-promo-card": {
    folder: "category-promo-cards",
    defaultVariants: ["standard"],
    templates: { standard: "promo-tile.md" },
    canvas: {
      standard: "1200 x 1200 category promo card, square composition."
    },
    imageSize: { standard: "1024x1024" }
  },
  "pdp-support-image": {
    folder: "pdp-support",
    defaultVariants: ["standard"],
    templates: { standard: "pdp-support-image.md" },
    canvas: {
      standard: "1800 x 1200 PDP support image, close feature-focused 3:2 composition."
    },
    imageSize: { standard: "1536x1024" }
  },
  "campaign-promo": {
    folder: "campaigns",
    defaultVariants: ["desktop", "mobile"],
    templates: { desktop: "campaign-seasonal-promo.md", mobile: "mobile-crop.md" },
    canvas: {
      desktop: "2400 x 1200 campaign image, wide 2:1 composition, Shopify overlay safe.",
      mobile: "1200 x 1600 campaign mobile crop, portrait composition, Shopify overlay safe."
    },
    imageSize: { desktop: "1536x1024", mobile: "1024x1536" }
  }
};

const NEGATIVE_BASELINE = [
  "No text in image.",
  "No logo-like fake marks.",
  "No plant.",
  "No keyboard.",
  "No monitor.",
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

  const manifestPath = path.resolve(ROOT, args.manifest || "prompts/image-assets.example.json");
  const manifest = await readManifest(manifestPath);
  const brandRules = await fs.readFile(STYLE_PATH, "utf8");
  const shouldGenerate = Boolean(args.generate);
  const shouldValidateOnly = Boolean(args.validate);
  const assets = Array.isArray(manifest) ? manifest : manifest.assets;
  const manifestStyleReferences = Array.isArray(manifest.styleReferences) ? manifest.styleReferences : [];

  if (shouldGenerate && shouldValidateOnly) {
    throw new Error("Use either --generate or --validate, not both.");
  }

  if (!Array.isArray(assets) || assets.length === 0) {
    throw new Error(`No assets found in manifest: ${manifestPath}`);
  }

  let written = 0;

  for (const asset of assets) {
    if (args.only && asset.id !== args.only) continue;

    const assetType = asset.assetType || asset.assetClass;
    const config = TYPE_CONFIG[assetType];

    if (!config) {
      throw new Error(`Unsupported assetType "${assetType}" for asset "${asset.id}".`);
    }

    const variants = asset.variants || config.defaultVariants;

    for (const variant of variants) {
      const templateName = selectTemplate(config, asset, variant);
      const template = await fs.readFile(path.join(TEMPLATE_DIR, templateName), "utf8");
      const output = getOutputPaths(asset, config, variant);
      const prompt = renderTemplate(template, {
        brand_rules: brandRules.trim(),
        category: asset.category || "EZQuest storefront",
        purpose: asset.purpose || "Create a premium EZQuest storefront visual.",
        canvas: getCanvas(asset, config, variant),
        environment: asset.environment || "White or very light gray wall background with minimal surface context.",
        product_hierarchy: formatProductHierarchy(asset.productHierarchy),
        reference_images: formatReferenceImages(asset.referenceImages),
        style_reference: formatStyleReferences([].concat(manifestStyleReferences, asset.styleReferences || [])),
        extra_direction: asset.extraDirection || "Keep the composition calm, premium, realistic, useful, and clear in the Apple Store + UGREEN visual direction.",
        negative_constraints: formatList([].concat(NEGATIVE_BASELINE, asset.negativeConstraints || []))
      });

      if (shouldValidateOnly) {
        console.log(`Validated ${asset.id} (${variant}) with ${templateName}`);
      } else {
        await fs.mkdir(path.dirname(output.imagePath), { recursive: true });
        await fs.writeFile(output.promptPath, prompt);
        await fs.writeFile(output.metaPath, JSON.stringify({
          id: asset.id,
          assetType,
          variant,
          category: asset.category || null,
          imagePath: path.relative(ROOT, output.imagePath),
          promptPath: path.relative(ROOT, output.promptPath),
        template: path.join("prompts/templates", templateName),
        styleReferences: [].concat(manifestStyleReferences, asset.styleReferences || []),
        canvas: getCanvas(asset, config, variant),
        provider: shouldGenerate ? getProviderName() : "dry-run"
      }, null, 2) + "\n");
      }

      if (shouldGenerate) {
        await generateImage({
          prompt,
          imagePath: output.imagePath,
          size: getImageSize(asset, config, variant)
        });
        console.log(`Generated ${path.relative(ROOT, output.imagePath)}`);
      } else if (!shouldValidateOnly) {
        console.log(`Wrote prompt ${path.relative(ROOT, output.promptPath)}`);
      }

      written += 1;
    }
  }

  if (written === 0 && args.only) {
    throw new Error(`No asset matched --only ${args.only}`);
  }

  const action = shouldValidateOnly ? "Validated" : shouldGenerate ? "Generated" : "Prepared";
  console.log(`${action} ${written} asset variant${written === 1 ? "" : "s"}.`);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--dry-run") args.generate = false;
    else if (arg === "--generate") args.generate = true;
    else if (arg === "--validate") args.validate = true;
    else if (arg === "--manifest") args.manifest = argv[++index];
    else if (arg === "--only") args.only = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

async function readManifest(manifestPath) {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Manifest not found: ${manifestPath}`);
    }
    throw error;
  }
}

function selectTemplate(config, asset, variant) {
  if (asset.template) return asset.template;
  if (config.templates[variant]) return config.templates[variant];
  if (config.templates.standard) return config.templates.standard;
  throw new Error(`No template configured for variant "${variant}".`);
}

function getOutputPaths(asset, config, variant) {
  const id = slugify(asset.id);
  const variantFolder = variant === "standard" ? "" : variant;
  const folder = path.join(OUTPUT_ROOT, config.folder, variantFolder);
  const basename = variant === "standard" ? id : `${id}-${slugify(variant)}`;

  return {
    imagePath: path.join(folder, `${basename}.png`),
    promptPath: path.join(folder, `${basename}.prompt.md`),
    metaPath: path.join(folder, `${basename}.prompt.json`)
  };
}

function getCanvas(asset, config, variant) {
  if (asset.canvas) return asset.canvas;
  return config.canvas[variant] || config.canvas.standard;
}

function getImageSize(asset, config, variant) {
  if (asset.imageSize) return asset.imageSize;
  return config.imageSize[variant] || config.imageSize.standard || "1024x1024";
}

function renderTemplate(template, values) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) return values[key];
    return match;
  });
}

function formatProductHierarchy(productHierarchy) {
  if (!productHierarchy) {
    return [
      "Hero product: the primary EZQuest product or category object.",
      "Supporting products: only include secondary objects when they clarify the product story."
    ].join("\n");
  }

  const lines = [];

  if (productHierarchy.hero) lines.push(`Hero product: ${productHierarchy.hero}`);
  if (Array.isArray(productHierarchy.supporting) && productHierarchy.supporting.length > 0) {
    lines.push("Supporting products:");
    for (const item of productHierarchy.supporting) lines.push(`- ${item}`);
  }

  return lines.join("\n");
}

function formatReferenceImages(referenceImages) {
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) {
    return "No specific reference images supplied. Preserve EZQuest product accuracy and avoid inventing functional details.";
  }

  return [
    "Use these local reference paths for product form, ports, materials, and proportions:",
    ...referenceImages.map((item) => `- ${item}`)
  ].join("\n");
}

function formatStyleReferences(styleReferences) {
  if (!Array.isArray(styleReferences) || styleReferences.length === 0) {
    return "Match the approved EZQuest generated image system. Reuse the lighting, background brightness, camera height, shadow softness, material realism, product hierarchy, and whitespace logic from existing public/images assets and prompt sidecars when available.";
  }

  return [
    "Maintain visual consistency with these approved EZQuest style references:",
    ...styleReferences.map((item) => `- ${item}`)
  ].join("\n");
}

function formatList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

async function generateImage({ prompt, imagePath, size }) {
  const provider = getProviderName();

  if (provider !== "openai") {
    throw new Error(`Unsupported IMAGE_PROVIDER "${provider}". Supported provider: openai.`);
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.IMAGE_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or IMAGE_API_KEY is required when running with --generate.");
  }

  const model = process.env.OPENAI_IMAGE_MODEL || process.env.IMAGE_MODEL || "gpt-image-1";
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality: process.env.OPENAI_IMAGE_QUALITY || "high",
      n: 1
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Image generation failed: ${JSON.stringify(payload, null, 2)}`);
  }

  const firstImage = payload.data && payload.data[0];

  if (firstImage && firstImage.b64_json) {
    await fs.writeFile(imagePath, Buffer.from(firstImage.b64_json, "base64"));
    return;
  }

  if (firstImage && firstImage.url) {
    const imageResponse = await fetch(firstImage.url);
    if (!imageResponse.ok) throw new Error(`Image download failed: ${imageResponse.status}`);
    await fs.writeFile(imagePath, Buffer.from(await imageResponse.arrayBuffer()));
    return;
  }

  throw new Error("Image generation response did not include b64_json or url image data.");
}

function getProviderName() {
  return process.env.IMAGE_PROVIDER || "openai";
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function printHelp() {
  console.log(`EZQuest image generator

Usage:
  node scripts/generate-images.ts --manifest prompts/image-assets.example.json --dry-run
  OPENAI_API_KEY=... node scripts/generate-images.ts --manifest prompts/image-assets.example.json --generate

Options:
  --manifest <path>  JSON manifest with an assets array.
  --only <id>        Generate or prepare only one manifest asset id.
  --dry-run          Write prompt source and metadata only. This is the default.
  --validate         Validate manifest and templates without writing files.
  --generate         Call the configured image provider and write PNG files.
  --help             Show this help.

Supported assetType values:
  ${Object.keys(TYPE_CONFIG).join(", ")}
`);
}
