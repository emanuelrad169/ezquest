(function () {
  'use strict';

  var DEBOUNCE_MS = 200;
  var MIN_CHARS = 2;
  var MAX_RESULTS = 6;

  function initPanel(panel) {
    var input = panel.querySelector('[data-search-input]');
    var results = panel.querySelector('[data-search-results]');
    var clear = panel.querySelector('[data-search-clear]');
    var searchTimer = null;
    var currentQuery = '';
    var selectedIndex = -1;

    if (!input || !results) return;

    async function fetchResults(query) {
      var root = window.EZRoutes && window.EZRoutes.root ? window.EZRoutes.root : '/';
      var path = root.replace(/\/?$/, '/') + 'search/suggest.json';
      var url = new URL(path, window.location.origin);

      url.searchParams.set('q', query);
      url.searchParams.set('resources[type]', 'product');
      url.searchParams.set('resources[limit]', MAX_RESULTS);
      url.searchParams.set('resources[options][fields]', 'title,product_type,variants.title,vendor');

      var response = await fetch(url.toString(), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!response.ok) {
        throw new Error('Predictive search failed: ' + response.status);
      }

      return response.json();
    }

    function render(data, query) {
      var products = data && data.resources && data.resources.results
        ? data.resources.results.products || []
        : [];

      if (!products.length) {
        results.innerHTML = '<div class="search-results__empty">No results for "<strong>' + escHtml(query) + '</strong>"</div>';
        showResults();
        return;
      }

      results.innerHTML = products.map(function (product, index) {
        var image = getImageUrl(product);
        var type = product.product_type || product.type || product.vendor || '';
        var price = getPrice(product);

        return [
          '<a href="' + escAttr(product.url || '#') + '" class="search-result-item" role="option" id="search-result-' + index + '" aria-selected="false">',
            '<div class="search-result-item__img-wrap">',
              image
                ? '<img src="' + escAttr(image) + '" alt="' + escAttr(product.title || 'Product image') + '" width="60" height="60" loading="lazy" decoding="async">'
                : '<div class="search-result-item__img-fallback" aria-hidden="true"></div>',
            '</div>',
            '<div class="search-result-item__text">',
              '<span class="search-result-item__title">' + highlight(product.title || '', query) + '</span>',
              type ? '<span class="search-result-item__type">' + escHtml(type) + '</span>' : '',
            '</div>',
            price ? '<div class="search-result-item__price">' + escHtml(price) + '</div>' : '',
          '</a>'
        ].join('');
      }).join('') + [
        '<a href="' + escAttr(getSearchUrl(query)) + '" class="search-results__footer">',
          'See all results for "<strong>' + escHtml(query) + '</strong>"',
          '<span aria-hidden="true"> -></span>',
        '</a>'
      ].join('');

      showResults();
      selectedIndex = -1;
    }

    function showResults() {
      results.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function hideResults() {
      results.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      selectedIndex = -1;
      clearSelection();
    }

    function clearSelection() {
      results.querySelectorAll('.search-result-item').forEach(function (item) {
        item.setAttribute('aria-selected', 'false');
        item.classList.remove('is-selected');
      });
    }

    function moveSelection(direction) {
      var items = results.querySelectorAll('.search-result-item');
      if (!items.length || results.hidden) return;

      clearSelection();
      selectedIndex = (selectedIndex + direction + items.length) % items.length;
      items[selectedIndex].setAttribute('aria-selected', 'true');
      items[selectedIndex].classList.add('is-selected');
      items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () {
      var query = input.value.trim();

      if (clear) clear.hidden = query === '';

      if (query.length < MIN_CHARS) {
        hideResults();
        currentQuery = '';
        return;
      }

      if (query === currentQuery) return;
      currentQuery = query;
      clearTimeout(searchTimer);

      searchTimer = setTimeout(async function () {
        try {
          var data = await fetchResults(query);
          if (currentQuery === query) render(data, query);
        } catch (error) {
          results.innerHTML = '<div class="search-results__empty">Search is temporarily unavailable.</div>';
          showResults();
        }
      }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (event) {
      var items = results.querySelectorAll('.search-result-item');

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSelection(-1);
      } else if (event.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
        event.preventDefault();
        items[selectedIndex].click();
      } else if (event.key === 'Escape') {
        hideResults();
        input.blur();
      }
    });

    input.addEventListener('focus', function () {
      if (input.value.trim().length >= MIN_CHARS && results.children.length) {
        showResults();
      }
    });

    if (clear) {
      clear.addEventListener('click', function () {
        input.value = '';
        currentQuery = '';
        clear.hidden = true;
        hideResults();
        input.focus();
      });
    }

    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-search-panel]')) {
        hideResults();
      }
    });
  }

  function getImageUrl(product) {
    var source = product && product.featured_image
      ? product.featured_image.url || product.featured_image
      : product && product.image;

    if (!source) return '';

    try {
      var url = new URL(source, window.location.origin);
      url.searchParams.set('width', '120');
      return url.toString();
    } catch (error) {
      return source;
    }
  }

  function getPrice(product) {
    var value = product.price_min || product.price || product.compare_at_price_min || '';
    if (value === '') return '';

    if (typeof value === 'string') {
      if (value.indexOf('$') > -1 || value.indexOf('€') > -1 || value.indexOf('£') > -1) {
        return value.replace(/<[^>]*>/g, '');
      }
      value = Number(value);
    }

    if (!Number.isFinite(value)) return '';

    var amount = value > 999 ? value / 100 : value;
    var currency = window.EZMoney && window.EZMoney.currency ? window.EZMoney.currency : 'USD';
    var locale = window.EZMoney && window.EZMoney.locale ? window.EZMoney.locale : document.documentElement.lang || 'en';

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (error) {
      return '$' + amount.toFixed(2).replace(/\.00$/, '');
    }
  }

  function getSearchUrl(query) {
    var root = window.EZRoutes && window.EZRoutes.root ? window.EZRoutes.root : '/';
    var url = new URL(root.replace(/\/?$/, '/') + 'search', window.location.origin);
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'product,page,article');
    return url.pathname + url.search;
  }

  function escHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(value) {
    return escHtml(value);
  }

  function highlight(text, query) {
    var escapedQuery = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escapedQuery + ')', 'gi');
    return escHtml(text).replace(regex, '<mark>$1</mark>');
  }

  function init() {
    document.querySelectorAll('[data-search-panel]').forEach(initPanel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
