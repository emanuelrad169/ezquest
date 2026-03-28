# EZQuest Shopify Theme

Custom Shopify Online Store 2.0 theme scaffold for EZQuest.

## Stack

- Shopify CLI
- Shopify Skeleton starter workflow
- Liquid, JSON templates, sections, snippets
- Tailwind CSS + PostCSS for stylesheet compilation only
- Lightweight native JavaScript only where interactions are justified

## Requirements

- Node.js `>=20.10.0`
- npm
- Shopify CLI
- Shopify development store access
- Local storefront password if `ezquest-3.myshopify.com` is password protected

## Local Development

Do NOT use MAMP to serve the theme. Shopify CLI is the source of truth for local preview and theme syncing.

The expected local preview URL is:

```text
http://127.0.0.1:9292
```

### One-time setup

```bash
npm install
cp shopify.theme.toml.example shopify.theme.toml
# if the storefront is password protected, replace PUT_STOREFRONT_PASSWORD_HERE
shopify auth login
```

## Scripts

- `npm run dev`: Tailwind watch + Shopify theme dev together
- `npm run dev:css`: Tailwind watch from `src/styles/theme.css` to `assets/theme.css`
- `npm run dev:theme`: Shopify CLI theme dev using the default environment in `shopify.theme.toml`
- `npm run build`: compile production CSS
- `npm run check`: run Theme Check
- `npm run push:staging`: build and push to an unpublished theme
- `npm run push`: build and push the current theme
- `npm run pull`: pull theme files from Shopify
- `npm run package`: build and package the theme

### Flow A: One command

```bash
npm run dev
```

### Flow B: Two terminals

Terminal 1:

```bash
npm run dev:css
```

Terminal 2:

```bash
npm run dev:theme
```

### Shopify commands

```bash
shopify auth login
shopify theme dev --environment default
```

### Local environment file

`shopify.theme.toml` is local-only and must not be committed. The committed-safe reference file is `shopify.theme.toml.example`.

Optional `.env.local` overrides can still exist for ad hoc CLI flags, but the default project workflow should use `shopify.theme.toml`.

## Troubleshooting

- Store flag confusion:
  Use `shopify theme info` to confirm the current store and environment. The project expects `ezquest-3.myshopify.com`.
- Password-protected store:
  If the storefront shows a password page in local preview, update `store-password` in local `shopify.theme.toml`.
- Preview URL mismatch:
  The local preview should run at `http://127.0.0.1:9292`. If another port appears, stop the dev server and restart with the default environment.
- Remote deletions during development:
  The local environment is configured with `nodelete = true` to avoid delete-blocking issues while previewing.

## Architecture Notes

- Header and footer use Shopify section groups.
- Templates stay thin and section-driven.
- Support-center pages are scaffolded as custom pages.
- Privacy, terms, and refund pages remain native Shopify policies.
- Shipping & Returns is implemented as a custom page: `/pages/shipping-returns`.

## Documentation

- Phase 1.5 handoff: [docs/phase-1-5-handoff.md](./docs/phase-1-5-handoff.md)
- Structured data architecture: [docs/structured-data-architecture.md](./docs/structured-data-architecture.md)

## Next Milestone

Phase 2 should begin with implementation of the global shell, homepage, collection page, product page, and the first support-center templates.
