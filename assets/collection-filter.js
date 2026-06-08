(function() {
  'use strict';

  function countActiveFilters() {
    var params = new URLSearchParams(window.location.search);
    var count = 0;

    params.forEach(function(value, key) {
      if (key.indexOf('filter.') === 0 && value) count += 1;
    });

    return count;
  }

  function getDrawer() {
    return document.querySelector('[data-filter-drawer]') || document.getElementById('collection-filters');
  }

  function getOverlay() {
    return document.querySelector('[data-filter-overlay]');
  }

  function updateFilterBadge() {
    var count = countActiveFilters();
    var btn = document.querySelector('.collection-filter-btn, .collection-filter-toggle');
    if (!btn) return;

    var badge = btn.querySelector('.collection-filter-btn__count, .collection-filter-toggle__badge');

    if (!badge && count > 0) {
      badge = document.createElement('span');
      badge.className = 'collection-filter-toggle__badge collection-filter-btn__count';
      btn.appendChild(badge);
    }

    if (!badge) return;

    badge.textContent = String(count);
    badge.classList.toggle('is-hidden', count === 0);
  }

  function hideZeroStockOptions() {
    document.querySelectorAll('.collection-filter-option, .filter-option, .facets__item').forEach(function(item) {
      var countEl = item.querySelector('.collection-filter-option__count, .facets__count, .filter-option__count');
      var labelEl = item.querySelector('label');
      var countText = countEl ? countEl.textContent : '';
      var count = parseInt(countText.replace(/[^0-9]/g, ''), 10);
      var label = labelEl ? labelEl.textContent.toLowerCase() : '';

      if (count === 0 && label.indexOf('out of stock') > -1) {
        item.classList.add('is-zero-hidden');
      }
    });
  }

  function openDrawer() {
    var drawer = getDrawer();
    var overlay = getOverlay();
    var toggle = document.querySelector('.collection-filter-btn, .collection-filter-toggle');

    if (!drawer) return;

    drawer.classList.add('is-open');
    document.body.classList.add('collection-filter-drawer-open');
    if (overlay) overlay.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    var drawer = getDrawer();
    var overlay = getOverlay();
    var toggle = document.querySelector('.collection-filter-btn, .collection-filter-toggle');

    if (drawer) drawer.classList.remove('is-open');
    document.body.classList.remove('collection-filter-drawer-open');
    if (overlay) overlay.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function refresh() {
    updateFilterBadge();
    hideZeroStockOptions();
  }

  document.addEventListener('click', function(event) {
    if (event.target.closest('.collection-filter-btn, .collection-filter-toggle')) {
      event.preventDefault();
      openDrawer();
      return;
    }

    if (event.target.closest('[data-filter-close], [data-filter-overlay]')) {
      event.preventDefault();
      closeDrawer();
    }
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeDrawer();
  });

  document.addEventListener('DOMContentLoaded', refresh);

  window.EZCollectionFilter = {
    refresh: refresh,
    open: openDrawer,
    close: closeDrawer,
  };
})();
