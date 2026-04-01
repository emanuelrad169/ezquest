async function findPublicationByName(client, name) {
  const query = `
    query FindPublications {
      publications(first: 20) {
        nodes {
          id
          name
          autoPublish
        }
      }
    }
  `;

  const data = await client.graphql(query, {}, { label: "Lookup publications" });
  return data.publications.nodes.find((publication) => publication.name === name) || null;
}

async function publishResourceToPublication(client, resourceId, publicationId) {
  const mutation = `
    mutation PublishResource($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable {
          __typename
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
    {
      id: resourceId,
      input: [{ publicationId }]
    },
    { label: `Publish resource ${resourceId}` }
  );

  client.assertUserErrors(data.publishablePublish.userErrors, `Publish resource ${resourceId}`);
  return data.publishablePublish.publishable;
}

module.exports = {
  findPublicationByName,
  publishResourceToPublication
};
