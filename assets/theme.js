document.documentElement.classList.add('js');

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animateSequence(elements, options) {
  const distance = options.distance || 12;
  const duration = options.duration || 320;
  const delayStep = options.delayStep || 40;
  const baseDelay = options.baseDelay || 0;

  elements.forEach(function (element, index) {
    if (!element) return;
    element.animate([
      { opacity: 0, transform: 'translateY(' + distance + 'px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: duration,
      delay: baseDelay + (index * delayStep),
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
  });
}

function animateMediaReveal(element, options) {
  if (!element) return;
  const scaleFrom = options.scaleFrom || 1.01;
  const duration = options.duration || 420;
  const delay = options.delay || 0;

  element.animate([
    { opacity: 0, transform: 'scale(' + scaleFrom + ')' },
    { opacity: 1, transform: 'scale(1)' }
  ], {
    duration: duration,
    delay: delay,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both'
  });
}

// ─── Header: scroll state ─────────────────────────────────────────────────────
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  let scrollThreshold = Number(header.dataset.headerScrollThreshold || 8);

  function updateScrollThreshold() {
    const configuredThreshold = Number(header.dataset.headerScrollThreshold || 8);
    if (header.classList.contains('site-header--hero-overlay')) {
      scrollThreshold = 40; // announcement bar height — white header once bar scrolls away
      return;
    }
    scrollThreshold = configuredThreshold;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > scrollThreshold);
        ticking = false;
      });
      ticking = true;
    }
  }
  updateScrollThreshold();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateScrollThreshold);
  onScroll(); // run once on init for pages that start scrolled
}());

// ─── Scroll reveal ────────────────────────────────────────────────────────────
(function () {
  const reduced = prefersReducedMotion();
  const revealGroups = [
    {
      selector: '.collection-hero, .product-layout, .home-feature-band, .home-faq-shell, .blog-lead-card, .editorial-shell, .hero-surface, .cta-surface-light, .cta-surface-dark, .home-feature-banner-content, .home-testimonials-section, .home-feature-bento-section',
      tier: '1',
      stagger: 0
    },
    {
      selector: '.home-collections-strip-card, .featured-products-slide, .support-link-card, .support-tile, .resource-card, .compatibility-card, .compare-card, .blog-stack-card, .search-result-card, .info-card, .troubleshooting-card, .home-confidence-card, .resources-article-card, .home-feature-bento-card, .collection-card',
      tier: '2',
      stagger: 55
    },
    {
      selector: '.support-crosslink, .site-footer-column, .site-footer-brand-column, .article-continuation-shell > a',
      tier: '3',
      stagger: 35
    }
  ];

  revealGroups.forEach(function (group) {
    document.querySelectorAll(group.selector).forEach(function (el, index) {
      if (el.closest('[data-hero]')) return;
      el.classList.add('js-reveal', 'reveal-tier-' + group.tier);
      if (group.stagger) {
        el.style.setProperty('--reveal-delay', (index % 8) * group.stagger + 'ms');
      }
    });
  });

  if (reduced) {
    document.querySelectorAll('.js-reveal, .js-reveal-stagger, .motion-fade-up').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.js-reveal, .js-reveal-stagger, .motion-fade-up').forEach(function (el) {
    observer.observe(el);
  });
}());

// ─── Compatibility: preserve product context ─────────────────────────────────
(function () {
  function formatProductHandle(handle) {
    return handle
      .split('-')
      .filter(Boolean)
      .map(function (part) {
        if (part === 'usb' || part === 'c') return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function appendProductParam(url, productHandle) {
    try {
      const resolved = new URL(url, window.location.origin);
      resolved.searchParams.set('product', productHandle);
      return resolved.pathname + resolved.search;
    } catch (error) {
      return url;
    }
  }

  function initCompatibilityContext() {
    const contextPanel = document.querySelector('[data-compatibility-product-context]');
    if (!contextPanel) return;

    const params = new URLSearchParams(window.location.search);
    const productHandle = params.get('product');
    if (!productHandle) return;

    const titleScript = document.querySelector('[data-compatibility-product-titles]');
    let productTitles = {};
    if (titleScript) {
      try {
        productTitles = JSON.parse(titleScript.textContent || '{}');
      } catch (error) {
        productTitles = {};
      }
    }

    const productName = productTitles[productHandle] || formatProductHandle(productHandle);
    const productNameTarget = contextPanel.querySelector('[data-compatibility-product-name]');

    if (productNameTarget) {
      productNameTarget.textContent = productName;
    }

    contextPanel.hidden = false;

    document.querySelectorAll('[data-compatibility-context-link]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/pages/')) return;
      link.setAttribute('href', appendProductParam(href, productHandle));
    });
  }

  function initCompatibilityFilters() {
    document.querySelectorAll('[data-compatibility-filter-set]').forEach(function (filterSet) {
      const cards = Array.from(filterSet.querySelectorAll('[data-compatibility-card]'));
      if (!cards.length) return;

      const controls = {
        platform: filterSet.querySelector('[data-compatibility-filter="platform"]'),
        device: filterSet.querySelector('[data-compatibility-filter="device"]'),
        workflow: filterSet.querySelector('[data-compatibility-filter="workflow"]')
      };
      const emptyState = filterSet.querySelector('[data-compatibility-empty]');
      const resetButton = filterSet.querySelector('[data-compatibility-reset]');

      function updateResults() {
        let visibleCards = 0;

        cards.forEach(function (card) {
          const matchesPlatform = !controls.platform || !controls.platform.value || card.getAttribute('data-compatibility-platform') === controls.platform.value;
          const matchesDevice = !controls.device || !controls.device.value || card.getAttribute('data-compatibility-device') === controls.device.value;
          const matchesWorkflow = !controls.workflow || !controls.workflow.value || card.getAttribute('data-compatibility-workflow') === controls.workflow.value;
          const isVisible = matchesPlatform && matchesDevice && matchesWorkflow;

          card.hidden = !isVisible;
          if (isVisible) visibleCards += 1;
        });

        if (emptyState) {
          emptyState.hidden = visibleCards !== 0;
        }
      }

      Object.keys(controls).forEach(function (key) {
        const control = controls[key];
        if (!control) return;
        control.addEventListener('change', updateResults);
      });

      if (resetButton) {
        resetButton.addEventListener('click', function () {
          Object.keys(controls).forEach(function (key) {
            const control = controls[key];
            if (!control) return;
            control.value = '';
          });
          updateResults();
        });
      }

      updateResults();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompatibilityContext);
    document.addEventListener('DOMContentLoaded', initCompatibilityFilters);
  } else {
    initCompatibilityContext();
    initCompatibilityFilters();
  }
}());

// ─── Support: preserve product or compare context ────────────────────────────
(function () {
  function formatSupportProductHandle(handle) {
    return handle
      .split('-')
      .filter(Boolean)
      .map(function (part) {
        if (part === 'usb' || part === 'c') return part.toUpperCase();
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function appendContextParams(url, params) {
    try {
      const resolved = new URL(url, window.location.origin);
      if (params.product) resolved.searchParams.set('product', params.product);
      if (params.source) resolved.searchParams.set('source', params.source);
      if (params.group) resolved.searchParams.set('group', params.group);
      return resolved.pathname + resolved.search;
    } catch (error) {
      return url;
    }
  }

  function initSupportContext() {
    const panels = document.querySelectorAll('[data-support-context]');
    if (!panels.length) return;

    const params = new URLSearchParams(window.location.search);
    const configScript = document.querySelector('[data-support-context-config]');
    let config = {};
    if (configScript) {
      try {
        config = JSON.parse(configScript.textContent || '{}');
      } catch (error) {
        config = {};
      }
    }

    const context = {
      product: params.get('product') || config.product || '',
      source: params.get('source') || config.source || '',
      group: params.get('group') || config.group || ''
    };

    if (!context.product && !context.source && !context.group) return;

    const productTitles = config.productTitles || {};
    let kicker = 'Product context';
    let title = 'Keep the product in view';
    let copy = 'Support will stay tied to the product or lineup you were already checking.';

    if (context.product) {
      const productName = productTitles[context.product] || formatSupportProductHandle(context.product);
      title = 'Support for ' + productName;
      copy = 'Manuals, downloads, compatibility, and contact options stay tied to ' + productName + ' while you confirm the last detail.';
    } else if (context.source === 'compare' || context.group) {
      kicker = 'Compare context';
      title = 'Still comparing the core lineup?';
      copy = 'Use compatibility or support to confirm the last detail without losing the balanced, portable, and desk-ready roles you were weighing.';
    }

    panels.forEach(function (panel) {
      const kickerTarget = panel.querySelector('[data-support-context-kicker]');
      const titleTarget = panel.querySelector('[data-support-context-title]');
      const copyTarget = panel.querySelector('[data-support-context-copy]');
      const returnLink = panel.querySelector('[data-support-context-return]');
      if (kickerTarget) kickerTarget.textContent = kicker;
      if (titleTarget) titleTarget.textContent = title;
      if (copyTarget) copyTarget.textContent = copy;
      if (returnLink) {
        if (context.product) {
          returnLink.href = '/products/' + context.product;
          returnLink.textContent = 'Return to ' + (productTitles[context.product] || formatSupportProductHandle(context.product));
          returnLink.hidden = false;
        } else if (context.source === 'compare' || context.group) {
          returnLink.href = appendContextParams('/pages/compare', context);
          returnLink.textContent = 'Back to compare';
          returnLink.hidden = false;
        } else {
          returnLink.hidden = true;
        }
      }
      panel.hidden = false;
    });

    document.querySelectorAll('[data-support-context-link]').forEach(function (link) {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/pages/')) return;
      link.setAttribute('href', appendContextParams(href, context));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupportContext);
  } else {
    initSupportContext();
  }
}());

// ─── Product gallery: click thumbnail to swap main image ─────────────────────
(function () {
  function readThumbSource(thumb) {
    if (!thumb) return null;
    const thumbImg = thumb.querySelector('img');
    if (!thumbImg) return null;
    return {
      src: thumbImg.currentSrc || thumbImg.src,
      srcset: thumbImg.getAttribute('srcset') || thumbImg.srcset || ''
    };
  }

  function updateActiveThumbs(stage, activeThumb) {
    stage.querySelectorAll('.product-gallery-grid .product-thumb-card').forEach(function (thumb) {
      const isActive = thumb === activeThumb;
      thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function syncStageIndex(stage, thumbs, nextIndex) {
    const safeIndex = Math.max(0, Math.min(nextIndex, thumbs.length - 1));
    const activeThumb = thumbs[safeIndex];
    const mainImg = stage.querySelector('.product-gallery-main img');
    if (!activeThumb || !mainImg) return;
    const source = readThumbSource(activeThumb);
    if (!source) return;
    animateMainImage(mainImg, source.src, source.srcset);
    updateActiveThumbs(stage, activeThumb);
    stage.setAttribute('data-gallery-index', String(safeIndex));
    if (window.matchMedia('(max-width: 1023px)').matches) {
      activeThumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  function animateMainImage(mainImg, nextSrc, nextSrcset) {
    const frame = mainImg.closest('.product-gallery-main');
    if (frame) frame.classList.add('is-switching');

    mainImg.style.transition = 'opacity 160ms ease, transform 220ms ease';
    mainImg.style.opacity = '0.18';
    mainImg.style.transform = 'scale(0.985)';
    window.setTimeout(function () {
      mainImg.src = nextSrc;
      if (nextSrcset) {
        mainImg.srcset = nextSrcset;
      } else {
        mainImg.removeAttribute('srcset');
      }
      mainImg.style.opacity = '1';
      mainImg.style.transform = 'scale(1)';
      if (frame) frame.classList.remove('is-switching');
    }, 140);
  }

  document.querySelectorAll('.product-gallery-stage').forEach(function (stage) {
    const thumbs = Array.from(stage.querySelectorAll('.product-gallery-grid .product-thumb-card'));
    stage.setAttribute('data-gallery-index', '0');
    thumbs.forEach(function (thumb, index) {
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'Open gallery image ' + (index + 1));
      thumb.setAttribute('data-gallery-thumb-index', String(index));
    });
    if (thumbs.length) {
      updateActiveThumbs(stage, thumbs[0]);
    }

    const mainFrame = stage.querySelector('.product-gallery-main');
    if (!mainFrame || thumbs.length < 2) return;

    let pointerStartX = null;
    mainFrame.addEventListener('pointerdown', function (event) {
      if (!window.matchMedia('(max-width: 1023px)').matches) return;
      pointerStartX = event.clientX;
    });

    mainFrame.addEventListener('pointerup', function (event) {
      if (!window.matchMedia('(max-width: 1023px)').matches || pointerStartX === null) return;
      const deltaX = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(deltaX) < 36) return;
      const currentIndex = Number(stage.getAttribute('data-gallery-index') || 0);
      const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
      syncStageIndex(stage, thumbs, nextIndex);
    });
  });

  document.addEventListener('click', function (event) {
    const thumb = event.target.closest('.product-gallery-grid .product-thumb-card');
    if (!thumb) return;
    const stage = thumb.closest('.product-gallery-stage');
    if (!stage) return;
    const thumbs = Array.from(stage.querySelectorAll('.product-gallery-grid .product-thumb-card'));
    const index = thumbs.indexOf(thumb);
    if (index < 0) return;
    syncStageIndex(stage, thumbs, index);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const thumb = event.target.closest('.product-gallery-grid .product-thumb-card');
    if (!thumb) return;
    event.preventDefault();
    thumb.click();
  });
}());

// ─── Product: sticky add to cart ─────────────────────────────────────────────
(function () {
  function initProductStickyAtc() {
    const productRoot = document.querySelector('[data-product-root]');
    if (!productRoot) return;

    const stickyBar = productRoot.querySelector('[data-sticky-atc]');
    const primaryActionWrap = productRoot.querySelector('[data-product-primary-action-wrap]');
    const variantSelect = productRoot.querySelector('[data-product-variant-select]');
    const primaryButton = productRoot.querySelector('[data-product-primary-button]');
    const primaryButtonLabel = productRoot.querySelector('[data-product-primary-button-label]');
    const primaryButtonPrice = productRoot.querySelector('[data-product-primary-button-price]');
    const primaryButtonDivider = productRoot.querySelector('[data-product-primary-button-divider]');
    const variantReinforcement = productRoot.querySelector('[data-product-variant-reinforcement]');
    const selectedVariantLabel = productRoot.querySelector('[data-product-selected-variant-label]');
    const variantChips = Array.from(productRoot.querySelectorAll('[data-product-variant-chip]'));
    const priceBlock = productRoot.querySelector('[data-product-price-block]');
    if (!stickyBar || !primaryActionWrap) return;

    const stickyPrice = stickyBar.querySelector('[data-sticky-atc-price]');
    const stickyButton = stickyBar.querySelector('[data-sticky-atc-button]');
    const stickyButtonLabel = stickyBar.querySelector('[data-sticky-atc-button-label]');
    const stickyButtonPrice = stickyBar.querySelector('[data-sticky-atc-button-price]');
    const stickyButtonDivider = stickyBar.querySelector('[data-sticky-atc-button-divider]');
    const stickyVariant = stickyBar.querySelector('[data-sticky-atc-variant]');
    const stickyAvailability = stickyBar.querySelector('[data-sticky-atc-availability]');

    if (!stickyPrice || !stickyButton) return;

    let ticking = false;

    function updatePriceBlock(option) {
      if (!priceBlock || !option) return;

      const amount = priceBlock.querySelector('[data-price-amount]');
      const compare = priceBlock.querySelector('[data-price-compare]');
      const promo = priceBlock.querySelector('[data-price-promo]');
      const priceText = option.dataset.variantPrice || '';
      const compareText = option.dataset.variantComparePrice || '';
      const saveLabel = option.dataset.variantSaveLabel || '';

      if (amount && priceText) {
        amount.textContent = priceText;
      }

      if (compare) {
        if (compareText) {
          compare.textContent = compareText;
          compare.classList.remove('hidden');
        } else {
          compare.textContent = '';
          compare.classList.add('hidden');
        }
      }

      if (promo) {
        if (saveLabel) {
          promo.textContent = saveLabel;
          promo.classList.remove('hidden');
        } else {
          promo.textContent = '';
          promo.classList.add('hidden');
        }
      }
    }

    function syncButtonState(isAvailable, priceText) {
      const buttonLabel = isAvailable ? 'Add to cart' : 'Sold out';

      if (primaryButton) {
        primaryButton.disabled = !isAvailable;
      }

      if (primaryButtonLabel) {
        primaryButtonLabel.textContent = buttonLabel;
      }

      if (primaryButtonPrice) {
        primaryButtonPrice.textContent = priceText || '';
        primaryButtonPrice.hidden = !isAvailable;
      }

      if (primaryButtonDivider) {
        primaryButtonDivider.hidden = !isAvailable;
      }

      stickyButton.disabled = !isAvailable;

      if (stickyButtonLabel) {
        stickyButtonLabel.textContent = buttonLabel;
      }

      if (stickyButtonPrice) {
        stickyButtonPrice.textContent = priceText || '';
        stickyButtonPrice.hidden = !isAvailable;
      }

      if (stickyButtonDivider) {
        stickyButtonDivider.hidden = !isAvailable;
      }
    }

    function syncVariantReinforcement(option, isAvailable) {
      if (!variantReinforcement || !option) return;

      const variantTitle = option.dataset.variantTitle || option.textContent.trim().replace(/\s*-\s*Sold out$/, '');
      variantReinforcement.textContent = 'Selected: ' + variantTitle + (isAvailable ? ' · In stock' : ' · Sold out');
    }

    function syncSelectedVariantLabel(option) {
      if (!selectedVariantLabel || !option) return;
      selectedVariantLabel.textContent = option.dataset.variantOptionLabel || option.textContent.trim().replace(/\s*-\s*Sold out$/, '');
    }

    function syncStickyMeta(option, isAvailable, priceText) {
      if (stickyVariant && option) {
        const variantLabel = option.dataset.variantOptionLabel || option.textContent.trim().replace(/\s*-\s*Sold out$/, '');
        stickyVariant.textContent = variantLabel;
      }

      if (stickyAvailability) {
        stickyAvailability.textContent = isAvailable ? 'In stock' : 'Sold out';
        stickyAvailability.classList.toggle('is-unavailable', !isAvailable);
      }

      if (stickyPrice) {
        stickyPrice.textContent = priceText || '';
      }
    }

    function syncVariantChips(selectedValue) {
      if (!variantChips.length) return;

      variantChips.forEach(function (chip) {
        const isActive = chip.dataset.variantId === selectedValue;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    function syncVariantState() {
      if (!variantSelect) {
        syncButtonState(primaryButton ? !primaryButton.disabled : true, stickyPrice.textContent);
        return;
      }

      const selectedOption = variantSelect.options[variantSelect.selectedIndex];
      if (!selectedOption) return;
      const priceText = selectedOption.dataset.variantPrice || stickyPrice.textContent;

      updatePriceBlock(selectedOption);

      const isAvailable = selectedOption.dataset.variantAvailable !== 'false';
      syncButtonState(isAvailable, priceText);
      syncVariantReinforcement(selectedOption, isAvailable);
      syncSelectedVariantLabel(selectedOption);
      syncStickyMeta(selectedOption, isAvailable, priceText);
      syncVariantChips(selectedOption.value);
    }

    function selectVariantById(variantId) {
      if (!variantSelect) return;
      const nextOption = Array.from(variantSelect.options).find(function (option) {
        return option.value === variantId && !option.disabled;
      });

      if (!nextOption) return;
      variantSelect.value = nextOption.value;
      variantSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function updateVisibility() {
      const rect = primaryActionWrap.getBoundingClientRect();
      const ctaVisible = rect.top < window.innerHeight - 32 && rect.bottom > 0;
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      const scrollThreshold = desktop ? 220 : 48;
      const shouldShow = window.scrollY > scrollThreshold && !ctaVisible;

      stickyBar.hidden = false;
      stickyBar.classList.toggle('is-visible', shouldShow);
      stickyBar.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      ticking = false;
    }

    function requestVisibilityUpdate() {
      if (ticking) return;
      window.requestAnimationFrame(updateVisibility);
      ticking = true;
    }

    if (variantSelect) {
      variantSelect.addEventListener('change', syncVariantState);
      variantChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          selectVariantById(chip.dataset.variantId);
        });
      });
      syncVariantState();
    } else if (primaryButton) {
      syncButtonState(!primaryButton.disabled, stickyPrice.textContent);
      syncStickyMeta(null, !primaryButton.disabled, stickyPrice.textContent);
    }

    updateVisibility();
    window.addEventListener('scroll', requestVisibilityUpdate, { passive: true });
    window.addEventListener('resize', requestVisibilityUpdate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductStickyAtc);
  } else {
    initProductStickyAtc();
  }
}());

// ─── GSAP: hero entrance ──────────────────────────────────────────────────────
(function () {
  function animateHeroSlide(slide, isInitial) {
    if (!slide || prefersReducedMotion()) return;

    const kicker = slide.querySelector('[data-hero-kicker]');
    const heading = slide.querySelector('[data-hero-heading]');
    const copy = slide.querySelector('[data-hero-copy]');
    const actions = slide.querySelector('[data-hero-actions]');
    const media = slide.querySelector('[data-hero-media]');
    const controls = slide.closest('[data-hero-slider]')?.querySelector('.home-hero-slider-controls');
    const items = [kicker, heading, copy, actions].filter(Boolean);

    animateMediaReveal(media, {
      scaleFrom: isInitial ? 0.985 : 1.015,
      duration: isInitial ? 700 : 460
    });

    animateSequence(items, {
      distance: isInitial ? 10 : 14,
      duration: isInitial ? 420 : 320,
      baseDelay: isInitial ? 80 : 50,
      delayStep: 55
    });

    if (controls && isInitial) {
      controls.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 320,
        delay: 320,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both'
      });
    }
  }

  function initHeroEntrance() {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;
    if (prefersReducedMotion()) return;
    const activeSlide = hero.querySelector('[data-hero-slide].is-active') || hero.querySelector('[data-hero-slide]');
    animateHeroSlide(activeSlide, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroEntrance);
  } else {
    initHeroEntrance();
  }
}());

// ─── Hero slider ──────────────────────────────────────────────────────────────
(function () {
  function initHeroSlider() {
    const hero = document.querySelector('[data-hero-slider]');
    if (!hero) return;

    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const prev = hero.querySelector('[data-hero-prev]');
    const next = hero.querySelector('[data-hero-next]');
    const autoplayEnabled = hero.getAttribute('data-hero-autoplay') === 'true';
    const reducedMotion = prefersReducedMotion();

    if (slides.length <= 1) return;

    let index = 0;
    let timer = null;

    function syncControls() {
      dots.forEach(function (dot, dotIndex) {
        const active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function animateActiveSlide(slide, initial) {
      if (!slide || reducedMotion) return;
      const kicker = slide.querySelector('[data-hero-kicker]');
      const heading = slide.querySelector('[data-hero-heading]');
      const copy = slide.querySelector('[data-hero-copy]');
      const actions = slide.querySelector('[data-hero-actions]');
      const media = slide.querySelector('[data-hero-media]');
      const items = [kicker, heading, copy, actions].filter(Boolean);

      animateMediaReveal(media, {
        scaleFrom: initial ? 0.985 : 1.01,
        duration: initial ? 620 : 420
      });

      animateSequence(items, {
        distance: initial ? 10 : 12,
        duration: initial ? 380 : 300,
        baseDelay: initial ? 80 : 50,
        delayStep: 45
      });
    }

    function showSlide(nextIndex, initial) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.hidden = !active;
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      syncControls();
      animateActiveSlide(slides[index], initial === true);
    }

    function clearTimer() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    function startAutoplay() {
      if (!autoplayEnabled || reducedMotion) return;
      clearTimer();
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 6200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1, false);
        startAutoplay();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1, false);
        startAutoplay();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-index') || 0), false);
        startAutoplay();
      });
    });

    hero.addEventListener('mouseenter', clearTimer);
    hero.addEventListener('mouseleave', startAutoplay);
    hero.addEventListener('focusin', clearTimer);
    hero.addEventListener('focusout', startAutoplay);

    showSlide(0, true);
    startAutoplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroSlider);
  } else {
    initHeroSlider();
  }
}());

// ─── Horizontal product carousels ────────────────────────────────────────────
(function () {
  function initScrollCarousels() {
    document.querySelectorAll('[data-scroll-carousel]').forEach(function (carousel) {
      const track = carousel.querySelector('[data-carousel-track]');
      if (!track) return;

      const section = carousel.closest('section');
      const prev = section ? section.querySelector('[data-carousel-prev]') : null;
      const next = section ? section.querySelector('[data-carousel-next]') : null;
      const progress = section ? section.querySelector('[data-carousel-progress]') : null;

      function updateControls() {
        if (!prev || !next) return;
        const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
        const atStart = track.scrollLeft <= 4;
        const atEnd = track.scrollLeft >= maxScroll - 4;
        prev.classList.toggle('is-disabled', atStart);
        next.classList.toggle('is-disabled', atEnd);
        prev.setAttribute('aria-disabled', atStart ? 'true' : 'false');
        next.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
        if (progress) {
          const pct = maxScroll > 0 ? Math.min((track.scrollLeft / maxScroll) * 100, 100) : 0;
          progress.style.width = pct + '%';
        }
      }

      function step() {
        return Math.max(track.clientWidth * 0.78, 280);
      }

      if (prev) {
        prev.addEventListener('click', function () {
          if (prev.getAttribute('aria-disabled') === 'true') return;
          track.scrollBy({ left: -step(), behavior: 'smooth' });
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          if (next.getAttribute('aria-disabled') === 'true') return;
          track.scrollBy({ left: step(), behavior: 'smooth' });
        });
      }

      track.addEventListener('scroll', updateControls, { passive: true });
      window.addEventListener('resize', updateControls);
      updateControls();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollCarousels);
  } else {
    initScrollCarousels();
  }
}());

// ─── Product carousel tab filter ────────────────────────────────────────────
(function () {
  function initProductTabs() {
    document.querySelectorAll('[data-product-tabs]').forEach(function (tabList) {
      const section = tabList.closest('section');
      if (!section) return;
      const track = section.querySelector('[data-carousel-track]');
      const tabs = tabList.querySelectorAll('[data-tab]');

      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          const targetGroup = tab.getAttribute('data-tab');

          // Update tab active state
          tabs.forEach(function (t) {
            t.classList.remove('is-active');
            t.setAttribute('aria-selected', 'false');
          });
          tab.classList.add('is-active');
          tab.setAttribute('aria-selected', 'true');

          // Show/hide slides
          if (track) {
            track.querySelectorAll('[data-tab-group]').forEach(function (slide) {
              slide.style.display = slide.getAttribute('data-tab-group') === targetGroup ? '' : 'none';
            });
            // Reset scroll position
            track.scrollLeft = 0;
            // Trigger controls update via scroll event
            track.dispatchEvent(new Event('scroll'));
          }
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductTabs);
  } else {
    initProductTabs();
  }
}());

// ─── Drawer ───────────────────────────────────────────────────────────────────
const DRAWER_OPEN_CLASS = 'is-open';
const DRAWER_CLOSE_DELAY = 240;

function findDrawerController(target) {
  return document.querySelector('[data-drawer-open="' + target.id + '"]');
}

function openDrawer(target, controller) {
  window.clearTimeout(target._drawerTimer);
  target.hidden = false;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('drawer-open');
  if (controller) controller.setAttribute('aria-expanded', 'true');

  window.requestAnimationFrame(function() {
    target.classList.add(DRAWER_OPEN_CLASS);
    const panel = target.querySelector('[data-drawer-panel]');
    if (panel) {
      panel.focus();
      trapFocusInDrawer(panel);
    }
  });
}

function trapFocusInDrawer(panel) {
  const SELECTORS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function handleTab(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(panel.querySelectorAll(SELECTORS)).filter(function(el) {
      return !el.closest('[hidden]') && el.offsetParent !== null;
    });
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === panel) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  panel.removeEventListener('keydown', panel._trapHandler);
  panel._trapHandler = handleTab;
  panel.addEventListener('keydown', handleTab);
}

function closeDrawer(target, controller) {
  window.clearTimeout(target._drawerTimer);
  target.classList.remove(DRAWER_OPEN_CLASS);
  document.body.style.overflow = '';
  document.body.classList.remove('drawer-open');

  const resolvedController = controller || findDrawerController(target);
  if (resolvedController) resolvedController.setAttribute('aria-expanded', 'false');

  target._drawerTimer = window.setTimeout(function() {
    if (!target.classList.contains(DRAWER_OPEN_CLASS)) {
      target.hidden = true;
    }
  }, DRAWER_CLOSE_DELAY);
}

document.addEventListener('click', function(event) {
  const openButton = event.target.closest('[data-drawer-open]');
  const closeButton = event.target.closest('[data-drawer-close]');

  if (openButton) {
    const target = document.getElementById(openButton.getAttribute('data-drawer-open'));
    if (target) {
      openDrawer(target, openButton);
    }
  }

  if (closeButton) {
    const target = closeButton.closest('[data-drawer]');
    if (target) {
      closeDrawer(target);
    }
  }

  if (!closeButton) {
    const mobileDestination = event.target.closest('#mobile-nav-drawer a[href]');
    if (mobileDestination) {
      const target = mobileDestination.closest('[data-drawer]');
      if (target) {
        closeDrawer(target);
      }
    }
  }
});

document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;

  const openDrawer = document.querySelector('[data-drawer]:not([hidden])');
  if (!openDrawer) return;

  closeDrawer(openDrawer);
});

// ─── Mega menu controller ────────────────────────────────────────────────────
(function () {
  const OPEN_DELAY = 500;
  const CLOSE_DELAY = 500;
  const PANEL_HIDE_DELAY = 80;

  function MegaMenu(root) {
    this.root = root;
    this.config = this.readConfig();
    this.triggers = Array.from(root.querySelectorAll('[data-mega-trigger]'));
    this.navItems = Array.from(root.querySelectorAll('[data-mega-item]'));
    this.panels = Array.from(root.querySelectorAll('[data-mega-panel]'));
    this.backdrop = root.querySelector('[data-mega-backdrop]');
    this.activeKey = null;
    this.openTimer = null;
    this.closeTimer = null;

    if (!this.triggers.length || !this.panels.length) return;

    this.bindStagePanels();
    this.bindEvents();
  }

  MegaMenu.prototype.readConfig = function () {
    const script = this.root.querySelector('[data-mega-menu-config]');
    if (!script) return {};

    try {
      const parsed = JSON.parse(script.textContent || '{}');
      window.megaMenu = parsed;
      return parsed;
    } catch (error) {
      return {};
    }
  };

  MegaMenu.prototype.bindEvents = function () {
    const self = this;

    this.navItems.forEach(function (item) {
      const key = item.getAttribute('data-mega-item');
      const trigger = item.querySelector('[data-mega-trigger]');
      if (!key || !trigger) return;

      item.addEventListener('mouseenter', function () {
        self.scheduleOpen(key);
      });

      item.addEventListener('mouseleave', function () {
        self.scheduleClose();
      });

      trigger.addEventListener('focus', function () {
        self.open(key, true);
      });
    });

    this.panels.forEach(function (panel) {
      panel.addEventListener('mouseenter', function () {
        self.clearCloseTimer();
      });

      panel.addEventListener('mouseleave', function () {
        self.scheduleClose();
      });

      panel.querySelectorAll('[data-mega-preview-target]').forEach(function (item) {
        item.addEventListener('mouseenter', function () {
          self.updatePreview(panel.getAttribute('data-mega-panel'), item.getAttribute('data-mega-preview-target'));
        });

        item.addEventListener('focus', function () {
          self.updatePreview(panel.getAttribute('data-mega-panel'), item.getAttribute('data-mega-preview-target'));
        });
      });
    });

    this.root.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (!self.root.contains(document.activeElement)) {
          self.close();
        }
      }, 0);
    });

    this.root.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!self.activeKey) return;

      event.preventDefault();
      const activeTrigger = self.root.querySelector('[data-mega-trigger="' + self.activeKey + '"]');
      self.close();
      if (activeTrigger) activeTrigger.focus();
    });

    document.addEventListener('pointerdown', function (event) {
      if (!self.activeKey) return;
      if (self.root.contains(event.target)) return;
      self.close();
    });
  };

  MegaMenu.prototype.bindStagePanels = function () {
    this.panels.forEach(function (panel) {
      panel.querySelectorAll('[data-mega-stage-root]').forEach(function (root) {
        const buttons = Array.from(root.querySelectorAll('[data-mega-stage-target]'));
        const stages = Array.from(root.querySelectorAll('[data-mega-stage-panel]'));
        if (!buttons.length || !stages.length) return;

        function activate(target) {
          buttons.forEach(function (button) {
            const active = button.getAttribute('data-mega-stage-target') === target;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
          });

          stages.forEach(function (stage) {
            const active = stage.getAttribute('data-mega-stage-panel') === target;
            stage.classList.toggle('is-active', active);
            stage.hidden = !active;
          });
        }

        const defaultButton = buttons.find(function (button) {
          return button.classList.contains('is-active');
        }) || buttons[0];

        if (defaultButton) {
          activate(defaultButton.getAttribute('data-mega-stage-target'));
        }

        buttons.forEach(function (button) {
          function onIntent() {
            activate(button.getAttribute('data-mega-stage-target'));
          }

          button.addEventListener('mouseenter', onIntent);
          button.addEventListener('focus', onIntent);
          button.addEventListener('click', onIntent);
        });
      });
    });
  };

  MegaMenu.prototype.scheduleOpen = function (key) {
    const self = this;
    this.clearCloseTimer();
    window.clearTimeout(this.openTimer);
    this.openTimer = window.setTimeout(function () {
      self.open(key, false);
    }, this.activeKey ? 0 : OPEN_DELAY);
  };

  MegaMenu.prototype.clearCloseTimer = function () {
    window.clearTimeout(this.closeTimer);
  };

  MegaMenu.prototype.scheduleClose = function () {
    const self = this;
    this.clearCloseTimer();
    this.closeTimer = window.setTimeout(function () {
      self.close();
    }, CLOSE_DELAY);
  };

  MegaMenu.prototype.open = function (key, immediate) {
    const panel = this.root.querySelector('[data-mega-panel="' + key + '"]');
    if (!panel) return;

    if (this.activeKey && this.activeKey !== key) {
      this.hidePanel(this.activeKey, true);
    }

    this.activeKey = key;
    this.root.classList.add('is-open');
    this.navItems.forEach(function (item) {
      item.classList.toggle('is-active', item.getAttribute('data-mega-item') === key);
    });

    this.triggers.forEach(function (trigger) {
      const expanded = trigger.getAttribute('data-mega-trigger') === key;
      trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    if (this.backdrop) {
      this.backdrop.hidden = false;
      this.backdrop.classList.add('is-active');
    }

    window.clearTimeout(panel._hideTimer);
    panel.hidden = false;
    window.requestAnimationFrame(function () {
      panel.classList.add('is-active');
    });

    this.updatePreview(key, this.defaultPreviewId(key));
    document.dispatchEvent(new CustomEvent('mega:open', { detail: { key: key } }));
  };

  MegaMenu.prototype.hidePanel = function (key, immediate) {
    const panel = this.root.querySelector('[data-mega-panel="' + key + '"]');
    if (!panel) return;

    window.clearTimeout(panel._hideTimer);
    panel.classList.remove('is-active');

    if (immediate) {
      panel.hidden = true;
      return;
    }

    panel._hideTimer = window.setTimeout(function () {
      if (!panel.classList.contains('is-active')) {
        panel.hidden = true;
      }
    }, PANEL_HIDE_DELAY);
  };

  MegaMenu.prototype.close = function () {
    if (!this.activeKey) return;

    const key = this.activeKey;
    this.hidePanel(key, false);
    this.activeKey = null;
    this.root.classList.remove('is-open');

    this.navItems.forEach(function (item) {
      item.classList.remove('is-active');
    });

    this.triggers.forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    });

    if (this.backdrop) {
      this.backdrop.classList.remove('is-active');
      window.setTimeout(function () {
        if (!this.root.classList.contains('is-open')) {
          this.backdrop.hidden = true;
        }
      }.bind(this), PANEL_HIDE_DELAY);
    }

    document.dispatchEvent(new CustomEvent('mega:close'));
  };

  MegaMenu.prototype.defaultPreviewId = function (group) {
    const config = this.config[group];
    if (!config || !config.previewContent) return null;
    return config.previewContent.defaultId || null;
  };

  MegaMenu.prototype.updatePreview = function (group, previewId) {
    const config = this.config[group];
    if (!config || !previewId || !Array.isArray(config.groups)) return;

    const item = config.groups.find(function (entry) {
      return entry.id === previewId;
    });
    if (!item || !item.preview) return;

    const host = this.root.querySelector('[data-mega-preview-host="' + group + '"]');
    if (!host) return;

    host.querySelectorAll('[data-mega-preview-target]').forEach(function () {});

    const eyebrow = host.querySelector('[data-mega-preview-eyebrow]');
    const title = host.querySelector('[data-mega-preview-title]');
    const copy = host.querySelector('[data-mega-preview-copy]');
    const link = host.querySelector('[data-mega-preview-link]');
    const cta = host.querySelector('[data-mega-preview-cta]');
    const image = host.querySelector('[data-mega-preview-image], .mega-menu-preview-image');

    if (eyebrow) eyebrow.textContent = item.preview.eyebrow || '';
    if (title) title.textContent = item.preview.title || '';
    if (copy) copy.textContent = item.preview.copy || '';
    if (link && item.preview.href) link.setAttribute('href', item.preview.href);
    if (cta) cta.textContent = item.preview.cta || 'Explore';
    if (image && item.preview.image) {
      image.style.transition = 'opacity 140ms ease, transform 200ms ease';
      image.style.opacity = '0.14';
      image.style.transform = 'scale(0.985)';
      window.setTimeout(function () {
        image.setAttribute('src', item.preview.image);
        image.style.opacity = '1';
        image.style.transform = 'scale(1)';
      }, 90);
    }

    this.root.querySelectorAll('[data-mega-group="' + group + '"][data-mega-preview-target]').forEach(function (entry) {
      entry.classList.toggle('is-active', entry.getAttribute('data-mega-preview-target') === previewId);
    });
  };

  function initMegaMenus() {
    const instances = [];
    document.querySelectorAll('[data-mega-menu]').forEach(function (root) {
      instances.push(new MegaMenu(root));
    });

    window.closeMegaMenus = function () {
      instances.forEach(function (instance) {
        if (instance && typeof instance.close === 'function') {
          instance.close();
        }
      });
    };
  }

  function initNavSubmenus() {
    const submenus = Array.from(document.querySelectorAll('[data-nav-submenu]'));
    if (!submenus.length) return;

    function closeAll(except) {
      submenus.forEach(function (item) {
        if (except && item === except) return;
        const trigger = item.querySelector('[data-nav-submenu-trigger]');
        const panel = item.querySelector('[data-nav-submenu-panel]');
        if (!trigger || !panel) return;
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      });
    }

    submenus.forEach(function (item) {
      const trigger = item.querySelector('[data-nav-submenu-trigger]');
      const panel = item.querySelector('[data-nav-submenu-panel]');
      if (!trigger || !panel) return;

      function openItem() {
        if (window.closeMegaMenus) window.closeMegaMenus();
        closeAll(item);
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      }

      function closeItem() {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      }

      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        if (item.classList.contains('is-open')) {
          closeItem();
        } else {
          openItem();
        }
      });

      item.addEventListener('mouseenter', openItem);
      item.addEventListener('mouseleave', closeItem);
      trigger.addEventListener('focus', openItem);

      item.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!item.contains(document.activeElement)) {
            closeItem();
          }
        }, 0);
      });
    });

    document.addEventListener('pointerdown', function (event) {
      const insideAny = submenus.some(function (item) {
        return item.contains(event.target);
      });
      if (!insideAny) closeAll();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeAll();
      }
    });

    document.addEventListener('mega:open', function () {
      closeAll();
    });
  }

  function initMegaMobileAccordion() {
    document.querySelectorAll('[data-mega-mobile-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const group = trigger.getAttribute('data-mega-mobile-trigger');
        const parent = trigger.closest('.mega-mobile-nav');
        if (!parent) return;

        parent.querySelectorAll('[data-mega-mobile-trigger]').forEach(function (button) {
          const buttonGroup = button.getAttribute('data-mega-mobile-trigger');
          const panel = parent.querySelector('[data-mega-mobile-panel="' + buttonGroup + '"]');
          const shouldOpen = buttonGroup === group ? button.getAttribute('aria-expanded') !== 'true' : false;

          button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
          if (!panel) return;
          panel.hidden = !shouldOpen;
          panel.classList.toggle('is-open', shouldOpen);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMegaMenus();
      initNavSubmenus();
      initMegaMobileAccordion();
    });
  } else {
    initMegaMenus();
    initNavSubmenus();
    initMegaMobileAccordion();
  }
}());

// ─── Header search mega panel ────────────────────────────────────────────────
(function () {
  function initSearchMegaPanel() {
    const trigger = document.querySelector('[data-search-mega-trigger]');
    const panel = document.querySelector('[data-search-mega-panel]');
    if (!trigger || !panel) return;

    const closeButton = panel.querySelector('[data-search-mega-close]');
    const input = panel.querySelector('.search-mega-input');
    const OPEN_CLASS = 'is-open';
    const HIDE_DELAY = 180;

    const overlayHeader = document.querySelector('.site-header--hero-overlay');
    function setSearchOpen(open) {
      if (overlayHeader) overlayHeader.classList.toggle('is-menu-open', open);
    }

    function openPanel() {
      if (window.closeMegaMenus) window.closeMegaMenus();
      window.clearTimeout(panel._hideTimer);
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      setSearchOpen(true);
      window.requestAnimationFrame(function () {
        panel.classList.add(OPEN_CLASS);
      });
      if (input) {
        window.setTimeout(function () {
          input.focus();
        }, 80);
      }
    }

    function closePanel() {
      window.clearTimeout(panel._hideTimer);
      panel.classList.remove(OPEN_CLASS);
      trigger.setAttribute('aria-expanded', 'false');
      setSearchOpen(false);
      panel._hideTimer = window.setTimeout(function () {
        if (!panel.classList.contains(OPEN_CLASS)) {
          panel.hidden = true;
        }
      }, HIDE_DELAY);
    }

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      if (panel.classList.contains(OPEN_CLASS)) {
        closePanel();
      } else {
        openPanel();
      }
    });

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        closePanel();
        trigger.focus();
      });
    }

    document.addEventListener('pointerdown', function (event) {
      if (!panel.classList.contains(OPEN_CLASS)) return;
      if (panel.contains(event.target) || trigger.contains(event.target)) return;
      closePanel();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!panel.classList.contains(OPEN_CLASS)) return;
      closePanel();
      trigger.focus();
    });

    document.addEventListener('mega:open', function () {
      closePanel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchMegaPanel);
  } else {
    initSearchMegaPanel();
  }
}());
