const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://ezquest-4.myshopify.com';

const PAGES = [
  ['/blogs/resources',              'Blog listing'],
  ['/blogs/resources/add-multiple-displays-to-macbook-neo-with-ezquest-usb-4-dual-display-8-in-1-hub-pro-series', 'Article 1'],
  ['/blogs/resources/ezquest-announces-new-line-of-pro-series-usb-c-hubs', 'Article 2'],
  ['/blogs/resources/unclutter-your-desk-with-help-from-ezquest', 'Article 3'],
  ['/collections',                  'Collections index'],
  ['/collections/hubs-adapters',    'Collection: Hubs'],
  ['/collections/chargers-power',   'Collection: Chargers'],
  ['/collections/accessories',      'Collection: Accessories'],
  ['/pages/our-story',              'Our Story'],
  ['/pages/about',                  'About'],
  ['/pages/shipping-returns',       'Shipping & Returns'],
  ['/pages/help-me-choose',         'Help me choose'],
  ['/pages/where-to-buy',           'Where to buy'],
  ['/pages/compare',                'Compare'],
  ['/pages/compatibility',          'Compatibility'],
  ['/pages/support',                'Support hub'],
  ['/pages/faq',                    'FAQ'],
  ['/pages/downloads',              'Downloads'],
  ['/pages/warranty',               'Warranty'],
  ['/pages/contact',                'Contact'],
  ['/',                             'Homepage'],
  ['/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3', 'PDP'],
  ['/pages/404-error',              '404'],
];

async function auditPage(page, path, name) {
  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const doc = document;
    const body = doc.body;

    const heroSelectors = [
      '.page-hero', '.page-hero-light', '.page-hero-dark', '.wtb-hero',
      '.support-hero', '.article-hero', '.article-header', '.article-intro',
      '.blog-hero', '.collection-hero', '.collections-hero', '.product-hero',
      '.not-found',
      '[class*="hero"]',
    ];
    const hasHero = heroSelectors.some(s => !!doc.querySelector(s));

    const ctaSelectors = [
      '.page-cta', '.page-cta-dark', '.support-cta-banner', '.wtb-cta',
    ];
    const hasCTA = ctaSelectors.some(s => !!doc.querySelector(s));

    const h1s = doc.querySelectorAll('h1');
    const h1Count = h1s.length;
    const h1Text = [...h1s].map(h => h.textContent.trim().slice(0, 60));

    const imgs = [...doc.querySelectorAll('img')];
    const brokenImgs = imgs.filter(img =>
      !img.complete || img.naturalWidth === 0
    ).map(img => (img.src || '').slice(-60));

    // Only flag inline hex colors inside our own Shopify sections (not apps/admin)
    const allEls = [...doc.querySelectorAll('[id^="shopify-section-"] [style]')];
    const hardcodedColors = allEls
      .filter(el => !el.closest('.rte, .richtext-content, .article-body__content'))
      .filter(el => (el.getAttribute('style') || '').match(/#[0-9a-fA-F]{3,6}/))
      .map(el => ({
        tag: el.tagName,
        style: (el.getAttribute('style') || '').slice(0, 80),
        cls: (el.className || '').slice(0, 40)
      }))
      .slice(0, 5);

    const bodyText = body.textContent;
    const hasPlaceholder = [
      'Lorem ipsum', 'TODO', 'PLACEHOLDER', '[TITLE]',
      'Sample product', 'test product'
    ].some(p => bodyText.includes(p));

    // Check .page-width usage (container pattern)
    const hasPageWidth = !!doc.querySelector('.page-width, .container-shell, .page-cta__inner');

    // Check footer is present
    const hasFooter = !!doc.querySelector('footer, .site-footer');

    // Check nav is present
    const hasNav = !!doc.querySelector('nav, .site-header, .header');

    // Article-specific checks
    const hasArticleHeader = !!doc.querySelector('.article-header, .article-intro');
    const hasRTE = !!doc.querySelector('.rte, .richtext-content, .article-body');
    const hasRelated = !!doc.querySelector('.related-articles, .article-related, .article-feed-section, .resources-articles-grid');

    return {
      hasHero, hasCTA, hasPageWidth,
      h1Count, h1Text,
      brokenImgs: brokenImgs.slice(0, 5),
      hardcodedColors,
      hasPlaceholder, hasFooter, hasNav,
      hasArticleHeader, hasRTE, hasRelated,
    };
  });

  return { path, name, ...result };
}

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  const issues = [];
  const results = [];
  const seen = new Set();

  for (const [path, name] of PAGES) {
    if (seen.has(path)) continue;
    seen.add(path);
    process.stdout.write('Auditing: ' + name + ' ...');
    try {
      const result = await auditPage(page, path, name);
      results.push(result);

      // Pages where a standalone CTA block is not expected
      const ctaExempt = ['/pages/contact', '/', '/pages/404-error', '/collections'];
      // Cart drawer thumbnails that lazy-load and always appear as broken — not real issues
      const cartImagePattern = /\/(X\d{5}|H\d{5})[^/]*\?.*width=200/;

      const pageIssues = [];
      if (!result.hasHero) pageIssues.push('NO HERO SECTION');
      if (!result.hasCTA && !ctaExempt.includes(path)) pageIssues.push('NO CTA BLOCK');
      if (result.h1Count === 0) pageIssues.push('NO H1 TAG');
      if (result.h1Count > 1 && path !== '/collections') pageIssues.push('MULTIPLE H1s (' + result.h1Count + '): ' + result.h1Text.slice(0,2).join(' | '));
      const realBrokenImgs = result.brokenImgs.filter(src => !cartImagePattern.test(src));
      if (realBrokenImgs.length > 0)
        pageIssues.push('BROKEN IMAGES: ' + realBrokenImgs.join(', '));
      if (result.hardcodedColors.length > 0)
        pageIssues.push('HARDCODED COLORS (' + result.hardcodedColors.length + ')');
      if (result.hasPlaceholder) pageIssues.push('PLACEHOLDER TEXT');

      if (path.includes('/blogs/') && path !== '/blogs/resources') {
        if (!result.hasArticleHeader) pageIssues.push('ARTICLE: no .article-header/.article-intro');
        if (!result.hasRTE) pageIssues.push('ARTICLE: no .rte/.richtext-content');
        if (!result.hasRelated) pageIssues.push('ARTICLE: no related articles section');
      }

      if (pageIssues.length > 0) {
        console.log(' ❌');
        pageIssues.forEach(i => console.log('    - ' + i));
        issues.push({ page: name, path, issues: pageIssues });
      } else {
        console.log(' ✅');
      }
    } catch (e) {
      console.log(' ❌ ERROR: ' + e.message.slice(0, 100));
      issues.push({ page: name, path, issues: ['PAGE ERROR: ' + e.message.slice(0, 100)] });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();

  if (!fs.existsSync('.audit')) fs.mkdirSync('.audit');
  const report = {
    date: new Date().toISOString().slice(0, 10),
    total: results.length,
    clean: results.length - issues.length,
    issues,
    details: results,
  };
  fs.writeFileSync('.audit/design-audit.json', JSON.stringify(report, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DESIGN AUDIT COMPLETE');
  console.log('Clean: ' + report.clean + '/' + report.total);
  console.log('Issues: ' + issues.length + ' pages');
  if (issues.length > 0) {
    console.log('\nSUMMARY:');
    issues.forEach(({ page, path, issues: iss }) => {
      console.log('\n  ' + page + ' (' + path + ')');
      iss.forEach(i => console.log('    - ' + i));
    });
  }
}

run().catch(e => console.error('FAILED:', e.message));
