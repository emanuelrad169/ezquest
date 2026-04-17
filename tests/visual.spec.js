const { test, expect } = require('@playwright/test');

const pages = [
  { name: 'homepage',   path: '/' },
  { name: 'collection', path: '/collections/hubs-adapters' },
  { name: 'pdp',        path: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3' },
  { name: 'cart',       path: '/cart' },
  { name: 'faq',        path: '/pages/faq' },
  { name: 'support',    path: '/pages/support' },
  { name: 'contact',    path: '/pages/contact' },
  { name: 'compare',    path: '/pages/compare' },
];

const BASE = 'https://ezquest-4.myshopify.com';

for (const page of pages) {
  test(`${page.name} — desktop layout`, async ({ page: p }) => {
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.goto(BASE + page.path);
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveScreenshot(`${page.name}-desktop.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });

  test(`${page.name} — mobile layout`, async ({ page: p }) => {
    await p.setViewportSize({ width: 375, height: 812 });
    await p.goto(BASE + page.path);
    await p.waitForLoadState('networkidle');
    await expect(p).toHaveScreenshot(`${page.name}-mobile.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
}

test('cart drawer opens', async ({ page }) => {
  await page.goto(BASE + '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3');
  await page.click('[name="add"]');
  await page.waitForSelector('.cart-drawer.is-open, #cart-drawer[aria-hidden="false"]');
  await expect(page.locator('.cart-drawer, #cart-drawer')).toBeVisible();
});

test('faq accordion expands', async ({ page }) => {
  await page.goto(BASE + '/pages/faq');
  const trigger = page.locator('.faq-trigger').first();
  await trigger.click();
  const body = page.locator('.faq-body').first();
  await expect(body).toBeVisible();
});
