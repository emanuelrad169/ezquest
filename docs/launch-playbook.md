# EZQuest Launch Playbook
**Target: ezq.com production cutover**
Last updated: 2026-05-19

---

## Pre-launch gate: all items must be ✅ before T-0

### Legal / Compliance
- [ ] Cookie banner tested: appears on first visit, hides on Accept all / Essential only
- [ ] GA4 DebugView confirms `analytics_storage: denied` before accept, `granted` after
- [ ] Privacy policy live at `/policies/privacy-policy` and linked from footer + cookie banner
- [ ] Terms of Service live at `/policies/terms-of-service` and linked from footer
- [ ] Refund policy live at `/policies/refund-policy`
- [ ] Shopify admin → Settings → Customer privacy → Cookie banner → enabled for EU/UK

### Technical
- [ ] `npm run build:css` passes — no errors
- [ ] `shopify theme check` — 0 offenses
- [ ] All metafields populated on top 20 SKUs (key_features, warranty_years, amazon_asin)
- [ ] QR code redirects imported (Admin → Online Store → URL Redirects); 5+ physically scanned
- [ ] GA4 measurement ID set in theme settings; events visible in DebugView
- [ ] Email templates branded (order confirmation, shipped, welcome; tested with real order)
- [ ] SSL certificate active on production domain
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] Robots.txt allows indexing (no `Disallow: /` on live store)

### Performance
- [ ] Lighthouse mobile performance ≥ 85 on homepage, PDP, collection
- [ ] Lighthouse SEO ≥ 95
- [ ] Lighthouse accessibility ≥ 90
- [ ] LCP ≤ 2.5s on homepage and top PDP
- [ ] CLS ≤ 0.1

### Business
- [ ] Inventory counts accurate
- [ ] Tax settings configured for US shipping zones
- [ ] Shipping rates configured (free over $100)
- [ ] Customer service team briefed on return/warranty flow
- [ ] support@ezq.com forwards to correct inbox
- [ ] Test order completed end-to-end with real card

---

## Cross-browser QA matrix

Run this checklist for each browser/device before T-0.

### Browsers

| | Chrome Mac | Chrome Win | Safari Mac | Firefox Mac | Edge Win | Safari iOS | Chrome Android |
|---|---|---|---|---|---|---|---|
| Home loads cleanly | | | | | | | |
| Mega-menu opens | | | | | | | |
| Hero slider works | | | | | | | |
| PDP gallery thumbs | | | | | | | |
| Add to cart → drawer | | | | | | | |
| Qty adjust in drawer | | | | | | | |
| Checkout loads | | | | | | | |
| /account/login works | | | | | | | |
| Search results | | | | | | | |
| Mobile hamburger | | | | | | | |
| Cookie banner | | | | | | | |
| Newsletter form | | | | | | | |
| Contact form | | | | | | | |

### Devices (physical or BrowserStack)
- iPhone 14 Pro — Safari
- iPhone SE — Safari (smallest viewport)
- Pixel 7 — Chrome
- Galaxy S24 — Chrome
- iPad — Safari

---

## Launch playbook

### T-24h
- [ ] Run Lighthouse audit on: `/`, `/collections/hubs-adapters`, top PDP, `/search`
- [ ] Final cross-browser QA pass (matrix above)
- [ ] `git tag v1.0-launch && git push origin v1.0-launch`
- [ ] Export Shopify theme backup: Admin → Online Store → Themes → ⋯ → Download
- [ ] Verify all pre-launch gates above are ✅
- [ ] Pull DNS provider credentials for ezq.com
- [ ] Draft communications (see T-2h)

### T-2h
- [ ] Customer service team briefed and standing by
- [ ] Social media announcement post ready (scheduled for T+1h)
- [ ] Launch email to existing customers drafted and scheduled for T+2h
- [ ] Helpdesk macros loaded: return flow, warranty claim, order tracking, password reset
- [ ] Confirm Shopify plan supports custom domain + SSL

### T-0: Cutover

Execute in this order:

```
1. Shopify admin → Online Store → Domains → Connect existing domain → ezq.com
2. Set ezq.com as primary domain
3. In DNS provider: update A record to 23.227.38.65 (Shopify IP)
   Update CNAME www → shops.myshopify.com
4. Shopify admin → Online Store → Preferences → disable password protection
5. Enable URL redirect map (Admin → Online Store → URL Redirects → Import)
```

SSL auto-provisions within ~15 min of DNS propagation. Do not mark launch complete until HTTPS works.

### T+1h
- [ ] Verify DNS propagated: `dig ezq.com +short` returns `23.227.38.65`
- [ ] Verify SSL: `curl -I https://ezq.com` returns `HTTP/2 200`
- [ ] Check https://www.whatsmydns.net/#A/ezq.com — green globally
- [ ] Complete a test purchase with real credit card (can refund immediately)
- [ ] GA4 DebugView shows live events (page_view, view_item on PDP)
- [ ] Submit sitemap: Google Search Console → Sitemaps → Add `/sitemap.xml`
- [ ] Submit sitemap: Bing Webmaster Tools → Sitemaps
- [ ] Send social announcement

### T+24h
- [ ] Revenue tracking reviewed in Shopify Analytics
- [ ] Customer service ticket volume checked — triage anything critical
- [ ] Core Web Vitals in GA4 → Reports → Tech checked
- [ ] Google Search Console → Coverage tab for indexing errors
- [ ] Bug reports triaged: severity 1 = patch same day, severity 2 = 24h, severity 3 = next sprint

### T+7d
- [ ] Weekly review: conversion rate, AOV, bounce rate, top exit pages
- [ ] Cart abandonment rate reviewed — trigger email sequence if > 70%
- [ ] First post-launch patch deployed (any Sev-1/2 bugs)
- [ ] Next iteration scope defined

---

## Post-launch monitoring

### Dashboards to check daily
| Signal | Where | Alert threshold |
|---|---|---|
| Revenue | Shopify Analytics → Sales | –50% day-over-day |
| Conversion rate | GA4 → Conversions | –30% day-over-day |
| Checkout errors | Shopify → Orders (failed) | Any spike |
| Core Web Vitals | GA4 → Tech → Web vitals | LCP > 2.5s or CLS > 0.1 |
| Search queries | Google Search Console | Any 5xx or coverage drops |
| Ticket volume | Support inbox | > 2× baseline |

### Setup GA4 alerts
Go to GA4 → Admin → Custom insights → Create:
1. Conversions drop > 30% vs previous period
2. `search_no_results` event count spikes (indicates UX gap)
3. Sessions with errors spike

### Shopify notifications
Admin → Settings → Notifications: ensure all order + refund notifications route to the right inbox.

---

## Rollback plan

### Severity 1 — Site broken or checkout failing
**Target resolution: < 30 min**

```
1. Enable password protection immediately:
   Shopify admin → Online Store → Preferences → Enable password

2. If DNS already propagated and legacy site available:
   Revert DNS A record to legacy IP

3. Roll back theme:
   git checkout v1.0-launch~1   # last known good commit
   shopify theme push --store=[store].myshopify.com --unpublished
   # then publish from admin

4. Communicate via email/social: "We're performing maintenance"
5. Root-cause and redeploy — target < 4h total downtime
```

### Severity 2 — Feature broken, site usable
**Target resolution: < 24h**

```
1. Disable broken feature via theme settings (section visibility or feature flag)
2. Note in Shopify theme settings which section is hidden and why
3. Patch in a new unpublished theme, QA, publish
4. Proactive comms to affected customers if purchase flow impacted
```

### Severity 3 — Cosmetic only
```
1. Log in docs/post-launch-bugs.md
2. Include in next scheduled deployment (weekly cadence)
```

---

## Admin-only setup items (cannot be done from theme files)

These require manual steps in Shopify admin and third-party dashboards.

### Cookie consent
- Admin → Settings → Customer privacy → Cookie banner → Enable for EU, UK, EEA
- The theme's own banner handles all other visitors via `cookie-consent.js`

### Privacy Policy + Terms of Service
- Admin → Settings → Policies → use Shopify's generator as starting point
- Privacy policy must cover: data collected, why, third-party sharing, retention, GDPR/CCPA rights, contact `privacy@ezq.com`
- Terms must cover: governing law (California), returns/warranty links, IP, limitation of liability
- Link both from footer and from cookie banner (already linked at `/policies/privacy-policy`)

### GA4 + GTM (optional upgrade from direct GA4)
The theme uses direct GA4 via `settings.ga4_measurement_id` with Consent Mode v2.
If switching to GTM:
1. Create GTM account → get `GTM-XXXXXX` container ID
2. Add GTM snippet to `layout/theme.liquid` (replace the direct GA4 block)
3. In GTM: create GA4 Configuration tag (Measurement ID, trigger: All Pages)
4. Add event tags: view_item (PDP), add_to_cart, begin_checkout, purchase (thank_you page)
5. Enable Shopify's built-in pixel: Admin → Settings → Customer events

### Shopify Customer Events (native pixel)
Admin → Settings → Customer events → Connect pixel → enables native `page_viewed`, `product_viewed`, `collection_viewed`, `checkout_started`, `purchase` events fed directly to GA4/Meta without custom code.

### Email templates
Admin → Settings → Notifications → edit HTML for:
- Order confirmation, Order shipped, Order delivered, Order canceled
- Welcome (new customer), Password reset, Abandoned checkout
Keep all `{{ order.name }}`, `{{ customer.first_name }}`, `{{ order.line_items }}` variables.

### URL Redirects (QR codes)
Admin → Online Store → URL Redirects → Import CSV
Use `docs/qr-redirects-template.csv` after filling in `[QR_PREFIX]` from physical QR scan.
