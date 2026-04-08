# AGENTS.md

## Project
EZQuest is a custom Shopify Online Store 2.0 theme.

## Stack
- Shopify CLI
- Liquid, JSON templates, sections, and snippets
- Tailwind CSS + PostCSS for stylesheet compilation
- Lightweight native JavaScript only when needed

## Working Rules
- Treat this repository as a Shopify theme first; keep templates section-driven and avoid unnecessary app-like abstractions.
- Prefer minimal, surgical edits that match existing Liquid, JSON, CSS, and JavaScript patterns.
- Do not introduce heavy frontend frameworks or extra build tools unless explicitly requested.
- Keep templates thin and move reusable view logic into sections or snippets when appropriate.
- Preserve Shopify-native constructs such as section groups, templates, locales, and policy pages.

## Development Workflow
- Do not use MAMP to serve this project.
- Use Shopify CLI as the source of truth for preview, syncing, and validation.
- Expected preview URL: `http://127.0.0.1:9292`
- Primary commands:
  - `npm run dev` — Tailwind watch + Shopify theme dev
  - `npm run dev:css` — compile/watch `src/styles/theme.css` to `assets/theme.css`
  - `npm run dev:theme` — prepare preview and run `shopify theme dev`
  - `npm run build` — production CSS build
  - `npm run check` / `npm run lint` — Theme Check

## File Guidance
- `assets/`: compiled theme assets and static files
- `layout/`: global layout files
- `sections/`: primary page building blocks
- `snippets/`: reusable partials
- `templates/`: JSON and Liquid template entry points
- `src/`: source files used for compiled assets
- `docs/`: implementation notes and handoff documentation
- `scripts/`: local automation and Shopify admin tooling

## Editing Guidance
- Keep Tailwind source edits in `src/styles/` and let builds update compiled CSS in `assets/`.
- Avoid manual edits to generated output when the source file is the real point of change.
- When changing storefront structure, check whether the work belongs in a section, snippet, template, or config before editing.
- Maintain semantic Liquid markup and preserve existing merchant-configurable schema patterns.
- Avoid unrelated refactors.
- Follow the global frontend architecture rule in [docs/frontend-architecture.md](./docs/frontend-architecture.md).
- Default to Tailwind utilities in Liquid for local layout, spacing, alignment, width, ordering, visibility, and responsive composition.
- Keep shared CSS focused on tokens, typography primitives, buttons, cards, surfaces, shadows, radius, motion, and reusable interaction states.
- Do not use inline `style=""`.
- Do not use arbitrary Tailwind values.
- Do not keep duplicate layout logic in both Liquid utilities and shared CSS for the same component.
- When a component is refactored to the hybrid pattern, remove dead CSS tied to the replaced layout logic.

## Validation
- Prefer targeted validation first, then broader checks if needed.
- For theme changes, use `npm run check` when practical.
- If CSS source changes, run the relevant build/watch command before finalizing.

## Environment Notes
- Node.js `>=20.10.0`
- `shopify.theme.toml` is local-only and must not be committed.
- `shopify.theme.toml.example` is the committed reference file.
- `.env.local` may contain local overrides, but should not redefine the standard project workflow.
