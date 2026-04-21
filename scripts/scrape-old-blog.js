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

function cleanHtml(dom, bodyEl) {
  if (!bodyEl) return '';

  // Remove noise elements
  const noiseSelectors = [
    'script', 'style', 'noscript',
    '.sharedaddy', '.share-buttons', '.social-share',
    '.post-tags', '.entry-footer', '.entry-meta',
    '.author-bio', '.author-box', '.related-posts',
    '.wpcf7', '[class*="wp-block-social"]',
    '[id*="jp-post-flair"]', '.sd-block',
    'iframe', 'form', '.nav-links', '.comments-area',
    '.wp-caption-text + br'
  ];

  noiseSelectors.forEach(sel => {
    try {
      bodyEl.querySelectorAll(sel).forEach(el => el.remove());
    } catch(e) {}
  });

  // Remove WordPress shortcodes like [caption ...]
  let html = bodyEl.innerHTML;
  html = html.replace(/\[caption[^\]]*\]/g, '').replace(/\[\/caption\]/g, '');
  html = html.replace(/\[[^\]]+\]/g, '');

  // Clean up WordPress-specific classes from tags
  html = html.replace(/\s+class="[^"]*wp-[^"]*"/g, '');
  html = html.replace(/\s+class="[^"]*aligncenter[^"]*"/g, '');
  html = html.replace(/\s+class="[^"]*alignleft[^"]*"/g, '');
  html = html.replace(/\s+class="[^"]*size-[^"]*"/g, '');
  html = html.replace(/\s+class="[^"]*entry-[^"]*"/g, '');

  // Clean up excessive whitespace / empty paragraphs
  html = html.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/g, '');
  html = html.replace(/\n{3,}/g, '\n\n');

  return html.trim();
}

function extractFeaturedImage(dom, bodyEl) {
  // Try og:image first
  const ogImage = dom.window.document.querySelector('meta[property="og:image"]');
  if (ogImage) return ogImage.getAttribute('content');

  // Try first image in content
  if (bodyEl) {
    const img = bodyEl.querySelector('img');
    if (img) {
      return img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    }
  }

  return null;
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
    const doc = dom.window.document;

    // Extract title
    const title =
      doc.querySelector('h1.entry-title')?.textContent?.trim() ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.split('|')[0]?.trim() ||
      'Untitled';

    // Extract body
    const bodyEl =
      doc.querySelector('.entry-content') ||
      doc.querySelector('article .post-content') ||
      doc.querySelector('article') ||
      doc.querySelector('main');

    const body_html = cleanHtml(dom, bodyEl);
    const image_url = extractFeaturedImage(dom, bodyEl);

    const result = {
      title,
      body_html,
      image_url,
      tags: meta.tags,
      published_at: meta.published + 'T12:00:00-07:00',
      author: 'EZQuest',
      source_url: meta.url
    };

    console.log(`  ✓ "${title}" (${body_html.length} chars, image: ${image_url ? 'yes' : 'no'})`);
    return result;

  } catch(e) {
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
    // polite delay
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

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
