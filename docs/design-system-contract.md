# EZQuest Design System Contract

This document locks the authored theme rules that keep EZQuest coherent and maintainable.

## 1. Core system principles

- Reuse existing layout and component families before creating new ones.
- Prefer strengthening hierarchy, spacing, and composition over adding new UI.
- Keep the system calm, premium, engineered, and readable.
- Use the token layer in [theme.css](/Applications/MAMP/htdocs/EZQuest/src/styles/theme.css) as the foundation for authored styling.

## 2. Spacing rules

- Use the established section rhythm through:
  - `.section-shell`
  - `.container-shell`
  - `.section-intro`
  - `.content-flow`
- Reuse existing card and panel padding patterns before introducing a new one.
- Maintain consistent vertical breathing between:
  - intro
  - content
  - footer/action zones
- Do not add one-off spacing purely to patch a single screen if an existing shell or card pattern can solve it.

## 3. Typography rules

- Use the shared typographic classes first:
  - `.section-heading`
  - `.section-copy`
  - `.section-kicker`
  - `.card-title`
- Use the defined tracking and line-height token system in `:root`.
- Keep headings declarative and readable.
- Avoid over-stacking multiple strong text styles in the same card or panel.

## 4. Motion rules

- Use the shared motion timing tokens:
  - `--motion-duration-fast`
  - `--motion-duration-base`
  - `--motion-duration-medium`
  - `--motion-duration-slow`
  - `--motion-ease-standard`
- Hover and reveal behavior should stay subtle and consistent.
- Motion should support scan quality and perceived polish, not create spectacle.

## 5. Card and panel rules

- Reuse existing shared surface families:
  - `.card-shell`
  - `.feature-card`
  - `.info-card`
  - `.support-link-card`
  - `.resource-card`
  - `.compatibility-card`
  - `.compare-card`
  - `.search-result-card`
- Do not create duplicate card systems that only differ by minor padding or border changes.
- Every card should have one clear focal point.
- Footer/action zones should read cleanly:
  - price
  - next action
  - optional supporting meta

## 6. Component reuse rules

- Reuse the existing hero families:
  - homepage hero
  - page hero
  - support hero variant
- Reuse shared snippets for:
  - buttons
  - pricing
  - cards
  - compare cells
  - support resources
  - owned visual fallbacks
- If a new visual need appears, prefer extending an existing snippet or class over creating a new pattern family.

## 7. CSS governance rules

These rules are enforceable and non-optional.

### Required

- No arbitrary Tailwind values in authored source
- No inline styles in Liquid templates or sections
- No duplicate multi-rule CSS blocks when shared classes can be extracted
- No shadow, radius, spacing, or motion drift away from the token system without a clear reason
- No dead or conflicting style paths that fight the active design system

### Preferred implementation pattern

1. Use existing utility composition or component class
2. Reuse or extend tokenized CSS
3. Add a new class only when the need is real and repeatable

## 8. Asset rules

- Use local/theme-controlled assets only for interim branded imagery
- Do not use remote runtime imagery for core brand/product/support surfaces
- Replace placeholders in priority order rather than mixing weak and strong asset strategies randomly

## 9. Truth and content rules

- No fake business data
- No fake trust badges
- No dead `#` links on live surfaces
- No copy that conflicts with structured product/support data

## 10. Release gate

Before shipping a visual change:

1. `npm run build`
2. `npm run check`
3. confirm changed files contain no arbitrary Tailwind values
4. confirm changed files contain no inline styles
5. confirm touched routes still align with the source-of-truth contract
