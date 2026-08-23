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
import { faqMarkdownToPlainText, normalizeGameFaqItems } from '@/lib/game-faq';
import { isWebGameType } from '@/lib/game-resource-type';
import type { ApiRecommendedGame, CommunityPost, GameDetailData, GamePageSnapshot, SiteConfig } from '@/types';

const DETAIL_REVALIDATE_SECONDS = 900;
const SEO_SNAPSHOT_VERSION = '2';
const MAX_TITLE_LENGTH = 68;
const MAX_DESCRIPTION_LENGTH = 160;
const MAX_SERVER_RECOMMENDED_GAMES = 5;
const RECOMMENDED_GAMES_TIMEOUT_MS = 2500;
const STATIC_PARAMS_PAGE_SIZE = 500;
const STATIC_PARAMS_MAX_PAGES = 200;
const STRICT_STATIC_BUILD =
  process.env.NODE_ENV === 'production' || process.env.GAMEVERSE_REQUIRE_SEO_SNAPSHOT === '1';
// 详情页只允许静态参数清单中的规范包名，避免未知参数渲染成 200 软 404。
export const dynamicParams = false;
export const revalidate = 900;

type StaticGameItem = {
  _id?: string;
  pkg?: string;
  type?: string;
  status?: number;
  is_deleted?: number | boolean;
};

function isCanonicalPackageName(input: string): boolean {
  return /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(input);
}

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  const targets = new Set<string>();
  let expectedTotal = 0;
  let completed = false;

  for (let page = 1; page <= STATIC_PARAMS_MAX_PAGES; page += 1) {
    const response = await trackedApiFetch(
      `/seo/sitemap/games?page=${page}&pageSize=${STATIC_PARAMS_PAGE_SIZE}`,
      {
        cache: 'force-cache',
        next: { revalidate: DETAIL_REVALIDATE_SECONDS },
        timeoutMs: 20000,
        logKey: 'game-static-params',
      },
    );
    if (!response.ok) {
      throw new Error(`游戏静态参数接口失败: page=${page}, status=${response.status}`);
    }

    const payload = await response.json();
    if (payload?.code !== undefined && payload.code !== 0) {
      throw new Error(`游戏静态参数接口返回错误: page=${page}, code=${payload.code}`);
    }

    const data = payload?.data;
    const list: StaticGameItem[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.list)
        ? data.list
        : [];
    const total = Number(data?.total || 0);
    const pageSize = Number(data?.pageSize || STATIC_PARAMS_PAGE_SIZE);
    if (total > 0) expectedTotal = total;

    for (const item of list) {
      const pkg = String(item?.pkg || '').trim();
      const id = String(item?._id || '').trim();
      const deleted = item?.is_deleted === true || Number(item?.is_deleted || 0) === 1;
      if (deleted || (item?.status !== undefined && ![0, 1].includes(Number(item.status)))) continue;
      const target = pkg || id;
      if (!target) continue;
      if (!pkg && String(item?.type || '').trim().toLowerCase() !== 'web') continue;
      if (pkg && !isCanonicalPackageName(pkg)) {
        if (STRICT_STATIC_BUILD) {
          throw new Error(`游戏静态参数包含非法包名: ${pkg}`);
        }
        continue;
      }
      targets.add(target);
    }

    if (list.length === 0 || (total > 0 && page * pageSize >= total) || list.length < pageSize) {
      completed = true;
      break;
    }
  }

  if (!completed) {
    throw new Error(`游戏静态参数超过分页上限: ${STATIC_PARAMS_MAX_PAGES}`);
  }
  if (targets.size === 0) {
    throw new Error('游戏静态参数为空，终止构建');
  }
  if (STRICT_STATIC_BUILD && expectedTotal > 0 && targets.size !== expectedTotal) {
    throw new Error(`游戏静态参数数量异常: unique=${targets.size}, total=${expectedTotal}`);
  }

  return Array.from(targets, (id) => ({ id }));
}

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
  if (value === 'web') return '网页游戏';
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
      pkg: game.pkg || undefined,
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

function schemaApplicationCategory(input?: string | null): string {
  const value = normalizeText(input).toLowerCase();
  const applicationTypes = new Set(['app', 'application', 'tool', 'software']);
  return applicationTypes.has(value) ? 'UtilitiesApplication' : 'GameApplication';
}

function normalizeRelatedNewsPayload(payload: unknown): RelatedNewsItem[] {
  if (!Array.isArray(payload)) return [];
  return payload.map((value) => {
    const item = value as Partial<CommunityPost> & {
      _id?: unknown;
      publish_at?: string;
    };
    const id = normalizeText(item.id || String(item._id || ''));
    if (!id) return null;
    return {
      id,
      title: sanitizeSeoText(item.title || item.summary) || '社区帖子',
      excerpt: sanitizeSeoText(item.summary) || '查看这篇相关资讯的完整内容。',
      date: formatNewsDate(item.rawTimestamp || item.publish_at || item.timestamp),
    };
  }).filter((item): item is RelatedNewsItem => Boolean(item)).slice(0, 4);
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

function buildKeywords(gameData: GameDetailData['app']): string[] {
  const candidates = [
    gameData.name,
    gameData.pkg,
    gameData.metadata?.region,
    ...(gameData.tags || []),
    ...(Array.isArray(gameData.seo?.keywords) ? gameData.seo.keywords : []),
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

const getGamePageSnapshot = cache(async (id: string): Promise<GamePageSnapshot | null> => {
  try {
    const response = await trackedApiFetch(
      `/seo/game-page?pkg=${encodeURIComponent(id)}&qualityVersion=${SEO_SNAPSHOT_VERSION}`,
      {
      cache: 'force-cache',
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
      timeoutMs: 20000,
      logKey: 'game-page-snapshot',
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    if (payload?.code !== undefined && payload.code !== 0) return null;
    const data = payload?.data;
    if (!data?.app) return null;
    const snapshot = data as Record<string, unknown>;
    const rawApp = (snapshot.app || {}) as Record<string, unknown>;
    const rawReview = (snapshot.reviewSummary || snapshot.review_summary || null) as Record<string, unknown> | null;
    // 兼容后端 snake_case 字段，前端内部统一使用 camelCase。
    return {
      ...snapshot,
      app: {
        ...rawApp,
        latest_content: rawApp.latest_content || rawApp.latestContent,
        seo: rawApp.seo || rawApp.seo_content || rawApp.seoContent,
      },
      recommendedGames: (snapshot.recommendedGames || snapshot.recommended_games) as GamePageSnapshot['recommendedGames'],
      relatedNews: (snapshot.relatedNews || snapshot.related_news) as GamePageSnapshot['relatedNews'],
      reviewSummary: rawReview
        ? {
            displayScore: rawReview.displayScore ?? rawReview.display_score ?? rawReview.rating,
            ratingCount: rawReview.ratingCount ?? rawReview.rating_count,
          }
        : null,
      quality: snapshot.quality as GamePageSnapshot['quality'],
    } as GamePageSnapshot;
  } catch (error) {
    console.error('[game-detail] SEO 快照请求失败', {
      id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
});

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
      // 推荐内容不是详情页 SEO 的必要数据，构建时快速失败可避免单个上游拖住整批静态页面。
      timeoutMs: RECOMMENDED_GAMES_TIMEOUT_MS,
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

const getPageData = cache(async (id: string): Promise<GamePageSnapshot | null> => {
  const snapshot = await getGamePageSnapshot(id);
  if (snapshot) return snapshot;

  // 单条快照缺失时回退详情接口，避免生产构建被脏数据阻断。
  return getGameDetails(id);
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
  const [siteConfig, gameData] = await Promise.all([getSiteConfig(), getPageData(id)]);

  if (!gameData) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const game = gameData.app;
  const isWebGame = isWebGameType(game.type);
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  const basic = siteConfig?.basic || {
    site_name: 'APKScc',
    site_slogan: 'APKScc',
    logo_url: '',
    favicon_url: '',
    share_image: '',
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
    normalizeText(game.seo?.title) || (isWebGame ? `${normalizedName} 网页游戏` : `${normalizedName} APK下载`),
    !isWebGame && normalizedVersion ? `v${normalizedVersion}` : '',
    region ? `(${region})` : '',
  ].filter(Boolean).join(' ');
  const title = clampText(`${titleCore} - ${siteName}`, MAX_TITLE_LENGTH);
  const faqItems = normalizeGameFaqItems(gameData.faq);
  const screenshotCount = Array.isArray(game.detail_images)
    ? game.detail_images.filter((item) => normalizeText(item)).length
    : 0;

  const description = buildSeoDescription(
    normalizeText(game.seo?.description) ||
      normalizedSummary ||
      normalizedDescription ||
      (isWebGame ? `在 AC 盒子中游玩 ${normalizedName}` : `下载 ${normalizedName} 安卓版`),
    [
      !isWebGame && normalizedVersion ? `当前版本 ${normalizedVersion}` : '',
      !isWebGame && formatFileSize(game.file_size) ? `安装包大小 ${formatFileSize(game.file_size)}` : '',
      dateLabel ? `最近更新 ${dateLabel}` : '',
      !isWebGame && game.pkg ? `包名 ${game.pkg}` : '',
      category ? `适合关注 ${category} 的用户` : '',
      isWebGame ? '请在 AC 盒子 App 中开始游玩' : '',
      normalizeText(game.developer) ? `开发者：${normalizeText(game.developer)}` : '',
      screenshotCount > 0 ? `包含 ${screenshotCount} 张截图` : '',
      faqItems.length > 0
        ? `整理 ${faqItems.length} 条${isWebGame ? '游玩与使用' : '安装与使用'}问题`
        : '',
    ],
    { max: MAX_DESCRIPTION_LENGTH },
  );

  const heroImage = resolveGameSeoImage(game, basic.share_image);
  const keywords = buildKeywords(game);
  const isIndexable = gameData.quality?.indexable !== false;

  return {
    title: { absolute: title },
    description,
    keywords,
    robots: {
      index: isIndexable,
      follow: true,
      googleBot: {
        index: isIndexable,
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

  const initialGameData = await getPageData(id);
  if (!initialGameData) {
    notFound();
  }

  const game = initialGameData.app;
  const isWebGame = isWebGameType(game.type);
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const heroImage = resolveGameSeoImage(game, getSiteShareImageUrl());
  const description = normalizeText(game.summary || game.description);

  const [relatedNews, recommendedGames] = await Promise.all([
    Array.isArray(initialGameData.relatedNews)
      ? normalizeRelatedNewsPayload(initialGameData.relatedNews)
      : getRelatedNews(game),
    Array.isArray(initialGameData.recommendedGames)
      ? normalizeRecommendedGamesPayload(initialGameData.recommendedGames, game)
      : getRecommendedGames(game),
  ]);
  const ratingCount = Math.max(0, Number(initialGameData.reviewSummary?.ratingCount || 0));
  const ratingValue = Number(initialGameData.reviewSummary?.displayScore || 0);

  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: game.name,
    applicationCategory: schemaApplicationCategory(game.type),
    operatingSystem: isWebGame ? 'Web Browser' : 'Android',
    inLanguage: 'zh-CN',
    image: heroImage || undefined,
    description: description || undefined,
    url: canonicalUrl,
    softwareVersion: isWebGame ? undefined : normalizeText(game.version) || undefined,
    fileSize: isWebGame ? undefined : formatFileSize(game.file_size),
    datePublished: toIsoDate(game.release_at),
    dateModified: toIsoDate(game.latest_at),
    publisher: game.developer
      ? {
          '@type': 'Organization',
          name: normalizeText(game.developer),
        }
      : undefined,
    ...(!isWebGame && initialGameData.resources.length > 0
      ? {
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            price: '0',
            priceCurrency: 'CNY',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
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
