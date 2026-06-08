# Batch 5 — Inline Style Extraction Log

**Rule**: `<style>` blocks > 15 lines must move to a CSS asset file. Blocks ≤ 15 lines may stay inline.

**Strategy**:
- Type A (no Liquid in selectors or values) — extract verbatim, strip `#shopify-section-{{ section.id }}` prefix.
- Type B (Liquid in selectors only) — strip prefix; class names are component-unique so prefix is unnecessary.
- Type B+ (Liquid in CSS *values*) — keep a minimal `<style>` emitting only custom-property declarations on the scoped selector; write static rules in the asset file using `var()` with fallback values.

---

## File 1 — `sections/contact-form-panel.liquid`

| | |
|---|---|
| Type | A (no Liquid) |
| Lines removed | 38 |
| Destination | `assets/support-cluster.css` |
| Inline leftover | none |
| Commit | `1660d88` |

Section already had `{{ 'support-cluster.css' | asset_url | stylesheet_tag }}` at line 1. Extracted verbatim.

---

## File 2 — `sections/blog-article-grid.liquid`

| | |
|---|---|
| Type | B (Liquid in selector prefix only) |
| Lines removed | ~70 |
| Destination | `assets/pages.css` |
| Inline leftover | none |
| Commit | `eb764cc` |

Added `{{ 'pages.css' | asset_url | stylesheet_tag }}` as line 1. `#shopify-section-{{ section.id }}` prefix stripped — `.blog-grid` and `.article-card` are component-unique.

---

## File 3 — `sections/shoppable-video.liquid`

| | |
|---|---|
| Type | B+ (Liquid in selector prefix + per-block `--x`/`--y` custom properties in values) |
| Lines removed | ~90 static lines |
| Destination | `assets/shoppable-video.css` (new file) |
| Inline leftover | `{% for block %}` loop emitting `.shoppable-product-tag--{{ block.id }} { --x: ...; --y: ...; }` |
| Commit | `9123cec` |

New file created because shoppable-video is a standalone section with no existing CSS asset. The per-block tag positioning cannot be static (block IDs and merchant-set positions are Liquid values), so the loop stays inline. All other rules extracted.

---

## File 4 — `sections/product-compare-table.liquid`

| | |
|---|---|
| Type | B (Liquid in selector prefix only) |
| Lines removed | ~100 |
| Destination | `assets/pdp.css` |
| Inline leftover | none |
| Commit | `a230d89` |

Section renders on both `product.json` (where `pdp.css` loads via `main-product.liquid`) and `page.compare.json` (no implicit loader). Added `{{ 'pdp.css' | asset_url | stylesheet_tag }}` directly in section — Shopify deduplicates `stylesheet_tag` calls, so no double-load on product pages.

---

## File 5 — `sections/email-signup.liquid`

| | |
|---|---|
| Type | B (Liquid in selector prefix only) |
| Lines removed | ~50 |
| Destination | `assets/pages.css` |
| Inline leftover | none |
| Commit | `282a319` |

Added `{{ 'pages.css' | asset_url | stylesheet_tag }}` as line 1. `.visually-hidden` omitted from extraction — it's a global utility already defined in `theme.css`.

---

## File 6 — `sections/recently-viewed.liquid`

| | |
|---|---|
| Type | B (Liquid in selector prefix only) |
| Lines removed | 40 |
| Destination | `assets/pdp.css` |
| Inline leftover | none |
| Commit | `3433285` |

Added `{{ 'pdp.css' | asset_url | stylesheet_tag }}` as line 1. Section already had it in context from `frequently-bought-together`, but `recently-viewed.liquid` is independent and needed its own declaration.

---

## File 7 — `sections/frequently-bought-together.liquid`

| | |
|---|---|
| Type | B (Liquid in selector prefix only) |
| Lines removed | ~30 |
| Destination | `assets/pdp.css` |
| Inline leftover | none |
| Commit | `868aa66` |

Added `{{ 'pdp.css' | asset_url | stylesheet_tag }}` as line 1. Section is PDP-only so `pdp.css` is the correct destination.

---

## File 8 — `sections/announcement-bar.liquid`

| | |
|---|---|
| Type | B+ (Liquid in selector prefix + `background_color` and `text_color` in CSS values) |
| Lines removed | 110 (style block) |
| Destination | `assets/pages.css` |
| Inline leftover | 7-line `<style>` emitting `--ab-bg` and `--ab-text` custom properties |
| Commit | `0866f45` |

`{{ section.settings.background_color }}` → `var(--ab-bg, #FED300)`
`{{ section.settings.text_color }}` → `var(--ab-text, #0f172a)`

The custom-property emitter is scoped to `#shopify-section-{{ section.id }}` so merchant color changes propagate correctly. Fallback values match schema defaults. `pages.css` loads globally via `footer.liquid` — no `stylesheet_tag` added to section.

---

## Summary

| File | Type | Lines out | Destination |
|---|---|---|---|
| contact-form-panel | A | 38 | support-cluster.css |
| blog-article-grid | B | ~70 | pages.css |
| shoppable-video | B+ | ~90 | shoppable-video.css (new) |
| product-compare-table | B | ~100 | pdp.css |
| email-signup | B | ~50 | pages.css |
| recently-viewed | B | 40 | pdp.css |
| frequently-bought-together | B | ~30 | pdp.css |
| announcement-bar | B+ | 110 | pages.css |

**Total inline lines eliminated**: ~528
**New CSS files created**: 1 (`assets/shoppable-video.css`)
**Files with inline leftovers**: 2 (shoppable-video block-position loop, announcement-bar color emitter)
