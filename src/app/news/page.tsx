import type { Metadata } from 'next';

import NewsListView from './NewsListView';
import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiArticle } from '@/types';

const NEWS_JSONLD_PAGE_SIZE = 12;

type NewsQueryPayload = {
  code?: number;
  data?: {
    list?: ApiArticle[];
  };
};

type HomeNewsFallbackPayload = {
  code?: number;
  data?: {
    articles?: ApiArticle[];
  };
};

function getArticleId(article: ApiArticle): string {
  return String(article.gid || article._id || '').trim();
}

function getArticleHref(article: ApiArticle): string {
  const id = getArticleId(article);
  return id ? `/news/${encodeURIComponent(id)}` : '/news';
}

async function getLatestNewsForSeo(): Promise<ApiArticle[]> {
  try {
    const params = new URLSearchParams({
      q: '',
      page: '1',
      pageSize: String(NEWS_JSONLD_PAGE_SIZE),
    });
    const res = await trackedApiFetch(`/news/search?${params.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as NewsQueryPayload;
    if (Number(json?.code ?? -1) !== 0) return [];
    const list = json?.data?.list;
    if (Array.isArray(list) && list.length > 0) return list;
  } catch {
    // fall through to home fallback
  }

  try {
    const res = await trackedApiFetch('/home', {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as HomeNewsFallbackPayload;
    if (Number(json?.code ?? -1) !== 0) return [];
    const list = json?.data?.articles;
    return Array.isArray(list) ? list.slice(0, NEWS_JSONLD_PAGE_SIZE) : [];
  } catch {
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 游戏资讯 - 最新更新与活动公告`;
  const description =
    '查看 APKScc 最新游戏资讯，包含版本更新、活动公告与深度内容。按时间与关键词快速检索你关心的游戏动态。';
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
      canonical: '/news',
      languages: {
        'zh-CN': '/news',
        'x-default': '/news',
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/news'),
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

export default async function NewsPage() {
  const [config, articles] = await Promise.all([getPublicSiteConfig(300), getLatestNewsForSeo()]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 游戏资讯`,
    description: '游戏资讯、版本更新与活动公告列表',
    inLanguage: 'zh-CN',
    url: absoluteUrl('/news'),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 最新资讯列表`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(getArticleHref(article)),
      name: String(article.name || '').trim() || '游戏资讯',
      image: String(article.image_cover || '').trim() || undefined,
      datePublished: String(article.release_at || '').trim() || undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {articles.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      ) : null}
      <NewsListView />
    </>
  );
}
