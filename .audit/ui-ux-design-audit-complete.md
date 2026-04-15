# UI/UX Design Audit — Complete
Date: 2026-04-15
Standard: Apple Store × UGREEN craft reference

---

## Validation
| Check | Result |
|-------|--------|
| `shopify theme check` | **PASS** — 127 files · 0 offenses |
| `npm run build` | **PASS** — Done in ~1010ms |
| Font weight 600+ in CSS | **0 occurrences** |
| Font weight 600+ in templates | **0 occurrences** |

---

## Design System Changes Applied

### Typography
- All `font-weight: 600/700/800/900` replaced with `500` across `src/styles/theme.css`
- All `@apply font-semibold` and `@apply font-bold` replaced with `@apply font-medium`
- All inline `font-semibold` Tailwind classes in `.liquid` templates replaced with `font-medium`
- Fluid type scale added: `--text-display` through `--text-body-xl` with `clamp()` values
- Letter-spacing tokens: `--tracking-display: -0.04em`, `--tracking-heading: -0.03em`, `--tracking-title: -0.02em`
- Line-height tokens: `--leading-display: 1.02`, `--leading-headline: 1.06`, `--leading-title: 1.2`

### Color
- Apple-exact tokens: `--color-apple-black: #1d1d1f`, `--color-apple-grey-text: #6e6e73`
- Background tokens: `--color-bg-secondary: #f5f5f7`, `--color-bg-dark: #0a0a0a`
- Section utilities: `.section--white`, `.section--grey (#f5f5f7)`, `.section--dark (#0a0a0a)`
- Dark section text overrides: `.section--dark .section-heading/type-heading/display-heading → #f5f5f7`

### Motion System
- `assets/reveal.js` created: IntersectionObserver for `.reveal-on-scroll` + `.reveal-stagger > *`
- Auto-observes `.section-intro` elements site-wide (no template edits needed for intros)
- CSS: `reveal-on-scroll` (opacity 0 → 1, translateY 20px → 0), `reveal-stagger` nth-child delays 0–400ms
- Prefers-reduced-motion: instant reveal via JS guard
- Graceful degradation: instant reveal if IntersectionObserver unavailable
- `layout/theme.liquid` loads `reveal.js` with `defer`

### Spacing
- `--page-gutter: clamp(1.25rem, 4vw, 5rem)`
- `--space-11: clamp(80px, 10vw, 160px)` section padding variable

---

## Page Audit — All 35 Pages

### Group 1 — Homepage (9 sections)

| Section | Background | Reveal | Notes |
|---------|-----------|--------|-------|
| `hero-home` | dark `bg-slate-950` ✓ | hero copy panel (no scroll needed) | `font-semibold` kicker → `font-medium` |
| `home-collections-strip` | `.section--grey` ✓ | header: `.reveal-on-scroll`, grid: `.reveal-stagger` | |
| `home-feature-bento` | white (default) ✓ | header: `.reveal-on-scroll`, grid: `.reveal-stagger` | |
| `home-feature-banner` | dark `bg-slate-900` ✓ | parallax JS already handles | |
| `featured-product-carousel` | `.section--grey` ✓ | carousel header (existing motion classes) | |
| `home-confidence-grid` | white (default) ✓ | header: `.reveal-on-scroll`, grid: `.reveal-stagger` | |
| `homepage-cinematic-reveal` | `.section--dark` ✓ | own IntersectionObserver (line-clip animation) | CSS text colors updated to `#f5f5f7` |
| `home-testimonials` | `.section--grey` ✓ | header: `.reveal-on-scroll` | |
| `home-press` | white (default) ✓ | infinite marquee (no scroll trigger needed) | |

### Group 2 — Commerce

| Page | Section | Changes |
|------|---------|---------|
| `/collections/:handle` | `main-collection` | `reveal-stagger` on product grid; filter sidebar from Phase 2 |
| `/products/:handle` | `main-product` | ATC → cart drawer from Phase 2 |
| `/cart` | `main-cart` | Clean layout, trust grid, shipping bar |
| `/search` | `main-search` | Font weights fixed; section intro auto-revealed |
| `/collections` | `list-collections` | Section intro auto-revealed |

### Group 3 — Support Cluster

| Page | Section | Changes |
|------|---------|---------|
| `/pages/support` | `support-nav-grid` | `surface-muted` → `.section--grey`; `reveal-stagger` on card grid |
| `/pages/compatibility` | `compatibility-entry-list` | `surface-muted` → `.section--grey` |
| `/pages/troubleshooting` | `troubleshooting-list` | `surface-muted` → `.section--grey` |
| `/pages/faq` | `faq-list` | Font weights fixed |
| `/pages/contact` | `contact-form-panel` | Font weights fixed |
| All support pages | `support-cta-rail` | Clean, uses `var(--color-background-secondary)` |

### Group 4 — Discovery

| Page | Section | Changes |
|------|---------|---------|
| `/pages/compare` | `product-compare-table` + `page-hero` | `page-hero` already dark; compare table font weights fixed |
| `/pages/help-me-choose` | `info-card-grid` | `reveal-stagger` on card grid |
| `/pages/where-to-buy` | `main-page` | Font weights fixed |
| `/pages/compatibility` | `compatibility-entry-list` | `section--grey` |

### Group 5 — Resources / Blog

| Page | Section | Changes |
|------|---------|---------|
| `/blogs/resources` | `main-blog` | `.section-intro` auto-revealed |
| `/blogs/resources/:article` | `main-article` | Prose column `max-w-4xl` → `max-w-2xl` (≈672px per spec) |
| All pages with article feeds | `resources-featured`, `article-feed` | `reveal-stagger` on 3-col article grids |

### Group 6 — Brand + Static

| Page | Section | Changes |
|------|---------|---------|
| `/pages/about` | `page-hero`, `homepage-cinematic-reveal`, `about-features`, `about-promise` | `section--dark` on cinematic reveal; `reveal-stagger` on features grid + stat strip |
| `/pages/our-story` | `product-story-grid` | `section-dark` → `section--dark` |
| All policy pages | `main-page` | Font weights fixed |
| `404` | `main-404` | Already dark (`#0f1114`), amber accent, correct font weights |

### Group 7 — Global Shell

| Element | Changes |
|---------|---------|
| Global CSS | `font-weight: 800` on `.page-hero-heading` → `500` |
| All mega-menu `@apply font-semibold` | → `@apply font-medium` |
| Mobile nav drawer | Already used `font-medium` |
| Footer column headings | `@apply font-semibold` → `@apply font-medium` |
| Page hero (`page-hero.liquid`) | Already dark background (`#0f1114`); heading/subheading light text |

---

## Button System
- Pill shape: `border-radius: 980px` maintained across button variants
- `font-weight: 500` enforced
- Touch targets: `min-height: 44px` on `.btn`, `.button-primary`, `.button-secondary`
- New variants: `.btn--lg` (52px height), `.btn--amber` (amber background)

## Mobile / Responsive
- iOS text zoom prevention: `input, textarea, select { font-size: max(16px, 1rem) }`
- Mobile-first layouts maintained across all sections
- Focus rings: `:focus-visible { outline: 2px solid #F59E0B; outline-offset: 3px }`

## Remaining Known Items
| Item | Type | Notes |
|------|------|-------|
| Cart drawer — live browser test | QA | ATC → drawer → qty → checkout (requires Shopify storefront) |
| Collection filters — admin config | Client | Admin → Search & discovery → Filters |
| AJAX paginated filtering | Future | Current filter submits full page reload |
| Product metafields for specs/highlights | Client | Metafields.ezquest.* need Shopify admin setup |
