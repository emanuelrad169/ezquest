# Batch 7 — Support-Cluster Tailwind Migration Log

## Pass 0 — Preparatory Setup

---

### 1. Amber Opacity Handling — Test Result: FAIL → Option 2 Tokens Added

**Test performed**: Safelisted `bg-[var(--ez-amber)]/10` and `border-[var(--ez-amber)]/25` in `tailwind.config.cjs`, ran full build, searched compiled `assets/theme.css` for generated output.

**Result**: Neither class appeared in compiled output. Tailwind v3 silently drops the class when an arbitrary color value is a CSS `var()` and the opacity modifier `/N` is used together.

**Why it fails**: Tailwind v3 generates `rgb(var(--ez-amber) / 0.1)` for this pattern. This is valid CSS syntax only when `--ez-amber` contains space-separated channel values (e.g. `254 211 0`). `--ez-amber: #FED300` is a hex string — `rgb(#FED300 / 0.1)` is invalid CSS and the browser cannot parse it. The project's channel-format tokens (`--color-ink: 15 23 42`) do support this pattern, but EZQuest brand tokens use hex strings.

**Migration pattern for amber**: Use `bg-[var(--ez-amber-08)]`, `border-[var(--ez-amber-25)]`, etc. (full rgba token, no opacity modifier).

**Tokens added** to `src/styles/theme.css` `:root`:
```css
--ez-amber-04: rgba(254,211,0,0.04);
--ez-amber-05: rgba(254,211,0,0.05);
--ez-amber-08: rgba(254,211,0,0.08);
--ez-amber-10: rgba(254,211,0,0.10);
--ez-amber-18: rgba(254,211,0,0.18);
--ez-amber-20: rgba(254,211,0,0.20);
--ez-amber-25: rgba(254,211,0,0.25);
--ez-amber-30: rgba(254,211,0,0.30);
--ez-amber-35: rgba(254,211,0,0.35);
```

**Error/Black/Green/Red tokens: NOT added — use named Tailwind colors instead.**

Secondary test: Safelisted `bg-black/[7%]`, `border-black/[7%]`, `bg-red-600/[7%]`. All three generated correctly:
- `bg-black/[7%]` → `background-color: rgb(0 0 0/7%)` ✓
- `border-black/[7%]` → `border-color: rgb(0 0 0/7%)` ✓
- `bg-red-600/[7%]` → `background-color: rgb(220 38 38/7%)` ✓

Tailwind named colors (black, red-600, green-700, blue-600, etc.) work with `/[N%]` opacity modifiers because Tailwind can extract channels from hex at build time. **For all `rgba(0,0,0,…)`, `rgba(220,38,38,…)`, `rgba(21,128,61,…)`, `rgba(37,99,235,…)` values in support-cluster.css: use `black/[N%]`, `red-600/[N%]`, `green-700/[N%]`, `blue-600/[N%]` respectively.**

| rgba value | Tailwind pattern | Note |
|---|---|---|
| `rgba(0,0,0,0.07)` | `black/[7%]` | Most common border |
| `rgba(0,0,0,0.05)` | `black/[5%]` | Subtle row border |
| `rgba(0,0,0,0.06)` | `black/[6%]` | Section divider |
| `rgba(0,0,0,0.08)` | `black/[8%]` | Card border |
| `rgba(0,0,0,0.1)` | `black/10` | Standard opacity |
| `rgba(0,0,0,0.12)` | `black/[12%]` | Input border |
| `rgba(0,0,0,0.018)` | `black/[1.8%]` | Row hover |
| `rgba(0,0,0,0.2)` | `black/20` | Arrow color |
| `rgba(0,0,0,0.58)` | `black/[58%]` | Step number |
| `rgba(220,38,38,0.03)` | `red-600/[3%]` | Error bg subtle |
| `rgba(220,38,38,0.04)` | `red-600/[4%]` | Error bg |
| `rgba(220,38,38,0.07)` | `red-600/[7%]` | Badge bg |
| `rgba(220,38,38,0.08)` | `red-600/[8%]` | Icon bg |
| `rgba(220,38,38,0.2)` | `red-600/20` | Border |
| `rgba(220,38,38,0.25)` | `red-600/25` | Border strong |
| `rgba(21,128,61,0.07)` | `green-700/[7%]` | Guide difficulty |
| `rgba(21,128,61,0.08)` | `green-700/[8%]` | Badge bg |
| `rgba(21,128,61,0.2)` | `green-700/20` | Badge border |
| `rgba(37,99,235,0.07)` | `blue-600/[7%]` | File badge |
| `rgba(124,58,237,0.07)` | `violet-600/[7%]` | File badge exe |
| `rgba(239,68,68,0.03)` | `red-400/[3%]` | Info card warning |
| `rgba(239,68,68,0.08)` | `red-400/[8%]` | Icon bg |
| `rgba(239,68,68,0.2)` | `red-400/20` | Card border |
| `rgba(248,250,252,0.96/.72/.18)` | K-rule — stays in CSS | Hero gradient (3 stops) |

---

### 2. Custom Easing — `ease-overshoot` Added

Added to `tailwind.config.cjs` `theme.extend`:
```js
transitionTimingFunction: {
  overshoot: "cubic-bezier(.34,1.56,.64,1)"
}
```

**Verified**: Safelisted `ease-overshoot`, compiled, confirmed:
```css
.ease-overshoot { transition-timing-function: cubic-bezier(.34,1.56,.64,1) }
```

Used for: `.guide-card` hover transform (`transition: border-color .2s, transform .25s cubic-bezier(.34,1.56,.64,1)`).

---

### 3. Custom 900px Breakpoint — `lg-mid` Added

Added to `tailwind.config.cjs` `theme.extend`:
```js
screens: {
  "lg-mid": "900px"
}
```

**Verified**: Safelisted `max-lg-mid:grid-cols-1`, compiled, confirmed:
```css
@media not all and (min-width:900px) {
  .max-lg-mid\:grid-cols-1 { grid-template-columns: repeat(1,minmax(0,1fr)) }
}
```

**1px behavior note**: `max-lg-mid:` fires below 900px (not at exactly 900px). The original CSS uses `@media(max-width:900px)` which fires AT 900px. Difference is 1 device pixel — imperceptible. Passes use `max-lg-mid:` for all 900px breakpoints.

Breakpoints present in support-cluster.css that map to `max-lg-mid:`: `.warranty-layout`, `.shub-grid`, `.guide-grid`, `.ts-grid`, `.ts-resource-grid`, `.contact-layout`.

---

### 4. Breakpoint Normalization — 540/560/580 Cluster Decision

**Decision: treat all three as 560px, use `max-[560px]:` at each site.**

Inventory of the three breakpoints:
| Breakpoint | Selector | Usage |
|---|---|---|
| `max-width:540px` | `.shub-grid` | 3-col → 1-col |
| `max-width:560px` | `.guide-grid`, `.ts-resource-grid` | 3-col → 1-col |
| `max-width:580px` | `.contact-form__grid` | 2-col → 1-col |

Δ between 540 and 580 is 40px — under 2.5% of viewport width on a 375px phone (both fire at the same screen size in practice). Use `max-[560px]:` for all three. The single exception case: `.contact-form__grid` at 580px — if visual testing reveals a layout collision between 560px–580px, revert that single site to `max-[580px]:` and document as an exception.

**No CSS changes in Pass 0. This decision is applied in Pass 4 (responsive breakpoints).**

---

### 5. K-Rules (Stays-as-Custom-CSS) — Pre-classified

These selectors are pre-classified as **K** (keep in CSS file). Do not attempt to migrate in Passes 1–4.

**Pseudo-elements with `content:` or counter functions:**
| Selector | Reason |
|---|---|
| `.support-hero--has-image::after` | `content: ""`; gradient overlay pseudo-element |
| `.warranty-list--covered li::before` | `content: '✓'` with absolute positioning |
| `.warranty-list--excluded li::before` | `content: '×'` with absolute positioning |
| `.warranty-steps li::before` | `content: counter(ws)` — counter display |
| `.warranty-steps` | `counter-reset: ws` — counter setup |
| `.warranty-steps li` | `counter-increment: ws` — counter increment |
| `.ts-step::before` | `content: counter(step)` with absolute flex |
| `.ts-steps` | `counter-reset: step` |
| `.ts-step` | `counter-increment: step` |
| `.data-table td:before` | `content: attr(data-label)` — responsive label |
| `.fw-changelog__trigger::-webkit-details-marker` | Vendor pseudo-element |

**`font-family: inherit` — verify before migrating:**
| Selector | Reason |
|---|---|
| `.filter-pill` | Uses `font-family: inherit` — verify Tailwind's `font-sans` or absence of reset covers this before removing |

**Attribute/state combinators:**
| Selector | Reason |
|---|---|
| `.fw-changelog[open] .fw-changelog__icon` | Attribute selector `[open]` — no Tailwind equivalent |
| `.support-hero--has-image .support-hero__wrap` | Conditional descendant — no Tailwind equivalent |

**Parent-hover-affecting-child — verify `group` before classifying:**
| Selector | Decision |
|---|---|
| `.shub-card:hover .shub-card__arrow` | **Check markup for `group` class on `.shub-card`**. If present → `group-hover:`. If absent → K. |
| `.ts-resource-card:hover .ts-resource-card__arrow` | Same check on `.ts-resource-card` |
| `.guide-card:hover .guide-card__cta` | Same check on `.guide-card` |

Pass 1 begins with a grep for `class=".*shub-card"` etc. to make this determination.

---

### 6. Findings-Not-Fixes

These issues were observed during inventory. **Not Batch 7 work — recorded for future design review.**

**No-op hover effects:**
- `.btn-download:hover { background: #FED300 }` — sets background to `#FED300`, identical to the base `var(--ez-amber)` value. The hover state is visually identical to the resting state. No perceptible interaction feedback.
- `--ez-amber-hover: #FED300` token in `src/styles/theme.css` — defined as identical to `--ez-amber`. Exists as an alias with no actual hover value differentiation.

**Recommendation**: Design review needed. Either the hover state should use a visually distinct value (e.g., `#ECC200`, ~8% darker) or both the token and the hover rule should be removed to reduce dead weight. This is a design decision, not a CSS migration decision — defer to design/product.

---

### Changes Made in Pass 0

| File | Change |
|---|---|
| `src/styles/theme.css` | Added 9 `--ez-amber-NN` rgba tokens to `:root` |
| `tailwind.config.cjs` | Added `transitionTimingFunction.overshoot` and `screens.lg-mid` to `theme.extend` |
| `assets/theme.css` | Recompiled (amber tokens in `:root`, no utility bloat — tokens are CSS vars, not Tailwind classes) |

**Zero changes to `support-cluster.css`. Zero changes to any `.liquid` file.**

---

### Commit

`chore(css): batch-7 pass-0 setup — opacity tokens, custom easing, lg-mid breakpoint`

---

## Pass 1 — T-Rules Migration

**Scope**: All 1-3 property rules in `assets/support-cluster.css` where all properties are directly utility-mappable. Two-phase (Phase A: add utilities to markup; Phase B: delete CSS rule). One commit per CSS rule.

**Lines removed**: ~75 lines (625 remaining, down from ~700 before pass).

**Commits**: 43 commits.

---

### Step 0 — Group-Hover Resolution

All three parent elements confirmed absent of `group` class; no JS conflicts found. Option (a) applied to all three.

| Selector deleted | Markup file | Decision |
|---|---|---|
| `.shub-card:hover { background: var(--ez-light); }` | `sections/support-hub.liquid` | `group hover:bg-[var(--ez-light)]` on `<a>` |
| `.shub-card:hover .shub-card__arrow { ... }` | `sections/support-hub.liquid` | `group-hover:text-[var(--ez-amber)] group-hover:translate-x-[3px]` on `<svg>` |
| `.ts-resource-card:hover { border-color; box-shadow }` | `sections/troubleshooting-guide.liquid` (×3) | `hover:border-[var(--ez-amber-35)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]` on `<a>` |
| `.ts-resource-card:hover .ts-resource-card__arrow { ... }` | Same | `group-hover:text-[var(--ez-amber)] group-hover:translate-x-[3px]` on `<span>` |
| `.guide-card:hover { border-color; transform }` | `sections/user-guides-center.liquid` | `hover:border-[var(--ez-amber-30)] hover:-translate-y-0.5` on `<a>` |
| `.guide-card:hover .guide-card__cta { gap }` | Same | `group-hover:gap-2.5` on `<span>` |

---

### Group B — Status Indicators (6 commits)

| CSS rule deleted | Utility | Markup file |
|---|---|---|
| `.status-full { color: var(--ez-success-text); font-weight: 500; }` | `text-[var(--ez-success-text)] font-medium` | `sections/compatibility-table.liquid` ×2 |
| `.status-partial { color: var(--ez-warning-text); font-weight: 500; }` | `text-[var(--ez-warning-text)] font-medium` | Same ×2 |
| `.status-no { color: var(--ez-error-text); font-weight: 500; }` | `text-[var(--ez-error-text)] font-medium` | Same ×2 |
| `.status-dot--full { background: var(--ez-success-dot); }` | `bg-[var(--ez-success-dot)]` | Same ×2 |
| `.status-dot--partial { background: var(--ez-amber); }` | `bg-[var(--ez-amber)]` | Same ×2 |
| `.status-dot--no { background: var(--ez-error-dot); }` | `bg-[var(--ez-error-dot)]` | Same ×2 |

---

### Additional T-Rules (34 commits)

| CSS rule deleted | Utility | Markup file(s) |
|---|---|---|
| `.support-hero { position: relative; overflow: hidden; }` | `relative overflow-hidden` | 8 section files |
| `.support-hero__wrap { width: 100%; }` | `w-full` | 8 section files |
| `.support-hero__media { position: absolute; inset: 0; z-index: 0; }` | `absolute inset-0 z-0` | `support-hub.liquid` |
| `.support-hero__image { width: 100%; height: 100%; object-fit: cover; }` | `w-full h-full object-cover` | `support-hub.liquid` (image_tag class) |
| `.support-hero--has-image .support-hero__wrap { ... }` | **K-rule** | Conditional descendant — kept |
| `.support-nav__link:hover { color: var(--ez-black); }` | `hover:text-[var(--ez-black)]` | `snippets/support-nav.liquid` ×10 |
| `.support-nav__link.is-active { color; font-weight; border-bottom-color }` | `text-[var(--ez-black)] font-medium border-b-[var(--ez-amber)]` | `snippets/support-nav.liquid` ×10 (inside conditional) |
| `.support-body--hub { padding-top: clamp(28px,4vw,44px); }` | `pt-[clamp(28px,4vw,44px)]` | `support-hub.liquid` |
| `.support-body__content { padding-top: 0; }` | `pt-0` | `support-hub.liquid` |
| `.support-nav--contained { width: 100%; margin-bottom: 0; }` | `w-full mb-0` | `snippets/support-nav.liquid` (conditional) |
| `.support-hub__topic-label { margin-top: 3rem; }` | `mt-12` | `support-hub.liquid` |
| `.btn-download:hover { background: #FED300; }` | `hover:bg-[var(--ez-amber)]` | `download-center.liquid`, `firmware-center.liquid` ×2, `manuals-center.liquid` |
| `.info-card--amber { background; border-color; }` | `bg-[var(--ez-amber-04)] border-[var(--ez-amber-25)]` | `warranty-page.liquid`, `firmware-center.liquid` |
| `.info-card--warning { background; border-color; }` | **Dead rule** — no markup usage, deleted | — |
| `.data-table tbody tr:last-child { border-bottom: none; }` | `last:border-b-0` | `compatibility-table.liquid` ×2 loops |
| `.data-table tbody tr:hover { background: rgba(0,0,0,.018); }` | `hover:bg-black/[1.8%]` | Same |
| `.ts-card:hover { border-color: rgba(254,211,0,.25); }` | `hover:border-[var(--ez-amber-25)]` | `troubleshooting-guide.liquid` ×13 |
| `.ts-card__cta:hover { text-decoration-color: var(--ez-black); }` | `hover:decoration-[var(--ez-black)]` | Same ×13 |
| `.ts-escalation { ... }` | **Dead rule** — entire block unused in markup, deleted | — |
| `.ts-escalation__text { ... }` | Same | — |
| `.ts-escalation__link { ... }` | Same | — |
| `.ts-escalation__link:hover { ... }` | Same | — |
| `.ts-resource-card__body { flex: 1; }` | `flex-1` | `troubleshooting-guide.liquid` ×3 |
| `.fw-card:hover { border-color: rgba(254,211,0,.3); }` | `hover:border-[var(--ez-amber-30)]` | `firmware-center.liquid` |
| `.fw-card__header { margin-bottom: 1.25rem; }` | `mb-5` | `firmware-center.liquid` |
| `.fw-card__date { font-size: 13px; color: var(--ez-grey); margin: 0; }` | `text-[13px] text-[var(--ez-grey)] m-0` | `firmware-center.liquid` |
| `.fw-changelog__trigger:hover { color: var(--ez-black); }` | `hover:text-[var(--ez-black)]` | `firmware-center.liquid` |
| `.fw-changelog__icon { transition: transform .2s; flex-shrink: 0; }` | `transition-transform duration-200 shrink-0` | `firmware-center.liquid` |
| `.warranty-stat__label { font-size: 12px; color: var(--ez-grey); }` | `text-xs text-[var(--ez-grey)]` | `warranty-page.liquid` ×3 |
| `.guide-card__body { padding: 1.25rem; flex: 1; }` | `p-5 flex-1` | `user-guides-center.liquid` |
| `.guide-card__steps { font-size: 12px; color: var(--ez-grey); font-weight: 500; }` | `text-xs text-[var(--ez-grey)] font-medium` | `user-guides-center.liquid` |
| `.contact-channel__link:hover { color; text-decoration-color; }` | `hover:text-[var(--ez-black)] hover:decoration-[var(--ez-black)]` | `contact-form-panel.liquid` |
| `.contact-link-pill:hover { border-color; color; background; }` | `hover:border-[var(--ez-amber)] hover:text-[var(--ez-black)] hover:bg-[var(--ez-amber-05)]` | `contact-form-panel.liquid` ×5 |
| `.contact-form-card:hover { border-color; box-shadow; }` | `hover:border-[var(--ez-amber-25)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]` | `contact-form-panel.liquid` |
| `.contact-form { position: relative; z-index: 1; }` | `relative z-[1]` | `contact-form-panel.liquid` (Liquid `form` tag) |
| `.contact-form__field--full { grid-column: 1/-1; }` | `col-span-full` | `contact-form-panel.liquid` ×2 |
| `.contact-form__textarea { resize: vertical; min-height: 120px; }` | `resize-y min-h-[120px]` | `contact-form-panel.liquid` |
| `.contact-form__input:focus { border-color; box-shadow; }` | `focus:border-[var(--ez-amber)] focus:shadow-[0_0_0_3px_var(--ez-amber-10)]` | `contact-form-panel.liquid` ×4 inputs |
| `.contact-success { text-align: center; padding: 3rem 1.5rem; }` | `text-center py-12 px-6` | `contact-form-panel.liquid` |

---

### Deferred from Pass 1

| Rule | Reason |
|---|---|
| **Group C — file badges** (`.file-badge--pdf`, `--zip`, `--exe`) | Dynamic class generation `file-badge--{{ ext | downcase }}` — migration requires `{% case %}` markup restructuring. Defer to dedicated markup refactor pass. |
| **Group A — bg-white extractions** | M-rules with background as one property of many. Extract `bg-white` in Pass 2 property-extraction phase. |
| `.shub-card__arrow { color: rgba(0,0,0,.2); transition: color .15s, transform .15s; }` | 2-property but `transition` is complex (2 targets, `.15s` linear — doesn't map cleanly to Tailwind's `transition duration-150` which uses ease-in-out). Defer to Pass 2. |
| All M-rules (4+ properties) | `.support-nav`, `.support-nav__link`, `.support-body`, `.support-hub-nav`, `.filter-pills`, `.filter-pill`, `.data-table*`, `.file-badge`, `.btn-download`, `.product-pill`, `.status-dot`, `.section-label`, `.info-card*`, `.empty-state*`, `.shub-stats`, `.shub-stat`, `.shub-grid`, `.shub-card`, `.warranty-*`, `.guide-card*`, `.fw-card*`, `.ts-card*`, `.ts-steps`, `.ts-step`, `.ts-hero*`, `.ts-grid*`, `.contact-*` base rules | Pass 2. |

---

## Pass 2 — M-Rule Migration (4+ properties → Tailwind utilities)

**Scope**: All M-rules (4+ CSS properties) across `assets/support-cluster.css`. One commit per CSS rule.

**Approach**: Phase A (add utilities to Liquid markup) + Phase B (delete CSS rule) combined in each commit.

**Files modified**: `sections/support-hub.liquid`, `sections/user-guides-center.liquid`, `sections/firmware-center.liquid`, `sections/warranty-page.liquid`, `sections/troubleshooting-guide.liquid`, `sections/contact-form-panel.liquid`, `sections/download-center.liquid`, `sections/manuals-center.liquid`, `sections/compatibility-table.liquid`, `assets/support-cluster.css`

### Rules Migrated

| Rule | File | Commit |
|---|---|---|
| `.shub-stat` + `__number` + `__label` | support-hub | `61e2b47` |
| `.shub-grid` + `@media` blocks | support-hub | `478f655` |
| `.shub-card` | support-hub | `7e388a7` |
| `.shub-card__icon` | support-hub | `3eb7406` |
| `.shub-card__title` + `__desc` | support-hub | `5055d50` |
| `.guide-grid` + `@media` | user-guides-center | `b0979be` |
| `.guide-card` | user-guides-center | `7174ebe` |
| `.guide-card__image-wrap` | user-guides-center | `3714e24` |
| `.guide-card__image` | user-guides-center | `dba23ad` |
| `.guide-card__image-placeholder` | user-guides-center | `b8bf67c` |
| `.guide-card__type-pill` | user-guides-center | `e1aac3d` |
| `.guide-card__meta` | user-guides-center | `0b7dce4` |
| `.guide-card__difficulty` + variants | user-guides-center | `39ca423` |
| `.guide-card__title` | user-guides-center | `aeaa596` |
| `.guide-card__desc` | user-guides-center | `1792c9b` |
| `.guide-card__footer` | user-guides-center | `22be030` |
| `.guide-card__cta` | user-guides-center | `5706b0e` |
| `.fw-card` | firmware-center | `f456122` |
| `.fw-card__meta` | firmware-center | `358f58c` |
| `.fw-card__version` | firmware-center | `981f142` |
| `.fw-card__latest-badge` | firmware-center | `0901b8f` |
| `.fw-card__product` | firmware-center | `4daf2b7` |
| `.fw-card__actions` | firmware-center | `30ae923` |
| `.fw-changelog__trigger` | firmware-center | `79e217f` |
| `.fw-changelog__body` | firmware-center | `d6f548a` |
| `.contact-layout` + `@media` | contact-form-panel | `bbf69bf` |
| `.contact-channels` | contact-form-panel | `d46a30e` |
| `.contact-channel__icon` | contact-form-panel | `8bac4b1` |
| `.contact-channel__label` | contact-form-panel | `88c1515` |
| `.contact-channel__value` | contact-form-panel | `85400b9` |
| `.contact-channel__link` | contact-form-panel | `eeb9094` |
| `.contact-support-links__label` | contact-form-panel | `ef5c286` |
| `.contact-link-pill` | contact-form-panel | `70a70f9` |
| `.contact-form-card` | contact-form-panel | `9a07c6f` |
| `.contact-form-card__spotlight` | contact-form-panel | `fab49e4` |
| `.contact-form__grid` + `@media` | contact-form-panel | `726960d` |
| `.contact-form__field` | contact-form-panel | `11e746c` |
| `.contact-form__label` | contact-form-panel | `56bdc9c` |
| `.contact-form__input` | contact-form-panel | `3b34ccf` |
| `.contact-form__submit` | contact-form-panel | `865ed95` |
| `.contact-form__note` | contact-form-panel | `d7d34df` |
| `.contact-success__icon` | contact-form-panel | `f7eccae` |
| `.contact-success__heading` | contact-form-panel | `82b515a` |
| `.contact-errors` | contact-form-panel | `f46d3e7` |
| `.warranty-layout` + `@media` | warranty-page | `db944a3` |
| `.warranty-stat-row` | warranty-page | `602c4f6` |
| `.warranty-stat` | warranty-page | `6ccb38f` |
| `.warranty-list` | warranty-page | `80e143c` |
| `.warranty-claim-card` | warranty-page | `7fced3c` |
| `.warranty-claim-card__icon` | warranty-page | `521576f` |
| `.warranty-claim-card__heading` | warranty-page | `e82d91e` |
| `.warranty-claim-card__body` | warranty-page | `643a3c4` |
| `.warranty-claim-card__note` | warranty-page | `7ee4150` |
| `.ts-grid` + `@media` | troubleshooting-guide | `9649a2b` |
| `.ts-card` | troubleshooting-guide | `b1c7680` |
| `.ts-hero` | troubleshooting-guide | `b679abd` |
| `.ts-hero__inner` | troubleshooting-guide | `7e25ce7` |
| `.ts-body` | troubleshooting-guide | `089db85` |
| `.ts-card__num` | troubleshooting-guide | `bb5c261` |
| `.ts-card__title` | troubleshooting-guide | `7482db0` |
| `.ts-card__copy` | troubleshooting-guide | `e67e99a` |
| `.ts-card__foot` | troubleshooting-guide | `577aaad` |
| `.ts-card__cta` | troubleshooting-guide | `489183f` |
| `.ts-resources` | troubleshooting-guide | `0a61594` |
| `.ts-resources__inner` | troubleshooting-guide | `13aafb2` |
| `.ts-resource-grid` + `@media` | troubleshooting-guide | `3ad315c` |
| `.ts-resource-card` | troubleshooting-guide | `933f771` |
| `.ts-resource-card__icon` | troubleshooting-guide | `d92a58d` |
| `.ts-resource-card__type` | troubleshooting-guide | `65bf74d` |
| `.ts-resource-card__title` | troubleshooting-guide | `2414ede` |
| `.ts-resource-card__desc` | troubleshooting-guide | `55bad6d` |
| `.ts-resource-card__arrow` | troubleshooting-guide | `9c2ccbe` |
| `.file-badge` + variants | download-center | `a68e8b5` |
| `.btn-download` | download-center, firmware-center, manuals-center | `c4803da` |
| `.product-pill` | download-center, compatibility-table | `6bbe8a2` |

### K-Rules Retained (permanent CSS — cannot be expressed as Tailwind utilities)

| Rule | Reason |
|---|---|
| `.support-hero--has-image .support-hero__wrap` | Conditional descendant: scoped to modifier class |
| `.support-hero--has-image::after` | Pseudo-element with `content:` |
| `.filter-pill` + `.filter-pill.is-active, .filter-pill:focus` | JS-toggled `.is-active` class — no Tailwind variant equivalent; whole group kept together |
| `.data-table thead th` / `tbody tr` / `td` | Descendant selectors on loop-generated table elements |
| `@media (max-width: 640px) .data-table td:before` | Responsive block with `content: attr(data-label)` pseudo-element |
| `.warranty-list li` | Descendant selector paired with K-rule `::before` |
| `.warranty-list--covered li::before` / `--excluded li::before` | Pseudo-elements with `content:` |
| `.warranty-steps` | Contains `counter-reset: ws` |
| `.warranty-steps li` + `li::before` | Counter increment + `content: counter(ws)` |
| `.fw-changelog__trigger::-webkit-details-marker` | Vendor pseudo-element |
| `.fw-changelog[open] .fw-changelog__icon` | `[open]` attribute selector |
| `.fw-changelog__body ul` / `li` | Descendant selectors on richtext-rendered HTML |
| `.ts-steps` | Contains `counter-reset: step` |
| `.ts-step` + `::before` | Counter increment + `content: counter(step)` |
| `.contact-form__input::placeholder` | Pseudo-element |

### Final CSS Size

`assets/support-cluster.css` reduced from ~625 lines to ~150 lines. All remaining rules are K-rules.
