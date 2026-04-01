document.documentElement.classList.add('js');

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ─── Header: scroll state ─────────────────────────────────────────────────────
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init for pages that start scrolled
}());

// ─── Scroll reveal ────────────────────────────────────────────────────────────
(function () {
  const reduced = prefersReducedMotion();
  const revealGroups = [
    {
      selector: '.collection-hero, .product-layout, .home-feature-band, .home-faq-shell, .blog-lead-card, .editorial-shell, .hero-surface, .cta-surface-light, .cta-surface-dark',
      tier: '1',
      stagger: 0
    },
    {
      selector: '.home-collections-strip-card, .featured-products-slide, .support-link-card, .support-tile, .resource-card, .compatibility-card, .compare-card, .blog-stack-card, .search-result-card, .info-card, .troubleshooting-card',
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

// ─── Product gallery: click thumbnail to swap main image ─────────────────────
(function () {
  function updateActiveThumbs(stage, activeThumb) {
    stage.querySelectorAll('.product-gallery-grid .product-thumb-card').forEach(function (thumb) {
      const isActive = thumb === activeThumb;
      thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function animateMainImage(mainImg, nextSrc, nextSrcset) {
    const frame = mainImg.closest('.product-gallery-main');
    if (frame) frame.classList.add('is-switching');

    if (window.gsap && !prefersReducedMotion()) {
      gsap.to(mainImg, {
        opacity: 0.18,
        scale: 0.985,
        duration: 0.16,
        ease: 'power2.out',
        onComplete: function () {
          mainImg.src = nextSrc;
          if (nextSrcset) {
            mainImg.srcset = nextSrcset;
          } else {
            mainImg.removeAttribute('srcset');
          }
          gsap.fromTo(mainImg, {
            opacity: 0.24,
            scale: 1.018
          }, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: function () {
              if (frame) frame.classList.remove('is-switching');
            }
          });
        }
      });
      return;
    }

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
    thumbs.forEach(function (thumb, index) {
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'Open gallery image ' + (index + 1));
    });
    if (thumbs.length) {
      updateActiveThumbs(stage, thumbs[0]);
    }
  });

  document.addEventListener('click', function (event) {
    const thumb = event.target.closest('.product-gallery-grid .product-thumb-card');
    if (!thumb) return;
    const stage = thumb.closest('.product-gallery-stage');
    if (!stage) return;
    const mainImg = stage.querySelector('.product-gallery-main img');
    if (!mainImg) return;
    const thumbImg = thumb.querySelector('img');
    if (!thumbImg) return;
    animateMainImage(mainImg, thumbImg.src, thumbImg.srcset);
    updateActiveThumbs(stage, thumb);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const thumb = event.target.closest('.product-gallery-grid .product-thumb-card');
    if (!thumb) return;
    event.preventDefault();
    thumb.click();
  });
}());

// ─── GSAP: hero entrance ──────────────────────────────────────────────────────
(function () {
  function animateHeroSlide(slide, isInitial) {
    if (!slide || typeof gsap === 'undefined' || prefersReducedMotion()) return;

    const kicker = slide.querySelector('[data-hero-kicker]');
    const heading = slide.querySelector('[data-hero-heading]');
    const copy = slide.querySelector('[data-hero-copy]');
    const actions = slide.querySelector('[data-hero-actions]');
    const media = slide.querySelector('[data-hero-media]');
    const controls = slide.closest('[data-hero-slider]')?.querySelector('.home-hero-slider-controls');
    const items = [kicker, heading, copy, actions].filter(Boolean);

    gsap.killTweensOf([items, media, controls].flat());
    gsap.set(items, { opacity: 0, y: isInitial ? 10 : 14 });
    if (media) gsap.set(media, { opacity: 0, scale: isInitial ? 0.985 : 1.015 });
    if (controls && isInitial) gsap.set(controls, { opacity: 0, y: 8 });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (media) tl.to(media, { opacity: 1, scale: 1, duration: isInitial ? 0.7 : 0.46 }, 0);
    if (kicker) tl.to(kicker, { opacity: 1, y: 0, duration: 0.28 }, isInitial ? 0.08 : 0.05);
    if (heading) tl.to(heading, { opacity: 1, y: 0, duration: isInitial ? 0.52 : 0.36 }, isInitial ? 0.14 : 0.1);
    if (copy) tl.to(copy, { opacity: 1, y: 0, duration: 0.34 }, isInitial ? 0.24 : 0.18);
    if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.28 }, isInitial ? 0.32 : 0.25);
    if (controls && isInitial) tl.to(controls, { opacity: 1, y: 0, duration: 0.32 }, 0.32);
  }

  function initHeroEntrance() {
    if (typeof gsap === 'undefined') return;
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
      if (!slide || reducedMotion || typeof gsap === 'undefined') return;
      const kicker = slide.querySelector('[data-hero-kicker]');
      const heading = slide.querySelector('[data-hero-heading]');
      const copy = slide.querySelector('[data-hero-copy]');
      const actions = slide.querySelector('[data-hero-actions]');
      const media = slide.querySelector('[data-hero-media]');
      const items = [kicker, heading, copy, actions].filter(Boolean);

      gsap.killTweensOf(items);
      gsap.killTweensOf(media);
      gsap.set(items, { opacity: 0, y: initial ? 10 : 12 });
      if (media) gsap.set(media, { opacity: 0, scale: initial ? 0.985 : 1.01 });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (media) tl.to(media, { opacity: 1, scale: 1, duration: initial ? 0.62 : 0.42 }, 0);
      if (kicker) tl.to(kicker, { opacity: 1, y: 0, duration: 0.24 }, initial ? 0.08 : 0.05);
      if (heading) tl.to(heading, { opacity: 1, y: 0, duration: initial ? 0.46 : 0.34 }, initial ? 0.14 : 0.1);
      if (copy) tl.to(copy, { opacity: 1, y: 0, duration: 0.28 }, initial ? 0.22 : 0.18);
      if (actions) tl.to(actions, { opacity: 1, y: 0, duration: 0.24 }, initial ? 0.28 : 0.22);
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

      function updateControls() {
        if (!prev || !next) return;
        const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
        const atStart = track.scrollLeft <= 4;
        const atEnd = track.scrollLeft >= maxScroll - 4;
        prev.classList.toggle('is-disabled', atStart);
        next.classList.toggle('is-disabled', atEnd);
        prev.setAttribute('aria-disabled', atStart ? 'true' : 'false');
        next.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
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
    if (panel) panel.focus();
  });
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
});

document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;

  const openDrawer = document.querySelector('[data-drawer]:not([hidden])');
  if (!openDrawer) return;

  closeDrawer(openDrawer);
});

// ─── Mega menu controller ────────────────────────────────────────────────────
(function () {
  const OPEN_DELAY = 120;
  const CLOSE_DELAY = 240;
  const PANEL_HIDE_DELAY = 220;

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

  MegaMenu.prototype.scheduleOpen = function (key) {
    const self = this;
    this.clearCloseTimer();
    window.clearTimeout(this.openTimer);
    this.openTimer = window.setTimeout(function () {
      self.open(key, false);
    }, this.activeKey ? 60 : OPEN_DELAY);
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
      if (window.gsap && !prefersReducedMotion()) {
        gsap.to(image, {
          opacity: 0.14,
          scale: 0.985,
          duration: 0.12,
          ease: 'power2.out',
          onComplete: function () {
            image.setAttribute('src', item.preview.image);
            gsap.to(image, {
              opacity: 1,
              scale: 1,
              duration: 0.24,
              ease: 'power2.out'
            });
          }
        });
      } else {
        image.style.opacity = '0';
        window.setTimeout(function () {
          image.setAttribute('src', item.preview.image);
          image.style.opacity = '1';
          image.style.transform = 'scale(1.015)';
          window.setTimeout(function () {
            image.style.transform = '';
          }, 180);
        }, 90);
      }
    }

    this.root.querySelectorAll('[data-mega-group="' + group + '"][data-mega-preview-target]').forEach(function (entry) {
      entry.classList.toggle('is-active', entry.getAttribute('data-mega-preview-target') === previewId);
    });
  };

  function initMegaMenus() {
    document.querySelectorAll('[data-mega-menu]').forEach(function (root) {
      new MegaMenu(root);
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
      initMegaMobileAccordion();
    });
  } else {
    initMegaMenus();
    initMegaMobileAccordion();
  }
}());
