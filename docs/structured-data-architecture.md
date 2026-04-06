# EZQuest Structured Data Architecture

This document defines the Shopify-native custom data model for EZQuest so product information, support resources, compatibility guidance, and comparison content can scale without reworking the theme.

## Principles

- Use product metafields to attach product-specific data and lists of related structured content.
- Use merchant-owned metaobjects for reusable records such as manuals, downloads, FAQs, compatibility entries, and comparison groups.
- Keep namespace and type names consistent:
  - Namespace: `ezquest`
  - Metafield keys: `snake_case`
  - Metaobject types: `ezquest_*`
- Prefer collection references for product-family relationships and list text fields for platform or workflow labels.
- Keep Liquid sections responsible for rendering, and keep content ownership in Shopify admin.

## Product metafields

Use the following product metafield definitions in `Settings > Custom data > Products`.

| Label | Namespace and key | Type | Purpose |
|---|---|---|---|
| Technical specification rows | `ezquest.spec_rows` | `List of metaobject references` to `ezquest_spec_row` | Ordered rows for the product specification table |
| Support summary | `ezquest.support_summary` | `Rich text` | Short post-purchase or support-oriented summary for PDP and support handoff |
| Feature highlights | `ezquest.feature_highlights` | `List of single line text` | 3-6 short highlights for the PDP buy box or story modules |
| Compatibility summary | `ezquest.compatibility_summary` | `Rich text` | Short compatibility overview for PDP and compatibility routing |
| Linked manuals | `ezquest.manuals` | `List of metaobject references` to `ezquest_manual` | Product-specific manuals and setup guides |
| Linked downloads | `ezquest.downloads` | `List of metaobject references` to `ezquest_download` | Product-specific drivers and utilities |
| Linked firmware | `ezquest.firmware` | `List of metaobject references` to `ezquest_firmware` | Product-specific firmware update utilities |
| Linked user guides | `ezquest.user_guides` | `List of metaobject references` to `ezquest_user_guide` | Long-form setup and workflow guides |
| Linked compatibility entries | `ezquest.compatibility_entries` | `List of metaobject references` to `ezquest_compatibility_entry` | Product-specific compatibility records |
| Comparison group | `ezquest.compare_group` | `Metaobject reference` to `ezquest_comparison_group` | Primary compare grouping for the PDP |
| Linked FAQ items | `ezquest.faq_items` | `List of metaobject references` to `ezquest_faq_item` | Product-level FAQ overrides or additions |

## Metaobject definitions

### Technical spec row

- Type: `ezquest_spec_row`
- Display name field: `label`
- Purpose: Reusable ordered product spec rows, referenced from products through `ezquest.spec_rows`

| Field label | Key | Type |
|---|---|---|
| Label | `label` | `Single line text` |
| Value | `spec_value` | `Multi-line text` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - SPEC LABEL`
- Example: `USB-C 8K Hub - Power delivery`

### Manual

- Type: `ezquest_manual`
- Display name field: `title`
- Purpose: Product manuals, quick-start guides, installation guides, and documentation

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Manual type | `manual_type` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| File | `file` | `File` |
| External URL | `external_url` | `URL` |
| Button label | `button_label` | `Single line text` |
| Version | `version` | `Single line text` |
| Language | `language` | `Single line text` |
| Platforms | `platforms` | `List of single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - MANUAL TYPE - VERSION`
- Example: `USB-C Multimedia Hub - Quick Start - v1`

### Download

- Type: `ezquest_download`
- Display name field: `title`
- Purpose: Drivers, utilities, and related downloadable resources that are not firmware updates

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Download type | `download_type` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| File | `file` | `File` |
| External URL | `external_url` | `URL` |
| Button label | `button_label` | `Single line text` |
| Version | `version` | `Single line text` |
| Platforms | `platforms` | `List of single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Related compatibility entries | `compatibility_entries` | `List of metaobject references` to `ezquest_compatibility_entry` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - DOWNLOAD TYPE - PLATFORM - VERSION`
- Example: `USB-C Multimedia Hub - Driver - Windows - 2.1.0`

### Firmware

- Type: `ezquest_firmware`
- Display name field: `title`
- Purpose: Firmware update utilities tied to products and support paths

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Firmware type | `firmware_type` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| File | `file` | `File` |
| External URL | `external_url` | `URL` |
| Button label | `button_label` | `Single line text` |
| Version | `version` | `Single line text` |
| Platforms | `platforms` | `List of single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Related manuals | `manuals` | `List of metaobject references` to `ezquest_manual` |
| Related downloads | `downloads` | `List of metaobject references` to `ezquest_download` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - FIRMWARE TYPE - VERSION`
- Example: `USB-C Multimedia Hub - Firmware Update - v1.4.2`

### User guide

- Type: `ezquest_user_guide`
- Display name field: `title`
- Purpose: Long-form setup guides, workflow guidance, and ownership education

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Guide type | `guide_type` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| File | `file` | `File` |
| External URL | `external_url` | `URL` |
| Button label | `button_label` | `Single line text` |
| Version | `version` | `Single line text` |
| Platforms | `platforms` | `List of single line text` |
| Workflows | `workflows` | `List of single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Related manuals | `manuals` | `List of metaobject references` to `ezquest_manual` |
| Related downloads | `downloads` | `List of metaobject references` to `ezquest_download` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - GUIDE TYPE - VERSION`
- Example: `USB-C Pro Dock - Workflow Guide - v1.0`

### Compatibility entry

- Type: `ezquest_compatibility_entry`
- Display name field: `title`
- Purpose: Individual compatibility scenarios that can be connected to products, families, workflows, and related resources

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Platform | `platform` | `Single line text` |
| Device or host | `device` | `Single line text` |
| Workflow or use case | `workflow` | `Single line text` |
| Status | `status` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Related manuals | `manuals` | `List of metaobject references` to `ezquest_manual` |
| Related downloads | `downloads` | `List of metaobject references` to `ezquest_download` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `PRODUCT OR FAMILY - PLATFORM - DEVICE OR WORKFLOW`
- Example: `USB-C Multimedia Hub - macOS - MacBook Pro M3`

### Troubleshooting item

- Type: `ezquest_troubleshooting_item`
- Display name field: `title`
- Purpose: Symptom-first troubleshooting items that link to the right next step

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Issue type | `issue_type` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| Likely causes | `likely_causes` | `Multi-line text` |
| Resolution | `resolution` | `Multi-line text` |
| Primary label | `primary_label` | `Single line text` |
| Primary URL | `primary_url` | `URL` |
| Secondary label | `secondary_label` | `Single line text` |
| Secondary URL | `secondary_url` | `URL` |
| Platforms | `platforms` | `List of single line text` |
| Workflows | `workflows` | `List of single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `ISSUE TYPE - SUMMARY`
- Example: `Display - Display not detected`

### Comparison group

- Type: `ezquest_comparison_group`
- Display name field: `heading`
- Purpose: Group-driven compare sets that control which products appear together and what shared framing copy they use

| Field label | Key | Type |
|---|---|---|
| Eyebrow | `eyebrow` | `Single line text` |
| Heading | `heading` | `Single line text` |
| Description | `description` | `Multi-line text` |
| Group type | `group_type` | `Single line text` |
| Products | `products` | `List of product references` |
| CTA label | `cta_label` | `Single line text` |
| Support note | `support_note` | `Multi-line text` |

Naming convention:

- `FAMILY OR USE CASE - COMPARE`
- Example: `USB-C Hubs - Compare`

### Decision guide entry

- Type: `ezquest_decision_guide_entry`
- Display name field: `title`
- Purpose: Help-me-choose entries that map workflow needs to the right family or product

| Field label | Key | Type |
|---|---|---|
| Title | `title` | `Single line text` |
| Role label | `role_label` | `Single line text` |
| Summary | `summary` | `Multi-line text` |
| Primary label | `primary_label` | `Single line text` |
| Primary URL | `primary_url` | `URL` |
| Secondary label | `secondary_label` | `Single line text` |
| Secondary URL | `secondary_url` | `URL` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Workflows | `workflows` | `List of single line text` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `ROLE - SUMMARY`
- Example: `Travel - Portable travel setup`

### FAQ item

- Type: `ezquest_faq_item`
- Display name field: `question`
- Purpose: Shared FAQ content that can be reused globally or attached to products

| Field label | Key | Type |
|---|---|---|
| Question | `question` | `Single line text` |
| Answer | `answer` | `Multi-line text` |
| FAQ group | `faq_group` | `Single line text` |
| Products | `products` | `List of product references` |
| Collections | `collections` | `List of collection references` |
| Platforms | `platforms` | `List of single line text` |
| Related page | `related_page` | `Page reference` |
| Sort order | `sort_order` | `Integer` |

Naming convention:

- `GROUP - QUESTION SUMMARY`
- Example: `Compatibility - Does this support dual displays?`

## Compatibility structure

Use a hybrid compatibility model:

- Product reference for exact SKU or PDP targeting
- Collection reference for product-family grouping
- Platform text fields for ecosystems such as `macOS`, `Windows`, `ChromeOS`, or `iPadOS`
- Device text field for hosts such as `MacBook Pro M3`
- Workflow text field for use cases such as `dual-display`, `travel`, or `conference-room`
- Related manual and download references for the next support step

Why this is the best fit:

- EZQuest needs SKU-level precision and family-level reuse.
- Shopify collections already provide a clean family grouping layer.
- Platform and workflow labels stay flexible without forcing a rigid taxonomy too early.
- Related resource references let compatibility records become support navigation objects later.

## Comparison structure

Use a group-driven comparison model.

- Each product gets one primary `ezquest.compare_group` metafield.
- The group metaobject decides which products belong together.
- Shared compare context lives on the group:
  - eyebrow
  - heading
  - description
  - CTA label
  - support note
- Product-specific details stay on products:
  - title
  - image
  - price
  - specs
  - highlights
  - support summaries

Why group-driven is better:

- Merchants control the compare set in one place instead of editing many cross-links across products.
- It avoids drift where related products point to inconsistent compare sets.
- The current compare section can scale from cards today to a richer matrix later without changing the grouping model.

## Section data ownership

| Section | Structured source | Fallback source | Theme-editor responsibility |
|---|---|---|---|
| `product-spec-table` | `product.metafields.ezquest.spec_rows` | Section blocks | Heading, intro copy, empty state |
| `product-compare-table` | `product.metafields.ezquest.compare_group` or group handle override | Section blocks | Layout, fallback cards, optional group handle |
| `support-resource-list` | Product-linked manuals/downloads or global metaobject values | Section blocks | Source mode, resource kind, optional product/collection filters |
| `faq-accordion` | Product-linked FAQs or global FAQ metaobjects | Section blocks | Source mode, group filter, heading and intro |

Global support sections that render `metaobjects.*.values` should explicitly sort by `sort_order` before applying any filters or limits. Product-linked metafield lists keep their assigned reference order unless a section intentionally re-sorts them.

## Admin setup

### Add product metafields

1. Go to `Settings > Custom data > Products`.
2. Click `Add definition`.
3. Create each product metafield listed in this document.
4. For any metaobject reference field:
   - choose `Metaobject` or `List of metaobjects`
   - validate against the correct EZQuest definition
5. Pin the product metafields you expect merchandisers to fill most often:
   - `spec_rows`
   - `feature_highlights`
   - `manuals`
   - `downloads`
   - `compare_group`
   - `faq_items`

### Add metaobjects

1. Go to `Content > Metaobjects`.
2. Click `Add definition`.
3. Create each definition above using the exact type names.
4. Assign the display name field as listed in this document.
5. Create entries after the definitions are saved.

### Link products to entries

1. Open a product in `Products`.
2. Scroll to the `Metafields` area.
3. Populate:
   - `Technical specification rows`
   - `Linked manuals`
   - `Linked downloads`
   - `Linked FAQ items`
   - `Linked compatibility entries`
   - `Comparison group`
4. Save the product.

### Test in the theme editor

1. Add a few `ezquest_spec_row` entries and connect them to a product.
2. Add one `ezquest_comparison_group` and connect 2-4 related products.
3. Add 2-3 `ezquest_manual` and `ezquest_download` entries, then connect them to one product.
4. Add 2-3 `ezquest_faq_item` entries and connect them to the same product.
5. In the theme editor:
   - open a product page and confirm the spec table and compare section switch to structured content
   - open a support page and set `Support resource list` to `Product` or `Global`
   - open an FAQ section and set it to `Auto`, `Product`, or `Global`

## Migration order

1. Seed `ezquest_spec_row` and `ezquest.compare_group` first for 2-3 flagship products.
2. Seed manuals and downloads for the same products.
3. Seed product-linked FAQs.
4. Seed compatibility entries after the first support resources exist.
5. Leave block fallbacks in place until enough structured content exists to cover all priority review pages.

## References

- [Shopify Help: Custom data](https://help.shopify.com/en/manual/custom-data)
- [Shopify Help: Creating metaobject entries](https://help.shopify.com/en/manual/custom-data/metaobjects/creating-entries)
- [Shopify Dev: Metafield data types](https://shopify.dev/docs/apps/build/custom-data/metafields/list-of-data-types)
- [Shopify Dev: Metaobject definition object](https://shopify.dev/docs/api/liquid/objects/metaobject_definition)
