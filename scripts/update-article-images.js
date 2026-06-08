/**
 * update-article-images.js
 *
 * Attaches featured images to the 10 blog articles in the "resources" blog.
 * Images are sourced from existing EZQuest product photos on the Shopify CDN.
 *
 * Run after regenerating SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local:
 *   node scripts/update-article-images.js
 */

require('dotenv').config({ path: '.env.local' });
const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const H = {
  'X-Shopify-Access-Token': T,
  'Content-Type': 'application/json',
};

// Article handle → CDN image URL (matched by topic)
const IMAGE_MAP = {
  'add-multiple-displays-to-macbook-neo-with-ezquest-usb-4-dual-display-8-in-1-hub-pro-series':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/H20008_View1-72.jpg?v=1775918873',
  'ezquest-announces-new-line-of-pro-series-usb-c-hubs':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/H30012_View1-72-2.jpg?v=1775918882',
  'unclutter-your-desk-with-help-from-ezquest':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/X40213_V3_with-Text.jpg?v=1775918937',
  'throw-out-your-cheap-cables-and-replace-them-with-ezquest-cables':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-duraguard-cables.jpg?v=1776771584',
  'boost-your-work-from-home-set-up-with-help-from-ezquest':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-ready-for-desk.jpg?v=1776771590',
  'ezquest-amazon-shop-is-a-one-stop-shop-for-the-holidays':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-power-up.jpg?v=1776771587',
  'get-ahead-of-holiday-travel-with-packing-tips-from-ezquest':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/ezquest-promo-travel-kit.jpg?v=1776771593',
  'ezquest-celebrating-31-years-of-connections':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/H30005_View1-72.jpg?v=1775864959',
  'deep-dive-into-the-ezquest-duraguard-usb4-v2-1-2-meter-cable':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/C41005_View1-72.jpg?v=1775918994',
  'ezquest-products-for-a-successful-school-year':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/X40228-4-text.png?v=1775918946',
  'getting-started-with-the-ezquest-usb-c-multimedia-hub':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/X40213_V3_with-Text.jpg?v=1775918937',
  'why-compatibility-matters-before-you-buy-a-usb-c-accessory':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/X40081_34eff919-3351-4ba0-9e21-5a976f6784d3.jpg?v=1775919114',
  'how-to-choose-the-right-usb-c-hub-for-your-desk-setup':
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/x40031_nf_view1-4000-2.jpg?v=1775918895',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  // Get blog ID
  const blogsR = await fetch(`https://${S}/admin/api/2026-01/blogs.json`, { headers: H })
    .then(r => r.json());
  const blog = blogsR.blogs?.find(b => b.handle === 'resources');
  if (!blog) { console.error('Blog "resources" not found'); process.exit(1); }
  const blogId = blog.id;
  console.log('Blog ID:', blogId);

  // Get all articles
  const artR = await fetch(
    `https://${S}/admin/api/2026-01/blogs/${blogId}/articles.json?limit=50&fields=id,title,handle,image`,
    { headers: H }
  ).then(r => r.json());

  for (const article of artR.articles || []) {
    if (article.image?.src) {
      console.log('✅ SKIP (has image):', article.title?.slice(0, 50));
      continue;
    }

    const imgUrl = IMAGE_MAP[article.handle];
    if (!imgUrl) {
      console.log('⚠️  NO MAP ENTRY:', article.handle);
      continue;
    }

    // Download the CDN image and base64-encode it
    try {
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const b64 = buf.toString('base64');
      const ext = imgUrl.split('?')[0].split('.').pop().toLowerCase();
      const filename = `blog-${article.handle.slice(0, 40)}.${ext}`;

      const r = await fetch(
        `https://${S}/admin/api/2026-01/blogs/${blogId}/articles/${article.id}.json`,
        {
          method: 'PUT',
          headers: H,
          body: JSON.stringify({
            article: {
              id: article.id,
              image: { attachment: b64, filename, alt: article.title },
            },
          }),
        }
      );
      const d = await r.json();
      const ok = !!d.article?.image?.src;
      console.log(ok ? '✅' : '❌', article.title?.slice(0, 50));
      if (!ok) console.log('   Response:', JSON.stringify(d).slice(0, 200));
    } catch (e) {
      console.log('❌ ERROR:', article.title?.slice(0, 40), e.message);
    }

    await sleep(500);
  }

  console.log('\nDone.');
})();
