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
      var error = form.querySelector('[data-notify-error]');
      var inputRow = form.querySelector('[data-notify-fields]') || form.querySelector('[data-notify-input-row]');
      var productInput = form.querySelector('[data-notify-product]');
      var variantInput = form.querySelector('[data-notify-variant]');
      if (!btn || !input) return;

      form.addEventListener('submit', submitNotifyRequest);
      btn.addEventListener('click', submitNotifyRequest);

      function submitNotifyRequest(event) {
        event.preventDefault();

        var email = input.value.trim();
        if (!email || !email.includes('@')) {
          if (error) {
            error.textContent = 'Please enter a valid email address.';
            error.hidden = false;
          }
          input.focus();
          return;
        }

        var productTitle = form.dataset.productTitle || (productInput ? productInput.value : document.title);
        var productHandle = form.dataset.productHandle || '';
        var productUrl = form.dataset.productUrl || window.location.href;
        var variantTitle = variantInput ? variantInput.value : '';

        btn.disabled = true;
        btn.textContent = 'Sending...';
        if (error) error.hidden = true;

        var formData = new FormData();
        formData.append('form_type', 'customer');
        formData.append('utf8', '\u2713');
        formData.append('contact[email]', email);
        formData.append('contact[tags]', 'back-in-stock,notify-me');
        formData.append(
          'contact[body]',
          'Back in stock request\n\n' +
            'Product: ' + productTitle + '\n' +
            'Variant: ' + variantTitle + '\n' +
            'URL: ' + productUrl + '\n' +
            'Handle: ' + productHandle + '\n' +
            'Customer email: ' + email
        );

        if (window.klaviyo && typeof window.klaviyo.push === 'function') {
          window.klaviyo.push(['identify', { '$email': email }]);
          window.klaviyo.push(['track', 'Back in stock request', {
            product: productTitle,
            variant: variantTitle,
            url: productUrl
          }]);
        }

        var root = window.EZRoutes && window.EZRoutes.root ? window.EZRoutes.root : '/';
        var contactUrl = root.replace(/\/?$/, '/') + 'contact';

        fetch(contactUrl, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(function (response) {
            if (!response.ok) throw new Error('Server error: ' + response.status);

            window.dispatchEvent(new CustomEvent('ez:notify-me-submit', {
              detail: {
                product: productTitle,
                variant: variantTitle,
                url: productUrl
              }
            }));
            if (inputRow) inputRow.hidden = true;
            if (success) {
              success.textContent = 'Got it. We will email you at ' + email + ' when it is back in stock.';
              success.hidden = false;
            }
          })
          .catch(function () {
            if (error) {
              error.textContent = 'Something went wrong. Please try again or contact us at support@ezq.com';
              error.hidden = false;
            }
            btn.disabled = false;
            btn.textContent = 'Notify me';
          });
      }
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
