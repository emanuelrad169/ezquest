(function () {
  var container = document.querySelector('.shopify-policy__container');
  if (!container) return;

  var path = window.location.pathname;
  var handle = path.split('/').pop() || '';

  function isActive(h) {
    return handle === h ? ' is-active' : '';
  }

  var sidebarHTML = '<aside class="policy-sidebar">'
    + '<div class="policy-sidebar__card">'
    + '<p class="policy-sidebar__label">Legal documents</p>'
    + '<nav class="policy-sidebar__nav">'
    + '<a href="/policies/privacy-policy" class="policy-sidebar__link' + isActive('privacy-policy') + '">Privacy Policy</a>'
    + '<a href="/policies/terms-of-service" class="policy-sidebar__link' + isActive('terms-of-service') + '">Terms of Service</a>'
    + '<a href="/policies/refund-policy" class="policy-sidebar__link' + isActive('refund-policy') + '">Refund Policy</a>'
    + '<a href="/pages/shipping-returns" class="policy-sidebar__link' + isActive('shipping-returns') + '">Shipping &amp; Returns</a>'
    + '<a href="/pages/cookie-policy" class="policy-sidebar__link' + isActive('cookie-policy') + '">Cookie Policy</a>'
    + '<a href="/pages/warranty" class="policy-sidebar__link' + isActive('warranty') + '">Warranty</a>'
    + '</nav>'
    + '</div>'
    + '<div class="policy-sidebar__card policy-sidebar__card--help">'
    + '<p class="policy-sidebar__help-title">Questions?</p>'
    + '<p class="policy-sidebar__help-body">We respond within 1 business day.</p>'
    + '<a href="/pages/contact" class="btn btn--primary" style="display:block;text-align:center;margin-top:1rem;border-radius:100px">Contact us</a>'
    + '</div>'
    + '</aside>';

  var body = container.querySelector('.shopify-policy__body');
  if (!body) return;

  var layout = document.createElement('div');
  layout.className = 'policy-native-layout';

  container.insertBefore(layout, body);
  layout.appendChild(body);
  layout.insertAdjacentHTML('beforeend', sidebarHTML);
})();
