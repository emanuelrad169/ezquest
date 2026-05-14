'use strict';

// Normalizes a ShopSite order export into Shopify's order import format.
// Usage: node scripts/migration/data/normalize-orders.js <input.csv>
//
// Requires docs/migration/sku-map.json (pre-built by running the SKU map
// fetch one-liner, or auto-fetched if API creds are available).
//
// Output:
//   docs/migration/orders-shopify.json      — ready for import-orders.js
//   docs/migration/orders-manual-review.csv — orders where SKUs didn't match

const fs   = require('fs');
const path = require('path');

const INPUT   = process.argv[2];
const SKU_MAP = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'sku-map.json');
const OUT_JSON = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'orders-shopify.json');
const OUT_MR   = path.join(__dirname, '..', '..', '..', 'docs', 'migration', 'orders-manual-review.csv');

if (!INPUT) {
  console.error('Usage: node normalize-orders.js <shopsite-orders-export.csv>');
  process.exit(1);
}
if (!fs.existsSync(INPUT)) {
  console.error(`File not found: ${INPUT}`);
  process.exit(1);
}
if (!fs.existsSync(SKU_MAP)) {
  console.error(`SKU map not found at ${SKU_MAP}`);
  console.error('Run the SKU map fetch first (see docs/migration/sku-map.json)');
  process.exit(1);
}

const skuMap = JSON.parse(fs.readFileSync(SKU_MAP, 'utf8'));
console.log(`Loaded ${Object.keys(skuMap).length} SKU mappings`);

// ShopSite export column map — covers both spaced and underscored header variants
const FIELD_MAP = {
  'order id':          'orderId',   'order_id':          'orderId',
  'order number':      'orderId',   'order_number':      'orderId',
  'order date':        'createdAt', 'order_date':        'createdAt',
  'date':              'createdAt',
  'customer email':    'email',     'customer_email':    'email',
  'email':             'email',     'email address':     'email',
  'first name':        'firstName', 'first_name':        'firstName',
  'last name':         'lastName',  'last_name':         'lastName',
  'billing address1':  'billingAddress1',  'billing_address1':  'billingAddress1',
  'billing address2':  'billingAddress2',  'billing_address2':  'billingAddress2',
  'billing city':      'billingCity',      'billing_city':      'billingCity',
  'billing state':     'billingState',     'billing_state':     'billingState',
  'billing zip':       'billingZip',       'billing_zip':       'billingZip',
  'billing country':   'billingCountry',   'billing_country':   'billingCountry',
  'shipping address1': 'shippingAddress1', 'shipping_address1': 'shippingAddress1',
  'shipping address2': 'shippingAddress2', 'shipping_address2': 'shippingAddress2',
  'shipping city':     'shippingCity',     'shipping_city':     'shippingCity',
  'shipping state':    'shippingState',    'shipping_state':    'shippingState',
  'shipping zip':      'shippingZip',      'shipping_zip':      'shippingZip',
  'shipping country':  'shippingCountry',  'shipping_country':  'shippingCountry',
  'sku':               'sku',
  'product name':      'productName',      'product_name':      'productName',
  'quantity':          'quantity',
  'unit price':        'unitPrice',        'unit_price':        'unitPrice',
  'item price':        'unitPrice',        'item_price':        'unitPrice',
  'subtotal':          'subtotal',
  'shipping cost':     'shippingCost',   'shipping_cost':     'shippingCost',
  'tax':               'tax',
  'total':             'total',
  'payment method':    'paymentMethod',  'payment_method':    'paymentMethod',
  'discount code':     'discountCode',   'discount_code':     'discountCode',
  'discount amount':   'discountAmount', 'discount_amount':   'discountAmount',
  'notes':             'notes',
  'order notes':       'notes',         'order_notes':        'notes',
};

function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  const headers = rawHeaders.map(h => h.toLowerCase());
  const rows = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const fields = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { fields.push(cur); cur = ''; }
      else { cur += ch; }
    }
    fields.push(cur);
    const row = {};
    headers.forEach((h, i) => {
      const key = FIELD_MAP[h] || h;
      row[key] = (fields[i] || '').replace(/^"|"$/g, '').trim();
    });
    rows.push(row);
  }
  return rows.filter(r => Object.values(r).some(v => v));
}

function parseDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  // Try common formats: M/D/YYYY, YYYY-MM-DD, MM/DD/YYYY
  const d = new Date(dateStr);
  if (!isNaN(d)) return d.toISOString();
  return new Date().toISOString();
}

function parseAmount(str) {
  const n = parseFloat(String(str).replace(/[$,]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function buildAddress(row, prefix) {
  return {
    first_name: row.firstName || '',
    last_name:  row.lastName  || '',
    address1:   row[`${prefix}Address1`] || '',
    address2:   row[`${prefix}Address2`] || '',
    city:       row[`${prefix}City`]     || '',
    province:   row[`${prefix}State`]    || '',
    zip:        row[`${prefix}Zip`]      || '',
    country:    row[`${prefix}Country`]  || 'US',
  };
}

// Group flat rows into orders (ShopSite may export one row per line item)
const raw = fs.readFileSync(INPUT, 'utf8');
const rows = parseCSV(raw);
console.log(`Parsed ${rows.length} rows`);

const orderMap = new Map();
for (const row of rows) {
  const id = row.orderId || `unknown-${Math.random()}`;
  if (!orderMap.has(id)) orderMap.set(id, { ...row, lineItems: [] });
  const order = orderMap.get(id);
  order.lineItems.push({
    sku:         (row.sku || '').toUpperCase(),
    productName: row.productName || 'Unknown product',
    quantity:    parseInt(row.quantity, 10) || 1,
    unitPrice:   parseAmount(row.unitPrice),
  });
}

console.log(`Grouped into ${orderMap.size} orders`);

const ready = [];
const manualReview = [];

for (const [orderId, order] of orderMap) {
  const lineItems = [];
  const unmapped = [];

  for (const item of order.lineItems) {
    const mapping = skuMap[item.sku];
    if (mapping) {
      lineItems.push({
        variant_id: mapping.variantId,
        quantity:   item.quantity,
        price:      String(item.unitPrice),
        requires_shipping: true,
      });
    } else {
      // Use custom item fallback — preserves SKU in title
      lineItems.push({
        title:    item.sku ? `${item.productName} [SKU: ${item.sku}]` : item.productName,
        quantity: item.quantity,
        price:    String(item.unitPrice),
        requires_shipping: true,
      });
      if (item.sku) unmapped.push(item.sku);
    }
  }

  const shipping  = parseAmount(order.shippingCost);
  const tax       = parseAmount(order.tax);
  const total     = parseAmount(order.total);
  const subtotal  = parseAmount(order.subtotal);
  const discount  = parseAmount(order.discountAmount);

  // Reconcile: line item sum + shipping + tax - discount ≈ total
  const calcTotal = lineItems.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0)
    + shipping + tax - discount;
  const reconciled = Math.abs(calcTotal - total) < 0.02;

  const shopifyOrder = {
    _meta: {
      legacyId: orderId,
      unmappedSkus: unmapped,
      reconciled,
      calcTotal: Math.round(calcTotal * 100) / 100,
      reportedTotal: total,
    },
    email: (order.email || '').toLowerCase().trim(),
    created_at: parseDate(order.createdAt),
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    send_receipt: false,
    send_fulfillment_receipt: false,
    inventory_behavior: 'bypass',
    tags: 'migrated, legacy-shopsite',
    note: `Migrated from ezq.com on ${new Date().toISOString().slice(0,10)}. Legacy order #${orderId}.${order.notes ? ' Customer note: ' + order.notes : ''}`,
    note_attributes: [
      { name: 'legacy_order_id', value: orderId },
      ...(order.discountCode ? [{ name: 'discount_code', value: order.discountCode }] : []),
    ],
    line_items: lineItems,
    billing_address:  buildAddress(order, 'billing'),
    shipping_address: buildAddress(order, 'shipping'),
    shipping_lines: shipping > 0 ? [{
      title:  'Legacy shipping',
      price:  String(shipping),
      code:   'LEGACY',
    }] : [],
    tax_lines: tax > 0 ? [{
      title: 'Tax',
      price: String(tax),
      rate:  0,
    }] : [],
    transactions: [{
      kind:   'sale',
      status: 'success',
      amount: String(total),
      gateway: order.paymentMethod || 'legacy',
    }],
  };

  // Any unmatched SKU sends the order to manual review regardless of reconciliation.
  // Reconciliation failures on otherwise clean orders also go to review.
  if (unmapped.length > 0 || !reconciled) {
    manualReview.push({
      orderId,
      email: order.email,
      unmappedSkus: unmapped.join(';') || '(none)',
      reconciledOk: reconciled,
      total,
      calcTotal: Math.round(calcTotal * 100) / 100,
    });
  } else {
    ready.push(shopifyOrder);
  }
}

fs.writeFileSync(OUT_JSON, JSON.stringify(ready, null, 2));

const mrLines = [
  '"Order ID","Email","Unmapped SKUs","Reported Total","Calculated Total"',
  ...manualReview.map(r =>
    `"${r.orderId}","${r.email}","${r.unmappedSkus}","${r.total}","${r.calcTotal}"`),
].join('\n');
fs.writeFileSync(OUT_MR, mrLines);

console.log(`\n── Result`);
console.log(`Ready for import: ${ready.length}   → docs/migration/orders-shopify.json`);
console.log(`Manual review:    ${manualReview.length} → docs/migration/orders-manual-review.csv`);
if (manualReview.length) {
  console.log('\nManual review orders (unmapped SKUs + reconciliation failure):');
  manualReview.forEach(r => console.log(`  #${r.orderId} ${r.email} — ${r.unmappedSkus}`));
}
