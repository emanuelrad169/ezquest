require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const H = {
  'X-Shopify-Access-Token': T,
  'Content-Type': 'application/json'
};

const blogId = fs.readFileSync('.tmp-blog-id', 'utf8').trim();
const scrapedArticles = JSON.parse(
  fs.readFileSync('scripts/blog-articles.json')
);
const seedArticles = require('./shopify-admin/seeds/blogs').articles.map(article => ({
  title: article.title,
  handle: article.handle,
  body_html: article.bodyHtml
}));
const sourceArticles = [...scrapedArticles, ...seedArticles];

async function getExistingArticles() {
  const r = await fetch(
    'https://' + S + '/admin/api/2026-01/blogs/' + blogId +
      '/articles.json?limit=50&fields=id,title,handle,body_html,image',
    { headers: H }
  );
  return (await r.json()).articles || [];
}

async function updateArticle(id, updates) {
  const r = await fetch(
    'https://' + S + '/admin/api/2026-01/blogs/' + blogId +
      '/articles/' + id + '.json',
    {
      method: 'PUT',
      headers: H,
      body: JSON.stringify({ article: { id, ...updates } })
    }
  );
  return (await r.json()).article;
}

async function downloadImageAsBase64(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  return buf.toString('base64');
}

async function run() {
  const existing = await getExistingArticles();
  console.log('Existing articles:', existing.length);

  for (const scraped of sourceArticles) {
    const match = existing.find(a =>
      a.handle === scraped.handle ||
      a.title?.toLowerCase() === scraped.title?.toLowerCase()
    );

    if (!match) {
      console.log('NO MATCH:', scraped.title?.slice(0, 40));
      continue;
    }

    const updates = {};
    const currentBodyLen = (match.body_html || '')
      .replace(/<[^>]+>/g, '').length;
    const scrapedBodyLen = (scraped.body_html || '')
      .replace(/<[^>]+>/g, '').length;

    if (scrapedBodyLen > currentBodyLen + 200) {
      updates.body_html = scraped.body_html;
      console.log('📝 Will update body:', match.title?.slice(0, 40));
      console.log('   Current:', currentBodyLen, '→ Scraped:', scrapedBodyLen);
    }

    if (!match.image?.src && scraped.image_url) {
      try {
        const b64 = await downloadImageAsBase64(scraped.image_url);
        const ext = scraped.image_url.split('.').pop()
          .split('?')[0].toLowerCase();
        updates.image = {
          attachment: b64,
          filename: 'article-' + match.id + '.' + ext,
          alt: match.title
        };
        console.log('🖼  Will add image:', scraped.image_url.slice(0, 60));
      } catch (e) {
        console.log('❌ Image download failed:', e.message);
      }
    }

    if (Object.keys(updates).length === 0) {
      console.log('✅ OK:', match.title?.slice(0, 40));
      continue;
    }

    try {
      const updated = await updateArticle(match.id, updates);
      const newBodyLen = (updated?.body_html || '')
        .replace(/<[^>]+>/g, '').length;
      console.log('✅ UPDATED:', match.title?.slice(0, 40));
      console.log('   New body:', newBodyLen, 'chars');
      console.log('   Image:', updated?.image?.src ? '✅' : '❌');
    } catch (e) {
      console.log('❌ UPDATE FAILED:', match.title?.slice(0, 40), e.message);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nDone.');
}

run().catch(e => console.log('FAILED:', e.message));
