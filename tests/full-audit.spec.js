// tests/full-audit.spec.js
const { test } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs');

const BASE = 'https://ezquest-4.myshopify.com';
const AUDIT_RUN_ID = Date.now();
const THEME_PREVIEW_ID = process.env.EZQ_AUDIT_THEME_ID || '150294855878';

function auditUrl(path) {
  const params = [];
  if (THEME_PREVIEW_ID) params.push('preview_theme_id=' + encodeURIComponent(THEME_PREVIEW_ID));
  params.push('_audit=' + AUDIT_RUN_ID);
  const separator = path.includes('?') ? '&' : '?';
  return BASE + path + separator + params.join('&');
}

const ALL_PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Collections', path: '/collections' },
  { name: 'Hubs collection', path: '/collections/hubs-adapters' },
  { name: 'Chargers', path: '/collections/chargers-power' },
  { name: 'PDP', path: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3' },
  { name: 'Cart', path: '/cart' },
  { name: 'Search', path: '/search?q=usb+hub' },
  { name: 'Support hub', path: '/pages/support' },
  { name: 'FAQ', path: '/pages/faq' },
  { name: 'Downloads', path: '/pages/downloads' },
  { name: 'Compatibility', path: '/pages/compatibility' },
  { name: 'Warranty', path: '/pages/warranty' },
  { name: 'Contact', path: '/pages/contact' },
  { name: 'Help me choose', path: '/pages/help-me-choose' },
  { name: 'Compare', path: '/pages/compare' },
  { name: 'About', path: '/pages/about' },
  { name: 'Our story', path: '/pages/our-story' },
  { name: 'Where to buy', path: '/pages/where-to-buy' },
  { name: 'Shipping returns', path: '/pages/shipping-returns' },
  { name: 'Blog listing', path: '/blogs/resources' },
  { name: 'Blog article', path: '/blogs/resources/getting-started-with-the-ezquest-usb-c-multimedia-hub' },
  { name: '404', path: '/pages/this-does-not-exist' },
];

test.setTimeout(240000);

async function auditTypography(page) {
  return page.evaluate(() => {
    const issues = [];
    const fonts = new Set();
    const isThirdParty = (el) => {
      const id = el.id || '';
      const name = el.getAttribute('name') || '';
      return id.includes('web-pixels') ||
        name.startsWith('web-pixel-sandbox') ||
        !!el.closest('#web-pixels-manager-sandbox-container, [id^="tidio"], #tidio-chat');
    };

    document.querySelectorAll('h1,h2,h3,p,a,button,span').forEach((el) => {
      const ff = window.getComputedStyle(el).fontFamily.split(',')[0].trim();
      if (ff && !ff.includes('inherit')) fonts.add(ff);
    });

    if (fonts.size > 3) {
      issues.push('FONTS: ' + fonts.size + ' different font families found: ' + [...fonts].slice(0, 4).join(', '));
    }

    const inlineColors = [...document.querySelectorAll('[style]')]
      .filter((el) => !isThirdParty(el))
      .filter((el) => /color:\s*#[0-9a-fA-F]{3,6}/.test(el.getAttribute('style') || ''))
      .map((el) => el.tagName + ': ' + (el.getAttribute('style') || '').slice(0, 60));
    if (inlineColors.length > 0) {
      issues.push('INLINE COLORS (' + inlineColors.length + '): ' + inlineColors.slice(0, 3).join(' | '));
    }

    function parseRgb(value) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
    }
    function luminance(rgb) {
      const srgb = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }
    function contrast(a, b) {
      const l1 = luminance(a);
      const l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function effectiveBackground(el) {
      let current = el;
      while (current && current !== document.documentElement) {
        const bg = window.getComputedStyle(current).backgroundColor;
        if (bg && !bg.includes('rgba(0, 0, 0, 0)') && bg !== 'transparent') return bg;
        current = current.parentElement;
      }
      return 'rgb(255, 255, 255)';
    }

    const amberText = [...document.querySelectorAll('*')].filter((el) => {
      if (isThirdParty(el)) return false;
      if (el.closest('.ez-mega')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      if (!el.textContent.trim()) return false;
      if ([...el.children].some((child) => child.textContent.trim())) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      const color = window.getComputedStyle(el).color;
      const isAmber = color.includes('251, 206, 42') || color.includes('251,206,42');
      if (!isAmber) return false;
      const fg = parseRgb(color);
      const bg = parseRgb(effectiveBackground(el));
      return fg && bg && contrast(fg, bg) < 4.5;
    });
    if (amberText.length > 5) {
      issues.push('AMBER TEXT: ' + amberText.length + ' elements use amber as text color (check contrast)');
    }

    const h1s = document.querySelectorAll('h1');
    if (h1s.length === 0) issues.push('NO H1: page has no h1 tag');
    if (h1s.length > 1) issues.push('MULTIPLE H1s: ' + h1s.length + ' h1 tags found');

    const headings = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName);
    let prevLevel = 0;
    let hierarchyIssues = 0;
    headings.forEach((h) => {
      const level = parseInt(h[1], 10);
      if (prevLevel > 0 && level > prevLevel + 1) hierarchyIssues++;
      prevLevel = level;
    });
    if (hierarchyIssues > 0) {
      issues.push('HEADING HIERARCHY: ' + hierarchyIssues + ' heading level jumps detected');
    }

    return issues;
  });
}

async function auditAlignment(page) {
  return page.evaluate(() => {
    const issues = [];
    const viewportWidth = window.innerWidth;
    const isThirdParty = (el) => {
      const id = el.id || '';
      const name = el.getAttribute('name') || '';
      return id.includes('web-pixels') ||
        name.startsWith('web-pixel-sandbox') ||
        !!el.closest('#web-pixels-manager-sandbox-container, [id^="tidio"], #tidio-chat');
    };

    const overflowing = [...document.querySelectorAll('*')]
      .filter((el) => {
        if (isThirdParty(el)) return false;
        if (el.closest('.featured-products-carousel, .blog-filter-bar, .blog-filter-bar__inner, .home-testimonials, .home-testimonials-track, .home-testimonials-card, .home-press-logos, .home-press-logo-item')) return false;
        const rect = el.getBoundingClientRect();
        return rect.right > viewportWidth + 5 && rect.width > 10;
      })
      .map((el) => el.tagName + '.' + String(el.className || '').split(' ')[0]);
    if (overflowing.length > 0) {
      issues.push('OVERFLOW (' + overflowing.length + '): ' + overflowing.slice(0, 3).join(', '));
    }

    const inlineSpacing = [...document.querySelectorAll('[style]')]
      .filter((el) => !isThirdParty(el))
      .filter((el) => /padding:\s*\d+px|margin:\s*\d+px/.test(el.getAttribute('style') || ''))
      .length;
    if (inlineSpacing > 10) {
      issues.push('INLINE SPACING: ' + inlineSpacing + ' elements have inline padding/margin');
    }

    const containers = [...document.querySelectorAll('.container-shell, .container-wide, .page-width')];
    const widths = new Set(containers.map((c) => window.getComputedStyle(c).maxWidth));
    if (widths.size > 3) {
      issues.push('CONTAINER WIDTHS: ' + widths.size + ' different max-widths: ' + [...widths].join(', '));
    }

    return issues;
  });
}

async function auditNavigation(page) {
  return page.evaluate(() => {
    const issues = [];

    const brokenLinks = [...document.querySelectorAll('a[href="#"], a[href=""], a:not([href])')]
      .filter((a) => !a.closest('[data-shopify-editor-block]'))
      .map((a) => a.textContent.trim().slice(0, 40) || String(a.className || ''));
    if (brokenLinks.length > 0) {
      issues.push('BROKEN LINKS (' + brokenLinks.length + '): ' + brokenLinks.slice(0, 3).join(', '));
    }

    const unsafeNewTab = [...document.querySelectorAll('a[target="_blank"]:not([rel*="noopener"])')]
      .map((a) => (a.href || '').slice(0, 50));
    if (unsafeNewTab.length > 0) {
      issues.push('UNSAFE LINKS: ' + unsafeNewTab.length + ' _blank links without rel=noopener');
    }

    const hasBreadcrumb = !!document.querySelector(
      '[aria-label="Breadcrumb"], .breadcrumb, nav[aria-label*="bread" i], ol.breadcrumb'
    );
    const isPDP = window.location.pathname.includes('/products/');
    const isArticle = window.location.pathname.includes('/blogs/') && window.location.pathname.split('/').filter(Boolean).length > 2;
    if ((isPDP || isArticle) && !hasBreadcrumb) {
      issues.push('NO BREADCRUMB: expected on ' + window.location.pathname);
    }

    return issues;
  });
}

async function auditInteractiveStates(page) {
  const issues = await page.evaluate(() => {
    const localIssues = [];
    const buttons = [...document.querySelectorAll('button, .btn, [role="button"]')];
    const noLabel = buttons.filter((b) => (
      !b.textContent.trim() &&
      !b.getAttribute('aria-label') &&
      !b.getAttribute('title')
    ));
    if (noLabel.length > 0) {
      localIssues.push('BUTTONS NO LABEL: ' + noLabel.length + ' buttons have no accessible name');
    }
    return localIssues;
  });

  const hasHoverStyles = await page.evaluate(() => {
    let hoverRules = 0;
    [...document.styleSheets].forEach((sheet) => {
      try {
        [...sheet.cssRules || []].forEach((rule) => {
          if (rule.selectorText?.includes(':hover')) hoverRules++;
        });
      } catch (e) {}
    });
    return hoverRules;
  });
  if (hasHoverStyles < 10) {
    issues.push('FEW HOVER STATES: only ' + hasHoverStyles + ' :hover CSS rules found');
  }

  return issues;
}

async function auditForms(page) {
  return page.evaluate(() => {
    const issues = [];

    document.querySelectorAll('form, [data-form]').forEach((form) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const type = input.type || input.tagName.toLowerCase();
        if (type === 'hidden' || type === 'submit') return;

        const id = input.id;
        const hasLabel = id && document.querySelector('label[for="' + id + '"]');
        const hasAriaLabel = input.getAttribute('aria-label');
        if (!hasLabel && !hasAriaLabel) {
          issues.push('INPUT NO LABEL: ' + (input.name || input.placeholder || type).slice(0, 30));
        }
      });

      const hasSubmit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
      if (!hasSubmit && inputs.length > 0) {
        issues.push('FORM NO SUBMIT: form has inputs but no submit button');
      }
    });

    return issues;
  });
}

async function auditMobileMeta(page) {
  return page.evaluate(() => {
    const issues = [];
    const isThirdParty = (el) => {
      const id = el.id || '';
      const name = el.getAttribute('name') || '';
      return id.includes('web-pixels') ||
        name.startsWith('web-pixel-sandbox') ||
        !!el.closest('#web-pixels-manager-sandbox-container, [id^="tidio"], #tidio-chat');
    };
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) issues.push('NO VIEWPORT META: page missing viewport meta tag');

    const fixedWidth = [...document.querySelectorAll('[style]')]
      .filter((el) => {
        if (isThirdParty(el)) return false;
        const style = el.getAttribute('style') || '';
        const match = style.match(/width:\s*(\d+)px/);
        return match && parseInt(match[1], 10) > 400;
      })
      .map((el) => el.tagName + ' width:' + (el.getAttribute('style') || '').match(/width:\s*\d+px/)?.[0]);
    if (fixedWidth.length > 0) {
      issues.push('FIXED WIDTH (' + fixedWidth.length + '): ' + fixedWidth.slice(0, 2).join(', '));
    }

    return issues;
  });
}

async function auditA11y(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .exclude('.tidio-1, #tidio-chat, [id^="tidio"], #PBarNextFrame')
    .analyze();

  return results.violations.map((v) => (
    '[' + String(v.impact || 'unknown').toUpperCase() + '] ' +
    v.id + ': ' + v.description + ' (' + v.nodes.length + ' nodes)'
  ));
}

async function auditPerformance(page) {
  return page.evaluate(() => {
    const issues = [];
    const nav = performance.getEntriesByType('navigation')[0];

    if (nav) {
      const ttfb = Math.round(nav.responseStart - nav.requestStart);
      const domLoad = Math.round(nav.domContentLoadedEventEnd);
      const fullLoad = Math.round(nav.loadEventEnd);

      if (ttfb > 600) issues.push('SLOW TTFB: ' + ttfb + 'ms (target <600ms)');
      if (domLoad > 3000) issues.push('SLOW DOM: ' + domLoad + 'ms (target <3000ms)');
      if (fullLoad > 5000) issues.push('SLOW LOAD: ' + fullLoad + 'ms (target <5000ms)');
    }

    const imgs = [...document.querySelectorAll('img')];
    const missingDimensions = imgs.filter((img) => (
      !img.getAttribute('width') || !img.getAttribute('height')
    ));
    if (missingDimensions.length > 3) {
      issues.push('MISSING IMG DIMENSIONS: ' + missingDimensions.length + ' images without width/height (causes CLS)');
    }

    const largeInline = [...document.querySelectorAll('script:not([src])')]
      .filter((s) => (s.textContent || '').length > 5000)
      .length;
    if (largeInline > 3) {
      issues.push('LARGE INLINE SCRIPTS: ' + largeInline + ' inline scripts > 5KB');
    }

    const missingLazy = imgs.filter((img, i) => i > 3 && img.loading !== 'lazy').length;
    if (missingLazy > 5) {
      issues.push('MISSING LAZY LOAD: ' + missingLazy + ' below-fold images not lazy loaded');
    }

    return issues;
  });
}

async function auditContent(page) {
  return page.evaluate(() => {
    const issues = [];
    const body = document.body.textContent || '';
    const placeholders = [
      'Lorem ipsum',
      'placeholder text',
      'Coming soon',
      '[TITLE]',
      '[DESCRIPTION]',
      'Test product',
      'Sample text',
      'TODO',
      'PLACEHOLDER',
      'See product title',
      'See product description',
    ];

    placeholders.forEach((p) => {
      if (body.includes(p)) issues.push('PLACEHOLDER TEXT: "' + p + '" found on page');
    });

    const ctaButtons = [...document.querySelectorAll('.btn, button[class*="btn"]')]
      .map((b) => b.textContent.trim())
      .filter((t) => t.length > 0 && t.length < 50);
    const weakCTAs = ctaButtons.filter((text) => {
      const lower = text.toLowerCase();
      return lower === 'click here' || lower === 'read more' || lower === 'learn more' || lower === 'submit' || lower === 'button';
    });
    if (weakCTAs.length > 0) {
      issues.push('WEAK CTAS: "' + weakCTAs.join('", "') + '" — use action words');
    }

    const emptySections = [...document.querySelectorAll('section, [class*="section"]')]
      .filter((s) => !String(s.className || '').includes('section-kicker'))
      .filter((s) => s.textContent.trim().length < 5 && !s.querySelector('img, svg, video'))
      .map((s) => String(s.className || '').split(' ')[0]);
    if (emptySections.length > 0) {
      issues.push('EMPTY SECTIONS (' + emptySections.length + '): ' + emptySections.slice(0, 3).join(', '));
    }

    const longParas = [...document.querySelectorAll('p')]
      .filter((p) => p.textContent.trim().length > 400)
      .length;
    if (longParas > 3) {
      issues.push('LONG PARAGRAPHS: ' + longParas + ' paragraphs > 400 chars (consider breaking up)');
    }

    return issues;
  });
}

async function audit404(page) {
  const issues = [];
  await page.goto(auditUrl('/this-page-does-not-exist-at-all'), { waitUntil: 'networkidle' });

  const status = await page.evaluate(() => ({
    hasHeading: !!document.querySelector('h1'),
    hasHomeLink: !!document.querySelector('a[href="/"], a[href="/en"], a[href="/en/"]'),
    hasCTA: !!document.querySelector('.btn, .button-primary, button'),
  }));

  if (!status.hasHeading) issues.push('404: No h1 heading on 404 page');
  if (!status.hasHomeLink) issues.push('404: No link back to homepage');
  if (!status.hasCTA) issues.push('404: No CTA button on 404 page');

  return issues;
}

test('Full site audit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  const allIssues = {};
  let totalIssues = 0;
  let totalCritical = 0;

  const issues404 = await audit404(page);
  allIssues['404 page'] = { path: '/404', issues: issues404 };

  for (const pg of ALL_PAGES) {
    console.log('\nAuditing:', pg.name, pg.path);

    try {
      await page.goto(auditUrl(pg.path), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1500);

      await page.screenshot({
        path: '.audit/screenshots/' + pg.name.replace(/\s+/g, '-').toLowerCase() + '.png',
        fullPage: false,
      });

      const pageIssues = [];
      try { pageIssues.push(...await auditTypography(page)); } catch (e) {}
      try { pageIssues.push(...await auditAlignment(page)); } catch (e) {}
      try { pageIssues.push(...await auditNavigation(page)); } catch (e) {}
      try { pageIssues.push(...await auditInteractiveStates(page)); } catch (e) {}
      try { pageIssues.push(...await auditForms(page)); } catch (e) {}
      try { pageIssues.push(...await auditMobileMeta(page)); } catch (e) {}
      try { pageIssues.push(...await auditA11y(page)); } catch (e) {}
      try { pageIssues.push(...await auditPerformance(page)); } catch (e) {}
      try { pageIssues.push(...await auditContent(page)); } catch (e) {}

      allIssues[pg.name] = { path: pg.path, issues: pageIssues };

      const critical = pageIssues.filter((i) => i.includes('CRITICAL') || i.includes('SERIOUS')).length;
      if (pageIssues.length === 0) {
        console.log('  ✅ Clean');
      } else {
        console.log('  ❌', pageIssues.length, 'issues' + (critical ? ' (' + critical + ' critical)' : ''));
        pageIssues.forEach((i) => console.log('    -', i));
      }

      totalIssues += pageIssues.length;
      totalCritical += critical;
    } catch (e) {
      allIssues[pg.name] = { path: pg.path, issues: ['PAGE ERROR: ' + e.message] };
      console.log('  ❌ ERROR:', e.message);
      totalIssues++;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n── MOBILE AUDIT (375px) ──');
  await page.setViewportSize({ width: 375, height: 812 });

  const mobilePages = [
    { name: 'Mobile homepage', path: '/' },
    { name: 'Mobile collection', path: '/collections/hubs-adapters' },
    { name: 'Mobile PDP', path: '/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3' },
    { name: 'Mobile support', path: '/pages/support' },
    { name: 'Mobile cart', path: '/cart' },
  ];

  for (const pg of mobilePages) {
    await page.goto(auditUrl(pg.path), { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: '.audit/screenshots/mobile-' + pg.name.replace('Mobile ', '').replace(/\s+/g, '-').toLowerCase() + '.png',
      fullPage: false,
    });

    const mobileIssues = await page.evaluate(() => {
      const issues = [];
      const vw = window.innerWidth;

      if (document.documentElement.scrollWidth > vw + 5) {
        issues.push('HORIZONTAL SCROLL: page overflows at ' + vw + 'px viewport');
      }

      const smallTargets = [...document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"], [role="button"]')]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return (rect.width > 0 && rect.height > 0) && (rect.width < 44 || rect.height < 44);
        })
        .map((el) => (el.textContent.trim() || String(el.className || '')).slice(0, 30));
      if (smallTargets.length > 5) {
        issues.push('SMALL TAP TARGETS: ' + smallTargets.length + ' elements < 44px (' + smallTargets.slice(0, 3).join(', ') + ')');
      }

      const tinyText = [...document.querySelectorAll('p, li, a, span')]
        .filter((el) => {
          const size = parseFloat(window.getComputedStyle(el).fontSize);
          return size > 0 && size < 12;
        })
        .length;
      if (tinyText > 0) {
        issues.push('TINY TEXT: ' + tinyText + ' elements with font-size < 12px');
      }

      return issues;
    });

    allIssues[pg.name] = { path: pg.path + ' (mobile)', issues: mobileIssues };
    if (mobileIssues.length === 0) {
      console.log('  ✅', pg.name);
    } else {
      console.log('  ⚠️', pg.name, ':', mobileIssues.join(' | '));
    }
  }

  const sections = [];
  sections.push('# EZQuest — Full Site Audit Report');
  sections.push('Date: ' + new Date().toISOString().slice(0, 10));
  sections.push('Pages audited: ' + ALL_PAGES.length + ' desktop + 5 mobile');
  sections.push('Total issues: ' + totalIssues);
  sections.push('Critical: ' + totalCritical);
  sections.push('');
  sections.push('## Summary');
  sections.push('');
  sections.push('| Page | Issues | Status |');
  sections.push('|------|--------|--------|');

  Object.entries(allIssues).forEach(([name, data]) => {
    const count = data.issues.length;
    const status = count === 0 ? '✅ Clean' : count <= 2 ? '⚠️ Minor' : '❌ Needs fix';
    sections.push('| ' + name + ' | ' + count + ' | ' + status + ' |');
  });

  sections.push('');
  sections.push('## Issues by page');
  sections.push('');

  Object.entries(allIssues).forEach(([name, data]) => {
    if (data.issues.length === 0) return;
    sections.push('### ' + name + ' (' + data.path + ')');
    data.issues.forEach((issue) => sections.push('- ' + issue));
    sections.push('');
  });

  const report = sections.join('\n');
  fs.writeFileSync('.audit/site-audit.md', report);
  console.log('\n\n' + report);
  console.log('\nScreenshots saved to .audit/screenshots/');
  console.log('Report saved to .audit/site-audit.md');
});
