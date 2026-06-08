/**
 * a11y-audit.js — Accessibility audit using axe-core via Playwright
 * Run: node scripts/a11y-audit.js
 * Requires: npm install -D playwright @axe-core/playwright
 * Output: .audit/a11y-YYYY-MM-DD.md
 *
 * Tests: WCAG 2.1 AA violations across major page types
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://ezquest-4.myshopify.com';

const PAGES = [
  ['/', 'Homepage'],
  ['/collections/hubs-adapters', 'Collection (Hubs)'],
  ['/pages/support', 'Support'],
  ['/pages/faq', 'FAQ'],
  ['/pages/compare', 'Compare'],
];

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa'];

async function auditPage(page, url, name) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const { AxeBuilder } = require('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  return {
    name,
    url,
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

(async () => {
  let playwright, chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('Playwright not installed. Run: npm install -D playwright @axe-core/playwright');
    console.error('Then: npx playwright install chromium');
    process.exit(1);
  }

  const now = new Date().toISOString().slice(0, 10);
  const lines = [`# Accessibility Audit — ${now}\n`];
  lines.push(`Standard: WCAG 2.1 AA | Engine: axe-core\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; a11y-audit/1.0)',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  let totalViolations = 0;

  for (const [slug, name] of PAGES) {
    try {
      const result = await auditPage(page, BASE + slug, name);
      const vCount = result.violations.length;
      totalViolations += vCount;
      const icon = vCount === 0 ? '✅' : '⚠️';

      lines.push(`\n## ${icon} ${name}`);
      lines.push(`- URL: ${BASE + slug}`);
      lines.push(`- Violations: **${vCount}** | Passes: ${result.passes} | Incomplete: ${result.incomplete}`);

      if (vCount > 0) {
        result.violations.forEach(v => {
          lines.push(`\n### [${v.impact?.toUpperCase()}] ${v.id}`);
          lines.push(`${v.description}`);
          lines.push(`_Help:_ ${v.helpUrl}`);
          lines.push(`_Nodes affected:_ ${v.nodes.length}`);
          v.nodes.slice(0, 2).forEach(n => {
            lines.push(`- \`${(n.html || '').slice(0, 120)}\``);
          });
        });
      }
    } catch (err) {
      lines.push(`\n## ❌ ${name}\nError: ${err.message}`);
    }
  }

  await browser.close();

  lines.push(`\n---\n## Summary`);
  lines.push(`Total violations across ${PAGES.length} pages: **${totalViolations}**`);

  if (totalViolations === 0) {
    lines.push('\n✅ No WCAG 2.1 AA violations found.');
  } else {
    lines.push('\n### Priority fix order: critical → serious → moderate → minor');
  }

  const out = lines.join('\n');
  fs.mkdirSync(path.join(__dirname, '../.audit'), { recursive: true });
  const outPath = path.join(__dirname, `../.audit/a11y-${now}.md`);
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nSaved: .audit/a11y-${now}.md`);
})();
