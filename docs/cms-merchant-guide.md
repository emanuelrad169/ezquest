# Support Center CMS — Merchant Guide

How to manage Downloads, Manuals, Firmware, and User Guides pages without touching code.

---

## Overview

The four Support Center resource pages pull content from Shopify metaobjects:

| Page | URL | Metaobject type |
|------|-----|-----------------|
| Downloads | /pages/downloads | `ezquest_download` |
| Manuals | /pages/manuals | `ezquest_manual` |
| Firmware | /pages/firmware | `ezquest_firmware` |
| User Guides | /pages/user-guides | `ezquest_user_guide` |

Each entry becomes one row in the file table. Filter pills auto-generate from the unique type values across all entries — no code change needed when you add a new category.

---

## Adding a new entry

1. Go to **Admin → Content → Metaobjects**
2. Select the appropriate type (e.g. `ezquest_download`)
3. Click **Add entry**
4. Fill in:

| Field | What to enter |
|-------|---------------|
| **Title** | The file name as it should appear in the table |
| **Type** (download_type / manual_type / etc.) | Category label shown in the filter and Type column — e.g. `Quick Start`, `Driver`, `User Manual` |
| **Version** | Leave blank if not applicable |
| **Platforms** | One entry per compatible platform: `Mac`, `Windows`, `Linux`, `Universal` |
| **File** | Upload the file directly, OR use External URL |
| **External URL** | Paste a CDN or Google Drive link if not uploading to Shopify |
| **Products** | Link to one or more Shopify products — used to populate the Product column |

5. Click **Save**

The entry appears on the live page immediately. No theme push required.

---

## Editing or removing an entry

1. Admin → Content → Metaobjects → select the type
2. Find the entry by title or handle
3. Edit fields and Save, or click **Delete** to remove
4. The page reflects the change on next load

---

## Adding a new filter category

No action needed. The filter pills are generated from the unique type values already in your metaobjects. When you add an entry with a new type value (e.g. `Certification`), the pill appears automatically.

---

## Uploading files

**Option A — Shopify-hosted (recommended for PDFs, ZIPs under 20 MB):**
1. In the metaobject entry, click the **File** field
2. Upload the file — Shopify hosts it on their CDN
3. The Download button on the page links directly to the CDN URL

**Option B — External URL (for large files or files hosted elsewhere):**
1. Leave the **File** field blank
2. Paste the direct download URL in **External URL**
3. Ensure the URL is publicly accessible without login

If both File and External URL are blank, the row shows "Available on request" instead of a Download button.

---

## Linking a file to a product

The **Products** field accepts one or more Shopify products via a reference picker. The first linked product's title appears in the Product column of the table. Linking multiple products is fine — only the first is shown in the table row.

---

## Switching a page back to manual (block) mode

If you need to manage a page's files directly in the theme editor instead of via metaobjects:

1. Admin → Online Store → Themes → Customize
2. Navigate to the page (Downloads, Manuals, etc.)
3. Click the **Download Center** section
4. Change **Content source** from `CMS (metaobjects)` to `Blocks (manual)`
5. Add File blocks under the section
6. Save

The metaobject entries are unaffected — switching back to CMS mode re-enables them.

---

## FAQ

**Can I reorder entries?**
Not directly from the metaobject list. Metaobjects surface in creation order. To reorder, delete and re-create entries in the desired order, or use the block (manual) mode which supports drag-and-drop.

**Why doesn't the file size show?**
The CMS mode doesn't store file size — the column is omitted in metaobject mode. If you need sizes, switch to block mode where file size is a text field per row.

**Can I have entries appear on multiple pages?**
No — each entry belongs to one metaobject type (e.g. `ezquest_download`). If a file is both a manual and a download, create an entry in each type.

**The filter pill for my new category isn't showing.**
Make sure the Type field (e.g. `download_type`) is filled in on at least one entry. Blank type fields are excluded from filter pill generation.

---

## How to update Amazon ratings

Product pages show Amazon star ratings, review counts, and a link to the Amazon listing. These come from product metafields — not from a live Amazon API.

### Metafields per product

| Metafield | Key | What to enter |
| --------- | --- | ------------- |
| Amazon ASIN | `custom.amazon_asin` | The product's ASIN (e.g. `B08R63NWGQ`) |
| Star rating | `custom.amazon_rating` | Average rating, one decimal (e.g. `4.6`) |
| Review count | `custom.amazon_review_count` | Number of reviews (e.g. `127`) |
| Seller ID | `custom.amazon_seller_id` | EZQuest's Amazon seller ID — pre-filled as `A34WE8HAFZHTZW`, leave as-is |

### Entering values manually (one product at a time)

1. Admin → Products → select the product
2. Scroll to **Metafields** at the bottom of the product page
3. Fill in `amazon_asin`, `amazon_rating`, `amazon_review_count`
4. Save

The widget appears on the PDP immediately. If `amazon_asin` is blank, the widget is hidden entirely.

### Bulk update via CSV (recommended for initial setup)

1. Fill in `scripts/migration/data/inputs/amazon-reviews-template.csv` with one row per product:

   ```csv
   handle,asin,rating,count
   magnetic-usb-c-m-2-nvme-ssd-enclosure,B08R63NWGQ,4.6,127
   usb-c-multimedia-hub-adapter-13-ports,B09ABCD1234,4.4,89
   ```

2. Dry-run to verify:

   ```sh
   node scripts/migration/data/seed-amazon-reviews.js scripts/migration/data/inputs/amazon-reviews-template.csv
   ```

3. Apply:

   ```sh
   node scripts/migration/data/seed-amazon-reviews.js scripts/migration/data/inputs/amazon-reviews-template.csv --apply --confirm-production
   ```

### How often to update

Amazon ratings drift slowly. Checking monthly and updating the CSV quarterly is sufficient for most products. The rating displayed is what you entered — it does not sync automatically.

### Products not on Amazon

Leave all three metafields blank. The widget renders nothing and the product page looks normal.
