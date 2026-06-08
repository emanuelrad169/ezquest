(function () {
  'use strict';

  var STORAGE_KEY = 'ez_cookie_consent';
  var banner       = null;
  var acceptButton = null;
  var declineButton = null;

  /* ── Persistence ─────────────────────────────────────────── */

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function saveConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  }

  /* ── GA4 Consent Mode v2 ─────────────────────────────────── */

  function updateGA4Consent(granted) {
    if (typeof window.gtag !== 'function') return;
    var state = granted ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      analytics_storage:  state,
      ad_storage:         state,
      ad_user_data:       state,
      ad_personalization: state
    });
  }

  /* ── Shopify Customer Privacy API ────────────────────────── */

  function updateShopifyConsent(granted) {
    var api = window.Shopify && window.Shopify.customerPrivacy;
    if (!api || typeof api.setTrackingConsent !== 'function') return;
    api.setTrackingConsent(
      {
        analytics:    granted,
        marketing:    granted,
        preferences:  granted,
        sale_of_data: false   /* CCPA: never sell data */
      },
      function () {}
    );
  }

  /* ── Banner animation ────────────────────────────────────── */

  function hideBanner(value) {
    if (!banner) return;
    saveConsent(value);
    banner.classList.remove('is-visible');
    document.body.classList.remove('cookie-visible');

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      banner.hidden = true;
      banner.removeEventListener('transitionend', finish);
    }
    banner.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 350);
  }

  function showBanner() {
    banner.removeAttribute('hidden');
    document.body.classList.add('cookie-visible');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-visible');
      });
    });
  }

  /* ── Keyboard / focus trap ───────────────────────────────── */

  function trapFocus(event) {
    if (!banner || !banner.classList.contains('is-visible')) return;
    if (event.key === 'Escape') { acceptDecline(false); return; }
    if (event.key !== 'Tab') return;

    var focusable = [declineButton, acceptButton].filter(Boolean);
    if (focusable.length < 2) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  /* ── Core accept / decline ───────────────────────────────── */

  function acceptDecline(granted) {
    updateGA4Consent(granted);
    updateShopifyConsent(granted);
    hideBanner(granted ? 'accepted' : 'declined');
  }

  /* ── Boot ────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    banner        = document.getElementById('cookie-banner');
    if (!banner) return;

    acceptButton  = document.getElementById('cookie-accept');
    declineButton = document.getElementById('cookie-decline');

    var consent = getConsent();

    /* If consent was already given in a previous visit, apply it silently */
    if (consent) {
      updateGA4Consent(consent === 'accepted');
      updateShopifyConsent(consent === 'accepted');
      return;
    }

    /* First visit — show the banner after a short delay */
    if (acceptButton) {
      acceptButton.addEventListener('click', function () { acceptDecline(true); });
    }
    if (declineButton) {
      declineButton.addEventListener('click', function () { acceptDecline(false); });
    }

    document.addEventListener('keydown', trapFocus);
    window.setTimeout(showBanner, 800);
  });
}());
