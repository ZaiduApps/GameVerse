import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const normalizedId = String(id || '').trim();
  const communityPath = normalizedId
    ? `/community/post/${encodeURIComponent(normalizedId)}`
    : '/community';

  return {
    title: { absolute: '社区帖子' },
    description: '旧资讯详情链接已迁移到社区帖子。',
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
      canonical: communityPath,
      languages: {
        'zh-CN': communityPath,
        'x-default': communityPath,
      },
    },
    openGraph: {
      title: '社区帖子',
      description: '旧资讯详情链接已迁移到社区帖子。',
      url: absoluteUrl(communityPath),
      type: 'article',
      locale: 'zh_CN',
    },
  };
}

export default async function LegacyNewsDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const normalizedId = String(id || '').trim();
  if (!normalizedId) {
    notFound();
  }
  permanentRedirect(`/community/post/${encodeURIComponent(normalizedId)}`);
}
