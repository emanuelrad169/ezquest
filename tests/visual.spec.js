const { test, expect } = require('@playwright/test');

const PDP_PATH = '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3';

const screenshotPages = [
  { name: 'homepage', path: '/' },
  { name: 'collection', path: '/collections/hubs-adapters' },
  { name: 'pdp', path: PDP_PATH },
  { name: 'cart', path: '/cart' },
  { name: 'support', path: '/pages/support' },
  { name: 'faq', path: '/pages/faq' },
  { name: 'contact', path: '/pages/contact' },
  { name: '404', path: '/404' },
  { name: 'policy', path: '/policies/privacy-policy' },
  { name: 'wishlist', path: '/pages/wishlist' },
];

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

async function quietDynamicUi(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        scroll-behavior: auto !important;
      }
      #tidio-chat,
      #tidio-chat-code,
      #tidio-chat-root,
      iframe[src*="tidio"],
      iframe[src*="chat"] {
        display: none !important;
      }
    `,
  });
}

async function gotoStable(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await quietDynamicUi(page);
  await page.waitForLoadState('networkidle');
}

test.describe('GROUP 1 — Visual regression', () => {
  for (const pageInfo of screenshotPages) {
    for (const viewport of viewports) {
      test(`${pageInfo.name} visual — ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoStable(page, pageInfo.path);

        await expect(page).toHaveScreenshot(`${pageInfo.name}-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixelRatio: 0.02,
        });
      });
    }
  }
});

test.describe('GROUP 2 — Functional tests', () => {
  test('Cart drawer opens from PDP add to cart', async ({ page }) => {
    await gotoStable(page, PDP_PATH);

    await page.locator('[name="add"]').first().click();

    const drawer = page.locator('.cart-drawer.is-open, #cart-drawer[aria-hidden="false"], #cart-drawer:not([hidden])').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    const lineItems = page.locator('.cart-item, .cart-drawer-item, [class*="cart-item"], [class*="cart-drawer-item"]');
    await expect(lineItems.first()).toBeVisible({ timeout: 10000 });
    expect(await lineItems.count()).toBeGreaterThan(0);
  });

  test('FAQ accordion expands', async ({ page }) => {
    await gotoStable(page, '/pages/faq');

    const trigger = page.locator('.faq-item__trigger, [data-accordion-trigger], .faq-trigger').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const body = page.locator('.faq-item__body, [data-accordion-body], .faq-body').first();
    await expect(body).toBeVisible();
  });

  test('Language switcher opens and contains ES and AR', async ({ page }) => {
    await gotoStable(page, '/');

    const trigger = page.locator('.lang-picker__trigger').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dropdown = page.locator('.lang-picker__dropdown').first();
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('ES');
    await expect(dropdown).toContainText('AR');
  });

  test('Mega menu opens collections panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoStable(page, '/');

    await page.locator('[data-mega-target="ez-mega-collections"]').hover();

    const mega = page.locator('.ez-mega.is-open, #ez-mega-collections').first();
    await expect(mega).toBeVisible();
  });

  test('Wishlist button shows toast', async ({ page }) => {
    await gotoStable(page, PDP_PATH);

    const wishlistButton = page.locator('[data-wishlist-id]').first();
    await expect(wishlistButton).toBeVisible();
    await wishlistButton.click();

    await expect(page.locator('#ez-toast')).toBeVisible();
  });

  test('Mobile sticky ATC appears after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoStable(page, PDP_PATH);

    await page.evaluate(() => window.scrollBy(0, 800));

    const stickyAtc = page.locator('.pdp-sticky-atc, .product-sticky-atc').first();
    await expect
      .poll(async () => {
        return stickyAtc.evaluate((element) => {
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        });
      }, { timeout: 10000 })
      .toBe(true);
  });
});

test.describe('GROUP 3 — Performance budget', () => {
  test('Homepage loads under budget and has no console errors', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    const startedAt = Date.now();
    await gotoStable(page, '/');
    const loadMs = Date.now() - startedAt;

    expect(loadMs).toBeLessThan(8000);
    expect(consoleErrors).toEqual([]);
  });
});
