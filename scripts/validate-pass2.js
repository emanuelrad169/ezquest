const fs = require('fs');
const css = fs.readFileSync('src/styles/theme.css', 'utf8');
const js  = fs.readFileSync('assets/theme.js', 'utf8');
const liq = fs.readFileSync('sections/main-product.liquid', 'utf8');

const checks = [
  ['--duration-enter: 280ms',        css.includes('--duration-enter: 280ms')],
  ['base transition: --duration-fast', css.includes('transform var(--duration-fast) var(--ease-standard)')],
  ['motion-fade-up 0.5rem',          css.includes('translateY(0.5rem)')],
  ['js-reveal 0.5625rem',            css.includes('translateY(0.5625rem)')],
  ['js-reveal-stagger 0.375rem',     css.includes('translateY(0.375rem)')],
  ['button-primary no translateY',   !css.match(/button-primary:hover[^}]+transform: translateY/)],
  ['button-primary:active scale',    css.includes('scale(0.97)')],
  ['button-secondary:active scale',  css.includes('scale(0.98)')],
  ['feature-card no translateY',     !css.match(/feature-card:focus-visible[^}]+translateY\(-2px\)/)],
  ['editorial-card no translateY',   !css.match(/editorial-card:focus-within[^}]+translateY\(-2px\)/)],
  ['product-thumb-card no translateY', !css.match(/product-thumb-card:focus-within[^}]+translateY\(-2px\)/)],
  ['accordion SVG transition',       css.includes('[data-accordion-trigger] svg')],
  ['accordion-shell transition',     css.includes('border-color var(--duration-fast) var(--ease-standard),\n      box-shadow var(--duration-fast) var(--ease-standard)')],
  ['product-card-image will-change', css.includes('will-change: transform')],
  ['CTA brand glow',                 css.includes('rgba(var(--color-brand), 0.28)')],
  ['highlight-shell no gradient',    !css.match(/product-highlight-shell[^}]+linear-gradient/)],
  ['confidence-item neutral bg',     !css.includes('rgba(var(--color-brand-soft), 0.26)')],
  ['assurance-grid border-t',        css.includes('border-t pt-6')],
  ['buybox-sticky CSS class',        css.includes('buybox-sticky')],
  ['hero y=10',                      js.includes('gsap.set(textEls, { opacity: 0, y: 10 })')],
  ['hero media scale 0.98',          js.includes('scale: 0.98')],
  ['hero heading 0.5/0.12',          js.includes('duration: 0.5 }, 0.12)')],
  ['scroll threshold 0.07',          js.includes('threshold: 0.07')],
  ['scroll rootMargin -32px',        js.includes('-32px')],
  ['assurance-grid post-endform',    liq.includes('endform %}\n\n          <div class="product-assurance-grid">')],
  ['buybox-sticky in liquid',        liq.includes('buybox-sticky')],
  ['sticky top-6 removed',           !liq.includes('lg:sticky lg:top-6')],
];

let pass = 0, fail = 0;
checks.forEach(([name, result]) => {
  console.log((result ? '\u2705' : '\u274c') + ' ' + name);
  result ? pass++ : fail++;
});
console.log('\nResult: ' + pass + '/' + checks.length + ' passed');
