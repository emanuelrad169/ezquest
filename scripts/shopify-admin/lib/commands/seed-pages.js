const pages = require("../../seeds/pages");
const { findPageByHandle } = require("../lookups");
const { bump } = require("../summary");

function normalizeTemplateSuffix(templateSuffix) {
  if (!templateSuffix) {
    return "";
  }

  return templateSuffix.replace(/^page\./, "");
}

async function createPage(client, page) {
  const mutation = `
    mutation CreatePage($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page {
          id
          handle
          title
          templateSuffix
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
      page: {
        title: page.title,
        handle: page.handle,
        body: page.body,
        templateSuffix: normalizeTemplateSuffix(page.templateSuffix)
      }
    },
    { label: `Create page ${page.handle}` }
  );

  client.assertUserErrors(data.pageCreate.userErrors, `Create page ${page.handle}`);
  return data.pageCreate.page;
}

async function updatePage(client, existingPage, page) {
  const mutation = `
    mutation UpdatePage($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page {
          id
          handle
          title
          templateSuffix
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
      id: existingPage.id,
      page: {
        title: page.title,
        handle: page.handle,
        body: page.body,
        templateSuffix: normalizeTemplateSuffix(page.templateSuffix)
      }
    },
    { label: `Update page ${page.handle}` }
  );

  client.assertUserErrors(data.pageUpdate.userErrors, `Update page ${page.handle}`);
  return data.pageUpdate.page;
}

async function seedPages(context, summary) {
  const { client, dryRun } = context;

  for (const page of pages) {
    try {
      const existing = await findPageByHandle(client, page.handle);

      if (!existing) {
        if (dryRun) {
          console.log(`[dry-run] create page ${page.handle}`);
          bump(summary, "created", `Would create page ${page.handle}`);
          continue;
        }

        await createPage(client, page);
        console.log(`[shopify-admin] Created page ${page.handle}`);
        bump(summary, "created");
        continue;
      }

      const existingTemplate = normalizeTemplateSuffix(existing.templateSuffix);
      const targetTemplate = normalizeTemplateSuffix(page.templateSuffix);
      const needsUpdate =
        existing.title !== page.title ||
        existingTemplate !== targetTemplate ||
        (existing.body || "") !== page.body;

      if (!needsUpdate) {
        console.log(`[shopify-admin] Skipped page ${page.handle} (already current)`);
        bump(summary, "skipped");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] update page ${page.handle}`);
        bump(summary, "updated", `Would update page ${page.handle}`);
        continue;
      }

      await updatePage(client, existing, page);
      console.log(`[shopify-admin] Updated page ${page.handle}`);
      bump(summary, "updated");
    } catch (error) {
      console.error(`[shopify-admin] Failed page ${page.handle}`);
      console.error(error.message);
      bump(summary, "failed", `Page ${page.handle} failed`);
    }
  }
}

module.exports = {
  seedPages
};
