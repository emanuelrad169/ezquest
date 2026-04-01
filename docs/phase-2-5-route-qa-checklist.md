# Phase 2.5 Route QA Checklist

Use this checklist after every Phase 2.5 chunk to confirm the local preview is still healthy and the key storefront routes are rendering against the real EZQuest store preview.

## Run

1. Start preview:
   - `npm run dev`
2. Run the route smoke test:
   - `npm run qa:routes`
   - This uses the shell script at [scripts/dev/route-qa.sh](/Applications/MAMP/htdocs/EZQuest/scripts/dev/route-qa.sh), so it mirrors the same `curl`-based checks we use for manual QA.

## Expected Result

- Every route should return `200`.
- No route should redirect unexpectedly.
- No route should render an obvious error page, blank shell, or empty-state where seeded structured data is expected.

## Required Routes

### Home + collection entry
- `/`
  - Homepage loads with hero, category entry, support band, and FAQ.
- `/collections/hubs-adapters`
  - Collection page loads and shows collection hero plus product grid.

### Core PDP routes
- `/products/usb-c-multimedia-hub`
  - PDP loads, add-to-cart form is present, structured spec/compatibility/FAQ content renders.
- `/products/usb-c-travel-hub`
  - PDP loads, product-specific support/compatibility/FAQ renders.
- `/products/usb-c-pro-dock`
  - PDP loads, product-specific support/compatibility/FAQ renders.

### Compare + support system
- `/pages/compare`
  - Compare page loads, structured comparison-group heading/copy renders, three core products appear.
- `/pages/downloads`
  - Downloads page loads, real structured downloads render, no placeholder `#` links.
- `/pages/manuals`
  - Manuals page loads, real structured manuals render, no placeholder `#` links.
- `/pages/compatibility`
  - Compatibility page loads, structured compatibility entries render, no fake fallback cards.
- `/pages/faq`
  - FAQ page loads, structured FAQ items render, no generic fallback FAQ wall.
- `/pages/support`
  - Support hub loads with clear support destinations and no broken support actions.

### Utility routes
- `/cart`
  - Cart page loads and remains usable after add-to-cart.
- `/search`
  - Search page loads without template or rendering errors.

## Manual Spot Checks

After the route script passes, confirm these once per chunk when the touched area is relevant:

- Header/announcement surfaces remain truthful.
- No `href="#"` links appear on touched routes.
- Structured data wins when present.
- Empty states only appear when structured data is actually absent.
- No layout regression on the touched routes.
