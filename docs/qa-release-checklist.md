# EZQuest QA and Release Checklist

This checklist is the final lock for storefront QA before release or major milestone handoff.

## 1. Core commands

Run:

1. `npm run build`
2. `npm run check`
3. `npm run dev`
4. `npm run qa:routes`

Expected:

- build passes
- Theme Check passes
- preview starts cleanly
- route smoke checks return `200`

## 2. Required route checks

### Homepage

- `/`
- Confirm:
  - hero loads correctly
  - product-family strip renders
  - featured products render
  - support/FAQ content renders
  - header and mega menu remain clean and truthful

### Collections

- `/collections/hubs-adapters`
- `/collections/docking-stations`
- `/collections/chargers-power`
- `/collections/accessories`
- Confirm:
  - collection hero renders
  - product cards render cleanly
  - support note remains present
  - no broken imagery path

### PDP

- `/products/usb-c-multimedia-hub`
- `/products/usb-c-travel-hub`
- `/products/usb-c-pro-dock`
- Confirm:
  - gallery and buy box render
  - specs render from structured data
  - compare section renders
  - compatibility renders
  - FAQ renders
  - add-to-cart remains usable

### Compare

- `/pages/compare`
- Confirm:
  - structured comparison-group heading/copy renders
  - three compare products render
  - recommendation labels render
  - compare imagery renders from owned or final assets

### Support

- `/pages/support`
- `/pages/downloads`
- `/pages/manuals`
- `/pages/compatibility`
- `/pages/faq`
- Confirm:
  - support hero renders
  - support imagery renders
  - structured support resources render
  - no fake resource fallback cards appear
  - no dead support links appear

### Utility routes

- `/cart`
- `/search`
- Confirm:
  - cart page loads
  - search page loads
  - no template errors

## 3. Navigation and global shell checks

- Announcement bar content is truthful
- Header contact/business detail is truthful
- Mega menu opens cleanly
- Desktop and mobile navigation tell the same IA story
- No `href="#"` dead links on touched surfaces

## 4. Source-of-truth checks

- Structured data wins where expected
- Empty states appear only when structured data is absent
- No hardcoded fallback content is competing with metaobjects/metafields
- Template-owned framing copy still supports, rather than overrides, structured content

## 5. Design-system checks

- Typography hierarchy is consistent
- Spacing rhythm is consistent
- Cards and panels feel like one system
- Motion remains subtle and consistent
- No arbitrary Tailwind values in changed authored files
- No inline styles in changed authored files
- No duplicated CSS block was introduced when a shared class would have worked

## 6. Mobile checks

At minimum verify:

- homepage
- one collection
- one PDP
- support hub
- compare

Confirm:

- no overflow or clipped content
- header/mobile drawer behavior is usable
- cards remain readable
- hero imagery crops cleanly

## 7. Commerce checks

- add to cart works on a core PDP
- cart line item renders correctly
- price display is correct
- compare to PDP to cart flow still works

## 8. Asset readiness checks

- Homepage hero uses owned or final curated asset
- Core PDPs use owned or final curated product assets
- Collections use owned or final curated family assets
- Compare uses matched compare assets
- Support uses owned or final support visuals
- No remote placeholder dependency remains on core brand surfaces

## 9. Release decision

Release is acceptable when:

- build and check pass
- required routes pass
- no source-of-truth regressions exist
- no fake business/trust content exists
- no dead placeholder links exist on reviewed routes
- asset state is acceptable for the intended release bar

If any of the above fails, release is blocked until corrected.
