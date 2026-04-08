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
          fieldDefinitions {
            key
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, {}, { label: "List metaobject definitions" });
  return data.metaobjectDefinitions.nodes;
}

function buildFieldDefinitionPayload(field, definitionIds) {
  const payload = {
    name: field.name,
    key: field.key,
    type: field.type,
    required: Boolean(field.required)
  };

  if (field.metaobjectDefinitionType) {
    const targetDefinitionId = definitionIds.get(field.metaobjectDefinitionType);
    if (!targetDefinitionId) {
      throw new Error(
        `Metaobject definition ${field.metaobjectDefinitionType} must exist before field ${field.key} can be created`
      );
    }

    payload.validations = [
      {
        name: "metaobject_definition_id",
        value: targetDefinitionId
      }
    ];
  }

  return payload;
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
    fieldDefinitions: definition.fieldDefinitions.map((field) => {
      const fieldPayload = {
        name: field.name,
        key: field.key,
        type: field.type,
        required: Boolean(field.required)
      };

      if (field.validations) {
        fieldPayload.validations = field.validations;
      }

      return fieldPayload;
    })
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

async function updateMetaobjectDefinition(client, id, definition) {
  const mutation = `
    mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) {
        metaobjectDefinition {
          id
          type
          name
          fieldDefinitions {
            key
          }
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
    { id, definition },
    { label: `Update metaobject definition ${definition.type || id}` }
  );

  client.assertUserErrors(
    data.metaobjectDefinitionUpdate.userErrors,
    `Update metaobject definition ${definition.type || id}`
  );

  return data.metaobjectDefinitionUpdate.metaobjectDefinition;
}

async function seedMetaobjectDefinitions(context, summary) {
  const { client, dryRun } = context;

  try {
    const existing = await getMetaobjectDefinitions(client);
    const byType = new Map(existing.map((definition) => [definition.type, definition]));

    for (const definition of metaobjectDefinitions) {
      const existing = byType.get(definition.type);

      if (existing) {
        const existingFieldKeys = new Set((existing.fieldDefinitions || []).map((field) => field.key));
        const missingFields = definition.fieldDefinitions.filter((field) => !existingFieldKeys.has(field.key));

        if (missingFields.length === 0) {
          console.log(`[shopify-admin] Skipped metaobject definition ${definition.type} (already exists)`);
          bump(summary, "skipped");
          continue;
        }

        if (dryRun) {
          console.log(`[dry-run] update metaobject definition ${definition.type} (+${missingFields.length} fields)`);
          bump(summary, "updated", `Would add ${missingFields.length} fields to ${definition.type}`);
          continue;
        }

        const updated = await updateMetaobjectDefinition(client, existing.id, {
          name: definition.name,
          fieldDefinitions: missingFields.map((field) => ({
            create: buildFieldDefinitionPayload(field, new Map([...byType.entries()].map(([type, item]) => [type, item.id])))
          }))
        });

        byType.set(definition.type, updated);
        console.log(`[shopify-admin] Updated metaobject definition ${definition.type} (+${missingFields.length} fields)`);
        bump(summary, "updated", `Added ${missingFields.length} fields to ${definition.type}`);
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] create metaobject definition ${definition.type}`);
        bump(summary, "created", `Would create metaobject definition ${definition.type}`);
        continue;
      }

      const payload = {
        ...definition,
        fieldDefinitions: definition.fieldDefinitions.map((field) =>
          buildFieldDefinitionPayload(field, new Map([...byType.entries()].map(([type, item]) => [type, item.id])))
        )
      };

      const created = await createMetaobjectDefinition(client, payload);
      byType.set(definition.type, created);
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
