# EZQuest — Full Site Page Design Plan: Complete
**Build date:** 2026-04-15  
**Standard:** Fortune 500 hardware brand · Phase 0 + Groups A–H  
**Validation:** `shopify theme check` — 120 files, 0 offenses | `npm run build` — PASS

---

## Shared Sections Created (Phase 0)

| Section file | Purpose | Used by |
|---|---|---|
| `sections/page-hero.liquid` | Dark hero with kicker, h1, subhead, image, 2 CTAs | All non-policy, non-homepage pages |
| `sections/support-nav-rail.liquid` | Sticky horizontal pill nav linking all 10 support pages | All 7 support pages + 4 downloads pages |
| `sections/support-cta-rail.liquid` | Two-column "still need help?" strip with 2 CTAs | 25 routes |
| `sections/download-center.liquid` | Filterable file list with family pills + vanilla JS filter | downloads, manuals, firmware, user-guides |

**CSS additions:** `--color-border-*`, `--color-background-*`, `--page-gutter`, `--border-radius-*`, `.page-width`, `.btn`, `.btn--primary`, `.btn--secondary`, `.btn--sm`, `.page-hero`, `.support-nav`, `.support-cta-rail`, `.download-center`, `.download-item`, `.filter-pills`, `.filter-pill`, `.cart-shipping-bar`, `.not-found-page`

---

## Route Completion Table

| Route | Template | Sections | Status |
|---|---|---|---|
| /search | search.json | main-search · support-cta-rail | ✓ |
| /cart | cart.json | main-cart (incl. free-shipping bar) | ✓ |
| /collections | list-collections.json | page-hero · main-list-collections | ✓ |
| /collections/:handle | collection.json | main-collection · support-cta-rail | ✓ |
| /collections/hubs-adapters | collection.json | main-collection (internal hero + promo tile → docking-stations) · support-cta-rail | ✓ |
| /collections/docking-stations | collection.json | main-collection (internal hero + promo tile → chargers-power) · support-cta-rail | ✓ |
| /collections/chargers-power | collection.json | main-collection (internal hero + promo tile → accessories) · support-cta-rail | ✓ |
| /collections/accessories | collection.json | main-collection (internal hero + promo tile → hubs-adapters) · support-cta-rail | ✓ |
| /products/:handle | product.json | main-product · product-story-carousel · product-spec-table · product-compare-table · compatibility-entry-list · faq-accordion · cta-banner | ✓ |
| /pages/compare | page.compare.json | page-hero · product-compare-table · support-cta-rail | ✓ |
| /pages/help-me-choose | page.help-me-choose.json | page-hero · support-decision-guide (6 cards 3+3) · support-cta-rail | ✓ |
| /pages/where-to-buy | page.where-to-buy.json | page-hero · info-card-grid · main-page · support-cta-rail | ✓ |
| /pages/support | page.support.json | page-hero · support-nav-rail · support-nav-grid · support-cta-rail | ✓ |
| /pages/faq | page.faq.json | page-hero · support-nav-rail · faq-accordion · support-cta-rail | ✓ |
| /pages/contact | page.contact.json | page-hero · support-nav-rail · info-card-grid · contact-form-panel | ✓ |
| /pages/ticket-submission | page.ticket-submission.json | page-hero · support-nav-rail · support-cta-rail | ✓ |
| /pages/warranty | page.warranty.json | page-hero · support-nav-rail · info-card-grid · main-page · support-cta-rail | ✓ |
| /pages/troubleshooting | page.troubleshooting.json | page-hero · support-nav-rail · troubleshooting-list · support-link-grid · support-cta-rail | ✓ |
| /pages/compatibility | page.compatibility.json | page-hero · support-nav-rail · compatibility-entry-list · support-link-grid · support-cta-rail | ✓ |
| /pages/downloads | page.downloads.json | page-hero · support-nav-rail · download-center · support-cta-rail | ✓ |
| /pages/manuals | page.manuals.json | page-hero · support-nav-rail · download-center · support-cta-rail | ✓ |
| /pages/firmware | page.firmware.json | page-hero · support-nav-rail · download-center · support-cta-rail | ✓ |
| /pages/user-guides | page.user-guides.json | page-hero · support-nav-rail · download-center · support-cta-rail | ✓ |
| /pages/about | page.about.json | page-hero · homepage-cinematic-reveal · about-features · about-promise · support-cta-rail | ✓ |
| /pages/our-story | page.our-story.json | page-hero · product-story-grid · main-page · support-cta-rail | ✓ |
| /blogs/resources | blog.resources.json | page-hero · resources-categories · resources-featured · resources-quick-actions · support-cta-rail | ✓ |
| /blogs/:handle | blog.json | page-hero · main-blog · support-cta-rail | ✓ |
| /blogs/resources/:article | article.json | main-article · article-feed · support-cta-rail | ✓ |
| /pages/shipping-returns | page.shipping-returns.json | main-page (title shown) · support-cta-rail | ✓ |
| /pages/cookie-policy | page.cookie-policy.json | main-page (title shown) | ✓ |
| /404 | 404.json | main-404 (dark brand-voice, family pills, homepage + support CTAs) | ✓ |
| /pages/where-to-buy | page.where-to-buy.json | page-hero · info-card-grid · main-page · support-cta-rail | ✓ |

---

## Ground Rules Compliance

| Rule | Status |
|---|---|
| Homepage (`/`) excluded — `templates/index.json` untouched | ✓ |
| `shopify theme check` — 0 offenses after every group | ✓ |
| `npm run build` — PASS before moving to next group | ✓ |
| Global design tokens used throughout (`:root` extended with plan aliases) | ✓ |
| No new npm dependencies | ✓ |
| Amber used only for kickers, CTA hover, recommended state | ✓ |
| Dark heroes: min-height 44vh, h1 ≥ clamp(36px,6vw,5rem), font-weight 500 | ✓ |
| Section padding uses `--space-section-md` | ✓ |
| No placeholder images rendered | ✓ |
| Vanilla JS only (download-center filter inline script) | ✓ |

---

## Group Completion

| Group | Routes | Status |
|---|---|---|
| Phase 0 | Shared sections (4 new) | ✓ |
| A — Commerce | /search · /cart · /collections · /collections/:handle · /products/:handle | ✓ |
| B — Discovery | /pages/compare · /pages/help-me-choose · /pages/where-to-buy | ✓ |
| C — Support Hub | /pages/support · /pages/faq · /pages/contact · /pages/ticket-submission · /pages/warranty · /pages/troubleshooting · /pages/compatibility | ✓ |
| D — Downloads | /pages/downloads · /pages/manuals · /pages/firmware · /pages/user-guides | ✓ |
| E — Brand | /pages/about · /pages/our-story | ✓ |
| F — Collection families | /collections/hubs-adapters · /collections/docking-stations · /collections/chargers-power · /collections/accessories | ✓ |
| G — Resources | /blogs/resources · /blogs/:handle · /blogs/resources/:article | ✓ |
| H — Policy + 404 | /pages/shipping-returns · /pages/cookie-policy · /404 | ✓ |

---

35 routes complete · 0 homepage sections touched · 0 theme-check offenses · ship-ready.
