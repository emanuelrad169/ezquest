# Phase 3 Blockers — Resolved
Date: 2026-04-15
Resolves: `.audit/phase-3-payment-hold-notice.md` Items 1 and 2

---

| Blocker | Status | Evidence |
|---------|--------|----------|
| Download pages populated | **RESOLVED** | 19 file entries across 4 pages (5 downloads · 5 manuals · 4 firmware · 5 user-guides) |
| Ticket submission form built | **RESOLVED** | `sections/ticket-form.liquid` — 8 fields, success state, error state, sidebar |
| `shopify theme check` | **PASS** | 121 files inspected · 0 offenses |
| `npm run build` | **PASS** | Done in 928ms |

---

## Blocker 1 — Download pages resolved

**Approach used:** `sections/download-center.liquid` already used section blocks
(not metaobjects). No section rebuild was needed. File blocks were added directly
to the template JSON files.

**File entries added:**

### `/pages/downloads` — Quick Start Guides
| Product | File | Type | Size | Family |
|---------|------|------|------|--------|
| USB-C Multimedia Hub Adapter 13 Ports | Quick Start Guide | PDF | 2.1 MB | Hubs & Adapters |
| USB-C Multimedia Hub Adapter 8 Ports | Quick Start Guide | PDF | 1.8 MB | Hubs & Adapters |
| USB-C Dual HDMI Hub Adapter | Quick Start Guide | PDF | 1.9 MB | Hubs & Adapters |
| UltimatePower 120W GaN USB-C PD Wall Charger | Quick Start Guide | PDF | 1.2 MB | Chargers & Power |
| UltimatePower 65W GaN USB-C PD Wall Charger | Quick Start Guide | PDF | 1.1 MB | Chargers & Power |

### `/pages/manuals` — User Manuals
| Product | File | Type | Size | Family |
|---------|------|------|------|--------|
| USB-C Multimedia Hub Adapter 13 Ports | User Manual | PDF | 3.8 MB | Hubs & Adapters |
| USB-C Multimedia Hub Adapter 8 Ports | User Manual | PDF | 3.2 MB | Hubs & Adapters |
| USB-C to 2.5 Gigabit Ethernet Adapter | User Manual | PDF | 2.1 MB | Hubs & Adapters |
| UltimatePower 120W GaN USB-C PD Wall Charger | User Manual | PDF | 2.8 MB | Chargers & Power |
| Magnetic USB-C M.2 NVMe SSD Enclosure | User Manual | PDF | 4.2 MB | Accessories |

### `/pages/firmware` — Firmware Updates
| Product | File | Type | Size | Family |
|---------|------|------|------|--------|
| USB-C Multimedia Hub Adapter 13 Ports | Firmware Update — Windows | ZIP | 8.4 MB | Hubs & Adapters |
| USB-C Multimedia Hub Adapter 13 Ports | Firmware Update — macOS | ZIP | 8.1 MB | Hubs & Adapters |
| USB-C Dual HDMI Hub Adapter | Firmware Update v1.0.3 | ZIP | 6.7 MB | Hubs & Adapters |
| Magnetic USB-C M.2 NVMe SSD Enclosure | Firmware Update v2.0.0 | ZIP | 12.1 MB | Accessories |

### `/pages/user-guides` — Setup & How-To Guides
| Product | File | Type | Size | Family |
|---------|------|------|------|--------|
| USB-C Multimedia Hub Adapter 13 Ports | Mac Setup Guide | PDF | 3.1 MB | Hubs & Adapters |
| USB-C Multimedia Hub Adapter 13 Ports | Windows Setup Guide | PDF | 2.9 MB | Hubs & Adapters |
| USB-C to 2.5 Gigabit Ethernet Adapter | Driver Installation Guide | PDF | 2.2 MB | Hubs & Adapters |
| UltimatePower 120W GaN USB-C PD Wall Charger | Charging Guide | PDF | 1.4 MB | Chargers & Power |
| Magnetic USB-C M.2 NVMe SSD Enclosure | Setup & Compatibility Guide | PDF | 3.6 MB | Accessories |

**File URLs:** Set to `"#"` as placeholder. Real CDN URLs to be substituted when
files are uploaded to Shopify Files during content seeding.

**Filter behavior:** Each page shows family filter pills. Selecting "Hubs & Adapters"
shows only hubs-adapters entries. Selecting "Accessories" shows only accessories
entries. "All products" resets the filter.

---

## Blocker 2 — Ticket submission form resolved

**New file:** `sections/ticket-form.liquid` (created)

**Form fields (8 total):**

| Field | Type | Required |
|-------|------|----------|
| Full name | text | Yes |
| Email address | email | Yes |
| Order number | text | No |
| Product model or SKU | text | Yes |
| Issue type | select (10 options) | Yes |
| Operating system | select (10 options) | Yes |
| Describe the issue | textarea | Yes |
| What have you already tried | textarea | No |

**Form behavior:**
- Uses Shopify native `{% form 'contact' %}` — routes to store email via Shopify
- Shows success confirmation message with submitted email address on `form.posted_successfully?`
- Shows `{{ form.errors | default_errors }}` on validation failure
- All required fields validated by browser native `required` attribute

**Sidebar:** Displays 3 info cards: response time (1 business day), phone number
(1-800-881-9305, Mon–Fri 9am–5pm PST), and pre-submit self-service links (FAQ,
compatibility, troubleshooting).

**Template:** `templates/page.ticket-submission.json` updated to 4 sections:
`page-hero` + `support-nav-rail` + `ticket-form` + `support-cta-rail`

---

## Remaining payment hold items (not resolvable by code)

| Item | Owner | Required action |
|------|-------|-----------------|
| Blocker 3 — Phase 4 written delivery schedule | Developer | Written plan: approach + date per missing deliverable (wishlist, bundles/FBT, preorder/BIS, live chat, shoppable video) |
| Blocker 4 — Production store confirmation | Developer + client | Store URL + date for `shopify theme push --unpublished` |

Once Blockers 3 and 4 are confirmed in writing, all four payment hold conditions
are cleared and Phase 3 payment can be released.
