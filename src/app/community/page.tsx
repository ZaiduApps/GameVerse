import type { Metadata } from 'next';

import CommunityPageView from './CommunityPageView';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityFeed, getCommunityTopics } from '@/lib/community-api';

const COMMUNITY_JSONLD_LIMIT = 12;

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 社区 - 热门话题与最新动态`;
  const description = '浏览 APKScc 社区最新帖子与热门话题，查看游戏讨论、攻略分享和玩家互动内容。';
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
      images: shareImage ? [shareImage] : [],
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
  const [config, latestFeed, topics] = await Promise.all([
    getPublicSiteConfig(300),
    getCommunityFeed('latest', { page: 1, pageSize: COMMUNITY_JSONLD_LIMIT }),
    getCommunityTopics({ page: 1, pageSize: COMMUNITY_JSONLD_LIMIT, sort: 'hot' }),
  ]);

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const postList = Array.isArray(latestFeed?.list) ? latestFeed.list : [];
  const topicList = Array.isArray(topics?.list) ? topics.list : [];

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 社区`,
    description: '玩家社区帖子与热门话题列表',
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
      <h1 className="sr-only">{siteName} 社区</h1>
      <CommunityPageView />
    </>
  );
}
