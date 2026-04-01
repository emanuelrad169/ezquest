const { bump } = require("../summary");

async function runPreflight(context, summary) {
  const { client } = context;

  try {
    const query = `
      query AdminPreflight {
        shop {
          id
          name
          myshopifyDomain
        }
        currentAppInstallation {
          accessScopes {
            handle
          }
        }
      }
    `;

    const data = await client.graphql(query, {}, { label: "Admin API preflight" });
    const scopes = (data.currentAppInstallation?.accessScopes || [])
      .map((scope) => scope.handle)
      .sort();
    const requiredScopes = [
      "read_products",
      "write_products",
      "read_content",
      "write_content",
      "read_metaobjects",
      "write_metaobjects",
      "read_files",
      "write_files"
    ];
    const recommendedScopes = [
      "read_metaobject_definitions",
      "write_metaobject_definitions",
      "read_publications",
      "write_publications"
    ];
    const missingRequired = requiredScopes.filter((scope) => !scopes.includes(scope));
    const missingRecommended = recommendedScopes.filter((scope) => !scopes.includes(scope));

    console.log("[shopify-admin] Preflight OK");
    console.log(`- shop: ${data.shop.name} (${data.shop.myshopifyDomain})`);
    console.log(`- api version: ${client.apiVersion}`);
    console.log(`- scopes: ${scopes.length > 0 ? scopes.join(", ") : "No scopes returned"}`);
    if (missingRequired.length > 0) {
      console.log(`- missing required scopes: ${missingRequired.join(", ")}`);
      bump(summary, "failed", `Missing required scopes: ${missingRequired.join(", ")}`);
      return;
    }
    if (missingRecommended.length > 0) {
      console.log(`- missing recommended scopes: ${missingRecommended.join(", ")}`);
      bump(summary, "skipped", `Missing recommended scopes: ${missingRecommended.join(", ")}`);
      return;
    }
    bump(summary, "skipped", "Preflight completed successfully");
  } catch (error) {
    bump(summary, "failed", "Preflight failed");
    throw error;
  }
}

module.exports = {
  runPreflight
};
