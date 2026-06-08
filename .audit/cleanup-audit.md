# Cleanup Audit
Date: 2026-04-23

## A1 — CSS in Liquid files (20 files)
sections/announcement-bar.liquid
sections/blog-article-grid.liquid
sections/compatibility-table.liquid
sections/contact-form-panel.liquid
sections/email-signup.liquid
sections/firmware-center.liquid
sections/frequently-bought-together.liquid
sections/main-blog.liquid
sections/our-story.liquid
sections/product-compare-table.liquid
sections/recently-viewed.liquid
sections/shipping-returns.liquid
sections/shoppable-video.liquid
sections/support-hub.liquid
sections/troubleshooting-guide.liquid
sections/user-guides-center.liquid
sections/warranty-page.liquid
sections/where-to-buy.liquid
snippets/cookie-consent.liquid
snippets/free-shipping-bar.liquid

## A2 — CSS file sizes
604  assets/pdp.css
499  assets/pages.css
366  assets/support-cluster.css
283  assets/policy-page.css
 28  assets/faq-accordion.css
  0  assets/theme.css  ← empty (compiled output goes to theme.css but is gitignored)

Duplicate class count: 51 (mostly numeric fragments from clamp() — not true duplicates)
Real duplicates worth fixing:
  .faq-* classes → both theme.css and faq-accordion.css
  .filter-pill/pills, .info-card → theme.css and support-cluster.css
  .section-intro → theme.css and pages.css
  .section-kicker, .section-shell, .section-heading → theme.css and pdp.css
  .support-nav* → theme.css and support-cluster.css
  .product-* → theme.css and pdp.css (expected — pdp.css is a section override)
  .is-active → 4 files (generic utility — OK)

## A3 — Script inventory
ONE-TIME SEEDERS (ran once, safe to archive):
  seed-product-tags.js, seed-product-specs.js, seed-compare-metafields.js
  seed-spec-rows-graphql.js, setup-metaobject-definitions.js, setup-product-metafields.js
  seed-decision-guide.js (may need update but ran once)

ONE-TIME IMPORTERS:
  scrape-old-blog.js, import-blog-articles.js (doesn't exist in scripts/)
  pull-images-from-old-site.js

ONE-TIME IMAGE TOOLS:
  upload-promo-banners.js, upload-theme-images.js, wire-promo-banners.js
  wire-all-images.js, wire-images.js, wire-collection-images.js

ONE-TIME VALIDATORS (old passes):
  validate-pass2.js, validate-pass3.js, validate-pass4.js

ONE-TIME POLICY/ADMIN:
  set-cookie-policy.js, set-policies.js

KEEP ACTIVE:
  verify-store-data.js  ← health check utility
  live-site-qa.js       ← QA runner
  audit-images.js       ← useful for future audits
  audit-product-images.js ← useful for future audits

## A4 — Large assets
theme.css: 376 KB (compiled Tailwind — expected)
theme.js:  53 KB (acceptable)
public/images/: 73 MB, 169 files ← DELETE local copies (all in Shopify CDN)

## A5 — Template orphan check
All 19 page.*.json templates show as orphans against ezquest-4 (dev store).
NOTE: Pages exist on production store. DO NOT DELETE any templates.

## A6 — Recommended actions
Phase B: Archive ~20 scripts, clean public/images, tidy prompts/
Phase C: faq-accordion.css can be merged into pages.css or theme.css
