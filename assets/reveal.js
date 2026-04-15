/* ─── Reveal on scroll — IntersectionObserver ─────────────────────────── */
/* Targets: .reveal-on-scroll and .reveal-stagger > *                      */
/* Applied to: section headings, card grids, feature lists                 */

(function () {
  if (typeof IntersectionObserver === 'undefined') {
    /* Graceful degradation — just show everything */
    document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
      el.classList.add('is-revealed');
    });
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
      el.classList.add('is-revealed');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.1
    }
  );

  function observeAll() {
    document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
      observer.observe(el);
    });

    /* Stagger containers: observe each child individually */
    document.querySelectorAll('.reveal-stagger').forEach(function (container) {
      Array.from(container.children).forEach(function (child) {
        child.classList.add('reveal-on-scroll');
        observer.observe(child);
      });
    });

    /* Section intros: auto-reveal without requiring template edits */
    document.querySelectorAll('.section-intro').forEach(function (el) {
      if (!el.classList.contains('reveal-on-scroll')) {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }

  /* Export for AJAX-injected content (e.g. collection filter refresh) */
  window.EZReveal = {
    observe: function(el) {
      if (observer) observer.observe(el);
    }
  };
}());
