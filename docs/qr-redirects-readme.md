# QR Code Redirect Setup

## Step 1 — Determine the QR URL pattern

Scan a QR code from any current EZQuest packaging or PDF manual. The full URL will decode to one of these patterns:

| Pattern example | Replace `[QR_PREFIX]` with |
|---|---|
| `ezq.com/support/magnetic-nvme-ssd-enclosure` | `/support` |
| `ezq.com/p/X40024` | `/p` |
| `ezq.com/manuals?sku=...` | Use URL rewrite instead |
| `ezq.com/downloads/usb-c-hub` | `/downloads` |

If the QR codes use a query string (`?sku=` or `?product=`), Shopify redirects do **not** match query strings. In that case, the redirect target should be `/pages/product-resource?product={handle}` and the JavaScript in `sections/product-resource.liquid` will handle the forward to the product resource page.

## Step 2 — Edit the CSV

Open `qr-redirects-template.csv` and replace every `[QR_PREFIX]` with the actual path prefix you found in step 1.

**Before:**
```
[QR_PREFIX]/usb-c-multimedia-hub,/products/usb-c-multimedia-10-in-1-gen-2-hub?view=resource-page
```

**After** (if QR pattern is `/support`):
```
/support/usb-c-multimedia-hub,/products/usb-c-multimedia-10-in-1-gen-2-hub?view=resource-page
```

## Step 3 — Confirm product handles marked [CONFIRM]

These three products have redirects in the existing `ezq-redirects.csv` that point to collections rather than individual product pages. Verify the actual Shopify product handle exists before importing:

- `usb-c-pro-dock` — check Shopify admin → Products
- `usb-c-travel-hub` — check Shopify admin → Products
- `duraguard-usb-c-to-usb-c-charge-and-sync-cable` (DuraGuard 1m USB-C cable) — may be a variant, not its own product

## Step 4 — Import

Shopify admin → Online Store → Navigation → URL Redirects → Import CSV.

The file must have exactly two columns: `Redirect from` and `Redirect to`. No comment rows.

## Step 5 — Verify

After import, physically scan 5+ QR codes from packaging. Each must:
- Resolve without 404
- Land on the correct product resource page
- Load in <3 seconds on mobile

---

## Destination URL structure

All QR codes land on `/products/{handle}?view=resource-page` which uses:
- Template: `templates/product.resource-page.json`
- Section: `sections/product-resource.liquid`

This page renders: Setup guide, Downloads, Manuals, Firmware (if set), Compatibility, Warranty, and Support contact.

If a QR code uses a query string that can't be redirected, the fallback is `/pages/product-resource?product={handle}` — this page shows a picker form and JS-redirects to the product resource template.
