import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@roamera/ui', '@roamera/sdk', '@roamera/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
