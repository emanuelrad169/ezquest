/* EZQuest analytics bridge: GA4 dataLayer + optional Shopify analytics publish. */
(function () {
  'use strict';

  var scrollDepths = [25, 50, 75, 100];
  var firedDepths = {};
  var articleReadFired = false;
  var searchLoadFired = false;

  window.dataLayer = window.dataLayer || [];

  function clean(value) {
    return String(value || '').trim();
  }

  function currencyCode() {
    return (window.EZMoney && window.EZMoney.currency) || 'USD';
  }

  function moneyValue(value) {
    if (typeof value === 'number') return value;
    var cleaned = clean(value).replace(/[^0-9.-]/g, '');
    var parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function quantityValue(value) {
    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  }

  function pageType() {
    var body = document.body;
    if (!body) return 'page';
    if (body.classList.contains('template-index')) return 'homepage';
    if (body.classList.contains('template-product')) return 'pdp';
    if (body.classList.contains('template-article')) return 'article';
    if (body.classList.contains('template-collection')) return 'collection';
    if (body.classList.contains('template-search')) return 'search';
    return 'page';
  }

  function gaItem(data) {
    data = data || {};
    return {
      item_id: clean(data.variant_id || data.product_id || data.item_id),
      item_name: clean(data.product_title || data.item_name),
      item_category: clean(data.product_category || data.product_type || data.item_category),
      price: moneyValue(data.price),
      quantity: quantityValue(data.quantity)
    };
  }

  function publishGA4(eventName, payload) {
    if (typeof window.gtag !== 'function') return;

    var item = gaItem(payload);
    var quantity = quantityValue(payload.quantity);
    var value = moneyValue(payload.value || payload.price);
    var items = Array.isArray(payload.cart_items) ? payload.cart_items : [item];

    if (eventName === 'product_view') {
      window.gtag('event', 'view_item', {
        currency: currencyCode(),
        value: value,
        items: [item]
      });
      return;
    }

    if (eventName === 'add_to_cart') {
      window.gtag('event', 'add_to_cart', {
        currency: currencyCode(),
        value: value * quantity,
        items: [item]
      });
      return;
    }

    if (eventName === 'begin_checkout') {
      window.gtag('event', 'begin_checkout', {
        currency: currencyCode(),
        value: moneyValue(payload.cart_total),
        items: items.map(gaItem)
      });
      return;
    }

    if (eventName === 'mega_menu_open') {
      window.gtag('event', 'mega_menu_open', {
        panel_type: clean(payload.panel_type || payload.panel) || 'unknown'
      });
      return;
    }

    window.gtag('event', eventName, payload);
  }

  function publish(eventName, data) {
    var payload = Object.assign({
      page_type: pageType(),
      page_path: window.location.pathname
    }, data || {});

    window.dataLayer.push(Object.assign({ event: eventName }, payload));

    publishGA4(eventName, payload);

    if (window.Shopify && window.Shopify.analytics && typeof window.Shopify.analytics.publish === 'function') {
      window.Shopify.analytics.publish(eventName, payload);
    }

    window.dispatchEvent(new CustomEvent('ez:analytics', {
      detail: Object.assign({ event: eventName }, payload)
    }));
  }

  function selectedVariantId(form) {
    var variantInput = form && form.querySelector('[name="id"]');
    return variantInput ? clean(variantInput.value) : '';
  }

  function formQuantity(form) {
    var quantityInput = form && form.querySelector('[name="quantity"]');
    return quantityValue(quantityInput ? quantityInput.value : 1);
  }

  function productPayload(root) {
    root = root || document.querySelector('[data-product-root]');
    if (!root) return {};

    var title = root.querySelector('.product-buybox-title');
    return {
      product_id: root.getAttribute('data-product-id') || '',
      product_title: title ? clean(title.textContent) : '',
      price: clean(root.getAttribute('data-product-price') || ''),
      product_url: window.location.pathname
    };
  }

  function quickAddPayload(button) {
    var card = button && button.closest('.product-card');
    var price = card && card.querySelector('.product-card-price, .product-card-featured-price');

    return {
      product_id: button ? button.getAttribute('data-quick-add-id') || '' : '',
      product_title: button ? button.getAttribute('data-quick-add-title') || '' : '',
      price: price ? clean(price.textContent) : '',
      product_url: card && card.querySelector('a[href*="/products/"]') ? card.querySelector('a[href*="/products/"]').pathname : window.location.pathname
    };
  }

  function cartItemsFromDom() {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.cart-drawer-item, .cart-item'));

    return rows.map(function (row) {
      var title = row.querySelector('.cart-drawer-item__name, .cart-item-title');
      var price = row.querySelector('.cart-drawer-item__price, .cart-item-price');
      var quantity = row.querySelector('.cart-drawer-item__qty, .cart-item-qty-display');
      var qty = quantityValue(quantity ? quantity.value || quantity.textContent : 1);
      var linePrice = moneyValue(price ? price.textContent : 0);

      return {
        item_id: row.getAttribute('data-key') || '',
        item_name: title ? clean(title.textContent) : '',
        price: qty > 0 ? linePrice / qty : linePrice,
        quantity: qty
      };
    }).filter(function (item) {
      return item.item_name;
    });
  }

  function cartPayloadFromDom() {
    var total = document.querySelector('.cart-summary-total span:last-child, [data-cart-subtotal], #cart-drawer-subtotal, .cart-drawer__subtotal-amount');
    var items = cartItemsFromDom();
    var itemTotal = items.reduce(function (sum, item) {
      return sum + moneyValue(item.price) * quantityValue(item.quantity);
    }, 0);

    return {
      cart_total: total ? moneyValue(total.textContent) : itemTotal,
      cart_items: items
    };
  }

  function fireProductView() {
    var root = document.querySelector('[data-product-root]');
    if (root) publish('product_view', productPayload(root));
  }

  function filterPayload(input) {
    var group = input.closest('.collection-filter-group');
    var label = group && group.querySelector('.collection-filter-group__name');
    var option = input.closest('.collection-filter-option');
    var optionLabel = option && option.querySelector('.collection-filter-option__text');

    return {
      filter_name: label ? clean(label.textContent) : clean(input.name),
      filter_value: optionLabel ? clean(optionLabel.textContent) : clean(input.value),
      filter_param: clean(input.name)
    };
  }

  function trackSearchForm(form, source) {
    var input = form.querySelector('input[type="search"], input[name="q"]');
    var query = input ? clean(input.value) : '';
    if (!query) return;

    publish(source === 'support' ? 'support_search' : 'site_search_submit', {
      search_term: query,
      search_source: source || 'site'
    });
  }

  function fireSearchPageLoad() {
    if (searchLoadFired) return;

    var params = new URLSearchParams(window.location.search);
    var query = clean(params.get('q'));
    if (!query || window.location.pathname.indexOf('/search') === -1) return;

    var shell = document.querySelector('[data-site-search-results]');
    searchLoadFired = true;
    publish('site_search', {
      search_term: query,
      results: shell ? Number(shell.getAttribute('data-site-search-results') || 0) : undefined
    });
  }

  function trackScrollDepth() {
    var type = pageType();
    if (['homepage', 'pdp', 'article', 'collection'].indexOf(type) === -1) return;

    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    var scrollHeight = Math.max(body.scrollHeight, doc.scrollHeight) - window.innerHeight;
    var percent = scrollHeight <= 0 ? 100 : Math.min(100, Math.round((scrollTop / scrollHeight) * 100));

    scrollDepths.forEach(function (depth) {
      if (percent >= depth && !firedDepths[type + ':' + depth]) {
        firedDepths[type + ':' + depth] = true;
        publish('scroll_depth', {
          depth_percent: depth,
          scroll_depth: depth,
          scroll_page_type: type
        });
      }
    });

    if (type === 'article' && percent >= 75 && !articleReadFired) {
      articleReadFired = true;
      publish('article_read', {
        depth_percent: 75,
        article_url: window.location.pathname
      });
    }
  }

  function initClicks() {
    document.addEventListener('click', function (event) {
      var atc = event.target.closest('[data-product-primary-button], [data-sticky-atc-button], .quick-add-btn--atc');
      if (atc && !atc.disabled) {
        var form = atc.closest('form') || document.querySelector('form[id^="ProductForm-"]');
        var basePayload = atc.classList.contains('quick-add-btn--atc') ? quickAddPayload(atc) : productPayload();
        publish('add_to_cart', Object.assign(basePayload, {
          variant_id: selectedVariantId(form),
          quantity: formQuantity(form),
          trigger: atc.hasAttribute('data-sticky-atc-button') ? 'sticky_atc' : atc.hasAttribute('data-product-primary-button') ? 'pdp' : 'card'
        }));
      }

      if (event.target.closest('.cart-drawer__checkout, [href="/checkout"], [name="checkout"]')) {
        publish('begin_checkout', cartPayloadFromDom());
      }

      var megaTrigger = event.target.closest('[data-mega-target]');
      if (megaTrigger) {
        publish('mega_menu_open', {
          panel_type: (megaTrigger.getAttribute('data-mega-target') || '').replace(/^ez-mega-/, '') || 'unknown'
        });
      }

      if (event.target.closest('[data-search-mega-trigger]')) {
        publish('mega_menu_open', { panel_type: 'search' });
      }

      var wishlist = event.target.closest('[data-wishlist-id]');
      if (wishlist) {
        var isRemoving = wishlist.classList.contains('is-wishlisted') || wishlist.getAttribute('aria-pressed') === 'true';
        publish(isRemoving ? 'wishlist_remove' : 'wishlist_add', {
          product_id: wishlist.getAttribute('data-wishlist-id') || '',
          product_title: wishlist.getAttribute('data-wishlist-title') || ''
        });
      }

      var blogChip = event.target.closest('.blog-filter-chip');
      if (blogChip) {
        publish('filter_applied', {
          filter_name: 'blog_tag',
          filter_value: clean(blogChip.textContent)
        });
      }
    });
  }

  function initChanges() {
    document.addEventListener('change', function (event) {
      var collectionFilter = event.target.closest('.collection-filter-option__input, .collection-filter-price__input, [data-filter-input]');
      if (collectionFilter) {
        publish('filter_applied', filterPayload(collectionFilter));
      }
    });
  }

  function initSubmits() {
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form || !form.matches('form')) return;

      if (form.matches('[data-support-search]') || form.querySelector('#SupportSearch')) {
        trackSearchForm(form, 'support');
        return;
      }

      var action = form.getAttribute('action') || '';
      if (action.indexOf('/search') > -1 || form.querySelector('input[name="q"]')) {
        trackSearchForm(form, form.closest('[data-search-mega-panel]') ? 'header' : 'site');
      }
    });
  }

  function initNotify() {
    window.addEventListener('ez:notify-me-submit', function (event) {
      publish('notify_me_submit', event.detail || {});
    });

    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-notify-submit]')) {
        publish('notify_me_submit_attempt', productPayload());
      }
    });
  }

  function initScroll() {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        trackScrollDepth();
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    trackScrollDepth();
  }

  function init() {
    fireProductView();
    fireSearchPageLoad();
    initClicks();
    initChanges();
    initSubmits();
    initNotify();
    initScroll();
  }

  window.EZAnalytics = {
    publish: publish,
    trackScrollDepth: trackScrollDepth
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
