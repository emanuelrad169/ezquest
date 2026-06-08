'use strict';

// Crawls each product page on legacy ezq.com looking for embedded videos.
// Reads docs/ezq-redirects.csv to build the URL list.
// Output: docs/migration/legacy-videos-extracted.csv
//
// Usage: node scripts/audit/extract-legacy-videos.js
//
// Cloudflare notes:
//   - Uses a real Chrome User-Agent + Accept headers to avoid bot detection
//   - 2-second delay between requests
//   - If still blocked (403/429), run with --slow flag for 5-second delays
//   - If CF challenges all requests, use the manual Chrome extension approach
//     and hand-enter the CSV rows

const fs   = require('fs');
const path = require('path');

const REDIRECTS_CSV  = path.join(__dirname, '..', '..', 'docs', 'ezq-redirects.csv');
const OUT_DIR        = path.join(__dirname, '..', '..', 'docs', 'migration');
const OUT_CSV        = path.join(OUT_DIR, 'legacy-videos-extracted.csv');
const LEGACY_BASE    = 'https://www.ezq.com';
const DELAY_MS       = process.argv.includes('--slow') ? 5000 : 2000;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const FETCH_HEADERS = {
  'User-Agent':      UA,
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control':   'no-cache',
  'Pragma':          'no-cache',
  'Sec-Fetch-Dest':  'document',
  'Sec-Fetch-Mode':  'navigate',
  'Sec-Fetch-Site':  'none',
  'Upgrade-Insecure-Requests': '1',
};

// ─── CSV parse ─────────────────────────────────────────────────────────────────

function parseRedirects(filePath) {
  const rows = [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(l => l.trim());
  for (let i = 1; i < lines.length; i++) {
    const [from, to] = lines[i].split(',').map(s => s.trim());
    if (!from || !to || !to.startsWith('/products/')) continue;
    const handle = to.replace('/products/', '').split('/')[0].split('?')[0];
    rows.push({ legacyPath: from, shopifyHandle: handle });
  }
  return rows;
}

// ─── Video extraction patterns ─────────────────────────────────────────────────

function extractYouTubeId(text) {
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/,
    /ytimg\.com\/vi\/([a-zA-Z0-9_-]{11})\//,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractVimeoId(text) {
  const patterns = [
    /vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/(\d{6,})/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1];
  }
  return null;
}

function extractNativeVideo(text) {
  const m = text.match(/<video[^>]*\ssrc="([^"]+\.mp4[^"]*)"/i)
           || text.match(/<source[^>]*\ssrc="([^"]+\.mp4[^"]*)"/i);
  return m ? m[1] : null;
}

function extractVideoObject(text) {
  try {
    const m = text.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (!m) return null;
    for (const block of m) {
      const json = block.replace(/<[^>]+>/g, '').trim();
      const parsed = JSON.parse(json);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item['@type'] === 'VideoObject') {
          return item.contentUrl || item.embedUrl || null;
        }
        if (item['@graph']) {
          for (const node of item['@graph']) {
            if (node['@type'] === 'VideoObject') {
              return node.contentUrl || node.embedUrl || null;
            }
          }
        }
      }
    }
  } catch (_) {}
  return null;
}

function findVideos(html, legacyUrl) {
  const found = [];

  const ytId = extractYouTubeId(html);
  if (ytId) {
    found.push({
      video_kind:        'youtube',
      video_id_or_url:   ytId,
      canonical_url:     `https://www.youtube.com/embed/${ytId}`,
      found_in:          'page_html',
    });
  }

  const vimeoId = extractVimeoId(html);
  if (vimeoId) {
    found.push({
      video_kind:        'vimeo',
      video_id_or_url:   vimeoId,
      canonical_url:     `https://player.vimeo.com/video/${vimeoId}`,
      found_in:          'page_html',
    });
  }

  const mp4 = extractNativeVideo(html);
  if (mp4) {
    const abs = mp4.startsWith('http') ? mp4 : LEGACY_BASE + mp4;
    found.push({
      video_kind:        'mp4',
      video_id_or_url:   abs,
      canonical_url:     abs,
      found_in:          'page_html',
    });
  }

  const vObj = extractVideoObject(html);
  if (vObj && !found.some(f => f.canonical_url === vObj)) {
    found.push({
      video_kind:        'structured_data',
      video_id_or_url:   vObj,
      canonical_url:     vObj,
      found_in:          'ld_json',
    });
  }

  return found;
}

// ─── URL liveness check ────────────────────────────────────────────────────────

async function checkLive(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    return res.ok || res.status === 405; // 405 = method not allowed → URL exists
  } catch (_) {
    return false;
  }
}

// ─── Delay helper ──────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── CSV output ────────────────────────────────────────────────────────────────

const COLS = ['legacy_url', 'shopify_handle', 'video_kind', 'video_id_or_url', 'canonical_url', 'live', 'found_in'];
function csvCell(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}
function csvRow(obj) {
  return COLS.map(c => csvCell(obj[c])).join(',');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const products = parseRedirects(REDIRECTS_CSV);
  console.log(`Found ${products.length} product redirects to check\n`);

  const rows = [];
  let blocked = 0;

  for (let i = 0; i < products.length; i++) {
    const { legacyPath, shopifyHandle } = products[i];
    const legacyUrl = LEGACY_BASE + legacyPath;

    process.stdout.write(`[${String(i + 1).padStart(2)}/${products.length}] ${shopifyHandle} ... `);

    let html = null;
    let status = null;

    try {
      const res = await fetch(legacyUrl, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      status = res.status;

      if (res.ok) {
        html = await res.text();
      } else if (res.status === 403 || res.status === 429) {
        blocked++;
        console.log(`BLOCKED (${res.status})`);
        rows.push({
          legacy_url:      legacyUrl,
          shopify_handle:  shopifyHandle,
          video_kind:      'blocked',
          video_id_or_url: '',
          canonical_url:   '',
          live:            '',
          found_in:        `HTTP_${res.status}`,
        });
        await sleep(DELAY_MS * 2);
        continue;
      } else {
        console.log(`HTTP ${res.status}`);
        rows.push({
          legacy_url:      legacyUrl,
          shopify_handle:  shopifyHandle,
          video_kind:      'error',
          video_id_or_url: '',
          canonical_url:   '',
          live:            '',
          found_in:        `HTTP_${res.status}`,
        });
        await sleep(DELAY_MS);
        continue;
      }
    } catch (err) {
      console.log(`FETCH_ERR: ${err.message}`);
      rows.push({
        legacy_url:      legacyUrl,
        shopify_handle:  shopifyHandle,
        video_kind:      'error',
        video_id_or_url: '',
        canonical_url:   '',
        live:            '',
        found_in:        `FETCH_ERR: ${err.message}`,
      });
      await sleep(DELAY_MS);
      continue;
    }

    const videos = findVideos(html, legacyUrl);

    if (videos.length === 0) {
      console.log('no video');
      rows.push({
        legacy_url:      legacyUrl,
        shopify_handle:  shopifyHandle,
        video_kind:      'none',
        video_id_or_url: '',
        canonical_url:   '',
        live:            '',
        found_in:        '',
      });
    } else {
      for (const v of videos) {
        process.stdout.write(`\n  → ${v.video_kind}: ${v.canonical_url.slice(0, 60)} `);
        const live = await checkLive(v.canonical_url);
        console.log(live ? '✓ live' : '✗ 404');
        rows.push({
          legacy_url:      legacyUrl,
          shopify_handle:  shopifyHandle,
          ...v,
          live: live ? 'yes' : 'no',
        });
      }
    }

    if (i < products.length - 1) await sleep(DELAY_MS);
  }

  const csv = [COLS.join(','), ...rows.map(csvRow)].join('\n');
  fs.writeFileSync(OUT_CSV, csv);

  const found    = rows.filter(r => r.video_kind !== 'none' && r.video_kind !== 'error' && r.video_kind !== 'blocked');
  const live     = found.filter(r => r.live === 'yes');
  const noVideo  = rows.filter(r => r.video_kind === 'none');
  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`Products checked:      ${products.length}`);
  console.log(`With video found:      ${new Set(found.map(r => r.shopify_handle)).size}`);
  console.log(`Live video URLs:       ${live.length}`);
  console.log(`No video:              ${noVideo.length}`);
  console.log(`Blocked/error:         ${blocked}`);
  console.log(`Output: ${OUT_CSV}`);
})();
