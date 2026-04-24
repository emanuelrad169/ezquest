# EZQuest Theme — Deployment Report
Date: 2026-04-15
Executed by: Claude Code

---

## Push summary

| Field | Value |
|-------|-------|
| Store | ezquest-4.myshopify.com |
| Theme name | EZQuest v1.0 — 2026-04-15 |
| Theme ID | 150294855878 |
| Role | unpublished |
| Push status | COMPLETE — no errors |
| Warnings | 3 harmless `.shopifyignore` pattern warnings (non-fatal) |
| Preview URL | https://ezquest-4.myshopify.com?preview_theme_id=150294855878 |
| Editor URL | https://ezquest-4.myshopify.com/admin/themes/150294855878/editor |

---

## Store theme inventory (post-push)

| Theme | Role | ID |
|-------|------|----|
| EZQuest/main | [live] | 149895643334 |
| EZQuest v1.0 — 2026-04-15 | [unpublished] | 150294855878 |
| EZQuest Phase 4 Preview | [unpublished] | 149914190022 |
| Horizon | [unpublished] | 149886468294 |
| Development (e18d50-Emanuels-Mac-Studio) | [development] | 149896921286 |

---

## Browser QA status

**BLOCKED — store is password-protected.**

The preview URL (`?preview_theme_id=150294855878`) redirects to `/password`.
Browser QA cannot be completed until password protection is removed or bypassed.

**Required action:**
Shopify admin → Online Store → Preferences → Password protection → Disable password

Once unlocked, run through the full QA checklist in `docs/deployment-checklist.md`.
Checklist covers: homepage, collection, product, cart drawer, cart page, search, support hub, downloads, ticket form, compare, 404, all pages.
Test at 375px / 768px / 1280px.

---

## Seed scripts available

`package.json` contains the following seed commands:

```
npm run shopify:seed:preflight
npm run shopify:seed:pages
npm run shopify:seed:blogs
npm run shopify:seed:products
npm run shopify:seed:metaobjects
npm run shopify:seed:metafields
npm run shopify:seed:collections
npm run shopify:seed:menus
npm run shopify:seed:content
npm run shopify:seed:validate
npm run shopify:seed:all
npm run shopify:seed:dry      (dry-run, safe to run first)
```

Before seeding, create metaobject definitions in Shopify admin → Settings → Custom data → Metaobjects:
- `ezquest_comparison_group`
- `ezquest_decision_guide_entry`
- `ezquest_compatibility_entry`
- `ezquest_use_case`
- `ezquest_spec_row`

Then run in order:
```
npm run shopify:seed:dry        # verify no errors
npm run shopify:seed:metaobjects
npm run shopify:seed:metafields
npm run shopify:seed:pages
npm run shopify:seed:all        # full seed if dry-run passes
```

---

## Admin configuration required before publishing

See `docs/deployment-checklist.md` for full detail. Summary:

### A. Remove password protection
Online Store → Preferences → Disable password

### B. Collection filters
Online Store → Navigation → Search & discovery → Filters
Add: Product type, Price range, Connectivity, Ports, Compatibility

### C. Metaobject definitions + seeding
Settings → Custom data → Metaobjects → create 5 definitions (above)
Then run seed scripts

### D. Product metafields
Settings → Custom data → Products → create:
- `ezquest.spec_rows` (JSON)
- `ezquest.compare_group` (single line text)
- `reviews.rating` (decimal)
- `reviews.rating_count` (integer)

### E. Download file URLs
Admin → Content → Files → upload PDFs/ZIPs
Replace `"#"` placeholders in:
- `templates/page.downloads.json`
- `templates/page.manuals.json`
- `templates/page.firmware.json`
- `templates/page.user-guides.json`

### F. Navigation menus
Online Store → Navigation → verify: Main menu, Footer menu, Support navigation

### G. Social sharing image
Online Store → Themes → Customize → Theme settings → Social sharing → upload 1200×630px image

---

## Publish command (after QA passes)

```
shopify theme publish \
  --store=ezquest-4.myshopify.com \
  --theme=150294855878
```

---

## Deployment status

| Step | Status |
|------|--------|
| npm run build | PASS |
| shopify theme check (0 offenses) | PASS |
| Theme push (unpublished) | COMPLETE |
| Password protection removed | PENDING — developer action |
| Browser QA | PENDING — blocked by password |
| Admin configuration | PENDING |
| Metaobject seeding | PENDING |
| Structured data validation | PENDING |
| Publish | PENDING — after QA passes |
| Post-launch stabilization | PENDING — Phase 5 |
