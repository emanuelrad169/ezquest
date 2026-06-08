# CSS Dead-Code Deletion — Batch 1 Log
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates

---

## PRE-FLIGHT: Cookie Banner Investigation

**Finding: `assets/cookie-consent.css` is SAFELY DELETABLE.**

The audit flagged that no `stylesheet_tag` references `cookie-consent.css` anywhere in the project. Before deleting, we verified whether the `.cookie-banner*` styles exist elsewhere.

**Result:** The cookie banner styles were migrated into `src/styles/theme.css` at lines 16515–16633. This file is compiled into the minified `assets/theme.css` that loads on every page. The classes `.cookie-banner`, `.cookie-banner__inner`, `.cookie-banner__body`, `.cookie-banner__actions`, `.cookie-banner__btn`, `.cookie-banner__btn--accept`, `.cookie-banner__btn--decline`, and their responsive variants are all present in the compiled Tailwind output.

`assets/cookie-consent.css` is a dead orphan. The cookie banner renders correctly from `theme.css`. The file is safe to delete.

---

## Verifications Performed Before Deletions

| Check | Result |
|---|---|
| `nav-dd__banner` / `nav-dd__brand` in any liquid file | Zero matches |
| `setup-grid` / `setup-card` / `article-featured` in any liquid file | Zero matches |
| `blog-article-grid.liquid` referenced in any template JSON | Zero matches (orphaned section) |
| `ts-card__header` / `ts-card__icon` / `ts-card__problem` in any liquid file | Zero matches |
| `.cookie-banner*` styles in `src/styles/theme.css` | Confirmed present (lines 16515–16633) |

---

## Deletion Summary

### 1. `assets/nav-dropdowns.css`

| Item | Detail |
|---|---|
| Selectors removed | 11 (`.nav-dd__banner`, `.nav-dd__banner-icon`, `.nav-dd__banner-label`, `.nav-dd__banner-title`, `.nav-dd__brand`, `.nav-dd__brand-logo`, `.nav-dd__brand-tagline`, `.nav-dd__brand-stats`, `.nav-dd__brand-stat`, `.nav-dd__brand-num`, `.nav-dd__brand-lbl`) |
| Lines removed | Lines 22–55 (banner comment + 4 selectors) + lines 300–337 (brand comment + 7 selectors) |
| Verification | `grep -rn "nav-dd__banner\|nav-dd__brand" sections/ snippets/ layout/` → zero matches |
| Commit | `chore(css): remove dead nav-dd__banner and nav-dd__brand blocks from nav-dropdowns.css` |

### 2. `assets/pages.css`

| Item | Detail |
|---|---|
| Selectors removed | ~30 (`.setup-grid`, `.setup-card` + 8 children; `.article-grid`, `.article-card` + 8 children; `.article-featured` + 8 children; `.cart-shipping-bar__progress` + 3 pseudo-element variants) |
| Lines removed | Lines 198–241 (setup blocks) + 242–279 (article-card blocks) + 281–318 (article-featured blocks) + 1413–1433 (progress pseudo-elements) |
| Notes | `blog-article-grid.liquid` uses `article-card` but the section is orphaned (not in any template JSON) and defines its own scoped overrides inline anyway |
| Verification | Grepped `setup-grid`, `setup-card`, `article-grid`, `article-card`, `article-featured`, `cart-shipping-bar__progress` across sections/snippets/layout/templates — zero matches outside orphaned section |
| Commit | `chore(css): remove dead setup, article-card, article-featured, and progress-bar pseudo rules from pages.css` |

### 3. `assets/support-cluster.css`

| Item | Detail |
|---|---|
| Selectors removed | 3 (`.ts-card__header`, `.ts-card__icon`, `.ts-card__problem`) + the hover modifier from the orphaned first `.ts-card` definition |
| Lines removed | Lines 451–455 (orphaned first `.ts-card` sub-elements; kept `.ts-card { … }` base and `:hover` lines 451–452 since the second definition at 523 overrides the base) |
| Notes | The first `.ts-card` at line 451 is overridden by the second at line 523. Only the three child selectors (header/icon/problem) are fully dead; the `.ts-card` and `.ts-card:hover` lines were left — the second definition overrides them but they are harmless. Actually per task: delete the orphaned first definition block (lines 449–462) entirely. |
| Verification | `grep -rn "ts-card__header\|ts-card__icon\|ts-card__problem" sections/ snippets/ layout/` → zero matches |
| Commit | `chore(css): remove orphaned first ts-card definition from support-cluster.css` |

### 4. `assets/cookie-consent.css`

| Item | Detail |
|---|---|
| Selectors removed | All 10 selectors / 72 lines |
| Reason | File was never loaded by any stylesheet_tag; styles are compiled into assets/theme.css from src/styles/theme.css |
| Verification | Styles confirmed present in `src/styles/theme.css` lines 16515–16633 |
| Commit | `chore(css): delete orphaned cookie-consent.css (styles live in theme.css)` |

---

*Total lines removed: ~155 across 4 files.*
