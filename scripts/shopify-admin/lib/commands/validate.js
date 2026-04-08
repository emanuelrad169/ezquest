const { metaobjectDefinitions, productMetafieldDefinitions } = require("../../seeds/definitions");
const starterContent = require("../../seeds/starter-content");
const seedProducts = require("../../seeds/products");
const { findProductByHandle } = require("../lookups");
const { bump } = require("../summary");

async function safeGetMetaobjectDefinitions(client) {
  try {
    const data = await client.graphql(
      `
        query ValidateMetaobjectDefinitions {
          metaobjectDefinitions(first: 250) {
            nodes {
              id
              type
              name
              fieldDefinitions {
                key
              }
            }
          }
        }
      `,
      {},
      { label: "Validate metaobject definitions" }
    );

    return {
      accessible: true,
      byType: new Map(data.metaobjectDefinitions.nodes.map((item) => [item.type, item]))
    };
  } catch (error) {
    return {
      accessible: false,
      error
    };
  }
}

async function getProductMetafieldDefinitions(client) {
  const data = await client.graphql(
    `
      query ValidateProductMetafields {
        metafieldDefinitions(first: 250, ownerType: PRODUCT, namespace: "ezquest") {
          nodes {
            id
            namespace
            key
            name
            type {
              name
            }
          }
        }
      }
    `,
    {},
    { label: "Validate product metafield definitions" }
  );

  return new Map(data.metafieldDefinitions.nodes.map((item) => [`${item.namespace}.${item.key}`, item]));
}

async function getMetaobjectEntriesByType(client, type) {
  const data = await client.graphql(
    `
      query ValidateMetaobjectsByType($type: String!) {
        metaobjects(first: 100, type: $type) {
          nodes {
            id
            handle
            type
          }
        }
      }
    `,
    { type },
    { label: `Validate metaobjects ${type}` }
  );

  return data.metaobjects.nodes;
}

async function getProductStructuredState(client, handle) {
  const product = await findProductByHandle(client, handle);
  if (!product) {
    return { handle, exists: false };
  }

  const data = await client.graphql(
    `
      query ValidateProductStructuredState($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          supportSummary: metafield(namespace: "ezquest", key: "support_summary") { id }
          featureHighlights: metafield(namespace: "ezquest", key: "feature_highlights") { id }
          compatibilitySummary: metafield(namespace: "ezquest", key: "compatibility_summary") { id }
          specRows: metafield(namespace: "ezquest", key: "spec_rows") { id }
          manuals: metafield(namespace: "ezquest", key: "manuals") { id }
          downloads: metafield(namespace: "ezquest", key: "downloads") { id }
          firmware: metafield(namespace: "ezquest", key: "firmware") { id }
          userGuides: metafield(namespace: "ezquest", key: "user_guides") { id }
          compatibilityEntries: metafield(namespace: "ezquest", key: "compatibility_entries") { id }
          useCases: metafield(namespace: "ezquest", key: "use_cases") { id }
          compareGroup: metafield(namespace: "ezquest", key: "compare_group") { id }
          compareRole: metafield(namespace: "ezquest", key: "compare_role") { id }
          recommendedPriority: metafield(namespace: "ezquest", key: "recommended_priority") { id }
          bestFor: metafield(namespace: "ezquest", key: "best_for") { id }
          compareShortReason: metafield(namespace: "ezquest", key: "compare_short_reason") { id }
          faqItems: metafield(namespace: "ezquest", key: "faq_items") { id }
        }
      }
    `,
    { id: product.id },
    { label: `Validate structured product ${handle}` }
  );

  const p = data.product;
  return {
    handle,
    exists: true,
    id: p.id,
    title: p.title,
    support_summary: Boolean(p.supportSummary),
    feature_highlights: Boolean(p.featureHighlights),
    compatibility_summary: Boolean(p.compatibilitySummary),
    spec_rows: Boolean(p.specRows),
    manuals: Boolean(p.manuals),
    downloads: Boolean(p.downloads),
    firmware: Boolean(p.firmware),
    user_guides: Boolean(p.userGuides),
    compatibility_entries: Boolean(p.compatibilityEntries),
    use_cases: Boolean(p.useCases),
    compare_group: Boolean(p.compareGroup),
    compare_role: Boolean(p.compareRole),
    recommended_priority: Boolean(p.recommendedPriority),
    best_for: Boolean(p.bestFor),
    compare_short_reason: Boolean(p.compareShortReason),
    faq_items: Boolean(p.faqItems)
  };
}

function printSection(title) {
  console.log("");
  console.log(`[shopify-admin] ${title}`);
}

async function runValidation(context, summary) {
  const { client } = context;

  try {
    const definitionState = await safeGetMetaobjectDefinitions(client);
    const metafieldState = await getProductMetafieldDefinitions(client);

    printSection("Validation summary");

    if (!definitionState.accessible) {
      console.log("- metaobject definitions: not accessible with current scopes");
      console.log("- add scopes: read_metaobject_definitions, write_metaobject_definitions");
      bump(summary, "skipped", "Metaobject definitions not accessible with current scopes");
    } else {
      console.log("- metaobject definitions:");
      for (const definition of metaobjectDefinitions) {
        const existing = definitionState.byType.get(definition.type);
        const status = existing ? "exists" : "missing";
        console.log(`  - ${definition.type}: ${status}${existing ? ` (${existing.id})` : ""}`);
        if (existing) {
          const existingKeys = new Set((existing.fieldDefinitions || []).map((field) => field.key));
          const missingKeys = definition.fieldDefinitions
            .map((field) => field.key)
            .filter((key) => !existingKeys.has(key));

          if (missingKeys.length > 0) {
            console.log(`    - missing fields: ${missingKeys.join(", ")}`);
            bump(summary, "failed", `Missing fields on ${definition.type}: ${missingKeys.join(", ")}`);
          }
        }
        bump(summary, existing ? "skipped" : "failed", existing ? `Definition exists: ${definition.type}` : `Definition missing: ${definition.type}`);
      }
    }

    printSection("Metafield definitions");
    for (const definition of productMetafieldDefinitions) {
      const key = `${definition.namespace}.${definition.key}`;
      const existing = metafieldState.get(key);
      const state = existing ? "exists" : "missing";
      console.log(`- ${key}: ${state}${existing ? ` (${existing.type.name})` : ""}`);
      bump(summary, existing ? "skipped" : "failed", existing ? `Metafield exists: ${key}` : `Metafield missing: ${key}`);
    }

    printSection("Structured entry counts");
    for (const definition of metaobjectDefinitions) {
      const entries = await getMetaobjectEntriesByType(client, definition.type);
      console.log(`- ${definition.type}: ${entries.length}`);
      if (entries.length > 0) {
        bump(summary, "skipped", `${definition.type} entries: ${entries.length}`);
      } else {
        bump(summary, "skipped", `${definition.type} entries: 0`);
      }
    }

    printSection("Product structured linkage");
    const linkedProducts = new Set([
      ...starterContent.products.map((product) => product.handle),
      ...starterContent.useCases.flatMap((useCase) => useCase.productHandles || []),
      ...seedProducts.filter((product) => Array.isArray(product.useCaseHandles) && product.useCaseHandles.length > 0).map((product) => product.handle),
      ...starterContent.comparisonGroups.flatMap((group) => group.productHandles)
    ]);

    for (const handle of linkedProducts) {
      const state = await getProductStructuredState(client, handle);
      if (!state.exists) {
        console.log(`- ${handle}: missing product`);
        bump(summary, "failed", `Missing product: ${handle}`);
        continue;
      }

      console.log(`- ${handle}:`);
      for (const key of [
        "support_summary",
        "feature_highlights",
        "compatibility_summary",
        "spec_rows",
        "manuals",
        "downloads",
        "firmware",
        "user_guides",
        "compatibility_entries",
        "use_cases",
        "compare_group",
        "compare_role",
        "recommended_priority",
        "best_for",
        "compare_short_reason",
        "faq_items"
      ]) {
        console.log(`  - ${key}: ${state[key] ? "linked" : "missing"}`);
      }

      const missing = Object.entries(state)
        .filter(([key, value]) => !["handle", "exists", "id", "title"].includes(key) && !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        bump(summary, "failed", `${handle} missing structured links: ${missing.join(", ")}`);
      } else {
        bump(summary, "skipped", `${handle} fully linked`);
      }
    }

    printSection("Readiness");
    console.log("- PDP structured rendering requires:");
    console.log("  - metaobject definitions present");
    console.log("  - linked metaobject metafields present on the product");
    console.log("- Support page structured rendering requires:");
    console.log("  - manuals, downloads, compatibility entries, and FAQ items to exist as metaobjects");
    console.log("  - those entries to be linked into the product and/or global support flow");
  } catch (error) {
    console.error("[shopify-admin] Validation failed");
    console.error(error.message);
    bump(summary, "failed", "Validation failed");
  }
}

module.exports = {
  runValidation
};
