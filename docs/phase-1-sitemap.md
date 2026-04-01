# EZQuest Phase 1 Sitemap

This sitemap is packaged from the current implemented EZQuest theme and the launch architecture already established in the repo.

It reflects the actual Phase 1 information architecture that the theme now supports.

## Sitemap summary

The Phase 1 storefront architecture supports 28 core destinations when native Shopify system pages are included.

## Shop

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
6. Cables & Accessories
   - `/collections/accessories`
7. Product detail page
   - `/products/:handle`
8. Compare
   - `/pages/compare`
9. Search
   - `/search`
10. Cart
   - `/cart`
11. Checkout
   - native Shopify checkout

## Support

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
19. Contact support
   - `/pages/contact`

## Brand and discovery

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

## Legal and policy

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

## System and fallback pages

These are supported by the theme and should be counted as part of the implemented architecture, even if they were not primary planning surfaces:

- 404
  - `templates/404.json`
- Password page
  - `layout/password.liquid`
- Gift card preview
  - Shopify system route

## Navigation grouping

### Primary navigation

- Shop
- Product families
- Compare
- Support
- Resources
- About

### Product families

- Hubs & Adapters
- Docking Stations
- Chargers & Power
- Cables & Accessories
- All Products

### Support ecosystem

- Support center
- Downloads
- Manuals
- Compatibility
- FAQ
- Troubleshooting
- Contact support

### Brand and discovery

- About
- Our Story
- Where to Buy
- Blog / Resources

## Theme-template mapping

| Route type | Template |
|---|---|
| Home | [index.json](/Applications/MAMP/htdocs/EZQuest/templates/index.json) |
| Collection | [collection.json](/Applications/MAMP/htdocs/EZQuest/templates/collection.json) |
| Product | [product.json](/Applications/MAMP/htdocs/EZQuest/templates/product.json) |
| Compare | [page.compare.json](/Applications/MAMP/htdocs/EZQuest/templates/page.compare.json) |
| Support | [page.support.json](/Applications/MAMP/htdocs/EZQuest/templates/page.support.json) |
| Downloads | [page.downloads.json](/Applications/MAMP/htdocs/EZQuest/templates/page.downloads.json) |
| Manuals | [page.manuals.json](/Applications/MAMP/htdocs/EZQuest/templates/page.manuals.json) |
| Compatibility | [page.compatibility.json](/Applications/MAMP/htdocs/EZQuest/templates/page.compatibility.json) |
| FAQ | [page.faq.json](/Applications/MAMP/htdocs/EZQuest/templates/page.faq.json) |
| Troubleshooting | [page.troubleshooting.json](/Applications/MAMP/htdocs/EZQuest/templates/page.troubleshooting.json) |
| Warranty | [page.warranty.json](/Applications/MAMP/htdocs/EZQuest/templates/page.warranty.json) |
| Contact | [page.contact.json](/Applications/MAMP/htdocs/EZQuest/templates/page.contact.json) |
| About | [page.about.json](/Applications/MAMP/htdocs/EZQuest/templates/page.about.json) |
| Our Story | [page.our-story.json](/Applications/MAMP/htdocs/EZQuest/templates/page.our-story.json) |
| Where to Buy | [page.where-to-buy.json](/Applications/MAMP/htdocs/EZQuest/templates/page.where-to-buy.json) |
| Shipping & Returns | [page.shipping-returns.json](/Applications/MAMP/htdocs/EZQuest/templates/page.shipping-returns.json) |
| Cookie Policy | [page.cookie-policy.json](/Applications/MAMP/htdocs/EZQuest/templates/page.cookie-policy.json) |
| Blog landing | [blog.json](/Applications/MAMP/htdocs/EZQuest/templates/blog.json) |
| Article | [article.json](/Applications/MAMP/htdocs/EZQuest/templates/article.json) |
| Search | [search.json](/Applications/MAMP/htdocs/EZQuest/templates/search.json) |
| Cart | [cart.json](/Applications/MAMP/htdocs/EZQuest/templates/cart.json) |
| 404 | [404.json](/Applications/MAMP/htdocs/EZQuest/templates/404.json) |
