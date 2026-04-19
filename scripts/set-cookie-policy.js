require('dotenv').config({ path: '.env.local' });
const STORE = process.env.SHOPIFY_FLAG_STORE || process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const COOKIE_BODY = `<h2>Cookie Policy</h2>
<p>This Cookie Policy explains how EZQuest ("we", "us", "our") uses cookies and similar technologies on our website.</p>

<h3>What are cookies?</h3>
<p>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to website owners.</p>

<h3>How we use cookies</h3>
<p>We use cookies for the following purposes:</p>
<ul>
  <li><strong>Essential cookies</strong> — Required for the website to function. These include session cookies that remember your cart contents and login state.</li>
  <li><strong>Analytics cookies</strong> — Help us understand how visitors interact with our website. We use Shopify's built-in analytics for this purpose.</li>
  <li><strong>Preference cookies</strong> — Remember your settings and preferences such as your chosen language and region.</li>
  <li><strong>Marketing cookies</strong> — Used to track visitors across websites to display relevant advertisements. These are set by our advertising partners.</li>
</ul>

<h3>Third-party cookies</h3>
<p>Our website uses services from third parties that may set their own cookies on your device. These include:</p>
<ul>
  <li>Shopify — our e-commerce platform</li>
  <li>Google Analytics — website traffic analysis</li>
  <li>Judge.me — product review system</li>
</ul>

<h3>Managing cookies</h3>
<p>Most web browsers allow you to control cookies through browser settings. You can typically:</p>
<ul>
  <li>View cookies stored on your device</li>
  <li>Delete some or all cookies</li>
  <li>Block third-party cookies</li>
  <li>Block cookies from specific websites</li>
</ul>
<p>Note that restricting cookies may impact the functionality of our website, including your ability to add items to your cart or complete a purchase.</p>

<h3>Contact us</h3>
<p>If you have any questions about our use of cookies, please contact us at <a href="mailto:support@ezq.com">support@ezq.com</a> or via our <a href="/pages/contact">contact page</a>.</p>`;

async function run() {
  const listRes = await fetch(
    `https://${STORE}/admin/api/2024-01/pages.json?handle=cookie-policy`,
    { headers: { 'X-Shopify-Access-Token': TOKEN } }
  );
  const listData = await listRes.json();
  const page = listData.pages?.[0];

  if (!page) {
    console.log('cookie-policy page not found — creating');
    const createRes = await fetch(
      `https://${STORE}/admin/api/2024-01/pages.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: {
            title: 'Cookie Policy',
            handle: 'cookie-policy',
            body_html: COOKIE_BODY,
            published: true
          }
        })
      }
    );
    const d = await createRes.json();
    console.log('Created:', d.page?.handle || d.errors);
  } else {
    const updateRes = await fetch(
      `https://${STORE}/admin/api/2024-01/pages/${page.id}.json`,
      {
        method: 'PUT',
        headers: {
          'X-Shopify-Access-Token': TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page: { body_html: COOKIE_BODY } })
      }
    );
    const d = await updateRes.json();
    console.log('Updated:', d.page?.handle || d.errors);
  }
}

run();
