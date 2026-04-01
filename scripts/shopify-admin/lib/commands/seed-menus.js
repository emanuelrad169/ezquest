const { bump } = require("../summary");

async function seedMenusFallback(context, summary) {
  const dryRunLabel = context.dryRun ? "[dry-run] " : "";
  console.log(`${dryRunLabel}[shopify-admin] Menu automation is not enabled in this repo by default.`);
  console.log(`${dryRunLabel}[shopify-admin] Use docs/shopify-admin-automation.md for the exact fallback menu checklist.`);
  bump(summary, "skipped", "Menu automation skipped. Use the documented admin checklist.");
}

module.exports = {
  seedMenusFallback
};
