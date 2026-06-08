# EZQuest — Remaining Admin Tasks
Owner: Client
Date: 2026-04-20
Time estimate: ~90 minutes total

## HIGH IMPACT (do first)

### 1. Tidio — load on user interaction (2 min, fixes CLS)
Tidio Admin → Settings → Widget appearance
→ Load trigger → "On user interaction"
Fixes CLS 0.207 and saves 491ms per page load.

### 2. Languages — activate 4 (15 min)
Admin → Settings → Languages
→ Add: Spanish · French · German · Arabic
→ Publish each
Then: Apps → Translate & Adapt → Auto-translate all

### 3. Collection filters (15 min)
Admin → Online Store → Navigation
→ Search & discovery → Filters
Add per collection: Type, Price, Connectivity, Ports, Compatibility

## CONTENT

### 4. Policy pages — paste HTML in admin (15 min)
Admin → Settings → Policies
Open `scripts/set-policies.js` — copy each body string
Paste into Privacy Policy, Terms of Service, Refund Policy
(use the `<>` HTML mode button in the rich text editor)

Admin → Pages → Add page
- Title: Cookie Policy
- Handle: cookie-policy
Open `scripts/set-cookie-policy.js` — copy COOKIE_BODY
Paste into page content

### 5. Upload 5 missing product images (10 min)
Admin → Products → find each → Add media:
- usb-c-multimedia-hub
- usb-c-pro-dock
- usb-c-travel-hub
- duraguard-stereo-audio-cable-90-degree
- superspeed-gen-1-usb-c-to-usb-a-mini-adapter-2-pack

### 6. Upload 20 download files (30 min)
Admin → Content → Files → Upload PDFs and ZIPs
After uploading — share CDN URLs with dev
so download page templates can be updated

## ONGOING (per product)

### 7. Amazon URLs
Admin → Products → [product] → Metafields
→ ezquest.amazon_url → paste Amazon product URL
Button appears automatically on PDP

### 8. Google Search Console (20 min, needs Google account)
search.google.com/search-console
→ Add property → https://ezquest-4.myshopify.com/
→ Verify via HTML meta tag (**dev adds tag to theme** — see note below)
→ Submit sitemap: sitemap.xml

**Dev note for GSC verification:**
Google will provide a tag like:
`<meta name="google-site-verification" content="XXXXXXXXXXXXXXXX">`
Add it to `layout/theme.liquid` inside `<head>`, then push.
Command: `shopify theme push --theme 150294855878 --only layout/theme.liquid --allow-live`
