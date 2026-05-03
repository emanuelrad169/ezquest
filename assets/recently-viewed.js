/*
  Add to layout/theme.liquid before </body>:
  {{ 'recently-viewed.js' | asset_url | script_tag }}
*/

(function () {
  'use strict';

  var STORAGE_KEY = 'ez_recently_viewed';
  var MAX_STORED = 8;

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

    if (!id) {
      id = normalizeUrl(url) || window.location.pathname;
    }

    if (!title || !url) return;

    var product = {
      id: id,
      title: title,
      url: url,
      image: image,
      price: price
    };

    var products = getStoredProducts().filter(function (item) {
      return item && item.id !== product.id;
    });

    products.unshift(product);
    setStoredProducts(products);
  }

  function createProductCard(item) {
    var card = document.createElement('a');
    card.className = 'rv-card';
    card.href = item.url || '#';

    var imageWrap = document.createElement('div');
    imageWrap.className = 'rv-card__img-wrap';

    if (item.image) {
      var image = document.createElement('img');
      image.className = 'rv-card__img';
      image.src = item.image;
      image.alt = item.title || '';
      image.loading = 'lazy';
      image.width = 200;
      image.height = 200;
      imageWrap.appendChild(image);
    }

    var title = document.createElement('p');
    title.className = 'rv-card__title';
    title.textContent = item.title || '';

    var price = document.createElement('p');
    price.className = 'rv-card__price';
    price.textContent = item.price || '';

    card.appendChild(imageWrap);
    card.appendChild(title);
    card.appendChild(price);

    return card;
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
