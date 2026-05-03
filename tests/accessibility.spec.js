const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');

const BASE = 'https://ezquest-4.myshopify.com';
const PAGES = [
  ['/', 'Homepage'],
  ['/collections/hubs-adapters', 'Collection'],
  ['/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3', 'PDP'],
  ['/pages/support', 'Support hub'],
  ['/pages/faq', 'FAQ'],
  ['/pages/contact', 'Contact'],
  ['/pages/help-me-choose', 'Help me choose'],
  ['/blogs/resources', 'Blog listing'],
];

for (const [path, name] of PAGES) {
  test('a11y: ' + name, async ({ page }) => {
    await page.goto(BASE + path, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('.tidio-1')
      .analyze();

    if (results.violations.length > 0) {
      console.log('\n❌', name, '-', results.violations.length, 'violations:');
      results.violations.forEach((violation) => {
        console.log('  [' + violation.impact + ']', violation.id, '-', violation.description);
        console.log('   Nodes:', violation.nodes.length);
        violation.nodes.slice(0, 2).forEach((node) => {
          console.log('   HTML:', node.html?.slice(0, 100));
        });
      });
    } else {
      console.log('✅', name, '- 0 violations');
    }

    fs.mkdirSync('.audit', { recursive: true });
    fs.writeFileSync(
      '.audit/a11y-' + name.toLowerCase().replace(/\s+/g, '-') + '.json',
      JSON.stringify(results.violations, null, 2)
    );
  });
}
