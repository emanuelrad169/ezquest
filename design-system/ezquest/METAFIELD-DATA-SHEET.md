# EZQuest PDP — Metafield Data Sheet

What to populate (in Shopify Admin → product → Metafields, or bulk via Matrixify) to
light up the PDP modules that are already built in code. Nothing here is code — it's data.

> **Tip:** `custom.key_features` is the highest-leverage entry — it fills the buy-box
> bullets **and** the big-number stat strip from one field.

---

## 1. Conversion modules

| Module (what appears) | Metafield | Type | Example value |
|---|---|---|---|
| **Buy-box Key Features bullets** + **big-number stat strip** (above tabs) | `custom.key_features` | List of single-line text | `USB-C 10Gbps`, `Up to 2TB`, `Aluminum housing`, `Mac + Windows` |
| **Save-% badge** + struck-through price | *(variant)* **Compare-at price** | Variant price field | Set Compare-at > price (e.g. compare `$59.99`, price `$49.99` → shows “Save $10 (17%)”) |
| **“In the box”** tab/block | `custom.in_the_box` | List of single-line text | `1× Enclosure`, `1× USB-C cable`, `Quick start guide` |

## 2. Content tabs (Overview / Specs / Compatibility / Downloads)

| Tab | Metafield | Type | Notes |
|---|---|---|---|
| **Overview** | `custom.product_features` | Rich text / multi-line HTML | Editorial copy + sub-headings |
| **Specifications** | `custom.product_specifications` | Rich text — use `<ul><li>Label: Value</li></ul>` | Auto-renders as the 2-col spec table |
| **Highlights** (optional) | `custom.product_highlight` | Rich text | — |
| **Compatibility** | `custom.product_compatibility_html` | Rich text | Tab auto-shows when present |
| **Downloads** | metaobjects `ezquest_download` (linked to product) **or** `ezquest.manuals` / `ezquest.downloads` | Metaobject refs | Tab auto-shows when the product has ≥1 |

## 3. Buy-box + header supporting data

| Field | Metafield | Example |
|---|---|---|
| Kicker (eyebrow above title) | `custom.kicker` | `Pro storage` |
| Short description (subtitle) | `custom.short_description` | one-line value prop |
| Sticky-bar / hero tagline | `custom.tagline` | `Pocket NVMe speed` |
| Warranty years (trust chip) | `custom.warranty_years` | `1` |
| Product video | `custom.product_video_url` | YouTube URL |
| Amazon rating / count / link | `custom.amazon_rating`, `custom.amazon_review_count`, `ezquest.amazon_url`, `custom.amazon_asin` | `4.6`, `127`, URL, ASIN |

---

## Rollout suggestion
1. Top 10 sellers first → `key_features` + a `compare_at_price` where on sale.
2. Then `product_specifications` (`<li>Label: Value</li>`) + `product_compatibility_html`.
3. Link `ezquest_download` metaobjects for manuals/drivers.
4. `in_the_box` last (nice-to-have).

Each item is independent and **hides gracefully when empty** — populate at your own pace.
