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

## Local Setup

```bash
npm install
shopify auth login
shopify theme dev --store your-store.myshopify.com
```

## Scripts

- `npm run dev`: Tailwind watch + local Shopify development
- `npm run build`: compile production CSS
- `npm run check`: run Theme Check
- `npm run push:staging`: build and push to an unpublished theme
- `npm run push`: build and push the current theme
- `npm run pull`: pull theme files from Shopify
- `npm run package`: build and package the theme

## Architecture Notes

- Header and footer use Shopify section groups.
- Templates stay thin and section-driven.
- Support-center pages are scaffolded as custom pages.
- Privacy, terms, and refund pages remain native Shopify policies.
- Shipping & Returns is implemented as a custom page: `/pages/shipping-returns`.

## Documentation

- Phase 1.5 handoff: [docs/phase-1-5-handoff.md](./docs/phase-1-5-handoff.md)

## Next Milestone

Phase 2 should begin with implementation of the global shell, homepage, collection page, product page, and the first support-center templates.
