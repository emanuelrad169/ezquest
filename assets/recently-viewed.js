/*
  Add to layout/theme.liquid before </body>:
  {{ 'recently-viewed.js' | asset_url | script_tag }}
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'ez_recently_viewed';
  var MAX_STORED = 12;

  function canUseStorage() {
    try {
      var testKey = STORAGE_KEY + '_test';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  function getStoredProducts() {
    if (!canUseStorage()) return [];

    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setStoredProducts(products) {
    if (!canUseStorage()) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products.slice(0, MAX_STORED)));
    } catch (error) {
      return;
    }
  }

  function getMetaContent(selector) {
    var meta = document.querySelector(selector);
    return meta && meta.content ? meta.content : '';
  }

  function normalizeUrl(url) {
    if (!url) return '';

    try {
      return new URL(url, window.location.origin).pathname;
    } catch (error) {
      return url;
    }
  }

  function trackProduct() {
    var idNode = document.querySelector('[data-product-id]');
    var priceNode = document.querySelector('[data-product-price]');
    var title = getMetaContent('meta[property="og:title"]');
    var image = getMetaContent('meta[property="og:image"]');
    var url = getMetaContent('meta[property="og:url"]') || window.location.href;
    var price = priceNode && priceNode.dataset ? priceNode.dataset.productPrice : '';
    var id = idNode && idNode.dataset ? idNode.dataset.productId : '';
    var type = idNode && idNode.dataset ? (idNode.dataset.productType || '') : '';
    var created = idNode && idNode.dataset ? (idNode.dataset.productCreated || '') : '';

    if (!id) {
      id = normalizeUrl(url) || window.location.pathname;
    }

    if (!title || !url) return;

    var product = {
      id: id,
      title: title,
      url: url,
      image: image,
      price: price,
      type: type,
      created: created
    };

    var products = getStoredProducts().filter(function (item) {
      return item && item.id !== product.id;
    });

    products.unshift(product);
    setStoredProducts(products);
  }

  function esc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  // Build a card that reuses the standard product-card class names so the
  // shared theme CSS styles it identically to collection/search cards.
  function createProductCard(item) {
    var article = document.createElement('article');
    article.className = 'product-card product-card-tile product-card-tile--featured-strip product-card-tile--collection card-elevated card-interactive relative flex h-full flex-col overflow-hidden text-slate-950 no-underline';

    var url = esc(item.url || '#');
    var title = esc(item.title || '');
    var image = item.image ? esc(item.image) : '';
    var price = item.price ? esc(item.price) : '';
    var type = item.type ? esc(item.type) : '';

    var mediaImg = image
      ? '<img class="card-img product-card-image product-card-featured-image" src="' + image + '" alt="' + title + '" loading="lazy" width="400" height="400">'
      : '';

    var isNew = item.created && (Date.now() / 1000 - parseInt(item.created, 10)) < 60 * 86400;
    var badge = isNew ? '<div class="product-badges" aria-label="Product features"><span class="product-badge product-badge--new">New</span></div>' : '';

    article.innerHTML =
      '<div class="product-card-featured-media-shell relative">' +
        badge +
        '<a href="' + url + '" class="product-card-featured-media product-card-featured-media-link relative flex min-h-56 items-center justify-center overflow-hidden border-b border-slate-200/70 bg-white no-underline" aria-label="View ' + title + '">' +
          '<div class="card-img-wrap aspect-card w-full">' + mediaImg + '</div>' +
        '</a>' +
        '<div class="product-card__wishlist">' +
          '<button class="wishlist-btn" type="button" aria-pressed="false" aria-label="Add ' + title + ' to wishlist"' +
            ' data-wishlist-id="' + esc(item.id) + '" data-wishlist-title="' + title + '" data-wishlist-url="' + url + '" data-wishlist-image="' + image + '" data-wishlist-price="' + price + '">' +
            '<svg class="wishlist-btn__icon" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M10 16.5S2.5 12 2.5 6.5a4 4 0 017.5-2A4 4 0 0117.5 6.5c0 5.5-7.5 10-7.5 10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="product-card-featured-body flex flex-1 flex-col gap-3 px-4 pb-4 pt-3 lg:px-5">' +
        '<div class="product-card-featured-copy grid gap-1.5">' +
          (type ? '<p class="product-card-featured-vendor">' + type + '</p>' : '') +
          '<div class="product-card-featured-title-price-row flex items-start justify-between gap-3">' +
            '<h3 class="card-title product-card-featured-title"><a href="' + url + '" class="product-card-featured-title-link">' + title + '</a></h3>' +
            '<div class="product-card-featured-price"><span class="price-amount">' + price + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    return article;
  }

  function renderRecentlyViewed(maxProducts) {
    var section = document.getElementById('recently-viewed');
    var grid = document.getElementById('rv-grid');
    if (!section || !grid) return;

    var currentPath = window.location.pathname;
    var products = getStoredProducts().filter(function (item) {
      if (!item || !item.url) return false;
      return normalizeUrl(item.url) !== currentPath;
    }).slice(0, maxProducts);

    if (!products.length) {
      section.hidden = true;
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = '';
    products.forEach(function (item) {
      grid.appendChild(createProductCard(item));
    });

    section.hidden = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var section = document.getElementById('recently-viewed');
    if (!section) return;

    var maxAttr = section.getAttribute('data-max') || '4';
    var max = parseInt(maxAttr, 10);

    if (!Number.isFinite(max) || max < 1) {
      max = 4;
    }

    if (document.body.classList.contains('template-product')) {
      trackProduct();
    }

    renderRecentlyViewed(max);
  });

  window.EZRecentlyViewed = {
    trackProduct: trackProduct,
    renderRecentlyViewed: renderRecentlyViewed
  };
})();
