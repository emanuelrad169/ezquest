const fs = require('fs');

const oldURLs = JSON.parse(
  fs.readFileSync('scripts/ezq-old-urls.json', 'utf8')
);
const products = fs.existsSync('scripts/shopify-products.json')
  ? JSON.parse(fs.readFileSync('scripts/shopify-products.json', 'utf8'))
  : [];

const COLLECTION_MAP = {
  '/usb-c-hubs-docks.html': '/collections/hubs-adapters',
  '/usb-c-hubs-docks': '/collections/hubs-adapters',
  '/usb-c-cables.html': '/collections/accessories',
  '/usb-c-adapters.html': '/collections/accessories',
  '/usb-c-card-reader.html': '/collections/accessories',
  '/usb-c-enclosure.html': '/collections/accessories',
  '/hdmi-cables-adapters.html': '/collections/accessories',
  '/displayport-cables-adapters.html': '/collections/accessories',
  '/mini-displayport-thunderbolt-3.html': '/collections/accessories',
  '/audio-cables-adapters.html': '/collections/accessories',
  '/wall-chargers.html': '/collections/chargers-power',
  '/car-chargers.html': '/collections/chargers-power',
  '/purchase.html': '/pages/where-to-buy',
  '/blog': '/blogs/resources',
  '/blog/': '/blogs/resources',
  '/support': '/pages/support',
  '/support/': '/pages/support',
  '/faq': '/pages/faq',
  '/warranty': '/pages/warranty',
  '/contact': '/pages/contact',
  '/contact/': '/pages/contact',
  '/about': '/pages/about'
};

function urlToPath(fullUrl) {
  try {
    return new URL(fullUrl).pathname;
  } catch (e) {
    return fullUrl;
  }
}

function findProductMatch(oldPath) {
  const clean = oldPath
    .replace(/\.(html?|php|asp)$/i, '')
    .replace(/^\//, '');

  const exact = products.find((p) => p.handle === clean);
  if (exact) return exact.shopify_url;

  const oldWords = clean
    .split(/[-_/]/)
    .filter((word) => word.length > 3);

  let bestScore = 0;
  let bestMatch = null;

  products.forEach((product) => {
    const productWords = product.handle.split('-');
    const titleWords = product.title.toLowerCase().split(/\s+/);
    const allWords = [...productWords, ...titleWords];
    const score = oldWords.filter((word) =>
      allWords.some((productWord) =>
        productWord.includes(word) || word.includes(productWord)
      )
    ).length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  });

  return bestScore >= 2 && bestMatch ? bestMatch.shopify_url : null;
}

function readSeedRedirects() {
  if (!fs.existsSync('docs/redirects.csv')) return [];

  return fs.readFileSync('docs/redirects.csv', 'utf8')
    .split('\n')
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const [path, target] = line.split(',').map((value) => value.trim());
      return path && target ? { path, target, type: 'seed' } : null;
    })
    .filter(Boolean);
}

const redirects = [];
const unmatched = [];
const seen = new Set();

function addRedirect(path, target, type) {
  const key = `${path} -> ${target}`;
  if (seen.has(key)) return;
  seen.add(key);
  redirects.push({ path, target, type });
}

readSeedRedirects().forEach((redirect) => {
  addRedirect(redirect.path, redirect.target, redirect.type);
});

oldURLs.forEach((oldUrl) => {
  const oldPath = urlToPath(oldUrl);
  if (oldPath === '/' || oldPath === '') return;

  const collectionTarget = COLLECTION_MAP[oldPath] ||
    COLLECTION_MAP[oldPath.replace(/\/$/, '')];

  if (collectionTarget) {
    addRedirect(oldPath, collectionTarget, 'collection');
    return;
  }

  const productTarget = findProductMatch(oldPath);
  if (productTarget) {
    addRedirect(oldPath, productTarget, 'product');
    return;
  }

  if (oldPath.includes('/blog/')) {
    addRedirect(oldPath, '/blogs/resources', 'blog');
    return;
  }

  unmatched.push(oldPath);
});

const csv = ['Path,Target,Type'];
redirects.forEach((redirect) => {
  csv.push(`"${redirect.path}","${redirect.target}","${redirect.type}"`);
});
fs.writeFileSync('docs/redirects-full.csv', csv.join('\n'));
fs.writeFileSync('scripts/unmatched-urls.json', JSON.stringify(unmatched, null, 2));

console.log('\n=== REDIRECT MAP RESULTS ===');
console.log('Total old URLs:', oldURLs.length);
console.log('Fallback seed redirects:', readSeedRedirects().length);
console.log('Redirects mapped:', redirects.length);
console.log('Unmatched:', unmatched.length);
console.log('\nBy type:');
const byType = {};
redirects.forEach((redirect) => {
  byType[redirect.type] = (byType[redirect.type] || 0) + 1;
});
Object.entries(byType).forEach(([type, count]) => {
  console.log(' ', `${type}:`, count);
});

if (unmatched.length > 0) {
  console.log('\nUnmatched URLs (need manual mapping):');
  unmatched.forEach((url) => console.log(' -', url));
}

console.log('\nSaved: docs/redirects-full.csv');
