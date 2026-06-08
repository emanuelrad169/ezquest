(function () {
  'use strict';

  var STORAGE_KEY = 'ez_wishlist';
  var CHANNEL_NAME = 'ez_wishlist_sync';
  var channel = null;

  try {
    if ('BroadcastChannel' in window) channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    channel = null;
  }

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    broadcastWishlist(items);
    refreshWishlistUi();
  }

  function broadcastWishlist(items) {
    if (!channel) return;
    channel.postMessage({ type: 'wishlist:update', items: items });
  }

  function refreshWishlistUi() {
    updateWishlistCount();
    updateButtons();
    renderWishlistPage();
  }

  function isWishlisted(id) {
    return getWishlist().some(function (item) { return String(item.id) === String(id); });
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toggleWishlist(id, title, url, image, price) {
    var items = getWishlist();
    var idx = items.findIndex(function (item) { return String(item.id) === String(id); });
    if (idx > -1) {
      items.splice(idx, 1);
      saveWishlist(items);
      return false;
    } else {
      items.push({ id: String(id), title: title, url: url, image: image, price: price, added: Date.now() });
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
    var items = document.getElementById('wishlist-items');
    var empty = document.getElementById('wishlist-empty');
    var counter = document.getElementById('wishlist-count');
    if (!grid) return;

    var saved = getWishlist();

    if (counter) {
      counter.textContent = saved.length === 0
        ? ''
        : saved.length + ' item' + (saved.length !== 1 ? 's' : '');
    }

    if (saved.length === 0) {
      if (empty) empty.hidden = false;
      if (items) items.innerHTML = '';
      return;
    }

    if (empty) empty.hidden = true;

    if (!items) return;
    items.innerHTML = '';

    saved.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'wishlist-card';
      var itemTitle = escapeHTML(item.title || 'Product');
      var itemUrl = escapeHTML(item.url || '#');
      var itemImage = escapeHTML(item.image || '');
      var itemPrice = escapeHTML(item.price || '');
      var itemId = escapeHTML(item.id || '');
      card.innerHTML =
        '<div class="wishlist-card__image-wrap">' +
          (itemImage
            ? '<img src="' + itemImage + '" alt="' + itemTitle + '" class="wishlist-card__image" loading="lazy" decoding="async">'
            : '<div class="wishlist-card__image-placeholder" aria-hidden="true"></div>') +
          '<button class="wishlist-card__remove" data-remove-id="' + itemId + '" type="button" aria-label="Remove from wishlist">' +
            '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" focusable="false">' +
              '<path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
        '<div class="wishlist-card__body">' +
          '<a href="' + itemUrl + '" class="wishlist-card__title">' + itemTitle + '</a>' +
          (itemPrice ? '<div class="wishlist-card__price">' + itemPrice + '</div>' : '') +
        '</div>' +
        '<a href="' + itemUrl + '" class="wishlist-card__atc">View product</a>';

      card.querySelector('[data-remove-id]').addEventListener('click', function () {
        var current = getWishlist();
        var i = current.findIndex(function (x) { return String(x.id) === String(this.dataset.removeId); }, this);
        if (i > -1) current.splice(i, 1);
        saveWishlist(current);
      });

      items.appendChild(card);
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
    var price = btn.dataset.wishlistPrice || '';
    var active = toggleWishlist(id, title, url, image, price);
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
    refreshWishlistUi();
  });

  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY) refreshWishlistUi();
  });

  if (channel) {
    channel.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'wishlist:update') return;
      refreshWishlistUi();
    });
  }

  window.EZWishlist = { getWishlist: getWishlist, isWishlisted: isWishlisted, updateButtons: updateButtons };
})();
