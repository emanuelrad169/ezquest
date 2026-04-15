# Frontend Architecture

## Purpose
This document defines the global frontend implementation rule for the EZQuest theme.

The theme uses a hybrid system:
- Tailwind utilities in Liquid for local layout and responsive composition
- Shared CSS in `src/styles/theme.css` for design-system primitives and reusable visual behavior

This is the default rule for all future frontend work unless a more specific system document explicitly overrides it.

## Global Rule

### Use Tailwind In Liquid For
Use Tailwind utility classes directly in Liquid markup for component-local structure:

- layout
- flex and grid behavior
- spacing
- alignment
- width and max-width
- ordering
- visibility
- local responsive behavior
- local composition

Good examples:
- header row structure
- section shell composition
- hero copy column width and placement
- card footer alignment
- breakpoint-only ordering or visibility

### Keep In Shared CSS Only
Keep shared visual primitives and reusable system logic in `src/styles/theme.css`:

- color tokens
- typography primitives
- shared button styles
- shared card styles
- shared panel and surface styles
- radius
- shadows
- motion tokens
- easing
- reusable interaction states
- reusable component classes

Good examples:
- `.button-primary`
- `.site-header-icon-button`
- `.product-card-tile`
- `.compare-card`
- shared hover/focus states
- sticky state transitions
- hero media overlays

## Hard Rules

### Do
- Prefer Tailwind utilities in Liquid when changing local layout or responsive composition.
- Keep reusable visual language centralized in shared CSS.
- Remove replaced legacy CSS when a component moves to markup-driven layout.
- Keep one clear source of truth per component concern.
- Keep authored style changes in `src/styles/` and build into `assets/theme.css`.

### Do Not
- Do not use inline `style=""`.
- Do not use arbitrary Tailwind values.
- Do not duplicate layout logic in both Liquid utilities and CSS selectors.
- Do not leave dead CSS behind after refactoring.
- Do not split the same component between two competing layout systems.
- Do not move shared primitives into markup just because a component is being edited.

## Decision Rule
When editing a component, use this simple test:

1. Is this change about local placement, spacing, grid/flex structure, width, ordering, or breakpoint behavior?
   - Put it in Liquid with Tailwind utilities.
2. Is this change about brand styling, reusable surfaces, tokens, buttons, cards, motion, or a cross-component state?
   - Keep it in shared CSS.

If both are true:
- put structure in Liquid
- keep reusable styling in shared CSS

## Component Standard
Every new or updated component must:

- follow this hybrid rule
- prefer Tailwind in Liquid for layout
- keep styling consistent with the existing design system
- remove legacy CSS if the component’s old layout logic was replaced

## Phase 6 Enforcement Lock (Final)

This project is now locked to a **≥90% Tailwind-in-Liquid** standard for all component-local styling. This was established after a complete Phase 1–6 migration audit and is the enforced baseline for all future work.

### What This Means
- Any new section or snippet must use Tailwind utilities in Liquid for layout, spacing, alignment, grid/flex composition, responsive visibility, and max-width.
- Shared CSS (`src/styles/theme.css`) is reserved exclusively for design-system primitives: tokens, custom shadows, card surfaces with custom `box-shadow`/`border-radius`, typography with `clamp()` or `letter-spacing` values not covered by standard Tailwind, fractional grid columns, CSS-variable-dependent properties (e.g. `top: calc(var(--header-height) + 1.5rem)`), and pseudo-element / focus / motion rules.
- Verify alignment on every PR: no new CSS-backed local layout classes should be introduced without documenting a justification in this file.

## Current Theme Audit

### Fully Aligned (Phases 1–6)
All sections and snippets below have been migrated to the Tailwind-in-Liquid hybrid pattern. Orphaned CSS was removed after each migration.

- `sections/announcement-bar.liquid`
- `sections/hero-home.liquid`
- `sections/home-feature-banner.liquid`
- `sections/home-confidence-grid.liquid`
- `sections/resources-featured.liquid`
- `sections/article-feed.liquid`
- `sections/support-nav-grid.liquid`
- `sections/main-collection.liquid`
- `sections/main-blog.liquid` *(Phase 6)*
- `sections/main-article.liquid` *(Phase 6)*
- `sections/main-product.liquid` *(buybox: brand, title, reviews, options, variants, quantity — Phase 5)*
- `snippets/mega-menu-stage-card.liquid`
- `snippets/search-mega-panel.liquid`
- `snippets/mobile-nav-drawer.liquid`
- `snippets/card-product.liquid`
- `snippets/compare-cell.liquid`
- `snippets/site-header.liquid`

### Justified Shared CSS — Still In Use
These CSS classes remain in `src/styles/theme.css` and are intentionally kept there. Each has a documented reason why it cannot move to standard Tailwind utilities.

| Class | File | Reason |
|---|---|---|
| `.article-header-shell` | `main-article.liquid` | Fractional grid column `1fr 0.52fr` |
| `.article-header-panel` | `main-article.liquid` | `top: calc(var(--header-height) + 1.5rem)` |
| `.article-continuation-label` | `main-article.liquid` | `letter-spacing: 0.18em` (no standard Tailwind equiv) |
| `.blog-lead-shell` | `main-blog.liquid` | Fractional grid column `1.12fr 0.88fr` |
| `.blog-lead-card` | `main-blog.liquid` | Custom `box-shadow`, `border-radius: 2rem`, transition |
| `.blog-lead-image` | `main-blog.liquid` | Custom `transition: 0.4s ease`, `aspect-ratio: 16/10`, parent-hover scale |
| `.blog-lead-title` | `main-blog.liquid` | `font-size: 2rem/2.45rem` (non-standard scale), `letter-spacing: -0.04em` |
| `.blog-stack-card` | `main-blog.liquid` | Custom `box-shadow`, `border-radius: 1.75rem`, transition |
| `.product-highlight-card` | `main-product.liquid` | Complex multi-property card surface |
| `.product-sticky-atc` | `main-product.liquid` | Sticky bar with CSS-var-dependent offset |
| `.product-trust-grid` | `main-product.liquid` | Grid with custom column distribution |
| `.product-share-row` | `main-product.liquid` | Complex flex with custom gap and state |

### Remaining Migration Candidates (Low Priority)
These sections have component-local CSS classes that could move to Tailwind in a future pass. They are not blockers.

- `sections/main-product.liquid`: `product-view-details-row`, `product-mobile-accordions`, `product-mobile-detail-stack`, `product-mobile-detail-copy`
- `sections/product-compare-table.liquid`: complex table column layout

## Recommended Next Steps

If a future pass continues migration:
1. Finish `main-product.liquid` remaining mobile accordion layout classes
2. Audit `product-compare-table.liquid` table composition
3. Run `npm run build && npm run check` after each batch

## Validation Rule
After any hybrid refactor:

- run `npm run build`
- run `npm run check`
- confirm no arbitrary Tailwind values were introduced
- confirm no inline styles were introduced
- confirm replaced CSS was removed when appropriate
