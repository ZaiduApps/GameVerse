
import type {NextConfig} from 'next';

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
        source: '/api/:path*',
        destination: 'https://api.us.apks.cc/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'uu.fp.ps.netease.com',
      },
      {
        protocol: 'https',
        hostname: 'uum.fp.ps.netease.com',
      },
       {
        protocol: 'https',
        hostname: 'cdn.apks.cc',
      },
       {
        protocol: 'https',
        hostname: '123pan.cn',
      },
      {
        protocol: 'https',
        hostname: 'cdn.z.wiki',
      }
    ],
  },
};

export default nextConfig;
