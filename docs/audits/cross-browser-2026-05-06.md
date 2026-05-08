# Cross-Browser Test — 2026-05-06

**Status:** Pending — run after checkout test, before DNS cutover.

---

## Scope

### Browsers

| Browser | Version | Priority |
|---------|---------|---------|
| Chrome (macOS) | latest | Verified throughout dev |
| Safari (macOS) | latest | **Required** — most iOS users |
| Firefox | latest | Required |

Mobile viewports can be covered via Chrome DevTools device emulation. Real device testing on iPhone preferred for Safari.

### Viewports

| Viewport | Width | Test method |
|----------|-------|-------------|
| Desktop | 1920×1080 | Native |
| Laptop | 1280×800 | Native or DevTools |
| Tablet | 1024×768 | Chrome DevTools |
| Mobile | 390×844 (iPhone 14) | Chrome DevTools or real device |

### Pages to test

- [ ] Home (`/`)
- [ ] PDP (`/products/magnetic-usb-c-m-2-nvme-ssd-enclosure`)
- [ ] Collection (`/collections/hubs-adapters`)
- [ ] Cart (add item, open drawer)
- [ ] Search (`/search?q=hub`)
- [ ] Support / Downloads (`/pages/downloads`)
- [ ] Compatibility (`/pages/compatibility` if live)

---

## What to check on each page/browser combination

### Layout
- [ ] No horizontal scroll on mobile
- [ ] Grid columns collapse correctly at breakpoints
- [ ] Sticky header (nav) stays in place while scrolling
- [ ] Footer renders correctly at all widths

### Typography
- [ ] Body font loads (no FOUT flash visible after load)
- [ ] Headings at correct sizes on mobile
- [ ] Long product titles don't overflow card containers

### Interactivity
- [ ] Navigation menu opens/closes on mobile
- [ ] Hover states on buttons (note: touch devices should not show lingering hover after tap)
- [ ] Accordion expand/collapse (FAQ, specs)
- [ ] Variant selector on PDP switches images correctly
- [ ] Add to Cart updates cart icon count

### Safari-specific checks
- [ ] `position: sticky` header works correctly (Safari has known bugs with sticky + overflow)
- [ ] `font-feature-settings` and custom font weights render correctly
- [ ] `aspect-ratio` on images respected
- [ ] Input elements (search, contact form) not over-styled by Safari
- [ ] No `-webkit-` prefix missing for any visual feature

### Forms
- [ ] Contact form at `/pages/contact` submits successfully
- [ ] Search input focuses on tap without page zoom (font-size ≥ 16px on input)

### Amazon reviews widget
- [ ] Stars render on PDP for products with Amazon data seeded
- [ ] External link icon visible and accessible

---

## Issue log

Record each issue found with severity:

| Browser | Viewport | Page | Element | Issue | Severity | Fixed |
|---------|---------|------|---------|-------|---------|-------|
| | | | | | | |

**Severity levels:**
- **Blocker** — breaks core user flow (checkout, navigation, ATC)
- **Minor** — visible but doesn't block usage (alignment off by a few px, wrong color on one state)
- **Cosmetic** — only visible on close inspection, no functional impact

---

## Pass criteria

No **Blocker** issues. Minor and cosmetic issues documented, triaged, and prioritized for post-launch sprint.

---

## Tester sign-off

**Tester:**  
**Date:**  
**Browsers tested:**  
**Outcome:** Pass / Fail (with blockers) / Pass (with minor issues documented)  
**Blocker count:** 0  
**Minor count:**  
**Cosmetic count:**
