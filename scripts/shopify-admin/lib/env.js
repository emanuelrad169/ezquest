const fs = require("fs");
const path = require("path");

function validateShopDomain(shopDomain) {
  if (!shopDomain) {
    return null;
  }

  if (/^https?:\/\//i.test(shopDomain)) {
    return "SHOPIFY_SHOP_DOMAIN must be the myshopify domain only, for example ezquest-3.myshopify.com.";
  }

  if (shopDomain.includes("/") || shopDomain.includes("?")) {
    return "SHOPIFY_SHOP_DOMAIN must not contain paths or query params.";
  }

  return null;
}

function validateAdminToken(accessToken) {
  if (!accessToken) {
    return null;
  }

  if (/^shpss_/i.test(accessToken)) {
    return "SHOPIFY_ADMIN_ACCESS_TOKEN appears to be an app secret or session secret (shpss_...). This repo needs the Shopify Admin API access token generated after installing a custom app.";
  }

  return null;
}

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return {};
  }

  const contents = fs.readFileSync(filepath, "utf8");
  const result = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) {
      continue;
    }

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadAdminEnv() {
  const cwd = process.cwd();
  const fileEnv = {
    ...parseEnvFile(path.join(cwd, ".env")),
    ...parseEnvFile(path.join(cwd, ".env.local"))
  };

  const merged = {
    ...fileEnv,
    ...process.env
  };

  const requiredKeys = [
    "SHOPIFY_SHOP_DOMAIN",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "SHOPIFY_ADMIN_API_VERSION"
  ];

  const missing = requiredKeys.filter((key) => !merged[key]);
  if (missing.length > 0) {
    console.error("[shopify-admin] Missing required environment variables:");
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    console.error("");
    console.error("Add them to your shell environment or .env.local before running Shopify Admin seeds.");
    process.exit(1);
  }

  const validationErrors = [
    validateShopDomain(merged.SHOPIFY_SHOP_DOMAIN),
    validateAdminToken(merged.SHOPIFY_ADMIN_ACCESS_TOKEN)
  ].filter(Boolean);

  if (validationErrors.length > 0) {
    console.error("[shopify-admin] Invalid Shopify environment configuration:");
    for (const error of validationErrors) {
      console.error(`- ${error}`);
    }
    console.error("");
    console.error("Update .env.local and rerun the command.");
    process.exit(1);
  }

  return merged;
}

module.exports = {
  loadAdminEnv
};
