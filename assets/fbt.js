/*
  Add to layout/theme.liquid before </body>:
  {{ 'fbt.js' | asset_url | script_tag }}
*/

(function () {
  'use strict';
  var EZRoutes = window.EZRoutes || { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change' };

  function formatMoney(cents) {
    var amount = parseInt(cents, 10);
    if (!Number.isFinite(amount)) amount = 0;
    return '$' + (amount / 100).toFixed(2);
  }

  function getSelectedCheckboxes(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll('.fbt-checkbox-row input[type="checkbox"]:checked')
    );
  }

  function updateTotal(container, totalEl, button) {
    var checked = getSelectedCheckboxes(container);
    var total = checked.reduce(function (sum, checkbox) {
      return sum + parseInt(checkbox.dataset.price || '0', 10);
    }, 0);

    totalEl.textContent = formatMoney(total);

    if (button) {
      button.disabled = checked.length === 0;
      button.textContent = checked.length === 0
        ? 'Select items'
        : 'Add all to cart';
    }
  }

  function createCheckbox(item, index, onChange) {
    var titleEl = item.querySelector('.fbt-item__title');
    var title = titleEl ? titleEl.textContent.trim() : 'Product';
    var variantId = item.dataset.variantId;
    var price = item.dataset.price || '0';
    var row = document.createElement('label');
    var checkbox = document.createElement('input');
    var text = document.createElement('span');

    row.className = 'fbt-checkbox-row';
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.dataset.variantId = variantId;
    checkbox.dataset.price = price;
    checkbox.setAttribute('aria-label', 'Include ' + title);
    checkbox.id = 'fbt-item-' + index;
    checkbox.addEventListener('change', onChange);
    text.textContent = title;

    row.appendChild(checkbox);
    row.appendChild(text);

    return row;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var items = Array.prototype.slice.call(document.querySelectorAll('.fbt-item'));
    var checkboxes = document.getElementById('fbt-checkboxes');
    var total = document.getElementById('fbt-total');
    var button = document.getElementById('fbt-add-all');

    if (!items.length || !checkboxes || !total || !button) return;

    function recalculate() {
      updateTotal(checkboxes, total, button);
    }

    items.forEach(function (item, index) {
      if (!item.dataset.variantId) return;
      checkboxes.appendChild(createCheckbox(item, index, recalculate));
    });

    recalculate();

    button.addEventListener('click', function () {
      var selected = getSelectedCheckboxes(checkboxes);
      if (!selected.length) return;

      var originalText = button.textContent;
      var payload = selected.map(function (checkbox) {
        return {
          id: parseInt(checkbox.dataset.variantId, 10),
          quantity: 1
        };
      }).filter(function (item) {
        return Number.isFinite(item.id);
      });

      if (!payload.length) return;

      button.classList.remove('is-added', 'is-error');
      button.classList.add('is-loading');
      button.disabled = true;
      button.textContent = 'Adding…';

      fetch(EZRoutes.cartAdd + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload })
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Cart add failed');
          return response.json();
        })
        .then(function () {
          button.classList.remove('is-loading');
          button.classList.add('is-added');
          button.textContent = 'Added to cart ✓';

          document.dispatchEvent(new CustomEvent('cart:updated', {
            bubbles: true
          }));

          document.dispatchEvent(new CustomEvent('cart:open', {
            bubbles: true
          }));

          setTimeout(function () {
            button.classList.remove('is-added');
            button.disabled = false;
            recalculate();
          }, 2500);
        })
        .catch(function () {
          button.classList.remove('is-loading');
          button.classList.add('is-error');
          button.textContent = 'Try again';

          setTimeout(function () {
            button.classList.remove('is-error');
            button.disabled = false;
            button.textContent = originalText;
            recalculate();
          }, 1500);
        });
    });
  });
})();
