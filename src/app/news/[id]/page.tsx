import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiArticle, NewsArticle } from '@/types';
import NewsArticleView from './NewsArticleView';

function stripHtml(input?: string | null): string {
  return String(input || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function parseDate(input?: string | null): Date | null {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(input?: string | null): string | undefined {
  const date = parseDate(input);
  return date ? date.toISOString() : undefined;
}

function getArticleId(article: Pick<ApiArticle, '_id' | 'gid'>): string {
  return String(article.gid || article._id || '').trim();
}

function getArticleModifiedTime(article?: ApiArticle | null): string | undefined {
  if (!article) return undefined;
  return article.updated_at || article.latest_at || article.release_at;
}

function transformApiArticle(apiArticle: ApiArticle): NewsArticle {
  return {
    id: getArticleId(apiArticle),
    title: apiArticle.name,
    content: apiArticle.content || '',
    excerpt: apiArticle.summary,
    imageUrl: apiArticle.image_cover,
    category: apiArticle.tags?.[0] || '资讯',
    date: parseDate(apiArticle.release_at)?.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) || '未知日期',
    author: apiArticle.author || '匿名',
    tags: apiArticle.tags,
    isTop: apiArticle.is_top,
    isRecommended: apiArticle.is_recommended,
    viewCount: apiArticle.view_counts,
    likeCount: apiArticle.like_counts,
    additionLinks: apiArticle.addition_links,
  };
}

async function getNewsArticleApi(id: string): Promise<ApiArticle | null> {
  try {
    const res = await trackedApiFetch(`/news/active/${id}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.code !== 0 || !json.data) {
      return null;
    }

    return json.data as ApiArticle;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [config, apiArticle] = await Promise.all([getPublicSiteConfig(300), getNewsArticleApi(id)]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/news/${encodeURIComponent(id)}`;

  const fallbackArticle = MOCK_NEWS_ARTICLES.find((item) => item.id === id);
  const article = apiArticle ? transformApiArticle(apiArticle) : fallbackArticle || null;
  if (!article) {
    return {
      title: '资讯不存在',
      description: '未找到对应资讯内容。',
      robots: { index: false, follow: false },
    };
  }

  const title = clamp(`${article.title} | ${siteName} 游戏资讯`, 80);
  const description = clamp(
    stripHtml(article.excerpt || article.content || '获取最新游戏资讯与公告。'),
    160,
  );
  const image = String(article.imageUrl || config?.basic?.share_image || '').trim();

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
      type: 'article',
      locale: 'zh_CN',
      images: image ? [image] : [],
      publishedTime: toIso(apiArticle?.release_at),
      modifiedTime: toIso(getArticleModifiedTime(apiArticle)),
      authors: article.author ? [article.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const [config, liveApiArticle] = await Promise.all([getPublicSiteConfig(300), getNewsArticleApi(id)]);
  const article = liveApiArticle
    ? transformApiArticle(liveApiArticle)
    : MOCK_NEWS_ARTICLES.find((item) => item.id === id) || null;

  if (!article) {
    notFound();
  }

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const canonicalPath = `/news/${encodeURIComponent(id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const articleDescription = clamp(stripHtml(article.excerpt || article.content), 260);
  const articleImage = String(article.imageUrl || config?.basic?.share_image || '').trim();

  const newsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: canonicalUrl,
    headline: article.title,
    description: articleDescription || undefined,
    image: articleImage ? [articleImage] : undefined,
    datePublished: toIso(liveApiArticle?.release_at),
    dateModified: toIso(getArticleModifiedTime(liveApiArticle)),
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: config?.basic?.logo_url
        ? {
            '@type': 'ImageObject',
            url: config.basic.logo_url,
          }
        : undefined,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '游戏资讯',
        item: absoluteUrl('/news'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <NewsArticleView article={article as NewsArticle} />
    </>
  );
}
