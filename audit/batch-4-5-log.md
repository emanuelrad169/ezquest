# !important Cascade War — Batch 4.5 Log
**Date:** 2026-05-04  
**Branch:** codex-publish-launch-updates  
**Dependency:** Batches 1–4 merged, marquee fix merged

Resolves the three remaining specificity hacks and cascade wars identified in Batch 4 Section 4 reconnaissance.

---

## Target 1 — `.product-purchase-row { display: flex !important }`
**File:** `assets/pdp.css` line 284  
**Commit:** `7695c37`

### Investigation

| Selector | File | Layer | Specificity | Source order | Value |
|---|---|---|---|---|---|
| `.product-purchase-row` | `src/styles/theme.css:2134` | `@layer components` | (0,1,0) | earlier | `display: grid` (via `@apply`) |
| `.product-purchase-row` | `src/styles/theme.css:14380` | no-layer | (0,1,0) | earlier | `display: flex` |
| `.product-purchase-row` | `assets/pdp.css:284` | no-layer | (0,1,0) | **later** | `display: flex !important` |

### Why !important was never needed

No-layer rules beat `@layer components` regardless of specificity. The `theme.css:14380` no-layer rule and the `pdp.css` no-layer rule have equal specificity `(0,1,0)`. `pdp.css` loads after `theme.css` (section stylesheet loads after layout stylesheet in Shopify), so pdp.css wins by source order. Both rules set `display: flex`, so there was no visual conflict to begin with.

### Fix

Removed `!important` from `pdp.css:284`. No theme.css changes. No recompile.

### Verification

```bash
grep "!important" assets/pdp.css
# Expected: zero matches ✓
```

---

## Target 2 — `.collection-subnav__btn { display: inline-flex !important }`
**File:** `assets/pages.css` line 1438  
**Commit:** `225d452`

### Investigation

The filter toggle button HTML: `<button class="collection-subnav__btn collection-filter-toggle collection-filter-btn">`. It carries all three classes simultaneously.

| Selector | File | Layer | Specificity | Source order | Value |
|---|---|---|---|---|---|
| `.collection-filter-toggle` | `src/styles/theme.css:13602` | no-layer | (0,1,0) | earlier | `display: none` |
| `.collection-subnav__btn` | `assets/pages.css` | no-layer | (0,1,0) | **later** | `display: inline-flex !important` |

`pages.css` loads after `theme.css`, so it already wins by source order without `!important`.

The `button { display: none !important }` visible in compiled `assets/theme.css` is inside `@media print` — it does not affect screen rendering.

### Fix

Changed selector from `.collection-subnav__btn` to `.collection-subnav .collection-subnav__btn` (specificity `(0,2,0)`) and removed `!important`. Updated the `:hover` rule selector to match. The filter toggle button is always inside `.collection-subnav`, so the parent context is always present.

### Verification

```bash
grep "!important" assets/pages.css
# Expected: only the @media print block ✓
```

---

## Target 3 — `.collection-subnav .collection-filter-toggle { display: inline-flex !important }`
**File:** `assets/pages.css` line 1463  
**Commit:** `240acf8`

### Investigation

After Target 2's selector boost to `(0,2,0)`, the `.collection-subnav .collection-filter-toggle` override at `(0,2,0)` was also redundant. The root issue: `theme.css` base rule applied `display: none` to `.collection-filter-toggle` at all viewport widths.

### Root cause of the `display: none`

The classes `.collection-filter-toggle` and `.collection-filter-btn` appear in the codebase in exactly one location: `sections/main-collection.liquid`, always on the same element that also carries `.collection-subnav__btn`. The `display: none` was a holdover from an era when the classes might have been used in other contexts (e.g., a separate mobile filter bar). Those contexts no longer exist.

### Fix

1. **`src/styles/theme.css:13604`** — Removed `display: none` from the base rule for `.collection-filter-toggle, .collection-filter-btn`. All other structural properties remain. The `@media (max-width: 1023px) { display: inline-flex }` at line 13717 is kept as a belt-and-suspenders reinforcement on mobile.

2. **`assets/pages.css`** — Deleted the entire override block:
   ```css
   /* Override theme.css display:none on .collection-filter-toggle at ≥1024px */
   .collection-subnav .collection-filter-toggle,
   .collection-subnav .collection-filter-btn {
     display: inline-flex !important;
   }
   ```

3. **`npm run build:css`** — Recompiled `assets/theme.css`.

### Verification

```bash
grep "display: none" src/styles/theme.css | grep "filter-toggle\|filter-btn"
# Expected: zero matches ✓

grep "collection-filter-toggle" assets/theme.css
# Expected: no display:none in compiled output ✓

grep "!important" assets/pages.css
# Expected: only @media print block ✓
```

---

## Acceptance Matrix

| Check | Expected | Result |
|---|---|---|
| `grep "!important" assets/pdp.css` | zero matches | ✓ |
| `grep "!important" assets/pages.css` | print block only (line ~1647) | ✓ |
| Compiled `assets/theme.css`: no `display:none` on filter-toggle | confirmed | ✓ |

---

## Browser Verification Checklist

- **Any PDP** (`/products/*`): `.product-purchase-row` renders as flex row — qty + ATC + wishlist inline. No layout change from pre-batch.
- **Collection page desktop** (`/collections/all` at ≥1024px): filter toggle button visible as inline-flex pill inside subnav, not hidden.
- **Collection page mobile** (≤1023px): filter toggle button still visible, correct styling.
- **Collection page sort button**: renders as inline-flex (the `<span class="collection-subnav__btn">` sort widget). No layout change.

---

## Remaining `!important` Uses (all legitimate)

| File | Classification | Notes |
|---|---|---|
| `assets/faq-accordion.css:16,22,23` | Necessary | Button flex reset, FOUC prevention accordion pattern |
| `assets/pages.css` print block | Necessary | `@media print` — suppresses UI chrome from print output |
| `layout/theme.liquid:164` | Necessary | `[hidden]{display:none!important}` — HTML spec requirement |
| `layout/theme.liquid:167` | Necessary | Tidio CLS prevention |
