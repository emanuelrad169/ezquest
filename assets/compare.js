/* EZQuest dynamic product compare — shopper-pick across the catalog.
   Selection lives in localStorage; the compare page builds the table from a
   server-rendered catalog (with spec metafields). Shareable via ?ids=. */
(function () {
  'use strict';

  var KEY = 'ezq-compare';
  var MAX = 4;

  /* ---- state ---- */
  function read() {
    try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter(Boolean); }
    catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch (e) {}
    broadcast();
  }
  function has(h) { return read().indexOf(h) !== -1; }
  function add(h) { var l = read(); if (l.indexOf(h) === -1 && l.length < MAX) l.push(h); write(l); }
  function remove(h) { write(read().filter(function (x) { return x !== h; })); }
  function toggle(h) { has(h) ? remove(h) : add(h); }
  function clear() { write([]); }

  function broadcast() {
    document.dispatchEvent(new CustomEvent('compare:changed', { detail: { ids: read() } }));
  }

  /* ---- toggle buttons across the site ---- */
  function syncButtons() {
    var ids = read();
    document.querySelectorAll('[data-compare-toggle]').forEach(function (btn) {
      var h = btn.getAttribute('data-compare-handle');
      var on = ids.indexOf(h) !== -1;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = btn.querySelector('[data-compare-label]');
      if (label) label.textContent = on ? 'Added' : 'Compare';
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-compare-toggle]');
    if (!btn) return;
    e.preventDefault();
    var h = btn.getAttribute('data-compare-handle');
    if (!h) return;
    if (!has(h) && read().length >= MAX) {
      flash('You can compare up to ' + MAX + ' products.');
      return;
    }
    toggle(h);
  });

  /* ---- floating tray ---- */
  function syncTray() {
    var tray = document.querySelector('[data-compare-tray]');
    if (!tray) return;
    var n = read().length;
    tray.hidden = n === 0;
    var c = tray.querySelector('[data-compare-tray-count]');
    if (c) c.textContent = String(n);
  }

  function flash(msg) {
    var tray = document.querySelector('[data-compare-tray]');
    var note = tray && tray.querySelector('[data-compare-tray-note]');
    if (!note) return;
    note.textContent = msg;
    note.classList.add('is-show');
    setTimeout(function () { note.classList.remove('is-show'); note.textContent = ''; }, 2200);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-compare-tray-clear]')) { e.preventDefault(); clear(); }
  });

  /* ---- compare page ---- */
  function parseSpecs(html) {
    var map = {};
    if (!html) return map;
    var doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('li').forEach(function (li) {
      var text = (li.textContent || '').replace(/\s+/g, ' ').trim();
      var i = text.indexOf(':');
      if (i > 0) {
        var label = text.slice(0, i).trim();
        var val = text.slice(i + 1).trim();
        if (label && val && !map[label]) map[label] = val;
      }
    });
    return map;
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  function renderTable(root) {
    var catEl = document.querySelector('[data-compare-catalog]');
    var renderEl = root.querySelector('[data-compare-render]');
    var emptyEl = root.querySelector('[data-compare-empty]');
    var barEl = root.querySelector('[data-compare-bar]');
    var countEl = root.querySelector('[data-compare-page-count]');
    if (!catEl || !renderEl) return;

    var catalog;
    try { catalog = JSON.parse(catEl.textContent); } catch (e) { catalog = []; }
    var byHandle = {};
    catalog.forEach(function (p) { byHandle[p.h] = p; });

    var ids = read().filter(function (h) { return byHandle[h]; });
    if (countEl) countEl.textContent = ids.length ? ids.length + ' product' + (ids.length > 1 ? 's' : '') + ' selected' : '';
    if (barEl) barEl.hidden = ids.length === 0;

    if (ids.length === 0) {
      renderEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    var items = ids.map(function (h) {
      var p = byHandle[h];
      return { p: p, specs: parseSpecs(p.specs) };
    });

    /* union of spec labels, preserving first-seen order */
    var labels = [], seen = {};
    items.forEach(function (it) {
      Object.keys(it.specs).forEach(function (l) { if (!seen[l]) { seen[l] = 1; labels.push(l); } });
    });

    var html = '<div class="cmp"><table class="cmp__table"><thead><tr><th class="cmp__rowhead"></th>';
    items.forEach(function (it) {
      var p = it.p;
      html += '<th class="cmp__col">' +
        '<button type="button" class="cmp__remove" data-compare-remove="' + esc(p.h) + '" aria-label="Remove ' + esc(p.t) + '">&times;</button>' +
        '<a class="cmp__prod" href="' + esc(p.u) + '">' +
          (p.img ? '<img class="cmp__img" src="' + esc(p.img) + '" alt="" loading="lazy" width="120" height="120">' : '<span class="cmp__img cmp__img--empty"></span>') +
          '<span class="cmp__title">' + esc(p.t) + '</span>' +
        '</a></th>';
    });
    html += '</tr></thead><tbody>';

    /* Price row */
    html += '<tr><th class="cmp__rowhead">Price</th>' + items.map(function (it) {
      return '<td class="cmp__cell cmp__cell--price">' + esc(it.p.price || '') + '</td>';
    }).join('') + '</tr>';

    /* Type row (only if any present) */
    if (items.some(function (it) { return it.p.type; })) {
      html += '<tr><th class="cmp__rowhead">Type</th>' + items.map(function (it) {
        return '<td class="cmp__cell">' + (it.p.type ? esc(it.p.type) : '<span class="cmp__na">&mdash;</span>') + '</td>';
      }).join('') + '</tr>';
    }

    /* Spec rows */
    labels.forEach(function (label) {
      html += '<tr><th class="cmp__rowhead">' + esc(label) + '</th>' + items.map(function (it) {
        var v = it.specs[label];
        return '<td class="cmp__cell">' + (v ? esc(v) : '<span class="cmp__na">&mdash;</span>') + '</td>';
      }).join('') + '</tr>';
    });

    /* CTA row */
    html += '<tr><th class="cmp__rowhead"></th>' + items.map(function (it) {
      return '<td class="cmp__cell"><a class="cmp__view" href="' + esc(it.p.u) + '">View product</a></td>';
    }).join('') + '</tr>';

    html += '</tbody></table></div>';
    renderEl.innerHTML = html;
  }

  /* share + clear + remove on the compare page */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); res(); } catch (e) { rej(e); } finally { document.body.removeChild(t); }
    });
  }

  function initComparePage() {
    var root = document.querySelector('[data-compare-root]');
    if (!root) return;

    /* hydrate from ?ids= (shared link) if present and nothing stored */
    var params = new URLSearchParams(location.search);
    var shared = (params.get('ids') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (shared.length) write(shared);

    var rerender = function () { renderTable(root); };
    rerender();
    document.addEventListener('compare:changed', rerender);

    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-compare-remove]');
      if (rm) { remove(rm.getAttribute('data-compare-remove')); return; }
      if (e.target.closest('[data-compare-clear]')) { clear(); return; }
      if (e.target.closest('[data-compare-share]')) {
        var url = new URL(location.href); url.searchParams.set('ids', read().join(','));
        var status = root.querySelector('[data-compare-share-status]');
        copy(url.toString()).then(function () {
          if (status) { status.textContent = 'Link copied!'; status.classList.add('is-success'); setTimeout(function () { status.textContent = ''; status.classList.remove('is-success'); }, 2000); }
        });
      }
    });
  }

  /* ---- boot ---- */
  function boot() {
    syncButtons(); syncTray();
    document.addEventListener('compare:changed', function () { syncButtons(); syncTray(); });
    initComparePage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
