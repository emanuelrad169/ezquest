const { JSDOM } = require('jsdom');
const fs = require('fs');

const ARTICLES = [
  {
    url: 'https://ezq.com/blog/2026/04/14/add-multiple-displays-to-macbook-neo-with-ezquest-usb-4-dual-display-8-in-1-hub-pro-series/',
    tags: 'hubs,productivity,macbook',
    published: '2026-04-14'
  },
  {
    url: 'https://ezq.com/blog/2026/03/18/ezquest-announces-new-line-of-pro-series-usb-c-hubs/',
    tags: 'hubs,new products,pro series',
    published: '2026-03-18'
  },
  {
    url: 'https://ezq.com/blog/2026/02/13/unclutter-your-desk-with-help-from-ezquest/',
    tags: 'setup guides,workspace,organization',
    published: '2026-02-13'
  },
  {
    url: 'https://ezq.com/blog/2026/01/30/throw-out-your-cheap-cables-and-replace-them-with-ezquest-cables/',
    tags: 'cables,duraguard,quality',
    published: '2026-01-30'
  },
  {
    url: 'https://ezq.com/blog/2025/12/16/boost-your-work-from-home-set-up-with-help-from-ezquest/',
    tags: 'setup guides,work from home,productivity',
    published: '2025-12-16'
  },
  {
    url: 'https://ezq.com/blog/2025/11/21/ezquest-amazon-shop-is-a-one-stop-shop-for-the-holidays/',
    tags: 'gift guide,holiday,shopping',
    published: '2025-11-21'
  },
  {
    url: 'https://ezq.com/blog/2025/10/22/get-ahead-of-holiday-travel-with-packing-tips-from-ezquest/',
    tags: 'travel,tips,accessories',
    published: '2025-10-22'
  },
  {
    url: 'https://ezq.com/blog/2025/09/30/ezquest-celebrating-31-years-of-connections/',
    tags: 'company,about,milestone',
    published: '2025-09-30'
  },
  {
    url: 'https://ezq.com/blog/2025/08/25/deep-dive-into-the-ezquest-duraguard-usb4-v2-1-2-meter-cable/',
    tags: 'cables,usb4,duraguard,product guide',
    published: '2025-08-25'
  },
  {
    url: 'https://ezq.com/blog/2025/08/09/ezquest-products-for-a-successful-school-year/',
    tags: 'back to school,setup guides,students',
    published: '2025-08-09'
  }
];

const IMAGE_FALLBACKS = {
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
    'https://cdn.shopify.com/s/files/1/0735/0265/4662/files/X40228-4-text.png?v=1775918946'
};

function handleFromUrl(url) {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1);
}

function bestFromSrcset(srcset = '') {
  return srcset
    .split(',')
    .map(part => {
      const [url, width] = part.trim().split(/\s+/);
      return { url, width: parseInt(width, 10) || 0 };
    })
    .filter(item => item.url)
    .sort((a, b) => b.width - a.width)[0]?.url || '';
}

function cleanHtml(bodyEl) {
  if (!bodyEl) return '';

  bodyEl.querySelectorAll([
    '.sharedaddy',
    '.jp-relatedposts',
    '.wpcnt',
    '.screen-reader-text',
    '.wp-caption-text',
    'script',
    'style',
    'iframe',
    '.addtoany_share',
    '[class*="share"]',
    '[class*="social"]',
    '[class*="related"]',
    '[class*="ad-"]'
  ].join(', ')).forEach(el => el.remove());

  let body = bodyEl.innerHTML;
  body = body.replace(/\[caption[^\]]*\]/g, '').replace(/\[\/caption\]/g, '');
  body = body.replace(/\[[^\]]+\]/g, '');
  body = body.replace(/\s+class="[^"]*wp-[^"]*"/g, '');
  body = body.replace(/\s+class="[^"]*aligncenter[^"]*"/g, '');
  body = body.replace(/\s+class="[^"]*alignleft[^"]*"/g, '');
  body = body.replace(/\s+class="[^"]*size-[^"]*"/g, '');
  body = body.replace(/\s+class="[^"]*entry-[^"]*"/g, '');
  body = body.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/g, '');
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}

function extractImageUrl(document, bodyEl, handle) {
  const firstImg = bodyEl?.querySelector('img');
  const bodyImage =
    bestFromSrcset(firstImg?.getAttribute('srcset') || '') ||
    firstImg?.src ||
    firstImg?.getAttribute('data-src') ||
    firstImg?.getAttribute('data-lazy-src') ||
    '';
  const metaImage =
    document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    '';
  const thumbnail =
    document.querySelector('.post-thumbnail img')?.src ||
    document.querySelector('[class*="thumbnail"] img')?.src ||
    '';

  return bodyImage || metaImage || thumbnail || IMAGE_FALLBACKS[handle] || '';
}

async function scrapeArticle(meta) {
  console.log('Scraping:', meta.url);

  try {
    const res = await fetch(meta.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      console.log('  HTTP error:', res.status);
      return null;
    }

    const html = await res.text();
    const dom = new JSDOM(html, { url: meta.url });
    const document = dom.window.document;
    const handle = handleFromUrl(meta.url);

    const title =
      document.querySelector('h1.entry-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('title')?.textContent?.split('|')[0]?.trim() ||
      'Untitled';

    const bodyEl = document.querySelector(
      '.entry-content, .post-content, article .content, .single-content, main article, .blog-content'
    );
    const body_html = cleanHtml(bodyEl);
    const image_url = extractImageUrl(document, bodyEl, handle);

    console.log(`  ✓ "${title}" (${body_html.length} chars, image: ${image_url ? 'yes' : 'no'})`);
    return {
      title,
      handle,
      body_html,
      image_url,
      tags: meta.tags,
      published_at: meta.published + 'T12:00:00-07:00',
      author: 'EZQuest',
      source_url: meta.url
    };
  } catch (e) {
    console.log('  ✗ Error:', e.message);
    return null;
  }
}

async function run() {
  const results = [];
  const failed = [];

  for (const meta of ARTICLES) {
    const article = await scrapeArticle(meta);
    if (article) {
      results.push(article);
    } else {
      failed.push(meta.url);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\nScraped: ${results.length}/${ARTICLES.length} articles`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach(url => console.log(' -', url));
  }
  if (!results.length) {
    console.error('No articles scraped; leaving scripts/blog-articles.json unchanged.');
    process.exit(1);
  }

  fs.writeFileSync('scripts/blog-articles.json', JSON.stringify(results, null, 2));
  console.log('Saved: scripts/blog-articles.json');
}

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
