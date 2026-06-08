(function () {
  'use strict';

  var EZRoutes = window.EZRoutes || { cartUpdate: '/cart/update' };
  var saveTimer = null;

  function setStatus(root, message) {
    var status = root && root.querySelector('[data-cart-gift-status]');
    if (status) status.textContent = message || '';
  }

  function updateNote(root, note) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      fetch((EZRoutes.cartUpdate || '/cart/update') + '.js', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: note || '' })
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Cart note update failed');
          setStatus(root, note ? 'Gift message saved.' : 'Gift message removed.');
        })
        .catch(function () {
          setStatus(root, 'Could not save yet. It will save on checkout from the cart page.');
        });
    }, 250);
  }

  function syncPanels(root, checked) {
    var panel = root.querySelector('[data-cart-gift-panel]');
    var textarea = root.querySelector('[data-cart-gift-textarea]');
    if (!panel || !textarea) return;

    panel.hidden = !checked;
    if (!checked) {
      textarea.value = '';
      updateNote(root, '');
      return;
    }

    textarea.focus();
  }

  document.addEventListener('change', function (event) {
    var toggle = event.target.closest('[data-cart-gift-toggle]');
    if (!toggle) return;

    var root = toggle.closest('[data-cart-gift-note]');
    if (!root) return;
    syncPanels(root, toggle.checked);
  });

  document.addEventListener('input', function (event) {
    var textarea = event.target.closest('[data-cart-gift-textarea]');
    if (!textarea) return;

    var root = textarea.closest('[data-cart-gift-note]');
    if (!root) return;
    setStatus(root, '');
  });

  document.addEventListener('blur', function (event) {
    var textarea = event.target.closest('[data-cart-gift-textarea]');
    if (!textarea) return;

    var root = textarea.closest('[data-cart-gift-note]');
    if (!root) return;
    updateNote(root, textarea.value.trim());
  }, true);

  document.addEventListener('click', function (event) {
    var checkout = event.target.closest('.cart-drawer__checkout');
    if (!checkout) return;

    var drawer = checkout.closest('#cart-drawer') || document;
    var textarea = drawer.querySelector('[data-cart-gift-textarea]');
    if (!textarea) return;
    updateNote(textarea.closest('[data-cart-gift-note]'), textarea.value.trim());
  });
})();
