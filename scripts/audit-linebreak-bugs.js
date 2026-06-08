// Audits product body_html for camelCase run-together text (missing line breaks).
// Does NOT auto-patch. Outputs CSV for content team review.
//
// Requires: SHOPIFY_ADMIN_API_TOKEN env var with read_products scope
// Run: node scripts/audit-linebreak-bugs.js > audit.csv 2> summary.txt

const STORE = 'ezquest-4.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-10';

const ALLOWLIST = [
  // Apple
  'iPhone', 'iPad', 'iPod', 'iMac', 'iCloud', 'iOS', 'iTunes',
  'macOS', 'tvOS', 'watchOS',
  'MacBook', 'AirPods', 'AirPlay', 'AirDrop',
  // Display / port standards
  'DisplayPort', 'SuperSpeed',
  // EZQuest product line names
  'UltimatePower', 'DuraGuard', 'UltraSlim', 'WorldTravel',
  // Tech abbreviations
  'eMMC', 'mDP', 'mPCIe', 'NetBoot',
  'USB-C', 'USB-A', 'USB-B',
  'ChromeOS', 'ChromeBook',
  // Third-party brands
  'YouTube', 'PayPal', 'eBay', 'OnePlus', 'ZenPad',
  'GbE', 'TbE',
];

function findBreakBugs(html) {
  if (!html) return [];
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const matches = [];
  const re = /(\w*[a-z])([A-Z]\w*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const fullMatch = m[0];
    if (ALLOWLIST.some(allowed => fullMatch.includes(allowed))) continue;
    if (m[1].length < 3) continue;
    const start = Math.max(0, m.index - 40);
    const end = Math.min(text.length, m.index + fullMatch.length + 40);
    matches.push({
      match: fullMatch,
      leftPart: m[1],
      rightPart: m[2],
      context: text.slice(start, end).trim(),
      suggestedFix: `${m[1]}</li><li>${m[2]}`,
    });
  }
  return matches;
}

async function fetchAllProducts() {
  if (!TOKEN) throw new Error('SHOPIFY_ADMIN_API_TOKEN env var is not set');
  const products = [];
  let url = `https://${STORE}/admin/api/${API_VERSION}/products.json?limit=250&fields=id,title,handle,body_html`;
  while (url) {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': TOKEN },
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    products.push(...data.products);
    const link = res.headers.get('link');
    const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch ? nextMatch[1] : null;
  }
  return products;
}

function csvEscape(str) {
  if (str == null) return '';
  const s = String(str);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

(async () => {
  const products = await fetchAllProducts();
  process.stdout.write('product_id,handle,title,match_count,match,context,suggested_fix,admin_url\n');
  let totalMatches = 0;
  let productsWithBugs = 0;
  for (const p of products) {
    const bugs = findBreakBugs(p.body_html);
    if (bugs.length === 0) continue;
    productsWithBugs++;
    totalMatches += bugs.length;
    for (const bug of bugs) {
      process.stdout.write([
        p.id,
        p.handle,
        csvEscape(p.title),
        bugs.length,
        csvEscape(bug.match),
        csvEscape(bug.context),
        csvEscape(bug.suggestedFix),
        `https://${STORE}/admin/products/${p.id}`,
      ].join(',') + '\n');
    }
  }
  process.stderr.write(`\nScanned ${products.length} products\n`);
  process.stderr.write(`Found ${totalMatches} potential issues across ${productsWithBugs} products\n`);
})();
