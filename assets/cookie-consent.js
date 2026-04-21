(function () {
  'use strict';

  var STORAGE_KEY = 'ez_cookie_consent';
  var banner = null;
  var acceptButton = null;
  var declineButton = null;

  function getConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      return;
    }
  }

  function hideBanner(value) {
    if (!banner) return;

    setConsent(value);
    banner.classList.remove('is-visible');

    var didHide = false;

    function finish() {
      if (didHide) return;
      didHide = true;
      banner.hidden = true;
      banner.removeEventListener('transitionend', finish);
    }

    banner.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 350);
  }

  function showBanner() {
    banner.removeAttribute('hidden');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-visible');
      });
    });
  }

  function trapFocus(event) {
    if (!banner || !banner.classList.contains('is-visible')) return;

    if (event.key === 'Escape') {
      hideBanner('declined');
      return;
    }

    if (event.key !== 'Tab') return;

    var focusable = [declineButton, acceptButton].filter(Boolean);
    if (focusable.length < 2) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    banner = document.getElementById('cookie-banner');
    if (!banner) return;

    acceptButton = document.getElementById('cookie-accept');
    declineButton = document.getElementById('cookie-decline');

    var consent = getConsent();
    if (consent) return;

    if (acceptButton) {
      acceptButton.addEventListener('click', function () {
        hideBanner('accepted');
      });
    }

    if (declineButton) {
      declineButton.addEventListener('click', function () {
        hideBanner('declined');
      });
    }

    document.addEventListener('keydown', trapFocus);

    window.setTimeout(showBanner, 800);
  });
})();
