(function () {
  'use strict';

  function getIDsFromURL() {
    var params = new URLSearchParams(window.location.search);
    return (params.get('ids') || '')
      .split(',')
      .map(function (id) { return id.trim(); })
      .filter(Boolean);
  }

  function setIDsInURL(ids) {
    var url = new URL(window.location.href);

    if (ids.length > 0) {
      url.searchParams.set('ids', ids.join(','));
    } else {
      url.searchParams.delete('ids');
    }

    window.history.replaceState({}, '', url.toString());
  }

  function getVisibleIds(table) {
    return Array.prototype.slice.call(table.querySelectorAll('[data-compare-product-id]'))
      .filter(function (cell) { return !cell.hidden; })
      .map(function (cell) { return cell.getAttribute('data-compare-product-id'); })
      .filter(Boolean);
  }

  function getAllIds(table) {
    return Array.prototype.slice.call(table.querySelectorAll('[data-compare-product-id]'))
      .map(function (cell) { return cell.getAttribute('data-compare-product-id'); })
      .filter(Boolean);
  }

  function dispatchUpdate(ids) {
    document.dispatchEvent(new CustomEvent('compare:updated', {
      detail: { ids: ids }
    }));
  }

  function applySelection(table, ids, updateUrl, defaultToAll) {
    var requestedIds = ids.filter(Boolean);
    var selected = requestedIds.length || !defaultToAll ? requestedIds : getAllIds(table);
    var requested = new Set(selected);
    var matched = 0;
    var cells = Array.prototype.slice.call(
      table.querySelectorAll('[data-compare-product-id], [data-compare-spec-product-id]')
    );

    cells.forEach(function (cell) {
      var id = cell.getAttribute('data-compare-product-id') || cell.getAttribute('data-compare-spec-product-id');
      if (requested.has(id) && cell.hasAttribute('data-compare-product-id')) matched += 1;
    });

    if (matched === 0 && requestedIds.length > 0) {
      selected = getAllIds(table);
      requested = new Set(selected);
      matched = selected.length;
    }

    cells.forEach(function (cell) {
      var id = cell.getAttribute('data-compare-product-id') || cell.getAttribute('data-compare-spec-product-id');
      cell.hidden = !requested.has(id);
    });

    table.style.setProperty('--col-count', String(matched));

    selected = getVisibleIds(table);
    if (updateUrl) setIDsInURL(selected);
    dispatchUpdate(selected);
  }

  function removeProduct(table, productId) {
    var ids = getVisibleIds(table).filter(function (id) {
      return id !== productId;
    });

    applySelection(table, ids, true, false);
  }

  function copyToClipboard(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value);
    }

    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.className = 'compare-share__fallback-input';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textarea);
      }
    });
  }

  function initShare(table) {
    var button = document.querySelector('[data-compare-share]');
    var status = document.querySelector('[data-compare-share-status]');
    if (!button) return;

    window.copyCompareURL = function () {
      var ids = getVisibleIds(table);
      setIDsInURL(ids);
      var url = window.location.href;

      return copyToClipboard(url)
        .then(function () {
          if (!status) return;
          status.textContent = 'Link copied!';
          status.classList.add('is-success');
          window.setTimeout(function () {
            status.textContent = '';
            status.classList.remove('is-success');
          }, 2000);
        })
        .catch(function () {
          if (!status) return;
          status.textContent = url;
          status.classList.remove('is-success');
        });
    };

    button.addEventListener('click', function () {
      window.copyCompareURL();
    });
  }

  function initRemoveButtons(table) {
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-compare-remove]');
      if (!button || !table.contains(button)) return;

      removeProduct(table, button.getAttribute('data-compare-remove'));
    });
  }

  function init() {
    var table = document.querySelector('[data-compare-table]');
    if (!table) return;

    applySelection(table, getIDsFromURL(), false, true);
    initRemoveButtons(table);
    initShare(table);

    document.addEventListener('compare:add', function (event) {
      var productId = event.detail && event.detail.productId;
      if (!productId) return;

      var ids = getVisibleIds(table);
      if (ids.indexOf(productId) === -1) ids.push(productId);
      applySelection(table, ids, true, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
