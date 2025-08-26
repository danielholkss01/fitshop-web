import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      // Add real image hosts here as you integrate feeds:
      // { protocol: 'https', hostname: 'images.examplebrand.com' },
      // { protocol: 'https', hostname: 'cdn.rakuten.com' },
    ],
  },
  eslint: {
    // Keep this as false so ESLint errors fail builds (best practice).
    // If you need to bypass ESLint errors temporarily, set to true.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
