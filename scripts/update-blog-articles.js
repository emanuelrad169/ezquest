require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const H = {
  'X-Shopify-Access-Token': T,
  'Content-Type': 'application/json'
};
const articles = JSON.parse(fs.readFileSync('scripts/blog-articles.json'));

(async () => {
  const br = await fetch('https://' + S + '/admin/api/2026-01/blogs.json', {
    headers: H
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error('Blogs API ' + r.status + ': ' + JSON.stringify(data).slice(0, 160));
    return data;
  });
  const blog = br.blogs?.find(b => b.handle === 'resources');
  if (!blog) throw new Error('Blog "resources" not found');
  const blogId = blog.id;

  const ar = await fetch(
    'https://' + S + '/admin/api/2026-01/blogs/' +
      blogId + '/articles.json?limit=50&fields=id,title,handle,body_html,image',
    { headers: H }
  ).then(async r => {
    const data = await r.json();
    if (!r.ok) throw new Error('Articles API ' + r.status + ': ' + JSON.stringify(data).slice(0, 160));
    return data;
  });
  const existing = ar.articles || [];

  for (const article of articles) {
    const match = existing.find(a =>
      a.handle === article.handle ||
      a.title?.toLowerCase() === article.title?.toLowerCase()
    );
    if (!match) {
      console.log('NOT FOUND:', article.title?.slice(0, 40));
      continue;
    }

    const payload = { article: { id: match.id } };
    const updates = [];

    const currentLen = (match.body_html || '').length;
    const newLen = (article.body_html || '').length;
    if (currentLen < 2000 && newLen > currentLen) {
      payload.article.body_html = article.body_html;
      updates.push('body(' + newLen + ' chars)');
    }

    const imgUrl = article.image_url || article.imageUrl || '';
    if (!match.image?.src && imgUrl) {
      try {
        const imgRes = await fetch(imgUrl);
        if (imgRes.ok) {
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const b64 = buf.toString('base64');
          const ext = (imgUrl.split('.').pop().split('?')[0] || 'jpg').toLowerCase();
          payload.article.image = {
            attachment: b64,
            filename: 'article-' + match.id + '.' + ext,
            alt: article.title
          };
          updates.push('image');
        } else {
          console.log('  Image fetch failed:', imgRes.status, imgUrl.slice(0, 80));
        }
      } catch (e) {
        console.log('  Image fetch failed:', e.message);
      }
    }

    if (!updates.length) {
      console.log('✅ Already complete:', match.title?.slice(0, 40));
      continue;
    }

    const r = await fetch(
      'https://' + S + '/admin/api/2026-01/blogs/' +
        blogId + '/articles/' + match.id + '.json',
      {
        method: 'PUT',
        headers: H,
        body: JSON.stringify({ article: payload.article })
      }
    );
    const d = await r.json();
    const ok = !d.errors;
    console.log(ok ? '✅' : '❌', 'Updated (' + updates.join(', ') + '):',
      match.title?.slice(0, 40));
    if (!ok) console.log('  Response:', JSON.stringify(d).slice(0, 240));
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\nDone.');
})().catch(e => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
