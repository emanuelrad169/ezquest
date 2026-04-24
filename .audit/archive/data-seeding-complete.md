# Data Seeding Report
Date: 2026-04-15
Store: ezquest-4.myshopify.com

---

## Summary

| Item | Status | Count |
|------|--------|-------|
| Decision guide entries | COMPLETE | 6/6 |
| Compatibility entries | COMPLETE | 100 (pre-seeded) |
| Spec rows | COMPLETE | 100 (pre-seeded) |
| Downloads metaobjects | COMPLETE | 88 (pre-seeded) |
| Manuals metaobjects | COMPLETE | 6 (pre-seeded) |
| Firmware metaobjects | COMPLETE | 3 (pre-seeded) |
| User guide metaobjects | COMPLETE | 6 (pre-seeded) |
| FAQ items | COMPLETE | 9 (pre-seeded) |
| Comparison groups | COMPLETE | 4 (pre-seeded) |
| Use cases | COMPLETE | 4 (pre-seeded) |
| Download template file URLs | PENDING — client upload required | 20 placeholders |
| Product spec metafields (linked) | COMPLETE | 85 product links |

---

## Decision guide entries (6/6)

All 6 entries exist in store, sorted by `sort_order`:

| # | Role label | Title | Handle |
|---|-----------|-------|--------|
| 10 | Everyday desk | Balanced everyday setup | balanced-everyday-setup |
| 20 | Travel / meetings | Portable travel setup | portable-travel-setup |
| 30 | Workstation | Desk-ready workstation | desk-ready-workstation |
| 40 | Power first | Charging and power layer | charging-and-power-layer |
| 50 | Finish the setup | Cables and accessories | cables-and-accessories |
| 60 | Get help | Not sure yet? | not-sure-yet |

Entries 1–3 were pre-seeded. Entries 4–6 created this session via GraphQL mutation.

---

## Download page file URLs — CLIENT ACTION REQUIRED

The download-center section renders from static template blocks (not metaobjects).
All 20 file blocks currently have `file_url: "#"` placeholders.
These cannot be populated until real PDF/ZIP files are uploaded to the store.

**Required action:**
1. Go to: Shopify admin → Content → Files → Upload
2. Upload each file listed below
3. Copy the CDN URL for each uploaded file
4. Update the `file_url` value in the corresponding template JSON
5. Run: `shopify theme push --store=ezquest-4.myshopify.com --only templates/`

### Files needed per template

**templates/page.downloads.json** (6 files — Quick Start Guides)

| Block | Product | File | Size |
|-------|---------|------|------|
| file_d1 | USB-C Multimedia Hub Adapter 13 Ports | Quick Start Guide | PDF 2.1 MB |
| file_d2 | USB-C Multimedia Hub Adapter 8 Ports | Quick Start Guide | PDF 1.8 MB |
| file_d3 | USB-C Dual HDMI Hub Adapter | Quick Start Guide | PDF 1.9 MB |
| file_d4 | UltimatePower 120W GaN USB-C PD Wall Charger | Quick Start Guide | PDF 1.2 MB |
| file_d5 | UltimatePower 65W GaN USB-C PD Wall Charger | Quick Start Guide | PDF 1.1 MB |
| file_d6 | Magnetic USB-C M.2 NVMe SSD Enclosure | Quick Start Guide | PDF 1.6 MB |

**templates/page.manuals.json** (5 files — User Manuals)

| Block | Product | File | Size |
|-------|---------|------|------|
| file_m1 | USB-C Multimedia Hub Adapter 13 Ports | User Manual | PDF 3.8 MB |
| file_m2 | USB-C Multimedia Hub Adapter 8 Ports | User Manual | PDF 3.2 MB |
| file_m3 | USB-C to 2.5 Gigabit Ethernet Adapter | User Manual | PDF 2.1 MB |
| file_m4 | UltimatePower 120W GaN USB-C PD Wall Charger | User Manual | PDF 2.8 MB |
| file_m5 | Magnetic USB-C M.2 NVMe SSD Enclosure | User Manual | PDF 4.2 MB |

**templates/page.firmware.json** (4 files — Firmware ZIPs)

| Block | Product | File | Size |
|-------|---------|------|------|
| file_f1 | USB-C Multimedia Hub Adapter 13 Ports | Firmware Update — Windows | ZIP 8.4 MB |
| file_f2 | USB-C Multimedia Hub Adapter 13 Ports | Firmware Update — macOS | ZIP 8.1 MB |
| file_f3 | USB-C Dual HDMI Hub Adapter | Firmware Update | ZIP 6.7 MB |
| file_f4 | Magnetic USB-C M.2 NVMe SSD Enclosure | Firmware Update | ZIP 12.1 MB |

**templates/page.user-guides.json** (5 files — Setup Guides)

| Block | Product | File | Size |
|-------|---------|------|------|
| file_u1 | USB-C Multimedia Hub Adapter 13 Ports | Mac Setup Guide | PDF 3.1 MB |
| file_u2 | USB-C Multimedia Hub Adapter 13 Ports | Windows Setup Guide | PDF 2.9 MB |
| file_u3 | USB-C to 2.5 Gigabit Ethernet Adapter | Driver Installation Guide | PDF 2.2 MB |
| file_u4 | UltimatePower 120W GaN USB-C PD Wall Charger | Charging Guide | PDF 1.4 MB |
| file_u5 | Magnetic USB-C M.2 NVMe SSD Enclosure | Setup & Compatibility Guide | PDF 3.6 MB |

---

## Product structure — all 60 products audited

60 products total. Navigation audit shows 59/60 with correct category and use case assignments.

**Fully linked (all 16 metafields):**
- usb-c-multimedia-hub
- usb-c-travel-hub
- usb-c-pro-dock

**Content seeded this session (85 links updated):**
Compare fields linked for 9 charger/cable products.
Use cases linked for 13 hub/charger/cable products.
Starter content (spec_rows, manuals, downloads, firmware, user_guides, faq) linked for top 3 hub products.

**Partially linked (missing: manuals, firmware, user_guides, faq_items):**
Most accessories and cables — these fields require additional metaobject entries
to be created for those product SKUs.

---

## Verify in browser (after password removed)

| Page | What to check |
|------|---------------|
| /pages/help-me-choose | 6 cards render with role label, title, summary, and 2 CTA links |
| /pages/compare | Comparison columns visible (4 groups seeded) |
| /pages/compatibility | Entries visible (100 entries seeded) |
| /pages/downloads | File rows present (empty state until URLs populated) |
| /products/usb-c-multimedia-hub | Spec table renders with real spec_row data |
| /products/usb-c-pro-dock | Same — linked to spec data |
| /pages/faq | 9 FAQ items render |
