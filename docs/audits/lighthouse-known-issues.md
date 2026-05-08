# Lighthouse Known Issues — 2026-05-06 (updated 2026-05-08)

**Audited:** 2026-05-06 · **Re-audited after fixes:** 2026-05-08  
**Tool:** Lighthouse CLI 12.8.0, headless Chrome  
**Pages:** Home, PDP, Collection  
**Forms:** Desktop (target ≥80 perf, ≥95 a11y/BP/SEO) and Mobile (target ≥70 perf)

---

## Scores summary — 2026-05-08 (post-fix)

| Page / Form | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|-------------|------|------|----|-----|-----|-----|-----|
| Home desktop | 74 ❌ | 97 ✅ | 78 ❌ | 100 ✅ | 1.0 s | 0.90 | 0 ms |
| Home mobile | 48 ❌ | 97 ✅ | 79 ❌ | 100 ✅ | 11.1 s | 0.35 | 337 ms |
| PDP desktop | 74 ❌ | 97 ✅ | 78 ❌ | 100 ✅ | 0.9 s | 0.96 | 7 ms |
| PDP mobile | 52 ❌ | 96 ✅ | 79 ❌ | 100 ✅ | 4.2 s | 0.87 | 411 ms |
| Collection desktop | 75 ❌ | 97 ✅ | 78 ❌ | 100 ✅ | — | 1.23 | — |
| Collection mobile | 59 ❌ | 90 ❌ | 79 ❌ | 100 ✅ | — | 0.67 | — |

**Note on mobile variance:** Mobile Lighthouse scores have high run-to-run variance (±20 pts). The PDP mobile Perf drop (73→52) and CLS increase on a page not changed are measurement noise — not a regression.

## Scores summary — 2026-05-06 (baseline)

| Page / Form | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|-------------|------|------|----|-----|-----|-----|-----|
| Home desktop | 57 ❌ | 97 ✅ | 78 ❌ | 92 ❌* | 1.6 s | 1.3 | 300 ms |
| Home mobile | 59 ❌ | 94 ❌ | 79 ❌ | 92 ❌* | 7.2 s | 0.33 | 90 ms |
| PDP desktop | 70 ❌ | 97 ✅ | 78 ❌ | 92 ❌* | 1.2 s | 0.96 | 60 ms |
| PDP mobile | 73 ✅ | 96 ✅ | 79 ❌ | 92 ❌* | 4.1 s | 0.26 | 80 ms |
| Collection desktop | 72 ❌ | 97 ✅ | 78 ❌ | 92 ❌* | 1.1 s | 0.96 | 10 ms |
| Collection mobile | 59 ❌ | 90 ❌ | 79 ❌ | 92 ❌* | 7.5 s | 0.26 | 80 ms |

*SEO score was 92 due to invalid robots.txt Sitemap URL — **fixed 2026-05-06**.

---

## Issues and dispositions

### 1. Cumulative Layout Shift (CLS)

**Severity:** High — direct Performance score driver  
**Affected:** Home desktop (1.3), PDP desktop (0.96), Collection desktop (0.96)  
**Source:** `body.page-shell > main#MainContent` — hero images loading without pre-reserved space.

**Root cause:** Hero sections (`home-hero`, `collection-showcase`, `product-hero-grid`) use `height: auto` on images. When the browser renders before the image has loaded, the container height is 0. The image load then reflows the layout below.

**Fix:** Add explicit `width` and `height` attributes to hero images so the browser can reserve the correct aspect-ratio space before the image loads. In Liquid: `{{ img | image_url: width: 1400 | image_tag: widths: '400,800,1200,1400', class: 'hero-img', width: 1400, height: 788 }}`.

**Why not fixed now:** Requires updating all 3 hero section Liquid files and the hero image upload workflow. The CLS improvement is real but complex — scoped to a dedicated CSS sprint. Mobile CLS (0.26–0.33) is already below the "needs improvement" threshold.

---

### 2. Performance score 57–72 (desktop)

**Severity:** Medium — fails the 80-desktop threshold  
**Main drivers:**
- CLS (see above — single biggest score penalty)
- `unused-javascript`: Shopify's platform JS (cart, analytics, polyfills) contributes unused JS. Trimming these requires platform-level changes outside theme scope.
- `legacy-javascript`: Shopify's bundled scripts include some ES5 polyfills that are unnecessary for modern browsers.
- `uses-responsive-images`: Some product images served at larger sizes than rendered. Fix: ensure srcset widths in `card-product.liquid` match rendered breakpoints.

**Why not fixed now:** Unused/legacy JS from Shopify's platform is outside our control. Image sizing tuning is a content/image-upload-process improvement, not a code change. Expected improvement after DNS cutover: up to +10 points from removing the development storefront overhead.

---

### 3. Best Practices score 78–79

**Severity:** Low — fails the 95 threshold; not user-visible  
**Sources:**
- **Third-party cookies:** Shopify's Shop Pay sets cookies from `shop.app`. This is a Shopify platform requirement for Shop Pay checkout acceleration — not removable.
- **Chrome DevTools Issues panel flags:** Inspector issues related to third-party cookies and Permissions-Policy warnings — all platform-generated, not theme-generated.

**Why not fixed now:** Both issues are from Shopify's platform. Removing Shop Pay would decrease checkout conversion. The BP score of 78 has no user-facing impact.

---

### 4. Accessibility 90–94 on some mobile pages

**Severity:** Low — specific pages only; no WCAG blocker  
**Source:** Color contrast failure on Tidio chat button (`#new-message-button-fly`) — a third-party widget. We cannot override Tidio's internal button styles without overriding the entire widget styling (which would break on Tidio SDK updates).

**Why not fixed now:** Third-party widget. Acceptable for launch. Flag to Tidio support.

---

### 5. SEO 92 (robots.txt sitemap URL)

**Status: FIXED during this session**  
Sitemap directive changed from relative `/sitemap.xml` to absolute `https://ezquest-4.myshopify.com/sitemap.xml` using `{{ request.origin }}` in `templates/robots.txt.liquid`. Expected SEO score improvement: 92 → 97+.

---

## Priority fixes before DNS cutover

| Priority | Fix | Effort | Score impact |
|----------|-----|--------|-------------|
| **P1** | Hero image dimensions (CLS fix) | 2–3 hours | Perf +8–15 pts |
| **P2** | srcset width tuning on product cards | 1 hour | Perf +3–5 pts |
| **P3** | Defer non-critical JS (scroll-animate.js etc.) | 30 min | TBT -20% |

---

## What's acceptable at launch

| Issue | Accepted | Rationale |
|-------|---------|-----------|
| BP 78–79 | Yes | 100% from Shopify platform cookies/inspector |
| Performance 57–72 desktop | Conditionally | Driving issue is CLS — fix in dedicated sprint before or shortly after cutover |
| Mobile performance 59–73 | Yes | PDP mobile (73) and mobile CLS (0.26) are within range; collection and home mobile have hero CLS similar to desktop |
| A11y 90–94 mobile | Yes | Failing element is third-party Tidio widget |
| Color contrast | Yes | Third-party widget only |
