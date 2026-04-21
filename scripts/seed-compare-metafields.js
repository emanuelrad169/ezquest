require('dotenv').config({ path: '.env.local' });
const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const BASE = 'https://' + S + '/admin/api/2026-01';
const H = { 'X-Shopify-Access-Token': T, 'Content-Type': 'application/json' };

const NS = 'ezquest';

function getValues(title, productType) {
  const t = (title + ' ' + productType).toLowerCase();

  // Connector type
  let connectorType = 'USB-C';
  if (/thunderbolt.?5|tb5/i.test(t))      connectorType = 'Thunderbolt 5';
  else if (/thunderbolt.?4|tb4/i.test(t)) connectorType = 'Thunderbolt 4';
  else if (/thunderbolt.?3|tb3/i.test(t)) connectorType = 'Thunderbolt 3';
  else if (/usb4|usb.?4/i.test(t))        connectorType = 'USB4';
  else if (/usb.?c/i.test(t))             connectorType = 'USB-C';
  else if (/hdmi/i.test(t))               connectorType = 'HDMI';
  else if (/displayport|dp/i.test(t))     connectorType = 'DisplayPort';
  else if (/usb.?a|usb.?3/i.test(t))     connectorType = 'USB-A';

  // Charging power — parse wattage from title
  let chargingPower = '';
  const wattMatch = t.match(/(\d+)\s*w(?:att)?(?:\b|$)/i);
  if (wattMatch) chargingPower = wattMatch[1] + 'W';

  // Form factor — based on product_type and title keywords
  let formFactor = '';
  const pt = productType.toLowerCase().trim();

  if (pt === 'hub') {
    if (/dual.?screen|dual.?display|12.?in.?1|13.?in.?1|14.?in.?1|10.?in.?1/i.test(t))
      formFactor = 'Desktop hub';
    else if (/slim|ultra.?slim|gen.?2|6.?in.?1|5.?in.?1|4.?in.?1|3.?in.?1|travel/i.test(t))
      formFactor = 'Slim hub';
    else
      formFactor = 'Travel hub';
  } else if (pt === 'dock' || pt === 'docking station') {
    formFactor = 'Docking station';
  } else if (pt === 'charger' || pt === 'wall charger') {
    if (/car/i.test(t))   formFactor = 'Car charger';
    else                  formFactor = 'Wall charger';
  } else if (pt === 'cable') {
    if (/coiled/i.test(t)) formFactor = 'Coiled cable';
    else                   formFactor = 'Cable';
  } else if (pt === 'adapter') {
    formFactor = 'Adapter';
  } else if (pt === 'card reader') {
    formFactor = 'Card reader';
  } else if (pt === 'enclosure' || pt === 'ssd enclosure') {
    formFactor = 'SSD enclosure';
  } else if (pt === 'kvm') {
    formFactor = 'KVM switch';
  } else {
    // Fallback: infer from title
    if (/hub/i.test(t))       formFactor = 'Travel hub';
    else if (/dock/i.test(t)) formFactor = 'Docking station';
    else if (/charg/i.test(t)) formFactor = 'Wall charger';
    else if (/cable/i.test(t)) formFactor = 'Cable';
    else if (/adapter/i.test(t)) formFactor = 'Adapter';
    else if (/enclosure|nvme|ssd/i.test(t)) formFactor = 'SSD enclosure';
  }

  return { connectorType, chargingPower, formFactor };
}

async function upsertMetafield(productId, key, value) {
  if (!value) return 'SKIP';
  const res = await fetch(`${BASE}/products/${productId}/metafields.json`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      metafield: { namespace: NS, key, value, type: 'single_line_text_field' }
    })
  });
  const d = await res.json();
  if (d.errors) {
    const msg = JSON.stringify(d.errors);
    if (msg.includes('taken') || msg.includes('duplicate') || msg.includes('already')) return 'EXISTS';
    return 'ERROR: ' + msg.slice(0, 80);
  }
  return d.metafield ? 'OK' : 'ERROR: no metafield in response';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  let page = 1;
  let pageInfo = null;
  const allProducts = [];

  // Paginate through all products
  let url = `${BASE}/products.json?limit=250&fields=id,title,product_type`;
  while (url) {
    const res = await fetch(url, { headers: H });
    const data = await res.json();
    const products = data.products || [];
    allProducts.push(...products);
    // Check Link header for next page
    const link = res.headers.get('link') || '';
    const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
    page++;
  }

  console.log(`Products found: ${allProducts.length}\n`);

  let ok = 0, exists = 0, skip = 0, errors = 0;

  for (const p of allProducts) {
    const { connectorType, chargingPower, formFactor } =
      getValues(p.title, p.product_type || '');

    const r1 = await upsertMetafield(p.id, 'compare_connector_type', connectorType);
    await sleep(120);
    const r2 = await upsertMetafield(p.id, 'compare_charging_power', chargingPower);
    await sleep(120);
    const r3 = await upsertMetafield(p.id, 'compare_form_factor', formFactor);
    await sleep(120);

    const results = [r1, r2, r3];
    const icon = results.some(r => r.startsWith('ERROR')) ? '❌' : '✅';
    results.forEach(r => {
      if (r === 'OK') ok++;
      else if (r === 'EXISTS') exists++;
      else if (r === 'SKIP') skip++;
      else errors++;
    });

    console.log(
      icon,
      (p.product_type || '?').padEnd(14).slice(0, 14),
      p.title.slice(0, 42).padEnd(42),
      `[${r1} / ${r2} / ${r3}]`
    );
    console.log(
      '  connector:', connectorType,
      '| power:', chargingPower || '—',
      '| form:', formFactor || '—'
    );
  }

  console.log('\n─────────────────────────────');
  console.log(`OK: ${ok}  EXISTS: ${exists}  SKIP: ${skip}  ERROR: ${errors}`);
  console.log('Done.');
}

run().catch(e => { console.error('FAILED:', e.message); process.exitCode = 1; });
