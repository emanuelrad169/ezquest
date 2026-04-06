const seedProducts = require("../../seeds/products");
const { findPublicationByName, publishResourceToPublication } = require("../publications");
const { bump } = require("../summary");

const TEMPORARY_PRODUCT_MEDIA_MARKERS = [
  "photo-1518770660439-4636190af475",
  "photo-1527443154391-507e9dc6c5cc",
  "photo-1519389950473-47ba0277781c",
  "photo-1498050108023-c5249f4df085",
  "photo-1517336714739-489689fd1ca8",
  "photo-1484704849700-f032a568e944"
];

async function findProductDetailByHandle(client, handle) {
  const query = `
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          vendor
          productType
          descriptionHtml
          options {
            id
            name
            position
            optionValues {
              id
              name
            }
          }
          variants(first: 100) {
            nodes {
              id
              sku
              price
              compareAtPrice
              barcode
              inventoryPolicy
              selectedOptions {
                name
                value
              }
            }
          }
          media(first: 20) {
            nodes {
              ... on MediaImage {
                id
                alt
                status
                image {
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { query: `handle:${handle}` }, { label: `Lookup product ${handle}` });
  return data.products.nodes[0] || null;
}

async function findCollectionDetailByHandle(client, handle) {
  const query = `
    query CollectionByHandle($query: String!) {
      collections(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          products(first: 250) {
            nodes {
              id
              handle
            }
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { query: `handle:${handle}` }, { label: `Lookup collection ${handle}` });
  return data.collections.nodes[0] || null;
}

async function addProductsToCollection(client, collectionId, productIds, handle) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return;
  }

  const mutation = `
    mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        collection {
          id
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
    { id: collectionId, productIds },
    { label: `Add products to collection ${handle}` }
  );

  client.assertUserErrors(data.collectionAddProducts.userErrors, `Add products to collection ${handle}`);
}

function getSeedImageUrls(seed) {
  return Array.isArray(seed.imageUrls) ? seed.imageUrls.filter(Boolean) : [];
}

function isTemporaryRemoteMediaUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === "images.unsplash.com" || hostname.endsWith(".unsplash.com")) {
      return true;
    }

    return TEMPORARY_PRODUCT_MEDIA_MARKERS.some((marker) => pathname.includes(marker));
  } catch {
    return false;
  }
}

function getTemporaryRemoteMediaIds(existing) {
  return (existing.media?.nodes || [])
    .filter((node) => isTemporaryRemoteMediaUrl(node?.image?.url))
    .map((node) => node.id)
    .filter(Boolean);
}

function hasGroupedVariants(seed) {
  return Array.isArray(seed.variants) && seed.variants.length > 0 && Array.isArray(seed.optionNames) && seed.optionNames.length > 0;
}

function buildProductOptions(seed) {
  if (!hasGroupedVariants(seed)) {
    return [];
  }

  return seed.optionNames.map((optionName) => {
    const values = Array.from(
      new Set(
        seed.variants
          .map((variant) => variant.optionValues && variant.optionValues[optionName])
          .filter(Boolean)
      )
    );

    return {
      name: optionName,
      values: values.map((value) => ({ name: value }))
    };
  });
}

function buildVariantSignature(optionNames, optionValues) {
  return optionNames
    .map((optionName) => `${optionName}:${optionValues[optionName] || ""}`)
    .join("|");
}

function buildSelectedOptionsSignature(optionNames, selectedOptions = []) {
  const optionLookup = {};
  for (const selectedOption of selectedOptions) {
    optionLookup[selectedOption.name] = selectedOption.value;
  }
  return buildVariantSignature(optionNames, optionLookup);
}

function buildBulkVariantInput(seed, variant, includeId = false, variantId = null) {
  const input = {
    price: variant.price || seed.price,
    compareAtPrice: variant.compareAtPrice || null,
    barcode: variant.barcode || null,
    inventoryPolicy: variant.inventoryPolicy || "CONTINUE",
    inventoryItem: {
      sku: variant.sku || seed.sku,
      tracked: false
    }
  };

  if (includeId && variantId) {
    input.id = variantId;
  } else {
    input.optionValues = seed.optionNames.map((optionName) => ({
      optionName,
      name: variant.optionValues[optionName]
    }));
  }

  return input;
}

async function createProduct(client, seed) {
  const mutation = `
    mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          handle
          title
          options {
            id
            name
            position
          }
          variants(first: 10) {
            nodes {
              id
              sku
              price
              inventoryPolicy
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const productInput = {
    title: seed.title,
    handle: seed.handle,
    vendor: seed.vendor,
    productType: seed.productType,
    status: seed.status,
    descriptionHtml: seed.descriptionHtml
  };

  const productOptions = buildProductOptions(seed);
  if (productOptions.length > 0) {
    productInput.productOptions = productOptions;
  }

  const data = await client.graphql(
    mutation,
    {
      product: productInput,
      media: getSeedImageUrls(seed).map((url, index) => ({
        alt: `${seed.title} image ${index + 1}`,
        mediaContentType: "IMAGE",
        originalSource: url
      }))
    },
    { label: `Create product ${seed.handle}` }
  );

  client.assertUserErrors(data.productCreate.userErrors, `Create product ${seed.handle}`);
  return data.productCreate.product;
}

async function updateProduct(client, existing, seed) {
  const mutation = `
    mutation UpdateProduct($product: ProductUpdateInput!) {
      productUpdate(product: $product) {
        product {
          id
          handle
          title
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
      product: {
        id: existing.id,
        title: seed.title,
        vendor: seed.vendor,
        productType: seed.productType,
        status: seed.status,
        descriptionHtml: seed.descriptionHtml
      }
    },
    { label: `Update product ${seed.handle}` }
  );

  client.assertUserErrors(data.productUpdate.userErrors, `Update product ${seed.handle}`);
  return data.productUpdate.product;
}

async function addProductMedia(client, productId, seed) {
  const mutation = `
    mutation CreateProductMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
            alt
            status
          }
        }
        mediaUserErrors {
          field
          message
        }
        product {
          id
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    {
      productId,
      media: getSeedImageUrls(seed).map((url, index) => ({
        alt: `${seed.title} image ${index + 1}`,
        mediaContentType: "IMAGE",
        originalSource: url
      }))
    },
    { label: `Add product media ${seed.handle}` }
  );

  client.assertUserErrors(data.productCreateMedia.mediaUserErrors, `Add product media ${seed.handle}`);
}

async function deleteProductMedia(client, productId, mediaIds, handle) {
  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return;
  }

  const mutation = `
    mutation DeleteProductMedia($productId: ID!, $mediaIds: [ID!]!) {
      productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
        deletedMediaIds
        mediaUserErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(
    mutation,
    { productId, mediaIds },
    { label: `Delete product media ${handle}` }
  );

  client.assertUserErrors(data.productDeleteMedia.mediaUserErrors, `Delete product media ${handle}`);
}

async function updateSingleVariant(client, productId, variantId, seed) {
  const mutation = `
    mutation UpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          sku
          price
          inventoryPolicy
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
      productId,
      variants: [
        {
          id: variantId,
          price: seed.price,
          compareAtPrice: seed.compareAtPrice || null,
          barcode: seed.barcode || null,
          inventoryPolicy: "CONTINUE",
          inventoryItem: {
            sku: seed.sku,
            tracked: false
          }
        }
      ]
    },
    { label: `Update product variant ${seed.handle}` }
  );

  client.assertUserErrors(data.productVariantsBulkUpdate.userErrors, `Update product variant ${seed.handle}`);
}

async function createGroupedVariants(client, productId, seed) {
  const mutation = `
    mutation CreateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
      productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
        productVariants {
          id
          sku
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
      productId,
      strategy: "REMOVE_STANDALONE_VARIANT",
      variants: seed.variants.map((variant) => buildBulkVariantInput(seed, variant))
    },
    { label: `Create grouped variants ${seed.handle}` }
  );

  client.assertUserErrors(data.productVariantsBulkCreate.userErrors, `Create grouped variants ${seed.handle}`);
}

async function syncGroupedVariants(client, existing, seed) {
  const desiredOptionNames = seed.optionNames || [];
  const existingOptionNames = (existing.options || []).map((option) => option.name).filter((name) => name !== "Title");

  if (existingOptionNames.length > 0) {
    const mismatch =
      existingOptionNames.length !== desiredOptionNames.length ||
      existingOptionNames.some((name, index) => name !== desiredOptionNames[index]);

    if (mismatch) {
      throw new Error(
        `Existing product ${seed.handle} has option structure [${existingOptionNames.join(", ")}], but the seed expects [${desiredOptionNames.join(", ")}]. Reset the product option structure in Shopify before rerunning grouped variant sync.`
      );
    }
  }

  const desiredBySignature = new Map();
  for (const variant of seed.variants) {
    desiredBySignature.set(buildVariantSignature(desiredOptionNames, variant.optionValues), variant);
  }

  const existingBySignature = new Map();
  for (const variant of existing.variants.nodes) {
    const signature = buildSelectedOptionsSignature(desiredOptionNames, variant.selectedOptions || []);
    if (signature.replace(/\|/g, "").replace(/:/g, "") === "") {
      continue;
    }
    existingBySignature.set(signature, variant);
  }

  const updates = [];
  const creates = [];

  for (const [signature, desiredVariant] of desiredBySignature.entries()) {
    const existingVariant = existingBySignature.get(signature);
    if (existingVariant) {
      updates.push(buildBulkVariantInput(seed, desiredVariant, true, existingVariant.id));
    } else {
      creates.push(buildBulkVariantInput(seed, desiredVariant));
    }
  }

  if (updates.length > 0) {
    const mutation = `
      mutation UpdateGroupedVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants {
            id
            sku
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
      { productId: existing.id, variants: updates },
      { label: `Update grouped variants ${seed.handle}` }
    );

    client.assertUserErrors(data.productVariantsBulkUpdate.userErrors, `Update grouped variants ${seed.handle}`);
  }

  if (creates.length > 0) {
    const mutation = `
      mutation CreateMissingVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $strategy: ProductVariantsBulkCreateStrategy) {
        productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: $strategy) {
          productVariants {
            id
            sku
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
        productId: existing.id,
        strategy: "REMOVE_STANDALONE_VARIANT",
        variants: creates
      },
      { label: `Create missing variants ${seed.handle}` }
    );

    client.assertUserErrors(data.productVariantsBulkCreate.userErrors, `Create missing variants ${seed.handle}`);
  }
}

async function seedProductsCommand(context, summary) {
  const { client, dryRun } = context;
  const onlineStorePublication = dryRun ? null : await findPublicationByName(client, "Online Store");
  const collectionCache = new Map();

  async function syncProductCollections(productId, seed) {
    const collectionHandles = Array.isArray(seed.collectionHandles) ? seed.collectionHandles.filter(Boolean) : [];
    for (const handle of collectionHandles) {
      let collection = collectionCache.get(handle);
      if (!collection) {
        collection = await findCollectionDetailByHandle(client, handle);
        collectionCache.set(handle, collection || null);
      }

      if (!collection) {
        console.warn(`[shopify-admin] Skipping collection assignment for ${seed.handle}; collection ${handle} was not found.`);
        continue;
      }

      const existingProductIds = new Set((collection.products?.nodes || []).map((node) => node.id));
      if (existingProductIds.has(productId)) {
        continue;
      }

      await addProductsToCollection(client, collection.id, [productId], handle);
      collection.products = collection.products || { nodes: [] };
      collection.products.nodes.push({ id: productId, handle: seed.handle });
    }
  }

  for (const seed of seedProducts) {
    try {
      const existing = await findProductDetailByHandle(client, seed.handle);

      if (!existing) {
        if (dryRun) {
          console.log(`[dry-run] create product ${seed.handle}`);
          bump(summary, "created", `Would create product ${seed.handle}`);
          continue;
        }

        const created = await createProduct(client, seed);
        if (hasGroupedVariants(seed)) {
          await createGroupedVariants(client, created.id, seed);
        } else {
          const variantId = created.variants.nodes[0]?.id;
          if (variantId) {
            await updateSingleVariant(client, created.id, variantId, seed);
          }
        }
        if (onlineStorePublication) {
          await publishResourceToPublication(client, created.id, onlineStorePublication.id);
        }
        await syncProductCollections(created.id, seed);
        console.log(`[shopify-admin] Created product ${seed.handle}`);
        bump(summary, "created");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] update product ${seed.handle}`);
        bump(summary, "updated", `Would update product ${seed.handle}`);
        continue;
      }

      await updateProduct(client, existing, seed);
      if (hasGroupedVariants(seed)) {
        await syncGroupedVariants(client, existing, seed);
      } else {
        const currentVariant = existing.variants.nodes[0];
        if (currentVariant?.id) {
          await updateSingleVariant(client, existing.id, currentVariant.id, seed);
        }
      }
      const temporaryRemoteMediaIds = getTemporaryRemoteMediaIds(existing);
      if (temporaryRemoteMediaIds.length > 0 && getSeedImageUrls(seed).length === 0) {
        await deleteProductMedia(client, existing.id, temporaryRemoteMediaIds, seed.handle);
      }
      if ((existing.media?.nodes || []).length === 0 && getSeedImageUrls(seed).length > 0) {
        await addProductMedia(client, existing.id, seed);
      }
      if (onlineStorePublication) {
        await publishResourceToPublication(client, existing.id, onlineStorePublication.id);
      }
      await syncProductCollections(existing.id, seed);
      console.log(`[shopify-admin] Updated product ${seed.handle}`);
      bump(summary, "updated");
    } catch (error) {
      console.error(`[shopify-admin] Failed product seed for ${seed.handle}`);
      console.error(error.message);
      bump(summary, "failed", `Product seed failed for ${seed.handle}`);
    }
  }
}

module.exports = {
  seedProducts: seedProductsCommand
};
