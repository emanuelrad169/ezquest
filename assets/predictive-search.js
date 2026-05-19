(function () {
  'use strict';

  var DEBOUNCE_MS = 200;
  var MIN_CHARS = 2;
  var MAX_RESULTS_PER_TYPE = 4;

  function initPanel(panel) {
    var input   = panel.querySelector('[data-search-input]');
    var results = panel.querySelector('[data-search-results]');
    var clear   = panel.querySelector('[data-search-clear]');
    var searchTimer  = null;
    var currentQuery = '';
    var selectedIndex = -1;

    if (!input || !results) return;

    /* ── API fetch ─────────────────────────────────────────── */

    async function fetchResults(query) {
      var root = window.EZRoutes && window.EZRoutes.root ? window.EZRoutes.root : '/';
      var path = root.replace(/\/?$/, '/') + 'search/suggest.json';
      var url  = new URL(path, window.location.origin);

      url.searchParams.set('q', query);
      url.searchParams.set('resources[type]', 'product,collection,article,page');
      url.searchParams.set('resources[limit]', MAX_RESULTS_PER_TYPE);
      url.searchParams.set('resources[limit_scope]', 'each');
      url.searchParams.set('resources[options][fields]', 'title,product_type,variants.title,vendor');

      var res = await fetch(url.toString(), { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!res.ok) throw new Error('Predictive search failed: ' + res.status);
      return res.json();
    }

    /* ── Render ────────────────────────────────────────────── */

    function render(data, query) {
      var r = data && data.resources && data.resources.results ? data.resources.results : {};
      var products    = r.products    || [];
      var collections = r.collections || [];
      var articles    = r.articles    || [];
      var pages       = r.pages       || [];
      var total       = products.length + collections.length + articles.length + pages.length;

      if (!total) {
        results.innerHTML = [
          '<div class="search-results__empty">',
            'No results for "<strong>' + escHtml(query) + '</strong>"',
            '<a href="' + escAttr(getSearchUrl(query)) + '" class="search-results__empty-link">Browse all results →</a>',
          '</div>'
        ].join('');
        showResults();
        return;
      }

      var html = '';

      /* Products */
      if (products.length) {
        html += '<div class="predictive-group"><div class="predictive-group__label">Products</div><ul class="predictive-group__list" role="list">';
        products.forEach(function (p, i) {
          var image = getImageUrl(p);
          var price = getPrice(p);
          html += [
            '<li>',
            '<a href="' + escAttr(p.url || '#') + '"',
            '   class="search-result-item"',
            '   role="option"',
            '   id="sresult-' + i + '"',
            '   aria-selected="false"',
            '   data-result-type="product"',
            '   data-result-position="' + (i + 1) + '">',
              '<div class="search-result-item__img-wrap">',
                image
                  ? '<img src="' + escAttr(image) + '" alt="" width="60" height="60" loading="lazy" decoding="async">'
                  : '<div class="search-result-item__img-fallback" aria-hidden="true"></div>',
              '</div>',
              '<div class="search-result-item__text">',
                '<span class="search-result-item__title">' + highlight(p.title || '', query) + '</span>',
                (p.product_type || p.vendor)
                  ? '<span class="search-result-item__type">' + escHtml(p.product_type || p.vendor) + '</span>'
                  : '',
              '</div>',
              price ? '<div class="search-result-item__price">' + escHtml(price) + '</div>' : '',
            '</a></li>'
          ].join('');
        });
        html += '</ul></div>';
      }

      /* Collections */
      if (collections.length) {
        html += '<div class="predictive-group"><div class="predictive-group__label">Collections</div><ul class="predictive-group__list predictive-group__list--text" role="list">';
        collections.forEach(function (c, i) {
          html += '<li><a href="' + escAttr(c.url || '#') + '" class="predictive-text-result" data-result-type="collection" data-result-position="' + (i + 1) + '">' + highlight(c.title || '', query) + '</a></li>';
        });
        html += '</ul></div>';
      }

      /* Articles */
      if (articles.length) {
        html += '<div class="predictive-group"><div class="predictive-group__label">Articles</div><ul class="predictive-group__list predictive-group__list--text" role="list">';
        articles.forEach(function (a, i) {
          html += '<li><a href="' + escAttr(a.url || '#') + '" class="predictive-text-result" data-result-type="article" data-result-position="' + (i + 1) + '">' + highlight(a.title || '', query) + '</a></li>';
        });
        html += '</ul></div>';
      }

      /* Pages */
      if (pages.length) {
        html += '<div class="predictive-group"><div class="predictive-group__label">Pages</div><ul class="predictive-group__list predictive-group__list--text" role="list">';
        pages.forEach(function (pg, i) {
          html += '<li><a href="' + escAttr(pg.url || '#') + '" class="predictive-text-result" data-result-type="page" data-result-position="' + (i + 1) + '">' + highlight(pg.title || '', query) + '</a></li>';
        });
        html += '</ul></div>';
      }

      /* Footer */
      html += [
        '<a href="' + escAttr(getSearchUrl(query)) + '"',
        '   class="search-results__footer"',
        '   data-search-view-all>',
          'See all results for "<strong>' + escHtml(query) + '</strong>"',
          '<span aria-hidden="true"> →</span>',
        '</a>'
      ].join('');

      results.innerHTML = html;
      showResults();
      selectedIndex = -1;

      /* GA4 — fire after render so the results container has content */
      sendSearchImpression(query, total);
    }

    /* ── Visibility ────────────────────────────────────────── */

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

    /* ── Input events ──────────────────────────────────────── */

    input.addEventListener('input', function () {
      var query = input.value.trim();
      if (clear) clear.hidden = query === '';
      if (query.length < MIN_CHARS) { hideResults(); currentQuery = ''; return; }
      if (query === currentQuery) return;
      currentQuery = query;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(async function () {
        try {
          var data = await fetchResults(query);
          if (currentQuery === query) render(data, query);
        } catch (_err) {
          results.innerHTML = '<div class="search-results__empty">Search is temporarily unavailable.</div>';
          showResults();
        }
      }, DEBOUNCE_MS);
    });

    input.addEventListener('keydown', function (e) {
      var items = results.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown')  { e.preventDefault(); moveSelection(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); moveSelection(-1); }
      else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
        e.preventDefault(); items[selectedIndex].click();
      } else if (e.key === 'Escape') { hideResults(); input.blur(); }
    });

    input.addEventListener('focus', function () {
      if (input.value.trim().length >= MIN_CHARS && results.children.length) showResults();
    });

    if (clear) {
      clear.addEventListener('click', function () {
        input.value = ''; currentQuery = ''; clear.hidden = true;
        hideResults(); input.focus();
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-search-panel]')) hideResults();
    });

    /* ── GA4 — click tracking ──────────────────────────────── */

    results.addEventListener('click', function (e) {
      var link = e.target.closest('[data-result-type]');
      if (!link || !window.gtag) return;
      gtag('event', 'select_search_result', {
        search_term: currentQuery,
        result_type: link.dataset.resultType,
        result_position: parseInt(link.dataset.resultPosition, 10) || 1
      });
    });

    results.addEventListener('click', function (e) {
      if (e.target.closest('[data-search-view-all]') && window.gtag) {
        gtag('event', 'search', { search_term: currentQuery });
      }
    });

    /* GA4 — form submit */
    var form = panel.querySelector('form');
    if (form) {
      form.addEventListener('submit', function () {
        if (window.gtag) gtag('event', 'search', { search_term: input.value.trim() });
      });
    }
  }

  /* ── Helpers ─────────────────────────────────────────────── */

  function getImageUrl(product) {
    var source = product && product.featured_image
      ? (product.featured_image.url || product.featured_image)
      : (product && product.image);
    if (!source) return '';
    try {
      var u = new URL(source, window.location.origin);
      u.searchParams.set('width', '120');
      return u.toString();
    } catch (_) { return source; }
  }

  function getPrice(product) {
    var value = product.price_min || product.price || product.compare_at_price_min || '';
    if (value === '') return '';
    if (typeof value === 'string') {
      if (/[$€£]/.test(value)) return value.replace(/<[^>]*>/g, '');
      value = Number(value);
    }
    if (!Number.isFinite(value)) return '';
    var amount   = value > 999 ? value / 100 : value;
    var currency = window.EZMoney && window.EZMoney.currency ? window.EZMoney.currency : 'USD';
    var locale   = window.EZMoney && window.EZMoney.locale   ? window.EZMoney.locale   : (document.documentElement.lang || 'en');
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency', currency: currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2
      }).format(amount);
    } catch (_) { return '$' + amount.toFixed(2).replace(/\.00$/, ''); }
  }

  function getSearchUrl(query) {
    var root = window.EZRoutes && window.EZRoutes.root ? window.EZRoutes.root : '/';
    var u = new URL(root.replace(/\/?$/, '/') + 'search', window.location.origin);
    u.searchParams.set('q', query);
    u.searchParams.set('type', 'product,page,article');
    return u.pathname + u.search;
  }

  function sendSearchImpression(query, resultCount) {
    if (!window.gtag || !query) return;
    if (resultCount === 0) {
      gtag('event', 'search_no_results', { search_term: query });
    }
  }

  function escHtml(v) {
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function escAttr(v) { return escHtml(v); }

  function highlight(text, query) {
    var safe  = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + safe + ')', 'gi');
    return escHtml(text).replace(regex, '<mark>$1</mark>');
  }

  /* ── Boot ────────────────────────────────────────────────── */

  function init() {
    document.querySelectorAll('[data-search-panel]').forEach(initPanel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
