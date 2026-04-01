# EZQuest Phase 1 Component and Module Inventory

This document formalizes the Phase 1 component and module outline using the current theme implementation as the source of truth.

## 1. Global shell modules

### Announcement bar

- Section:
  - [announcement-bar.liquid](/Applications/MAMP/htdocs/EZQuest/sections/announcement-bar.liquid)
- Purpose:
  - shipping or store-level message
  - top-level regional/meta framing

### Header and navigation

- Sections:
  - [header-group.json](/Applications/MAMP/htdocs/EZQuest/sections/header-group.json)
  - [header.liquid](/Applications/MAMP/htdocs/EZQuest/sections/header.liquid)
- Snippets:
  - [site-header.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/site-header.liquid)
  - [mega-menu.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mega-menu.liquid)
  - [mega-menu-panel.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mega-menu-panel.liquid)
  - [mobile-nav-drawer.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mobile-nav-drawer.liquid)
- Purpose:
  - primary navigation
  - product-family discovery
  - compare entry
  - support entry

### Footer

- Sections:
  - [footer-group.json](/Applications/MAMP/htdocs/EZQuest/sections/footer-group.json)
  - [footer.liquid](/Applications/MAMP/htdocs/EZQuest/sections/footer.liquid)
- Snippet:
  - [site-footer.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/site-footer.liquid)
- Purpose:
  - recovery navigation
  - support/company/legal structure

### Shared shell snippets

- [breadcrumbs.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/breadcrumbs.liquid)
- [icon.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/icon.liquid)
- [button.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/button.liquid)
- [price.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/price.liquid)
- [media.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/media.liquid)
- [placeholder-visual.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/placeholder-visual.liquid)

## 2. Homepage modules

### Hero

- [hero-home.liquid](/Applications/MAMP/htdocs/EZQuest/sections/hero-home.liquid)
- Role:
  - brand positioning
  - primary CTA
  - merchandising entry

### Product-family strip

- [home-collections-strip.liquid](/Applications/MAMP/htdocs/EZQuest/sections/home-collections-strip.liquid)
- Role:
  - product-family navigation
  - category-level entry points

### Featured products

- [featured-product-carousel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/featured-product-carousel.liquid)
- Role:
  - merch spotlight
  - direct product discovery

### Support/editorial band

- [support-card-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-card-grid.liquid)
- Role:
  - support confidence
  - ownership messaging

### Homepage FAQ

- [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)
- Role:
  - answer pre-purchase hesitation

## 3. Collection and product modules

### Collection page

- [main-collection.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-collection.liquid)
- [collection-feature-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/collection-feature-grid.liquid)
- Role:
  - collection intro
  - product scan
  - support injection

### Product page core

- [main-product.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-product.liquid)
- Role:
  - gallery
  - buy box
  - trust layer
  - add-to-cart

### Product story modules

- [product-story-carousel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-story-carousel.liquid)
- [product-story-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-story-grid.liquid)

### Technical sheet

- [product-spec-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-spec-table.liquid)

### Compare

- [product-compare-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-compare-table.liquid)
- [compare-cell.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/compare-cell.liquid)

### Product cards

- [card-product.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-product.liquid)

## 4. Support system modules

### Support hub and navigation

- [support-nav-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-nav-grid.liquid)
- [support-link-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-link-grid.liquid)

### Resource listing

- [support-resource-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-resource-list.liquid)
- [support-resource-card.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/support-resource-card.liquid)

### Compatibility

- [compatibility-entry-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/compatibility-entry-list.liquid)

### FAQ

- [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)
- [accordion-item.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/accordion-item.liquid)
- [support-search-form.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/support-search-form.liquid)

### Troubleshooting

- [troubleshooting-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/troubleshooting-list.liquid)

### Contact

- [contact-form-panel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/contact-form-panel.liquid)

## 5. Brand, static, and legal modules

### Generic page hero

- [hero-page.liquid](/Applications/MAMP/htdocs/EZQuest/sections/hero-page.liquid)

### Generic page content shell

- [main-page.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-page.liquid)

### Info-card utility grid

- [info-card-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/info-card-grid.liquid)

### CTA banner

- [cta-banner.liquid](/Applications/MAMP/htdocs/EZQuest/sections/cta-banner.liquid)

## 6. Editorial and discovery modules

### Blog index

- [main-blog.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-blog.liquid)

### Article

- [main-article.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-article.liquid)
- [article-feed.liquid](/Applications/MAMP/htdocs/EZQuest/sections/article-feed.liquid)
- [card-article.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-article.liquid)

### Search

- [main-search.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-search.liquid)

## 7. Utility and system modules

### Cart

- [main-cart.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-cart.liquid)

### 404 fallback

- [404.json](/Applications/MAMP/htdocs/EZQuest/templates/404.json)

## 8. Component pattern families

The implemented theme already groups into a small number of reusable Phase 1 pattern families:

- global shell
- hero surfaces
- intro blocks
- cards and tiles
- resource lists
- accordions
- compare surfaces
- CTA bands
- generic page-content shells

## 9. What this means for Phase 1

The component/module outline promised in Phase 1 is already materially present in the theme architecture.

This document turns that implicit structure into a formal reviewable inventory.
