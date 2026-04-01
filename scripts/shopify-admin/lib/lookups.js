async function findSingleByQuery(client, resource, fields, queryText) {
  const query = `
    query FindResource($query: String!) {
      ${resource}(first: 1, query: $query) {
        nodes {
          ${fields}
        }
      }
    }
  `;

  const data = await client.graphql(query, { query: queryText }, { label: `Lookup ${resource}` });
  return data && data[resource] && data[resource].nodes ? data[resource].nodes[0] || null : null;
}

async function findPageByHandle(client, handle) {
  return findSingleByQuery(client, "pages", "id title handle templateSuffix body", `handle:${handle}`);
}

async function findBlogByHandle(client, handle) {
  return findSingleByQuery(client, "blogs", "id title handle", `handle:${handle}`);
}

async function findCollectionByHandle(client, handle) {
  return findSingleByQuery(client, "collections", "id title handle", `handle:${handle}`);
}

async function findProductByHandle(client, handle) {
  return findSingleByQuery(client, "products", "id title handle", `handle:${handle}`);
}

module.exports = {
  findPageByHandle,
  findBlogByHandle,
  findCollectionByHandle,
  findProductByHandle
};
