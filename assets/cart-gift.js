// assets/cart-gift.js - Gift message handler
(function () {
  'use strict';

  function getCartUpdateUrl() {
    if (window.EZRoutes && window.EZRoutes.cartUpdate) {
      return window.EZRoutes.cartUpdate + '.js';
    }
    return '/cart/update.js';
  }

  function setStatus(root, message) {
    var status = root.querySelector('[data-cart-gift-status]');
    if (status) status.textContent = message || '';
  }

  function setOpen(root, open) {
    var toggle = root.querySelector('[data-cart-gift-toggle]');
    var body = root.querySelector('[data-cart-gift-body]');
    var textarea = root.querySelector('[data-cart-gift-textarea]');

    if (toggle) {
      toggle.checked = open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (body) body.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open && textarea) textarea.focus();
  }

  function updateCounter(root) {
    var textarea = root.querySelector('[data-cart-gift-textarea]');
    var counter = root.querySelector('[data-cart-gift-count]');
    if (textarea && counter) counter.textContent = textarea.value.length;
  }

  function saveMessage(root) {
    var textarea = root.querySelector('[data-cart-gift-textarea]');
    var saveBtn = root.querySelector('[data-cart-gift-save]');
    if (!textarea || !saveBtn) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    setStatus(root, '');

    fetch(getCartUpdateUrl(), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ note: textarea.value })
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Cart note update failed');
        saveBtn.textContent = 'Saved';
        setStatus(root, 'Gift message saved.');
        setTimeout(function () {
          saveBtn.textContent = 'Save message';
          saveBtn.disabled = false;
        }, 2000);
      })
      .catch(function () {
        saveBtn.textContent = 'Error - try again';
        setStatus(root, 'Could not save the gift message. Please try again.');
        saveBtn.disabled = false;
      });
  }

  function initGiftMessage(root) {
    if (!root || root.dataset.cartGiftReady === 'true') return;

    var toggle = root.querySelector('[data-cart-gift-toggle]');
    var textarea = root.querySelector('[data-cart-gift-textarea]');
    var saveBtn = root.querySelector('[data-cart-gift-save]');
    if (!toggle || !textarea || !saveBtn) return;

    root.dataset.cartGiftReady = 'true';
    updateCounter(root);
    setOpen(root, toggle.checked);

    toggle.addEventListener('change', function () {
      setOpen(root, toggle.checked);
      if (!toggle.checked) {
        textarea.value = '';
        updateCounter(root);
        saveMessage(root);
      }
    });

    textarea.addEventListener('input', function () {
      updateCounter(root);
      setStatus(root, '');
    });

    saveBtn.addEventListener('click', function () {
      saveMessage(root);
    });
  }

  function initAllGiftMessages() {
    document.querySelectorAll('[data-cart-gift]').forEach(initGiftMessage);
  }

  document.addEventListener('DOMContentLoaded', initAllGiftMessages);
  document.addEventListener('cart:opened', initAllGiftMessages);
  document.addEventListener('cart:updated', initAllGiftMessages);
})();
