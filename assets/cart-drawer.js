/* ─── EZQuest Cart Drawer ─────────────────────────────────────────────────── */
/* Hooks into the existing data-drawer system in theme.js                      */
/* openDrawer() / closeDrawer() are globals defined in theme.js                */

(function () {
  var DRAWER_ID = 'cart-drawer';

  /* ── Helpers ─────────────────────────────────────────────── */

  function getDrawer() {
    return document.getElementById(DRAWER_ID);
  }

  function setBodyLoading(loading) {
    var body = document.getElementById('cart-drawer-body');
    if (body) body.classList.toggle('is-loading', loading);
  }

  function updateCartBadges(cart) {
    var count = cart && typeof cart.item_count === 'number' ? cart.item_count : 0;

    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.setAttribute('data-cart-count', String(count));
      if (!el.matches('button, a')) {
        el.textContent = count;
      }
    });

    document.querySelectorAll('[data-cart-count-badge]').forEach(function (el) {
      el.textContent = count;
      el.hidden = count === 0;
      el.setAttribute('aria-label', count + ' item' + (count === 1 ? '' : 's') + ' in cart');
    });
  }

  /* ── Refresh via Sections API ────────────────────────────── */

  function refreshDrawerContents(callback) {
    setBodyLoading(true);

    fetch('/cart?sections=cart-drawer-body,cart-drawer-footer')
      .then(function (res) {
        if (!res.ok) throw new Error('sections fetch failed');
        return res.json();
      })
      .then(function (data) {
        var parser = new DOMParser();

        var bodyEl = document.getElementById('cart-drawer-body');
        if (bodyEl && data['cart-drawer-body']) {
          var doc = parser.parseFromString(data['cart-drawer-body'], 'text/html');
          var inner = doc.querySelector('.cart-drawer__body');
          if (inner) bodyEl.innerHTML = inner.innerHTML;
        }

        var footerEl = document.getElementById('cart-drawer-footer');
        if (footerEl && data['cart-drawer-footer']) {
          var doc2 = parser.parseFromString(data['cart-drawer-footer'], 'text/html');
          var inner2 = doc2.querySelector('.cart-drawer__footer');
          if (inner2) footerEl.innerHTML = inner2.innerHTML;
        }

        // Update global cart count badges (header icon etc.)
        return fetch('/cart.js');
      })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var countEl = document.getElementById('cart-drawer-count');
        if (countEl) countEl.textContent = '(' + cart.item_count + ')';
        updateCartBadges(cart);
        if (typeof callback === 'function') callback(cart);
      })
      .catch(function (err) {
        console.error('[EZCartDrawer] refresh error', err);
      })
      .finally(function () {
        setBodyLoading(false);
      });
  }

  /* ── Public API ──────────────────────────────────────────── */

  window.openCartDrawer = function (controller) {
    var drawer = getDrawer();
    if (drawer && typeof openDrawer === 'function') {
      openDrawer(drawer, controller);
    }
  };

  window.closeCartDrawer = function () {
    var drawer = getDrawer();
    if (drawer && typeof closeDrawer === 'function') {
      closeDrawer(drawer);
    }
  };

  /* Refresh content then open — called by PDP after successful ATC */
  window.refreshAndOpenCartDrawer = function () {
    refreshDrawerContents(function () {
      window.openCartDrawer();
    });
  };

  document.addEventListener('cart:open', function () {
    window.refreshAndOpenCartDrawer();
  });

  /* ── Delegated click handlers inside drawer ──────────────── */

  document.addEventListener('click', function (e) {
    var cartTrigger = e.target.closest('[data-cart-drawer-trigger]');
    if (cartTrigger) {
      e.preventDefault();
      refreshDrawerContents(function () {
        window.openCartDrawer(cartTrigger);
      });
      return;
    }

    /* Continue shopping */
    if (e.target.closest('[data-cart-continue]')) {
      window.closeCartDrawer();
      return;
    }

    /* Qty + remove */
    var btn = e.target.closest('[data-cart-action]');
    if (!btn) return;

    var action = btn.dataset.cartAction;
    var key = btn.dataset.key;
    if (!key) return;

    setBodyLoading(true);

    var newQty;

    if (action === 'remove') {
      newQty = 0;
    } else if (action === 'increase') {
      var qtyEl = document.querySelector('[data-cart-qty="' + key + '"]');
      newQty = qtyEl ? parseInt(qtyEl.textContent, 10) + 1 : 2;
    } else if (action === 'decrease') {
      var qEl = document.querySelector('[data-cart-qty="' + key + '"]');
      var current = qEl ? parseInt(qEl.textContent, 10) : 1;
      newQty = Math.max(0, current - 1);
    }

    if (newQty === undefined) {
      setBodyLoading(false);
      return;
    }

    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: newQty })
    })
      .then(function () {
        refreshDrawerContents();
      })
      .catch(function (err) {
        console.error('[EZCartDrawer] change error', err);
        setBodyLoading(false);
      });
  });
}());
