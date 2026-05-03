require('dotenv').config({ path: '.env.local' });

const S = process.env.SHOPIFY_SHOP_DOMAIN;
const T = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const H = {
  'X-Shopify-Access-Token': T,
  'Content-Type': 'application/json'
};
const BASE = `https://${S}/admin/api/2026-01`;

async function api(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, { headers: H, ...options });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json;
}

async function upsertPage() {
  const existing = await api('/pages.json?handle=sitemap-priority');
  const page = existing.pages?.[0];
  const payload = {
    page: {
      title: 'sitemap-priority.xml',
      handle: 'sitemap-priority',
      body_html: '',
      template_suffix: 'sitemap-priority',
      published: true
    }
  };

  if (page) {
    const updated = await api(`/pages/${page.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ page: { id: page.id, ...payload.page } })
    });
    return updated.page;
  }

  const created = await api('/pages.json', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return created.page;
}

async function upsertRedirect() {
  const existing = await api('/redirects.json?path=/sitemap-priority.xml');
  const redirect = existing.redirects?.find((item) => item.path === '/sitemap-priority.xml');
  const payload = {
    redirect: {
      path: '/sitemap-priority.xml',
      target: '/pages/sitemap-priority'
    }
  };

  if (redirect) {
    const updated = await api(`/redirects/${redirect.id}.json`, {
      method: 'PUT',
      body: JSON.stringify({ redirect: { id: redirect.id, ...payload.redirect } })
    });
    return updated.redirect;
  }

  const created = await api('/redirects.json', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return created.redirect;
}

(async () => {
  const page = await upsertPage();
  console.log('Page:', page.id, page.handle, 'template:', page.template_suffix);
  const redirect = await upsertRedirect();
  console.log('Redirect:', redirect.path, '->', redirect.target);
})();
