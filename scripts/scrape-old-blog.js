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

function getHandle(url) {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1);
}

function cleanHtml(contentEl) {
  if (!contentEl) return '';

  const toRemove = contentEl.querySelectorAll(
    [
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
    ].join(', ')
  );
  toRemove.forEach(el => el.remove());

  let body = contentEl.innerHTML.trim();
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

function extractFeaturedImage(document, contentEl) {
  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute('content') || '';
  const firstImg = contentEl?.querySelector('img')?.src || '';
  const postThumbnail =
    document.querySelector('.post-thumbnail img')?.src ||
    document.querySelector('[class*="thumbnail"] img')?.src ||
    '';

  return ogImage || firstImg || postThumbnail;
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

    const title =
      document.querySelector('h1.entry-title')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      document.querySelector('title')?.textContent?.split('|')[0]?.trim() ||
      'Untitled';

    // Get full body HTML
    const contentEl =
      document.querySelector('.entry-content') ||
      document.querySelector('.post-content') ||
      document.querySelector('article .content') ||
      document.querySelector('.single-post-content') ||
      document.querySelector('.single-content') ||
      document.querySelector('[class*="entry"] .content') ||
      null;

    const body_html = cleanHtml(contentEl);
    const image_url = extractFeaturedImage(document, contentEl);

    const result = {
      title,
      handle: getHandle(meta.url),
      body_html,
      image_url,
      tags: meta.tags,
      published_at: meta.published + 'T12:00:00-07:00',
      author: 'EZQuest',
      source_url: meta.url
    };

    console.log(`  ✓ "${title}" (${body_html.length} chars, image: ${image_url ? 'yes' : 'no'})`);
    return result;
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

  fs.writeFileSync('scripts/blog-articles.json', JSON.stringify(results, null, 2));

  console.log(`\nScraped: ${results.length}/${ARTICLES.length} articles`);
  if (failed.length) {
    console.log('Failed:');
    failed.forEach(u => console.log(' -', u));
  }
  console.log('Saved: scripts/blog-articles.json');
}

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
