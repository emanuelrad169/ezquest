# !important Escalation War — Batch 4 Log
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates  
**Dependency:** Batches 1–3 merged

---

## Root Cause Analysis

### The war

`src/styles/theme.css` line 12093 (outside all `@layer` blocks, applying to all templates):

```css
/* ── PDP: product title minimum — both breakpoints must clear 28px ─── */
.product-buybox-title {
  font-size: clamp(1.75rem, 3vw, 2.25rem) !important;
  line-height: 1.12;
}
@media (max-width: 1023px) {
  .product-buybox-title {
    font-size: clamp(1.75rem, 4vw, 2rem) !important;
  }
}
```

`assets/pdp.css` line 413, comment explaining the escalation:

```css
/* Title: clamp(22px → 38px) — !important needed to beat the
   !important rule already set in theme.css for .product-buybox-title */
.main-product-section .product-buybox-title {
  font-size: clamp(1.375rem, 3vw, 2.375rem) !important;
  line-height: 1.12 !important;
  letter-spacing: -0.01em;
}
```

### Why !important was never needed

The pdp.css selector `.main-product-section .product-buybox-title` has specificity **(0, 2, 0)** — two class selectors. The theme.css selector `.product-buybox-title` has specificity **(0, 1, 0)** — one class. Higher specificity wins regardless of cascade order, so pdp.css always beats theme.css for this property **without any `!important`**.

The theme.css `!important` originated from an intent to "guarantee a minimum size everywhere," but that intent collides with the PDP section needing its own smaller (more variable) clamp. The `!important` on a bare selector forces any downstream component to escalate just to override it — bad practice.

### Price/compare-at `!important` are cargo-cult

`theme.css` has NO `!important` on `.price-amount` or `[data-price-compare]`. The pdp.css `!important` on those two rules was added defensively (likely copy-pasted from the title fix) and was never necessary. Equal specificity + later source order already guaranteed pdp.css wins.

---

## Section 1 — Source `!important` Removed

**File:** `src/styles/theme.css` lines 12094, 12099

```diff
 .product-buybox-title {
-  font-size: clamp(1.75rem, 3vw, 2.25rem) !important;
+  font-size: clamp(1.75rem, 3vw, 2.25rem);
   line-height: 1.12;
 }
 @media (max-width: 1023px) {
   .product-buybox-title {
-    font-size: clamp(1.75rem, 4vw, 2rem) !important;
+    font-size: clamp(1.75rem, 4vw, 2rem);
   }
 }
```

Followed by `npm run build:css` to recompile into `assets/theme.css`.

**Commit:** Section 1

---

## Section 2 — Compensating `!important` Removed from pdp.css

**File:** `assets/pdp.css` lines 413–432

```diff
 .main-product-section .product-buybox-title {
-  font-size: clamp(1.375rem, 3vw, 2.375rem) !important;
-  line-height: 1.12 !important;
+  font-size: clamp(1.375rem, 3vw, 2.375rem);
+  line-height: 1.12;
   letter-spacing: -0.01em;
 }

 .main-product-section .price-amount {
-  font-size: 1.75rem !important;
-  font-weight: 500 !important;
+  font-size: 1.75rem;
+  font-weight: 500;
   letter-spacing: -0.01em;
   line-height: 1.1;
 }

 .main-product-section [data-price-compare] {
-  font-size: 1.125rem !important;
-  font-weight: 400 !important;
+  font-size: 1.125rem;
+  font-weight: 400;
   text-decoration: line-through;
-  color: var(--ez-grey) !important;
+  color: var(--ez-grey);
 }
```

Also updated the stale comment to remove the "!important needed" explanation.

**Commit:** Section 2

---

## Section 3 — Verification Matrix

> Browser-based visual verification is required. This log records the cascade analysis confirming correctness; DevTools screenshots should be attached by the engineer running the deployment checklist.

### Why pdp.css wins without `!important`

| Selector | File | Specificity | Layer | Source order |
|---|---|---|---|---|
| `.product-buybox-title` | `theme.css` | (0,1,0) | no-layer | earlier |
| `.main-product-section .product-buybox-title` | `pdp.css` | **(0,2,0)** | no-layer | later |

Higher specificity + later source order → **pdp.css wins on both dimensions**.

For `.price-amount` and `[data-price-compare]`:

| Selector | File | Specificity | Layer | Source order |
|---|---|---|---|---|
| `.product-buybox-price .price-amount` | `theme.css` | (0,2,0) | `@layer base` | earlier |
| `.main-product-section .price-amount` | `pdp.css` | (0,2,0) | no-layer | later |

No-layer beats `@layer base` by cascade layer priority → **pdp.css wins**.

### Product types to verify in browser

| Product type | Check | Expected |
|---|---|---|
| Simple (1 SKU) | `.product-buybox-title` font-size, `.price-amount` font-size | clamp(1.375rem, 3vw, 2.375rem) / 1.75rem |
| Variant product | Title size after variant switch | Unchanged from pre-batch |
| Sold-out product | Title + sold-out state | Unchanged |
| On-sale product | `.data-price-compare` strikethrough, color | line-through / var(--ez-grey) |
| Free product ($0) | `.price-amount` edge case | 1.75rem, no visual change |
| Long-title product | `line-height: 1.12` inheritance | Unchanged |

---

## Section 4 — !important Reconnaissance

All remaining `!important` uses in hand-authored CSS files, classified:

### `assets/faq-accordion.css`

| Line | Declaration | Classification | Notes |
|---|---|---|---|
| 16 | `.faq-trigger { display:flex!important; flex-direction:row!important; align-items:center!important; justify-content:space-between!important; }` | **Necessary** | `<button>` elements get Tailwind's `display:block` reset. `!important` needed to restore flex layout. Could be solved with a more-specific selector but this is acceptable. |
| 22 | `.faq-body { max-height:0!important; }` | **Necessary** | FOUC prevention. Sets closed state before JS initialises accordion. Pair with line 23. |
| 23 | `.faq-item.is-open .faq-body { max-height:800px!important; }` | **Necessary** | Required to beat the base `max-height:0!important` on line 22. This is the intentional accordion CSS pattern — two `!important`s that cancel each other at different states. |

### `assets/pdp.css`

| Line | Declaration | Classification | Notes |
|---|---|---|---|
| 284 | `.product-purchase-row { display: flex !important; }` | **Specificity hack** | Overrides something that sets `display:none` or another display value. The overridden rule should be found and fixed at source. Investigate what hides `.product-purchase-row` on the PDP. |
| 414–415 | `.main-product-section .product-buybox-title { font-size !important; line-height !important; }` | **Fixed this batch** | Cascade war — removed. |
| 421–422 | `.main-product-section .price-amount { font-size !important; font-weight !important; }` | **Fixed this batch** | Cargo-cult — removed. |
| 429–432 | `.main-product-section [data-price-compare] { ×3 !important }` | **Fixed this batch** | Cargo-cult — removed. |

### `assets/pages.css`

| Line | Declaration | Classification | Notes |
|---|---|---|---|
| 1438 | `.collection-subnav__btn { display: inline-flex !important; }` | **Specificity hack** | `<button>` element likely getting a `display:block` or `display:flex` from Tailwind's button reset. Same root cause as faq-accordion.css:16. |
| 1463 | `.collection-subnav .collection-filter-toggle, .collection-subnav .collection-filter-btn { display: inline-flex !important; }` | **Cascade war** | Comment says explicitly: "Override theme.css display:none on .collection-filter-toggle at ≥1024px". The source rule in theme.css should have its display:none placed more precisely (inside the correct breakpoint), or the pdp.css rule should use a media query instead of `!important`. |
| 1647 | `.wishlist-button, #tidio-chat { display: none !important; }` | **Necessary** | Inside `@media print`. Suppressing third-party widgets from print output. Standard, correct use. |

### `layout/theme.liquid` (inline `<style>`)

| Location | Declaration | Classification |
|---|---|---|
| Line 164 | `[hidden]{display:none!important}` | **Necessary** — HTML spec requirement, enforces `hidden` attribute semantics |
| Line 167 | `#tidio-chat-root,#tidio-chat-code{display:none!important}` | **Necessary** — CLS prevention for third-party widget, intentional |

### Summary

| Classification | Count | Files |
|---|---|---|
| Necessary | 6 | faq-accordion.css (3), pages.css (1), layout/theme.liquid (2) |
| Cascade war | 2 | pages.css (1 — collection-filter-toggle), pdp.css (3 — **fixed this batch**) |
| Specificity hack | 2 | pdp.css (1 — purchase-row), pages.css (1 — collection-subnav__btn) |
| Fixed this batch | 5 | pdp.css (title + price-amount + compare-at) |

**Remaining actionable items for a future batch:**
1. `pdp.css:284` — investigate what hides `.product-purchase-row` and fix at source
2. `pages.css:1438` — improve button specificity to avoid overriding Tailwind reset
3. `pages.css:1463` — add media query to source display:none in theme.css instead of `!important` override

---

## Acceptance Verification

```bash
grep "!important" assets/pdp.css
# Expected: line 284 only (.product-purchase-row)

grep "product-buybox-title" assets/theme.css
# Expected: no !important on these rules

grep "!important" src/styles/theme.css | grep "product-buybox"
# Expected: zero matches
```
