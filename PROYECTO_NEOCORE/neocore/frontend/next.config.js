/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'web',
      },
    ],
  },
  // Rewrites are handled by vercel.json on Vercel (api/* → Python function).
  // For local dev, set NEXT_PUBLIC_API_URL to the local Django server.
  // Removing rewrites() here prevents Next.js 16 Turbopack from generating
  // proxy.ts, which conflicts with next-intl's middleware.ts.
};

// Wrap with next-intl plugin
let config = nextConfig;
try {
  const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');
  config = withNextIntl(nextConfig);
} catch (e) {
  console.log('next-intl plugin not loaded, using basic config');
}

module.exports = config;
