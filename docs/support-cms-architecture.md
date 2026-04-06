# EZQuest Support CMS Architecture

This document defines how EZQuest support content is modeled, structured, and managed in Shopify so the Support Center can scale without breaking source-of-truth rules.

## Core principles

- Structured data is the source of truth.
- Templates provide framing copy and layout only.
- Product-linked support uses product metafields that reference metaobjects.
- Global support pages can fall back to global metaobject lists when no product context exists.
- No duplicate or conflicting content across templates and metaobjects.

## Support content types

### Downloads
- Metaobject type: `ezquest_download`
- Product metafield: `ezquest.downloads` (list)
- Use for drivers, utilities, and non-firmware downloadable files.

### Firmware
- Metaobject type: `ezquest_firmware`
- Product metafield: `ezquest.firmware` (list)
- Use only for firmware update utilities and firmware-specific release notes.

### Manuals
- Metaobject type: `ezquest_manual`
- Product metafield: `ezquest.manuals` (list)
- Use for quick start, setup, and reference manuals.

### User guides
- Metaobject type: `ezquest_user_guide`
- Product metafield: `ezquest.user_guides` (list)
- Use for longer-form workflows and setup guidance beyond manuals.

### Compatibility
- Metaobject type: `ezquest_compatibility_entry`
- Product metafield: `ezquest.compatibility_entries` (list)
- Use for device/platform/workflow fit and link to manuals/downloads when useful.

### FAQ
- Metaobject type: `ezquest_faq_item`
- Product metafield: `ezquest.faq_items` (list)
- Use for reusable FAQ content across PDP, support, and compare.

### Troubleshooting
- Metaobject type: `ezquest_troubleshooting_item`
- Global list on the Troubleshooting page (no product metafield required yet).
- Use for symptom-first troubleshooting with clear next-step links.

### Help Me Choose
- Metaobject type: `ezquest_decision_guide_entry`
- Global list on the Help Me Choose page.
- Use for workflow-based recommendations that connect to families, compare, and PDPs.

## Page-level source of truth

- Support pages render metaobjects where possible.
- Page templates provide only framing copy, headings, and CTAs.
- Fallbacks are only for true empty states.

## Product-level source of truth

Product pages and product-linked support use these metafields:

- `ezquest.manuals`
- `ezquest.downloads`
- `ezquest.firmware`
- `ezquest.user_guides`
- `ezquest.compatibility_entries`
- `ezquest.faq_items`

These should always point to the structured metaobject entries, not to hardcoded template copy.

## Maintenance workflow

1. Add or update metaobject entries in Shopify Admin.
2. Link entries to products and collections as needed.
3. Use the Support Center pages to surface global or product-linked lists.
4. Run `npm run shopify:seed:validate` after major edits to confirm definitions and links.

## What not to do

- Do not add support content directly into templates unless it is framing copy.
- Do not duplicate the same support content in both templates and metaobjects.
- Do not invent firmware or troubleshooting details without real source data.
