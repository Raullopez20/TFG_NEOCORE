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
  async rewrites() {
    // En Vercel, el rewrite de /api/* lo maneja vercel.json apuntando a
    // la funcion Python serverless en /api/index.py. En local/docker,
    // usamos BACKEND_API_URL para proxyear a un backend Django normal.
    if (process.env.VERCEL === '1') {
      return [];
    }

    const apiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return [];
    }

    const normalizedApiUrl = apiUrl.replace(/\/$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${normalizedApiUrl}/api/:path*`,
      },
    ];
  },
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
