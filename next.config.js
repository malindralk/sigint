// MALINDRA PHASE 5
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  compress: true,
  poweredByHeader: false,

  images: {
    unoptimized: true,
  },

  // Turbopack: suppress warnings for satori / @resvg in build scripts
  turbopack: {},

  experimental: {},

  // Bundle analyzer support: ANALYZE=true npm run build
  ...(process.env.ANALYZE === 'true'
    ? {
        webpack(config) {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({ analyzerMode: 'static', reportFilename: '../bundle-report.html', openAnalyzer: false })
          );
          return config;
        },
      }
    : {}),
};

// Security header values for CDN / nginx configuration
// (static export cannot apply these at runtime — document for operators)
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
];

// Cache-control for static assets (for CDN / nginx operators)
// JS/CSS: immutable 1 year; HTML: no-store for always-fresh; fonts: 1 year
const CACHE_HEADERS = {
  staticAssets: 'public, max-age=31536000, immutable',
  pages: 'no-cache, no-store, must-revalidate',
  fonts: 'public, max-age=31536000, immutable',
  api: 'no-store',
};

module.exports = nextConfig;
