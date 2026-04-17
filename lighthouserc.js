module.exports = {
  ci: {
    collect: {
      url: [
        'https://ezquest-4.myshopify.com/',
        'https://ezquest-4.myshopify.com/collections/hubs-adapters',
        'https://ezquest-4.myshopify.com/products/4-port-usb-3-hub-adapter-with-usb-c-pd-3',
        'https://ezquest-4.myshopify.com/pages/support',
        'https://ezquest-4.myshopify.com/pages/faq',
      ],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        'categories:performance':    ['warn',  { minScore: 0.75 }],
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn',  { minScore: 0.85 }],
        'categories:seo':            ['error', { minScore: 0.90 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
