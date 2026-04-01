# Shopify Admin Automation

This document explains the Shopify Admin API automation layer for EZQuest.

The goal is to let the repo seed repeatable Shopify admin data safely instead of relying on one-off manual entry.

## What this automation covers

- pages
- blog and starter articles
- metaobject definitions
- product metafield definitions
- starter collections
- starter structured content for the flagship product

## What it does not automate by default

- theme deployment
- storefront theme preview
- menu creation

Menu automation is intentionally left as a documented fallback because menu APIs and store permissions can vary by app setup and store context. The repo includes the exact target menu structure below.

## Required Shopify custom app setup

Create a Shopify custom app in the EZQuest store and generate an Admin API access token.

Use a private internal app for store management, not a public app flow.

### Environment variables

Add these values to your shell environment or `.env.local`:

```bash
SHOPIFY_SHOP_DOMAIN=ezquest-3.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
SHOPIFY_ADMIN_API_VERSION=2026-01
```

Do not commit real values.

## Recommended minimum Admin API scopes

Keep scopes conservative. Start with:

- `read_products`
- `write_products`
- `read_content`
- `write_content`
- `read_metaobjects`
- `write_metaobjects`
- `read_metaobject_definitions`
- `write_metaobject_definitions`
- `read_files`
- `write_files`

Only add more if needed later.

Optional scopes depending on future automation:

- `read_online_store_pages`
- `write_online_store_pages`
- `read_publications`
- `write_publications`
- `read_themes`
- `write_themes`

Theme scopes are not required for the current automation layer because theme development already runs through Shopify CLI.

## Commands

Run these from the repo root:

```bash
npm run shopify:seed:preflight
npm run shopify:seed:pages
npm run shopify:seed:blogs
npm run shopify:seed:products
npm run shopify:seed:metaobjects
npm run shopify:seed:metafields
npm run shopify:seed:collections
npm run shopify:seed:content
npm run shopify:seed:validate
npm run shopify:seed:menus
npm run shopify:seed:all
```

Dry run:

```bash
npm run shopify:seed:dry
```

## Safe order of execution

Run seeds in this order:

1. `npm run shopify:seed:preflight`
2. `npm run shopify:seed:pages`
3. `npm run shopify:seed:blogs`
4. `npm run shopify:seed:products`
5. `npm run shopify:seed:metaobjects`
6. `npm run shopify:seed:metafields`
7. `npm run shopify:seed:collections`
8. `npm run shopify:seed:content`
9. `npm run shopify:seed:validate`
10. Apply menu structure manually

Or run:

```bash
npm run shopify:seed:all
```

Then manually complete menus.

## Validation command

Run this after the structured seed sequence:

```bash
npm run shopify:seed:validate
```

This command does not mutate storefront data. It reports:

- which EZQuest metaobject definitions exist
- which EZQuest product metafield definitions exist
- how many structured entries currently exist for each definition type
- whether the three compare products are present
- whether each product has the expected structured links for PDP and support rendering

## Pages seeded automatically

- Support Center → `support` → `page.support`
- Downloads → `downloads` → `page.downloads`
- Manuals → `manuals` → `page.manuals`
- Compatibility → `compatibility` → `page.compatibility`
- FAQ → `faq` → `page.faq`
- Troubleshooting → `troubleshooting` → `page.troubleshooting`
- Contact Support → `contact` → `page.contact`
- About EZQuest → `about` → `page.about`
- Our Story → `our-story` → `page.our-story`
- Warranty → `warranty` → `page.warranty`
- Shipping & Returns → `shipping-returns` → `page.shipping-returns`
- Where to Buy → `where-to-buy` → `page.where-to-buy`
- Cookie Policy → `cookie-policy` → `page.cookie-policy`
- Compare → `compare` → `page.compare`

## Structured data seeded automatically

### Metaobject definitions

- `ezquest_spec_row`
- `ezquest_manual`
- `ezquest_download`
- `ezquest_compatibility_entry`
- `ezquest_comparison_group`
- `ezquest_faq_item`

### Product metafield definitions

Namespace: `ezquest`

- `spec_rows`
- `support_summary`
- `feature_highlights`
- `compatibility_summary`
- `manuals`
- `downloads`
- `compatibility_entries`
- `compare_group`
- `faq_items`

## Products seeded automatically

- `usb-c-multimedia-hub`
- `usb-c-travel-hub`
- `usb-c-pro-dock`

The product seed creates or updates the core compare products so structured content can attach without manual product-entry drift.

## Starter content seed

The starter content seed is built around:

- flagship product handle: `usb-c-multimedia-hub`
- comparison group handle: `usb-c-workspace-connectivity-lineup`
- three seeded products:
  - `usb-c-multimedia-hub`
  - `usb-c-travel-hub`
  - `usb-c-pro-dock`
- each product includes:
  - 4 spec rows
  - 2 manuals
  - 2 downloads
  - 2 compatibility entries
  - 3 FAQ items
- one comparison group links all three products

Important:

- the product must already exist in Shopify with the expected handle
- the script looks up products by handle
- the script creates or updates reusable metaobjects first
- if the product already exists, the script links those entries back to the product metafields
- if the product does not exist yet, reusable entries are still seeded and product linkage is deferred until a later rerun

## Menu fallback checklist

If menu automation is not enabled, create these menus manually in Shopify Admin.

### Header

- Shop
- Compare
- Support
- About

### Support submenu

- Support Center
- Downloads
- Manuals
- Compatibility
- FAQ
- Troubleshooting
- Contact Support

### About submenu

- About EZQuest
- Our Story
- Where to Buy

### Footer support

- Support Center
- Downloads
- Manuals
- Compatibility
- FAQ
- Troubleshooting
- Warranty
- Contact Support

### Footer company

- About EZQuest
- Our Story
- Where to Buy
- Shipping & Returns
- Resources

### Footer legal

- Cookie Policy
- Privacy Policy
- Refund Policy
- Terms of Service

## Troubleshooting

### Missing env vars

If a seed exits immediately, confirm:

- `SHOPIFY_SHOP_DOMAIN`
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
- `SHOPIFY_ADMIN_API_VERSION`

Start with:

```bash
npm run shopify:seed:preflight
```

That checks:

- env var availability
- Admin API reachability
- whether the token can authenticate
- which access scopes the installed custom app currently has
- whether required or recommended scopes are still missing

### Auth failures

If you get `401` or `403` responses:

- verify the token belongs to the correct store
- verify the app is installed
- verify the app has the required scopes

### Metaobject definition access denied

If the metaobject definition seed fails with:

- `Access denied for metaobjectDefinitions field`

then add these scopes to the custom app and reinstall it:

- `read_metaobject_definitions`
- `write_metaobject_definitions`

The rest of the seed system can still run without those scopes, but definition creation itself will remain blocked until they are added.

### Structured content fails because definitions are missing

If `npm run shopify:seed:content` fails with:

- `No metaobject definition exists for type "ezquest_spec_row"`

or similar, the store is missing one or more EZQuest metaobject definitions.

Run this exact sequence after the two definition scopes are added:

```bash
npm run shopify:seed:preflight
npm run shopify:seed:metaobjects
npm run shopify:seed:metafields
npm run shopify:seed:content
npm run shopify:seed:validate
```

### Duplicate definitions

The seed is designed to create definitions only when missing.
If Shopify rejects a definition as incompatible, inspect the existing definition in Admin and align it manually before rerunning.

### userErrors

The runner prints Shopify `userErrors` with field paths. Treat those as the primary source of truth for validation failures.

### Product not found during starter content seed

If `usb-c-multimedia-hub` does not exist yet, the starter content command will skip product linkage and report that clearly.

## Notes

- The automation is intentionally idempotent where practical.
- Secrets are read from environment variables and are never hardcoded.
- The commands are modular so future store setup work can be added without disturbing the theme workflow.
