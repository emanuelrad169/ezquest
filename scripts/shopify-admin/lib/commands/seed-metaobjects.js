const { metaobjectDefinitions } = require("../../seeds/definitions");
const { bump } = require("../summary");

function explainMetaobjectDefinitionScope(error) {
  if (!error || !error.message || !error.message.includes("Access denied for metaobjectDefinitions")) {
    return error;
  }

  error.message = `${error.message}

This command requires Shopify Admin API access to metaobject definitions in addition to metaobject entries.
Update the custom app scopes to include:
- read_metaobject_definitions
- write_metaobject_definitions`;

  return error;
}

async function getMetaobjectDefinitions(client) {
  const query = `
    query MetaobjectDefinitions {
      metaobjectDefinitions(first: 250) {
        nodes {
          id
          type
          name
        }
      }
    }
  `;

  const data = await client.graphql(query, {}, { label: "List metaobject definitions" });
  return data.metaobjectDefinitions.nodes;
}

async function createMetaobjectDefinition(client, definition) {
  const mutation = `
    mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const payload = {
    name: definition.name,
    type: definition.type,
    displayNameKey: definition.displayNameKey,
    fieldDefinitions: definition.fieldDefinitions.map((field) => ({
      name: field.name,
      key: field.key,
      type: field.type,
      required: Boolean(field.required)
    }))
  };

  const data = await client.graphql(
    mutation,
    { definition: payload },
    { label: `Create metaobject definition ${definition.type}` }
  );

  client.assertUserErrors(
    data.metaobjectDefinitionCreate.userErrors,
    `Create metaobject definition ${definition.type}`
  );

  return data.metaobjectDefinitionCreate.metaobjectDefinition;
}

async function seedMetaobjectDefinitions(context, summary) {
  const { client, dryRun } = context;

  try {
    const existing = await getMetaobjectDefinitions(client);
    const byType = new Map(existing.map((definition) => [definition.type, definition]));

    for (const definition of metaobjectDefinitions) {
      if (byType.has(definition.type)) {
        console.log(`[shopify-admin] Skipped metaobject definition ${definition.type} (already exists)`);
        bump(summary, "skipped");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] create metaobject definition ${definition.type}`);
        bump(summary, "created", `Would create metaobject definition ${definition.type}`);
        continue;
      }

      await createMetaobjectDefinition(client, definition);
      console.log(`[shopify-admin] Created metaobject definition ${definition.type}`);
      bump(summary, "created");
    }
  } catch (error) {
    console.error("[shopify-admin] Failed metaobject definition seed");
    console.error(explainMetaobjectDefinitionScope(error).message);
    bump(summary, "failed", "Metaobject definition seed failed");
  }
}

module.exports = {
  seedMetaobjectDefinitions
};
