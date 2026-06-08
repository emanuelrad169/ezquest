# Phase 4 Integrations — Complete
Date: 2026-04-15
Build: PASS · theme-check: 0 offenses · 132 files inspected

---

## Integration status

| Integration | Approach | Files | Status |
|-------------|----------|-------|--------|
| Reviews (Judge.me) | Stub snippet + settings toggle | `snippets/judgeme_widgets.liquid`, `config/settings_schema.json`, `snippets/card-product.liquid` | COMPLETE |
| Wishlist | Vanilla JS + localStorage | `snippets/wishlist-button.liquid`, `sections/wishlist-page.liquid`, `assets/wishlist.js`, `templates/page.wishlist.json`, `snippets/site-header.liquid`, `snippets/card-product.liquid`, `sections/main-product.liquid`, `layout/theme.liquid` | COMPLETE |
| Back-in-stock | Native contact form capture | `assets/notify.js`, `sections/main-product.liquid` | COMPLETE |
| Shoppable video | Custom section, video_tag + product tags | `sections/shoppable-video.liquid` | COMPLETE |
| Live chat (Tidio) | App install only + z-index fix | `src/styles/theme.css` | CSS READY — app install required |
| Bundles / FBT | Shopify Bundles app | — | App install required |

---

## Reviews (Judge.me)

**How it works:**
- `config/settings_schema.json` → Integrations group → `reviews_app` select: `none` / `native` / `judgeme`
- Default: `native` (reads from `product.metafields.reviews.rating`)
- When set to `judgeme`: renders `{% render 'judgeme_widgets', widget_type: 'judgeme_preview_badge', ... %}`
- `snippets/judgeme_widgets.liquid` is a no-op stub; Judge.me overwrites it on install

**To activate:**
1. Shopify admin → Apps → App Store → Judge.me Product Reviews → Install (free)
2. Judge.me auto-replaces `snippets/judgeme_widgets.liquid` with its widget code
3. Shopify admin → Online Store → Themes → Customize → Theme settings → Integrations → Reviews app → set to **Judge.me**
4. In Judge.me dashboard: enable widget on PDP (add app block to product template)

---

## Wishlist

**How it works:**
- `assets/wishlist.js` manages localStorage key `ez_wishlist`
- `snippets/wishlist-button.liquid` renders a heart button with `data-wishlist-id` attributes
- Button renders on every product card (top-right corner, absolute) and on PDP (next to ATC)
- Wishlist page at `/pages/wishlist` — Shopify page created with `template_suffix: wishlist`
- Header icon links to `/pages/wishlist` with live count badge (`data-wishlist-count`)
- Toast notification appears on add/remove
- `window.EZWishlist` exported for external use

**Files changed:**
- `snippets/wishlist-button.liquid` — new
- `sections/wishlist-page.liquid` — new
- `assets/wishlist.js` — new
- `templates/page.wishlist.json` — new (JSON template using wishlist-page section)
- `snippets/site-header.liquid` — wishlist icon + count badge added before cart
- `snippets/card-product.liquid` — wishlist button rendered after product image `</a>`
- `sections/main-product.liquid` — wishlist button added inside purchase row
- `layout/theme.liquid` — `wishlist.js` script tag added

---

## Back-in-stock notifications

**How it works:**
- `assets/notify.js` watches the ATC button's `disabled` attribute via MutationObserver
- When ATC is disabled (sold-out variant), shows `.notify-form`; when enabled, hides it
- Form submits to `/contact` with `form_type: contact` and a back-in-stock note
- Submissions arrive in Shopify admin → Orders → Contacts

**Files changed:**
- `assets/notify.js` — new
- `sections/main-product.liquid` — notify form added after `{% endform %}`, shown `{% unless product.available %}`
- `layout/theme.liquid` — `notify.js` script tag added

**Note:** This uses Shopify's native contact form endpoint. For automated restock emails, replace with Back In Stock app (free tier available) which adds a `data-bis-trigger` attribute approach.

---

## Shoppable video

**How it works:**
- `sections/shoppable-video.liquid` — new section, available in theme customizer
- Supports: native Shopify video upload (`type: video`) or embed URL fallback
- Product tags: up to 6 `product` blocks, each with x/y position sliders (5–95%)
- Tags overlay the video with pill-shaped cards showing product image, title, price
- CTA button at bottom-left of content area
- Section uses `section--dark` and gradient overlay for legibility
- `reveal-stagger` is NOT used on the video section itself (motion not appropriate for video overlay)

**To use:**
1. Shopify admin → Online Store → Themes → Customize
2. Add section → Shoppable video
3. Upload a video file (MP4, MOV) — autoplay, loop, muted
4. Add up to 6 Product tag blocks, pick a product, set x/y position
5. Set heading, body, and CTA

---

## Live chat (Tidio)

**CSS ready:** `#tidio-chat { z-index: 150 !important; }` — keeps Tidio below the cart drawer (z: 200).

**To activate:**
1. Shopify admin → Apps → App Store → Tidio Live Chat → Install (free)
2. Configure in Tidio dashboard: business hours, welcome message, offline message, quick replies
3. Set widget position to **bottom-left** (cart drawer is bottom-right)

---

## Bundles / FBT

**Recommendation:** Shopify Bundles app (free)
Shopify admin → Apps → App Store → Bundles → Install
No code changes required — app handles UI injection via app blocks.

---

## Verification checklist (after password removed + store live)

- [ ] Reviews: product cards show star rating from metafields (native mode)
- [ ] Reviews: after Judge.me install — set `reviews_app` to `judgeme`, stars render via app widget
- [ ] Wishlist: heart icon visible on all product cards (top-right corner)
- [ ] Wishlist: heart icon visible on PDP (next to ATC button)
- [ ] Wishlist: clicking heart toggles filled/unfilled + shows toast
- [ ] Wishlist: `/pages/wishlist` renders saved items grid
- [ ] Wishlist: wishlist count badge in header updates on add/remove
- [ ] Wishlist: count persists on page reload (localStorage)
- [ ] Back-in-stock: "Notify me" form visible when product is sold out
- [ ] Back-in-stock: form submits to `/contact` endpoint (check Shopify notifications inbox)
- [ ] Shoppable video: section available in theme customizer
- [ ] Shoppable video: product tags render at correct x/y positions over video
- [ ] Live chat: Tidio bubble appears (after app install) — does not overlap cart drawer
