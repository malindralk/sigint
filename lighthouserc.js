// MALINDRA PHASE 4
// lighthouserc.js
// Lighthouse CI — enforces ≥96 scores for Phase 4 production.

module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      url: [
        'http://localhost/blog/',
        'http://localhost/archive/',
        'http://localhost/archive/curated/',
        'http://localhost/compliance/',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance':    ['error', { minScore: 0.96 }],
        'categories:accessibility':  ['error', { minScore: 0.96 }],
        'categories:seo':            ['error', { minScore: 0.96 }],
        'categories:best-practices': ['error', { minScore: 0.96 }],
        'unused-css-rules':          ['warn', { maxLength: 5 }],
        // Core Web Vitals (Phase 4 tightened)
        'first-contentful-paint':    ['warn', { maxNumericValue: 1500 }],
        'largest-contentful-paint':  ['warn', { maxNumericValue: 2200 }],
        'cumulative-layout-shift':   ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time':       ['warn', { maxNumericValue: 250 }],
        // Static export expectations
        'is-on-https':               'off',
        'uses-http2':                'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
