/* ComparExpert cleanup:
   1. Remove free-tier "Powered by Helptochoose" branding (injected dynamically).
   2. Restrict compare UI to /pages/compare — flag every other page with
      .ezq-no-compare so CSS can hide the app's injected compare buttons. */
(function () {
  'use strict';

  // Flag non-compare pages ASAP so CSS hides injected compare buttons before paint.
  var onComparePage = location.pathname.indexOf('/pages/compare') !== -1;
  if (!onComparePage) document.documentElement.classList.add('ezq-no-compare');

  function strip(root) {
    (root || document).querySelectorAll('a[href*="helptochoose.com"]').forEach(function (a) {
      var node = a.closest('li') || a.closest('p') || a;
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function init() {
    strip(document);
    if (!('MutationObserver' in window) || !document.body) return;
    var pending = false;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; strip(document); });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
