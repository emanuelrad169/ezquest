# Phase 2 — Admin Configuration Required
Date: 2026-04-15

## Faceted Collection Filters — Shopify Admin Setup

The filter sidebar is built and ready in:
- `sections/main-collection.liquid` (sidebar Liquid + toolbar)
- `src/styles/theme.css` (all filter CSS)
- `assets/theme.js` (mobile toggle + auto-submit)

The sidebar only renders when `collection.filters.size > 0`.
Without admin configuration, the grid displays full-width
with no broken layout. This is correct behavior.

### To activate filters in Shopify admin:

1. Go to: **Online Store → Navigation → Search & discovery**
2. Click **Filters**
3. Add filter groups for each collection:
   - Product type (list)
   - Price (price_range)
   - Connectivity (list) — values: USB-C, Thunderbolt, USB-A
   - Ports (list) — values: 4-port, 7-port, 8-port, 13-port
   - Compatibility (list) — values: Mac, Windows, iPad
4. Save and publish

Once configured, filters will appear automatically on all
collection pages without any further code changes.

---

## Cart Drawer — Browser Test Checklist

Before marking Phase 2 complete, verify in browser:

- [ ] ATC on any product → drawer slides in from right
- [ ] Drawer shows: image, title, variant, qty stepper, price
- [ ] − button decreases qty
- [ ] + button increases qty
- [ ] Remove link removes item
- [ ] Last item removed → empty state renders
- [ ] Subtotal updates after every change
- [ ] Shipping progress bar shows correct progress
- [ ] "Proceed to checkout" → /checkout
- [ ] "Continue shopping" → closes drawer, returns focus
- [ ] Escape key → closes drawer
- [ ] Overlay click → closes drawer
- [ ] Mobile 375px → drawer is full width
- [ ] Empty cart → empty state with "Continue shopping" CTA
