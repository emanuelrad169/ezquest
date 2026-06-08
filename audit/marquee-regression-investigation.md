# Marquee Regression Investigation
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates  
**Status:** Read-only investigation — no files modified

---

## 1. Component Location

**Section file:** `sections/hero-home.liquid` lines 309–360

No `{% style %}` block exists in `hero-home.liquid`. No `stylesheet_tag` reference for a hero-specific CSS file. The section relies entirely on global CSS files for styling.

---

## 2. HTML Structure

```html
<div class="marquee-strip" aria-hidden="true">
  <div class="marquee-track">
    <span class="marquee-content">
      <span class="marquee-item">2-year warranty</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">Ships within 24 hours</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">Works with Mac &amp; Windows</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">30-day returns</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">DuraGuard braided cables</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">No drivers needed</span>
      <span class="marquee-dot">·</span>
      <span class="marquee-item">Free shipping over $100</span>
      <span class="marquee-dot">·</span>
    </span>
    <span class="marquee-content" aria-hidden="true"><!-- duplicate --></span>
    <span class="marquee-content" aria-hidden="true"><!-- duplicate --></span>
  </div>
</div>
```

The duplicate `.marquee-content` spans (×2 `aria-hidden="true"`) are the standard CSS-only infinite-scroll pattern: three copies ensure seamless looping when the animation translates the track by one-third (`-33.333%`) and resets.

---

## 3. CSS Class Inventory

| Class | Expected file | Rule exists? |
|---|---|---|
| `.marquee-strip` | `src/styles/theme.css` or `assets/pages.css` | **No** |
| `.marquee-track` | `src/styles/theme.css` or `assets/pages.css` | **No** |
| `.marquee-content` | `src/styles/theme.css` or `assets/pages.css` | **No** |
| `.marquee-item` | `src/styles/theme.css` or `assets/pages.css` | **No** |
| `.marquee-dot` | `src/styles/theme.css` or assets/pages.css` | **No** |

**Verification:**
```bash
grep -rn "marquee-strip\|marquee-track\|marquee-content\|marquee-item\|marquee-dot" \
  assets/*.css src/styles/theme.css
# → zero matches
```

The only `marquee`-related CSS in the codebase is `@keyframes home-press-marquee` at `src/styles/theme.css:9057` — this drives `.home-press-track` (the press-logo ticker in the social-proof section), which is a completely separate component.

---

## 4. Git History

### When the HTML was introduced

```bash
git log --oneline --all -S "marquee-strip"
# c8728d1  fix(cascade): remove !important from .product-buybox-title in theme.css source
# 4ca9011  feat: publish launch readiness and storefront updates
```

- `4ca9011` added the `marquee-strip` HTML block to `sections/hero-home.liquid` (confirmed via `git show 4ca9011 -- sections/hero-home.liquid`).
- `c8728d1` is Batch 4 — it recompiled `assets/theme.css` from source, which propagated the string `home-press-marquee` into the minified output; there is no trust-strip marquee CSS in that commit.

### Whether CSS was ever committed

```bash
git log --oneline --all -S "marquee-strip" -- assets/pages.css
# → (no output)
git log --oneline --all -S "marquee-strip" -- src/styles/theme.css
# → (no output)
```

No commit in the repo's entire history has ever added `.marquee-strip` (or any sibling class) to a CSS file.

### Commits that touched files since Batch 1

| File | Batch commits |
|---|---|
| `sections/hero-home.liquid` | None — last touched at `4ca9011` (pre-Batch 1) |
| `assets/pages.css` | `b4ed135`, `d38185e`, `34d081c`, `a7db63e` |
| `src/styles/theme.css` | Batch 3 token additions, Batch 4 `!important` removal + recompile |

None of these commits touched the marquee component or its missing CSS.

---

## 5. Root Cause

**This is not a batch regression.** No batch removed any marquee CSS — none ever existed.

The trust-strip marquee HTML was authored in commit `4ca9011` ("feat: publish launch readiness and storefront updates") without its corresponding CSS block. The component was shipped as live markup with zero styling rules, causing it to render as unstyled multi-line text with no animation from day one of the launch.

The visible result is `marquee-strip` receiving only browser default block flow layout: each `.marquee-item` inherits `display: inline` (from `<span>`) and wraps normally. Without `overflow: hidden` on the strip, `display: flex; white-space: nowrap` on the track, or the `@keyframes` + `animation` on the content spans, no scrolling occurs.

---

## 6. What CSS Is Missing

To match the standard infinite-scroll marquee pattern implied by the HTML structure (three copies, `aria-hidden` duplicates):

| Property | Target | Value needed |
|---|---|---|
| `overflow: hidden` | `.marquee-strip` | clips the track |
| `display: flex` | `.marquee-track` | places content spans side-by-side |
| `white-space: nowrap` | `.marquee-track` | prevents wrapping |
| `width: max-content` | `.marquee-content` | each span as wide as its items |
| `display: flex; align-items: center; gap` | `.marquee-content` | horizontal item row |
| `@keyframes marquee-scroll { to { transform: translateX(-33.333%) } }` | — | the scroll animation |
| `animation: marquee-scroll Xs linear infinite` | `.marquee-track` | drives the loop |
| Typography for `.marquee-item` / `.marquee-dot` | — | font-size, color, spacing |

---

## 7. Proposed Fix

Add a `marquee-strip` CSS rule-set to `src/styles/theme.css` (or a dedicated `assets/marquee.css` if the block exceeds 15 lines) implementing `overflow:hidden` on the strip, `display:flex; white-space:nowrap` on the track, and a `@keyframes marquee-scroll` animation on the content spans.
