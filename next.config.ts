import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/news/search',
        destination: 'https://api.us.apks.cc/news/search',
      },
      {
        source: '/api/:path*',
        destination: 'https://api.us.apks.cc/:path*',
      },
    ];
  },
  images: {
    // 使用通配符允许所有 HTTPS 和 HTTP 的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
