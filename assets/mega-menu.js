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

  /* ── Open / close — two independent panels ── */
  function initTriggers() {
    var triggers  = document.querySelectorAll('[data-mega-target]');
    var closeTimer = null;

    function openPanel(targetId) {
      // Close all panels + reset all triggers
      document.querySelectorAll('.ez-mega').forEach(function(panel) {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        panel.hidden = true;
      });
      document.querySelectorAll('[data-mega-target]').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-active');
      });

      // Open target
      var panel = document.getElementById(targetId);
      if (!panel) return;
      panel.hidden = false;
      panel.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(function() {
        panel.classList.add('is-open');
      });

      var trigger = document.querySelector('[data-mega-target="' + targetId + '"]');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
        trigger.classList.add('is-active');
      }
    }

    function closeAll() {
      document.querySelectorAll('.ez-mega').forEach(function(panel) {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        panel.addEventListener('transitionend', function handler() {
          panel.hidden = true;
          panel.removeEventListener('transitionend', handler);
        });
      });
      document.querySelectorAll('[data-mega-target]').forEach(function(btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-active');
      });
    }

    // Trigger hover / click
    triggers.forEach(function(trigger) {
      trigger.addEventListener('mouseenter', function() {
        clearTimeout(closeTimer);
        openPanel(this.dataset.megaTarget);
      });

      trigger.addEventListener('click', function() {
        var targetId = this.dataset.megaTarget;
        var panel    = document.getElementById(targetId);
        var isOpen   = panel && panel.classList.contains('is-open');
        if (isOpen) {
          closeAll();
        } else {
          openPanel(targetId);
        }
      });
    });

    // Close when mouse leaves header (with 150ms delay)
    var header = document.querySelector('.site-header');
    if (header) {
      header.addEventListener('mouseleave', function() {
        closeTimer = setTimeout(closeAll, 150);
      });
      header.addEventListener('mouseenter', function() {
        clearTimeout(closeTimer);
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        clearTimeout(closeTimer);
        closeAll();
        var expanded = document.querySelector('[data-mega-target][aria-expanded="true"]');
        if (expanded) expanded.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.site-header')) {
        clearTimeout(closeTimer);
        closeAll();
      }
    });
  }

  /* ── Simple flyout submenus (Support, Resources, About) ── */
  function initSubmenus() {
    document.querySelectorAll('[data-nav-submenu]').forEach(function(item) {
      var trigger = item.querySelector('[data-nav-submenu-trigger]');
      var panel   = item.querySelector('[data-nav-submenu-panel]');
      if (!trigger || !panel) return;

      function open() {
        // Close other submenus
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
        panel.hidden ? open() : close();
      });

      item.addEventListener('mouseleave', function() {
        close();
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
