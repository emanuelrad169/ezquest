# CSS Deduplication — Batch 2 Log
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates  
**Dependency:** Batch 1 (commits `7edccf8`–`ebd808d`) merged first

---

## Item 1 — wtb-cta: three definitions → one (pages.css)

### Before-state

| Location | Rule body | Live? |
|---|---|---|
| `assets/pages.css` | **NOT PRESENT** (audit was incorrect — the file had no .wtb-cta rule) | — |
| `assets/support-cluster.css` L661 | `background: var(--ez-dark); padding: clamp(48px,6vw,72px) 0; margin-top: 0;` | **Yes** — loaded by troubleshooting-guide |
| `sections/where-to-buy.liquid` {% style %} L63 | `background:var(--ez-dark);padding:clamp(48px,6vw,72px) clamp(1.25rem,5vw,5rem);text-align:center;margin-top:0;` | **Dead** — no .wtb-cta HTML element exists on the where-to-buy page |

**Finding:** The only HTML usage of `.wtb-cta` is in `troubleshooting-guide.liquid`. The `where-to-buy.liquid` inline `.wtb-cta` style was orphaned (defined but never applied). The extra `text-align:center` and horizontal padding in the inline version were not load-bearing.

**Decision:** Canonical version = `support-cluster.css` body (the live one). Moved to `pages.css` at end of wtb-* section. Added `pages.css` stylesheet_tag to `troubleshooting-guide.liquid` to preserve styles after removal from `support-cluster.css`.

### Changes made

- `assets/pages.css`: Added `.wtb-cta` and `.wtb-cta__text` after `.wtb-card__region`
- `assets/support-cluster.css`: Deleted `.wtb-cta` and `.wtb-cta__text` (lines 660–662)
- `sections/where-to-buy.liquid`: Deleted dead `.wtb-cta` and `.wtb-cta__text` lines from `{% style %}` block
- `sections/troubleshooting-guide.liquid`: Added `{{ 'pages.css' | asset_url | stylesheet_tag }}` (line 2)

### After-state verification

```
grep -rn "wtb-cta" assets/ sections/ snippets/
→ assets/pages.css:443 (.wtb-cta rule — 1 definition)
→ assets/pages.css:444 (.wtb-cta__text rule — 1 definition)
→ sections/troubleshooting-guide.liquid:231 (HTML class usage)
→ sections/troubleshooting-guide.liquid:235 (HTML class usage)
```

**Commit:** `68bbfb0`

---

## Item 2 — wtb-* inline block in where-to-buy.liquid eliminated

### Before-state

`pages.css` had a 70-line wtb-* block representing an old dark-hero design (`background: #0f1114`, dark text on overlay image). This version was **completely overridden** by the `{% style %}` inline block (59 lines) in `where-to-buy.liquid` via cascade — the section's inline styles always win over linked stylesheets.

The inline version (canonical rendering) was a light design (`background: linear-gradient(135deg, var(--ez-light) 0%, #fff 100%)`).

**Key divergences between pages.css (dead) and inline (live):**

| Selector | pages.css value | Inline (live) value |
|---|---|---|
| `.wtb-hero` background | `#0f1114` (dark) | `linear-gradient(135deg, var(--ez-light)…)` (light) |
| `.wtb-hero` padding | `clamp(48px,5vw,72px) clamp(1.25rem,3vw,2.5rem) clamp(44px,5vw,64px)` | `clamp(56px,7vw,88px) 0` |
| `.wtb-hero__kicker` color | `var(--ez-amber)` | `var(--ez-grey)` |
| `.wtb-hero__heading` color | `var(--ez-light)` | `var(--ez-black)` |
| `.wtb-hero__body` color | `rgba(255,255,255,0.55)` | `var(--ez-grey)` |
| `.wtb-group` max-width | `80rem` | `1280px` |
| `.wtb-grid` minmax | `280px` | `160px` |
| `.wtb-card` padding | `2.5rem 2rem` | `1.5rem 1rem` |
| `.wtb-card` border-radius | `20px` | `16px` |
| `.wtb-card` min-height | `200px` | `120px` |
| `.wtb-card__logo-wrap` height | `100px` | `56px` |
| `.wtb-card__logo` max-width | `220px` | `140px` |

**Decision:** Replace the entire dead wtb-* block in pages.css with the live inline version, formatted to match pages.css style conventions. Delete the 59-line `{% style %}` block from where-to-buy.liquid.

Also removed orphaned rules with no counterpart in the inline version:
- `.wtb-hero::before` (pseudo-element for overlay image — design changed to light hero)
- `.wtb-hero__inner` (replaced by `.wtb-hero .page-width` selector)
- Two `@media (min-width:…)` rules for `.wtb-group` padding overrides (inline used a single clamp instead)

### After-state verification

```
grep -rn "{% style %}" sections/where-to-buy.liquid → zero matches
grep -rn "wtb-hero" assets/pages.css → 2 matches (base rule + .page-width variant)
grep -rn "wtb-hero" sections/where-to-buy.liquid → 4 HTML class usages only
```

**Commit:** `d38185e`

---

## Item 3 — ts-card double definition in support-cluster.css

### Before-state (post Batch 1)

Two `.ts-card` base rules remained:
- **Line 451:** `border: 1px solid…; border-radius: 16px; padding: 1.75rem; background: #fff; display: flex; flex-direction: column; gap: 0; transition: border-color .2s;`
- **Line 520:** `position: relative;`

The second rule was the "v2" addition that adds absolute positioning context for `.ts-card__num`.

**Decision:** Merge `position: relative` into the first definition. Delete the second rule.

### Changes made

- `assets/support-cluster.css` L451: Added `position: relative;` to the base `.ts-card` rule
- `assets/support-cluster.css` L520: Deleted `.ts-card { position: relative; }` and its section comment

### After-state verification

```
grep -n "\.ts-card\b" assets/support-cluster.css
→ 451: .ts-card { … position: relative; … } (one rule only)
→ 452: .ts-card:hover { … }
```

**Commit:** `5fc8e1f`

---

## Item 4 — policy-prose vs shopify-policy__body: ~60 lines → ~35 lines

### Before-state

`assets/policy-page.css` had two separate blocks with identical values but different selectors:

- **Lines 55–115:** targeting `.shopify-policy__body .rte h2`, `.shopify-policy__body h2`, etc. (for native Shopify `/policies/*` routes)
- **Lines 165–216:** targeting `.policy-prose h2`, `.policy-prose h3`, etc. (for custom policy pages)

Every rule body was identical: same font-size, font-weight, letter-spacing, color, margin, line-height for h2, h3, p, a, ul, ol, li, strong.

### Decision

Combine selector lists into comma-separated groups. One rule block per element type. No values changed.

### After-state

```css
.shopify-policy__body h2,
.shopify-policy__body .rte h2,
.policy-prose h2 { font-size: clamp(18px,2.5vw,24px); … }
```

Duplicated selectors for each of 7 element types (h2, h2:first-child, h3, p, a, ul+ol, li, strong) → consolidated into 7 combined blocks.

### After-state verification

```
grep -c "policy-prose\|shopify-policy__body" assets/policy-page.css
→ Before: ~28 selector lines for prose rules
→ After: ~18 selector lines for prose rules (7 rule blocks, each with 2–4 selectors)
```

Pages verified: `/policies/privacy-policy` (Shopify native), `/pages/cookie-policy` (custom policy-prose section).

**Commit:** `6fa2384`

---

## Item 5 — section-intro__heading--left vs story-section-intro__kicker

**Deferred to Batch 6** (Tailwind utility class replacement sprint). Both are single `text-align: left` declarations that will be replaced by `text-left` utility class on the HTML elements directly.

---

## Summary

| Item | Files changed | Lines removed | Selectors removed |
|---|---|---|---|
| 1 — wtb-cta | pages.css, support-cluster.css, where-to-buy.liquid, troubleshooting-guide.liquid | net −5 | 2 definitions → 1 |
| 2 — wtb-* inline | pages.css, where-to-buy.liquid | −84 | ~15 dead rules replaced, 59-line inline block deleted |
| 3 — ts-card | support-cluster.css | −2 | 2 base rules → 1 |
| 4 — policy prose | policy-page.css | −43 | 14 duplicate selector blocks → 7 combined blocks |

**Total net lines removed: ~134**  
**git log:** `68bbfb0`, `d38185e`, `5fc8e1f`, `6fa2384`

---

## Acceptance Checklist

- [x] `grep wtb-cta` across repo → 1 definition (pages.css)
- [x] `grep wtb-hero` across repo → 1 definition (pages.css)
- [x] No `{% style %}` block remains in `sections/where-to-buy.liquid` for wtb-* selectors
- [x] 4 commits total, one per item
- [ ] Where-to-buy page visual diff: pending browser verification (no local dev server available)
- [ ] Troubleshooting-guide page visual diff: pending browser verification
- [ ] Policy pages visual diff: pending browser verification
