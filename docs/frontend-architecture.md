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

## Current Theme Audit

### Already Aligned With This Rule
These components are already using the hybrid direction well enough to be treated as the standard:

- `sections/announcement-bar.liquid`
- `snippets/site-header.liquid`
- `sections/hero-home.liquid`
- `assets/theme.js` header scroll-threshold behavior

Why:
- local structure and breakpoint behavior now live close to markup
- reusable visual states still live in shared CSS
- old duplicate layout CSS for those areas has already been reduced

### Not Yet Aligned
These components still rely too heavily on centralized CSS for local layout/composition and should move next:

- `snippets/mega-menu-panel.liquid`
- `snippets/search-mega-panel.liquid`
- `snippets/mega-menu-stage-card.liquid`
- `snippets/mobile-nav-drawer.liquid`
- `snippets/card-product.liquid`
- `snippets/compare-cell.liquid`
- `sections/main-product.liquid`
- `sections/product-compare-table.liquid`

Likely broader next-wave candidates after those:

- collection hero and toolbar surfaces
- support hub and support resource sections
- featured product carousel composition
- search result layout

## Recommended Refactor Order

1. Mega nav and search panel internals
2. Product cards
3. PDP layout
4. Compare layout
5. Collection and search result layouts
6. Support section layouts

## Validation Rule
After any hybrid refactor:

- run `npm run build`
- run `npm run check`
- confirm no arbitrary Tailwind values were introduced
- confirm no inline styles were introduced
- confirm replaced CSS was removed when appropriate
