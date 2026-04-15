# Phase 2 Blockers — Resolved
Date: 2026-04-15

---

| Fix | Status | Evidence |
|-----|--------|----------|
| Orphaned last card | **RESOLVED** | CSS already applied from prior session |
| Cart drawer (off-canvas AJAX) | **RESOLVED** | 6 new files, PDP ATC intercepted |
| Faceted collection filters | **RESOLVED** | Liquid sidebar built, awaits admin config |
| `shopify theme check` | **PASS** | 127 files inspected · 0 offenses |
| `npm run build` | **PASS** | Done in 969ms |

---

## Fix 1 — Orphaned Last Card

**Status:** Already resolved in prior visual polish sprint.

**Evidence:** `src/styles/theme.css` line 1344–1348:
```css
.collection-product-slot {
  @apply h-full;
  grid-column: span 1 !important;
  min-width: 0;
}
```

Items render inside `.collection-product-slot` wrappers (confirmed in
`sections/main-collection.liquid` line 329). The promo tile renders outside
`.collection-product-slot` and is unaffected.

**Behavior:** With 13 products in a 4-column grid → rows of 4 + 4 + 4 + 1.
The last card occupies 1/4 width; it does not stretch.

---

## Fix 2 — Cart Drawer

### Files created

| File | Purpose |
|------|---------|
| `snippets/cart-drawer.liquid` | Shell: `data-drawer`, `hidden`, `role="dialog"`, overlay, panel |
| `snippets/cart-drawer-items.liquid` | Line items list with qty stepper and remove button |
| `snippets/cart-drawer-empty.liquid` | Empty state with bag icon and Continue shopping |
| `snippets/cart-drawer-footer.liquid` | Shipping progress bar, subtotal, checkout CTA |
| `sections/cart-drawer-body.liquid` | Sections API registration for body refresh |
| `sections/cart-drawer-footer.liquid` | Sections API registration for footer refresh |
| `assets/cart-drawer.js` | EZCartDrawer: refresh/open public API, qty/remove handlers |

### Files modified

| File | Change |
|------|--------|
| `layout/theme.liquid` | Added `{% render 'cart-drawer' %}` + `cart-drawer.js` script before `</body>` |
| `sections/main-product.liquid` | ATC `.then()` now calls `window.refreshAndOpenCartDrawer()` instead of redirecting to `/cart` |
| `src/styles/theme.css` | ~250 lines of cart drawer CSS appended |

### Architecture

- Hooks into existing `openDrawer()` / `closeDrawer()` system in `assets/theme.js`
  (uses `data-drawer`, `data-drawer-panel`, `data-drawer-close` attributes — no duplication)
- After successful ATC: 700ms "Added!" state → Sections API refresh → drawer opens →
  350ms later → button resets to "Add to cart" via `setLoading(false)`
- Qty / remove: `data-cart-action="increase|decrease|remove"` delegated from `cart-drawer.js`
- Refresh via `GET /cart?sections=cart-drawer-body,cart-drawer-footer` → DOMParser extracts
  inner `.cart-drawer__body` and `.cart-drawer__footer` HTML
- Fallback: if `window.refreshAndOpenCartDrawer` unavailable → redirects to `/cart` (original behavior)
- Free shipping threshold: hardcoded at $100; update in `snippets/cart-drawer-footer.liquid` line 2

### Interactions verified logically
- ATC click → "Adding…" state → "Added!" → drawer slides in from right ✓
- Decrease/increase qty → Sections API refresh → DOM updates ✓
- Remove (qty=0) → item disappears; if last item → empty state renders ✓
- Checkout CTA → `/checkout` ✓
- Continue shopping → `data-cart-continue` → `closeDrawer()` → focus returns ✓
- Escape key → existing keydown handler in `theme.js` catches `[data-drawer]:not([hidden])` ✓
- Overlay click → `data-drawer-close` → `closeDrawer()` ✓

---

## Fix 3 — Faceted Collection Filters

### Files modified

| File | Change |
|------|--------|
| `sections/main-collection.liquid` | Admin config comment, layout wrapper, filter sidebar, toolbar |
| `src/styles/theme.css` | ~270 lines of filter sidebar and layout CSS appended |

### Architecture

**Collection layout restructure:**
```
container-shell
  collection-merch-layer (merch bar, family tabs, sort — unchanged)
  collection-layout (NEW — 2-col grid: 240px sidebar + 1fr main)
    aside.collection-filters (NEW — hidden when collection.filters.size = 0)
    div.collection-main (NEW)
      div.collection-filter-toolbar (NEW — product count, mobile toggle, active pills)
      div#collection-grid (existing — class simplified, mt removed to layout wrapper)
      nav (pagination — existing)
    /collection-main
  /collection-layout
/container-shell
```

**Filter sidebar features:**
- `<details>` accordion per filter group; first group and active groups open by default
- `list` / `boolean` type: checkbox options with count badges
- `price_range` type: min/max number inputs with apply button
- Active filter pills with `url_to_remove` links
- "Clear all (N)" link resets to `collection.url`
- Preserves sort order (`sort_by` hidden input in filter form)
- Auto-submits on checkbox change (JS inline at bottom of section)

**Mobile behavior:**
- `collection-filters` hidden via CSS at ≤ 989px
- "Filters" toggle button shown; toggles `.is-open` class → fixed overlay panel
- Body scroll locked while filter panel is open

**Admin config required:**
```
Shopify admin → Online Store → Navigation → Search & discovery → Filters
```
Without admin configuration, `collection.filters.size = 0`, the sidebar does not
render, and the collection grid displays full-width. **No broken layout without config.**

---

## Remaining Phase 2 Items (not resolvable by code)

| Item | Owner | Required action |
|------|-------|-----------------|
| Cart drawer — production test | Developer | Browser test: ATC → drawer → qty stepper → checkout |
| Faceted filters — admin config | Client / Developer | Configure filter groups in Shopify admin |
| AJAX paginated filtering | Future sprint | Current filter reloads the page (standard Shopify behavior) |
