
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
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
        hostname: 'cdn.z.wiki',
      }
    ],
  },
};

export default nextConfig;
