# Phase 5 — QA, Performance, SEO & Launch
Date: 2026-04-15
Contract trigger: Full QA · SEO · Production deployment · 30-day stabilization

---

## Deliverable Status

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Product JSON-LD (Product / Brand / Offer / AggregateRating) | PASS | `sections/main-product.liquid` line 751 — `@type: Product` with nested Offer + AggregateRating |
| 2 | BreadcrumbList JSON-LD | PASS | `snippets/breadcrumbs.liquid` line 39 — `@type: BreadcrumbList` with `ListItem` positions |
| 3 | Organization + WebSite JSON-LD | PASS | `layout/theme.liquid` lines 39–63 — `@type: Organization` + `@type: WebSite` with `SearchAction` |
| 4 | Open Graph tags (og:title, description, image, type, url, site_name) | PASS | `layout/theme.liquid` lines 15–27 — all 7 required OG properties present; image falls back to `settings.share_image` |
| 5 | Twitter Card tags | PASS | `layout/theme.liquid` lines 29–36 — `summary_large_image` card with title, description, image |
| 6 | Hero LCP — `loading="eager"` + `fetchpriority="high"` | PASS | `sections/hero-home.liquid` lines 83–84 — first slide image has both attributes; subsequent slides use `loading="lazy"` |
| 7 | Responsive images — `image_url` filter + `widths` srcset | PASS | `snippets/product-browse-media.liquid` — uses `image_url: width: resolved_width` with `widths: '480, 720, 900, 1200'` |
| 8 | CSS purge (Tailwind content paths) | PASS | `tailwind.config.cjs` content array covers `sections/**/*.liquid`, `snippets/**/*.liquid`, `templates/**/*.json`, `src/styles/**/*.css` |
| 9 | Theme check — 0 offenses | PASS | `shopify theme check` — 0 offenses · 132 files inspected (as of 2026-04-15 build) |
| 10 | Canonical URL tag | PASS | `layout/theme.liquid` line 12 — `<link rel="canonical" href="{{ canonical_url }}">` |
| 11 | Article / BlogPosting JSON-LD | PASS | `sections/main-article.liquid` — `@type: Article` added with headline, datePublished, dateModified, author, publisher, image, url, description. Google Discover eligible. |
| 12 | Sitemap accessible at `/sitemap.xml` | BLOCKED | Returns 404 — store password protection is active. Will resolve when password is removed in Admin → Online Store → Preferences. Not a theme defect. |
| 13 | Lighthouse Performance ≥ 85 (mobile) | PENDING | Requires browser access + password removed. Target: 85+. Optimizations in place: LCP eager load, purged CSS, deferred JS, image_url CDN. |
| 14 | Lighthouse Accessibility ≥ 95 | PENDING | Requires browser access + password removed. Target: 95+. Skip link, ARIA labels, focus styles, semantic landmarks all implemented. |
| 15 | Lighthouse SEO ≥ 95 | PENDING | Requires browser access + password removed. Target: 95+. Meta description, canonical, robots, structured data, mobile viewport all present. |
| 16 | Browser QA — full 11-section checklist | PENDING | See `docs/deployment-checklist.md`. Requires password removed. Covers: nav, PDP, cart, checkout, search, blog, collection, forms, animations, mobile, wishlist/integrations. |
| 17 | Google Search Console — property verified + sitemap submitted | PENDING | Manual setup. After password removed: add property for `ezquest-4.myshopify.com`, verify via HTML tag method, submit `https://ezquest-4.myshopify.com/sitemap.xml`. |

---

## Lighthouse scores (mobile)

| Metric | Target | Score | Status |
|--------|--------|-------|--------|
| Performance | ≥ 85 | — | Pending password removal + browser run |
| Accessibility | ≥ 95 | — | Pending password removal + browser run |
| Best Practices | ≥ 90 | — | Pending password removal + browser run |
| SEO | ≥ 95 | — | Pending password removal + browser run |

**Pre-conditions met for strong scores:**
- LCP image: `loading="eager"` + `fetchpriority="high"` on hero first slide
- CSS: Tailwind purge active → production bundle significantly smaller than dev
- JS: all scripts are `defer` — no render-blocking scripts
- Images: Shopify CDN `image_url` filter with width params + responsive `widths` srcset
- Font: system font stack used throughout (no web font loading penalty)
- Theme check: 0 offenses — no deprecated Liquid that could cause render delays

---

## Structured data coverage

| Template | Schema types | File |
|----------|-------------|------|
| All pages | Organization, WebSite, SearchAction | `layout/theme.liquid` |
| Product (`/products/*`) | Product, Brand, Offer, AggregateRating | `sections/main-product.liquid` |
| Any page with breadcrumbs | BreadcrumbList, ListItem | `snippets/breadcrumbs.liquid` |
| Article (`/blogs/*/...`) | Article, Person (author), Organization (publisher) | `sections/main-article.liquid` |

---

## Manual actions required before launch

These items cannot be completed programmatically and must be done in Shopify admin:

| Priority | Action | Where |
|----------|--------|-------|
| **CRITICAL** | Remove store password | Admin → Online Store → Preferences → Password protection |
| HIGH | Publish theme `150294855878` | Admin → Online Store → Themes → `...` → Publish (or `shopify theme publish`) |
| HIGH | Install Judge.me + set `reviews_app = judgeme` | Admin → Apps → Judge.me → Install; Customize → Theme settings → Integrations |
| HIGH | Install Tidio Live Chat | Admin → Apps → Tidio → Install; configure bottom-left widget position |
| HIGH | Install Shopify Bundles | Admin → Apps → Bundles → Install |
| MEDIUM | Create navigation menus | Admin → Online Store → Navigation → Add menu: `main-menu`, `footer`, `support-nav` |
| MEDIUM | Configure collection filters | Admin → Online Store → Navigation → Search & discovery → Filters |
| MEDIUM | Upload social sharing image (1200×630px) | Customize → Theme settings → Social sharing image |
| MEDIUM | Upload download files (20 PDFs/ZIPs) | Admin → Content → Files; then update 4 download template JSONs |
| MEDIUM | Add policies (Terms, Refund) | Admin → Settings → Policies |
| LOW | Set up Google Search Console | Add property → verify via HTML tag → submit sitemap |
| LOW | Create Shopify page `/pages/wishlist` with template suffix `wishlist` | Admin → Online Store → Pages → Add page |

---

## Phase summary

| Phase | Contract scope | Status |
|-------|---------------|--------|
| 1 — Foundation | Design system, layout, global components | COMPLETE |
| 2 — Pages | All content pages, templates, sections | COMPLETE |
| 3 — Polish | Animations, micro-interactions, performance | COMPLETE |
| 4 — Integrations | Reviews, Wishlist, Back-in-stock, Shoppable video, Live chat | COMPLETE |
| 5 — Launch | QA, Lighthouse, SEO, GSC, deployment | 10/17 COMPLETE — blocked by store password |

---

## Phase 5: 11/17 items complete

Items 1–11 verified programmatically (Article JSON-LD gap closed during this session). Items 12–17 require browser access and/or manual admin steps that are blocked by the store password being active (items 13–17) or are pending setup (item 12).

**Unblock path:** Admin → Online Store → Preferences → remove password → run Lighthouse → run browser QA checklist → publish theme.
