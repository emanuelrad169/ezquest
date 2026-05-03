# EZQuest — Pre-Launch Checklist
Generated: 2026-04-26

## Code quality
- [x] shopify theme check: 0 offenses, 0 warnings
- [x] npm run build: PASS
- [x] Playwright visual suite: 35/35 passing
- [x] Visual snapshots updated: 20 changed baseline files

## Layout system
- [x] container-shell: max-width 80rem
- [x] container-wide: max-width 90rem
- [x] No old max-w/page-width patterns in core sections
- [x] No non-conditional style='display:none' in sections/snippets

## Accessibility
- [x] Focus styles: amber outline on focusable elements
- [x] Amber text contrast: --ez-amber-text #854F0B on light backgrounds
- [x] Icon buttons: audited and labeled
- [x] axe-core: 0 violations, 0 critical/serious across 8 audited pages

## SEO
- [x] FAQPage schema: /pages/faq
- [x] Article JSON-LD: blog articles
- [x] robots.txt: GPTBot/ClaudeBot/PerplexityBot allowed
- [x] llms.txt: /pages/llms live

## Redirects
- [x] docs/redirects.csv uploaded to Shopify
- [x] Redirect upload: 0 created, 13 skipped, 0 errors
- [ ] Spot-check 10 redirects: 7/8 passed in current sample

Note: Shopify has a redirect record for /shop -> /collections, but the live storefront still returns 200 for /shop instead of a 301. This appears to be Shopify serving an existing route before the redirect rule.

## Pending client actions
- [ ] DNS cutover (domain: ezq.com)
- [ ] GA4 measurement ID -> wire to analytics.js
- [ ] Judge.me install -> wire widget to PDP
- [ ] Shopify Bundles install
- [ ] 5 product images uploaded
- [ ] GSC verification code provided
- [ ] Tidio load-on-interaction configured
- [ ] Checkout branding completed
- [ ] OG image uploaded (1200x630px)
