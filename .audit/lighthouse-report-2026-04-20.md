# Lighthouse Audit — 2026-04-20
URL: https://ezquest-4.myshopify.com/ (homepage)
Tool: Lighthouse 12.x, headless Chrome, mobile emulation

## FINAL STATUS — 2026-04-20 (post-session update)

| Page       | Perf  | A11y  | BP    | SEO   | Target |
|------------|-------|-------|-------|-------|--------|
| Homepage   | 87 ✅ | 90 ✅ | 79 ✅ | 92 ✅ | 75/90/79/90 |
| PDP        | 64 ❌ | 93 ✅ | 79 ✅ | 100 ✅| 65/90/79/90 |

PDP status: 1 point below target (64 vs 65). LCP at 10.7s is root cause.
PDP fix applied: `<link rel="preload">` for product featured media in `layout/theme.liquid`. Re-run pending.

## Session 1 — Homepage fixes (2026-04-20)

All Lighthouse targets MET after two-pass fix session.

Key wins:
- LCP: 6.8 s → 2.1 s (−4.7 s) via preload link + responsive srcset
- Performance: 64 → 87 (+23 points)
- Best Practices: 75 → 79 (+4) via favicon fix

One remaining item:
- CLS: 0.207 (target < 0.1) — root cause: Tidio chat widget CLS
- Fix: Tidio Admin → Settings → "Load on user interaction" (deferred loading)
- Does not affect contract deliverable (Performance ≥ 75 ✅)

## Scores — Post-fix (2026-04-20 second run)

| Category       | Before | After | Target | Status |
|----------------|--------|-------|--------|--------|
| Performance    | 64     | **87**| ≥ 75   | ✅ +23 |
| Accessibility  | 90     | **90**| ≥ 90   | ✅     |
| Best Practices | 75     | **79**| ≥ 79   | ✅ +4  |
| SEO            | 92     | **92**| ≥ 90   | ✅     |

## Core Web Vitals — Post-fix

| Metric | Before | After  | Delta  |
|--------|--------|--------|--------|
| FCP    | 1.6 s  | 1.5 s  | -0.1s  |
| LCP    | 6.8 s  | **2.1 s** | **-4.7s** |
| CLS    | 0.207  | 0.207  | —      |
| TBT    | 40 ms  | 70 ms  | +30ms  |
| SI     | 4.2 s  | 3.4 s  | -0.8s  |

## Pre-fix Scores (first run)

| Category       | Score | Target | Status |
|----------------|-------|--------|--------|
| Performance    | 64    | ≥ 75   | ❌ -11 |
| Accessibility  | 90    | ≥ 90   | ✅     |
| Best Practices | 75    | ≥ 79   | ❌ -4  |
| SEO            | 92    | ≥ 90   | ✅     |

## Pre-fix Core Web Vitals

| Metric | Value  | Rating |
|--------|--------|--------|
| FCP    | 1.6 s  | Needs improvement |
| LCP    | 6.8 s  | Poor              |
| CLS    | 0.207  | Poor              |
| TBT    | 40 ms  | Good              |
| SI     | 4.2 s  | Needs improvement |
| TTI    | 7.4 s  | Poor              |

## Performance — Root Causes

### LCP 6.8 s (hero image)
- LCP element: `article.home-hero-slide > picture.home-hero-media-picture > img.home-hero-media-image`
- `loading="eager"` and `fetchpriority="high"` are already set — the image IS prioritised
- Mobile source srcset: single 1800px URL served to 412px viewport → ~70–100 KB extra decode/transfer
- No `<link rel="preload">` for the hero image in `<head>` — browser discovers it after CSS/JS parsing
- **Fix**: Add `<link rel="preload as="image" fetchpriority="high">` for the first slide desktop/mobile image from `content_for_header`. Also add smaller mobile widths to the `<source srcset>` (375, 768).

### CLS 0.207 (layout shift)
- Lighthouse did not surface a specific culprit node in this run
- Most likely causes: hero section height before image loads (no explicit aspect-ratio/padding-bottom reserve), or sticky header mount shifting content
- **Fix**: Add `aspect-ratio` or `min-height` reservation on `.home-hero-slide` for the initial render frame; confirm sticky header height is reserved in CSS before JS mount.

### Unused JavaScript — 171 kb total
- `widget.e8ad20fa.js` 97 kb — Judge.me review widget (third-party, can't remove)
- `chunk-WidgetIframe.js` 74 kb — Judge.me iframe (third-party)
- `b5153dfa3…js` 24 kb — Shopify Pay (third-party)
- **No actionable fix** — all third-party

### Unused CSS — theme.css 41 kb
- Large theme stylesheet; PurgeCSS would require a build-step integration
- **Deferred** — out of scope for this sprint

## Best Practices — Root Causes

### Favicon 404 (fixed in this push)
- `GET /favicon.ico` → 404
- **Fix applied**: Added `<link rel="icon">` using `settings.favicon` with `data:,` fallback in `layout/theme.liquid`

### Third-party cookies
- `_shop_app_essential` from `shop.app` (Shopify Pay / Shop App)
- Cannot be removed — Shopify platform dependency

### Inspector Issues
- SameSite cookie warnings from Shop Pay iframe — platform dependency

## Fixes Applied This Session
- `layout/theme.liquid`: Added favicon link (fixes 404, +Best Practices)
- `assets/pdp.css`: Removed ATC button `min-height` (Task 2)
- `sections/main-product.liquid`: Removed dead `#pdp-faq` tab (Task 2)
- `sections/policy-page.liquid`: Dual page/policy object support (Task 4)
- `templates/policy.liquid`: Now renders policy-page section (Task 4)

## Recommended Next Steps (not implemented)
1. Hero LCP: Add `<link rel="preload">` for first slide image in `hero-home.liquid`
2. Hero LCP: Add `srcset` with 400w, 800w breakpoints to the mobile `<source>` tag
3. CLS: Reserve hero height with CSS `aspect-ratio` before image load
4. Re-run Lighthouse after favicon push to verify Best Practices gain
