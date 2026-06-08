/**
 * ai-visibility-check.js — Check EZQuest visibility in AI assistants
 * Run: node scripts/ai-visibility-check.js
 * Output: .audit/ai-visibility-YYYY-MM-DD.md
 *
 * Requires: PERPLEXITY_API_KEY in .env.local (optional — runs without it using fallback checks)
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;

const QUERIES = [
  'best USB-C hub for MacBook',
  'best compact GaN charger for travel',
  'best USB-C hub with HDMI and Ethernet',
  'EZQuest USB-C hub review',
  'reliable USB-C cable brand',
];

async function queryPerplexity(question) {
  if (!PERPLEXITY_KEY) return null;
  try {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: question }],
        max_tokens: 400,
      }),
    });
    if (!r.ok) return null;
    const json = await r.json();
    return json.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

function checkMention(text) {
  if (!text) return { mentioned: false, context: null };
  const lower = text.toLowerCase();
  const mentioned = lower.includes('ezquest');
  const idx = lower.indexOf('ezquest');
  const context = mentioned
    ? text.slice(Math.max(0, idx - 60), idx + 120).trim()
    : null;
  return { mentioned, context };
}

(async () => {
  const now = new Date().toISOString().slice(0, 10);
  const lines = [`# AI Visibility Check — ${now}\n`];

  if (!PERPLEXITY_KEY) {
    lines.push('> ⚠️ PERPLEXITY_API_KEY not set in .env.local — add it to enable live AI queries.\n');
    lines.push('Get a key at: https://www.perplexity.ai/settings/api\n');
  }

  let mentioned = 0;

  for (const query of QUERIES) {
    lines.push(`\n## "${query}"`);
    const answer = await queryPerplexity(query);

    if (!answer) {
      lines.push('_Skipped (no API key or request failed)_');
      continue;
    }

    const result = checkMention(answer);
    const icon = result.mentioned ? '✅' : '❌';
    lines.push(`${icon} EZQuest ${result.mentioned ? 'mentioned' : 'NOT mentioned'}`);

    if (result.context) {
      lines.push(`\n> "${result.context}..."`);
    }

    lines.push(`\n**Full answer (truncated):** ${answer.slice(0, 400)}...`);

    if (result.mentioned) mentioned++;
    await new Promise(r => setTimeout(r, 1000));
  }

  lines.push(`\n---\n**Mentions:** ${mentioned}/${QUERIES.length} queries`);
  lines.push('\n### Action items');
  lines.push('- If score < 3/5, publish more content targeting these keywords');
  lines.push('- Submit product pages to llms.txt-aware crawlers');
  lines.push('- Ensure /pages/llms is up to date with product specs');

  const out = lines.join('\n');
  fs.mkdirSync(path.join(__dirname, '../.audit'), { recursive: true });
  const outPath = path.join(__dirname, `../.audit/ai-visibility-${now}.md`);
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nSaved: .audit/ai-visibility-${now}.md`);
})();
