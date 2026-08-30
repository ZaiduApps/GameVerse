import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 公开游戏、社区、排行榜、专题和用户页全部允许抓取；仅阻止非公开功能入口。
      disallow: ['/api/', '/profile', '/messages', '/submit-resource'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
