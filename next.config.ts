import type { NextConfig } from 'next';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const isDevRuntime = process.env.NODE_ENV !== 'production';
const disableWebpackCache = process.env.DISABLE_WEBPACK_CACHE === '1';
const backendBaseUrl = (
  process.env.API_BASE_URL ||
  (appEnv === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://localhost:9527')
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  /* config options here */
  // Separate dev and prod artifacts to avoid stale chunk manifest conflicts.
  distDir: isDevRuntime ? '.next-dev' : '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/news',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/news/:id',
        destination: '/community/post/:id',
        permanent: true,
      },
      {
        source: '/news/:path*',
        destination: '/community',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/news/search',
        destination: `${backendBaseUrl}/news/search`,
      },
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
        ],
      },
    ];
  },
  images: {
    // 对第三方图源统一绕过 Next 图片优化器，避免开发态与生产环境都被上游超时拖垮。
    unoptimized: true,
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
  webpack: (config, { dev }) => {
    if (dev && disableWebpackCache) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
