(function () {
  'use strict';

  var SCALE_MIN = 1;
  var SCALE_MAX = 4;
  var SCALE_STEP = 0.4;
  var previousFocus = null;

  var state = {
    scale: 1,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    lastX: 0,
    lastY: 0,
    lastPinchDist: 0
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function highResSrc(src) {
    if (!src) return '';
    try {
      var url = new URL(src, window.location.origin);
      if (url.hostname.indexOf('shopify') !== -1 || url.searchParams.has('width')) {
        url.searchParams.set('width', '2000');
      }
      return url.toString();
    } catch (error) {
      return src;
    }
  }

  function getActiveImage(trigger) {
    return trigger ? trigger.querySelector('img') : null;
  }

  function resetTransform() {
    state.scale = 1;
    state.lastX = 0;
    state.lastY = 0;
    state.isDragging = false;
    applyTransform();
  }

  function applyTransform() {
    var img = document.getElementById('pdp-zoom-img');
    if (!img) return;
    img.style.transform = 'translate(' + state.lastX + 'px, ' + state.lastY + 'px) scale(' + state.scale + ')';
    img.style.cursor = state.scale > 1 ? 'grab' : 'zoom-in';
  }

  function constrainPan(x, y) {
    var wrap = document.querySelector('[data-zoom-wrap]');
    var img = document.getElementById('pdp-zoom-img');
    if (!wrap || !img) return { x: x, y: y };

    var maxX = Math.max(0, ((img.clientWidth * state.scale) - wrap.clientWidth) / 2);
    var maxY = Math.max(0, ((img.clientHeight * state.scale) - wrap.clientHeight) / 2);

    return {
      x: clamp(x, -maxX, maxX),
      y: clamp(y, -maxY, maxY)
    };
  }

  function openZoom(src, alt, trigger) {
    var modal = document.getElementById('pdp-zoom-modal');
    var img = document.getElementById('pdp-zoom-img');
    if (!modal || !img || !src) return;

    previousFocus = trigger || document.activeElement;
    img.src = highResSrc(src);
    img.alt = alt || '';
    resetTransform();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var closeButton = modal.querySelector('.pdp-zoom-modal__close');
    if (closeButton) closeButton.focus();
  }

  function closeZoom() {
    var modal = document.getElementById('pdp-zoom-modal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    resetTransform();

    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
  }

  function setScale(nextScale) {
    state.scale = clamp(nextScale, SCALE_MIN, SCALE_MAX);
    var constrained = constrainPan(state.lastX, state.lastY);
    state.lastX = constrained.x;
    state.lastY = constrained.y;
    applyTransform();
  }

  function initTriggers() {
    document.querySelectorAll('[data-zoom-trigger]').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        if (event.target.closest('.product-gallery-grid')) return;
        var activeImage = getActiveImage(trigger);
        if (!activeImage) return;
        openZoom(activeImage.currentSrc || activeImage.src, activeImage.alt, trigger);
      });

      trigger.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        trigger.click();
      });
    });

    document.querySelectorAll('.product-gallery-main img').forEach(function (img) {
      img.style.cursor = 'zoom-in';
    });
  }

  function initModal() {
    var modal = document.getElementById('pdp-zoom-modal');
    if (!modal) return;

    var zoomImg = document.getElementById('pdp-zoom-img');

    modal.querySelector('.pdp-zoom-modal__close')?.addEventListener('click', closeZoom);

    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeZoom();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeZoom();
    });

    modal.addEventListener('mousedown', function (event) {
      if (event.target.closest('.pdp-zoom-modal__close')) return;
      state.isDragging = true;
      state.dragStartX = event.clientX - state.lastX;
      state.dragStartY = event.clientY - state.lastY;
      if (zoomImg) zoomImg.style.cursor = 'grabbing';
      event.preventDefault();
    });

    document.addEventListener('mousemove', function (event) {
      if (!state.isDragging) return;
      var constrained = constrainPan(
        event.clientX - state.dragStartX,
        event.clientY - state.dragStartY
      );
      state.lastX = constrained.x;
      state.lastY = constrained.y;
      applyTransform();
    });

    document.addEventListener('mouseup', function () {
      state.isDragging = false;
      applyTransform();
    });

    modal.addEventListener('wheel', function (event) {
      event.preventDefault();
      setScale(state.scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
    }, { passive: false });

    var lastTouchX = 0;
    var lastTouchY = 0;
    var lastTap = 0;

    modal.addEventListener('touchstart', function (event) {
      if (event.touches.length === 2) {
        state.lastPinchDist = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
      } else if (event.touches.length === 1) {
        lastTouchX = event.touches[0].clientX - state.lastX;
        lastTouchY = event.touches[0].clientY - state.lastY;
      }
    }, { passive: true });

    modal.addEventListener('touchmove', function (event) {
      event.preventDefault();
      if (event.touches.length === 2 && state.lastPinchDist > 0) {
        var dist = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
        setScale(state.scale * (dist / state.lastPinchDist));
        state.lastPinchDist = dist;
      } else if (event.touches.length === 1 && state.scale > 1) {
        var constrained = constrainPan(
          event.touches[0].clientX - lastTouchX,
          event.touches[0].clientY - lastTouchY
        );
        state.lastX = constrained.x;
        state.lastY = constrained.y;
        applyTransform();
      }
    }, { passive: false });

    modal.addEventListener('touchend', function () {
      var now = Date.now();
      if (now - lastTap < 300) {
        setScale(state.scale > 1 ? 1 : 2.5);
      }
      lastTap = now;
      state.lastPinchDist = 0;
    });
  }

  function init() {
    initTriggers();
    initModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

// ── Desktop side-panel hover zoom ──────────────────────────────────────────
(function () {
  // Only on devices with a real mouse
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.innerWidth < 1024) return;

  var mainFrame = document.querySelector('[data-pdp-main-image]');
  var zoomPane  = document.querySelector('[data-zoom-pane]');
  var zoomCrop  = document.querySelector('[data-zoom-crop]');
  var buyBox    = document.querySelector('.pdp-buy-box');
  var hintText  = document.querySelector('[data-zoom-hint-text]');

  if (!mainFrame || !zoomPane || !zoomCrop) return;

  // Update hint label
  if (hintText) hintText.textContent = 'Hover to zoom';

  var rafId = null;
  var lastX = 0, lastY = 0;
  var isActive = false;

  function getMainImg() {
    return mainFrame.querySelector('img');
  }

  function highResSrc(img) {
    var src = (img && (img.currentSrc || img.src)) || '';
    if (!src) return '';
    try {
      var url = new URL(src, window.location.origin);
      url.searchParams.set('width', '2400');
      return url.toString();
    } catch (e) {
      return src.replace(/(\?|&)(width=\d+)/, '$1width=2400')
                .replace(/^([^?]*)$/, '$1?width=2400');
    }
  }

  function updateCrop() {
    rafId = null;
    var img = getMainImg();
    if (!img) return;
    var rect = img.getBoundingClientRect();
    var xPct = Math.max(0, Math.min(100, ((lastX - rect.left)  / rect.width)  * 100));
    var yPct = Math.max(0, Math.min(100, ((lastY - rect.top)   / rect.height) * 100));
    zoomCrop.style.backgroundPosition = xPct + '% ' + yPct + '%';
  }

  mainFrame.addEventListener('mouseenter', function () {
    var img = getMainImg();
    if (!img) return;
    isActive = true;
    zoomCrop.style.backgroundImage = "url('" + highResSrc(img) + "')";
    zoomPane.classList.add('is-active');
    zoomPane.setAttribute('aria-hidden', 'false');
    if (buyBox) buyBox.classList.add('is-zoom-active');
  });

  mainFrame.addEventListener('mouseleave', function () {
    isActive = false;
    zoomPane.classList.remove('is-active');
    zoomPane.setAttribute('aria-hidden', 'true');
    if (buyBox) buyBox.classList.remove('is-zoom-active');
  });

  mainFrame.addEventListener('mousemove', function (e) {
    lastX = e.clientX;
    lastY = e.clientY;
    if (rafId == null) rafId = requestAnimationFrame(updateCrop);
  });

  // On desktop suppress mouse-initiated clicks to lightbox (keyboard clicks still work)
  mainFrame.addEventListener('click', function (e) {
    if (e.detail > 0) e.stopImmediatePropagation();
  }, true);

  // After thumb switch (animateMainImage fires at 140ms), update zoom bg
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-pdp-thumb]')) return;
    setTimeout(function () {
      var img = getMainImg();
      if (!img) return;
      var src = highResSrc(img);
      // Preload regardless; if currently hovering, swap bg immediately
      var preload = new Image();
      preload.src = src;
      if (isActive) zoomCrop.style.backgroundImage = "url('" + src + "')";
    }, 180);
  });
}());
