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
        });

        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');

        var panel = mega.querySelector('#' + target);
        if (panel) {
          panel.hidden = false;
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

  /* ── Spotlight (Aceternity) ── */
  function initSpotlight(mega) {
    var spotlight = mega.querySelector('.ez-mega__spotlight');
    if (!spotlight) return;

    mega.addEventListener('mousemove', function(e) {
      var rect = mega.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width)  * 100;
      var y = ((e.clientY - rect.top)  / rect.height) * 100;
      spotlight.style.background =
        'radial-gradient(circle at ' + x + '% ' + y + '%, ' +
        'rgba(245,158,11,0.05) 0%, transparent 60%)';
    });

    mega.addEventListener('mouseleave', function() {
      spotlight.style.background = 'none';
    });
  }

  /* ── Open / close ── */
  function initTriggers() {
    var triggers = document.querySelectorAll('[data-mega-target]');

    triggers.forEach(function(trigger) {
      var targetId = trigger.dataset.megaTarget;
      var mega     = document.getElementById(targetId);
      if (!mega) return;

      var closeTimer;

      function openMega() {
        clearTimeout(closeTimer);
        document.querySelectorAll('.ez-mega').forEach(function(m) {
          if (m !== mega) {
            m.classList.remove('is-open');
            m.hidden = true;
          }
        });
        mega.hidden = false;
        requestAnimationFrame(function() {
          mega.classList.add('is-open');
        });
        trigger.setAttribute('aria-expanded', 'true');
      }

      function closeMega() {
        closeTimer = setTimeout(function() {
          mega.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          mega.addEventListener('transitionend', function handler() {
            mega.hidden = true;
            mega.removeEventListener('transitionend', handler);
          });
        }, 80);
      }

      trigger.addEventListener('mouseenter', openMega);
      trigger.addEventListener('mouseleave', closeMega);
      mega.addEventListener('mouseenter', function() {
        clearTimeout(closeTimer);
      });
      mega.addEventListener('mouseleave', closeMega);

      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        mega.hidden ? openMega() : closeMega();
      });
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ez-mega.is-open').forEach(function(m) {
          m.classList.remove('is-open');
          m.hidden = true;
        });
        var expanded = document.querySelector('[data-mega-target][aria-expanded="true"]');
        if (expanded) expanded.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.ez-mega') && !e.target.closest('[data-mega-target]')) {
        document.querySelectorAll('.ez-mega.is-open').forEach(function(m) {
          m.classList.remove('is-open');
          m.hidden = true;
        });
        document.querySelectorAll('[data-mega-target][aria-expanded="true"]')
          .forEach(function(t) { t.setAttribute('aria-expanded', 'false'); });
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
  });
})();
