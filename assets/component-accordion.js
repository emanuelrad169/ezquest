document.addEventListener('click', function(event) {
  const trigger = event.target.closest('[data-accordion-trigger]');
  if (!trigger) return;

  const item = trigger.closest('[data-accordion-item]');
  if (!item) return;

  const content = item.querySelector('[data-accordion-content]');
  const expanded = trigger.getAttribute('aria-expanded') === 'true';
  const bodyInner = content ? content.firstElementChild : null;
  const endHeight = bodyInner ? bodyInner.scrollHeight : 0;

  trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (content) {
    content.style.overflow = 'hidden';
    content.classList.toggle('is-open', !expanded);
    content.setAttribute('aria-hidden', expanded ? 'true' : 'false');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      content.style.height = expanded ? '0px' : 'auto';
      return;
    }

    if (!expanded) {
      content.style.height = '0px';
      window.requestAnimationFrame(function () {
        content.style.height = endHeight + 'px';
      });
      window.setTimeout(function () {
        if (content.classList.contains('is-open')) {
          content.style.height = 'auto';
        }
      }, 260);
    } else {
      content.style.height = content.scrollHeight + 'px';
      window.requestAnimationFrame(function () {
        content.style.height = '0px';
      });
    }
  }
});
