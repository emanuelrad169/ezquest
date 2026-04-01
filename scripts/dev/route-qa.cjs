#!/usr/bin/env node

const { execFileSync } = require('child_process');

const routes = [
  '/',
  '/collections/hubs-adapters',
  '/products/usb-c-multimedia-hub',
  '/products/usb-c-travel-hub',
  '/products/usb-c-pro-dock',
  '/pages/compare',
  '/pages/downloads',
  '/pages/manuals',
  '/pages/compatibility',
  '/pages/faq',
  '/pages/support',
  '/cart'
  ,
  '/search'
];

const baseUrl = process.env.ROUTE_QA_BASE || 'http://127.0.0.1:9292';
let hasFailure = false;

routes.forEach((route) => {
  const url = new URL(route, baseUrl).toString();

  try {
    const status = execFileSync(
      '/usr/bin/curl',
      ['-k', '-I', '-s', '-o', '/dev/null', '-w', '%{http_code}', url],
      { encoding: 'utf8' }
    ).trim();
    const ok = Number(status) >= 200 && Number(status) < 400;
    console.log(`${ok ? 'OK' : 'FAIL'} ${status} ${route}`);
    if (!ok) hasFailure = true;
  } catch (error) {
    hasFailure = true;
    console.log(`FAIL ERR ${route} ${error.message}`);
  }
});

process.exit(hasFailure ? 1 : 0);
