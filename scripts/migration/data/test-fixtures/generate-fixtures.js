'use strict';

// Generates synthetic but realistic test fixtures for the migration pipeline.
// Run: node scripts/migration/data/test-fixtures/generate-fixtures.js

const fs   = require('fs');
const path = require('path');

const OUT = __dirname;

// Real SKUs from the live catalog (pre-built sku-map.json)
const REAL_SKUS = [
  'H30005','H30015','P14070','P15070','P40065','P40066','P40035','P40036',
  'X48910','X48920','X48930','X48912','X48922','X49910','C49920','C59920',
  'C59930','X40077','X40079','E12230','X40013','X40225','C40012','C41005',
  'X40081','X40100','X40214','X40072','X40085','P10045',
];
const BAD_SKUS = ['LEGACY-XYZ','OLD-DOCK-V1','DISCONTINUED-001','SHOPSITE-999','UNKNOWN-SKU'];

// Realistic price ranges per SKU category
const SKU_PRICES = {
  H30005: 35.99, H30015: 35.99, P14070: 69.99, P15070: 69.99,
  P40065: 89.99, P40066: 89.99, P40035: 59.99, P40036: 59.99,
  X48910: 19.99, X48920: 22.99, X48930: 25.99, X48912: 17.99,
  X48922: 19.99, X49910: 12.99, C49920: 14.99, C59920: 16.99,
  C59930: 17.99, X40077: 14.99, X40079: 24.99, E12230: 49.99,
  X40013: 19.99, X40225: 79.99, C40012: 29.99, C41005: 19.99,
  X40081: 14.99, X40100: 12.99, X40214: 11.99, X40072: 15.99,
  X40085: 16.99, P10045: 44.99,
};

// ── Utility RNG (seeded-ish for reproducibility) ──────────────────────────────

let seed = 42;
function rand() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function shuffle(arr) { return [...arr].sort(() => rand() - 0.5); }

// ── Name/address data pools ───────────────────────────────────────────────────

const FIRST = ['James','Maria','David','Jennifer','Michael','Linda','Robert','Patricia','William','Barbara','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Charles','Karen','Christopher','Lisa','Daniel','Nancy','Matthew','Betty','Anthony','Margaret','Mark','Sandra','Donald','Ashley','Steven','Dorothy','Paul','Kimberly','Andrew','Emily','Kenneth','Donna','Joshua','Michelle','Kevin','Carol','Brian','Amanda','George','Melissa','Edward','Deborah','Ronald','Stephanie'];
const LAST  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Anderson','Taylor','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Sanchez'];
const STREETS = ['Main St','Oak Ave','Maple Dr','Washington Blvd','Park Ave','Cedar Ln','Elm St','Lake Dr','Hill Rd','Forest Ave','River Rd','Sunset Blvd','Lincoln Ave','Valley Dr','Ridge Rd','Cherry St','Willow Way','Meadow Ln','Stone Ave','Pine St'];
const CITIES_US = [['New York','NY'],['Los Angeles','CA'],['Chicago','IL'],['Houston','TX'],['Phoenix','AZ'],['Philadelphia','PA'],['San Antonio','TX'],['San Diego','CA'],['Dallas','TX'],['San Jose','CA'],['Austin','TX'],['Jacksonville','FL'],['Fort Worth','TX'],['Columbus','OH'],['Charlotte','NC'],['Indianapolis','IN'],['San Francisco','CA'],['Seattle','WA'],['Denver','CO'],['Nashville','TN']];
const DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','aol.com','comcast.net','live.com','me.com','mac.com'];

const INTL_ADDRESSES = [
  { company:'Maple Tech Inc', address1:'145 King St W', city:'Toronto', state:'ON', zip:'M5H 1J8', country:'CA' },
  { company:'', address1:'22 Baker Street', city:'London', state:'ENG', zip:'NW1 6XE', country:'GB' },
  { company:'Sydney AV Supplies', address1:'88 George St', city:'Sydney', state:'NSW', zip:'2000', country:'AU' },
  { company:'', address1:'15 Rue de Rivoli', city:'Paris', state:'IDF', zip:'75001', country:'FR' },
  { company:'EZQ Distributor GmbH', address1:'Unter den Linden 10', city:'Berlin', state:'BE', zip:'10117', country:'DE' },
];

function fakeName() { return { first: pick(FIRST), last: pick(LAST) }; }
function fakeEmail(first, last, idx) {
  const base = `${first.toLowerCase()}.${last.toLowerCase()}`;
  const domain = pick(DOMAINS);
  return `${base}${idx > 0 ? idx : ''}@${domain}`;
}
function fakePhone() {
  const area = randInt(200, 999); const mid = randInt(200, 999); const end = randInt(1000, 9999);
  return `(${area}) ${mid}-${end}`;
}
function fakeAddress() {
  const [city, state] = pick(CITIES_US);
  return { address1: `${randInt(1,9999)} ${pick(STREETS)}`, address2: rand() < 0.3 ? `Apt ${randInt(1,99)}` : '', city, state, zip: `${randInt(10000,99999)}`, country: 'US' };
}
function fakeZip(country) {
  if (country === 'US') return String(randInt(10000, 99999));
  if (country === 'CA') return `${pick(['K','M','V','T','R'])}${randInt(1,9)}${pick('ABCEGHJKLMNPRSTVWXYZ')} ${randInt(1,9)}${pick('ABCEGHJKLMNPRSTVWXYZ')}${randInt(1,9)}`;
  return String(randInt(10000, 99999));
}
function fakeOrderDate() {
  const d = new Date(Date.now() - randInt(0, 365 * 3) * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fakeLegacyCode() {
  return `ORD-${String(randInt(10000,99999))}`;
}
function fakeDiscountCode() {
  return pick(['SUMMER20','FALL15','WELCOME10','VIP25','HOLIDAY30','SAVE10','NEWCUST15']);
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function toCSV(headers, rows) {
  return [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h]??'').replace(/"/g,'""')}"`).join(','))].join('\n') + '\n';
}

// ════════════════════════════════════════════════════════════════════════════
// 1. test-customers-50.csv
// ════════════════════════════════════════════════════════════════════════════

const custHeaders = ['first_name','last_name','email','phone','company','address1','address2','city','state','zip','country','accepts_marketing','tax_exempt','wholesale','tier','notes'];
const customers = [];
const customerEmails = [];

for (let i = 0; i < 50; i++) {
  const { first, last } = fakeName();
  const email = fakeEmail(first, last, i < 45 ? 0 : i); // a few duplicate-ish names
  customerEmails.push(email);

  const isIntl = i < 5;
  const intl = isIntl ? INTL_ADDRESSES[i] : null;
  const addr = isIntl ? intl : fakeAddress();

  const isWholesale = i < 5;
  const isTaxExempt = i < 2;
  const tier = isWholesale ? pick(['Tier 1','Tier 2','Tier 3']) : '';

  // Intentional mess:
  const phone = i === 10 ? '' : i === 11 ? 'not-a-phone' : fakePhone(); // #10 missing, #11 invalid
  const rowEmail = i === 20 ? 'bad-email-no-at-sign' :  // invalid
                   i === 21 ? email :                    // will be duplicate if same name
                   i === 22 ? '' :                       // missing email
                   email;

  customers.push({
    first_name:        i === 30 ? first.toUpperCase() : first,  // mixed case
    last_name:         last,
    email:             rowEmail,
    phone,
    company:           isIntl && intl.company ? intl.company : (isWholesale ? `${last} Enterprises` : ''),
    address1:          addr.address1,
    address2:          addr.address2 || '',
    city:              addr.city,
    state:             addr.state,
    zip:               isIntl ? fakeZip(addr.country) : addr.zip,
    country:           addr.country || 'US',
    accepts_marketing: rand() < 0.7 ? 'yes' : 'no',
    tax_exempt:        isTaxExempt ? 'yes' : 'no',
    wholesale:         isWholesale ? 'yes' : 'no',
    tier,
    notes:             isWholesale ? `Net-30 terms. ${tier} pricing.` : (rand() < 0.15 ? 'Returning customer. Handle with care.' : ''),
  });
}

// Row 21 is an intentional duplicate of row 0's email
customers[21].email = customers[0].email;

fs.writeFileSync(path.join(OUT, 'test-customers-50.csv'), toCSV(custHeaders, customers));
console.log('✓ test-customers-50.csv');

// ════════════════════════════════════════════════════════════════════════════
// 2. test-orders-200.csv
// ════════════════════════════════════════════════════════════════════════════

const orderHeaders = ['order_id','order_date','customer_email','first_name','last_name',
  'billing_address1','billing_city','billing_state','billing_zip','billing_country',
  'shipping_address1','shipping_city','shipping_state','shipping_zip','shipping_country',
  'sku','product_name','quantity','unit_price','subtotal','shipping_cost','tax','total',
  'payment_method','discount_code','discount_amount','notes'];

const orderRows = [];
let orderSeq = 10000;

// 200 line-item rows (grouped by order_id — multiple rows per order)
const validCustomerEmails = customers.filter((c,i) => i !== 20 && i !== 21 && i !== 22 && c.email).map(c => c.email);

let lineItemCount = 0;
while (lineItemCount < 200) {
  const email = pick(validCustomerEmails);
  const cust = customers.find(c => c.email === email) || customers[0];
  const orderId = `ORD-${orderSeq++}`;
  const date = fakeOrderDate();
  const numItems = randInt(1, 4);
  const discCode = rand() < 0.2 ? fakeDiscountCode() : '';
  const discPct  = discCode ? pick([0.10, 0.15, 0.20, 0.25]) : 0;
  const addr = fakeAddress();

  let orderTotal = 0;
  const items = [];
  for (let j = 0; j < numItems && lineItemCount < 200; j++, lineItemCount++) {
    const useReal = rand() < 0.9;
    const sku = useReal ? pick(REAL_SKUS) : pick(BAD_SKUS);
    const price = useReal ? (SKU_PRICES[sku] || 29.99) : randInt(15, 99) + 0.99;
    const qty = randInt(1, 3);
    const subtotal = Math.round(price * qty * 100) / 100;
    orderTotal += subtotal;
    items.push({ sku, price, qty, subtotal,
      productName: useReal ? `EZQuest ${sku}` : `Legacy Product (${sku})` });
  }

  const discAmount = discCode ? Math.round(orderTotal * discPct * 100) / 100 : 0;
  const shipping = rand() < 0.3 ? 0 : pick([5.99, 7.99, 9.99, 12.99]);
  const taxableBase = orderTotal - discAmount + shipping;
  const tax = Math.round(taxableBase * 0.08 * 100) / 100;
  const total = Math.round((taxableBase + tax) * 100) / 100;

  for (const item of items) {
    orderRows.push({
      order_id:          orderId,
      order_date:        date,
      customer_email:    email,
      first_name:        cust.first_name,
      last_name:         cust.last_name,
      billing_address1:  addr.address1,
      billing_city:      addr.city,
      billing_state:     addr.state,
      billing_zip:       addr.zip,
      billing_country:   'US',
      shipping_address1: addr.address1,
      shipping_city:     addr.city,
      shipping_state:    addr.state,
      shipping_zip:      addr.zip,
      shipping_country:  'US',
      sku:               item.sku,
      product_name:      item.productName,
      quantity:          item.qty,
      unit_price:        item.price.toFixed(2),
      subtotal:          item.subtotal.toFixed(2),
      shipping_cost:     item.sku === items[0].sku ? shipping.toFixed(2) : '0.00', // shipping on first line item
      tax:               item.sku === items[0].sku ? tax.toFixed(2) : '0.00',
      total:             item.sku === items[0].sku ? total.toFixed(2) : '0.00',
      payment_method:    pick(['credit_card','paypal','amex']),
      discount_code:     item.sku === items[0].sku ? discCode : '',
      discount_amount:   item.sku === items[0].sku ? discAmount.toFixed(2) : '0.00',
      notes:             rand() < 0.05 ? 'Please gift wrap' : '',
    });
  }
}

fs.writeFileSync(path.join(OUT, 'test-orders-200.csv'), toCSV(orderHeaders, orderRows));
console.log(`✓ test-orders-200.csv (${orderRows.length} line-item rows)`);

// ════════════════════════════════════════════════════════════════════════════
// 3. test-gift-cards-25.csv
// ════════════════════════════════════════════════════════════════════════════

const gcHeaders = ['legacy_code','holder_email','remaining_balance','original_value','expires_at'];
const gcRows = [];

for (let i = 0; i < 25; i++) {
  const isExpired  = i >= 22;          // 3 expired
  const isZero     = i >= 20 && i < 22; // 2 zero-balance
  const noEmail    = i >= 15 && i < 20; // 5 no holder email
  const code = `GC${String(randInt(100000,999999))}`;
  const original = pick([10,25,50,100,150,200,250,500]);
  const remaining = isZero ? 0 : Math.round(rand() * original * 100) / 100;
  const email = noEmail ? '' : pick(validCustomerEmails);

  let expires = '';
  if (isExpired) {
    expires = '2024-12-31'; // clearly past
  } else if (rand() < 0.5) {
    const d = new Date(Date.now() + randInt(30, 730) * 86400000);
    expires = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  gcRows.push({
    legacy_code:       code,
    holder_email:      email,
    remaining_balance: remaining.toFixed(2),
    original_value:    original.toFixed(2),
    expires_at:        expires,
  });
}

fs.writeFileSync(path.join(OUT, 'test-gift-cards-25.csv'), toCSV(gcHeaders, gcRows));
console.log('✓ test-gift-cards-25.csv');

// ════════════════════════════════════════════════════════════════════════════
// 4. test-b2b-accounts.csv
// ════════════════════════════════════════════════════════════════════════════

const b2bHeaders = ['company','contact_name','email','phone','tier','discount_pct','payment_terms','address1','city','state','zip','country','notes'];
const b2bRows = [
  { company:'Pacific Rim Electronics',  contact_name:'Alex Chen',     email:'alex.chen@pacificrim.com',    phone:'+1-415-555-0101', tier:'Tier 1', discount_pct:'20', payment_terms:'net-30',  address1:'500 Market St',      city:'San Francisco', state:'CA', zip:'94105', country:'US', notes:'Annual volume $80k+' },
  { company:'Mountain View AV',         contact_name:'Sara Lopez',    email:'sara.lopez@mvav.com',          phone:'+1-720-555-0102', tier:'Tier 1', discount_pct:'20', payment_terms:'net-30',  address1:'1400 Pearl St',      city:'Boulder',       state:'CO', zip:'80302', country:'US', notes:'Retail chain — 12 locations' },
  { company:'Maple Tech Distribution',  contact_name:'Ryan Park',     email:'ryan.park@mapletech.ca',       phone:'+1-416-555-0103', tier:'Tier 2', discount_pct:'30', payment_terms:'net-30',  address1:'145 King St W',      city:'Toronto',       state:'ON', zip:'M5H1J8', country:'CA', notes:'Canada distributor' },
  { company:'TechSource Chicago',       contact_name:'Dana Williams', email:'d.williams@techsource.com',    phone:'+1-312-555-0104', tier:'Tier 2', discount_pct:'30', payment_terms:'net-30',  address1:'222 W Adams St',     city:'Chicago',       state:'IL', zip:'60606', country:'US', notes:'' },
  { company:'Coast IT Solutions',       contact_name:'Mike Torres',   email:'mtorres@coastit.com',          phone:'+1-858-555-0105', tier:'Tier 2', discount_pct:'30', payment_terms:'net-45',  address1:'3900 Harney St',     city:'San Diego',     state:'CA', zip:'92110', country:'US', notes:'Net-45 approved by owner' },
  { company:'Nexus Enterprise Supply',  contact_name:'Fiona Grant',   email:'fgrant@nexusent.com',          phone:'+1-212-555-0106', tier:'Tier 3', discount_pct:'40', payment_terms:'net-30',  address1:'1271 Avenue Americas', city:'New York',    state:'NY', zip:'10020', country:'US', notes:'Volume $200k/yr. Annual contract.' },
  { company:'Brit AV Wholesale Ltd',    contact_name:'James Barker',  email:'j.barker@britav.co.uk',        phone:'+44-20-5555-0107', tier:'Tier 3', discount_pct:'40', payment_terms:'net-30',  address1:'10 Downing Street',  city:'London',        state:'ENG', zip:'SW1A2AA', country:'GB', notes:'UK distributor. VAT registered.' },
  { company:'SouthEast Tech Partners',  contact_name:'Priya Nair',    email:'pnair@setechpartners.com',     phone:'+1-404-555-0108', tier:'Tier 1', discount_pct:'20', payment_terms:'net-30',  address1:'1 Peachtree Center', city:'Atlanta',       state:'GA', zip:'30303', country:'US', notes:'New account — trial period 90 days' },
];

fs.writeFileSync(path.join(OUT, 'test-b2b-accounts.csv'), toCSV(b2bHeaders, b2bRows));
console.log('✓ test-b2b-accounts.csv');

console.log('\nAll fixtures generated in scripts/migration/data/test-fixtures/');
