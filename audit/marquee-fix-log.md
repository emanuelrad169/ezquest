# Marquee Fix Log
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates  
**Commit:** `7fa2643`

---

## Background

The trust-strip marquee component (`sections/hero-home.liquid` lines 309–360) was shipped in commit `4ca9011` ("feat: publish launch readiness and storefront updates") without any CSS. It rendered as unstyled multi-line static text from launch. No batch in this sprint removed the CSS — it was never present. See `/audit/marquee-regression-investigation.md` for full diagnosis.

---

## Fix

**File modified:** `assets/pages.css` (appended after line 1651)

Added 51 lines covering:

| Rule | Purpose |
|---|---|
| `.marquee-strip { overflow: hidden }` | Clips the scrolling track to viewport width |
| `.marquee-track { display: flex; width: max-content; white-space: nowrap; animation }` | Lays content copies side-by-side and drives the scroll |
| `.marquee-content { display: flex; align-items: center; gap; flex-shrink: 0 }` | Horizontal item row per copy |
| `.marquee-item` | Typography for each trust item |
| `.marquee-dot` | Separator dot, 50% opacity |
| `@keyframes marquee-scroll` | `translateX(0 → -33.333%)` |
| `@media (prefers-reduced-motion: reduce)` | Stops animation for vestibular sensitivity |

**Why pages.css:** `pages.css` is loaded on every page via `sections/footer.liquid`, which is included globally through `{% sections 'footer-group' %}` in `layout/theme.liquid`. No additional `stylesheet_tag` was needed in `hero-home.liquid`.

---

## Three Values to Confirm in Browser

1. **40s scroll duration** — Adjust if too fast (frantic) or too slow (broken-feeling). The 7-item list at typical font-size reads well near 30–45s.

2. **`translateX(-33.333%)`** — Correct for the current three-`.marquee-content` structure. If the HTML copy count ever changes to N copies, update to `-1/N * 100%`. A comment in the keyframe block warns future editors.

3. **`background: var(--ez-light)`** (`#f5f5f7`) — Assumes a light grey separator strip between the dark hero and the white content below. If the intended design is white or transparent, swap to `#fff` or `transparent` respectively.
