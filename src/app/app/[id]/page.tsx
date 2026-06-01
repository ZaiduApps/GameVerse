import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import GameDetailView from './GameDetailView';
import { trackedApiFetch } from '@/lib/api';
import {
  absoluteUrl,
  getSiteShareImageUrl,
  hasSeoMarkupNoise,
  resolveGameSeoImage,
  sanitizeSeoText,
} from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityPostsByGame } from '@/lib/community-api';
import { getGameReviewSummary } from '@/lib/game-review-api';
import { normalizeToFiveStar } from '@/lib/game-rating';
import type { CommunityPost, GameDetailData, SiteConfig } from '@/types';

const DETAIL_REVALIDATE_SECONDS = 900;
const MAX_TITLE_LENGTH = 72;
const MAX_DESCRIPTION_LENGTH = 160;
export const dynamic = 'force-static';
export const revalidate = 900;

function normalizeText(input?: string | null): string {
  return String(input || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampText(input: string, maxLength: number): string {
  const text = normalizeText(input);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 3)).trim()}...`;
}

function toIsoDate(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toSeoDateLabel(input?: string | null): string {
  const date = new Date(input || '');
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function humanizeCategory(input?: string | null): string {
  const value = normalizeText(input).toLowerCase();
  if (!value) return '安卓应用';
  if (value === 'game') return '安卓游戏';
  if (value === 'app') return '安卓应用';
  return normalizeText(input);
}

type RelatedNewsItem = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
};

function extractNewsExcerpt(summary?: string | null, content?: string | null, maxLength = 120) {
  const summaryText = sanitizeSeoText(summary);
  const contentText = sanitizeSeoText(content);
  const source =
    (!summaryText ||
    (hasSeoMarkupNoise(summary) && contentText.length > summaryText.length)
      ? contentText || summaryText
      : summaryText || contentText);
  if (!source) return '查看这篇相关资讯的完整内容。';
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}

function formatNewsDate(input?: string | null) {
  const date = new Date(input || '');
  if (Number.isNaN(date.getTime())) return '最近更新';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toRelatedNewsItem(post: CommunityPost): RelatedNewsItem | null {
  const id = String(post.id || '').trim();
  if (!id) return null;

  const title = sanitizeSeoText(post.title || post.summary) || '社区帖子';

  return {
    id,
    title,
    excerpt: extractNewsExcerpt(post.summary, post.content),
    date: formatNewsDate(post.timestamp),
  };
}

async function getRelatedNews(game: GameDetailData['app']): Promise<RelatedNewsItem[]> {
  try {
    const posts = await getCommunityPostsByGame({
      sort: 'latest',
      pageSize: 8,
      appId: game._id,
      pkg: game.pkg,
      gameName: game.name,
    });
    return posts
      .map(toRelatedNewsItem)
      .filter((item): item is RelatedNewsItem => Boolean(item))
      .slice(0, 4);
  } catch {
    return [];
  }
}

function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function buildGameFaqEntries(game: GameDetailData['app']) {
  const name = normalizeText(game.name) || '这款应用';
  const version = normalizeText(game.version) || '最新版';
  const region = normalizeText(game.metadata?.region) || 'Android';
  const pkg = normalizeText(game.pkg) || '未提供';

  return [
    {
      question: `${name} 当前推荐下载哪个版本？`,
      answer: `${name} 当前详情页展示的推荐版本为 ${version}，下载前可优先核对更新时间、文件大小和下载渠道信息。`,
    },
    {
      question: `${name} 适合什么设备安装？`,
      answer: `${name} 面向 ${region} 设备用户，建议在安装前预留足够存储空间，并确认系统版本与网络环境稳定。`,
    },
    {
      question: `${name} 安装失败时应该先检查什么？`,
      answer: `如果 ${name} 安装失败，建议先检查安装包是否完整、设备存储空间是否充足，以及包名 ${pkg} 是否与已安装旧版本冲突。`,
    },
  ];
}

function buildKeywords(gameData: GameDetailData['app'], seoKeywordsRaw?: string): string[] {
  const candidates = [
    gameData.name,
    gameData.pkg,
    gameData.metadata?.region,
    ...(gameData.tags || []),
    ...String(seoKeywordsRaw || '')
      .split(',')
      .map((item) => item.trim()),
  ];

  const deduped = new Set<string>();
  for (const item of candidates) {
    const keyword = normalizeText(item);
    if (!keyword) continue;
    deduped.add(keyword);
    if (deduped.size >= 24) break;
  }
  return Array.from(deduped);
}

async function getSiteConfig(): Promise<SiteConfig | null> {
  return getPublicSiteConfig(300);
}

async function getGameDetails(id: string): Promise<GameDetailData | null> {
  try {
    const platform = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || process.env.CLIENT_PLATFORM || 'android';
    const region = process.env.NEXT_PUBLIC_CLIENT_REGION || process.env.CLIENT_REGION || '';
    const clientVersion = process.env.NEXT_PUBLIC_CLIENT_VERSION || process.env.CLIENT_VERSION || '';

    const query = new URLSearchParams();
    query.set('param', id);
    if (platform) query.set('platform', platform);
    if (region) query.set('region', region);
    if (clientVersion) query.set('client_version', clientVersion);

    const res = await trackedApiFetch(`/game/details?${query.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 0) {
      console.error('API error for game details:', json.message);
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('Failed to fetch game details:', error);
    return null;
  }
}

function buildInitialGameDataForHydration(gameData: GameDetailData): GameDetailData {
  return {
    app: {
      ...gameData.app,
      detail_images: Array.isArray(gameData.app.detail_images)
        ? gameData.app.detail_images.slice(0, 5)
        : [],
      description: String(gameData.app.description || '').slice(0, 1200),
    },
    resources: Array.isArray(gameData.resources) ? gameData.resources : [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [siteConfig, gameData] = await Promise.all([getSiteConfig(), getGameDetails(id)]);

  if (!gameData) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const game = gameData.app;
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  const basic = siteConfig?.basic || {
    site_name: 'APKScc',
    site_slogan: 'APKScc',
    logo_url: '',
    favicon_url: '',
    share_image: '',
  };
  const seo = siteConfig?.seo || {
    title_suffix: '',
    keywords: '',
    description: '',
  };

  const siteName = normalizeText(basic.site_name) || 'APKScc';
  const normalizedName = normalizeText(game.name);
  const normalizedVersion = normalizeText(game.version);
  const normalizedSummary = normalizeText(game.summary || game.description);
  const normalizedDescription = normalizeText(game.description || game.summary);
  const region = normalizeText(game.metadata?.region);
  const category = humanizeCategory(game.type);
  const dateLabel = toSeoDateLabel(game.latest_at);

  const titleSegments = [normalizedName];
  if (region) titleSegments.push(region);
  titleSegments.push('APK 下载');
  if (normalizedVersion) titleSegments.push(`最新版本 ${normalizedVersion}`);
  titleSegments.push(siteName);
  const title = clampText(titleSegments.filter(Boolean).join(' | '), MAX_TITLE_LENGTH);

  const description = clampText(
    [
      normalizedVersion ? `下载 ${normalizedName} 安卓最新版 ${normalizedVersion}。` : `下载 ${normalizedName} 安卓版。`,
      normalizedSummary || normalizedDescription,
      category ? `适合关注 ${category} 的用户。` : '',
      normalizeText(game.developer) ? `开发者：${normalizeText(game.developer)}。` : '',
      dateLabel ? `最近更新于 ${dateLabel}。` : '',
    ]
      .filter(Boolean)
      .join(' ') || normalizeText(seo.description),
    MAX_DESCRIPTION_LENGTH,
  );

  const heroImage = resolveGameSeoImage(game, basic.share_image);
  const keywords = buildKeywords(game, seo.keywords);

  return {
    title: { absolute: title },
    description,
    keywords,
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
      url: canonicalUrl,
      images: heroImage
        ? [
            {
              url: heroImage,
              width: 1200,
              height: 630,
              alt: game.name,
            },
          ]
        : [],
      siteName: basic.site_name,
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: heroImage ? [heroImage] : [],
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const initialGameData = await getGameDetails(id);
  if (!initialGameData) {
    notFound();
  }

  const game = initialGameData.app;
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const heroImage = resolveGameSeoImage(game, getSiteShareImageUrl());
  const description = normalizeText(game.summary || game.description);

  const fallbackRatingCount = Math.max(1, Number(String(game.download_count_show || '').replace(/\D/g, '')) || 1);
  const [relatedNews, reviewSummary] = await Promise.all([
    getRelatedNews(game),
    getGameReviewSummary({
      appId: game._id,
      pkg: game.pkg,
      gameName: game.name,
      manualScore: game.star,
    }).catch(() => null),
  ]);
  const ratingCount = Math.max(1, Number(reviewSummary?.ratingCount || 0) || fallbackRatingCount);
  const ratingValue = Number(
    reviewSummary?.displayScore ??
      normalizeToFiveStar(game.star) ??
      4.2,
  );

  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: game.name,
    applicationCategory: normalizeText(game.type) || 'GameApplication',
    operatingSystem: 'Android',
    inLanguage: 'zh-CN',
    image: heroImage || undefined,
    description: description || undefined,
    url: canonicalUrl,
    softwareVersion: normalizeText(game.version) || undefined,
    fileSize: formatFileSize(game.file_size),
    datePublished: toIsoDate(game.release_at),
    dateModified: toIsoDate(game.latest_at),
    publisher: game.developer
      ? {
          '@type': 'Organization',
          name: normalizeText(game.developer),
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price: '0',
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: ratingValue > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue,
          ratingCount,
        }
      : undefined,
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
        name: '游戏库',
        item: absoluteUrl('/app'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: game.name,
        item: canonicalUrl,
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: buildGameFaqEntries(game).map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(detailJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <GameDetailView
        id={id}
        initialGameData={buildInitialGameDataForHydration(initialGameData)}
        initialRelatedNews={relatedNews}
        initialDataMode="partial"
      />
    </>
  );
}
