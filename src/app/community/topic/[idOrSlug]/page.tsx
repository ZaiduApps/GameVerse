import type { Metadata } from 'next';
import CommunityTopicBoardView from './CommunityTopicBoardView';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityTopicDetail } from '@/lib/community-api';

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idOrSlug: string }>;
}): Promise<Metadata> {
  const { idOrSlug } = await params;
  const safeIdOrSlug = decodeURIComponent(String(idOrSlug || '').trim());
  const [config, topic] = await Promise.all([getPublicSiteConfig(300), getCommunityTopicDetail(safeIdOrSlug)]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();

  if (!topic?._id) {
    return {
      title: '社区话题不存在',
      description: '未找到对应社区话题。',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/community/topic/${encodeURIComponent(String(topic.slug || topic._id).trim())}`;
  const title = clamp(`${topic.name} 社区话题 | ${siteName}`, 80);
  const description = clamp(
    String(topic.description || topic.announcement || `${topic.name} 最新帖子、攻略讨论与玩家动态。`).trim(),
    160,
  );
  const image = String(topic.cover || topic.icon || config?.basic?.share_image || '').trim();
  const hasContent = Number(topic.post_count || 0) > 0 || Number(topic.followers_count || 0) > 0;

  return {
    title: { absolute: title },
    description,
    robots: {
      index: hasContent,
      follow: hasContent,
      googleBot: {
        index: hasContent,
        follow: hasContent,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        'zh-CN': canonicalPath,
        'x-default': canonicalPath,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: image ? [image] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function CommunityTopicPage({
  params,
}: {
  params: Promise<{ idOrSlug: string }>;
}) {
  const { idOrSlug } = await params;
  return <CommunityTopicBoardView idOrSlug={idOrSlug} />;
}
