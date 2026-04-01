const { productMetafieldDefinitions } = require("../../seeds/definitions");
const { bump } = require("../summary");

function explainMetaobjectDefinitionDependency(error) {
  if (!error || !error.message) {
    return error;
  }

  if (error.message.includes("Access denied for metaobjectDefinitions")) {
    error.message = `${error.message}

This metafield seed needs metaobject definition access so it can attach the required metaobject_definition_id validation.
Update the custom app scopes to include:
- read_metaobject_definitions
- write_metaobject_definitions`;
  }

  return error;
}

async function getProductMetafieldDefinitions(client) {
  const query = `
    query ProductMetafieldDefinitions {
      metafieldDefinitions(first: 250, ownerType: PRODUCT, namespace: "ezquest") {
        nodes {
          id
          name
          namespace
          key
          type {
            name
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, {}, { label: "List product metafield definitions" });
  return data.metafieldDefinitions.nodes;
}

async function createMetafieldDefinition(client, definition) {
  const mutation = `
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
          namespace
          key
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    { definition },
    { label: `Create metafield definition ${definition.namespace}.${definition.key}` }
  );

  client.assertUserErrors(
    data.metafieldDefinitionCreate.userErrors,
    `Create metafield definition ${definition.namespace}.${definition.key}`
  );

  return data.metafieldDefinitionCreate.createdDefinition;
}

async function getMetaobjectDefinitions(client) {
  const query = `
    query MetaobjectDefinitionsForMetafields {
      metaobjectDefinitions(first: 250) {
        nodes {
          id
          type
        }
      }
    }
  `;

  const data = await client.graphql(query, {}, { label: "List metaobject definitions for metafield validations" });
  return new Map(data.metaobjectDefinitions.nodes.map((item) => [item.type, item.id]));
}

async function seedProductMetafields(context, summary) {
  const { client, dryRun } = context;

  try {
    const existing = await getProductMetafieldDefinitions(client);
    const existingKeys = new Set(existing.map((item) => `${item.namespace}.${item.key}`));
    let metaobjectDefinitionIds = null;

    if (productMetafieldDefinitions.some((definition) => definition.metaobjectDefinitionType)) {
      try {
        metaobjectDefinitionIds = await getMetaobjectDefinitions(client);
      } catch (error) {
        const explained = explainMetaobjectDefinitionDependency(error);
        console.log(`[shopify-admin] Metaobject-linked metafields will be deferred: ${explained.message.split("\n")[0]}`);
        bump(summary, "skipped", "Metaobject-linked metafields deferred until metaobject definition scopes are added");
      }
    }

    for (const definition of productMetafieldDefinitions) {
      const key = `${definition.namespace}.${definition.key}`;
      if (existingKeys.has(key)) {
        console.log(`[shopify-admin] Skipped metafield definition ${key} (already exists)`);
        bump(summary, "skipped");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] create metafield definition ${key}`);
        bump(summary, "created", `Would create metafield definition ${key}`);
        continue;
      }

      const { metaobjectDefinitionType, ...payload } = definition;

      if (metaobjectDefinitionType) {
        if (!metaobjectDefinitionIds) {
          console.log(`[shopify-admin] Skipped metafield definition ${key} (metaobject definition access not available yet)`);
          bump(summary, "skipped", `Deferred ${key} until metaobject definition scopes are added`);
          continue;
        }

        const definitionId = metaobjectDefinitionIds.get(metaobjectDefinitionType);
        if (!definitionId) {
          console.log(`[shopify-admin] Skipped metafield definition ${key} (missing metaobject definition ${metaobjectDefinitionType})`);
          bump(summary, "skipped", `Missing metaobject definition ${metaobjectDefinitionType} for ${key}`);
          continue;
        }

        payload.validations = [
          {
            name: "metaobject_definition_id",
            value: definitionId
          }
        ];
      }

      await createMetafieldDefinition(client, payload);
      console.log(`[shopify-admin] Created metafield definition ${key}`);
      bump(summary, "created");
    }
  } catch (error) {
    console.error("[shopify-admin] Failed metafield definition seed");
    console.error(explainMetaobjectDefinitionDependency(error).message);
    bump(summary, "failed", "Metafield definition seed failed");
  }
}

module.exports = {
  seedProductMetafields
};
