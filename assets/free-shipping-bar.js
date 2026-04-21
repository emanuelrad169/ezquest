/*
  Add to layout/theme.liquid before </body>:
  {{ 'free-shipping-bar.js' | asset_url | script_tag }}
*/

(function () {
  'use strict';
  var EZRoutes = window.EZRoutes || { cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change' };

  var THRESHOLD_CENTS = 0;

  function updateBar(cartTotal) {
    var bar = document.getElementById('shipping-bar');
    if (!bar) return;

    THRESHOLD_CENTS = parseInt(bar.dataset.threshold, 10) || 10000;

    var remaining = THRESHOLD_CENTS - cartTotal;
    var pct = Math.min(
      Math.round((cartTotal / THRESHOLD_CENTS) * 100),
      100
    );

    var fill = document.getElementById('shipping-bar-fill');
    var msg = bar.querySelector('.shipping-bar__msg');
    var track = bar.querySelector('.shipping-bar__track');
    var unlocked = bar.querySelector('.shipping-bar__unlocked');

    if (remaining <= 0) {
      if (fill) fill.style.width = '100%';
      if (msg) msg.style.display = 'none';
      if (track) track.style.display = 'none';
      if (!unlocked) {
        bar.innerHTML =
          '<div class="shipping-bar__unlocked">' +
            '<svg class="shipping-bar__icon" width="14" ' +
                 'height="14" viewBox="0 0 14 14" ' +
                 'fill="none" aria-hidden="true">' +
              '<path d="M2.5 7l3 3 6-6" ' +
                    'stroke="#15803d" stroke-width="1.5" ' +
                    'stroke-linecap="round" ' +
                    'stroke-linejoin="round"/>' +
            '</svg>' +
            '<span class="shipping-bar__msg ' +
                         'shipping-bar__msg--unlocked">' +
              'You\u2019ve unlocked free shipping!' +
            '</span>' +
          '</div>';
      }
    } else {
      if (!track || !fill || !msg) {
        bar.innerHTML =
          '<p class="shipping-bar__msg"></p>' +
          '<div class="shipping-bar__track" role="progressbar" ' +
               'aria-valuemin="0" aria-valuemax="100">' +
            '<div class="shipping-bar__fill" id="shipping-bar-fill"></div>' +
          '</div>';
        fill = document.getElementById('shipping-bar-fill');
        msg = bar.querySelector('.shipping-bar__msg');
        track = bar.querySelector('.shipping-bar__track');
      }

      if (fill) {
        fill.style.width = pct + '%';
      }

      if (track) {
        track.style.display = '';
        track.setAttribute('aria-valuenow', pct);
        track.setAttribute('aria-label', pct + '% toward free shipping');
      }

      if (msg) {
        var dollars = (remaining / 100).toFixed(2);
        msg.style.display = '';
        msg.innerHTML =
          'Add <strong>$' + dollars + '</strong>' +
          ' more for <strong>free shipping</strong>';
      }
    }
  }

  function fetchCartAndUpdate() {
    fetch(EZRoutes.cart + '.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateBar(cart.total_price);
      })
      .catch(function () {});
  }

  document.addEventListener('cart:updated', fetchCartAndUpdate);
  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.getElementById('shipping-bar');
    if (bar) {
      fetch(EZRoutes.cart + '.js')
        .then(function (r) { return r.json(); })
        .then(function (cart) { updateBar(cart.total_price); })
        .catch(function () {});
    }
  });
})();
