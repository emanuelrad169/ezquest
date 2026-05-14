/**
 * EZQuest — unified nav dropdown system
 * Covers: Shop · Support · Resources · Compare · About
 * All dropdowns behave identically.
 */
(function () {
  'use strict';

  /* ── Timing constants ─────────────────────────── */
  const OPEN_DELAY  = 150;
  const CLOSE_DELAY = 320;

  /* ── State ────────────────────────────────────── */
  let activePanel   = null;
  let activeTrigger = null;
  let openTimer     = null;
  let closeTimer    = null;

  /* ── Helpers ──────────────────────────────────── */
  function clearTimers() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  }

  function openPanel(trigger, panel) {
    clearTimers();
    openTimer = setTimeout(() => {
      if (activePanel && activePanel !== panel) {
        _close(activePanel, activeTrigger, true);
      }
      _open(trigger, panel);
    }, OPEN_DELAY);
  }

  function scheduleClose(trigger, panel) {
    clearTimers();
    closeTimer = setTimeout(() => {
      _close(panel, trigger, false);
    }, CLOSE_DELAY);
  }

  const overlayHeader = document.querySelector('.site-header--hero-overlay');

  function setMenuOpen(open) {
    if (overlayHeader) overlayHeader.classList.toggle('is-menu-open', open);
  }

  function _open(trigger, panel) {
    panel.removeAttribute('hidden');
    panel.offsetHeight; // force reflow so CSS transition fires
    panel.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('is-active');
    activePanel   = panel;
    activeTrigger = trigger;
    setMenuOpen(true);

    // Clamp to viewport right edge (skip full-width Shop mega panel)
    if (!panel.classList.contains('ez-mega')) {
      requestAnimationFrame(() => {
        const rect = panel.getBoundingClientRect();
        const overflow = rect.right - (window.innerWidth - 16);
        if (overflow > 0) {
          const cur = parseFloat(getComputedStyle(panel).left) || 0;
          panel.style.left = (cur - overflow) + 'px';
        }
      });
    }
  }

  function _close(panel, trigger, instant) {
    if (!panel) return;
    if (instant) {
      panel.hidden = true;
      panel.classList.remove('is-open', 'is-closing');
      panel.style.left = '';
    } else {
      panel.classList.remove('is-open');
      panel.classList.add('is-closing');
      setTimeout(() => {
        panel.hidden = true;
        panel.classList.remove('is-closing');
        panel.style.left = '';
      }, 150);
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('is-active');
    }
    if (activePanel   === panel)   { activePanel   = null; setMenuOpen(false); }
    if (activeTrigger === trigger)   activeTrigger = null;
  }

  function closeAll(instant) {
    clearTimers();
    if (activePanel) _close(activePanel, activeTrigger, instant);
  }

  /* ── Wire up all nav triggers ─────────────────── */
  function init() {
    const triggers = document.querySelectorAll('[data-nav-trigger]');

    triggers.forEach(trigger => {
      const panelId = trigger.dataset.navTrigger;
      const panel   = document.getElementById(panelId);
      if (!panel) return;

      trigger.addEventListener('mouseenter', () => {
        clearTimers();
        openPanel(trigger, panel);
      });

      trigger.addEventListener('mouseleave', e => {
        if (panel.contains(e.relatedTarget)) return;
        scheduleClose(trigger, panel);
      });

      panel.addEventListener('mouseenter', () => clearTimers());

      panel.addEventListener('mouseleave', e => {
        if (trigger.contains(e.relatedTarget)) return;
        scheduleClose(trigger, panel);
      });

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        clearTimers();
        if (!panel.hidden) {
          _close(panel, trigger, true);
        } else {
          if (activePanel && activePanel !== panel) {
            _close(activePanel, activeTrigger, true);
          }
          _open(trigger, panel);
        }
      });
    });

    /* Escape: close, return focus to trigger */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !activePanel) return;
      clearTimers();
      const t = activeTrigger;
      _close(activePanel, activeTrigger, true);
      if (t) t.focus();
    });

    /* Outside click */
    document.addEventListener('click', e => {
      if (!activePanel) return;
      const header = document.querySelector('.site-header');
      if (header && header.contains(e.target)) return;
      closeAll(true);
    });

    /* Page scroll */
    window.addEventListener('scroll', () => {
      if (activePanel) closeAll(true);
    }, { passive: true });

    /* Tab out of header */
    document.addEventListener('focusin', e => {
      if (!activePanel) return;
      const header = document.querySelector('.site-header');
      if (header && !header.contains(e.target)) closeAll(true);
    });
  }

  /* ── Spotlight (mouse-follow gradient inside Shop panel) ── */
  function initSpotlight(mega) {
    const spotlight = mega.querySelector('.ez-mega__spotlight');
    if (!spotlight) return;
    mega.addEventListener('mousemove', e => {
      const rect = mega.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      spotlight.style.background =
        'radial-gradient(circle at ' + x + '% ' + y + '%, ' +
        'rgba(254, 211, 0,0.05) 0%, transparent 60%)';
    });
    mega.addEventListener('mouseleave', () => {
      spotlight.style.background = 'none';
    });
  }

  /* ── Tab switching (for any ez-mega panel with tabs) ── */
  function initTabs(mega) {
    const tabs   = mega.querySelectorAll('.ez-mega__tab');
    const panels = mega.querySelectorAll('.ez-mega__panel');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        const target = this.dataset.target;
        tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach(p => { p.hidden = true; p.classList.remove('is-active'); });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');
        const panel = mega.querySelector('#' + target);
        if (panel) {
          panel.hidden = false;
          panel.classList.add('is-active', 'is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove('is-entering')));
        }
      });

      tab.addEventListener('keydown', function (e) {
        const idx = Array.from(tabs).indexOf(this);
        if (e.key === 'ArrowDown' && tabs[idx + 1]) { e.preventDefault(); tabs[idx + 1].focus(); tabs[idx + 1].click(); }
        if (e.key === 'ArrowUp'   && tabs[idx - 1]) { e.preventDefault(); tabs[idx - 1].focus(); tabs[idx - 1].click(); }
      });
    });
  }

  /* ── Boot ── */
  function boot() {
    document.querySelectorAll('.ez-mega').forEach(mega => {
      initTabs(mega);
      initSpotlight(mega);
    });
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
