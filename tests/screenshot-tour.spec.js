const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'https://ezquest-4.myshopify.com';
const OUT  = '.screenshots';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const PAGES = [
  { name: '01-homepage',       path: '/',                        scroll: true },
  { name: '02-collections',    path: '/collections',             scroll: false },
  { name: '03-hubs',           path: '/collections/hubs-adapters', scroll: false },
  { name: '04-chargers',       path: '/collections/chargers-power', scroll: false },
  { name: '05-pdp',            path: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3', scroll: true },
  { name: '06-cart',           path: '/cart',                    scroll: false },
  { name: '07-search',         path: '/search?q=usb+c+hub',      scroll: false },
  { name: '08-support',        path: '/pages/support',           scroll: true },
  { name: '09-faq',            path: '/pages/faq',               scroll: true },
  { name: '10-downloads',      path: '/pages/downloads',         scroll: true },
  { name: '11-compatibility',  path: '/pages/compatibility',     scroll: false },
  { name: '12-troubleshoot',   path: '/pages/troubleshooting',   scroll: false },
  { name: '13-warranty',       path: '/pages/warranty',          scroll: true },
  { name: '14-contact',        path: '/pages/contact',           scroll: true },
  { name: '15-help-choose',    path: '/pages/help-me-choose',    scroll: true },
  { name: '16-compare',        path: '/pages/compare',           scroll: false },
  { name: '17-about',          path: '/pages/about',             scroll: true },
  { name: '18-our-story',      path: '/pages/our-story',         scroll: true },
  { name: '19-blog',           path: '/blogs/resources',         scroll: true },
  { name: '20-shipping',       path: '/pages/shipping-returns',  scroll: true },
  { name: '21-404',            path: '/404',                     scroll: false },
  { name: '22-wishlist',       path: '/pages/wishlist',          scroll: false },
];

// DESKTOP SCREENSHOTS (1440px)
for (const page of PAGES) {
  test('desktop: ' + page.name, async ({ page: pw }) => {
    await pw.setViewportSize({ width: 1440, height: 900 });
    await pw.goto(BASE + page.path, { waitUntil: 'networkidle', timeout: 30000 });
    await pw.waitForTimeout(1000);

    if (page.scroll) {
      // Scroll through the page to trigger lazy loads
      await pw.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await pw.waitForTimeout(600);
      await pw.evaluate(() => window.scrollTo(0, 0));
      await pw.waitForTimeout(400);
    }

    await pw.screenshot({
      path: path.join(OUT, page.name + '-desktop.png'),
      fullPage: true
    });
  });
}

// MOBILE SCREENSHOTS (375px — iPhone SE)
for (const page of PAGES) {
  test('mobile: ' + page.name, async ({ page: pw }) => {
    await pw.setViewportSize({ width: 375, height: 812 });
    await pw.goto(BASE + page.path, { waitUntil: 'networkidle', timeout: 30000 });
    await pw.waitForTimeout(1000);
    await pw.screenshot({
      path: path.join(OUT, page.name + '-mobile.png'),
      fullPage: true
    });
  });
}

// INTERACTIVE STATE SCREENSHOTS
test('mega-menu-setup open', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 1440, height: 900 });
  await pw.goto(BASE + '/', { waitUntil: 'networkidle' });
  // Click or hover the setup trigger
  const setupTrigger = pw.locator('[data-mega-target="ez-mega-setup"]').first();
  await setupTrigger.hover();
  await pw.waitForTimeout(400);
  await pw.screenshot({
    path: path.join(OUT, 'mega-menu-setup.png')
  });
});

test('mega-menu-collections open', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 1440, height: 900 });
  await pw.goto(BASE + '/', { waitUntil: 'networkidle' });
  const collTrigger = pw.locator('[data-mega-target="ez-mega-collections"]').first();
  await collTrigger.hover();
  await pw.waitForTimeout(400);
  await pw.screenshot({
    path: path.join(OUT, 'mega-menu-collections.png')
  });
});

test('cart-drawer with item', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 1440, height: 900 });
  await pw.goto(BASE + '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3',
    { waitUntil: 'networkidle' });
  await pw.waitForTimeout(1000);
  // Click ATC
  const atc = pw.locator('[name="add"], .pdp-atc__btn, [data-atc]').first();
  await atc.click();
  await pw.waitForTimeout(1500);
  await pw.screenshot({
    path: path.join(OUT, 'cart-drawer-open.png')
  });
});

test('pdp-specs-tab', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 1440, height: 900 });
  await pw.goto(BASE + '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3',
    { waitUntil: 'networkidle' });
  await pw.waitForTimeout(1000);
  // Click specs tab
  const specsTab = pw.locator('[data-tab="specs"], .pdp-tab:has-text("Specs")').first();
  if (await specsTab.count() > 0) {
    await specsTab.click();
    await pw.waitForTimeout(500);
  }
  await pw.screenshot({
    path: path.join(OUT, 'pdp-specs-tab.png')
  });
});

test('faq-accordion-open', async ({ page: pw }) => {
  await pw.setViewportSize({ width: 1440, height: 900 });
  await pw.goto(BASE + '/pages/faq', { waitUntil: 'networkidle' });
  await pw.waitForTimeout(1000);
  const firstFAQ = pw.locator('.faq-trigger').first();
  if (await firstFAQ.count() > 0) {
    await firstFAQ.click();
    await pw.waitForTimeout(400);
  }
  await pw.screenshot({
    path: path.join(OUT, 'faq-accordion-open.png')
  });
});
