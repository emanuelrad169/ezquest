const fs = require('fs');
const css  = fs.readFileSync('src/styles/theme.css', 'utf8');
const icon = fs.readFileSync('snippets/icon.liquid', 'utf8');
const media = fs.readFileSync('snippets/media.liquid', 'utf8');
const acc   = fs.readFileSync('snippets/accordion-item.liquid', 'utf8');
const accJs = fs.readFileSync('assets/component-accordion.js', 'utf8');
const price = fs.readFileSync('snippets/price.liquid', 'utf8');
const compare = fs.readFileSync('snippets/compare-cell.liquid', 'utf8');
const drawer  = fs.readFileSync('snippets/mobile-nav-drawer.liquid', 'utf8');
const megaMenu = fs.readFileSync('snippets/mega-menu-panel.liquid', 'utf8');
const siteHeader = fs.readFileSync('snippets/site-header.liquid', 'utf8');

const checks = [
  // Icons
  ['icon.liquid has real plus SVG',      icon.includes('<path d="M7 1v12M1 7h12"')],
  ['icon.liquid has chevron-right SVG',  icon.includes('<path d="M5 2l5 5-5 5"')],
  ['icon.liquid has close SVG',          icon.includes('<path d="M1 1l12 12M13 1L1 13"')],
  ['icon.liquid has check SVG',          icon.includes('<path d="M1.75 7.5l3.5 3.5 7-7"')],
  ['icon.liquid no letter stub',         !icon.includes('slice: 0, 1 | upcase')],

  // Media
  ['media.liquid no hardcoded radius',   !media.includes('rounded-[1.9rem]')],
  ['media.liquid no hardcoded border',   !media.includes('border border-slate-200/80')],
  ['media.liquid no hardcoded shadow',   !media.includes('shadow-[0_16px_50px')],
  ['media.liquid default object-contain', media.includes("object_fit | default: 'object-contain'")],
  ['media.liquid wrapper is clean',      media.includes('<div class="overflow-hidden {{ wrapper_class }}">')],

  // Accordion
  ['accordion has accordion-body wrapper', acc.includes('accordion-body')],
  ['accordion has accordion-body-inner',   acc.includes('accordion-body-inner')],
  ['accordion has aria-hidden init',       acc.includes('aria-hidden="true"')],
  ['accordion uses accordion-icon-btn',    acc.includes('accordion-icon-btn')],
  ['accordion no hidden attr',             !acc.includes('hidden data-accordion-content')],
  ['accordion JS uses classList toggle',   accJs.includes('content.classList.toggle')],
  ['accordion JS sets aria-hidden',        accJs.includes("content.setAttribute('aria-hidden'")],
  ['accordion JS no content.hidden',       !accJs.includes('content.hidden = ')],

  // CSS accordion animation
  ['accordion-body grid CSS',            css.includes('grid-template-rows: 0fr')],
  ['accordion-body.is-open',             css.includes('grid-template-rows: 1fr')],
  ['accordion-icon-btn class exists',    css.includes('.accordion-icon-btn')],
  ['prefers-reduced-motion covers accordion', css.includes('.accordion-body') && css.includes('grid-template-rows: 1fr !important')],

  // Mega link arrow
  ['.mega-link-arrow CSS class',         css.includes('.mega-link-arrow')],
  ['mega-link-arrow hover state',        css.includes('.mega-link-card:hover .mega-link-arrow')],
  ['mega-menu-panel uses mega-link-arrow', megaMenu.includes('mega-link-arrow')],
  ['site-header uses mega-link-arrow',   siteHeader.includes('mega-link-arrow')],
  ['no old text arrows in mega-menu',    !megaMenu.includes('"text-slate-300">\u2192')],
  ['no old text arrows in site-header',  !siteHeader.includes('"text-slate-300">\u2192')],

  // Price
  ['price has price-block class',        price.includes('price-block')],
  ['price has price-amount class',       price.includes('price-amount')],
  ['CSS price-amount in card context',   css.includes('product-card-tile .price-block .price-amount')],

  // Compare card
  ['compare uses card-title class',      compare.includes('card-title mt-3')],
  ['compare uses object-contain',        compare.includes('object-contain')],
  ['compare no bg-slate-50 on image',    !compare.includes('bg-slate-50 object-cover')],

  // Drawer
  ['drawer close uses icon',             drawer.includes("render 'icon', name: 'close'")],
  ['drawer no Close text button',        !drawer.includes('>Close<')],
  ['drawer translateX tightened',        css.includes('translateX(0.75rem)')],
  ['drawer no 1.5rem translate',         !css.includes('translateX(1.5rem)')],

  // Content resilience
  ['line-clamp on product card title',   css.includes('product-card-tile .card-title')],
  ['line-clamp on compare card title',   css.includes('compare-card .card-title')],
  ['line-clamp on value line',           css.includes('product-card-value-line')],

  // Media empty + reduced-motion
  ['media-empty-state class exists',     css.includes('.media-empty-state')],
];

let pass = 0, fail = 0;
checks.forEach(([name, result]) => {
  console.log((result ? '\u2705' : '\u274c') + ' ' + name);
  result ? pass++ : fail++;
});
console.log('\nResult: ' + pass + '/' + checks.length + ' passed' + (fail > 0 ? '  \u274c ' + fail + ' failed' : '  \u2728 all clear'));
