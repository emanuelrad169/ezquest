# Admin Configuration Report
Date: 2026-04-15
Store: ezquest-4.myshopify.com (internal: 07h11y-cz.myshopify.com)
API version: 2026-01

---

## Configuration status

| Item | Status | Detail |
|------|--------|--------|
| API access | COMPLETE | Store: EZQuest, plan: basic |
| Metaobject definitions | COMPLETE | 11/11 exist |
| Product metafield definitions | COMPLETE | 20/20 exist |
| Shopify pages | COMPLETE | 19 pages present (18 required + data-sharing-opt-out) |
| Collections | COMPLETE | 4 seeded (hubs-adapters, docking-stations, chargers-power, accessories) |
| Structured content | COMPLETE | 85 product metafield links updated |
| Blogs | COMPLETE | resources + news blogs present |
| Navigation menus | MANUAL REQUIRED | Menus seed skipped — see below |
| Collection filters | MANUAL REQUIRED | Requires Search & Discovery app config |
| Social sharing image | MANUAL REQUIRED | No image uploaded yet |
| Store password | MANUAL REQUIRED | Password protection is ON — disable before launch |

---

## Metaobject definitions (11/11 exist)

| Type | GID |
|------|-----|
| ezquest_spec_row | gid://shopify/MetaobjectDefinition/14689599686 |
| ezquest_manual | gid://shopify/MetaobjectDefinition/14689665222 |
| ezquest_download | gid://shopify/MetaobjectDefinition/14689861830 |
| ezquest_firmware | gid://shopify/MetaobjectDefinition/14882734278 |
| ezquest_user_guide | gid://shopify/MetaobjectDefinition/14882767046 |
| ezquest_compatibility_entry | gid://shopify/MetaobjectDefinition/14689894598 |
| ezquest_troubleshooting_item | gid://shopify/MetaobjectDefinition/14882799814 |
| ezquest_use_case | gid://shopify/MetaobjectDefinition/14882832582 |
| ezquest_comparison_group | gid://shopify/MetaobjectDefinition/14689927366 |
| ezquest_decision_guide_entry | gid://shopify/MetaobjectDefinition/14882865350 |
| ezquest_faq_item | gid://shopify/MetaobjectDefinition/14689960134 |

---

## Metaobject entry counts

| Type | Entries |
|------|---------|
| ezquest_spec_row | 100 |
| ezquest_download | 88 |
| ezquest_compatibility_entry | 100 |
| ezquest_manual | 6 |
| ezquest_user_guide | 6 |
| ezquest_firmware | 3 |
| ezquest_faq_item | 9 |
| ezquest_use_case | 4 |
| ezquest_comparison_group | 4 |
| ezquest_decision_guide_entry | 3 |
| ezquest_troubleshooting_item | 4 |

---

## Product linkage status

Fully linked (all 16 structured fields):
- usb-c-multimedia-hub
- usb-c-travel-hub
- usb-c-pro-dock

Partially linked (missing: manuals, firmware, user_guides, faq_items for most):
- pro-series-usb-c-5in1-hub — also missing compare fields
- duraguard-usb-c-to-usb-c-charge-and-sync-cable
- duraguard-usb-c-to-usb-a-charge-and-sync-cable
- duraguard-stereo-audio-cable — also missing compare fields
- duraguard-stereo-audio-cable-90-degree — fully unlinked (no metadata)
- superspeed-gen-1-usb-c-to-usb-a-mini-adapter — also missing compare fields
- superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack — fully unlinked
- ultraslim-wall-charger-dual-usb-c-70w
- worldtravel-65w-gan-5-port-pd-wall-charger
- worldtravel-35w-gan-5-port-pd-wall-charger
- 65w-gan-usb-c-pd-wall-charger
- ultimatepower-90w-gan-usb-c-pd-wall-charger
- 45w-gan-usb-c-pd-wall-charger
- ultimatepower-120w-gan-usb-c-pd-wall-charger

Note: 60 total products audited via navigation audit — 59 have correct category/use case assignments.
One conflict: duraguard-usb-c-to-usb-a-charge-and-sync-cable (current: balanced-everyday, desired: portable).

---

## Shopify pages (19 present)

All 18 required pages confirmed present:
about, compare, compatibility, contact, cookie-policy, downloads, faq, firmware,
help-me-choose, manuals, our-story, shipping-returns, support, ticket-submission,
troubleshooting, user-guides, warranty, where-to-buy

Additional: data-sharing-opt-out (present, not required by theme)

---

## Collections (4)

| Handle | Title |
|--------|-------|
| hubs-adapters | Hubs & Adapters |
| docking-stations | Docking Stations |
| chargers-power | Chargers & Power |
| accessories | Cables & Accessories |

---

## Manual tasks remaining

### 1. Disable store password (REQUIRED before launch)
Admin → Online Store → Preferences → Password protection → Disable
Password is currently ON — blocks all visitor access.

### 2. Navigation menus (REQUIRED for mega menu and footer)
Admin → Online Store → Navigation
Create or verify these menus with correct handles:

**main-menu** — used by mega menu section
- Shop → /collections
- Help Me Choose → /pages/help-me-choose
- Compare → /pages/compare
- Support → /pages/support
- Resources → /blogs/resources
- About → /pages/about

**footer** — used by footer section
- About, Our Story, Where to Buy, Resources, Policy pages

**support-nav** — used by support hub navigation
- Support, FAQ, Downloads, Manuals, Firmware, User Guides,
  Compatibility, Troubleshooting, Warranty, Contact, Submit a Ticket

### 3. Collection filters (REQUIRED for PLP filter sidebar)
Admin → Online Store → Navigation → Search & discovery → Filters
Add filter groups per collection:
- Product type (list)
- Price range (price_range)
- Connectivity: USB-C, Thunderbolt, USB-A (list)
- Ports: 4-port, 7-port, 8-port, 13-port (list)
- Compatibility: Mac, Windows, iPad (list)

### 4. Social sharing image (recommended before launch)
Admin → Content → Files → Upload 1200×630px share image
Admin → Online Store → Themes → Customize → Theme settings → Social sharing → set share_image

### 5. Missing policies (Terms of Service, Refund Policy)
Admin → Settings → Policies
Only Privacy Policy currently exists. Add:
- Terms of Service
- Refund Policy
- Shipping Policy (optional — page exists at /pages/shipping-returns)

---

## Blogs / articles

| Blog | Handle |
|------|--------|
| Resources | resources |
| News | news |

Note: Blog `resources` exists. Article seed failed for `how-to-choose-the-right-usb-c-hub-for-your-desk-setup`
because handle is already taken — article already exists.

---

## Theme inventory

| Theme | Role | ID |
|-------|------|----|
| EZQuest/main | live | 149895643334 |
| EZQuest v1.0 — 2026-04-15 | unpublished | 150294855878 |
| EZQuest Phase 4 Preview | unpublished | 149914190022 |
| Development | development | 149896921286 |
| Horizon | unpublished | 149886468294 |

**Publish command (after QA passes):**
```
shopify theme publish --store=ezquest-4.myshopify.com --theme=150294855878
```

---

## Next steps before Phase 3 payment can be released

1. [ ] Disable store password → run browser QA
2. [ ] Verify/create navigation menus
3. [ ] Configure collection filters
4. [ ] Upload social sharing image
5. [ ] Add missing policies (Terms of Service, Refund Policy)
6. [ ] Link remaining product metafields for accessories / cables / chargers
7. [ ] Publish theme: `shopify theme publish --store=ezquest-4.myshopify.com --theme=150294855878`
