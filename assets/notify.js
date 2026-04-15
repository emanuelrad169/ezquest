(function () {
  'use strict';

  /* Show/hide notify form based on variant availability.
     Listens for variant changes dispatched by the PDP variant switcher. */

  function init() {
    var forms = document.querySelectorAll('[data-notify-form]');
    if (!forms.length) return;

    /* Wire submit buttons */
    forms.forEach(function (form) {
      var btn = form.querySelector('[data-notify-submit]');
      var input = form.querySelector('[data-notify-email]');
      var success = form.querySelector('[data-notify-success]');
      var inputRow = form.querySelector('[data-notify-input-row]');
      if (!btn || !input) return;

      btn.addEventListener('click', function () {
        var email = input.value.trim();
        if (!email || !email.includes('@')) {
          input.style.borderColor = 'var(--color-error, #cf222e)';
          input.focus();
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Submitting\u2026';

        var formData = new FormData();
        formData.append('form_type', 'contact');
        formData.append('utf8', '\u2713');
        formData.append('contact[email]', email);
        formData.append('contact[body]', 'Back-in-stock notification request for: ' + window.location.href);

        fetch('/contact', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(function () {
            if (success) success.hidden = false;
            if (inputRow) inputRow.hidden = true;
          })
          .catch(function () {
            btn.disabled = false;
            btn.textContent = 'Notify me';
          });
      });
    });

    /* Respond to variant change events from the PDP JS.
       Variant changes dispatch a CustomEvent on the form element. */
    document.querySelectorAll('[data-product-primary-button]').forEach(function (atcBtn) {
      var observer = new MutationObserver(function () {
        var disabled = atcBtn.disabled || atcBtn.getAttribute('disabled') !== null;
        var section = atcBtn.closest('[data-section-id], section');
        if (!section) return;
        var notifyForm = section.querySelector('[data-notify-form]');
        if (!notifyForm) return;
        notifyForm.hidden = !disabled;
      });
      observer.observe(atcBtn, { attributes: true, attributeFilter: ['disabled'] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
