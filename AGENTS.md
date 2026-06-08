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

## Storefront Image System
- Follow `brand/image-style.md` for all generated storefront visuals.
- Use the `shopify-image-system` Codex skill for image prompt, batch generation, naming, and QA work.
- Start from `prompts/templates/` instead of writing one-off image prompts.
- Keep generated images premium, calm, minimal, and consumer-tech focused: Apple Store + Xiaomi + Anker-inspired composition, airy whitespace, clear product families, white or very light gray backgrounds, soft natural light, premium realistic materials, and clear product hierarchy.
- Always reuse the previously approved generated visual style. Before making new image prompts, check existing `public/images/` assets and `.prompt.md` sidecars so new images feel like the same EZQuest campaign system.
- Do not render text inside generated images. Leave clean whitespace for Shopify/Liquid overlay copy.
- Avoid product packshots when the request is for storefront marketing, layout, contextual, support, or education imagery.
- Avoid clutter, random props, plants, keyboards, monitors unless explicitly requested by a lifestyle/support scene, dark dramatic backgrounds, catalog-style equal-weight product grids, and generic CGI.
- Desktop hero images need text-safe whitespace on the left and product storytelling on the right.
- Mobile hero images need text-safe whitespace on top and product storytelling lower in frame.
- Collection images should be centered, clean, category-readable, and product-family oriented without becoming catalog clutter.
- PDP support images should use closer crops that clarify one feature or usage scenario.
- Lifestyle context may use a light wood desk, but the environment must stay minimal and believable.
- Save the prompt source with every generated image and keep deterministic asset names.
- Use `scripts/generate-shopify-images.ts` for the complete non-product storefront image batch.

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
- `brand/`: brand rules, image direction, and reusable creative guidelines
- `layout/`: global layout files
- `prompts/`: reusable image prompt templates and generation manifests
- `sections/`: primary page building blocks
- `snippets/`: reusable partials
- `templates/`: JSON and Liquid template entry points
- `src/`: source files used for compiled assets
- `public/images/`: generated storefront image outputs and prompt sidecars
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
