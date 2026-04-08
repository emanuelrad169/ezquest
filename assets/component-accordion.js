var ezquestAccordionId = 0;

function prefersReducedAccordionMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureAccordionIds(item) {
  const trigger = item.querySelector('[data-accordion-trigger]');
  const content = item.querySelector('[data-accordion-content]');
  if (!trigger || !content) return null;

  ezquestAccordionId += 1;
  const baseId = item.getAttribute('data-accordion-id') || ('accordion-' + ezquestAccordionId);
  const triggerId = baseId + '-trigger';
  const contentId = baseId + '-content';

  if (!trigger.id) {
    trigger.id = triggerId;
  }

  if (!content.id) {
    content.id = contentId;
  }

  trigger.setAttribute('aria-controls', content.id);
  content.setAttribute('role', 'region');
  content.setAttribute('aria-labelledby', trigger.id);

  return { trigger: trigger, content: content };
}

function setAccordionState(item, isExpanded, options) {
  const refs = ensureAccordionIds(item);
  if (!refs) return;

  const trigger = refs.trigger;
  const content = refs.content;
  const bodyInner = content.firstElementChild;
  const endHeight = bodyInner ? bodyInner.scrollHeight : 0;
  const immediate = Boolean(options && options.immediate);

  trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  content.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
  content.style.overflow = 'hidden';
  content.classList.toggle('is-open', isExpanded);

  if (immediate || prefersReducedAccordionMotion()) {
    content.style.height = isExpanded ? 'auto' : '0px';
    return;
  }

  if (isExpanded) {
    content.style.height = '0px';
    window.requestAnimationFrame(function () {
      content.style.height = endHeight + 'px';
    });
    window.setTimeout(function () {
      if (content.classList.contains('is-open')) {
        content.style.height = 'auto';
      }
    }, 260);
    return;
  }

  content.style.height = content.scrollHeight + 'px';
  window.requestAnimationFrame(function () {
    content.style.height = '0px';
  });
}

function initAccordionItem(item) {
  if (!item || item.hasAttribute('data-accordion-ready')) return;

  const refs = ensureAccordionIds(item);
  if (!refs) return;

  const trigger = refs.trigger;
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  setAccordionState(item, isExpanded, { immediate: true });
  item.setAttribute('data-accordion-ready', 'true');
}

function initAccordions(root) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('[data-accordion-item]').forEach(initAccordionItem);
}

document.addEventListener('click', function (event) {
  const trigger = event.target.closest('[data-accordion-trigger]');
  if (!trigger) return;

  const item = trigger.closest('[data-accordion-item]');
  if (!item) return;

  event.preventDefault();
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  setAccordionState(item, !isExpanded);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initAccordions(document);
  });
} else {
  initAccordions(document);
}

document.addEventListener('shopify:section:load', function (event) {
  initAccordions(event.target);
});

