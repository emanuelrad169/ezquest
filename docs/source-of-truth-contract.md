# EZQuest Source-of-Truth Contract

This document defines where content comes from, when structured data must win, and where fallback or template-owned content is still intentional.

## 1. Core rule

Structured data wins whenever the required structured content is present.

Fallback content exists only for:

- true empty states
- merchant-configurable framing copy
- intentionally static utility copy that is not part of the structured commerce/support system

## 2. Structured surfaces

The following surfaces are structured-data driven and must not drift back into block-heavy or hardcoded alternate content when structured records exist.

### PDP structured surfaces

- Specs
  - source: `product.metafields.ezquest.spec_rows`
  - renderer: [product-spec-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-spec-table.liquid)
- Feature highlights and support summaries
  - source: `product.metafields.ezquest.feature_highlights`
  - source: `product.metafields.ezquest.support_summary`
  - source: `product.metafields.ezquest.compatibility_summary`
  - renderers:
    - [main-product.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-product.liquid)
    - [card-product.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-product.liquid)
    - [product-story-carousel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-story-carousel.liquid)
- Compatibility
  - source: `product.metafields.ezquest.compatibility_entries`
  - renderer: [compatibility-entry-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/compatibility-entry-list.liquid)
- FAQ
  - source: `product.metafields.ezquest.faq_items`
  - renderer: [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)
- Compare
  - source: `product.metafields.ezquest.compare_group`
  - renderer: [product-compare-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-compare-table.liquid)

### Compare page structured surfaces

- Compare hero framing
- compare note / CTA framing
- compare lineup
  - source: `ezquest_comparison_group`
  - renderers:
    - [hero-page.liquid](/Applications/MAMP/htdocs/EZQuest/sections/hero-page.liquid)
    - [product-compare-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-compare-table.liquid)

### Support structured surfaces

- Downloads
  - source: product-linked `ezquest_download` entries or global `ezquest_download`
  - renderer: [support-resource-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-resource-list.liquid)
- Manuals
  - source: product-linked `ezquest_manual` entries or global `ezquest_manual`
  - renderer: [support-resource-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-resource-list.liquid)
- Compatibility page
  - source: product-linked or global `ezquest_compatibility_entry`
  - renderer: [compatibility-entry-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/compatibility-entry-list.liquid)
- FAQ page
  - source: product-linked or global `ezquest_faq_item`
  - renderer: [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)

## 3. Allowed fallback behavior

### Allowed

- Empty-state cards or messages when no structured content exists
- Merchant-set headings, intros, and CTAs that frame a structured module
- Product image fallbacks that use owned local assets when real product media is missing
- Collection/support/compare owned local interim artwork when final first-party imagery is missing

### Not allowed

- Hardcoded fake specs on a product that already has structured spec rows
- Hardcoded FAQ blocks competing with global or product-linked FAQ content
- Generic compare cards competing with a valid comparison group
- Generic support lists competing with structured downloads/manuals/compatibility records
- Fake trust or business-detail content in global chrome
- Placeholder `#` links on live navigational or support surfaces

## 4. Template-owned content that is still intentional

The following can remain template-owned as long as they do not conflict with structured data:

- Hero framing copy on homepage and many static pages
- Section intros and CTA framing
- Static/legal page copy
- General brand and editorial messaging
- Navigation labels and utility labels

These are not structured-data failures. They are intentional authored copy layers.

## 5. Surface-by-surface contract

### Homepage

- Source of truth:
  - template-authored layout and framing in [index.json](/Applications/MAMP/htdocs/EZQuest/templates/index.json)
  - collection/product/store data where referenced by existing sections
- Rule:
  - no split-brain support/FAQ logic
  - owned local hero/family/product imagery is acceptable until final assets exist

### Collections

- Source of truth:
  - collection data
  - collection hero framing from [main-collection.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-collection.liquid)
  - product data through [card-product.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-product.liquid)
- Rule:
  - category visuals may use owned collection assets if real collection media is missing

### Products

- Source of truth:
  - Shopify product object
  - EZQuest product metafields
- Rule:
  - structured product support/spec/FAQ/compare content always wins
  - image fallbacks must be owned local product visuals, not remote placeholders

### Support

- Source of truth:
  - global or product-linked support metaobjects
  - template-owned framing copy
- Rule:
  - structured support records win
  - no fake resource cards once structured content exists

### Compare

- Source of truth:
  - comparison group metaobject
  - product data for product-specific details
- Rule:
  - compare page and PDP compare surfaces must stay recommendation-led and group-driven

## 6. Ownership model

### Shopify admin owns

- Products
- Collections
- Metaobjects
- Product metafields
- File resources

### Theme owns

- Layout
- rendering logic
- card/component behavior
- intentional framing copy
- empty-state design
- owned interim local imagery system

## 7. Change-control rule

Before introducing a new fallback or content override, confirm:

1. Is there already a structured source for this surface?
2. If yes, can the problem be fixed in the structured data instead?
3. If no structured source exists, is this template content intentional framing or only a temporary empty state?

If the answer is not clear, do not add a second content source.
