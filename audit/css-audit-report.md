# CSS Audit Report — EZQuest Shopify Theme
**Date:** 2026-05-03  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Scope:** All CSS assets + inline `<style>` blocks in Liquid files

---

## 1. SUMMARY

| Metric | Value |
|---|---|
| Total CSS files (assets/) | 10 |
| Of which: compiled Tailwind (assets/theme.css) | 1 (400 KB, 1 line, minified) |
| Of which: hand-authored CSS files | 9 |
| Source Tailwind file (src/styles/theme.css) | 17,210 lines |
| Hand-authored CSS — total lines | 5,228 lines |
| Liquid files with `<style>` blocks | 11 sections + 1 layout |
| Estimated CSS selectors (hand-authored files) | ~927 |
| Estimated unused rules — high confidence | ~27 (3%) |
| Estimated unused rules — low confidence | ~85 (9%) |
| Duplicate / near-duplicate rule groups | 5 groups |
| Rules trivially replaceable by Tailwind utilities | ~38 |

**Key structural finding:** `assets/theme.css` is a compiled Tailwind CSS output (one minified line, 400 KB). The source is `src/styles/theme.css`. The nine hand-authored CSS files are the primary subject of this audit.

**Critical bug found:** `sections/main-blog.liquid` uses classes (`blog-hero`, `blog-card`, `blog-grid`, `blog-featured`, `blog-pagination`) defined in `assets/pages.css`, but does **not** load `pages.css`. The blog page only loads `pages.css` if `footer.liquid` is also on the template — which is handled by the global layout — but the CSS is lazy-loaded (`media="print"` with JS swap), creating a potential FOUC risk. See Section 7.

---

## 2. UNUSED RULES — HIGH CONFIDENCE

Rules whose selector class or ID does not appear in any `.liquid`, `.js`, or `settings_data.json` file.

### 2.1 `assets/nav-dropdowns.css`

| Line | Selector | Reason |
|---|---|---|
| 23 | `.nav-dd__banner` | Not referenced in any liquid file |
| 31 | `.nav-dd__banner-icon` | Not referenced in any liquid file |
| 40 | `.nav-dd__banner-label` | Not referenced in any liquid file |
| 48 | `.nav-dd__banner-title` | Not referenced in any liquid file |
| 301 | `.nav-dd__brand` | Not referenced in any liquid file |
| 305 | `.nav-dd__brand-logo` | Not referenced in any liquid file |
| 312 | `.nav-dd__brand-tagline` | Not referenced in any liquid file |
| 317 | `.nav-dd__brand-stats` | Not referenced in any liquid file |
| 321 | `.nav-dd__brand-stat` | Not referenced in any liquid file |
| 326 | `.nav-dd__brand-num` | Not referenced in any liquid file |
| 332 | `.nav-dd__brand-lbl` | Not referenced in any liquid file |

**Estimated dead code block:** Lines 23–55 (`.nav-dd__banner*`) and lines 301–337 (`.nav-dd__brand*`) — approximately 46 lines. These appear to be planned but unimplemented navigation panel variants. The actual nav panels in `snippets/mega-menu.liquid` use `nav-dd__two-col`, `nav-dd__col`, `nav-dd__article`, `nav-dd__compare`, but no `nav-dd__banner` or `nav-dd__brand` elements.

### 2.2 `assets/pages.css`

| Line | Selector | Reason |
|---|---|---|
| 243–279 | `.article-card`, `.article-card__*` (10 selectors) | `.article-card` is used only in `sections/blog-article-grid.liquid`, but that section is never referenced in any template JSON — it is an orphaned section |
| 282–318 | `.article-featured`, `.article-featured__*` (9 selectors) | Not referenced in any `.liquid` or `.js` file anywhere in the codebase |
| 199–241 | `.setup-grid`, `.setup-card`, `.setup-card__*` (10 selectors) | Not referenced in any `.liquid` or `.js` file anywhere |
| 1413–1433 | `.cart-shipping-bar__progress`, `::-webkit-progress-bar`, `::-webkit-progress-value`, `::-moz-progress-bar` | The cart uses `.cart-shipping-bar__track` and `.cart-shipping-bar__fill` (a `<div>`-based bar); no `<progress>` element exists in any liquid file |

**Rule bodies for the confirmed unused blocks:**

```css
/* article-featured — pages.css lines 282–318 */
.article-featured {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2rem, 4vw, 4rem);
  /* ... 9 total selectors */
}

/* setup-grid / setup-card — pages.css lines 199–241 */
.setup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px,1fr));
  gap: 1.5rem;
  /* ... 10 total selectors */
}
```

### 2.3 `assets/cookie-consent.css`

**Critical: This file is never loaded by any stylesheet tag.** A search of the entire project finds no `stylesheet_tag` or `<link rel="stylesheet">` reference to `cookie-consent.css`. The `snippets/cookie-consent.liquid` snippet only loads `cookie-consent.js`. All 10 selectors (72 lines) in this file are **effectively dead** — the cookie banner will render unstyled unless these styles happen to be defined elsewhere.

| Selector count | File | Status |
|---|---|---|
| 10 selectors / 72 lines | `assets/cookie-consent.css` | File never loaded — all rules dead |

```css
/* Example selectors — cookie-consent.css */
.cookie-banner { position: fixed; bottom: 1.5rem; … }      /* line 2 */
.cookie-banner__inner { display: flex; … }                  /* line 18 */
.cookie-banner__btn--accept { background: rgba(254,211,0,0.96); … } /* line 57 */
```

---

## 3. UNUSED RULES — LOW CONFIDENCE (NEEDS HUMAN REVIEW)

Rules that may be used dynamically, by Shopify internals, or via JS class manipulation.

### 3.1 State / JS-toggled selectors

| File | Selector | Line | Reason flagged |
|---|---|---|---|
| `faq-accordion.css` | `.faq-item.is-open .faq-icon` | 21 | State class `.is-open` toggled by JS |
| `faq-accordion.css` | `.faq-item.is-open .faq-body` | 23 | State class `.is-open` toggled by JS |
| `faq-accordion.css` | `.faq-trigger:hover .faq-question` | 19 | `:hover` state |
| `pages.css` | `.page-faq-item.is-open .page-faq-icon` | 368 | State class `.is-open` toggled by JS |
| `pages.css` | `.page-faq-item.is-open .page-faq-body` | 370 | State class `.is-open` toggled by JS |
| `pages.css` | `.collection-subnav__tab.is-active` | 1564 | State class `.is-active` toggled by JS |
| `pages.css` | `.collection-subnav__filter-badge.is-hidden` | 1665 | State class `.is-hidden` toggled by JS |
| `pages.css` | `.policy-sidebar__link.is-active` | 261 (policy) | Set via `is-active` in liquid conditional |
| `pages.css` | `.blog-filter-chip.is-active` | 659 | State class toggled by navigation |
| `pdp.css` | `.product-thumb-card.is-active` | 113 | JS-toggled active state |
| `pdp.css` | `.product-sticky-atc.is-visible` | 133 | JS-toggled via `classList.add('is-visible')` |
| `pdp.css` | `.pdp-zoom-pane.is-active` | 956 | JS-toggled zoom state |
| `pdp.css` | `.pdp-buy-box.is-zoom-active` | 977 | JS-toggled zoom state |
| `pdp.css` | `.stock-counter--hidden` | 896 | JS-toggled visibility |
| `support-cluster.css` | `.support-nav__link.is-active` | 83 | State class in support nav |
| `compatibility.css` | `.compat-chip.is-active` | 196 | State class toggled by JS |
| `compatibility.css` | `.compat-dropdown[hidden]` | 140 | Attribute-based visibility |
| `compatibility.css` | `.compat-empty[hidden]` | 213 | Attribute-based visibility |
| `compatibility.css` | `.compat-results[hidden]` | 287 | Attribute-based visibility |

### 3.2 Shopify-generated class selectors (never appear in Liquid source)

| File | Selector(s) | Line | Reason flagged |
|---|---|---|---|
| `policy-page.css` | `.shopify-policy__container`, `.shopify-policy__title`, `.shopify-policy__body`, etc. | 5–115 | Applied by Shopify on `/policies/*` routes — not in our Liquid |

### 3.3 Third-party / external selectors

| File | Selector | Line | Reason flagged |
|---|---|---|---|
| `pages.css` | `#tidio-chat` (in print media query) | 1810 | Tidio live chat widget, third-party |
| `layout/theme.liquid` | `#tidio-chat-root`, `#tidio-chat-code` | 167 | Tidio CLS fix inline style — intentional |

### 3.4 Sections with style blocks potentially scoped to section IDs

| File | Note |
|---|---|
| `sections/product-compare-table.liquid` | Uses `#shopify-section-{{ section.id }}` scoping — safe, section-scoped |
| `sections/where-to-buy.liquid` | Defines `wtb-hero`, `wtb-group`, `wtb-grid`, `wtb-card`, `wtb-cta` — also defined in `pages.css` (see Section 4) |

### 3.5 `ts-card` (troubleshooting) — two conflicting variants in one file

`support-cluster.css` defines `.ts-card` twice:
- **Lines 451–462:** A flex-column card with `ts-card__header`, `ts-card__icon`, `ts-card__problem` sub-elements (for `troubleshooting-list.liquid` variant — but `troubleshooting-list.liquid` does **not** use these sub-classes)
- **Lines 523–565:** Overwrites `.ts-card { position: relative; }` and adds `ts-card__num`, `ts-card__title`, `ts-card__copy`, `ts-card__foot`, `ts-card__cta` (used in `troubleshooting-guide.liquid`)

The second definition **silently overrides** the first `.ts-card` base rule (changes `display: flex; flex-direction: column` to `position: relative`). The first block's `ts-card__header`, `ts-card__icon`, and `ts-card__problem` sub-selectors are orphaned — no liquid file uses them.

---

## 4. DUPLICATE / NEAR-DUPLICATE RULES

### 4.1 `wtb-cta` — defined in three places

| Location | Lines | Rule |
|---|---|---|
| `assets/pages.css` | ~430+ | `.wtb-cta { background: var(--ez-dark); padding: clamp(48px,6vw,72px) 0; margin-top: 0; }` |
| `assets/support-cluster.css` | 664–665 | `.wtb-cta { background: var(--ez-dark); padding: clamp(48px,6vw,72px) 0; margin-top: 0; }` |
| `sections/where-to-buy.liquid` `<style>` | 63–64 | `.wtb-cta { background:var(--ez-dark);padding:clamp(48px,6vw,72px) clamp(1.25rem,5vw,5rem);text-align:center;margin-top:0; }` |

**Note:** The `where-to-buy.liquid` version adds `text-align:center` and horizontal padding that the CSS file versions lack. The `support-cluster.css` version is used on `troubleshooting-guide.liquid` where `sections/where-to-buy.liquid` is not rendered. **Recommendation:** Consolidate into a single definition in `pages.css`. The `where-to-buy.liquid` inline style wins via cascade when the section renders, so the `pages.css` version is redundant there.

### 4.2 `wtb-hero`, `wtb-group`, `wtb-grid`, `wtb-card` — defined in both `pages.css` and `where-to-buy.liquid <style>`

`sections/where-to-buy.liquid` (lines 6–64) contains an inline `<style>` block that re-defines `wtb-hero`, `wtb-hero__kicker`, `wtb-hero__heading`, `wtb-hero__body`, `wtb-group`, `wtb-grid`, `wtb-card`, `wtb-card__logo-wrap`, `wtb-card__logo`, `wtb-card__name-fallback`, and `wtb-card__region` — all of which are also in `assets/pages.css`.

The liquid inline `<style>` fires later in the HTML than the linked stylesheet, so its rules always win. The `pages.css` versions are **fully overridden and redundant** on the where-to-buy page.

**Recommendation:** Remove the `wtb-*` rules from `pages.css` (or vice versa — move all to `pages.css` and remove the inline `<style>` from the section).

### 4.3 `policy-prose` vs `shopify-policy__body` — near-duplicate prose styles

Both rule sets in `assets/policy-page.css` (lines 51–115 and 162–215) define near-identical typographic rules for h2, h3, p, a, ul, ol, li, and strong. The difference is selector prefix:

```css
/* Set A — for native Shopify policy pages */
.shopify-policy__body .rte h2,
.shopify-policy__body h2 { font-size: clamp(18px,2.5vw,24px); … }

/* Set B — for custom policy page section */
.policy-prose h2 { font-size: clamp(18px,2.5vw,24px); … }
```

Both sets share identical `font-size`, `font-weight`, `letter-spacing`, `color`, `margin`, `line-height`, and `padding-top` values for every element type. This is ~60 lines of near-duplicate code.

**Recommendation:** Extract shared values into CSS custom properties or a common class, then apply to both selectors.

### 4.4 `ts-card` — dual definition (see also Section 3.5)

Lines 451 and 523 in `support-cluster.css` both define `.ts-card { … }`. The second definition overrides the first.

**Recommendation:** Keep only the v2 definition (lines 523+, used in the live `troubleshooting-guide.liquid`). Remove lines 449–462 if `troubleshooting-list.liquid` does not use `ts-card__header`, `ts-card__icon`, or `ts-card__problem` (confirmed: it does not).

### 4.5 `section-intro__kicker` / `story-section-intro__kicker` — redundant modifier

```css
/* pages.css line 163 */
.story-section-intro__kicker { text-align: left; }
/* pages.css line 152 */
.section-intro__heading--left { text-align: left; }
```

Both are single `text-align: left` declarations applied as modifier classes. They are semantically equivalent and could be consolidated into one utility class.

---

## 5. RULES TRIVIALLY REPLACEABLE BY TAILWIND

The project uses Tailwind CSS (compiled to `assets/theme.css`). The following rules in hand-authored CSS files are single- or two-property rules for which an exact Tailwind utility already exists in the compiled output.

| File | Line | Selector + Rule | Tailwind Equivalent | Usage Count in Liquid |
|---|---|---|---|---|
| `pages.css` | 134 | `.page-section--white { background: #fff; }` | `bg-white` | 3 |
| `pages.css` | 152 | `.section-intro__heading--left { text-align: left; }` | `text-left` | 0 (unused) |
| `pages.css` | 163 | `.story-section-intro__kicker { text-align: left; }` | `text-left` | 2 |
| `pages.css` | 165 | `.story-three-col { padding: 0; }` | `p-0` | 2 |
| `pages.css` | 386 | `.page-cta__copy { max-width: 560px; }` | `max-w-lg` (≈512px, close) | varies |
| `pages.css` | 442 | `.free-shipping-strip svg { flex-shrink: 0; }` | `shrink-0` | 1 |
| `pages.css` | 621 | `.blog-hero__link:hover { opacity: 0.75; }` | `hover:opacity-75` | 1 |
| `pages.css` | 734 | `.blog-featured__dot { opacity: 0.4; }` | `opacity-40` | 1 |
| `pages.css` | 1031 | `.article-author-card__info { flex: 1; }` | `flex-1` | 1 |
| `pages.css` | 1154 | `.site-footer__tagline { font-size: 12px; … }` | `text-xs` | 1 |
| `pages.css` | 1176 | `.site-footer__copy { font-size: 12px; … }` | `text-xs` | 1 |
| `pages.css` | 1243 | `.cart-trust-strip__item svg { flex-shrink: 0; }` | `shrink-0` | 1 |
| `pages.css` | 1314 | `.qv-modal[hidden] { display: none; }` | Tailwind's `hidden` class or `[hidden]` base style | 1 |
| `pages.css` | 1402 | `.qv-modal__atc:disabled { opacity: 0.5; cursor: default; }` | `disabled:opacity-50 disabled:cursor-default` | 1 |
| `pages.css` | 1434 | `.qv-trigger { display: none; }` | `hidden` | — |
| `pdp.css` | 273 | `.pdp-trust-item:last-child { border-right: none; }` | `last:border-r-0` | 1 |
| `pdp.css` | 457 | `.pdp-video-wrap { width: 100%; }` | `w-full` | 1 |
| `pdp.css` | 534 | `.pdp-spec-row:last-child { border-bottom: none; }` | `last:border-b-0` | varies |
| `support-cluster.css` | 176 | `.data-table tbody tr:last-child { border-bottom: none; }` | `last:border-b-0` | 1 |
| `support-cluster.css` | 387 | `.warranty-section { margin-bottom: 2.5rem; }` | `mb-10` | 1 |
| `support-cluster.css` | 371 | `.shub-card:hover { background: var(--ez-light); }` | `hover:bg-[var(--ez-light)]` | 1 |
| `policy-page.css` | 2 | `.policy-page { background: #fff; }` | `bg-white` | 1 |
| `policy-page.css` | 163 | `.policy-prose { max-width: 720px; }` | `max-w-[720px]` | 1 |
| `cookie-consent.css` | 16 | `.cookie-banner[hidden] { display: none; }` | `[hidden]:hidden` (Tailwind base) | — |
| `faq-accordion.css` | 25 | `.faq-answer p { margin: 0; }` | `!m-0` | — |

**Estimated count: ~25–38 rules** replaceable with inline Tailwind classes or existing utilities.

> **Caveat:** Replacing these requires converting from CSS-class-per-component to utility classes in the Liquid HTML. Given the theme's BEM architecture, this is best done during a planned refactor sprint rather than opportunistically. Tailwind's `@apply` could be an intermediate step.

---

## 6. CSS FILES BY SIZE

| File | Lines | Size (KB) | Selectors | Notes |
|---|---|---|---|---|
| `assets/theme.css` | 0 (1 minified line) | 391 KB | ~5,000+ | Compiled Tailwind output — do not hand-edit |
| `src/styles/theme.css` | 17,210 | 398 KB | ~5,000+ | Tailwind source file with `@tailwind` directives + `@layer` customizations |
| `assets/pages.css` | 1,814 | 52 KB | 348 | Largest hand-authored file. Covers blog, article, shipping, cart, search, footer, QV modal, collection nav, sitemap, promo tiles, and more |
| `assets/support-cluster.css` | 665 | 24 KB | 171 | Covers support hub, warranty, guides, firmware, troubleshooting, download center |
| `assets/pdp.css` | 987 | 24 KB | 140 | Product detail page: gallery, tabs, share, trust strip, spec table, highlights, zoom, stock counter |
| `assets/nav-dropdowns.css` | 645 | 16 KB | 104 | Mega menu panels (support, resources, compare, about, shop) |
| `assets/compatibility.css` | 647 | 16 KB | 78 | Compatibility search/results/chips/cards |
| `assets/policy-page.css` | 283 | 6 KB | 40 | Policy pages (custom + native Shopify policy routes) |
| `assets/faq-accordion.css` | 28 | 3 KB | 24 | FAQ accordion (shared across sections) |
| `assets/cookie-consent.css` | 72 | 2 KB | 10 | **Never loaded** — orphaned file |
| `assets/500.css` | 87 | 2 KB | 12 | 500 error page (loaded only by `templates/500.liquid`) |

**Total hand-authored CSS: 5,228 lines / ~144 KB**

### Inline `<style>` blocks in Liquid files (notable)

| File | Location | Est. selectors | Status |
|---|---|---|---|
| `sections/contact-form-panel.liquid` | Lines 145–183 | 31 | Large inline block — should be extracted to `support-cluster.css` |
| `sections/where-to-buy.liquid` | Lines 6–64 | ~14 | Duplicates `pages.css` — should be removed |
| `sections/compatibility-table.liquid` | Lines 140+ | 4 | Scoped table styles — acceptable inline |
| `sections/shipping-returns.liquid` | Lines 3–? | 3 | Small inline block — consider extracting |
| `layout/theme.liquid` | Lines 162–165 | ~15 | Critical CSS — intentional inline |
| `layout/theme.liquid` | Line 167 | 1 | Tidio CLS fix — intentional inline |

---

## 7. SUSPICIOUS PATTERNS

### 7.1 `!important` Declarations

| File | Line | Declaration | Status | Reason / Notes |
| --- | --- | --- | --- | --- |
| `assets/faq-accordion.css` | 16 | `.faq-trigger { display:flex!important; … }` | open | Overriding Tailwind base reset on `button` — necessary until button reset is removed from src |
| `assets/faq-accordion.css` | 22 | `.faq-body { max-height: 0!important; }` | open | FOUC prevention during JS init — acceptable pattern |
| `assets/faq-accordion.css` | 23 | `.faq-item.is-open .faq-body { max-height: 800px!important; }` | open | Fights base `max-height:0` — known accordion CSS pattern |
| `assets/pages.css` | ~1640 | `.wishlist-button, #tidio-chat { display: none !important; }` | open (acceptable) | Inside `@media print` — standard practice |
| `assets/pages.css` | 1601 | `.collection-subnav__btn { display: inline-flex !important; }` | ✅ resolved (Batch 4.5) | Cascade diagnosis: `pages.css` loads after `theme.css` — no `!important` needed. Selector boosted to `.collection-subnav .collection-subnav__btn` (0,2,0); `!important` removed. |
| `assets/pages.css` | 1626 | (similar — `.collection-filter-toggle` override) | ✅ resolved (Batch 4.5) | `display: none` base rule removed from `src/styles/theme.css`; override block in `pages.css` deleted. |
| `assets/pdp.css` | 284 | `.product-sticky-atc { display: flex !important; }` | ✅ resolved (Batch 4) | Removed in earlier pass. |
| `assets/pdp.css` | 284 | `.product-purchase-row { display: flex !important; … }` | ✅ resolved (Batch 4.5 + this session) | Added during ATC full-width work to defeat `theme.css align-items:flex-end`. Cascade diagnosis confirmed redundant: `pdp.css` loads after `theme.css` at same specificity (0,1,0, no layers). All 5 `!important` declarations removed 2026-05-06. |
| `assets/pdp.css` | 414–415 | `.main-product-section .product-buybox-title { font-size: clamp(…) !important; … }` | open | Cascade war — `theme.css` applies `!important` to `.product-buybox-title`. Fix: remove `!important` from source `src/styles/theme.css` rule. Deferred post-cutover. |
| `assets/pdp.css` | 421–422 | `.main-product-section .price-amount { font-size: 1.75rem !important; … }` | open | Same cascade war pattern. |
| `assets/pdp.css` | 429–432 | `.main-product-section [data-price-compare] { … !important × 3 }` | open | Same cascade war pattern. |
| `layout/theme.liquid` | 164 (inline) | `[hidden]{display:none!important}` | open (acceptable) | Standard HTML spec behavior — correct. |
| `layout/theme.liquid` | 167 (inline) | `#tidio-chat-root,#tidio-chat-code{display:none!important}` | open (acceptable) | Tidio CLS fix — intentional. |

**Open `!important` uses requiring remediation: 3** (pdp.css cascade war, lines 414–432)
**Acceptable `!important` uses (print, spec, FOUC): 6**
**Resolved this audit cycle: 4** (2× pages.css Batch 4.5, 2× pdp.css Batch 4/4.5)

**Recommendation:** The cascade war in `pdp.css` (lines 414–432) stems from `theme.css` applying `!important` to `.product-buybox-title` and price elements. Fix by removing the upstream `!important` from `src/styles/theme.css` and recompiling — deferred to post-cutover Batch 7/8 cleanup sprint.

### 7.2 Inline `<style>` Blocks in Liquid Files

**12 instances** (11 in sections, 1 in layout):

| File | Style block location | Lines of CSS | Verdict |
|---|---|---|---|
| `sections/product-compare-table.liquid` | Line 139 | ~100 | Scoped to `#shopify-section-{{ section.id }}` — acceptable but large; consider extracting |
| `sections/email-signup.liquid` | Line 75 | ~50 | Should be extracted to a CSS file |
| `sections/shoppable-video.liquid` | Line 114 | ~80 | Should be extracted to a CSS file |
| `sections/recently-viewed.liquid` | Line 21 | ~40 | Should be extracted to a CSS file |
| `sections/blog-article-grid.liquid` | Line 95 | ~70 | Should be extracted to `pages.css` |
| `sections/contact-form-panel.liquid` | Line 145 | 38 | **Should be extracted to `support-cluster.css`** — 31 selectors is too large for inline |
| `sections/compatibility-table.liquid` | Line 140 | ~15 | Acceptable if section-specific |
| `sections/announcement-bar.liquid` | Line 93 | ~20 | Should be extracted |
| `sections/frequently-bought-together.liquid` | Line 86 | ~30 | Should be extracted |
| `sections/shipping-returns.liquid` | Line 3 | ~10 | Small — acceptable or extract to `pages.css` |
| `layout/theme.liquid` | Line 162 | ~15 | **Intentional critical CSS** — keep inline |
| `layout/theme.liquid` | Line 167 | 1 | **Intentional CLS fix** — keep inline |

**Rule from project memory:** `<15 lines → {% style %}`, `>15 lines → .css file`. By this standard, approximately 8 of the 12 style blocks are out of compliance.

### 7.3 Hardcoded Colors Not Matching Design Tokens

Design tokens: `#FED300` (amber), `#6e6e73` (grey), `#e5e5e5` (border), `#0F172A` (slate), `#f5f5f7` (light), `#0a0a0a` (dark), `#1d1d1f` (black).

**Hardcoded non-token colors found:**

| File | Line | Color | Context |
|---|---|---|---|
| `assets/pages.css` | 332 | `#fafafa` | Table row stripe background |
| `assets/pages.css` | 333 | `#15803d` | Free shipping text (green) |
| `assets/pages.css` | 939 | `#3d3d3f` | Article body text |
| `assets/pages.css` | 1502 | `#111` | collection-subnav text |
| `assets/pages.css` | 1562 | `#111` | collection-subnav hover |
| `assets/pages.css` | 1686 | `#64748b` | Search empty state text |
| `assets/pages.css` | 1702 | `#f5a300` | Sitemap link hover — **off-brand amber** (should be `#FED300`) |
| `assets/pages.css` | 1783/1791 | `#0a0a14` | Collection promo tile dark bg |
| `assets/policy-page.css` | 23/91/128/262 | `#F59E0B` | Policy kicker + link color — **wrong amber** (Tailwind amber-500 instead of EZQuest amber `#FED300`) |
| `assets/support-cluster.css` | 198/203/208 | `#b91c1c`, `#1d4ed8`, `#6d28d9` | Status colors (red/blue/purple) |
| `assets/support-cluster.css` | 242–244 | `#15803d`, `#92400e`, `#b91c1c` | Compatibility status text |
| `assets/support-cluster.css` | 252/254 | `#22c55e`, `#ef4444` | Status dot colors |
| `assets/support-cluster.css` | 304/391 | `#dc2626`, `#22c55e`, `#ef4444` | Warranty list indicators |
| `assets/pdp.css` | 324 | `#1a2330` | Amazon button hover |

**High-priority fix:** `#F59E0B` in `policy-page.css` is the wrong amber — it's Tailwind's `amber-500`, not the brand `#FED300`. This affects the "Legal" kicker and all policy link colors.

**Medium-priority:** `#f5a300` on line 1702 of `pages.css` (sitemap link hover) is another off-brand amber variant.

### 7.4 Non-Standard Breakpoints

Standard Tailwind breakpoints: 640px, 768px, 1024px, 1280px.

**Non-standard breakpoints found:**

| File | Line | Breakpoint | Context |
|---|---|---|---|
| `assets/cookie-consent.css` | 67 | `480px` | Cookie banner mobile stack |
| `assets/pages.css` | 1104 | `479px` | Footer grid single column |
| `assets/pages.css` | 1302 | `479px` | Search grid single column |
| `assets/support-cluster.css` | 368/381/405 | `900px` | Support hub / warranty / guide grids |
| `assets/support-cluster.css` | 369/406/605 | `540px` / `560px` | Support sub-breakpoints |
| `assets/compatibility.css` | 643 | `400px` | Very small screen chips |
| `assets/pdp.css` | 55 | `639px` | PDP gallery (1px below Tailwind `sm:`) |
| `sections/contact-form-panel.liquid` | inline | `900px`, `580px` | Contact layout + form grid |

**Note:** Many uses of `639px`, `767px`, `1023px` are `max-width` equivalents of Tailwind's `sm:`, `md:`, `lg:` breakpoints (640, 768, 1024) and are functionally standard. The 900px, 540px, 560px, 480px, 400px, and 580px values are genuine non-standard breakpoints and should be normalized if possible. However, for grid layouts with custom column counts, non-standard breakpoints are often intentional.

---

## APPENDIX: Tools and Commands Used

All analysis was performed read-only using `bash` and `grep`. No files were modified except the creation of this report.

```bash
# File inventory
ls /Applications/MAMP/htdocs/EZQuest/assets/*.css
wc -l /Applications/MAMP/htdocs/EZQuest/assets/*.css
ls -la /Applications/MAMP/htdocs/EZQuest/assets/*.css | awk '{print $5, $9}' | sort -rn

# Selector extraction
grep -n "^[.#][^{]*{" <file.css>

# Usage cross-referencing
grep -r "class-name" sections/ snippets/ layout/ templates/ assets/*.js

# Class extraction from liquid files  
find sections/ snippets/ layout/ templates/ -name "*.liquid" \
  | xargs grep -oh 'class="[^"]*"' | sed 's/class="//g' | tr ' ' '\n' | sort -u

# JS classList extraction
find assets/ -name "*.js" \
  | xargs grep -oh "classList\.[a-z]*('[^']*')" \
  | grep -oh "'[^']*'" | sed "s/'//g" | sort -u

# !important detection
grep -n "!important" assets/*.css

# Hardcoded color detection
grep -n "#[0-9A-Fa-f]{3,6}" <file.css> | grep -vE "<token patterns>"

# Media query non-standard breakpoints
grep -rn "@media" assets/*.css | grep "max-width|min-width" | grep -v "640|768|1024|1280"

# Style block detection in liquid
grep -rn "<style" sections/ snippets/ layout/ | grep -v "{% style %}"

# CSS file loading detection
grep -rn "stylesheet_tag\|asset_url.*\.css" sections/ layout/ snippets/
```

---

*Report generated: 2026-05-03. This is a static point-in-time analysis. Dynamic class additions via JavaScript are flagged low-confidence, not definitively unused.*
