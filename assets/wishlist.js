(function () {
  'use strict';

  var STORAGE_KEY = 'ez_wishlist';

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateWishlistCount();
  }

  function isWishlisted(id) {
    return getWishlist().some(function (item) { return String(item.id) === String(id); });
  }

  function toggleWishlist(id, title, url, image) {
    var items = getWishlist();
    var idx = items.findIndex(function (item) { return String(item.id) === String(id); });
    if (idx > -1) {
      items.splice(idx, 1);
      saveWishlist(items);
      return false;
    } else {
      items.push({ id: String(id), title: title, url: url, image: image, added: Date.now() });
      saveWishlist(items);
      return true;
    }
  }

  function updateButtons() {
    document.querySelectorAll('[data-wishlist-id]').forEach(function (btn) {
      var id = btn.dataset.wishlistId;
      var active = isWishlisted(id);
      btn.classList.toggle('is-wishlisted', active);
      btn.setAttribute('aria-pressed', String(active));
      var title = btn.dataset.wishlistTitle || '';
      btn.setAttribute('aria-label', (active ? 'Remove from wishlist: ' : 'Add to wishlist: ') + title);
    });
  }

  function renderWishlistPage() {
    var grid = document.getElementById('wishlist-grid');
    var empty = document.getElementById('wishlist-empty');
    if (!grid) return;

    var items = getWishlist();

    var existing = grid.querySelector('.wishlist-products');
    if (existing) existing.remove();

    if (items.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;

    var container = document.createElement('div');
    container.className = 'wishlist-products collection-product-grid';

    items.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'wishlist-item';
      card.innerHTML =
        '<a href="' + (item.url || '/') + '" class="wishlist-item__link">' +
          (item.image
            ? '<img src="' + item.image + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" class="wishlist-item__image" loading="lazy" decoding="async">'
            : '<div class="wishlist-item__image-placeholder"></div>') +
          '<div class="wishlist-item__body">' +
            '<p class="wishlist-item__title">' + (item.title || '') + '</p>' +
          '</div>' +
        '</a>' +
        '<button class="wishlist-item__remove btn btn--secondary btn--sm" data-remove-id="' + item.id + '" type="button">Remove</button>';
      container.appendChild(card);
    });

    grid.appendChild(container);

    container.querySelectorAll('[data-remove-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = getWishlist();
        var i = current.findIndex(function (x) { return String(x.id) === String(btn.dataset.removeId); });
        if (i > -1) current.splice(i, 1);
        saveWishlist(current);
        renderWishlistPage();
        updateButtons();
      });
    });
  }

  /* Click handler — delegated */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wishlist-id]');
    if (!btn) return;
    var id = btn.dataset.wishlistId;
    var title = btn.dataset.wishlistTitle || '';
    var url = btn.dataset.wishlistUrl || '';
    var image = btn.dataset.wishlistImage || '';
    var active = toggleWishlist(id, title, url, image);
    btn.classList.toggle('is-wishlisted', active);
    btn.setAttribute('aria-pressed', String(active));
    showToast(active ? title + ' saved to wishlist' : title + ' removed from wishlist');
  });

  /* Toast */
  function showToast(message) {
    var toast = document.getElementById('ez-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ez-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2500);
  }

  /* Count badge */
  function updateWishlistCount() {
    var count = getWishlist().length;
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
    });
  }

  /* Init */
  document.addEventListener('DOMContentLoaded', function () {
    updateButtons();
    updateWishlistCount();
    renderWishlistPage();
  });

  window.EZWishlist = { getWishlist: getWishlist, isWishlisted: isWishlisted, updateButtons: updateButtons };
})();
