const collections = require("../../seeds/collections");
const { findCollectionByHandle } = require("../lookups");
const { findPublicationByName, publishResourceToPublication } = require("../publications");
const { bump } = require("../summary");

async function createCollection(client, collection) {
  const mutation = `
    mutation CreateCollection($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
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
    { input: collection },
    { label: `Create collection ${collection.handle}` }
  );
  client.assertUserErrors(data.collectionCreate.userErrors, `Create collection ${collection.handle}`);
  return data.collectionCreate.collection;
}

async function updateCollection(client, existing, collection) {
  const mutation = `
    mutation UpdateCollection($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection {
          id
          title
          handle
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
    { input: { id: existing.id, ...collection } },
    { label: `Update collection ${collection.handle}` }
  );
  client.assertUserErrors(data.collectionUpdate.userErrors, `Update collection ${collection.handle}`);
  return data.collectionUpdate.collection;
}

async function seedCollections(context, summary) {
  const { client, dryRun } = context;
  const onlineStorePublication = dryRun ? null : await findPublicationByName(client, "Online Store");

  for (const collection of collections) {
    try {
      const existing = await findCollectionByHandle(client, collection.handle);
      if (!existing) {
        if (dryRun) {
          console.log(`[dry-run] create collection ${collection.handle}`);
          bump(summary, "created", `Would create collection ${collection.handle}`);
          continue;
        }

        const createdCollection = await createCollection(client, collection);
        if (onlineStorePublication) {
          await publishResourceToPublication(client, createdCollection.id, onlineStorePublication.id);
        }
        console.log(`[shopify-admin] Created collection ${collection.handle}`);
        bump(summary, "created");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] update collection ${collection.handle}`);
        bump(summary, "updated", `Would update collection ${collection.handle}`);
        continue;
      }

      const updatedCollection = await updateCollection(client, existing, collection);
      if (onlineStorePublication) {
        await publishResourceToPublication(client, updatedCollection.id, onlineStorePublication.id);
      }
      console.log(`[shopify-admin] Updated collection ${collection.handle}`);
      bump(summary, "updated");
    } catch (error) {
      console.error(`[shopify-admin] Failed collection ${collection.handle}`);
      console.error(error.message);
      bump(summary, "failed", `Collection ${collection.handle} failed`);
    }
  }
}

module.exports = {
  seedCollections
};
