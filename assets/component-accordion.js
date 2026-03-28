document.addEventListener('click', function(event) {
  const trigger = event.target.closest('[data-accordion-trigger]');
  if (!trigger) return;

  const item = trigger.closest('[data-accordion-item]');
  if (!item) return;

  const content = item.querySelector('[data-accordion-content]');
  const expanded = trigger.getAttribute('aria-expanded') === 'true';

  trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (content) {
    content.hidden = expanded;
  }
});
