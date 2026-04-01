#!/usr/bin/env node

const { loadAdminEnv } = require("./lib/env");
const { createAdminClient } = require("./lib/admin-client");
const { createSummary, printSummary } = require("./lib/summary");
const { seedPages } = require("./lib/commands/seed-pages");
const { seedBlogs } = require("./lib/commands/seed-blogs");
const { seedProducts } = require("./lib/commands/seed-products");
const { seedMetaobjectDefinitions } = require("./lib/commands/seed-metaobjects");
const { seedProductMetafields } = require("./lib/commands/seed-metafields");
const { seedCollections } = require("./lib/commands/seed-collections");
const { seedMenusFallback } = require("./lib/commands/seed-menus");
const { seedStarterContent } = require("./lib/commands/seed-content");
const { runPreflight } = require("./lib/commands/preflight");
const { runValidation } = require("./lib/commands/validate");

const COMMANDS = {
  preflight: runPreflight,
  pages: seedPages,
  blogs: seedBlogs,
  products: seedProducts,
  metaobjects: seedMetaobjectDefinitions,
  metafields: seedProductMetafields,
  collections: seedCollections,
  menus: seedMenusFallback,
  content: seedStarterContent,
  validate: runValidation
};

async function main() {
  const command = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!command || (!COMMANDS[command] && command !== "all")) {
    console.error("Usage: node scripts/shopify-admin/cli.js <preflight|pages|blogs|products|metaobjects|metafields|collections|menus|content|validate|all> [--dry-run]");
    process.exit(1);
  }

  const env = loadAdminEnv();
  const client = createAdminClient({
    shopDomain: env.SHOPIFY_SHOP_DOMAIN,
    accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    apiVersion: env.SHOPIFY_ADMIN_API_VERSION,
    dryRun
  });

  const context = {
    client,
    dryRun
  };

  const summary = createSummary(command, dryRun);

  try {
    if (command === "all") {
      for (const key of ["pages", "blogs", "products", "metaobjects", "metafields", "collections", "content", "menus"]) {
        await COMMANDS[key](context, summary);
      }
    } else {
      await COMMANDS[command](context, summary);
    }

    printSummary(summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("");
    console.error(`[shopify-admin] Fatal error in "${command}"`);
    console.error(error && error.stack ? error.stack : String(error));
    printSummary(summary);
    process.exit(1);
  }
}

main();
