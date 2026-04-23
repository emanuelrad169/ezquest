(function() {
  'use strict';

  /* ── Tab switching with cross-fade ── */
  function initTabs(mega) {
    var tabs   = mega.querySelectorAll('.ez-mega__tab');
    var panels = mega.querySelectorAll('.ez-mega__panel');

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.dataset.target;

        tabs.forEach(function(t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(function(p) {
          p.hidden = true;
          p.classList.remove('is-active');
        });

        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');

        var panel = mega.querySelector('#' + target);
        if (panel) {
          panel.hidden = false;
          panel.classList.add('is-active');
          panel.classList.add('is-entering');
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              panel.classList.remove('is-entering');
            });
          });
        }
      });

      tab.addEventListener('keydown', function(e) {
        var idx = Array.from(tabs).indexOf(this);
        if (e.key === 'ArrowDown' && tabs[idx + 1]) {
          e.preventDefault();
          tabs[idx + 1].focus();
          tabs[idx + 1].click();
        }
        if (e.key === 'ArrowUp' && tabs[idx - 1]) {
          e.preventDefault();
          tabs[idx - 1].focus();
          tabs[idx - 1].click();
        }
      });
    });
  }

  /* ── Spotlight (mouse-follow gradient) ── */
  function initSpotlight(mega) {
    var spotlight = mega.querySelector('.ez-mega__spotlight');
    if (!spotlight) return;

    mega.addEventListener('mousemove', function(e) {
      var rect = mega.getBoundingClientRect();
      var x = ((e.clientX - rect.left)  / rect.width)  * 100;
      var y = ((e.clientY - rect.top)   / rect.height) * 100;
      spotlight.style.background =
        'radial-gradient(circle at ' + x + '% ' + y + '%, ' +
        'rgba(251,206,42,0.05) 0%, transparent 60%)';
    });

    mega.addEventListener('mouseleave', function() {
      spotlight.style.background = 'none';
    });
  }

  /* ── Open / close ── */
  function initTriggers() {
    var triggers    = document.querySelectorAll('[data-mega-target]');
    var OPEN_DELAY  = 300;
    var CLOSE_DELAY = 500;
    var openTimer   = null;
    var closeTimer  = null;
    var closeToken  = 0;   // bumped on every open/close to invalidate stale transitionend handlers
    var curX = 0, curY = 0;

    document.addEventListener('mousemove', function(e) {
      curX = e.clientX;
      curY = e.clientY;
    });

    function inRect(el, extraBottom) {
      if (!el) return false;
      var r = el.getBoundingClientRect();
      return curX >= r.left && curX <= r.right &&
             curY >= r.top  && curY <= r.bottom + (extraBottom || 0);
    }

    // "Safe zone" = inside the header bar (+ 20px below to bridge the gap to the panel)
    // or inside the open panel itself.
    function inMenuZone() {
      var header = document.querySelector('.site-header');
      var panel  = document.querySelector('.ez-mega.is-open');
      return inRect(header, 20) || inRect(panel);
    }

    function openPanel(targetId) {
      clearTimeout(openTimer);  openTimer  = null;
      clearTimeout(closeTimer); closeTimer = null;
      closeToken++;

      document.querySelectorAll('.ez-mega').forEach(function(p) {
        p.classList.remove('is-open');
        p.setAttribute('aria-hidden', 'true');
        p.hidden = true;
      });
      document.querySelectorAll('[data-mega-target]').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-active');
      });

      var panel = document.getElementById(targetId);
      if (!panel) return;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function() {
        panel.classList.add('is-open');
      });

      var trig = document.querySelector('[data-mega-target="' + targetId + '"]');
      if (trig) {
        trig.setAttribute('aria-expanded', 'true');
        trig.classList.add('is-active');
      }
    }

    function closeAll() {
      clearTimeout(openTimer);  openTimer  = null;
      clearTimeout(closeTimer); closeTimer = null;
      var token = ++closeToken;

      document.querySelectorAll('.ez-mega').forEach(function(p) {
        p.classList.remove('is-open');
        p.setAttribute('aria-hidden', 'true');
        p.addEventListener('transitionend', function handler() {
          p.removeEventListener('transitionend', handler);
          if (closeToken === token) p.hidden = true;
        });
      });
      document.querySelectorAll('[data-mega-target]').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-active');
      });
    }

    triggers.forEach(function(trig) {
      // Hover: open after delay (instant if another panel is already open)
      trig.addEventListener('mouseenter', function() {
        clearTimeout(openTimer); openTimer = null;
        clearTimeout(closeTimer); closeTimer = null;
        var tid   = this.dataset.megaTarget;
        var delay = document.querySelector('.ez-mega.is-open') ? 0 : OPEN_DELAY;
        openTimer = setTimeout(function() {
          openTimer = null;
          if (inMenuZone()) openPanel(tid);
        }, delay);
      });

      // Leaving trigger: schedule close but DO NOT cancel the open timer —
      // if open fires first it will cancel close; if close fires first and cursor
      // has left the menu zone, panel closes correctly.
      trig.addEventListener('mouseleave', function(e) {
        var panel = document.getElementById(this.dataset.megaTarget);
        if (panel && e.relatedTarget && panel.contains(e.relatedTarget)) return;
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function() {
          closeTimer = null;
          if (!inMenuZone()) closeAll();
        }, CLOSE_DELAY);
      });

      // Click: instant toggle
      trig.addEventListener('click', function() {
        clearTimeout(openTimer);  openTimer  = null;
        clearTimeout(closeTimer); closeTimer = null;
        var tid = this.dataset.megaTarget;
        var p   = document.getElementById(tid);
        p && p.classList.contains('is-open') ? closeAll() : openPanel(tid);
      });
    });

    // Panel: keep open while cursor is inside
    document.querySelectorAll('.ez-mega').forEach(function(panel) {
      panel.addEventListener('mouseenter', function() {
        clearTimeout(closeTimer); closeTimer = null;
      });
      panel.addEventListener('mouseleave', function(e) {
        var goingToTrigger = e.relatedTarget &&
          e.relatedTarget.closest('[data-mega-target]');
        if (goingToTrigger) { clearTimeout(closeTimer); closeTimer = null; return; }
        clearTimeout(closeTimer);
        closeTimer = setTimeout(function() {
          closeTimer = null;
          if (!inMenuZone()) closeAll();
        }, CLOSE_DELAY);
      });
    });

    // Escape: instant close
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      clearTimeout(openTimer);  openTimer  = null;
      clearTimeout(closeTimer); closeTimer = null;
      closeAll();
      var expanded = document.querySelector('[data-mega-target][aria-expanded="true"]');
      if (expanded) expanded.focus();
    });

    // Outside click: instant close
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.site-header')) {
        clearTimeout(openTimer);  openTimer  = null;
        clearTimeout(closeTimer); closeTimer = null;
        closeAll();
      }
    });
  }

  /* ── Simple flyout submenus (Support, Resources, About) ── */
  function initSubmenus() {
    var SUB_OPEN_DELAY  = 150;
    var SUB_CLOSE_DELAY = 250;

    document.querySelectorAll('[data-nav-submenu]').forEach(function(item) {
      var trigger   = item.querySelector('[data-nav-submenu-trigger]');
      var panel     = item.querySelector('[data-nav-submenu-panel]');
      if (!trigger || !panel) return;

      var openTimer  = null;
      var closeTimer = null;

      function clearTimers() {
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
      }

      function open() {
        document.querySelectorAll('[data-nav-submenu-panel]').forEach(function(p) {
          if (p !== panel) {
            p.hidden = true;
            var t = p.closest('[data-nav-submenu]')
                      && p.closest('[data-nav-submenu]').querySelector('[data-nav-submenu-trigger]');
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
        panel.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }

      function close() {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }

      trigger.addEventListener('click', function() {
        clearTimers();
        panel.hidden ? open() : close();
      });

      trigger.addEventListener('mouseenter', function() {
        clearTimers();
        openTimer = setTimeout(open, SUB_OPEN_DELAY);
      });

      item.addEventListener('mouseenter', function() {
        clearTimers();
      });

      item.addEventListener('mouseleave', function() {
        clearTimers();
        closeTimer = setTimeout(close, SUB_CLOSE_DELAY);
      });
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('[data-nav-submenu]')) {
        document.querySelectorAll('[data-nav-submenu-panel]').forEach(function(p) {
          p.hidden = true;
        });
        document.querySelectorAll('[data-nav-submenu-trigger]').forEach(function(t) {
          t.setAttribute('aria-expanded', 'false');
        });
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('[data-nav-submenu-panel]').forEach(function(p) {
          p.hidden = true;
        });
        document.querySelectorAll('[data-nav-submenu-trigger]').forEach(function(t) {
          t.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.ez-mega').forEach(function(mega) {
      initTabs(mega);
      initSpotlight(mega);
    });
    initTriggers();
    initSubmenus();
  });
})();
