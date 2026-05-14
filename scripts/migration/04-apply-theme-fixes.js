'use strict';

const { loadEnv, shopifyGet, shopifyPut, sleep } = require('./lib');

const { store, token, base, themeId } = loadEnv();
const DRY_RUN = !process.argv.includes('--apply');

// Replacements to apply. Defined as { file, find (string|RegExp), replace, description }.
// Run 03-audit-hardcoded-domains.js first — if it reports 0 findings, this script
// will no-op (every replacement reports "no match") which is the expected clean state.
const FIXES = [
  // Hreflang block — remove entirely if the block is hardcoded.
  // Shopify auto-generates correct hreflang via content_for_header when locales are
  // published; this fix only triggers if someone hardcoded a static block in the theme.
  {
    file: 'layout/theme.liquid',
    find: /\s*<link rel="alternate" hreflang="[^"]+" href="https:\/\/ezquest-4\.myshopify\.com[^"]*"\s*\/?>/g,
    replace: '',
    description: 'Remove hardcoded hreflang tags',
  },
  // WebSite JSON-LD — URL fields (catches both escaped and unescaped variants)
  {
    file: 'layout/theme.liquid',
    find: /"url":\s*"https:\/\/ezquest-4\.myshopify\.com"/g,
    replace: '"url": {{ shop.url | json }}',
    description: 'Replace WebSite schema "url" with shop.url',
  },
  {
    file: 'layout/theme.liquid',
    find: /"urlTemplate":\s*"https:\/\/ezquest-4\.myshopify\.com\/search\?q=\{search_term_string\}"/g,
    replace: '"urlTemplate": "{{ shop.url }}/search?q={search_term_string}"',
    description: 'Replace SearchAction urlTemplate with shop.url',
  },
  // Organization schema publisher URL (Article JSON-LD)
  {
    file: 'layout/theme.liquid',
    find: /"url":\s*"https:\/\/ezquest-4\.myshopify\.com"(?!\s*,\s*"@type")/g,
    replace: '"url": {{ shop.url | json }}',
    description: 'Replace Article publisher "url" with shop.url',
  },
  // Catch-all: any remaining literal domain in theme.liquid
  {
    file: 'layout/theme.liquid',
    find: /https:\/\/ezquest-4\.myshopify\.com(?!\/cdn)/g,
    replace: '{{ shop.url }}',
    description: 'Replace remaining hardcoded domain in theme.liquid with shop.url',
  },
];

async function getAssetContent(key) {
  const url = `${base}/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`;
  const { json } = await shopifyGet(url, token);
  return json.asset?.value || null;
}

async function putAssetContent(key, value) {
  return shopifyPut(`${base}/themes/${themeId}/assets.json`, token, {
    asset: { key, value },
  });
}

(async () => {
  if (DRY_RUN) {
    console.log('DRY RUN — pass --apply to commit changes\n');
  }

  // Group fixes by file so we only fetch/put each file once
  const byFile = {};
  for (const fix of FIXES) {
    if (!byFile[fix.file]) byFile[fix.file] = [];
    byFile[fix.file].push(fix);
  }

  let totalMatches = 0;
  let filesChanged = 0;

  for (const [file, fixes] of Object.entries(byFile)) {
    console.log(`\n── ${file}`);
    let content = await getAssetContent(file);
    if (!content) {
      console.log(`  ✗ File not found in theme — skipping`);
      continue;
    }

    let changed = false;
    for (const fix of fixes) {
      const matchCount = (content.match(fix.find) || []).length;
      if (matchCount === 0) {
        console.log(`  ✓ ${fix.description}: no match (already clean)`);
        continue;
      }
      totalMatches += matchCount;
      console.log(`  ${DRY_RUN ? '[would fix]' : '[fixing]'} ${fix.description}: ${matchCount} match(es)`);
      content = content.replace(fix.find, fix.replace);
      changed = true;
    }

    if (changed && !DRY_RUN) {
      await putAssetContent(file, content);
      filesChanged++;
      console.log(`  ↑ Pushed to theme`);
      await sleep(500);
    }
  }

  console.log(`\n── Summary`);
  console.log(`Total matches found: ${totalMatches}`);

  if (DRY_RUN) {
    if (totalMatches === 0) {
      console.log('Theme is clean — no fixes needed.');
    } else {
      console.log(`Re-run with --apply to commit ${totalMatches} fix(es).`);
    }
  } else {
    console.log(`Files updated: ${filesChanged}`);
    if (totalMatches === 0) {
      console.log('Theme was already clean — nothing changed.');
    } else {
      console.log('Re-run 03-audit-hardcoded-domains.js to confirm 0 findings.');
    }
  }
})();
