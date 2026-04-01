# EZQuest Phase 1 Final Reference

This document is the final locked Phase 1 reference for EZQuest.

It consolidates the implemented information architecture, page hierarchy, user flows, component inventory, and the mapping between live templates and the wireframe-equivalent structures already represented in the theme.

This is a reference document, not a redesign document.

## 1. Sitemap

The implemented storefront supports the following primary customer-facing destinations.

### Shop and commerce

1. Home
   - `/`
2. All products
   - `/collections/all`
3. Hubs & Adapters
   - `/collections/hubs-adapters`
4. Docking Stations
   - `/collections/docking-stations`
5. Chargers & Power
   - `/collections/chargers-power`
6. Accessories
   - `/collections/accessories`
7. Product detail pages
   - `/products/:handle`
8. Compare
   - `/pages/compare`
9. Search
   - `/search`
10. Cart
   - `/cart`
11. Checkout
   - native Shopify checkout

### Support and ownership

12. Support center
   - `/pages/support`
13. Downloads
   - `/pages/downloads`
14. Manuals
   - `/pages/manuals`
15. Compatibility
   - `/pages/compatibility`
16. FAQ
   - `/pages/faq`
17. Troubleshooting
   - `/pages/troubleshooting`
18. Warranty
   - `/pages/warranty`
19. Contact
   - `/pages/contact`

### Brand and discovery

20. About
   - `/pages/about`
21. Our Story
   - `/pages/our-story`
22. Where to Buy
   - `/pages/where-to-buy`
23. Blog landing
   - `/blogs/:handle`
24. Article detail
   - `/blogs/:handle/:article-handle`

### Legal and policy

25. Shipping & Returns
   - `/pages/shipping-returns`
26. Cookie Policy
   - `/pages/cookie-policy`
27. Privacy Policy
   - `/policies/privacy-policy`
28. Terms of Service
   - `/policies/terms-of-service`
29. Refund Policy
   - `/policies/refund-policy`

### System routes

30. 404
   - `templates/404.json`
31. Password page
   - Shopify password surface

## 2. Page Hierarchy

### Primary navigation

- Shop
- Product families
- Compare
- Support
- Resources
- About

### Product family hierarchy

- All products
- Hubs & Adapters
- Docking Stations
- Chargers & Power
- Accessories

### Support hierarchy

- Support center
- Downloads
- Manuals
- Compatibility
- FAQ
- Troubleshooting
- Warranty
- Contact

### Brand and utility hierarchy

- About
- Our Story
- Where to Buy
- Blog / Resources
- Shipping & Returns
- Cookie Policy
- Privacy Policy
- Terms of Service
- Refund Policy

## 3. User Flows

### Standard commerce flow

1. Home
2. Collection or product family
3. Product detail page
4. Cart
5. Checkout

### Compare-assisted flow

1. Home, collection, or product page
2. Compare
3. Product detail page
4. Cart
5. Checkout

### Support-assisted buying flow

1. Home, collection, compare, or product page
2. Compatibility or FAQ
3. Product detail page or support path
4. Cart
5. Checkout

### Ownership support flow

1. Support center
2. Downloads, Manuals, Compatibility, FAQ, Troubleshooting, or Contact
3. Resolve with self-service or escalate

### Editorial-to-commerce flow

1. Blog or brand page
2. Product family, PDP, or support
3. Cart or contact path

## 4. Component Inventory

### Global shell

- Announcement bar
  - [announcement-bar.liquid](/Applications/MAMP/htdocs/EZQuest/sections/announcement-bar.liquid)
- Header and navigation
  - [header.liquid](/Applications/MAMP/htdocs/EZQuest/sections/header.liquid)
  - [site-header.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/site-header.liquid)
  - [mega-menu.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mega-menu.liquid)
  - [mega-menu-panel.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mega-menu-panel.liquid)
  - [mobile-nav-drawer.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/mobile-nav-drawer.liquid)
- Footer
  - [footer.liquid](/Applications/MAMP/htdocs/EZQuest/sections/footer.liquid)
  - [site-footer.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/site-footer.liquid)

### Shared primitives

- [button.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/button.liquid)
- [price.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/price.liquid)
- [breadcrumbs.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/breadcrumbs.liquid)
- [icon.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/icon.liquid)
- [placeholder-visual.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/placeholder-visual.liquid)

### Homepage modules

- [hero-home.liquid](/Applications/MAMP/htdocs/EZQuest/sections/hero-home.liquid)
- [home-collections-strip.liquid](/Applications/MAMP/htdocs/EZQuest/sections/home-collections-strip.liquid)
- [featured-product-carousel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/featured-product-carousel.liquid)
- [support-card-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-card-grid.liquid)
- [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)

### Commerce modules

- [main-collection.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-collection.liquid)
- [main-product.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-product.liquid)
- [product-story-carousel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-story-carousel.liquid)
- [product-story-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-story-grid.liquid)
- [product-spec-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-spec-table.liquid)
- [product-compare-table.liquid](/Applications/MAMP/htdocs/EZQuest/sections/product-compare-table.liquid)
- [card-product.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-product.liquid)
- [compare-cell.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/compare-cell.liquid)

### Support modules

- [hero-page.liquid](/Applications/MAMP/htdocs/EZQuest/sections/hero-page.liquid)
- [support-nav-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-nav-grid.liquid)
- [support-link-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-link-grid.liquid)
- [support-resource-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/support-resource-list.liquid)
- [support-resource-card.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/support-resource-card.liquid)
- [compatibility-entry-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/compatibility-entry-list.liquid)
- [faq-accordion.liquid](/Applications/MAMP/htdocs/EZQuest/sections/faq-accordion.liquid)
- [accordion-item.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/accordion-item.liquid)
- [support-search-form.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/support-search-form.liquid)
- [troubleshooting-list.liquid](/Applications/MAMP/htdocs/EZQuest/sections/troubleshooting-list.liquid)
- [contact-form-panel.liquid](/Applications/MAMP/htdocs/EZQuest/sections/contact-form-panel.liquid)

### Brand, editorial, and utility modules

- [main-page.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-page.liquid)
- [info-card-grid.liquid](/Applications/MAMP/htdocs/EZQuest/sections/info-card-grid.liquid)
- [cta-banner.liquid](/Applications/MAMP/htdocs/EZQuest/sections/cta-banner.liquid)
- [main-blog.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-blog.liquid)
- [main-article.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-article.liquid)
- [article-feed.liquid](/Applications/MAMP/htdocs/EZQuest/sections/article-feed.liquid)
- [card-article.liquid](/Applications/MAMP/htdocs/EZQuest/snippets/card-article.liquid)
- [main-search.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-search.liquid)
- [main-cart.liquid](/Applications/MAMP/htdocs/EZQuest/sections/main-cart.liquid)

## 5. Live Template to Wireframe Mapping

The live JSON templates are the wireframe-equivalent structures for the implemented storefront.

| Surface | Template | Wireframe-equivalent structure |
|---|---|---|
| Home | [index.json](/Applications/MAMP/htdocs/EZQuest/templates/index.json) | Hero → family discovery → featured products → support band → FAQ |
| Collection | [collection.json](/Applications/MAMP/htdocs/EZQuest/templates/collection.json) | Collection hero → toolbar/support note → merchandised grid |
| Product | [product.json](/Applications/MAMP/htdocs/EZQuest/templates/product.json) | Gallery + buy box → story → specs → compare → compatibility → FAQ |
| Compare | [page.compare.json](/Applications/MAMP/htdocs/EZQuest/templates/page.compare.json) | Hero → recommendation-led compare module |
| Support hub | [page.support.json](/Applications/MAMP/htdocs/EZQuest/templates/page.support.json) | Hero → support nav grid → support links → CTA |
| Downloads | [page.downloads.json](/Applications/MAMP/htdocs/EZQuest/templates/page.downloads.json) | Hero → resource list → CTA |
| Manuals | [page.manuals.json](/Applications/MAMP/htdocs/EZQuest/templates/page.manuals.json) | Hero → resource list → CTA |
| Compatibility | [page.compatibility.json](/Applications/MAMP/htdocs/EZQuest/templates/page.compatibility.json) | Hero → compatibility entries → related support → CTA |
| FAQ | [page.faq.json](/Applications/MAMP/htdocs/EZQuest/templates/page.faq.json) | Hero → FAQ accordion → support links → CTA |
| Troubleshooting | [page.troubleshooting.json](/Applications/MAMP/htdocs/EZQuest/templates/page.troubleshooting.json) | Hero → troubleshooting list → CTA |
| Contact | [page.contact.json](/Applications/MAMP/htdocs/EZQuest/templates/page.contact.json) | Hero → support/contact paths → contact form → page content |
| About | [page.about.json](/Applications/MAMP/htdocs/EZQuest/templates/page.about.json) | Hero → story/content modules |
| Our Story | [page.our-story.json](/Applications/MAMP/htdocs/EZQuest/templates/page.our-story.json) | Hero → story/content modules |
| Where to Buy | [page.where-to-buy.json](/Applications/MAMP/htdocs/EZQuest/templates/page.where-to-buy.json) | Hero → page content/CTA |
| Blog | [blog.json](/Applications/MAMP/htdocs/EZQuest/templates/blog.json) | Blog index → CTA |
| Article | [article.json](/Applications/MAMP/htdocs/EZQuest/templates/article.json) | Article body → related articles → CTA |
| Search | [search.json](/Applications/MAMP/htdocs/EZQuest/templates/search.json) | Search intro → result grid |
| Cart | [cart.json](/Applications/MAMP/htdocs/EZQuest/templates/cart.json) | Cart summary and checkout path |

## 6. Phase 1 Lock Notes

- Phase 1 is considered satisfied by the combination of:
  - the implemented template structure
  - the packaged sitemap and user-flow docs
  - the component inventory
  - this final reference
- The live theme is now the source of truth for structure.
- Any future IA change should update both the theme and this document.
