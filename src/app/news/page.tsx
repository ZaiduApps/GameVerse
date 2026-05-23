import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: '社区动态' },
    description: '游戏资讯内容已统一迁移到社区帖子页面。',
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: '/community',
      languages: {
        'zh-CN': '/community',
        'x-default': '/community',
      },
    },
    openGraph: {
      title: '社区动态',
      description: '游戏资讯内容已统一迁移到社区帖子页面。',
      url: absoluteUrl('/community'),
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

export default function LegacyNewsIndexRedirectPage() {
  permanentRedirect('/community');
}
