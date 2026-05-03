(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var ELEMENTS = [
    '[data-animate]',
    '.home-feature-banner',
    '.collection-strip',
    '.email-signup',
    '.testimonials',
    '.blog-card',
    '.nav-shop-card',
    '.support-card',
    '.shub-card',
    '.wtb-card',
    '.pdp-tabs',
    '.pdp-fbt',
    '.pdp-recently-viewed',
    '.support-cluster-card',
    '.compatibility-row'
  ].join(', ');

  var STAGGER_PARENTS = [
    '.blog-grid',
    '.nav-shop-grid',
    '.collection-grid',
    '.wtb-grid',
    '.support-grid',
    '.shub-grid',
    '.feature-grid',
    '.story-three-col',
    '.milestone-grid'
  ].join(', ');

  function init() {
    document.querySelectorAll(STAGGER_PARENTS).forEach(function (parent) {
      Array.prototype.slice.call(parent.children).forEach(function (child, index) {
        child.style.transitionDelay = index * 60 + 'ms';
        child.dataset.animate = '';
      });
    });

    document.querySelectorAll(ELEMENTS).forEach(function (element) {
      if (!element.dataset.animate && !element.closest(STAGGER_PARENTS)) {
        element.dataset.animate = '';
      }
    });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-animate]').forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('[data-animate]').forEach(function (element) {
      observer.observe(element);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
