const fs = require('fs');
const css = fs.readFileSync('src/styles/theme.css', 'utf8');
const hero = fs.readFileSync('sections/hero-home.liquid', 'utf8');
const cardProd = fs.readFileSync('snippets/card-product.liquid', 'utf8');
const cardSupp = fs.readFileSync('snippets/card-support.liquid', 'utf8');
const cardRes  = fs.readFileSync('snippets/support-resource-card.liquid', 'utf8');
const accordion = fs.readFileSync('snippets/accordion-item.liquid', 'utf8');
const specRow   = fs.readFileSync('snippets/spec-row.liquid', 'utf8');

const checks = [
  // CSS token system
  ['--tracking-display token',       css.includes('--tracking-display: -0.065em')],
  ['--tracking-heading token',       css.includes('--tracking-heading: -0.045em')],
  ['--tracking-kicker token',        css.includes('--tracking-kicker: 0.22em')],
  ['--leading-heading token',        css.includes('--leading-heading: 1.02')],
  ['--leading-title token',          css.includes('--leading-title: 1.2')],

  // section utilities
  ['section-heading bold',           css.includes('font-bold text-slate-950') && css.includes('section-heading')],
  ['section-heading letter-spacing', css.includes('letter-spacing: var(--tracking-heading)')],
  ['section-heading line-height',    css.includes('line-height: var(--leading-heading)')],
  ['section-copy 1.0625rem',         css.includes('text-[1.0625rem]')],
  ['section-copy line-height 1.72',  css.includes('line-height: 1.72')],
  ['section-kicker uses token',      css.includes('letter-spacing: var(--tracking-kicker)')],
  ['section-shell py-12 lg:py-20',   css.includes('@apply py-12 lg:py-20')],

  // new type classes
  ['.display-heading exists',        css.includes('.display-heading')],
  ['.card-title exists',             css.includes('.card-title')],
  ['.panel-heading exists',          css.includes('.panel-heading')],
  ['.hero-metric-value exists',      css.includes('.hero-metric-value')],
  ['.hero-metric-label exists',      css.includes('.hero-metric-label')],

  // spacing & layout
  ['editorial-grid gap-5',           css.includes('grid gap-5 md:grid-cols-2 xl:grid-cols-3')],
  ['product-grid gap-5',             css.includes('grid gap-5 md:grid-cols-2 xl:grid-cols-4')],
  ['faq-list space-y-3',             css.includes('@apply space-y-3')],
  ['product-buybox-summary tighter', css.includes('text-[0.9375rem]')],

  // richtext heading hierarchy
  ['richtext h2 bold',               css.match(/richtext-content h2[^}]+font-bold/)],
  ['richtext h3 bold',               css.match(/richtext-content h3[^}]+font-bold/)],
  ['richtext h4 semibold',           css.match(/richtext-content h4[^}]+font-semibold/)],
  ['richtext h2 size diff from h3',  css.includes('text-[1.5rem] font-bold text-slate-950 sm:text-[1.75rem]')],

  // accordion type classes
  ['.accordion-trigger-text exists', css.includes('.accordion-trigger-text')],
  ['[data-accordion-content] rule',  css.includes('[data-accordion-content]')],
  ['accordion content 1.65 lh',      css.includes('line-height: 1.65')],

  // spec type classes
  ['.spec-label exists',             css.includes('.spec-label')],
  ['.spec-value exists',             css.includes('.spec-value')],

  // sticky top calc
  ['content-page-sidebar top calc',  css.includes('content-page-sidebar') && css.includes('top: calc(var(--header-height) + 0.75rem)')],
  ['faq-intro top calc',             css.includes('faq-intro') && css.includes('top: calc(var(--header-height) + 0.75rem)')],
  ['no more lg:top-24',              !css.includes('lg:top-24')],

  // Liquid files
  ['hero H1 uses display-heading',   hero.includes('display-heading')],
  ['hero metric uses .hero-metric-value', hero.includes('hero-metric-value')],
  ['hero panel uses panel-heading',  hero.includes('panel-heading')],
  ['product card uses card-title',   cardProd.includes('card-title')],
  ['support card uses card-title',   cardSupp.includes('card-title')],
  ['resource card uses card-title',  cardRes.includes('card-title')],
  ['accordion uses .accordion-trigger-text', accordion.includes('accordion-trigger-text')],
  ['accordion content uses data attr', accordion.includes('data-accordion-content')],
  ['spec-row uses .spec-label',      specRow.includes('spec-label')],
  ['spec-row uses .spec-value',      specRow.includes('spec-value')],
];

let pass = 0, fail = 0;
checks.forEach(([name, result]) => {
  console.log((result ? '\u2705' : '\u274c') + ' ' + name);
  result ? pass++ : fail++;
});
console.log('\nResult: ' + pass + '/' + checks.length + ' passed' + (fail > 0 ? '  \u274c ' + fail + ' failed' : '  \u2728 all clear'));
