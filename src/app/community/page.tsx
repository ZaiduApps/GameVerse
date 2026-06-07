import type { Metadata } from 'next';
import { cache } from 'react';

import CommunityPageView, { type CommunityPageInitialData } from './CommunityPageView';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityFeed, getCommunityTopics } from '@/lib/community-api';

const COMMUNITY_JSONLD_LIMIT = 12;
const COMMUNITY_PAGE_DESCRIPTION =
  '浏览 APKScc 社区最新帖子、热门话题、安卓游戏讨论、攻略分享、资源反馈、版本体验和玩家互动动态，查看玩家围绕游戏下载、安装更新、账号登录、机型兼容、网络稳定性和资源可用性的真实反馈，持续发现值得关注的游戏内容、实用经验和社区交流记录。';

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

const getCommunityPageData = cache(async (): Promise<{
  config: Awaited<ReturnType<typeof getPublicSiteConfig>>;
  initialData: CommunityPageInitialData;
}> => {
  const [config, latestFeed, hotFeed, topics] = await Promise.all([
    getPublicSiteConfig(300),
    getCommunityFeed('latest', { page: 1, pageSize: COMMUNITY_JSONLD_LIMIT }),
    getCommunityFeed('hot', { page: 1, pageSize: COMMUNITY_JSONLD_LIMIT }),
    getCommunityTopics({ page: 1, pageSize: COMMUNITY_JSONLD_LIMIT, sort: 'hot' }),
  ]);

  return {
    config,
    initialData: {
      latestFeed,
      hotFeed,
      topics: topics.list || [],
    },
  };
});

export async function generateMetadata(): Promise<Metadata> {
  const { config } = await getCommunityPageData();
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 社区 - 安卓游戏讨论、攻略分享与资源反馈动态`;
  const description = COMMUNITY_PAGE_DESCRIPTION;
  const shareImage = String(config?.basic?.share_image || '').trim();

  return {
    title: { absolute: title },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
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
      title,
      description,
      url: absoluteUrl('/community'),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: `${siteName} 社区` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function CommunityPage() {
  const { config, initialData } = await getCommunityPageData();

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const postList = Array.isArray(initialData.latestFeed?.list) ? initialData.latestFeed.list : [];
  const topicList = Array.isArray(initialData.topics) ? initialData.topics : [];

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 社区`,
    description: COMMUNITY_PAGE_DESCRIPTION,
    inLanguage: 'zh-CN',
    url: absoluteUrl('/community'),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  const postItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 社区最新帖子`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: postList.length,
    itemListElement: postList.map((post, index) => {
      const postTitle = clamp(String(post.title || post.summary || '社区帖子').trim(), 80);
      const postSummary = clamp(String(post.summary || post.content || '').trim(), 180);
      const postUrl = absoluteUrl(`/community/post/${encodeURIComponent(post.id)}`);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: postUrl,
        name: postTitle,
        description: postSummary || undefined,
        image: post.imageUrl || undefined,
      };
    }),
  };

  const topicItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 社区热门话题`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: topicList.length,
    itemListElement: topicList.map((topic, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/community/topic/${encodeURIComponent(String(topic.slug || topic._id || '').trim())}`),
      name: String(topic.name || '社区话题').trim(),
      description: clamp(String(topic.description || '').trim(), 140) || undefined,
      image: String(topic.icon || topic.cover || '').trim() || undefined,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      {postList.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postItemListJsonLd) }}
        />
      ) : null}
      {topicList.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(topicItemListJsonLd) }}
        />
      ) : null}
      <CommunityPageView initialData={initialData} />
    </>
  );
}
