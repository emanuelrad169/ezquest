# Pre-Delete Audit — Demo Product Cleanup
**Generated:** 2026-05-09  
**Status:** ⚠️ THEME REFERENCES FOUND — review §3 before proceeding

---

## Products to Delete

| # | ID | Handle | Title | Price | Images |
|---|-----|--------|-------|-------|--------|
| 1 | 8832352190662 | usb-c-pro-dock | USB-C Pro Dock | $199.00 | 0 |
| 2 | 8832352092358 | usb-c-travel-hub | USB-C Travel Hub | $69.00 | 0 |
| 3 | 8832352813254 | duraguard-stereo-audio-cable-90-degree | DuraGuard Stereo Audio Cable 90 Degree | $0.00 | 0 |
| 4 | 8832352878790 | superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack | SuperSpeed Gen 1 USB-C to USB-A Mini Adapter 2 Pack | $7.99 | 0 |

All 4 handles verified — match expected values. ✅

---

## §1 — Custom Metafields (auto-deleted with product)

All 4 products have the same 2 metafields (compare-widget data):
- `custom.compare_connector_type`
- `custom.compare_form_factor`

No content metafields (product_features, product_specifications, etc.) — none were seeded for these demo products. These are auto-deleted when the product is deleted. ✅

---

## §2 — Orphaned Metaobjects (manual cleanup required)

**ezquest_download** — 4 metaobjects reference the target products:

| Handle | Type | Linked Product ID | URL |
|--------|------|-------------------|-----|
| usb-c-travel-hub-windows-driver | ezquest_download | 8832352092358 | (none — "Available on request") |
| usb-c-travel-hub-firmware-updater | ezquest_download | 8832352092358 | (none — "Available on request") |
| usb-c-pro-dock-windows-driver | ezquest_download | 8832352190662 | (none — "Available on request") |
| usb-c-pro-dock-firmware-updater | ezquest_download | 8832352190662 | (none — "Available on request") |

All 4 have no file URL — they are the "Available on request" placeholder entries. Recommendation: **delete all 4** (Option A). After product deletion they are orphaned and serve no purpose.

**manual / firmware_version / user_guide** — 0 metaobjects reference the target products. ✅  
(The 6 manual + 3 firmware + 6 user_guide entries previously flagged are for USB-C Multimedia Hub / USB-C Travel Hub as a category, not by product GID. Those are separate placeholder entries and are NOT included in this cleanup.)

---

## §3 — Theme Code References ⚠️

**STOP CONDITION TRIGGERED.** Theme files reference `usb-c-pro-dock` and `usb-c-travel-hub`. 
Neither `duraguard-stereo-audio-cable-90-degree` nor `superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack` appear in any theme file.

### Category A — Safe after deletion (null-guarded, no action needed)

These use `!= blank` guards or `when` case branches that simply never fire after the product is gone:

| File | Lines | Pattern | Risk after delete |
|------|-------|---------|-------------------|
| sections/article-feed.liquid | 12–16 | `if all_products['usb-c-pro-dock'] != blank` | None — branch skipped |
| sections/product-story-grid.liquid | 47–104 | `elsif all_products['usb-c-pro-dock'] != blank` | None — branch skipped |
| sections/product-story-carousel.liquid | 59, 67 | `when 'usb-c-travel-hub'` / `when 'usb-c-pro-dock'` | None — case branch never reached |
| sections/main-product.liquid | 136, 142 | `when 'usb-c-travel-hub'` / `when 'usb-c-pro-dock'` | None — case branch never reached |
| sections/product-spec-table.liquid | 27, 31 | `when 'usb-c-travel-hub'` / `when 'usb-c-pro-dock'` | None — case branch never reached |

### Category B — Cosmetic degradation (| default: fallback, low severity)

These use a `| default:` filter so the hardcoded string renders even after deletion. The nav/list items remain but link to a URL that 301-redirects to the collection:

| File | Lines | Impact |
|------|-------|--------|
| sections/support-nav-grid.liquid | 45–46 | Nav grid still shows "USB-C Travel Hub" / "USB-C Pro Dock" entries (from default:). Links 301 → collection. |
| sections/compatibility-entry-list.liquid | 237–238 | Same — entries still appear with hardcoded title. |
| sections/main-collection.liquid | 53, 63 | `fallback_product_handles` string includes deleted handle. Fallback resolves blank → no image. Currently already blank (0 images). |

**Recommended fix (optional, low priority):** Remove the hardcoded handles from support-nav-grid and compatibility-entry-list, or replace with a real product handle.

### Category C — Needs substitution before deletion (MUST FIX)

These assign `usb-c-pro-dock` as `primary_handle` with no null guard and no images on the product. After deletion, `all_products['usb-c-pro-dock']` returns blank → the owned visuals render with blank image sources.

Since the products currently have **0 images**, these visuals are ALREADY blank/broken on the live site today. Deleting the product changes nothing visible. However, the dead handle reference is dead weight in the theme code.

| File | Line | Usage | Current state | After delete |
|------|------|-------|---------------|--------------|
| snippets/owned-hero-scene.liquid | 6 | `primary_handle = 'usb-c-pro-dock'` (hardcoded, no guard) | Renders blank (0 images) | Renders blank (product missing) |
| snippets/owned-collection-visual.liquid | 19 | `primary_handle = 'usb-c-pro-dock'` for docking-stations case | Renders blank (0 images) | Renders blank (product missing) |
| snippets/owned-support-visual.liquid | 23 | `primary_handle = 'usb-c-pro-dock'` for compatibility scene | Renders blank (0 images) | Renders blank (product missing) |
| sections/about-content.liquid | 35, 45, 86 | `render 'owned-product-visual', product_handle: 'usb-c-travel-hub'` / `'usb-c-pro-dock'` | Renders blank (0 images) | Renders blank (product missing) |

**Verdict: visually identical before and after deletion** because all 4 products have 0 images. The dead handle references are cosmetic theme debt, not a functional blocker.

**Recommended:** Replace with a real product handle that has images. Or remove the owned-visual call if the about-page/hero is not used.

---

## §4 — Collection Memberships (auto-removed on delete)

| Product ID | Collection ID | Collection handle |
|-----------|---------------|-------------------|
| 8832352190662 (pro-dock) | 342041755846 | docking-stations |
| 8832352092358 (travel-hub) | 342041723078 | hubs-adapters |
| 8832352813254 (audio-90deg) | 342041821382 | accessories |
| 8832352878790 (adapter-2pack) | 342041723078 | hubs-adapters |

Shopify removes collection memberships automatically on product delete. ✅  
After delete: hubs-adapters loses 2 products (travel-hub, adapter-2-pack), docking-stations loses 1 (pro-dock), accessories loses 1 (audio-90deg).

---

## §5 — Proposed Redirects

To be added to docs/ezq-redirects.csv and imported via Shopify Admin:

| From | To | Note |
|------|----|------|
| /products/usb-c-pro-dock | /collections/docking-stations | No real analog — redirect to collection |
| /products/usb-c-travel-hub | /collections/hubs-adapters | No real analog — redirect to collection |
| /products/duraguard-stereo-audio-cable-90-degree | /products/duraguard-stereo-audio-cable | Closest real analog |
| /products/superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack | /products/superspeed-gen-1-usb-c-to-usb-a-mini-adapter | Single-pack version |

---

## Summary / Go Decision

| Gate | Status | Notes |
|------|--------|-------|
| All 4 products verified by ID + handle | ✅ | Exact match |
| No content metafields to recover | ✅ | Only compare-widget metafields, auto-deleted |
| Metaobject orphans identified | ✅ | 4 ezquest_download entries — recommend delete |
| Theme references identified | ⚠️ | 11 files; all Category A/B are safe; Category C already renders blank today |
| No functional breakage expected | ✅ | All theme references either null-guarded or already broken (0 images) |
| Redirects prepared | ✅ | 4 rows ready for docs/ezq-redirects.csv |

**Assessment: safe to proceed.** The Category C theme references are dead weight today (products have 0 images → already blank on live site). Deletion changes nothing visible. Category B items degrade cosmetically but don't error. Post-delete cleanup sprint: replace `usb-c-pro-dock` handle in 4 theme files with a real docking-station product handle.

> **Awaiting explicit "go" before running --apply.**
