(function () {
  var modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  var backdrop = document.getElementById('qv-backdrop');
  var closeBtn = document.getElementById('qv-close');
  var body = document.getElementById('qv-body');
  var cache = {};
  var EZRoutes = window.EZRoutes || { root: '/', cartAdd: '/cart/add' };

  function localizedPath(path) {
    var root = EZRoutes.root || '/';
    return root.replace(/\/?$/, '/') + path.replace(/^\//, '');
  }

  function openModal() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function money(cents) {
    var amount = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat((window.EZMoney && window.EZMoney.locale) || document.documentElement.lang || 'en', {
        style: 'currency',
        currency: (window.EZMoney && window.EZMoney.currency) || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD',
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (e) {
      return '$' + amount.toFixed(2).replace(/\.00$/, '');
    }
  }

  function buildBody(product) {
    var v = product.variants[0];
    var img = product.featured_image
      ? product.featured_image + '&width=600&format=webp'
      : '';

    var compareHtml = (v.compare_at_price && v.compare_at_price > v.price)
      ? '<span class="qv-modal__price-compare">' + money(v.compare_at_price) + '</span>'
      : '';

    var available = v.available;

    return '<div class="qv-modal__img-wrap">' +
      (img ? '<img class="qv-modal__img" src="' + img + '" alt="' + (product.title || '').replace(/"/g, '&quot;') + '" width="600" height="600">' : '') +
      '</div>' +
      '<div class="qv-modal__body">' +
      (product.vendor ? '<p class="qv-modal__vendor">' + product.vendor + '</p>' : '') +
      '<p class="qv-modal__title">' + product.title + '</p>' +
      '<p class="qv-modal__price">' + money(v.price) + compareHtml + '</p>' +
      '<button class="qv-modal__atc" data-qv-atc data-variant-id="' + v.id + '"' + (available ? '' : ' disabled') + '>' +
        (available ? 'Add to cart' : 'Sold out') +
      '</button>' +
      '<a href="' + localizedPath('/products/' + product.handle) + '" class="qv-modal__view-link">View full details →</a>' +
      '</div>';
  }

  function addToCart(variantId, btn) {
    btn.disabled = true;
    btn.textContent = 'Adding…';
    fetch((EZRoutes.cartAdd || '/cart/add') + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity: 1 }] })
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      btn.textContent = 'Added!';
      setTimeout(function () {
        closeModal();
        document.dispatchEvent(new CustomEvent('cart:refresh'));
      }, 800);
    })
    .catch(function () {
      btn.disabled = false;
      btn.textContent = 'Add to cart';
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-quick-view]');
    if (trigger) {
      var handle = trigger.dataset.quickView;
      if (!handle) return;
      body.innerHTML = '<div style="padding:3rem;text-align:center;color:#6e6e73;font-size:14px;">Loading…</div>';
      openModal();
      if (cache[handle]) {
        body.innerHTML = buildBody(cache[handle]);
        return;
      }
      fetch(localizedPath('/products/' + handle + '.js'))
        .then(function (r) { return r.json(); })
        .then(function (product) {
          cache[handle] = product;
          body.innerHTML = buildBody(product);
        })
        .catch(function () {
          body.innerHTML = '<div style="padding:3rem;text-align:center;color:#6e6e73">Could not load product.</div>';
        });
    }

    var atcBtn = e.target.closest('[data-qv-atc]');
    if (atcBtn) {
      addToCart(atcBtn.dataset.variantId, atcBtn);
    }
  });

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });
})();
