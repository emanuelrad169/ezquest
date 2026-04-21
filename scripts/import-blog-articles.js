require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

async function getBlogId() {
  const r = await fetch(
    'https://'+S+'/admin/api/2026-01/blogs.json',
    {headers:{'X-Shopify-Access-Token':T}}
  );
  const d = await r.json();
  const blog = d.blogs?.find(b => b.handle === 'resources');
  if (!blog) throw new Error('Blog "resources" not found');
  return blog.id;
}

async function articleExists(blogId, title) {
  const r = await fetch(
    `https://${S}/admin/api/2026-01/blogs/${blogId}/articles.json?limit=250&fields=id,title`,
    {headers:{'X-Shopify-Access-Token':T}}
  );
  const d = await r.json();
  return d.articles?.some(a => a.title === title);
}

async function createArticle(blogId, article) {
  const payload = {
    article: {
      title: article.title,
      body_html: article.body_html,
      author: article.author || 'EZQuest',
      tags: article.tags,
      published_at: article.published_at,
      published: true
    }
  };

  // Attach featured image by URL if present
  if (article.image_url) {
    payload.article.image = { src: article.image_url };
  }

  const r = await fetch(
    `https://${S}/admin/api/2026-01/blogs/${blogId}/articles.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': T,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  const d = await r.json();

  if (d.errors) {
    console.log('  ERROR:', JSON.stringify(d.errors));
    return null;
  }

  console.log('  CREATED:', d.article?.title);
  console.log('  URL: /blogs/resources/' + d.article?.handle);
  return d.article;
}

async function run() {
  const blogId = await getBlogId();
  console.log('Blog ID:', blogId);

  const articles = JSON.parse(fs.readFileSync('scripts/blog-articles.json'));
  console.log('\nImporting', articles.length, 'articles...\n');

  let created = 0;
  let skipped = 0;
  const report = [];

  for (const article of articles) {
    console.log('Processing:', article.title);

    const exists = await articleExists(blogId, article.title);
    if (exists) {
      console.log('  SKIP (already exists)');
      skipped++;
      report.push({ title: article.title, published: article.published_at.split('T')[0], tags: article.tags, status: 'skipped (exists)' });
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    const result = await createArticle(blogId, article);
    if (result) {
      created++;
      report.push({ title: article.title, published: article.published_at.split('T')[0], tags: article.tags, status: 'created', handle: result.handle });
    } else {
      report.push({ title: article.title, published: article.published_at.split('T')[0], tags: article.tags, status: 'failed' });
    }
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped / ${articles.length} total`);
  console.log('View: https://'+S+'/blogs/resources');

  fs.writeFileSync('scripts/blog-import-report.json', JSON.stringify(report, null, 2));
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
