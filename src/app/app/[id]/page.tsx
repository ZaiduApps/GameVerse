import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import GameDetailView from './GameDetailView';
import { trackedApiFetch } from '@/lib/api';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import {
  absoluteUrl,
  buildSeoDescription,
  getSiteShareImageUrl,
  resolveGameSeoImage,
  sanitizeSeoText,
} from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityPostsByGame } from '@/lib/community-api';
import { getGameReviewSummary } from '@/lib/game-review-api';
import { normalizeToFiveStar } from '@/lib/game-rating';
import { faqMarkdownToPlainText, normalizeGameFaqItems } from '@/lib/game-faq';
import type { ApiRecommendedGame, CommunityPost, GameDetailData, SiteConfig } from '@/types';

const DETAIL_REVALIDATE_SECONDS = 900;
const MAX_TITLE_LENGTH = 68;
const MAX_DESCRIPTION_LENGTH = 160;
const MAX_SERVER_RECOMMENDED_GAMES = 5;
export const dynamicParams = true;
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

function formatNewsDate(input?: string | null) {
  const date = new Date(input || '');
  if (Number.isNaN(date.getTime())) return '最近更新';
  const year = date.getUTCFullYear();
  if (year < 2005 || year > 2100) return '最近更新';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toRelatedNewsItem(post: CommunityPost): RelatedNewsItem | null {
  const id = String(post.id || '').trim();
  if (!id) return null;

  const title = sanitizeSeoText(post.title || post.summary) || '社区帖子';

  return {
    id,
    title,
    excerpt: getCommunityPostPreviewText(post, 120, '查看这篇相关资讯的完整内容。'),
    date: formatNewsDate(post.rawTimestamp || post.timestamp),
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

function isRecommendedGame(input: unknown): input is ApiRecommendedGame {
  if (!input || typeof input !== 'object') return false;
  const item = input as Partial<ApiRecommendedGame>;
  return Boolean(normalizeText(item.name) && normalizeText(item.pkg));
}

function normalizeRecommendedGamesPayload(
  payload: unknown,
  currentGame: GameDetailData['app'],
): ApiRecommendedGame[] {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown } | null)?.data)
      ? (payload as { data: unknown[] }).data
      : [];
  const currentId = normalizeText(currentGame._id);
  const currentPkg = normalizeText(currentGame.pkg).toLowerCase();
  const seenPackages = new Set<string>();

  return list
    .filter(isRecommendedGame)
    .filter((item) => {
      const itemId = normalizeText(item._id);
      const itemPkg = normalizeText(item.pkg).toLowerCase();
      if (!itemPkg || itemId === currentId || itemPkg === currentPkg) return false;
      if (seenPackages.has(itemPkg)) return false;
      seenPackages.add(itemPkg);
      return true;
    })
    .slice(0, MAX_SERVER_RECOMMENDED_GAMES);
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

const getGameDetails = cache(async (id: string): Promise<GameDetailData | null> => {
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
      timeoutMs: 12000,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 0) {
      const message = String(json.message || '').trim() || 'unknown';
      const logPayload = {
        id,
        code: json.code,
        message,
      };
      if (message.includes('不存在')) {
        console.warn('[game-detail] expected missing game', logPayload);
      } else {
        console.error('[game-detail] invalid payload', logPayload);
      }
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('[game-detail] request failed', {
      id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
});

const getRecommendedGames = cache(async (
  currentGame: GameDetailData['app'],
): Promise<ApiRecommendedGame[]> => {
  const param = normalizeText(currentGame.pkg || currentGame._id);
  if (!param) return [];

  try {
    const res = await trackedApiFetch(`/game/recommendedApp?param=${encodeURIComponent(param)}`, {
      cache: 'force-cache',
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
      timeoutMs: 10000,
    });
    if (!res.ok) return [];
    return normalizeRecommendedGamesPayload(await res.json(), currentGame);
  } catch (error) {
    console.error('[game-detail] recommended games request failed', {
      app_id: currentGame._id,
      pkg: currentGame.pkg,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
});

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
    faq: {
      items: normalizeGameFaqItems(gameData.faq),
    },
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

  const titleCore = [
    `${normalizedName} APK下载`,
    normalizedVersion ? `v${normalizedVersion}` : '',
    region ? `(${region})` : '',
  ].filter(Boolean).join(' ');
  const title = clampText(`${titleCore} - ${siteName}`, MAX_TITLE_LENGTH);
  const faqItems = normalizeGameFaqItems(gameData.faq);
  const screenshotCount = Array.isArray(game.detail_images)
    ? game.detail_images.filter((item) => normalizeText(item)).length
    : 0;

  const description = buildSeoDescription(
    normalizedSummary || normalizedDescription || `下载 ${normalizedName} 安卓版`,
    [
      normalizedVersion ? `当前版本 ${normalizedVersion}` : '',
      formatFileSize(game.file_size) ? `安装包大小 ${formatFileSize(game.file_size)}` : '',
      dateLabel ? `最近更新 ${dateLabel}` : '',
      game.pkg ? `包名 ${game.pkg}` : '',
      category ? `适合关注 ${category} 的用户` : '',
      normalizeText(game.developer) ? `开发者：${normalizeText(game.developer)}` : '',
      screenshotCount > 0 ? `包含 ${screenshotCount} 张截图` : '',
      faqItems.length > 0 ? `整理 ${faqItems.length} 条安装与使用问题` : '',
      normalizeText(seo.description),
    ],
    { max: MAX_DESCRIPTION_LENGTH },
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

  const [relatedNews, reviewSummary, recommendedGames] = await Promise.all([
    getRelatedNews(game),
    getGameReviewSummary({
      appId: game._id,
      pkg: game.pkg,
      gameName: game.name,
      manualScore: game.star,
    }).catch(() => null),
    getRecommendedGames(game),
  ]);
  const ratingCount = Math.max(0, Number(reviewSummary?.ratingCount || 0));
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
    aggregateRating: ratingValue > 0 && ratingCount > 0
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

  const faqItems = normalizeGameFaqItems(initialGameData.faq);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faqMarkdownToPlainText(item.answer_markdown),
      },
    })),
  };

  const relatedAppsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${game.name} 相似推荐`,
    itemListElement: recommendedGames.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(`/app/${encodeURIComponent(item.pkg)}`),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(detailJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {recommendedGames.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedAppsJsonLd) }} />
      )}
      <GameDetailView
        id={id}
        initialGameData={buildInitialGameDataForHydration(initialGameData)}
        initialRecommendedGames={recommendedGames}
        initialRelatedNews={relatedNews}
        initialDataMode="partial"
      />
    </>
  );
}
