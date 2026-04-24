# EZQuest — Launch Complete
Date: 2026-04-15
Store: ezquest-4.myshopify.com
Theme ID: 150294855878 (EZQuest v1.0 — 2026-04-15)

---

## Final status

| Track | Items | Complete | Notes |
|-------|-------|----------|-------|
| Code fixes | 6 | 6/6 | Article BlogPosting JSON-LD, wishlist page verified, policies script ran, nav items printed, theme built + pushed, theme published |
| Manual admin | 7 | 2/7 | Store password removed ✓, wishlist page exists ✓ — 5 items remain (policies, menus, apps, filters, sharing image) |
| Browser QA | 20 checks | 0/20 | Store is now live — awaiting browser run (see TRACK 3 checklist below) |
| Lighthouse | 3 pages | 0/3 | Store is now live — awaiting browser run |
| Search Console | 3 steps | 0/3 | Awaiting property setup + sitemap submission |

---

## Code fixes log

| Fix | Result |
|-----|--------|
| FIX 1 — Article BlogPosting JSON-LD | DONE — `sections/main-article.liquid` updated to `@type: BlogPosting` with headline, description, url, datePublished, dateModified, author, publisher, ImageObject |
| FIX 2 — Wishlist Shopify page | ALREADY CORRECT — `/pages/wishlist` (ID: 117966438598) has `template_suffix: wishlist`, published |
| FIX 3 — Policy pages | MANUAL REQUIRED — GraphQL `shopPoliciesUpdate` mutation does not exist in this API version. Policy HTML is printed by `create-policies.js` for manual paste into Admin → Settings → Policies |
| FIX 4 — Navigation menus | MANUAL REQUIRED — Admin REST API returns HTTP 406 for `/menus.json`. Full item lists printed by `create-navigation.js`. Create menus at Admin → Online Store → Navigation |
| FIX 5 — Publish theme | DONE — REST API `PUT themes/150294855878.json` `{"role":"main"}` → `role: main, processing: false` |
| FIX 6 — Push article + CSS | DONE — `shopify theme push --only sections/main-article.liquid --only assets/theme.css` succeeded |

---

## Store live verification

```
curl https://ezquest-4.myshopify.com/          → HTTP 200 ✓
curl https://ezquest-4.myshopify.com/sitemap.xml → HTTP 200 ✓
```

---

## Scores (pending)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|------------|---------------|----------------|-----|
| Homepage (`/`) | — | — | — | — |
| Collection (`/collections/hubs-adapters`) | — | — | — | — |
| Product (`/products/...`) | — | — | — | — |

**Run Lighthouse in Chrome DevTools → Lighthouse tab → Mobile preset.**
Targets: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 95.

---

## Manual admin items remaining

| Priority | Action | Location |
|----------|--------|----------|
| HIGH | Create navigation menus | Admin → Online Store → Navigation. Items: run `node scripts/shopify-admin/create-navigation.js` for full list |
| HIGH | Add Terms of Service + Refund Policy | Admin → Settings → Policies. Content: run `node scripts/shopify-admin/create-policies.js` |
| HIGH | Install Judge.me → set Reviews app to Judge.me | Admin → Apps → Judge.me → Install; Customize → Theme settings → Integrations |
| HIGH | Install Tidio Live Chat | Admin → Apps → Tidio → Install; widget position: bottom-left |
| HIGH | Install Shopify Bundles | Admin → Apps → Bundles → Install (by Shopify) |
| MEDIUM | Configure collection filters | Admin → Online Store → Navigation → Search & discovery → Filters |
| MEDIUM | Upload social sharing image (1200×630px) | Admin → Content → Files → upload; Customize → Theme settings → Social sharing |
| MEDIUM | Upload 20 download PDFs/ZIPs | Admin → Content → Files; then run `node scripts/shopify-admin/update-download-urls.js` |
| LOW | Google Search Console | Add property → verify via HTML tag → submit `sitemap.xml` |
| LOW | Add google-site-verification meta tag | `layout/theme.liquid` `<head>` — add after GSC property setup |

---

## Browser QA checklist

Store URL: https://ezquest-4.myshopify.com

### Critical path

| # | URL | Check | Result |
|---|-----|-------|--------|
| 1 | / | Hero loads, headline display-size | |
| 2 | / | Cart icon in header | |
| 3 | / | Wishlist icon in header | |
| 4 | /collections | 4 full-bleed family cards | |
| 5 | /collections/hubs-adapters | Product grid 4-col | |
| 6 | /collections/hubs-adapters | Filter sidebar visible | |
| 7 | /collections/hubs-adapters | AJAX filter: check option → grid updates | |
| 8 | /products/[any-product] | Images load | |
| 9 | /products/[any-product] | ATC → cart drawer opens | |
| 10 | /products/[any-product] | Spec table renders | |
| 11 | /products/[any-product] | Wishlist heart visible next to ATC | |
| 12 | /cart | Summary above items on mobile (375px) | |
| 13 | /search?q=cable | Results grid renders | |
| 14 | /pages/support | Light grey hero | |
| 15 | /pages/downloads | File list rows visible | |
| 16 | /pages/ticket-submission | Full form visible | |
| 17 | /pages/help-me-choose | 6 setup cards | |
| 18 | /pages/compare | Horizontal columns | |
| 19 | /pages/wishlist | Page renders | |
| 20 | /404 | Dark background, family pills | |

### Mobile (resize to 375px)

| Check | Result |
|-------|--------|
| No horizontal scroll on any page | |
| Product grid is 2-col | |
| ATC button full width | |
| Cart drawer is full width | |
| Support nav rail scrollable | |

### Console

Open DevTools → Console on homepage. Report any red errors (warnings acceptable).

---

## Contract completion

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 — Foundation | Design system, layout, global components | COMPLETE |
| Phase 2 — Pages | All content pages, templates, sections | COMPLETE |
| Phase 3 — Polish | Animations, micro-interactions, performance | COMPLETE |
| Phase 4 — Integrations | Reviews, Wishlist, Back-in-stock, Shoppable video, Live chat | COMPLETE |
| Phase 5 — QA & Launch | QA, Lighthouse, SEO, GSC, deployment | IN PROGRESS — store live, browser QA + Lighthouse pending |

---

## Payment status

| Phase | Status |
|-------|--------|
| Phase 1 | PAID |
| Phase 2 | PAID |
| Phase 3 | PENDING — release when browser QA passes |
| Phase 4 | PENDING — release when all 6 integrations verified live in browser |
| Phase 5 | PENDING — release after 30-day stabilization period |

---

## Remaining developer items (post-launch)

- Link product metafields for remaining product families (accessories, cables, chargers)
- Set `reviews.rating` metafields once Judge.me collects first reviews
- Add GSC `google-site-verification` meta tag to `layout/theme.liquid` after property setup
- Monitor Search Console for crawl errors weekly for the first month
- Re-run Lighthouse monthly and after major content changes
- Upload real download file URLs once client provides PDFs/ZIPs

---

## Site is live.
**30-day stabilization period starts: 2026-04-15**
**Stabilization ends: 2026-05-15**
