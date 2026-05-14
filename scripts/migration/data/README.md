# Data Migration Scripts

Scripts that normalize ShopSite exports and import them into Shopify.
Run in order. All import scripts are **dry-run by default** — pass `--apply` to write.

## Prerequisites

1. `.env.local` at project root with `SHOPIFY_SHOP_DOMAIN` and `SHOPIFY_ADMIN_ACCESS_TOKEN`
2. `docs/migration-readiness.md` must show `🟢 READY FOR DNS CUTOVER` (run `scripts/migration/05-readiness-report.js` first)
3. Client written confirmation collected in `docs/client-data-scope-email.md`

## Run Order

### Phase 1 — Customers

```sh
# Normalize ShopSite export
node scripts/migration/data/normalize-customers.js shopsite-customers.csv
# Review: docs/migration/customers-rejected.csv

# Dry-run import (no API writes)
node scripts/migration/data/import-customers.js --confirm-production

# Live import
node scripts/migration/data/import-customers.js --apply --confirm-production
```

### Phase 2 — Orders

```sh
# Build SKU → variant ID map (requires API)
# (map already pre-built at docs/migration/sku-map.json — regenerate if catalog changed)

# Normalize ShopSite export
node scripts/migration/data/normalize-orders.js shopsite-orders.csv
# Review: docs/migration/orders-manual-review.csv — resolve unmapped SKUs before import

# Dry-run import
node scripts/migration/data/import-orders.js --confirm-production

# Live import
node scripts/migration/data/import-orders.js --apply --confirm-production
```

### Phase 3 — Gift Cards (requires accountant sign-off)

```sh
# Dry-run reissuance
node scripts/migration/data/reissue-gift-cards.js gift-cards-export.csv --confirm-production

# Live reissuance — ONLY after legacy codes are voided in ShopSite
node scripts/migration/data/reissue-gift-cards.js gift-cards-export.csv --apply --confirm-production
# Output: docs/migration/gift-cards-reissued.csv — TREAT AS CASH, never commit
```

### Phase 4 — Reconciliation

```sh
node scripts/migration/data/reconciliation-report.js
# Output: docs/migration/reconciliation.md — requires sign-off before lifting DNS freeze
```

### Phase 5 — PDP Content (legacy ezq.com extract → Shopify metafields)

Seeds Features, Specifications, Highlight, and Compatibility HTML from the legacy
site extract into four `custom.*` product metafields. The PDP tab UI reads these
to render 5 click-to-show tabs (Features / Specifications / Highlight /
Compatibility / Downloads).

**Source:** `docs/migration/legacy-product-content.json` (54 products, extracted
via Chrome extension from live ezq.com pages)

**Metafield definitions** (created 2026-05-08, `ownerType: PRODUCT`):

| Key | Shopify type |
|---|---|
| `custom.product_features` | `multi_line_text_field` |
| `custom.product_specifications` | `multi_line_text_field` |
| `custom.product_highlight` | `multi_line_text_field` |
| `custom.product_compatibility_html` | `multi_line_text_field` |

```sh
# Dry-run — resolves all 54 handles, logs what would be written
node scripts/migration/data/seed-product-content.js --confirm-production

# Single product (useful for testing one PDP before full apply)
node scripts/migration/data/seed-product-content.js --confirm-production \
  --handle=magnetic-usb-c-m-2-nvme-ssd-enclosure

# Live write — 216 API calls (54 × 4 metafields), ~2 min at 400ms/req
node scripts/migration/data/seed-product-content.js --apply --confirm-production
```

Re-running is safe — the script fetches existing metafield values and skips writes
where the value is unchanged (idempotent).

**Missing handles** (products in JSON not found in Shopify) are written to
`docs/migration/seed-content-missing-handles.txt`. In the 2026-05-08 run:
0 missing handles.

**Downloads section** in the JSON is reference data only — not seeded. Downloads
are served by the `ezquest_download` metaobject system (see `seed-metaobjects.js`).

---

### Phase 6 — Post-cutover Invites (after ezq.com DNS live)

```sh
# Send in batches with 1-hour gaps between each
node scripts/migration/data/06-send-invites.js --batch 1 --dry-run
node scripts/migration/data/06-send-invites.js --batch 1

# Wait 1 hour, monitor support inbox
node scripts/migration/data/06-send-invites.js --batch 2

# Wait 1 hour
node scripts/migration/data/06-send-invites.js --batch 3  # gift card holders
```

## Safety Rails (all import scripts)

| Guard | Behavior |
|---|---|
| Production store check | Refuses if `SHOPIFY_SHOP_DOMAIN` is `ezquest-4.myshopify.com` without `--confirm-production` |
| Dry-run default | No API writes unless `--apply` is passed |
| Request logging | Every API call logged to `docs/migration/logs/<script>-<timestamp>.jsonl` |
| Readiness gate | Refuses if `docs/migration-readiness.md` does not show `🟢 READY` |

## Env Vars

| Var | Description |
|---|---|
| `SHOPIFY_SHOP_DOMAIN` | e.g. `ezquest-4.myshopify.com` |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API token with `write_customers`, `write_orders`, `write_gift_cards` scopes |
| `SHOPIFY_ADMIN_API_VERSION` | Defaults to `2026-01` |

## Test Fixtures

`test-fixtures/` contains synthetic data for validating scripts without touching production:

| File | Contents |
|---|---|
| `test-customers-50.csv` | 50 customers: 3 intentionally invalid, 5 wholesale, 2 tax-exempt |
| `test-orders-200.csv` | 200 line items (~84 orders): 10% unmapped SKUs → manual review |
| `test-gift-cards-25.csv` | 25 cards: 3 expired, 2 zero-balance, 5 no email |
| `test-b2b-accounts.csv` | 8 wholesale accounts across 3 pricing tiers |

Regenerate with: `node test-fixtures/generate-fixtures.js`
