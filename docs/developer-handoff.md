# Developer Handoff — EZQuest Theme
Date: 2026-04-15

## Theme status
Code-complete. 0 theme-check offenses. Build passing.
Ready for: `shopify theme push`

---

## What you need to do

### Immediate (required for Phase 3 payment release)

**1. Push theme to unpublished preview:**
```
shopify theme push \
  --store=[store].myshopify.com \
  --unpublished \
  --theme-name="EZQuest v1.0 — April 2026"
```
Send us the preview URL so we can complete browser QA.

**2. Populate download pages with real file URLs:**
Files are configured in:
- `templates/page.downloads.json`
- `templates/page.manuals.json`
- `templates/page.firmware.json`
- `templates/page.user-guides.json`

All `file_url` values are currently `"#"` (placeholder).
Upload the EZQuest PDFs and ZIPs at:
Shopify admin → Content → Files
Then copy each CDN URL and replace the `"#"` values.

**3. Confirm ticket-submission form is live:**
`sections/ticket-form.liquid` is built and wired.
Test by submitting at `/pages/ticket-submission`.
Submissions route through Shopify's native contact endpoint
and arrive in the store's notification inbox.

---

### Required for Phase 4 (before Phase 4 payment)

**4. Seed metaobjects into the live store:**
```
npm run shopify:seed:comparisons
npm run shopify:seed:compatibility
npm run shopify:seed:decision-guide
```
Required for these pages to render real content:
- `/pages/compare`
- `/pages/compatibility`
- `/pages/help-me-choose`

Before seeding, create these metaobject definitions in:
Shopify admin → Settings → Custom data → Metaobjects
- `ezquest_comparison_group`
- `ezquest_decision_guide_entry`
- `ezquest_compatibility_entry`
- `ezquest_use_case`
- `ezquest_spec_row`

**5. Install and configure Shopify apps:**

| App | Purpose | Recommendation | Cost |
|-----|---------|----------------|------|
| Reviews | Star ratings on PDPs | Judge.me | Free tier |
| Back In Stock | Notify when restocked | Back In Stock | Free tier |
| Bundles / FBT | Frequently bought together | Shopify Bundles | Free |
| Live chat | Customer support widget | Tidio or Gorgias | Tidio free |
| Shoppable video | Video with ATC overlay | Build custom section | — |

For each app: provide app name, monthly cost, and setup confirmation.

**6. Configure collection filters:**
Shopify admin → Online Store → Navigation →
Search & discovery → Filters
Add filter groups:
- Product type (list)
- Price range (price_range)
- Connectivity: USB-C, Thunderbolt, USB-A (list)
- Ports: 4-port, 7-port, 8-port, 13-port (list)
- Compatibility: Mac, Windows, iPad (list)

**7. Set up product metafields:**
Shopify admin → Settings → Custom data → Products
Required definitions:
- `ezquest.spec_rows` (JSON) — PDP spec accordion
- `ezquest.compare_group` (single line text) — compare tool grouping
- `reviews.rating` (decimal) — native rating display
- `reviews.rating_count` (integer) — native review count

---

## Phase 4 delivery schedule requested

Per payment hold notice dated 2026-04-15:
Provide written delivery schedule for all 5 missing Phase 4 items
(reviews, wishlist, bundles/FBT, preorder/back-in-stock, live chat/shoppable video)
with approach and target dates.
Required before Phase 3 payment is released.

---

## Codebase reference

| Area | File(s) |
|------|---------|
| AJAX cart drawer | `assets/cart-drawer.js`, `snippets/cart-drawer.liquid` |
| AJAX collection filter | Inline JS in `sections/main-collection.liquid` (bottom) |
| Scroll reveal | `assets/reveal.js` — exports `window.EZReveal` |
| Design tokens | `src/styles/theme.css` (`:root` variables at top) |
| Support page templates | `templates/page.support.json` through `page.warranty.json` |
| Download templates | `templates/page.downloads.json` through `page.user-guides.json` |
| Ticket form section | `sections/ticket-form.liquid` |
| Build command | `npm run build` (Tailwind + PostCSS → `assets/theme.css`) |
| Lint command | `shopify theme check` (0 offenses maintained throughout) |

## Architecture notes
- Shopify OS 2.0: JSON templates, section blocks, no base-theme inheritance
- No third-party CSS frameworks injected at runtime — Tailwind compiled to static CSS
- All JS is vanilla (no jQuery, no React, no bundler required)
- Cart uses AJAX Sections API for drawer refresh
- Collection filter uses AJAX `?sections=main` for grid refresh without page reload
- Structured data (Product/Offer/AggregateRating JSON-LD) in `sections/main-product.liquid`
- OG + Twitter meta tags in `layout/theme.liquid`
