# EZQuest Design Tokens

## Source of truth

All design tokens live in [`src/styles/tokens.css`](../src/styles/tokens.css).  
Do not define color, spacing, radius, or shadow values outside this file.  
New tokens require a named role before adding to the registry.

`tokens.css` is `@import`'d at the top of `src/styles/theme.css` via `postcss-import`, so it
is the first thing in the compiled `assets/theme.css` cascade.

---

## Build pipeline

```
src/styles/tokens.css   ← canonical declarations
       ↓  @import (postcss-import)
src/styles/theme.css    ← Tailwind directives + all component CSS
       ↓  tailwindcss --minify
assets/theme.css        ← shipped to Shopify
```

Run: `npm run build:css`

---

## Token categories

### Color — brand (4 tokens)
| Token | Value | Role |
|-------|-------|------|
| `--ez-brand-yellow` | `var(--ez-amber)` → `#FED300` | Primary CTA, accent |
| `--ez-brand-yellow-hover` | `#E6BD00` | Hover state |
| `--ez-brand-yellow-fg` | `#1D1D1F` | Text on yellow bg |
| `--ez-brand-dark` | `var(--ez-black)` → `#1D1D1F` | Secondary CTA bg |

### Color — text (6 tokens)
| Token | Value | Role |
|-------|-------|------|
| `--ez-text-primary` | `rgb(2, 6, 23)` | Headings, body |
| `--ez-text-secondary` | `rgb(71, 85, 105)` | Secondary body |
| `--ez-text-tertiary` | `rgb(100, 116, 139)` | Captions, hints |
| `--ez-text-link` | `rgb(2, 6, 23)` | Link color (underline distinguishes) |
| `--ez-text-on-dark-primary` | `rgba(255,255,255,0.92)` | Primary text on dark bg |
| `--ez-text-on-dark-secondary` | `rgba(255,255,255,0.55)` | Secondary text on dark bg |

### Color — surfaces (5 tokens)
| Token | Value | Role |
|-------|-------|------|
| `--ez-surface-default` | `rgb(255, 255, 255)` | Default page bg |
| `--ez-surface-soft` | `var(--ez-light)` → `#f5f5f7` | Soft section bg (Apple gray) |
| `--ez-surface-subtle` | `rgb(241, 245, 249)` | Subtle bg (slate-100) |
| `--ez-surface-dark` | `rgb(2, 6, 23)` | Dark sections |
| `--ez-surface-overlay` | `rgba(0,0,0,0.55)` | Modal scrim |

### Color — borders (3 tokens)
| Token | Value | Role |
|-------|-------|------|
| `--ez-border-default` | `rgb(229, 231, 235)` | Dominant border (gray-200) |
| `--ez-border-strong` | `rgb(203, 213, 225)` | Emphasized borders |
| `--ez-border-subtle` | `rgba(226,232,240,0.8)` | Soft card borders |

### Color — semantic (3 tokens)
`--ez-success`, `--ez-error`, `--ez-warning`

### Shadows (3 new tokens; sm/md/lg already aliased in theme.css)
| Token | Value |
|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-xl` | `0 18px 50px rgba(15,23,42,0.05)` |
| `--shadow-focus` | `0 0 0 3px rgba(254,211,0,0.40)` — yellow focus ring |

### Typography (6 tokens)
`--font-brand`, `--font-body`,  
`--font-weight-normal/medium/semibold/bold`

Size scale (`--text-xs` … `--text-7xl`) is defined in `theme.css`.

### Transitions (3 tokens)
`--transition-fast` (150ms), `--transition-default` (200ms), `--transition-slow` (300ms)

### Z-index scale (8 tokens)
`--z-base` (0) → `--z-raised` (10) → `--z-sticky` (50) → `--z-header` (60) →
`--z-dropdown` (100) → `--z-modal` (1000) → `--z-toast` (9000) → `--z-max` (9999)

---

## Tailwind utilities

New color utilities registered in `tailwind.config.cjs`:

```html
<!-- Brand -->
bg-ez-brand-yellow    text-ez-brand-yellow    border-ez-brand-yellow
bg-ez-brand-dark      text-ez-brand-dark

<!-- Text -->
text-ez-text-primary  text-ez-text-secondary  text-ez-text-tertiary

<!-- Surfaces -->
bg-ez-surface         bg-ez-surface-soft      bg-ez-surface-dark

<!-- Borders -->
border-ez-border      border-ez-border-strong border-ez-border-subtle

<!-- Shadows -->
shadow-xs   shadow-xl   shadow-focus
```

---

## Usage rules

1. Custom CSS must use `var(--ez-*)` references, never literal hex/rgb for these categories.
2. Tailwind utility classes are the preferred way to apply tokens in Liquid templates.
3. New components must use only tokens — PR review will reject components that introduce non-token values.

---

## Existing tokens (pre-foundation, defined in theme.css)

These were established before `tokens.css` and are NOT redefined here to avoid conflicts:

| Name | Value | Note |
|------|-------|------|
| `--ez-amber` | `#FED300` | Source for `--ez-brand-yellow` |
| `--ez-black` | `#1D1D1F` | Source for `--ez-brand-dark` |
| `--ez-light` | `#f5f5f7` | Source for `--ez-surface-soft` |
| `--radius-sm/md/lg/xl` | `0.95rem / 1.35rem / 1.75rem / 2rem` | Card-scale radii (rem-based) |
| `--shadow-sm/md/lg` | aliases to soft/medium/lift | Elevation aliases |
| `--space-1` … `--space-24` | `0.25rem` … `6rem` | 4px grid in rem |
| `--text-xs` … `--text-7xl` | `0.75rem` … `4.5rem` | Tailwind v4 type scale |
| `--motion-*` / `--duration-*` / `--ease-*` | various | Animation tokens |

---

## Migration status (2026-05-13)

- [x] `tokens.css` installed and `@import`'d
- [x] `postcss-import` added to build pipeline
- [x] `tailwind.config.cjs` wired with new utility classes
- [ ] Existing literal values migrated to token references (follow-up prompt per component)
- [ ] Radius system reconciled (existing rem-based scale vs. 4px/8px/16px/24px targets)
- [ ] Shadow system consolidated (18 values → 6 elevation tokens)

## Legacy values still in use

These will be addressed by component-level refactor prompts:

- `rgb(15, 23, 42)` — slate-900, used broadly; maps to `--ez-text-primary` directionally
- `rgba(255,255,255,0.N)` — multiple white-opacity variants; consolidate to `--ez-text-on-dark-*`
- Fractional radii (`19.2px`, `21.6px`, `23.2px`, `27.2px`) — component review needed
- `#aeaeb2` / `#6e6e73` — off-system grays, need placement in text-tertiary/secondary scale

## Adding a new token

1. Verify no existing token meets your need
2. Add to `src/styles/tokens.css` with naming: `--ez-{category}-{role}`
3. Update this doc
4. If used by 3+ components, wire as Tailwind utility in `tailwind.config.cjs`
5. Run `npm run build:css` and verify the compiled output
