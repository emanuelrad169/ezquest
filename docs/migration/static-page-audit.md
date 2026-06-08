# Static Page Content Audit

**Audited:** 2026-05-06  
**Store:** ezquest-4.myshopify.com  
**Method:** Admin API body_html + template JSON inspection + section liquid review

---

## Summary

| Page | URL | Status | Action required |
| ---- | --- | ------ | --------------- |
| Our Story | /pages/our-story | ✅ Real content | None |
| About | /pages/about | ✅ Real content | None |
| Contact | /pages/contact | ✅ Real content | None |
| Where to Buy | /pages/where-to-buy | ⚠️ Retailer links stale | Client: confirm retailer list |
| Compare | /pages/compare | ✅ Real content | Optional: client can add more tables |
| Shipping & Returns | /pages/shipping-returns | ⚠️ Rates need confirmation | Client: confirm shipping rates + return window |
| Warranty | /pages/warranty | ❌ Placeholder | Client: provide warranty terms |

---

## Per-page detail

### ✅ /pages/our-story

**How content is delivered:** `sections/our-story.liquid` has the brand story hardcoded in the Liquid template (not in page body_html). The section renders hero copy, three value-pillar cards, stats (30+ years, 100+ products, 2-year warranty), and an image-backed timeline block.

**Page body_html:** 30 words of developer scaffolding ("This page should connect the brand story..."). Not user-visible — the page template overrides it.

**Verdict:** No action needed. If the client wants to revise the brand story copy (headline, pillar text, hero subtitle), they edit via Admin → Themes → Customize → Our Story page.

---

### ✅ /pages/about

**How content is delivered:** `sections/about` section, settings-driven. Section settings contain:
- Kicker: "Est. 1994 · Lake Forest, California"
- Heading: "Built for people who connect everything."
- Body: "Since 1994, EZQuest has made it simpler to connect the devices that matter most — with products built to last and a team that stands behind every one."
- Stats: 30+ years / 100+ products / 2yr warranty
- Three pillar cards with real copy (Built to last, Works with everything, Real support)
- CTA: "Explore what we make" → /collections/all

**Page body_html:** 32 words of developer note. Not user-visible.

**Verdict:** No action needed. All visible content is real and complete.

---

### ✅ /pages/contact

**How content is delivered:** Three sections — page-hero ("Get help now"), info-card-grid (three request type cards: Product help, Order help, Warranty help), contact-form-panel (Shopify native form with sidebar guidance).

**Verdict:** No action needed. Form is functional. Copy is clear and complete.

---

### ⚠️ /pages/where-to-buy

**How content is delivered:** `sections/where-to-buy` section with 16 retailer blocks (logos, names, URLs).

**Retailer list as configured:**

| Retailer | Category | URL status |
| -------- | -------- | ---------- |
| Amazon | US retailer | ✓ active |
| Walmart | US retailer | ✓ active |
| B&H Photo | US retailer | ✓ active |
| Micro Center | US retailer | ✓ active |
| Newegg | US retailer | needs verify (old URL format) |
| Rakuten | US retailer | needs verify |
| TheMacRanch | US retailer | needs verify |
| DI-NO Computers | US retailer | needs verify |
| Small Dog Electronics | US retailer | needs verify |
| Adkom (Lebanon) | Intl reseller | needs verify |
| Digits (Kuwait) | Intl reseller | needs verify |
| Macway (France) | Intl reseller | needs verify |
| iMachines (Bahrain/KSA) | Intl reseller | needs verify |
| Quintec (Chile) | Intl distributor | needs verify |
| iCongroup (Israel) | Intl distributor | needs verify |

**Action needed from client:** Confirm which retailers are still authorized and actively stocking EZQuest. Remove or update any that are no longer partners. All retailer entries can be updated via Admin → Themes → Customize → Where to Buy page without touching code.

---

### ✅ /pages/compare

**How content is delivered:** Page-hero + product-compare-table section with 4 actual products (45W / 65W / 90W / 120W GaN chargers) and 6 spec rows (wattage, USB-C ports, USB-A ports, technology, best for, warranty).

**Verdict:** No action needed — the table is real and complete for the charger lineup. Optionally, the client can add more comparison tables (hub lineup, etc.) via the theme editor. If they want to, it's an admin-only change.

---

### ⚠️ /pages/shipping-returns

**How content is delivered:** `sections/shipping-returns.liquid` is hardcoded in the Liquid template (not settings-driven). Contains:

**US shipping rates as currently set:**

| Order total | Rate | Delivery |
| ----------- | ---- | -------- |
| Under $25 | $4.97 | 2–7 business days |
| $25–$50 | $6.54 | 2–7 business days |
| $50–$100 | $7.97 | 2–7 business days |
| Over $100 | Free | 2–7 business days |

**International shipping rates as currently set:**

| Order total | Rate | Delivery |
| ----------- | ---- | -------- |
| Under $25 | $14.99 | 5–15 days |
| $25–$50 | $19.99 | 5–15 days |
| $50–$100 | $23.99 | 5–15 days |
| Over $250 | $35.99 | 5–15 days |

**Other claims in the section:**
- Free shipping threshold: $100 (US)
- Return window: 30 days
- Warranty: 2 years on everything

**Action needed from client:** Confirm the rates, thresholds, and timelines above are accurate. If any need to change, a dev edit to `sections/shipping-returns.liquid` is required (they are hardcoded, not settings-driven). **This is a factual accuracy issue — incorrect shipping rates on a live store cause order disputes.**

---

### ❌ /pages/warranty

**How content is delivered:** Four sections — page-hero, info-card-grid, main-page (renders page body_html), support-cta-rail.

**What's real:**
- Page-hero heading: "Warranty guidance that keeps the next step clear"
- CTA rail: links to /pages/troubleshooting and /pages/contact

**What's placeholder:**

Card 1 (Coverage):
> "Highlight what coverage is intended to include, along with key exclusions customers should know."

Card 2 (Claims):
> "Explain what customers should prepare, including proof of purchase and issue details."

Card 3 (Support):
> "Clarify when troubleshooting or compatibility review should happen before a claim moves forward."

Page body_html (renders in the main-page section):
> "Use this page to explain coverage, exclusions, and the claim process clearly."

**Action required from client — priority HIGH:**

The warranty page is linked from the contact page and product pages. Launching with placeholder card text is damaging — it erodes trust exactly when a customer needs assurance.

Client must provide:
1. **Card 1 copy:** What does the 2-year limited warranty actually cover? What is excluded?
2. **Card 2 copy:** What does the customer need to file a claim? (proof of purchase? SKU? photo?)
3. **Card 3 copy:** Confirm or adjust (currently says to try troubleshooting first)
4. **Page body:** Full warranty terms — the legal language, regional notes, and claim process details that render below the cards

If the client cannot provide warranty copy within 5 days of launch, recommend unpublishing /pages/warranty and removing its link from the contact/support pages, with a redirect to /pages/contact for warranty inquiries.

---

## Client responses (track here)

| Page | Response received | Decision | Implemented |
| ---- | ----------------- | -------- | ----------- |
| Where to Buy | — | — | — |
| Shipping & Returns | — | — | — |
| Warranty | — | — | — |

---

## If client doesn't respond

Per project protocol:
- **5 business days:** Follow up
- **10 business days:** Unpublish the page, add 301 redirect, notify client

Redirects to add if unpublished:

| Page to unpublish | Redirect target |
| ----------------- | --------------- |
| /pages/warranty | /pages/contact |
| /pages/where-to-buy | /collections/all |
