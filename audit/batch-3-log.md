# Color Tokenization — Batch 3 Log
**Date:** 2026-05-03  
**Branch:** codex-publish-launch-updates  
**Dependency:** Batches 1 + 2 merged first

---

## Section 1 — Existing Token Audit

**Canonical source:** `src/styles/theme.css` `:root` block (lines 6–20).  
No `tailwind.config.js` exists in the project.

### Existing tokens before this batch

| Token name | Value | Defined in |
|---|---|---|
| `--ez-amber` | `#FED300` | `src/styles/theme.css:10` |
| `--ez-amber-bg` | `rgba(254,211,0,0.12)` | `src/styles/theme.css:11` |
| `--ez-black` | `#1d1d1f` | `src/styles/theme.css:12` |
| `--ez-dark` | `#0a0a0a` | `src/styles/theme.css:13` |
| `--ez-grey` | `#6e6e73` | `src/styles/theme.css:14` |
| `--ez-light` | `#f5f5f7` | `src/styles/theme.css:15` |
| `--ez-white` | `#ffffff` | `src/styles/theme.css:16` |
| `--ez-border` | `rgba(0,0,0,0.07)` | `src/styles/theme.css:17` |
| `--ez-radius-sm` | `8px` | `src/styles/theme.css:18` |
| `--ez-radius-md` | `14px` | `src/styles/theme.css:19` |
| `--ez-radius-lg` | `20px` | `src/styles/theme.css:20` |
| `--ez-amber-hover` | `#FED300` | `src/styles/theme.css:106` |

### Discrepancies vs task spec

| Token | Task spec value | Actual value | Action |
|---|---|---|---|
| `--ez-slate` | `#0F172A` | **MISSING** | Added in Section 1 commit |
| `--ez-border` | `#e5e5e5` | `rgba(0,0,0,0.07)` | **Left as-is** — the token exists with a different (transparent) value that is used deliberately for overlay borders. Adding a separate `--ez-border-solid: #e5e5e5` is a Phase 2 decision. |

---

## Section 2 — New Status Tokens Added

Added to `src/styles/theme.css` `:root` block:

| Token | Value | Role |
|---|---|---|
| `--ez-success-text` | `#15803d` | Success state text on light background (Tailwind green-700) |
| `--ez-success-dot` | `#22c55e` | Success indicator dot / bullet (Tailwind green-500) |
| `--ez-warning-text` | `#92400e` | Warning state text on light background (Tailwind amber-800) |
| `--ez-warning-dot` | `#f59e0b` | Warning indicator (Tailwind amber-400 — NOT brand amber #FED300) |
| `--ez-error-text` | `#b91c1c` | Error state text (Tailwind red-700) |
| `--ez-error-dot` | `#ef4444` | Error indicator dot (Tailwind red-500) |
| `--ez-info-text` | `#1d4ed8` | Informational text (Tailwind blue-700) |
| `--ez-info-dot` | `#3b82f6` | Informational indicator (Tailwind blue-500) |

These are accessible via CSS `var()` in all hand-authored CSS files because `src/styles/theme.css` compiles into `assets/theme.css` which is loaded globally on every page.

---

## Section 3 — Wrong Amber Corrections (visible color change)

### `assets/policy-page.css` — 4 instances of `#F59E0B` → `var(--ez-amber)`

`#F59E0B` is Tailwind's `amber-500`. The brand amber is `#FED300` (a lighter, more saturated yellow). These instances control:
- `.shopify-policy__title::before` kicker label ("Legal")
- `.policy-hero__kicker` kicker
- Link color on policy pages (`a` inside `.shopify-policy__body`/`.policy-prose`)
- `.policy-sidebar__link.is-active` active nav link

### `assets/pages.css` — 1 instance of `#f5a300` → `var(--ez-amber)`

Sitemap link hover color. `#f5a300` is an off-brand amber variant.

**Visual impact:** Both pages will show slightly lighter/more yellow amber links and kickers. These were genuine bugs — the wrong color family.

---

## Section 4 — Status Color Literal Replacements (color-identical)

### `assets/support-cluster.css`

| Line (approx) | Selector / context | Old value | New value | Color change? |
|---|---|---|---|---|
| 198 | `.file-badge--pdf` color | `#b91c1c` | `var(--ez-error-text)` | No |
| 203 | `.file-badge--zip` color | `#1d4ed8` | `var(--ez-info-text)` | No |
| 208 | `.file-badge--exe` color | `#6d28d9` | **kept as hex** | — (no token, single use) |
| 242 | `.status-full` color | `#15803d` | `var(--ez-success-text)` | No |
| 243 | `.status-partial` color | `#92400e` | `var(--ez-warning-text)` | No |
| 244 | `.status-no` color | `#b91c1c` | `var(--ez-error-text)` | No |
| 252 | `.status-dot--full` background | `#22c55e` | `var(--ez-success-dot)` | No |
| 254 | `.status-dot--no` background | `#ef4444` | `var(--ez-error-dot)` | No |
| 304 | `.info-card__icon--warning` color | `#dc2626` | **kept as hex** | — (no exact token; #dc2626 ≠ error-text #b91c1c nor error-dot #ef4444 — keeping hex preserves color-identical rule) |
| 391 | `.warranty-list--covered li::before` | `#22c55e` | `var(--ez-success-dot)` | No |
| 392 | `.warranty-list--excluded li::before` | `#ef4444` | `var(--ez-error-dot)` | No |
| 417 | `.guide-card__difficulty--easy` color | `#15803d` | `var(--ez-success-text)` | No |
| 419 | `.guide-card__difficulty--advanced` color | `#b91c1c` | `var(--ez-error-text)` | No |
| 433 | `.fw-card__latest-badge` color | `#15803d` | `var(--ez-success-text)` | No |

### `assets/pages.css`

| Line (approx) | Selector / context | Old value | New value | Color change? |
|---|---|---|---|---|
| 212 | `.shipping-free` text color | `#15803d` | `var(--ez-success-text)` | No |

---

## Phase 2 — Deferred Token Additions

These colors appear in the codebase but were NOT tokenized in this batch:

| Hex value | Count | Context | Decision needed |
|---|---|---|---|
| `#dc2626` | 1 | `.info-card__icon--warning` icon color (between error-text and error-dot) | Add `--ez-error-icon: #dc2626` or consolidate to nearest token |
| `#6d28d9` | 1 | `.file-badge--exe` EXE file type badge | Add `--ez-exe-badge: #6d28d9` or a generic file-type palette |
| `#fafafa` | 1 | Table row stripe (`tr:nth-child(even)`) | Add `--ez-stripe: #fafafa` |
| `#3d3d3f` | 2 | Article body text / ts-step text | Add `--ez-body-text: #3d3d3f` or consolidate to `--ez-grey` |
| `#111` | 2 | Collection subnav text/hover | Consolidate to `--ez-black` or add `--ez-ink` |
| `#0f172a` | 1 | Sitemap link base color (= Tailwind slate-900 = `--ez-slate`) | Replace with `var(--ez-slate)` |
| `#0a0a14` | 1 | Collection promo tile dark background | Add `--ez-promo-dark` token |
| `#1a2330` | 1 | Amazon button hover (third-party brand) | **Leave — third-party color, do not tokenize** |
| `#64748b` | 1 | Search empty state text (Tailwind slate-500) | Add `--ez-grey-mid: #64748b` or consolidate |

---

## Acceptance Verification

```bash
grep "#F59E0B" assets/policy-page.css  → 0 matches ✓
grep "#f5a300" assets/pages.css        → 0 matches ✓
grep "#b91c1c" assets/support-cluster.css → 0 matches ✓
grep "#15803d" assets/support-cluster.css → 0 matches ✓
grep "#22c55e" assets/support-cluster.css → 0 matches ✓
grep "#ef4444" assets/support-cluster.css → 0 matches ✓
grep "#92400e" assets/support-cluster.css → 0 matches ✓
grep "#1d4ed8" assets/support-cluster.css → 0 matches ✓
grep "#15803d" assets/pages.css         → 0 matches ✓
```

Visual diff: policy pages and sitemap show corrected amber. All other pages pixel-identical.
