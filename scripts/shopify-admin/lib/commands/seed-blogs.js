const { findBlogByHandle } = require("../lookups");
const { bump } = require("../summary");
const seed = require("../../seeds/blogs");

async function createBlog(client, blog) {
  const mutation = `
    mutation CreateBlog($blog: BlogCreateInput!) {
      blogCreate(blog: $blog) {
        blog {
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

  const data = await client.graphql(mutation, { blog }, { label: `Create blog ${blog.handle}` });
  client.assertUserErrors(data.blogCreate.userErrors, `Create blog ${blog.handle}`);
  return data.blogCreate.blog;
}

async function updateBlog(client, existing, blog) {
  const mutation = `
    mutation UpdateBlog($blog: BlogUpdateInput!) {
      blogUpdate(blog: $blog) {
        blog {
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
    { blog: { id: existing.id, title: blog.title, handle: blog.handle } },
    { label: `Update blog ${blog.handle}` }
  );
  client.assertUserErrors(data.blogUpdate.userErrors, `Update blog ${blog.handle}`);
  return data.blogUpdate.blog;
}

async function createArticle(client, blogId, article) {
  const mutation = `
    mutation CreateArticle($article: ArticleCreateInput!) {
      articleCreate(article: $article) {
        article {
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
    {
      article: {
        blogId,
        title: article.title,
        handle: article.handle,
        summary: article.summary,
        body: article.bodyHtml,
        isPublished: true,
        author: {
          name: article.author || "EZQuest"
        }
      }
    },
    { label: `Create article ${article.handle}` }
  );
  client.assertUserErrors(data.articleCreate.userErrors, `Create article ${article.handle}`);
  return data.articleCreate.article;
}

async function updateArticle(client, existing, blogId, article) {
  const mutation = `
    mutation UpdateArticle($article: ArticleUpdateInput!) {
      articleUpdate(article: $article) {
        article {
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
    {
      article: {
        id: existing.id,
        blogId,
        title: article.title,
        handle: article.handle,
        summary: article.summary,
        body: article.bodyHtml,
        isPublished: true,
        author: {
          name: article.author || "EZQuest"
        }
      }
    },
    { label: `Update article ${article.handle}` }
  );

  client.assertUserErrors(data.articleUpdate.userErrors, `Update article ${article.handle}`);
  return data.articleUpdate.article;
}

async function seedBlogs(context, summary) {
  const { client, dryRun } = context;

  try {
    let blog = await findBlogByHandle(client, seed.blog.handle);

    if (!blog) {
      if (dryRun) {
        console.log(`[dry-run] create blog ${seed.blog.handle}`);
        bump(summary, "created", `Would create blog ${seed.blog.handle}`);
      } else {
        blog = await createBlog(client, seed.blog);
        console.log(`[shopify-admin] Created blog ${seed.blog.handle}`);
        bump(summary, "created");
      }
    } else if (blog.title !== seed.blog.title) {
      if (dryRun) {
        console.log(`[dry-run] update blog ${seed.blog.handle}`);
        bump(summary, "updated", `Would update blog ${seed.blog.handle}`);
      } else {
        blog = await updateBlog(client, blog, seed.blog);
        console.log(`[shopify-admin] Updated blog ${seed.blog.handle}`);
        bump(summary, "updated");
      }
    } else {
      console.log(`[shopify-admin] Skipped blog ${seed.blog.handle} (already current)`);
      bump(summary, "skipped");
    }

    if (!blog) {
      return;
    }

    for (const article of seed.articles) {
      const query = `
        query FindArticle($query: String!) {
          articles(first: 1, query: $query) {
            nodes {
              id
              title
              handle
              summary
            }
          }
        }
      `;
      const data = await client.graphql(query, { query: `blog_id:${blog.id} handle:${article.handle}` }, { label: `Lookup article ${article.handle}` });
      const existing = data.articles.nodes[0] || null;

      if (existing) {
        if (existing.title === article.title && (existing.summary || "") === (article.summary || "")) {
          console.log(`[shopify-admin] Skipped article ${article.handle} (already current)`);
          bump(summary, "skipped");
          continue;
        }

        if (dryRun) {
          console.log(`[dry-run] update article ${article.handle}`);
          bump(summary, "updated", `Would update article ${article.handle}`);
          continue;
        }

        await updateArticle(client, existing, blog.id, article);
        console.log(`[shopify-admin] Updated article ${article.handle}`);
        bump(summary, "updated");
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] create article ${article.handle}`);
        bump(summary, "created", `Would create article ${article.handle}`);
        continue;
      }

      await createArticle(client, blog.id, article);
      console.log(`[shopify-admin] Created article ${article.handle}`);
      bump(summary, "created");
    }
  } catch (error) {
    console.error("[shopify-admin] Failed blog seed");
    console.error(error.message);
    bump(summary, "failed", "Blog seed failed");
  }
}

module.exports = {
  seedBlogs
};
