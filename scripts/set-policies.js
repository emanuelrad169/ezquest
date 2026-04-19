require('dotenv').config({ path: '.env.local' });
const STORE = process.env.SHOPIFY_FLAG_STORE || process.env.SHOPIFY_SHOP_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

const policies = [
  {
    handle: 'privacy_policy',
    body: `<h2>Privacy Policy</h2>
<p>We value your privacy as much as we value your business. All information submitted to EZQuest is held strictly in private. All information you submit is kept securely behind firewall protection. Our SSL data encryption ensures no one can read your information as it is transmitted over the internet. We do not and never will sell any customer information.</p>

<h3>Cookies</h3>
<p>Cookies are identifiers we transfer to your computer through your web browser. Cookies allow us to provide services and features that enhance your shopping experience. Most browsers have help features that explain how to prevent cookies from being accepted.</p>

<h3>Email communications</h3>
<p>We do not spam. Periodically we may send information via email about new product releases or online discounts. Only EZQuest will send you these communications. To be removed from our mailing list at any time, write to us at <a href="mailto:support@ezq.com">support@ezq.com</a> or use the unsubscribe link in any email.</p>

<h2>Terms of Use</h2>
<p>EZQuest Corporation has developed these Site Terms to govern your use of EZQuest's site. Your access to and use of the site indicates your agreement to these terms.</p>

<h3>Content ownership</h3>
<p>All information, text, photographs, images, audio clips, video, source code, data, and other materials on this site are owned and copyrighted by EZQuest or its subsidiaries, licensors, or business partners. You may use content online solely for personal, non-commercial use. No other use is permitted without the express written consent of EZQuest.</p>

<h3>Disclaimer of warranties</h3>
<p>While EZQuest uses reasonable efforts to include accurate and up-to-date information, we make no warranties as to the accuracy of the content and assume no liability for any error or omission.</p>

<h3>Exclusion of liability</h3>
<p>Your use of the site is at your own risk. EZQuest is not liable for any direct, indirect, incidental, special, or consequential damages arising from use of this site or its content.</p>

<h3>Revisions to terms</h3>
<p>EZQuest reserves the right to change these terms at any time. Your continued use of the site after any amendments constitutes your agreement to the revised terms.</p>`
  },
  {
    handle: 'terms_of_service',
    body: `<h2>Terms of Service</h2>
<p>By visiting our site and purchasing from us, you engage in our service and agree to be bound by these terms and conditions. These terms apply to all users of the site.</p>

<h3>Online store terms</h3>
<p>You may not use our products for any illegal or unauthorized purpose. You must not transmit any harmful or destructive code. A breach of any of these terms will result in immediate termination of your services.</p>

<h3>Products and pricing</h3>
<p>We reserve the right to refuse service to anyone for any reason at any time. Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product at any time without notice.</p>

<h3>Accuracy of information</h3>
<p>We are not responsible if information made available on this site is not accurate, complete, or current. The material on this site is provided for general information only and should not be relied upon as the sole basis for decisions without consulting primary, more accurate, more complete, or more timely sources of information.</p>

<h3>Modifications to service</h3>
<p>We reserve the right to modify or discontinue the service at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>

<h3>Contact information</h3>
<p>Questions about the Terms of Service should be sent to us at <a href="mailto:support@ezq.com">support@ezq.com</a>.</p>`
  },
  {
    handle: 'refund_policy',
    body: `<h2>Refund &amp; Return Policy</h2>
<p>EZQuest warranty obligations for a product you have purchased are limited to the terms set forth in this document.</p>

<h3>Warranty coverage</h3>
<p>EZQuest offers a two (2) year limited warranty from the original date of purchase. We will offer a new replacement for a product due to a manufacturer's defect. This warranty does not cover products that become defective due to misuse, lack of care, mishandling, accident, abuse, or other abnormal use.</p>

<p>This EZQuest limited warranty is non-transferable and covers only the original end purchaser. A copy of the sales receipt from the original retailer is required for warranty coverage.</p>

<p>Warranty only covers users who purchase from EZQuest.com or an authorized EZQuest reseller. This warranty does not cover products purchased from online auction websites or unauthorized third-party sellers.</p>

<h3>Return process</h3>
<p>All warranty claims must be made by emailing <a href="mailto:support@ezq.com">support@ezq.com</a>. All returned products must include an EZQuest-issued RMA (Return Materials Authorization) number which will be provided via email with return instructions.</p>

<p>Please clearly write your RMA number on the outside of your package. To obtain an RMA number, email our customer service department during the warranty period and state why the product is defective. You must include a copy of the sales receipt.</p>

<h3>30-day return window</h3>
<p>In addition to warranty coverage, we offer a 30-day return window from the date of delivery for products in original, unused condition in original packaging. Contact us within 30 days to initiate a return.</p>

<h3>Refund timeline</h3>
<p>Once a return is received and inspected, refunds are issued within 5–7 business days to the original payment method. The time for refunds to appear on your statement depends on your payment provider.</p>

<h3>Damaged in transit</h3>
<p>EZQuest is not liable for products damaged or lost in transit to EZQuest. We recommend using a trackable shipping method for all returns.</p>`
  }
];

async function setPolicy(handle, body) {
  const res = await fetch(
    `https://${STORE}/admin/api/2024-01/policies.json`,
    {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ policy: { handle, body } })
    }
  );
  const data = await res.json();
  if (data.errors) {
    console.log(`NOTE (${handle}):`, JSON.stringify(data.errors));
    console.log('Set manually: Admin → Settings → Policies');
  } else {
    console.log(`SET: ${handle} →`, data.policy?.handle || 'ok');
  }
}

(async () => {
  for (const p of policies) {
    await setPolicy(p.handle, p.body);
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('Done.');
})();
