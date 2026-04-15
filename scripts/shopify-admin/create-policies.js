#!/usr/bin/env node
// Attempts to set shop policies via Admin API.
// Note: Shopify's Policies REST API is read-only (GET only).
// This script will detect that and print manual instructions with the full policy text.
// Run: node scripts/shopify-admin/create-policies.js

const fs = require('fs');
const path = require('path');

function parseEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return {};
  const contents = fs.readFileSync(filepath, 'utf8');
  const result = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }
  return result;
}

const env = { ...parseEnvFile(path.join(process.cwd(), '.env.local')), ...process.env };
const STORE  = env.SHOPIFY_SHOP_DOMAIN;
const TOKEN  = env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const VER    = env.SHOPIFY_ADMIN_API_VERSION || '2026-01';
const BASE   = `https://${STORE}/admin/api/${VER}`;
const HEADERS = { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' };

const policies = [
  {
    type: 'TermsOfServicePolicy',
    title: 'Terms of Service',
    body: `<h1>Terms of Service</h1>
<p>Last updated: April 15, 2026</p>
<h2>Overview</h2>
<p>This website is operated by EZQuest. By visiting our site and/or purchasing something from us,
you engage in our "Service" and agree to be bound by the following terms and conditions.</p>
<h2>Use of the site</h2>
<p>You may not use our products for any illegal or unauthorized purpose.
You must not transmit any worms or viruses or any code of a destructive nature.</p>
<h2>Products</h2>
<p>We reserve the right to refuse service to anyone for any reason at any time.
Prices for our products are subject to change without notice.</p>
<h2>Contact</h2>
<p>Questions about the Terms of Service should be sent to us at
<a href="/pages/contact">our contact page</a>.</p>`
  },
  {
    type: 'RefundPolicy',
    title: 'Refund Policy',
    body: `<h1>Refund Policy</h1>
<p>Last updated: April 15, 2026</p>
<h2>30-day return window</h2>
<p>We have a 30-day return policy, which means you have 30 days after receiving your item
to request a return.</p>
<h2>Eligibility</h2>
<p>To be eligible for a return, your item must be in the same condition that you received it —
unworn or unused, with tags, and in its original packaging.
You will also need the receipt or proof of purchase.</p>
<h2>How to start a return</h2>
<p>To start a return, contact us at our <a href="/pages/contact">contact page</a>.
If your return is accepted, we will send you a return shipping label along with instructions
on how and where to send your package.</p>
<h2>Damages and issues</h2>
<p>Please inspect your order upon receipt and contact us immediately if the item is defective,
damaged, or if you receive the wrong item.</p>
<h2>Refunds</h2>
<p>We will notify you once we have received and inspected your return.
If approved, you will be automatically refunded to your original payment method
within 10 business days.</p>
<h2>Warranty</h2>
<p>All EZQuest products come with a 2-year limited warranty.
Visit our <a href="/pages/warranty">warranty page</a> for details.</p>`
  }
];

async function checkCurrentPolicies() {
  const res = await fetch(`${BASE}/policies.json`, { headers: HEADERS });
  const data = await res.json();
  const existing = (data.policies || []).map(p => p.title);
  console.log('Current policies:', existing.length ? existing.join(', ') : 'none');
  return existing;
}

async function trySetPolicies() {
  // Try GraphQL shopPoliciesUpdate mutation (available in Admin GraphQL API)
  const mutation = `
    mutation shopPoliciesUpdate($policies: [ShopPolicyInput!]!) {
      shopPoliciesUpdate(policies: $policies) {
        userErrors { field message }
        shopPolicies { title url }
      }
    }
  `;
  const variables = {
    policies: policies.map(p => ({ type: p.type, body: p.body }))
  };

  const res = await fetch(`https://${STORE}/admin/api/${VER}/graphql.json`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ query: mutation, variables })
  });
  const data = await res.json();

  if (data.data?.shopPoliciesUpdate?.userErrors?.length > 0) {
    console.log('GraphQL userErrors:', JSON.stringify(data.data.shopPoliciesUpdate.userErrors));
    return false;
  }
  if (data.data?.shopPoliciesUpdate?.shopPolicies?.length > 0) {
    const updated = data.data.shopPoliciesUpdate.shopPolicies;
    console.log('UPDATED via GraphQL:');
    updated.forEach(p => console.log(`  - ${p.title}: ${p.url}`));
    return true;
  }
  if (data.errors) {
    console.log('GraphQL errors:', JSON.stringify(data.errors));
    return false;
  }
  return false;
}

async function main() {
  console.log(`Store: ${STORE}  API: ${VER}\n`);
  await checkCurrentPolicies();
  console.log('\nAttempting to set policies via GraphQL...');
  const success = await trySetPolicies();

  if (!success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MANUAL ACTION REQUIRED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin → Settings → Policies');
    console.log('Paste each policy below into the corresponding field.\n');
    for (const p of policies) {
      console.log(`\n===== ${p.title} =====`);
      console.log(p.body);
    }
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
