# THEME FREEZE — 2026-05-06 01:19 UTC

**Status: ACTIVE**

In effect: no theme pushes, no metafield changes, no product publishes,
no collection edits, no app installs, no policy edits.

**Why:** DNS cutover for ezq.com is in flight. Concurrent changes during
cutover make root-cause analysis impossible if anything looks broken.

## Allowed during freeze

- Inventory updates (stock counts, prices)
- Order processing
- Customer support actions
- Marketing email scheduling (but not sending — recipients hitting
  legacy URLs during DNS propagation is bad)

## Emergency exceptions

Ping @tech-lead only. Do not push without acknowledgment.

## Freeze lifts when

1. `node scripts/migration/07-post-cutover.js` reports 7/7 green, AND
2. 24 hours of stable analytics confirmed on ezq.com

## Cutover context

- Pre-flight: 7/7 gates passed (see `docs/migration-readiness.md`)
- 110 redirects imported and verified
- Theme audit: 0 hardcoded domain references
- Storefront password: off
- DNS records being updated at registrar: `A @ → 23.227.38.65`, `CNAME www → shops.myshopify.com`
- Monitor: `bash scripts/migration/06-monitor-cutover.sh`
- Verify after propagation: `node scripts/migration/07-post-cutover.js`

## Rollback

If anything is fundamentally broken before 07-post-cutover.js passes:
revert A record and CNAME at registrar to ShopSite values.
DNS reverts within TTL. Do not touch the Shopify domain config.
