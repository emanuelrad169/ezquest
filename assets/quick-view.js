(function () {
  'use strict';

  var modal = document.getElementById('quick-view-modal');
  if (!modal) return;

  var backdrop = document.getElementById('qv-backdrop');
  var closeBtn = document.getElementById('qv-close');
  var body = document.getElementById('qv-body');
  var cache = {};
  var lastFocus = null;
  var EZRoutes = window.EZRoutes || { root: '/', cartAdd: '/cart/add' };

  function localizedPath(path) {
    var root = EZRoutes.root || '/';
    return root.replace(/\/?$/, '/') + path.replace(/^\//, '');
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  function openModal() {
    lastFocus = document.activeElement;
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function buildImage(product) {
    var image = product.featured_image || '';
    if (!image) return '<div class="qv-modal__img-placeholder" aria-hidden="true"></div>';
    var separator = image.indexOf('?') > -1 ? '&' : '?';
    return '<img class="qv-modal__img" src="' + escapeHTML(image + separator + 'width=700') + '" alt="' + escapeHTML(product.title) + '" width="700" height="700" loading="eager" decoding="async">';
  }

  function buildVariants(product, selected) {
    if (!product.variants || product.variants.length <= 1) return '';
    return '<label class="qv-modal__variant-label" for="qv-variant-select">Options</label>' +
      '<select id="qv-variant-select" class="qv-modal__variant-select" data-qv-variant-select>' +
      product.variants.map(function (variant) {
        return '<option value="' + variant.id + '"' +
          ' data-price="' + variant.price + '"' +
          ' data-compare="' + (variant.compare_at_price || '') + '"' +
          ' data-available="' + (variant.available ? 'true' : 'false') + '"' +
          (variant.id === selected.id ? ' selected' : '') +
          '>' + escapeHTML(variant.title) + '</option>';
      }).join('') +
      '</select>';
  }

  function priceHTML(variant) {
    var compare = variant.compare_at_price && variant.compare_at_price > variant.price
      ? '<span class="qv-modal__price-compare">' + money(variant.compare_at_price) + '</span>'
      : '';
    return '<span data-qv-price>' + money(variant.price) + compare + '</span>';
  }

  function buildBody(product) {
    var variant = product.variants && product.variants.length ? product.variants[0] : null;
    if (!variant) {
      return '<div class="qv-modal__message">Could not load this product.</div>';
    }

    return '<div class="qv-modal__img-wrap">' + buildImage(product) + '</div>' +
      '<div class="qv-modal__body">' +
        (product.vendor ? '<p class="qv-modal__vendor">' + escapeHTML(product.vendor) + '</p>' : '') +
        '<h2 class="qv-modal__title">' + escapeHTML(product.title) + '</h2>' +
        '<p class="qv-modal__price">' + priceHTML(variant) + '</p>' +
        buildVariants(product, variant) +
        '<button class="qv-modal__atc" data-qv-atc data-variant-id="' + variant.id + '"' + (variant.available ? '' : ' disabled') + '>' +
          (variant.available ? 'Add to cart' : 'Sold out') +
        '</button>' +
        '<a href="' + escapeHTML(localizedPath('/products/' + product.handle)) + '" class="qv-modal__view-link">View full details</a>' +
      '</div>';
  }

  function setLoading() {
    body.innerHTML = '<div class="qv-modal__message">Loading...</div>';
  }

  function addToCart(variantId, btn) {
    btn.disabled = true;
    btn.textContent = 'Adding...';
    fetch((EZRoutes.cartAdd || '/cart/add') + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: parseInt(variantId, 10), quantity: 1 }] })
    })
      .then(function (response) {
        if (!response.ok) throw new Error('cart-add-failed');
        return response.json();
      })
      .then(function () {
        btn.textContent = 'Added';
        document.dispatchEvent(new CustomEvent('cart:refresh'));
        setTimeout(closeModal, 700);
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Add to cart';
      });
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-quick-view]');
    if (trigger) {
      event.preventDefault();
      var handle = trigger.dataset.quickView;
      if (!handle) return;

      setLoading();
      openModal();

      if (cache[handle]) {
        body.innerHTML = buildBody(cache[handle]);
        return;
      }

      fetch(localizedPath('/products/' + encodeURIComponent(handle) + '.js'))
        .then(function (response) {
          if (!response.ok) throw new Error('quick-view-fetch-failed');
          return response.json();
        })
        .then(function (product) {
          cache[handle] = product;
          body.innerHTML = buildBody(product);
        })
        .catch(function () {
          body.innerHTML = '<div class="qv-modal__message">Could not load product.</div>';
        });

      return;
    }

    var atcBtn = event.target.closest('[data-qv-atc]');
    if (atcBtn) {
      addToCart(atcBtn.dataset.variantId, atcBtn);
    }
  });

  document.addEventListener('change', function (event) {
    var select = event.target.closest('[data-qv-variant-select]');
    if (!select) return;

    var option = select.options[select.selectedIndex];
    var atc = modal.querySelector('[data-qv-atc]');
    var price = modal.querySelector('[data-qv-price]');
    var variant = {
      id: option.value,
      price: Number(option.dataset.price || 0),
      compare_at_price: Number(option.dataset.compare || 0),
      available: option.dataset.available === 'true'
    };

    if (price) price.outerHTML = priceHTML(variant);
    if (atc) {
      atc.dataset.variantId = variant.id;
      atc.disabled = !variant.available;
      atc.textContent = variant.available ? 'Add to cart' : 'Sold out';
    }
  });

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
  });
})();
