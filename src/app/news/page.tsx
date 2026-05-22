import type { Metadata } from 'next';

import NewsListView from './NewsListView';
import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiArticle } from '@/types';

const NEWS_JSONLD_PAGE_SIZE = 12;
const NEWS_INITIAL_PAGE_SIZE = 20;

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

function sanitizeImageUrl(input?: string): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/example\.com|placehold\.co/i.test(value)) return '';
  return value;
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

async function getInitialNewsPage(): Promise<{
  articles: ApiArticle[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}> {
  try {
    const params = new URLSearchParams({
      q: '',
      page: '1',
      pageSize: String(NEWS_INITIAL_PAGE_SIZE),
    });
    const res = await trackedApiFetch(`/news/search?${params.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (res.ok) {
      const json = (await res.json()) as NewsQueryPayload & {
        data?: {
          list?: ApiArticle[];
          total?: number;
          page?: number;
          pageSize?: number;
          totalPages?: number;
          hasMore?: boolean;
        };
      };
      if (Number(json?.code ?? -1) === 0 && Array.isArray(json?.data?.list)) {
        const list = json.data.list;
        const total = Math.max(Number(json.data.total || list.length), list.length);
        const pageSize = Math.max(1, Number(json.data.pageSize || NEWS_INITIAL_PAGE_SIZE));
        const page = Math.max(1, Number(json.data.page || 1));
        const totalPages = Math.max(1, Number(json.data.totalPages || Math.ceil(total / pageSize)));
        return {
          articles: list,
          pagination: {
            total,
            page,
            pageSize,
            totalPages,
            hasMore: typeof json.data.hasMore === 'boolean' ? json.data.hasMore : page < totalPages,
          },
        };
      }
    }
  } catch {
    // fall through to home fallback
  }

  try {
    const res = await trackedApiFetch('/home', {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) {
      throw new Error('home-fallback-failed');
    }
    const json = (await res.json()) as HomeNewsFallbackPayload;
    const list = Array.isArray(json?.data?.articles) ? json.data.articles.slice(0, NEWS_INITIAL_PAGE_SIZE) : [];
    return {
      articles: list,
      pagination: {
        total: list.length,
        page: 1,
        pageSize: NEWS_INITIAL_PAGE_SIZE,
        totalPages: 1,
        hasMore: false,
      },
    };
  } catch {
    return {
      articles: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: NEWS_INITIAL_PAGE_SIZE,
        totalPages: 1,
        hasMore: false,
      },
    };
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 游戏资讯 - 最新更新与活动公告`;
  const description =
    '查看 APKScc 最新游戏资讯，包含版本更新、活动公告与深度内容。按时间与关键词快速检索你关心的游戏动态。';
  const shareImage = String(config?.basic?.share_image || '').trim();
  const hasQuery = Boolean(String(params?.q || '').trim());

  return {
    title: { absolute: title },
    description,
    robots: {
      index: !hasQuery,
      follow: !hasQuery,
      googleBot: {
        index: !hasQuery,
        follow: !hasQuery,
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

const NEWS_TOPIC_CLUSTERS = [
  {
    title: '版本更新追踪',
    description: '集中查看游戏版本变动、更新公告和关键改动摘要，适合追踪长期运营内容。',
    href: '/news?q=更新',
  },
  {
    title: '活动福利情报',
    description: '聚合限时活动、福利兑换和重点节点公告，适合作为事件型流量入口。',
    href: '/news?q=活动',
  },
  {
    title: '攻略与深度内容',
    description: '适合围绕玩法解析、职业搭配和版本环境理解做更深入阅读。',
    href: '/news?q=攻略',
  },
];

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [config, articles, initialNewsPage] = await Promise.all([
    getPublicSiteConfig(300),
    getLatestNewsForSeo(),
    getInitialNewsPage(),
  ]);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const initialKeyword = String(params?.q || '').trim();

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
      image: sanitizeImageUrl(article.image_cover) || undefined,
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
      <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-black text-foreground">{siteName} 游戏资讯</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          这里整理版本更新、活动公告和攻略内容，适合作为站内资讯主题入口。你可以先按主题筛选，再进入单篇资讯查看来源、摘要、相关文章与相关游戏入口。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {NEWS_TOPIC_CLUSTERS.map((item) => (
            <a key={item.title} href={item.href} className="rounded-xl border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </div>
      </section>
      <NewsListView initialArticles={initialNewsPage.articles} initialPagination={initialNewsPage.pagination} initialSearchTerm={initialKeyword} />
    </>
  );
}
