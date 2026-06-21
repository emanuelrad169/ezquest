/* Remove ComparExpert free-tier "Powered by Helptochoose" branding.
   The app injects (and can re-inject) it dynamically, so we strip it on load
   and via a MutationObserver. */
(function () {
  'use strict';

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
