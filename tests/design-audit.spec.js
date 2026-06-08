const { test } = require('@playwright/test');
const fs = require('fs');

const BASE = 'https://ezquest-4.myshopify.com';
const OUT = '.screenshots/audit';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: '01-blog-listing',       path: '/blogs/resources' },
  { name: '02-article-1',          path: '/blogs/resources/add-multiple-displays-to-macbook-neo-with-ezquest-usb-4-dual-display-8-in-1-hub-pro-series' },
  { name: '03-article-2',          path: '/blogs/resources/ezquest-announces-new-line-of-pro-series-usb-c-hubs' },
  { name: '04-article-3',          path: '/blogs/resources/unclutter-your-desk-with-help-from-ezquest' },
  { name: '05-collections-index',  path: '/collections' },
  { name: '06-hubs',               path: '/collections/hubs-adapters' },
  { name: '07-chargers',           path: '/collections/chargers-power' },
  { name: '08-accessories',        path: '/collections/accessories' },
  { name: '09-our-story',          path: '/pages/our-story' },
  { name: '10-about',              path: '/pages/about' },
  { name: '11-shipping-returns',   path: '/pages/shipping-returns' },
  { name: '12-help-me-choose',     path: '/pages/help-me-choose' },
  { name: '13-where-to-buy',       path: '/pages/where-to-buy' },
  { name: '14-compare',            path: '/pages/compare' },
  { name: '15-compatibility',      path: '/pages/compatibility' },
  { name: '16-support',            path: '/pages/support' },
  { name: '17-faq',                path: '/pages/faq' },
  { name: '18-downloads',          path: '/pages/downloads' },
  { name: '19-warranty',           path: '/pages/warranty' },
  { name: '20-contact',            path: '/pages/contact' },
  { name: '21-homepage',           path: '/' },
  { name: '22-pdp',                path: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3' },
  { name: '23-404',                path: '/pages/404-error' },
];

for (const pg of PAGES) {
  test('screenshot: ' + pg.name, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE + pg.path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: OUT + '/' + pg.name + '.png', fullPage: true });
  });
}
