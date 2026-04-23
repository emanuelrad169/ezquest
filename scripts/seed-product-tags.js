require('dotenv').config({ path: '.env.local' });

const S = process.env.SHOPIFY_SHOP_DOMAIN || process.env.SHOPIFY_STORE;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN;
const BASE = 'https://' + S + '/admin/api/2026-01';
const H = {
  'X-Shopify-Access-Token': T,
  'Content-Type': 'application/json',
};

// Tag map: if product title/type contains key, add tags.
const TAG_RULES = [
  { match: /\b4.?port|\b4.?in.?1/i, tags: ['ports-4'] },
  { match: /\b5.?in.?1/i, tags: ['ports-5'] },
  { match: /\b6.?in.?1/i, tags: ['ports-6'] },
  { match: /\b7.?in.?1|\b7.?port/i, tags: ['ports-7'] },
  { match: /\b8.?in.?1|\b8.?port/i, tags: ['ports-8'] },
  { match: /\b10.?in.?1|\b10.?port/i, tags: ['ports-10'] },
  { match: /\b12.?in.?1|\b12.?port/i, tags: ['ports-12'] },
  { match: /\b13.?in.?1|\b13.?port/i, tags: ['ports-13'] },

  { match: /\b30w\b/i, tags: ['wattage-30w'] },
  { match: /\b45w\b/i, tags: ['wattage-45w'] },
  { match: /\b65w\b/i, tags: ['wattage-65w'] },
  { match: /\b70w\b/i, tags: ['wattage-70w'] },
  { match: /\b90w\b/i, tags: ['wattage-90w'] },
  { match: /\b120w\b/i, tags: ['wattage-120w'] },
  { match: /\bgan\b/i, tags: ['gan-technology'] },
  { match: /\bwall.?charger/i, tags: ['charger-type-wall'] },
  { match: /\bcar.?charger/i, tags: ['charger-type-car'] },

  { match: /thunderbolt.?5|tb5/i, tags: ['connection-thunderbolt5'] },
  { match: /thunderbolt.?4|tb4/i, tags: ['connection-thunderbolt4'] },
  { match: /thunderbolt.?3|tb3/i, tags: ['connection-thunderbolt3'] },
  { match: /usb4|usb.?4/i, tags: ['connection-usb4'] },
  { match: /usb.?c/i, tags: ['connection-usb-c'] },

  { match: /dual.*hdmi|2.*hdmi/i, tags: ['display-dual-hdmi'] },
  { match: /4k.*60|60hz.*4k/i, tags: ['display-4k-60hz'] },
  { match: /8k/i, tags: ['display-8k'] },

  { match: /mac|macbook|imac/i, tags: ['compatible-mac'] },
  { match: /ipad/i, tags: ['compatible-ipad'] },

  { match: /coiled/i, tags: ['cable-coiled'] },
  { match: /right.?angle|angled/i, tags: ['cable-right-angle'] },
  { match: /braided|duraguard/i, tags: ['cable-braided'] },
  { match: /1\.2.?m|1\.2.?meter/i, tags: ['length-1-2m'] },
  { match: /2\.2.?m|2\.2.?meter/i, tags: ['length-2-2m'] },
  { match: /2\s?m\b|2.?meter/i, tags: ['length-2m'] },

  { match: /nvme|m\.2/i, tags: ['storage-nvme'] },
  { match: /magnet|magnetic/i, tags: ['feature-magnetic'] },

  { match: /.*/, tags: ['compatible-mac', 'compatible-windows'] },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProducts() {
  const r = await fetch(BASE + '/products.json?limit=250&fields=id,title,product_type,tags', { headers: H });
  const d = await r.json();
  return d.products || [];
}

async function updateTags(productId, existingTags, newTags) {
  const currentSet = new Set(existingTags.split(',').map((tag) => tag.trim()).filter(Boolean));
  const added = [];

  new Set(newTags).forEach((tag) => {
    if (!currentSet.has(tag)) {
      currentSet.add(tag);
      added.push(tag);
    }
  });

  if (added.length === 0) return { added };

  const r = await fetch(BASE + '/products/' + productId + '.json', {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ product: { id: productId, tags: [...currentSet].join(', ') } }),
  });
  const d = await r.json();

  if (d.errors) return { added: [], error: d.errors };
  return { added };
}

async function run() {
  if (!S || !T) throw new Error('Missing SHOPIFY_SHOP_DOMAIN/SHOPIFY_STORE or admin token');

  const products = await getProducts();
  console.log('Products:', products.length, '\n');

  let totalAdded = 0;
  let errors = 0;

  for (const p of products) {
    const search = (p.title + ' ' + p.product_type).toLowerCase();
    const tagsToAdd = [];

    TAG_RULES.forEach((rule) => {
      if (rule.match.test(search)) {
        rule.tags.forEach((tag) => tagsToAdd.push(tag));
      }
    });

    const result = await updateTags(p.id, p.tags || '', tagsToAdd);

    if (result.error) {
      errors += 1;
      console.log('ERROR:', p.title);
      console.log('  ', JSON.stringify(result.error));
    } else if (result.added.length > 0) {
      console.log('TAGGED:', p.title);
      console.log('  Added:', result.added.join(', '));
      totalAdded += result.added.length;
    } else {
      console.log('SKIP:', p.title);
    }

    await delay(300);
  }

  console.log('\nTotal tags added:', totalAdded);
  console.log('Errors:', errors);
}

run().catch((e) => {
  console.log('FAILED:', e.message);
  process.exitCode = 1;
});
