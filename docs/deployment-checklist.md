# EZQuest Theme — Deployment Checklist
Date: 2026-04-15
Theme status: Ship-ready · 99/100 · 0 theme-check offenses

---

## Pre-deployment (before shopify theme push)

- [ ] Confirm Shopify store URL with developer
- [ ] Confirm which Shopify plan is active
      (Online Store 2.0 required — confirmed by theme architecture)
- [ ] Confirm custom domain is pointed at the store
- [ ] Confirm SSL certificate is active
- [ ] Back up any existing live theme before pushing

---

## Deployment command sequence

Run in this exact order:

### 1. Push as unpublished theme (for review first)
```
shopify theme push \
  --store=[store-url].myshopify.com \
  --unpublished \
  --theme-name="EZQuest v1.0 — April 2026"
```

### 2. Open preview URL
```
shopify theme open \
  --store=[store-url].myshopify.com
```

### 3. Run browser QA checklist (see below)

### 4. If QA passes — publish
```
shopify theme publish \
  --store=[store-url].myshopify.com \
  --theme-id=[id from push output]
```

---

## Post-deployment admin configuration
(Required immediately after push — nothing renders correctly without these)

### A. Collection filters (required for PLP)
Shopify admin → Online Store → Navigation →
Search & discovery → Filters → Add filter groups:
- Product type (list)
- Price range (price_range)
- Connectivity: USB-C, Thunderbolt, USB-A (list)
- Ports: 4-port, 7-port, 8-port, 13-port (list)
- Compatibility: Mac, Windows, iPad (list)

### B. Metaobject definitions (required for compare/compatibility/specs)
Shopify admin → Settings → Custom data → Metaobjects
Create these definitions if not already present:
- ezquest_comparison_group
- ezquest_decision_guide_entry
- ezquest_compatibility_entry
- ezquest_use_case
- ezquest_spec_row

Then run:
```
npm run shopify:seed:comparisons
npm run shopify:seed:compatibility
npm run shopify:seed:decision-guide
```

### C. Product metafields (required for PDP specs + reviews)
Shopify admin → Settings → Custom data → Products
Create metafield definitions:
- ezquest.spec_rows (JSON)
- ezquest.compare_group (single line text)
- reviews.rating (decimal — for native rating display)
- reviews.rating_count (integer)

### D. Download file URLs (required for support download pages)
Shopify admin → Content → Files
Upload EZQuest PDFs and ZIPs.
Copy each file URL.
Update file_url values in:
- templates/page.downloads.json
- templates/page.manuals.json
- templates/page.firmware.json
- templates/page.user-guides.json
Replace "#" placeholders with real Shopify CDN URLs.

### E. Navigation menus
Shopify admin → Online Store → Navigation
Verify these menus exist with correct links:
- Main menu (used by mega menu)
- Footer menu
- Support navigation

### F. Social sharing image
Shopify admin → Online Store → Themes → Customize →
Theme settings → Social sharing → Upload share_image
Recommended: 1200×630px with EZQuest logo on product photo

---

## Browser QA checklist
Run on the unpublished theme preview before publishing.
Test at 375px (iPhone), 768px (iPad), 1280px (desktop).

### Homepage (/)
- [ ] Hero loads, headline display-size, CTA visible
- [ ] Collection strip renders real collection images
- [ ] Feature bento section visible
- [ ] Cinematic reveal fires on scroll
- [ ] Testimonials render
- [ ] Press logos visible

### Collection (/collections/hubs-adapters)
- [ ] Hero image loads, headline large
- [ ] Product grid: 4-col desktop, 3-col tablet, 2-col mobile
- [ ] No orphaned last card
- [ ] Filter sidebar visible (requires admin config first)
- [ ] AJAX filter: check a filter → grid updates, no page reload
- [ ] Sort dropdown works
- [ ] Promo tile renders at grid position 5
- [ ] Pagination present if > 16 products

### Product (/products/[any])
- [ ] Images load, gallery thumbnail strip visible
- [ ] Variant chips render, selection updates price
- [ ] ATC button present, loading state fires
- [ ] Cart drawer opens after ATC (not redirect to /cart)
- [ ] Sticky ATC bar appears on scroll
- [ ] Trust grid: 4 icons with labels
- [ ] Specs accordion present
- [ ] Structured data: validate at https://search.google.com/test/rich-results

### Cart drawer
- [ ] Opens from ATC — slides in from right
- [ ] Qty stepper works (+ and −)
- [ ] Remove link removes item
- [ ] Subtotal updates
- [ ] Shipping bar shows progress
- [ ] Checkout button → /checkout
- [ ] Continue shopping closes drawer
- [ ] Escape closes drawer
- [ ] Mobile: drawer is full width

### Cart page (/cart)
- [ ] Mobile: order summary ABOVE line items
- [ ] Desktop: summary sticky in right column
- [ ] Free shipping bar visible
- [ ] Checkout button full width, large

### Search (/search?q=cable)
- [ ] Results grid: 4-col
- [ ] Result count visible
- [ ] No SKU/barcode on cards

### Support hub (/pages/support)
- [ ] Light grey hero (NOT dark)
- [ ] Support nav rail sticky and scrollable
- [ ] Category cards render with icons

### Downloads (/pages/downloads)
- [ ] File list renders (at minimum placeholder entries)
- [ ] Filter pills work
- [ ] Download button on each row

### Ticket submission (/pages/ticket-submission)
- [ ] Full form visible (8 fields)
- [ ] Form submits via Shopify contact endpoint

### Compare (/pages/compare)
- [ ] Horizontal column layout (not vertical list)
- [ ] Requires metaobject seeding to show products

### 404 (/404)
- [ ] Dark background
- [ ] Display-size headline
- [ ] Family pill links visible

### All pages
- [ ] No horizontal scroll at 375px
- [ ] No placeholder grey SVG boxes visible
- [ ] All buttons are pill shape (border-radius: 980px)
- [ ] Footer renders correctly
- [ ] OG tags: share any page URL in Slack/iMessage — preview image and title should appear

---

## Phase 4 deployment dependencies
These cannot go live without developer delivery:
- [ ] Reviews app — developer must choose and install app
      (Judge.me recommended: free tier available)
- [ ] Wishlist — developer must build or install app
- [ ] Bundles / FBT — developer must build or install app
      (Shopify Bundles app: free)
- [ ] Preorder / Back-in-Stock — developer must install
      (Back In Stock: free tier available)
- [ ] Live chat — developer must install
      (Tidio free tier or Gorgias if budget allows)
- [ ] Shoppable video — developer must build section

---

## Post-launch 30-day stabilization (Phase 5)
- [ ] Monitor Shopify analytics for bounce rate on key pages
- [ ] Set up Google Search Console and submit sitemap
- [ ] Validate structured data in Google Rich Results Test
- [ ] Lighthouse audit: target Performance ≥ 85 mobile
- [ ] Set up Shopify email notifications
- [ ] Test checkout flow end-to-end with real transaction
- [ ] Configure Shopify Payments or payment gateway
