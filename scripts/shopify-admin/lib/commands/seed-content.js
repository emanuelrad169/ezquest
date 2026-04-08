const starterContent = require("../../seeds/starter-content");
const seedProducts = require("../../seeds/products");
const { findProductByHandle } = require("../lookups");
const { bump } = require("../summary");

async function listMetaobjectsByType(client, type) {
  const query = `
    query MetaobjectsByType($type: String!) {
      metaobjects(first: 100, type: $type) {
        nodes {
          id
          handle
          type
          displayName
          fields {
            key
            value
          }
        }
      }
    }
  `;

  const data = await client.graphql(query, { type }, { label: `List metaobjects ${type}` });
  return data.metaobjects.nodes;
}

function fieldValueMap(entry) {
  const map = {};
  for (const field of entry.fields || []) {
    map[field.key] = field.value;
  }
  return map;
}

async function upsertMetaobject(client, { type, handle, fields }, existingByHandle, dryRun) {
  const existing = existingByHandle.get(handle);

  if (dryRun) {
    return { action: existing ? "updated" : "created", id: existing ? existing.id : null };
  }

  if (!existing) {
    const mutation = `
      mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
            type
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
        metaobject: {
          type,
          handle,
          fields
        }
      },
      { label: `Create metaobject ${type}:${handle}` }
    );

    client.assertUserErrors(data.metaobjectCreate.userErrors, `Create metaobject ${type}:${handle}`);
    return { action: "created", id: data.metaobjectCreate.metaobject.id };
  }

  const mutation = `
    mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          handle
          type
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
      id: existing.id,
      metaobject: {
        fields
      }
    },
    { label: `Update metaobject ${type}:${handle}` }
  );

  client.assertUserErrors(data.metaobjectUpdate.userErrors, `Update metaobject ${type}:${handle}`);
  return { action: "updated", id: data.metaobjectUpdate.metaobject.id };
}

async function setProductMetafields(client, productId, metafields, dryRun) {
  if (dryRun) {
    return;
  }

  const mutation = `
    mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
          namespace
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await client.graphql(mutation, { metafields }, { label: "Set product metafields" });
  client.assertUserErrors(data.metafieldsSet.userErrors, "Set product metafields");
}

function buildReferenceValue(ids) {
  return JSON.stringify(ids);
}

function buildOptionalReferenceValue(ids) {
  return ids.length > 0 ? buildReferenceValue(ids) : "";
}

function richTextFromHtml(html) {
  const paragraphs = String(html || "")
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<\/?p>/gi, "")
    .split(/\n+/)
    .map((item) => item.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);

  return JSON.stringify({
    type: "root",
    children: (paragraphs.length > 0 ? paragraphs : [""]).map((paragraph) => ({
      type: "paragraph",
      children: [{ type: "text", value: paragraph }]
    }))
  });
}

function normalizeSeedUrl(url, shopDomain) {
  const normalized = String(url || "").trim();

  if (normalized === "") {
    return "";
  }

  if (/^(https?:|mailto:|sms:|tel:)/i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return `https://${shopDomain}${normalized}`;
  }

  return normalized;
}

async function seedStarterContent(context, summary) {
  const { client, dryRun } = context;
  const seedProductByHandle = new Map(seedProducts.map((product) => [product.handle, product]));

  try {
    const specRows = await listMetaobjectsByType(client, "ezquest_spec_row");
    const manuals = await listMetaobjectsByType(client, "ezquest_manual");
    const downloads = await listMetaobjectsByType(client, "ezquest_download");
    const firmware = await listMetaobjectsByType(client, "ezquest_firmware");
    const userGuides = await listMetaobjectsByType(client, "ezquest_user_guide");
    const compatibilityEntries = await listMetaobjectsByType(client, "ezquest_compatibility_entry");
    const troubleshootingItems = await listMetaobjectsByType(client, "ezquest_troubleshooting_item");
    const faqItems = await listMetaobjectsByType(client, "ezquest_faq_item");
    const useCases = await listMetaobjectsByType(client, "ezquest_use_case");
    const compareGroups = await listMetaobjectsByType(client, "ezquest_comparison_group");
    const decisionGuideEntries = await listMetaobjectsByType(client, "ezquest_decision_guide_entry");

    const byType = {
      ezquest_spec_row: new Map(specRows.map((item) => [item.handle, item])),
      ezquest_manual: new Map(manuals.map((item) => [item.handle, item])),
      ezquest_download: new Map(downloads.map((item) => [item.handle, item])),
      ezquest_firmware: new Map(firmware.map((item) => [item.handle, item])),
      ezquest_user_guide: new Map(userGuides.map((item) => [item.handle, item])),
      ezquest_compatibility_entry: new Map(compatibilityEntries.map((item) => [item.handle, item])),
      ezquest_troubleshooting_item: new Map(troubleshootingItems.map((item) => [item.handle, item])),
      ezquest_faq_item: new Map(faqItems.map((item) => [item.handle, item])),
      ezquest_use_case: new Map(useCases.map((item) => [item.handle, item])),
      ezquest_comparison_group: new Map(compareGroups.map((item) => [item.handle, item])),
      ezquest_decision_guide_entry: new Map(decisionGuideEntries.map((item) => [item.handle, item]))
    };

    const productIdByHandle = new Map();
    const referencedProductHandles = new Set([
      ...seedProducts.map((product) => product.handle),
      ...starterContent.products.map((product) => product.handle),
      ...starterContent.comparisonGroups.flatMap((group) => group.productHandles || [])
    ]);

    for (const handle of referencedProductHandles) {
      const product = await findProductByHandle(client, handle);
      if (!product) {
        console.log(`[shopify-admin] Product ${handle} not found yet; related content linkage will be deferred until it exists`);
        bump(summary, "skipped", `Product ${handle} not found yet; content linkage deferred`);
        continue;
      }
      productIdByHandle.set(handle, product.id);
    }

    const useCaseIdByHandle = new Map();
    for (const useCase of starterContent.useCases || []) {
      const linkedProductIds = (useCase.productHandles || [])
        .map((handleValue) => productIdByHandle.get(handleValue))
        .filter(Boolean);
      const result = await upsertMetaobject(
        client,
        {
          type: "ezquest_use_case",
          handle: useCase.slug,
          fields: [
            { key: "title", value: useCase.title },
            { key: "slug", value: useCase.slug },
            { key: "description", value: useCase.description },
            { key: "sort_order", value: String(useCase.sort_order) },
            { key: "products", value: buildOptionalReferenceValue(linkedProductIds) }
          ].filter((field) => field.value !== "")
        },
        byType.ezquest_use_case,
        dryRun
      );
      if (result.id) {
        useCaseIdByHandle.set(useCase.slug, result.id);
        byType.ezquest_use_case.set(useCase.slug, { id: result.id, handle: useCase.slug, fields: [] });
      }
      bump(summary, result.action);
    }

    for (const productSeed of seedProducts) {
      const productId = productIdByHandle.get(productSeed.handle);
      if (!productId) {
        continue;
      }

      const linkedUseCaseIds = (productSeed.useCaseHandles || [])
        .map((handleValue) => useCaseIdByHandle.get(handleValue))
        .filter(Boolean);

      if (linkedUseCaseIds.length === 0) {
        continue;
      }

      await setProductMetafields(
        client,
        productId,
        [
          {
            ownerId: productId,
            namespace: "ezquest",
            key: "use_cases",
            type: "list.metaobject_reference",
            value: buildReferenceValue(linkedUseCaseIds)
          }
        ],
        dryRun
      );

      console.log(`[shopify-admin] Linked use cases to product ${productSeed.handle}`);
      bump(summary, "updated", `Linked use cases to ${productSeed.handle}`);
    }

    for (const productSeed of starterContent.products) {
      const productId = productIdByHandle.get(productSeed.handle) || null;
      const linkedSeedProduct = seedProductByHandle.get(productSeed.handle);

      const specIds = [];
      for (const row of productSeed.specRows) {
        const handle = `${productSeed.handle}-${row.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_spec_row",
            handle,
            fields: [
              { key: "label", value: row.label },
              { key: "spec_value", value: row.spec_value },
              { key: "sort_order", value: String(row.sort_order) }
            ]
          },
          byType.ezquest_spec_row,
          dryRun
        );
        if (result.id) {
          specIds.push(result.id);
          byType.ezquest_spec_row.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const manualIds = [];
      for (const manual of productSeed.manuals) {
        const handle = manual.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_manual",
            handle,
            fields: [
              { key: "title", value: manual.title },
              { key: "manual_type", value: manual.manual_type },
              { key: "summary", value: manual.summary },
              { key: "version", value: manual.version },
              { key: "language", value: manual.language },
              { key: "button_label", value: manual.button_label },
              { key: "platforms", value: JSON.stringify(manual.platforms) },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "sort_order", value: String(manual.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_manual,
          dryRun
        );
        if (result.id) {
          manualIds.push(result.id);
          byType.ezquest_manual.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const userGuideIds = [];
      for (const guide of productSeed.userGuides || []) {
        const handle = guide.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_user_guide",
            handle,
            fields: [
              { key: "title", value: guide.title },
              { key: "guide_type", value: guide.guide_type },
              { key: "summary", value: guide.summary },
              { key: "version", value: guide.version },
              { key: "button_label", value: guide.button_label },
              { key: "platforms", value: JSON.stringify(guide.platforms) },
              { key: "workflows", value: JSON.stringify(guide.workflows || []) },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "sort_order", value: String(guide.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_user_guide,
          dryRun
        );
        if (result.id) {
          userGuideIds.push(result.id);
          byType.ezquest_user_guide.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const downloadIds = [];
      for (const download of productSeed.downloads) {
        const handle = download.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_download",
            handle,
            fields: [
              { key: "title", value: download.title },
              { key: "download_type", value: download.download_type },
              { key: "summary", value: download.summary },
              { key: "version", value: download.version },
              { key: "button_label", value: download.button_label },
              { key: "platforms", value: JSON.stringify(download.platforms) },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "sort_order", value: String(download.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_download,
          dryRun
        );
        if (result.id) {
          downloadIds.push(result.id);
          byType.ezquest_download.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const firmwareIds = [];
      for (const firmwareEntry of productSeed.firmware || []) {
        const handle = firmwareEntry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_firmware",
            handle,
            fields: [
              { key: "title", value: firmwareEntry.title },
              { key: "firmware_type", value: firmwareEntry.firmware_type },
              { key: "summary", value: firmwareEntry.summary },
              { key: "version", value: firmwareEntry.version },
              { key: "button_label", value: firmwareEntry.button_label },
              { key: "platforms", value: JSON.stringify(firmwareEntry.platforms) },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "manuals", value: buildOptionalReferenceValue(manualIds) },
              { key: "downloads", value: buildOptionalReferenceValue(downloadIds) },
              { key: "sort_order", value: String(firmwareEntry.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_firmware,
          dryRun
        );
        if (result.id) {
          firmwareIds.push(result.id);
          byType.ezquest_firmware.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const compatibilityIds = [];
      for (const entry of productSeed.compatibilityEntries) {
        const handle = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_compatibility_entry",
            handle,
            fields: [
              { key: "title", value: entry.title },
              { key: "platform", value: entry.platform },
              { key: "device", value: entry.device },
              { key: "workflow", value: entry.workflow },
              { key: "status", value: entry.status },
              { key: "summary", value: entry.summary },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "manuals", value: buildOptionalReferenceValue(manualIds) },
              { key: "downloads", value: buildOptionalReferenceValue(downloadIds) },
              { key: "sort_order", value: String(entry.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_compatibility_entry,
          dryRun
        );
        if (result.id) {
          compatibilityIds.push(result.id);
          byType.ezquest_compatibility_entry.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const faqIds = [];
      for (const faq of productSeed.faqs) {
        const handle = faq.question.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const result = await upsertMetaobject(
          client,
          {
            type: "ezquest_faq_item",
            handle,
            fields: [
              { key: "question", value: faq.question },
              { key: "answer", value: faq.answer },
              { key: "faq_group", value: faq.faq_group },
              { key: "products", value: buildOptionalReferenceValue(productId ? [productId] : []) },
              { key: "sort_order", value: String(faq.sort_order) }
            ].filter((field) => field.value !== "")
          },
          byType.ezquest_faq_item,
          dryRun
        );
        if (result.id) {
          faqIds.push(result.id);
          byType.ezquest_faq_item.set(handle, { id: result.id, handle, fields: [] });
        }
        bump(summary, result.action);
      }

      const compareGroupSeed = starterContent.comparisonGroups[0];
      const compareProductIds = compareGroupSeed.productHandles
        .map((handle) => productIdByHandle.get(handle))
        .filter(Boolean);
      const compareResult = await upsertMetaobject(
        client,
        {
          type: "ezquest_comparison_group",
          handle: compareGroupSeed.key,
          fields: [
            { key: "eyebrow", value: compareGroupSeed.eyebrow },
            { key: "heading", value: compareGroupSeed.heading },
            { key: "description", value: compareGroupSeed.description },
            { key: "group_type", value: compareGroupSeed.group_type },
            { key: "products", value: buildOptionalReferenceValue(compareProductIds) },
            { key: "cta_label", value: compareGroupSeed.cta_label },
            { key: "support_note", value: compareGroupSeed.support_note }
          ].filter((field) => field.value !== "")
        },
        byType.ezquest_comparison_group,
        dryRun
      );
      if (compareResult.id) {
        byType.ezquest_comparison_group.set(compareGroupSeed.key, { id: compareResult.id, handle: compareGroupSeed.key, fields: [] });
        bump(summary, compareResult.action);
      }

      if (!productId) {
        console.log(`[shopify-admin] Seeded reusable starter content for ${productSeed.handle}; product linkage deferred until the product exists`);
        bump(summary, "skipped", `Deferred product metafield linkage for ${productSeed.handle}`);
        continue;
      }

      await setProductMetafields(
        client,
        productId,
        [
          { ownerId: productId, namespace: "ezquest", key: "support_summary", type: "rich_text_field", value: richTextFromHtml(productSeed.supportSummaryHtml) },
          { ownerId: productId, namespace: "ezquest", key: "compatibility_summary", type: "rich_text_field", value: richTextFromHtml(productSeed.compatibilitySummaryHtml) },
          { ownerId: productId, namespace: "ezquest", key: "feature_highlights", type: "list.single_line_text_field", value: JSON.stringify(productSeed.featureHighlights) },
          { ownerId: productId, namespace: "ezquest", key: "spec_rows", type: "list.metaobject_reference", value: buildReferenceValue(specIds) },
          { ownerId: productId, namespace: "ezquest", key: "manuals", type: "list.metaobject_reference", value: buildReferenceValue(manualIds) },
          { ownerId: productId, namespace: "ezquest", key: "downloads", type: "list.metaobject_reference", value: buildReferenceValue(downloadIds) },
          { ownerId: productId, namespace: "ezquest", key: "firmware", type: "list.metaobject_reference", value: buildReferenceValue(firmwareIds) },
          { ownerId: productId, namespace: "ezquest", key: "user_guides", type: "list.metaobject_reference", value: buildReferenceValue(userGuideIds) },
          { ownerId: productId, namespace: "ezquest", key: "compatibility_entries", type: "list.metaobject_reference", value: buildReferenceValue(compatibilityIds) },
          { ownerId: productId, namespace: "ezquest", key: "faq_items", type: "list.metaobject_reference", value: buildReferenceValue(faqIds) },
          { ownerId: productId, namespace: "ezquest", key: "use_cases", type: "list.metaobject_reference", value: buildOptionalReferenceValue(((linkedSeedProduct && linkedSeedProduct.useCaseHandles) || []).map((handleValue) => useCaseIdByHandle.get(handleValue)).filter(Boolean)) },
          { ownerId: productId, namespace: "ezquest", key: "compare_group", type: "metaobject_reference", value: compareResult.id || "" }
        ].filter((item) => item.value !== "")
      , dryRun);

      console.log(`[shopify-admin] Linked starter content to product ${productSeed.handle}`);
      bump(summary, "updated", `Linked starter content to ${productSeed.handle}`);
    }

    for (const issue of starterContent.troubleshootingItems || []) {
      const handle = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const linkedProductIds = (issue.productHandles || [])
        .map((handleValue) => productIdByHandle.get(handleValue))
        .filter(Boolean);
      const result = await upsertMetaobject(
        client,
        {
          type: "ezquest_troubleshooting_item",
          handle,
          fields: [
            { key: "title", value: issue.title },
            { key: "issue_type", value: issue.issue_type },
            { key: "summary", value: issue.summary },
            { key: "primary_label", value: issue.primary_label },
            { key: "primary_url", value: normalizeSeedUrl(issue.primary_url, client.shopDomain) },
            { key: "secondary_label", value: issue.secondary_label },
            { key: "secondary_url", value: normalizeSeedUrl(issue.secondary_url, client.shopDomain) },
            { key: "platforms", value: JSON.stringify(issue.platforms || []) },
            { key: "workflows", value: JSON.stringify(issue.workflows || []) },
            { key: "products", value: buildOptionalReferenceValue(linkedProductIds) },
            { key: "sort_order", value: String(issue.sort_order) }
          ].filter((field) => field.value !== "")
        },
        byType.ezquest_troubleshooting_item,
        dryRun
      );
      if (result.id) {
        byType.ezquest_troubleshooting_item.set(handle, { id: result.id, handle, fields: [] });
      }
      bump(summary, result.action);
    }

    for (const entry of starterContent.decisionGuideEntries || []) {
      const handle = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const linkedProductIds = (entry.productHandles || [])
        .map((handleValue) => productIdByHandle.get(handleValue))
        .filter(Boolean);
      const result = await upsertMetaobject(
        client,
        {
          type: "ezquest_decision_guide_entry",
          handle,
          fields: [
            { key: "title", value: entry.title },
            { key: "role_label", value: entry.role_label },
            { key: "summary", value: entry.summary },
            { key: "primary_label", value: entry.primary_label },
            { key: "primary_url", value: normalizeSeedUrl(entry.primary_url, client.shopDomain) },
            { key: "secondary_label", value: entry.secondary_label },
            { key: "secondary_url", value: normalizeSeedUrl(entry.secondary_url, client.shopDomain) },
            { key: "workflows", value: JSON.stringify(entry.workflows || []) },
            { key: "products", value: buildOptionalReferenceValue(linkedProductIds) },
            { key: "sort_order", value: String(entry.sort_order) }
          ].filter((field) => field.value !== "")
        },
        byType.ezquest_decision_guide_entry,
        dryRun
      );
      if (result.id) {
        byType.ezquest_decision_guide_entry.set(handle, { id: result.id, handle, fields: [] });
      }
      bump(summary, result.action);
    }
  } catch (error) {
    console.error("[shopify-admin] Failed starter content seed");
    if (error.message.includes("No metaobject definition exists for type")) {
      console.error(`${error.message}

Starter content can only be created after the EZQuest metaobject definitions exist in Shopify.
Run the metaobject definition seed after adding:
- read_metaobject_definitions
- write_metaobject_definitions`);
    } else {
      console.error(error.message);
    }
    bump(summary, "failed", "Starter content seed failed");
  }
}

module.exports = {
  seedStarterContent
};
