# Batch 6 — Tailwind Utility Migration Log

**Goal**: Replace single-property and trivially-mappable CSS rules with Tailwind utility classes in Liquid markup.
**Strategy**: Phase A (add utility alongside class), Phase B (delete CSS rule), optional Phase C (remove orphaned class).

---

## Priority 1 — Single-property rules

### Rule 1 — `.page-section--white { background: #fff }`
| | |
|---|---|
| Utility | `bg-white` |
| Files modified | `sections/our-story.liquid`, `sections/about.liquid`, `sections/shipping-returns.liquid` (×2 occurrences) |
| CSS file | `assets/pages.css` |
| Phase C | No — BEM modifier; kept for semantic clarity |
| JS check | No references |
| Verification page | `/pages/our-story`, `/pages/about`, `/pages/shipping-returns` |
| Commit | `c0f9889` |

---

### Rule 2 — `.story-section-intro__kicker { text-align: left }`
| | |
|---|---|
| Utility | `text-left` |
| Files modified | `sections/our-story.liquid` (×2 occurrences) |
| CSS file | `assets/pages.css` |
| Phase C | No — kept for semantic clarity |
| JS check | No references |
| Verification page | `/pages/our-story` |
| Commit | `77121e0` |

---

### Rule 3 — `.section-intro__heading--left { text-align: left }`
| | |
|---|---|
| Utility | `text-left` |
| Files modified | `sections/shipping-returns.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | No — BEM modifier; kept |
| JS check | No references |
| Verification page | `/pages/shipping-returns` |
| Commit | `25884fb` |

---

### Rule 4 — `.story-three-col { padding: 0 }`
| | |
|---|---|
| Utility | `p-0` |
| Files modified | `sections/our-story.liquid`, `sections/about.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | **No — class retained in markup** (referenced in `assets/scroll-animate.js:33` as a scroll animation target selector) |
| JS check | `scroll-animate.js:33: '.story-three-col'` — must keep |
| Verification page | `/pages/our-story`, `/pages/about` |
| Commit | `6ff5c73` |

---

### Rule 5 — `.free-shipping-strip svg { flex-shrink: 0 }`
| | |
|---|---|
| Utility | `shrink-0` (on the `<svg>` element directly) |
| Files modified | `sections/shipping-returns.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | N/A — descendant selector; utility applied to element |
| JS check | No references |
| Verification page | `/pages/shipping-returns` |
| Commit | `92dc352` |

---

### Rule 6 — `.blog-hero__link:hover { opacity: 0.75 }`
| | |
|---|---|
| Utility | `hover:opacity-75` |
| Files modified | `sections/main-blog.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | No — `.blog-hero__link` still has a base CSS rule (line 474); class kept |
| JS check | No references |
| Verification page | `/blogs/news` |
| Commit | `bdbfd05` |

---

### Rule 7 — `.blog-featured__dot { opacity: 0.4 }`
| | |
|---|---|
| Utility | `opacity-40` |
| Files modified | `sections/main-blog.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | No — kept for semantic clarity |
| JS check | No references |
| Verification page | `/blogs/news` |
| Commit | `d90723c` |

---

### Rule 8 — `.article-author-card__info { flex: 1 }`
| | |
|---|---|
| Utility | `flex-1` |
| Files modified | `sections/main-article.liquid` |
| CSS file | `assets/pages.css` |
| Phase C | No — kept for semantic clarity |
| JS check | No references |
| Verification page | Any blog article page |
| Commit | `6c065ef` |

---

### Rule 9 — `.cart-trust-strip__item svg { flex-shrink: 0 }`
| | |
|---|---|
| Utility | `shrink-0` (on each `<svg>` element directly) |
| Files modified | `snippets/cart-trust-strip.liquid` (3 SVG elements) |
| CSS file | `assets/pages.css` |
| Phase C | N/A — descendant selector; utility applied to element |
| JS check | No references |
| Verification page | `/cart` |
| Commit | `1f12dae` |

---

### Rule 10 — `.pdp-trust-item:last-child { border-right: none }`
| | |
|---|---|
| Utility | `last:border-r-0` |
| Files modified | `sections/main-product.liquid` (4 occurrences via `replace_all`) |
| CSS file | `assets/pdp.css` |
| Phase C | No — `.pdp-trust-item` still has a base CSS rule; class kept |
| JS check | No references |
| Verification page | Any product page |
| Commit | `644a16b` |

---

### Rule 11 — `.pdp-video-wrap { width: 100% }`
| | |
|---|---|
| Utility | `w-full` |
| Files modified | `sections/main-product.liquid` |
| CSS file | `assets/pdp.css` |
| Phase C | No — kept for semantic clarity |
| JS check | No references |
| Verification page | Any product page with video |
| Commit | `2b9a40c` |

---

### Rule 12 — `.warranty-section { margin-bottom: 2.5rem }`
| | |
|---|---|
| Utility | `mb-10` |
| Files modified | `sections/warranty-page.liquid` (3 occurrences) |
| CSS file | `assets/support-cluster.css` |
| Phase C | No — `.warranty-section__heading` selector name shares prefix; kept for clarity |
| JS check | No references |
| Verification page | `/pages/warranty` |
| Commit | `1dd75f2` |

---

### Rule 13 — `.policy-page { background: #fff }`
| | |
|---|---|
| Utility | `bg-white` |
| Files modified | `sections/policy-page.liquid` |
| CSS file | `assets/policy-page.css` |
| Phase C | No — class likely queried by `policy-page.js` layout injection (comment on line 36 references a "Layout wrapper injected by policy-page.js") |
| JS check | Not a direct class reference but JS creates layout inside `.policy-page`; kept for safety |
| Verification page | `/pages/cookie-policy` |
| Commit | `c1fc612` |

---

## Priority 2 — Multi-utility rules

### Rule 14 — `.qv-modal__atc:disabled { opacity: 0.5; cursor: default }`
| | |
|---|---|
| Utilities | `disabled:opacity-50 disabled:cursor-default` |
| Files modified | `assets/quick-view.js` (line 95), `assets/quick-view-modal.js` (line 59) — button created dynamically in JS template strings |
| CSS file | `assets/pages.css` |
| Phase C | No — `qv-modal__atc` class kept (referenced in both JS files as the button class) |
| JS check | Both JS files build the button string; utilities added to the class string in both |
| Verification page | Any product page — open quick-view modal, switch to sold-out variant |
| Commit | `cb5cedb` |

---

### Rule 15 — `.site-footer__tagline { font-size:12px; line-height:1.5; color:#6e6e73 }` — DEFERRED
**Reason**: Task description does not match the actual CSS rule. Actual rule in `pages.css:1012`:
```css
.site-footer__tagline { font-size: 12px; color: rgba(255,255,255,0.62); margin: 0; }
```
The color is white-translucent (`rgba(255,255,255,0.62)`), correct for the dark footer background. Applying `text-[var(--ez-grey)]` (which is `#6e6e73`, a dark grey) would break the footer text rendering — Phase A verification would fail. The `line-height:1.5` property in the task description is not present in the actual rule.

**Correct Tailwind equivalent of the actual rule**: `text-xs m-0 text-white/[62%]` — but this was not specified in the task and uses an arbitrary opacity modifier. **Deferring pending correct target specification.**

---

### Rule 16 — `.site-footer__copy { font-size:12px; line-height:1.5; color:#6e6e73 }` — DEFERRED
**Reason**: Same mismatch as Rule 15. Actual rule in `pages.css:1034`:
```css
.site-footer__copy { font-size: 12px; color: rgba(255,255,255,0.62); margin: 0; }
```
Additionally, a responsive rule at `pages.css:1038` (`order: 3` inside a `@media (max-width: 767px)`) would remain after deletion of the base rule — the class cannot be fully eliminated, but this was not the goal anyway. **Deferring pending correct target specification.**

---

## Summary

| Rule | CSS rule | Utility | Commit | Status |
|---|---|---|---|---|
| 1 | `.page-section--white { background: #fff }` | `bg-white` | `c0f9889` | Done |
| 2 | `.story-section-intro__kicker { text-align: left }` | `text-left` | `77121e0` | Done |
| 3 | `.section-intro__heading--left { text-align: left }` | `text-left` | `25884fb` | Done |
| 4 | `.story-three-col { padding: 0 }` | `p-0` | `6ff5c73` | Done (class kept — JS) |
| 5 | `.free-shipping-strip svg { flex-shrink: 0 }` | `shrink-0` | `92dc352` | Done |
| 6 | `.blog-hero__link:hover { opacity: 0.75 }` | `hover:opacity-75` | `bdbfd05` | Done |
| 7 | `.blog-featured__dot { opacity: 0.4 }` | `opacity-40` | `d90723c` | Done |
| 8 | `.article-author-card__info { flex: 1 }` | `flex-1` | `6c065ef` | Done |
| 9 | `.cart-trust-strip__item svg { flex-shrink: 0 }` | `shrink-0` | `1f12dae` | Done |
| 10 | `.pdp-trust-item:last-child { border-right: none }` | `last:border-r-0` | `644a16b` | Done |
| 11 | `.pdp-video-wrap { width: 100% }` | `w-full` | `2b9a40c` | Done |
| 12 | `.warranty-section { margin-bottom: 2.5rem }` | `mb-10` | `1dd75f2` | Done |
| 13 | `.policy-page { background: #fff }` | `bg-white` | `c1fc612` | Done |
| 14 | `.qv-modal__atc:disabled { opacity:0.5; cursor:default }` | `disabled:opacity-50 disabled:cursor-default` | `cb5cedb` | Done |
| 15 | `.site-footer__tagline { ... }` | — | — | **Deferred** (CSS mismatch) |
| 16 | `.site-footer__copy { ... }` | — | — | **Deferred** (CSS mismatch) |

**14 of 16 rules migrated. 14 commits.**

---

## Migration roadmap — rules newly eligible

Rules that became candidates during this batch (single-property, no blockers found):

1. **`.blog-hero__link { ... }`** (`pages.css:474`) — full base rule now exposed; if it becomes single-property after other cleanup it can be migrated.
2. **`.site-footer__tagline` / `.site-footer__copy`** — correct Tailwind equivalent is `text-xs m-0 text-white/[62%]`; eligible once color token `--ez-white-62` (or equivalent) is defined, or task is respecified with correct utility.
3. **`.story-section-intro__heading { text-align: left; margin: 0 }`** (`pages.css:164`) — two-property rule, eligible as `text-left m-0` in next batch.
4. **`.qv-modal__atc:hover { opacity: 0.88 }`** (`pages.css:1259`) — single-property hover, eligible as `hover:opacity-[0.88]`. Currently blocked because `opacity-88` is not a Tailwind scale value (arbitrary value needed).
5. **`.pdp-trust-item { ... }`** (`pdp.css:263`) — multi-property base rule; review for partial extraction after class name is fully indexed.
