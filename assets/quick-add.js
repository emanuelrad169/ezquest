/*
  Add to layout/theme.liquid before </body>:
  {{ 'quick-add.js' | asset_url | script_tag }}
*/

var EZRoutes = window.EZRoutes || { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change' };

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.quick-add-btn--atc');
  if (!btn) return;

  var variantId = btn.dataset.quickAddId;
  var title = btn.dataset.quickAddTitle;
  if (!variantId) return;

  btn.classList.add('is-loading');
  var originalHTML = btn.innerHTML;
  btn.innerHTML = '<span>Adding…</span>';

  fetch(EZRoutes.cartAdd + '.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: parseInt(variantId, 10),
      quantity: 1
    })
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Cart add failed');
      return res.json();
    })
    .then(function () {
      btn.classList.remove('is-loading');
      btn.classList.add('is-added');
      btn.innerHTML = '<span>Added ✓</span>';

      document.dispatchEvent(new CustomEvent('cart:updated', {
        bubbles: true,
        detail: { title: title || '' }
      }));

      document.dispatchEvent(new CustomEvent('cart:open', {
        bubbles: true
      }));

      setTimeout(function () {
        btn.classList.remove('is-added');
        btn.innerHTML = originalHTML;
      }, 2000);
    })
    .catch(function () {
      btn.classList.remove('is-loading');
      btn.innerHTML = originalHTML;

      var productUrl = btn.closest('.product-card')?.querySelector('a')?.href;
      if (productUrl) window.location.href = productUrl;
    });
});
