import type { Metadata } from 'next';

import CommunityTopicsPageView from './CommunityTopicsPageView';
import { getCommunityTopics, type CommunityTopicItem } from '@/lib/community-api';
import { absoluteUrl, clampSeoDescription } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

const TOPIC_PAGE_SIZE = 16;
const TOPICS_PAGE_DESCRIPTION =
  '浏览 APKScc 社区话题专题，查看热门话题、官方话题、最新话题、安卓游戏讨论专题、攻略交流专题和玩家反馈专题。';

type TopicSort = 'hot' | 'new';

type TopicPageSearchParams = {
  q?: string;
  sort?: string;
  page?: string;
  hotPage?: string;
  officialPage?: string;
  newPage?: string;
};

function clampPage(input?: string): number {
  return Math.max(1, Number(input || 1) || 1);
}

function normalizeSort(input?: string): TopicSort {
  return input === 'new' ? 'new' : 'hot';
}

function clampText(input?: string | null, max = 140): string {
  const text = clampSeoDescription(input || '', max);
  return text || '';
}

function topicHref(topic: CommunityTopicItem): string {
  const target = String(topic.slug || topic._id || '').trim();
  return target ? `/community/topic/${encodeURIComponent(target)}` : '/community/topics';
}

function topicImage(topic: CommunityTopicItem): string | undefined {
  const image = String(topic.icon || topic.app_info?.icon || topic.cover || '').trim();
  return image || undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<TopicPageSearchParams>;
}): Promise<Metadata> {
  const [config, params] = await Promise.all([getPublicSiteConfig(300), searchParams]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const keyword = String(params?.q || '').trim();
  const title = keyword
    ? `${siteName} 社区话题搜索 - ${keyword}`
    : `${siteName} 社区话题 - 热门专题与玩家讨论`;
  const description = keyword
    ? `搜索 ${keyword} 相关社区话题，查看安卓游戏讨论专题、攻略交流和玩家反馈。`
    : TOPICS_PAGE_DESCRIPTION;
  const shareImage = String(config?.basic?.share_image || '').trim();

  return {
    title: { absolute: title },
    description,
    robots: {
      index: !keyword,
      follow: true,
      googleBot: {
        index: !keyword,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: '/community/topics',
      languages: {
        'zh-CN': '/community/topics',
        'x-default': '/community/topics',
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/community/topics'),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: `${siteName} 社区话题` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function CommunityTopicsPage({
  searchParams,
}: {
  searchParams: Promise<TopicPageSearchParams>;
}) {
  const [config, params] = await Promise.all([getPublicSiteConfig(300), searchParams]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const q = String(params?.q || '').trim();
  const sort = normalizeSort(params?.sort);
  const page = clampPage(params?.page);
  const hotPage = clampPage(params?.hotPage);
  const officialPage = clampPage(params?.officialPage);
  const newPage = clampPage(params?.newPage);

  const [hotTopics, officialTopics, newTopics, searchResult] = q
    ? await Promise.all([
        getCommunityTopics({ page: 1, pageSize: TOPIC_PAGE_SIZE, sort: 'hot' }),
        getCommunityTopics({ page: 1, pageSize: TOPIC_PAGE_SIZE, sort: 'hot', isOfficial: true }),
        getCommunityTopics({ page: 1, pageSize: TOPIC_PAGE_SIZE, sort: 'new' }),
        getCommunityTopics({ page, pageSize: TOPIC_PAGE_SIZE, sort, q }),
      ])
    : await Promise.all([
        getCommunityTopics({ page: hotPage, pageSize: TOPIC_PAGE_SIZE, sort: 'hot' }),
        getCommunityTopics({ page: officialPage, pageSize: TOPIC_PAGE_SIZE, sort: 'hot', isOfficial: true }),
        getCommunityTopics({ page: newPage, pageSize: TOPIC_PAGE_SIZE, sort: 'new' }),
        Promise.resolve(null),
      ]);

  const sections = [
    {
      id: 'hot' as const,
      title: '热门话题',
      description: '热度最高的社区专题',
      icon: 'hot' as const,
      result: hotTopics,
      pageParam: 'hotPage' as const,
    },
    {
      id: 'official' as const,
      title: '官方话题',
      description: '官方维护的讨论专题',
      icon: 'official' as const,
      result: officialTopics,
      pageParam: 'officialPage' as const,
    },
    {
      id: 'new' as const,
      title: '最新话题',
      description: '最近创建的社区专题',
      icon: 'new' as const,
      result: newTopics,
      pageParam: 'newPage' as const,
    },
  ];

  const structuredTopics = q && searchResult ? searchResult.list : sections.flatMap((section) => section.result.list);
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 社区话题`,
    description: TOPICS_PAGE_DESCRIPTION,
    inLanguage: 'zh-CN',
    url: absoluteUrl('/community/topics'),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: q ? `${siteName} 社区话题搜索：${q}` : `${siteName} 社区话题专题`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: structuredTopics.length,
    itemListElement: structuredTopics.slice(0, 48).map((topic, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(topicHref(topic)),
      name: String(topic.name || '社区话题').trim(),
      description: clampText(topic.description || topic.app_info?.summary),
      image: topicImage(topic),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      {structuredTopics.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      ) : null}
      <CommunityTopicsPageView q={q} sort={sort} searchResult={searchResult} sections={sections} />
    </>
  );
}
