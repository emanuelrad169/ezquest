(function () {
  'use strict';

  let devices = [];
  let products = [];
  let selectedDevice = null;
  let activeChip = null;

  const input = document.getElementById('compat-input');
  const dropdown = document.getElementById('compat-dropdown');
  const emptyState = document.querySelector('[data-compat-empty]');
  const resultsEl = document.querySelector('[data-compat-results]');
  const resultsDevice = document.querySelector('[data-compat-results-device]');
  const resetBtn = document.querySelector('[data-compat-reset]');
  const chips = document.querySelectorAll('.compat-chip');
  const popularChips = document.querySelectorAll('.compat-popular-chip');
  const noResults = document.querySelector('[data-compat-no-results]');

  // --- Init ---
  async function init() {
    const metaUrl = document.querySelector('meta[name="compat-devices-url"]');
    if (!metaUrl) return;

    try {
      const res = await fetch(metaUrl.content);
      devices = await res.json();
    } catch (e) {
      console.warn('[compat] Failed to load devices JSON', e);
      return;
    }

    const productDataEl = document.getElementById('compat-products-data');
    if (productDataEl) {
      try {
        products = JSON.parse(productDataEl.textContent);
      } catch (e) {
        console.warn('[compat] Failed to parse products data', e);
      }
    }

    // Deep-link via URL hash
    const hash = location.hash.slice(1);
    if (hash) {
      const device = devices.find(function (d) { return d.id === hash; });
      if (device) selectDevice(device);
    }

    // Bind events
    if (input) {
      input.addEventListener('input', onSearch);
      input.addEventListener('keydown', onKeydown);
      input.addEventListener('focus', function () { if (input.value) onSearch(); });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('[data-compat-input-wrap]')) hideDropdown();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { onChipClick(chip); });
    });

    popularChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var device = devices.find(function (d) { return d.id === chip.dataset.deviceId; });
        if (device) selectDevice(device);
      });
    });

    if (resetBtn) resetBtn.addEventListener('click', resetState);
  }

  // --- Fuzzy filter ---
  function score(query, target) {
    query = query.toLowerCase();
    target = target.toLowerCase();
    if (target.includes(query)) return 2;
    var matches = 0;
    var ti = 0;
    for (var qi = 0; qi < query.length; qi++) {
      while (ti < target.length && target[ti] !== query[qi]) ti++;
      if (ti < target.length) { matches++; ti++; }
    }
    return query.length ? matches / query.length : 0;
  }

  function filterDevices(query, platform) {
    var list = devices;
    if (platform) {
      list = list.filter(function (d) {
        return d.platform === platform || (platform === 'ipad' && (d.platform === 'ipad' || d.platform === 'iphone'));
      });
    }
    if (!query) return list.slice(0, 6);
    return list
      .map(function (d) { return { device: d, s: score(query, d.name) }; })
      .filter(function (x) { return x.s > 0.4; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 6)
      .map(function (x) { return x.device; });
  }

  // --- Search ---
  function onSearch() {
    var q = input.value.trim();
    var platform = activeChip ? activeChip.dataset.platform : null;
    var matches = filterDevices(q, platform);
    renderDropdown(matches);
  }

  function renderDropdown(list) {
    if (!list.length) { hideDropdown(); return; }
    dropdown.innerHTML = list.map(function (d, i) {
      return '<li role="option" tabindex="-1" data-device-id="' + d.id + '" data-index="' + i + '">'
        + escapeHtml(d.name)
        + '<span class="compat-dropdown-platform">' + escapeHtml(d.platform) + '</span>'
        + '</li>';
    }).join('');
    dropdown.removeAttribute('hidden');
    dropdown.querySelectorAll('li').forEach(function (li) {
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        var device = devices.find(function (d) { return d.id === li.dataset.deviceId; });
        if (device) selectDevice(device);
      });
    });
  }

  function hideDropdown() {
    dropdown.setAttribute('hidden', '');
    dropdown.innerHTML = '';
  }

  // --- Keyboard navigation ---
  function onKeydown(e) {
    var items = Array.from(dropdown.querySelectorAll('li'));
    var focused = dropdown.querySelector('li:focus');
    var idx = focused ? parseInt(focused.dataset.index, 10) : -1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var next = items[idx + 1] || items[0];
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      var prev = items[idx - 1] || items[items.length - 1];
      if (prev) prev.focus();
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      var device = devices.find(function (d) { return d.id === focused.dataset.deviceId; });
      if (device) selectDevice(device);
    } else if (e.key === 'Escape') {
      hideDropdown();
      input.focus();
    }
  }

  // --- Platform chips ---
  function onChipClick(chip) {
    if (activeChip === chip) {
      activeChip = null;
      chip.classList.remove('is-active');
    } else {
      if (activeChip) activeChip.classList.remove('is-active');
      activeChip = chip;
      chip.classList.add('is-active');
    }
    input.value = '';
    onSearch();
    if (dropdown.querySelectorAll('li').length) {
      dropdown.removeAttribute('hidden');
    }
  }

  // --- Device selection ---
  function selectDevice(device) {
    selectedDevice = device;
    if (input) input.value = device.name;
    hideDropdown();
    if (activeChip) { activeChip.classList.remove('is-active'); activeChip = null; }
    history.replaceState(null, '', '#' + device.id);
    renderResults(device);
  }

  function renderResults(device) {
    if (emptyState) emptyState.setAttribute('hidden', '');
    if (resultsEl) resultsEl.removeAttribute('hidden');
    if (resultsDevice) resultsDevice.textContent = 'Showing results for ' + device.name;

    var fullGroup = document.querySelector('[data-compat-group="full"]');
    var partialGroup = document.querySelector('[data-compat-group="partial"]');
    var noneGroup = document.querySelector('[data-compat-group="none"]');
    var fullGrid = document.querySelector('[data-compat-grid="full"]');
    var partialGrid = document.querySelector('[data-compat-grid="partial"]');
    var noneGrid = document.querySelector('[data-compat-grid="none"]');

    var fullProducts = products.filter(function (p) {
      try {
        var ids = typeof p.compat_full === 'string' ? JSON.parse(p.compat_full) : p.compat_full;
        return Array.isArray(ids) && ids.includes(device.id);
      } catch (e) { return false; }
    });

    var partialProducts = products.filter(function (p) {
      try {
        var items = typeof p.compat_partial === 'string' ? JSON.parse(p.compat_partial) : p.compat_partial;
        if (!Array.isArray(items)) return false;
        return items.some(function (item) {
          return (typeof item === 'string' ? item : item.device_id) === device.id;
        });
      } catch (e) { return false; }
    });

    var noneProducts = products.filter(function (p) {
      try {
        var ids = typeof p.compat_none === 'string' ? JSON.parse(p.compat_none) : p.compat_none;
        return Array.isArray(ids) && ids.includes(device.id);
      } catch (e) { return false; }
    });

    var hasAny = fullProducts.length || partialProducts.length || noneProducts.length;

    if (noResults) noResults.setAttribute('hidden', '');

    if (!hasAny) {
      if (noResults) noResults.removeAttribute('hidden');
      [fullGroup, partialGroup, noneGroup].forEach(function (g) {
        if (g) g.setAttribute('hidden', '');
      });
      return;
    }

    renderGroup(fullGroup, fullGrid, fullProducts, 'full', device);
    renderGroup(partialGroup, partialGrid, partialProducts, 'partial', device);
    renderGroup(noneGroup, noneGrid, noneProducts, 'none', device);
  }

  function renderGroup(group, grid, productList, type, device) {
    if (!group || !grid) return;
    if (!productList.length) { group.setAttribute('hidden', ''); return; }
    group.removeAttribute('hidden');
    grid.innerHTML = productList.map(function (p) { return buildCard(p, type, device); }).join('');
  }

  function buildCard(p, type, device) {
    var dimClass = type === 'none' ? 'compat-card--dim' : '';
    var noteHtml = '';
    if (type === 'partial') {
      try {
        var items = typeof p.compat_partial === 'string' ? JSON.parse(p.compat_partial) : p.compat_partial;
        var item = Array.isArray(items)
          ? items.find(function (i) { return (typeof i === 'string' ? i : i.device_id) === device.id; })
          : null;
        var note = item && typeof item === 'object' ? item.note : null;
        if (note) noteHtml = '<div class="compat-card-note">' + escapeHtml(note) + '</div>';
      } catch (e) {}
    }
    var altHtml = type === 'none' && p.compat_alt
      ? '<a href="' + escapeHtml(p.compat_alt) + '" class="compat-card-alt">Try an alternative instead →</a>'
      : '';
    var dimOverlay = type === 'none'
      ? '<div class="compat-card-dim-overlay" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="1.5"/></svg></div>'
      : '';
    var imgHtml = p.image
      ? '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.image_alt) + '" loading="lazy" width="200" height="200">'
      : '<div class="compat-card-img-placeholder"></div>';
    var soldOut = !p.available ? '<p class="compat-card-sold-out">Sold out</p>' : '';
    var linkAttrs = type === 'none' ? ' tabindex="-1" aria-hidden="true"' : '';

    return '<div class="compat-card ' + dimClass + '">'
      + dimOverlay
      + '<a href="' + escapeHtml(p.url) + '" class="compat-card-inner"' + linkAttrs + '>'
      + '<div class="compat-card-img">' + imgHtml + '</div>'
      + '<div class="compat-card-body">'
      + '<p class="compat-card-title">' + escapeHtml(p.title) + '</p>'
      + '<p class="compat-card-price">' + escapeHtml(p.price) + '</p>'
      + soldOut
      + '</div>'
      + '</a>'
      + noteHtml
      + altHtml
      + '</div>';
  }

  function resetState() {
    selectedDevice = null;
    if (input) input.value = '';
    history.replaceState(null, '', location.pathname);
    if (emptyState) emptyState.removeAttribute('hidden');
    if (resultsEl) resultsEl.setAttribute('hidden', '');
    ['full', 'partial', 'none'].forEach(function (t) {
      var g = document.querySelector('[data-compat-group="' + t + '"]');
      if (g) g.setAttribute('hidden', '');
    });
    if (input) input.focus();
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
