document.documentElement.classList.add('js');

document.addEventListener('click', function(event) {
  const openButton = event.target.closest('[data-drawer-open]');
  const closeButton = event.target.closest('[data-drawer-close]');

  if (openButton) {
    const target = document.getElementById(openButton.getAttribute('data-drawer-open'));
    if (target) {
      target.hidden = false;
      document.body.style.overflow = 'hidden';
      openButton.setAttribute('aria-expanded', 'true');
    }
  }

  if (closeButton) {
    const target = closeButton.closest('[data-drawer]');
    if (target) {
      target.hidden = true;
      document.body.style.overflow = '';
      const controller = document.querySelector('[data-drawer-open="' + target.id + '"]');
      if (controller) controller.setAttribute('aria-expanded', 'false');
    }
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;

  const openDrawer = document.querySelector('[data-drawer]:not([hidden])');
  if (!openDrawer) return;

  openDrawer.hidden = true;
  document.body.style.overflow = '';
  const controller = document.querySelector('[data-drawer-open="' + openDrawer.id + '"]');
  if (controller) controller.setAttribute('aria-expanded', 'false');
});
