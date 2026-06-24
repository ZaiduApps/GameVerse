import type { Metadata } from 'next';
import { cache } from 'react';

import CommunityTopicBoardView from './CommunityTopicBoardView';
import { absoluteUrl, buildSeoDescription, sanitizeSeoText } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityFeed, getCommunityTopicDetail, type CommunityFeedResult } from '@/lib/community-api';

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

const EMPTY_FEED: CommunityFeedResult = {
  list: [],
  total: 0,
  page: 1,
  pageSize: 10,
  hasMore: false,
};

const getTopicPageData = cache(async (idOrSlug: string) => {
  const safeIdOrSlug = decodeURIComponent(String(idOrSlug || '').trim());
  const configPromise = getPublicSiteConfig(300);
  const topic = await getCommunityTopicDetail(safeIdOrSlug);

  if (!topic?._id) {
    return {
      config: await configPromise,
      topic: null,
      latestFeed: EMPTY_FEED,
      hotFeed: EMPTY_FEED,
    };
  }

  const [config, latestFeed, hotFeed] = await Promise.all([
    configPromise,
    getCommunityFeed('latest', { topicId: String(topic._id || '').trim(), page: 1, pageSize: 10 }),
    getCommunityFeed('hot', { topicId: String(topic._id || '').trim(), page: 1, pageSize: 10 }),
  ]);

  return {
    config,
    topic,
    latestFeed,
    hotFeed,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ idOrSlug: string }>;
}): Promise<Metadata> {
  const { idOrSlug } = await params;
  const { config, topic, latestFeed, hotFeed } = await getTopicPageData(idOrSlug);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();

  if (!topic?._id) {
    return {
      title: '社区话题不存在',
      description: '未找到对应社区话题。',
      robots: { index: false, follow: false },
    };
  }

  const canonicalPath = `/community/topic/${encodeURIComponent(String(topic.slug || topic._id).trim())}`;
  const topicName = sanitizeSeoText(topic.name || '社区话题') || '社区话题';
  const title = clamp(`${topicName} 社区话题 | ${siteName}`, 80);
  const latestPostTitle = sanitizeSeoText(latestFeed.list?.[0]?.title || latestFeed.list?.[0]?.summary || '');
  const hotPostTitle = sanitizeSeoText(hotFeed.list?.[0]?.title || hotFeed.list?.[0]?.summary || '');
  const description = buildSeoDescription(
    sanitizeSeoText(topic.description || topic.announcement) || `${topicName} 最新帖子、攻略讨论与玩家动态`,
    [
      `${siteName} 社区话题页汇总 ${topicName} 的最新发帖、热门讨论、攻略经验、资源反馈和评论互动`,
      Number(topic.post_count || 0) > 0 ? `当前收录 ${Number(topic.post_count || 0)} 条相关帖子` : '',
      Number(topic.followers_count || 0) > 0 ? `${Number(topic.followers_count || 0)} 位用户关注该话题` : '',
      latestPostTitle ? `最新动态：${latestPostTitle}` : '',
      hotPostTitle && hotPostTitle !== latestPostTitle ? `热门讨论：${hotPostTitle}` : '',
      '适合继续查看游戏下载、安装更新、活动奖励、机型兼容、网络稳定性和玩家回复中的实用线索',
    ],
    { max: 160 },
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
  const { topic, latestFeed, hotFeed } = await getTopicPageData(idOrSlug);
  return (
    <CommunityTopicBoardView
      idOrSlug={idOrSlug}
      initialData={
        topic?._id
          ? {
              topic,
              latestFeed,
              hotFeed,
            }
          : null
      }
    />
  );
}
