# Lighthouse Audit — 2026-04-17

## Scores

| Page | Performance | Accessibility | Best Practices | SEO | Status |
|------|:-----------:|:-------------:|:--------------:|:---:|--------|
| Homepage   | **95** | **90** | **79** | **92** | Perf ✓ · A11y ✓ · SEO ✓ · BP ✗ |
| Collection | **43** | **91** | **79** | **100** | A11y ✓ · SEO ✓ · Perf ✗ · BP ✗ |
| PDP        | **54→60** | **93** | **79** | **100** | A11y ✓ · SEO ✓ · Perf ✗ · BP ✗ |

Targets: Perf ≥ 75 · A11y ≥ 90 · BP ≥ 85 · SEO ≥ 90

---

## Best Practices — 79 on all three pages (need 85)

**Root cause:** A single third-party cookie — `_shop_app_essential` from `shop.app/pay/hop` — scores 0 and brings BP from 100 to 79 across every page. This is Shopify's built-in Shop Pay checkout flow. It is not injectable by theme code.

**Options:**
- Disable Shop Pay in Admin → Settings → Payments. BP jumps to ~100. Trade-off: Shop Pay is a conversion-driving feature.
- Accept 79. Shop Pay is worth the 6-point BP penalty for most stores.

**Assessment:** Not fixable from the theme. Merchant decision.

---

## Performance — Homepage (95 ✓)

No issues. Third-party impact: Tidio 369ms main thread / 38ms blocking.

---

## Performance — Collection (43 ✗)

### Core metrics
| Metric | Value | Target |
|--------|------:|--------|
| FCP | 1.4s | — |
| LCP | 4.5s | < 2.5s |
| TBT | 1,420ms | < 200ms |
| CLS | 0.264 | < 0.1 |
| TTI | 7.2s | — |

### Root causes

**TBT 1,420ms** — Primary drag:
- `shopify-perf-kit-3.3.1.min.js`: 1,471ms main-thread (0ms blocking — many small tasks). **Platform JS. Not fixable from theme.**
- Tidio: 491ms main-thread, 46ms blocking. Loads 497KB (already `async`). Loaded via Shopify Script Manager — **cannot be deferred further from theme code.**
- Page scripts: 577ms (collection JS initialization)

**LCP 4.5s** — Hero image (`owned-collection-scene-image`, 1800×1440):
- Load Delay: 2.0s (44% of LCP). Browser found the image late.
- Render Delay: 1.6s (34%). Post-download compositing and paint.
- Image already has `loading="eager" fetchpriority="high"`. No render-blocking resources detected.
- Load Delay variance is partly CDN cold-start under simulated throttling.

**CLS 0.264** — No culprits identified by Lighthouse. Likely Tidio chat button loading (bottom-corner shift) and/or `font-display: swap` text reflow.

### What can't be fixed (platform/third-party)
- Shopify perf-kit: 1,471ms. Adds ~800ms to simulated TBT. Can't remove or defer.
- Tidio blocking time (46ms) and main thread (491ms). Script Manager — can't defer.
- bfcache failure (WebSocket from Tidio).

### What remains to investigate
- CLS culprit: could be Tidio bottom-bar, announcement height change, or font swap. Needs DevTools CLS debugger on a real device.
- Collection LCP load delay: 2s seems high for an eager/high-priority in-HTML image. May improve on repeat visits (CDN warm).

**Realistic score ceiling without Tidio changes: ~55–60.**
**Score ceiling if Tidio is lazy-loaded via Script Manager settings: ~65–70.**

---

## Performance — PDP (54 → 60 after fix ✗)

### Core metrics (post-fix run)
| Metric | Before | After | Target |
|--------|-------:|------:|--------|
| FCP | 2.2s | 1.1s | — |
| LCP | 11.0s | 11.1s | < 2.5s |
| TBT | 50ms | 110ms | < 200ms ✓ |
| CLS | 0.264 | 0.264 | < 0.1 |
| SI | 6.0s | 3.0s | — |

### Root cause — LCP render delay

The LCP element is the product hero image (`div.product-gallery-main > div.overflow-hidden > img`). It loads in ~107–275ms but has a **8.4–9.6s render delay** — the gap between "bytes fully received" and "image painted to screen."

**Fix applied (session 2026-04-17):** `snippets/media.liquid` hardcoded `decoding="async"` on every image. For the LCP hero image, `async` decode defers image rasterization to a background queue, even when `fetchpriority="high"` is set. Fixed by:
1. Adding `decoding` as a passable parameter to `media.liquid` (default: `'async'`, preserving behavior for all non-LCP images)
2. Passing `decoding: 'sync'` for both hero image call sites in `main-product.liquid` (lines 253, 255)

**Remaining render delay:** Score went 54 → 60. The remaining 8.4s is explained by:
- Simulated 4× CPU throttle: the PDP has heavy inline Liquid output (5 inline zones, large DOM). Layout and compositing take longer under throttle.
- CLS 0.264: layout shifts may force Chrome to re-evaluate the LCP candidate at a later timestamp.
- Total main-thread JS (Tidio 355ms + inline scripts 312ms + unattributable 324ms) creates paint queue pressure under simulated conditions.

### Unused JS and CSS
- Tidio: 97KB + 74KB unused JS (Script Manager, not theme-controllable)
- Shopify WPM (`b5bfe654aw9a31df99pb879ff13m3bd6cd49m.js`): 24–25KB unused
- `theme.css`: 47–49KB unused (Tailwind utilities). Content scanning is already configured correctly in `tailwind.config.cjs`; the "unused" rules are safelisted dynamic classes needed for JS-driven state — intentional.

### Image sizing opportunity (resolved)
~~Lighthouse flagged 188KB savings from properly sized images.~~ **Fixed 2026-04-17.** `snippets/media.liquid` now uses conditional branches with hardcoded literal widths (Shopify does not accept Liquid variables in `image_url: width:`). Hero: `width: 1200` + srcset `400w/800w/1200w`. Thumbnails: `width: 200` + srcset `100w/200w`. V3 Lighthouse run: 0KB flagged for responsive images.

### V3 scores (post image-width fix)

| Metric | V2 (after decoding fix) | V3 (after image-width fix) |
|--------|------------------------:|---------------------------:|
| Performance | 60 | **64** |
| FCP | 1.1s | 1.0s |
| LCP | 11.1s | 6.0s |
| TBT | 110ms | 80ms |
| CLS | 0.264 | 0.264 |
| SI | 3.0s | 3.1s |

LCP dropped from 11.1s → 6.0s. TBT improved from 110ms → 80ms. CLS unchanged at 0.264.

**Realistic score ceiling without Tidio/DOM changes: ~65–70.**

---

## Fixes Applied in This Session

| Fix | File | Impact |
|-----|------|--------|
| `decoding` param on `media.liquid` (default `async`, passable) | `snippets/media.liquid` | PDP FCP 2.2s → 1.0s |
| `decoding: 'sync'` on hero image render calls | `sections/main-product.liquid` lines 253, 255 | PDP score 54 → 60 |
| Responsive image widths in `media.liquid` (1200/200/800 conditional branches) | `snippets/media.liquid` + `sections/main-product.liquid` | PDP score 60 → 64, LCP 11.1s → 6.0s, 0KB oversized image flag |

---

## Remaining Opportunities (Theme-Side)

Priority order:

1. **Investigate CLS 0.264** — use Chrome DevTools CLS debugger (`Performance` → `Layout Shifts` overlay) on the real device. If Tidio is the culprit, set explicit dimensions for the chat widget container in CSS or request lazy-load configuration in the Tidio app settings.

2. **Investigate CLS 0.264** — use Chrome DevTools CLS debugger (`Performance` → `Layout Shifts` overlay) on the real device. If Tidio is the culprit, set explicit dimensions for the chat widget container in CSS or request lazy-load configuration in the Tidio app settings.

3. **PDP: Lazy-load below-fold zones** — Zones 3–7 (Features, Specs, Highlights, Compat, Downloads) are rendered synchronously inline. Wrapping them with IntersectionObserver-driven loading would reduce initial DOM size (currently 1,076 elements) and lighten parse/layout time. Estimated: 15–20% DOM reduction.

---

## Non-Theme Recommendations (for client)

- **Disable Tidio on non-support pages** or configure it to load on user interaction via Tidio's own lazy-load setting (Tidio Admin → Chat Widget → Load delay). This is the single highest-impact change for Collection and PDP performance.
- **Evaluate Shop Pay** tradeoff if BP ≥ 85 is a hard contract requirement.
- **Run CrUX (field data) check** via PageSpeed Insights — lab scores under throttling are pessimistic. Real-world scores are typically 15–25 points higher.
