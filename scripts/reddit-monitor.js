/**
 * reddit-monitor.js — Poll Reddit RSS feeds for EZQuest-relevant mentions
 * Run: node scripts/reddit-monitor.js
 * Output: .audit/reddit-mentions-YYYY-MM-DD.md
 *
 * Watches: r/mac, r/sysadmin, r/ultrabook, r/macbookpro, r/apple, r/homelab
 * Triggers: USB-C hub, GaN charger, EZQuest, DuraGuard, USB-C adapter
 */
const fs = require('fs');
const path = require('path');

const SUBREDDITS = [
  'mac', 'sysadmin', 'ultrabook', 'macbookpro', 'apple',
  'homelab', 'macmini', 'ipad', 'digitalnomad',
];

const KEYWORDS = [
  'ezquest', 'ez quest',
  'usb-c hub', 'usbc hub', 'usb c hub',
  'gan charger', 'gallium nitride',
  'duraGuard', 'dura guard',
  'usb-c adapter', 'usb-c dock', 'usb-c docking',
];

async function fetchSubredditRSS(sub) {
  const url = `https://www.reddit.com/r/${sub}/new.json?limit=25&t=day`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'EZQuest-Monitor/1.0 (brand monitoring)' },
    });
    if (!r.ok) return [];
    const json = await r.json();
    return (json.data?.children || []).map(c => ({
      subreddit: sub,
      title: c.data.title,
      url: `https://reddit.com${c.data.permalink}`,
      score: c.data.score,
      created: new Date(c.data.created_utc * 1000).toISOString().slice(0, 16),
      selftext: (c.data.selftext || '').slice(0, 300),
    }));
  } catch {
    return [];
  }
}

function isRelevant(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

(async () => {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [`# Reddit Monitor Report — ${now}\n`];
  let totalFound = 0;

  for (const sub of SUBREDDITS) {
    const posts = await fetchSubredditRSS(sub);
    const matches = posts.filter(isRelevant);

    if (matches.length > 0) {
      lines.push(`\n## r/${sub} (${matches.length} match${matches.length > 1 ? 'es' : ''})`);
      matches.forEach(p => {
        lines.push(`\n### ${p.title}`);
        lines.push(`- **URL:** ${p.url}`);
        lines.push(`- **Score:** ${p.score} · ${p.created}`);
        if (p.selftext) lines.push(`- **Preview:** ${p.selftext}...`);
      });
      totalFound += matches.length;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  if (totalFound === 0) {
    lines.push('\n_No relevant mentions found in the past 24 hours._');
  }

  lines.push(`\n---\n**Total mentions found:** ${totalFound}`);

  const out = lines.join('\n');
  fs.mkdirSync(path.join(__dirname, '../.audit'), { recursive: true });
  const outPath = path.join(__dirname, `../.audit/reddit-mentions-${now}.md`);
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nSaved: .audit/reddit-mentions-${now}.md`);
})();
