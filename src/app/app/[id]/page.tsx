import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import GameDetailView from './GameDetailView';
import { trackedApiFetch } from '@/lib/api';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { resolveGameName } from '@/lib/game-display-name';
import {
  absoluteUrl,
  buildGameDetailSeo,
  getSiteShareImageUrl,
  resolveGameSeoImage,
  sanitizeSeoText,
} from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityFeed, getCommunityPostsByGame } from '@/lib/community-api';
import {
  faqMarkdownToPlainText,
  selectDedicatedGameFaqItems,
} from '@/lib/game-faq';
import { isWebGameType } from '@/lib/game-resource-type';
import {
  DETAIL_API_TIMEOUT_MS,
  loadGameDetailWithFallback,
  saveGameDetailSnapshot,
  type GameDetailFailureReason,
} from '@/lib/game-detail-resilience';
import { gamePageCacheTag } from '@/lib/game-page-cache';
import type { ApiRecommendedGame, CommunityPost, GameDetailData, GamePageSnapshot, SiteConfig } from '@/types';

const DETAIL_REVALIDATE_SECONDS = 900;
const SEO_SNAPSHOT_VERSION = '2';
const MAX_SERVER_RECOMMENDED_GAMES = 10;
const MIN_DETAIL_RELATED_NEWS = 3;
const MAX_DETAIL_RELATED_NEWS = 5;
const RECOMMENDED_GAMES_TIMEOUT_MS = 2500;
const STATIC_PARAMS_DEFAULT_LIMIT = 100;
const STATIC_PARAMS_HARD_LIMIT = 500;
const configuredStaticParamsLimit = Number.parseInt(
  String(process.env.GAME_DETAIL_PREBUILD_LIMIT || STATIC_PARAMS_DEFAULT_LIMIT),
  10,
);
const STATIC_PARAMS_LIMIT = Math.min(
  STATIC_PARAMS_HARD_LIMIT,
  Math.max(
    1,
    Number.isFinite(configuredStaticParamsLimit)
      ? configuredStaticParamsLimit
      : STATIC_PARAMS_DEFAULT_LIMIT,
  ),
);
const STRICT_STATIC_BUILD =
  process.env.NODE_ENV === 'production' || process.env.GAMEVERSE_REQUIRE_SEO_SNAPSHOT === '1';
// 构建后新入库的规范包名允许按需生成；不存在的应用仍由数据查询返回真实 404。
export const dynamicParams = true;
export const revalidate = 900;

type StaticGameItem = {
  pkg?: string;
  quality?: {
    indexable?: boolean;
  };
};

function isCanonicalPackageName(input: string): boolean {
  return /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/.test(input);
}

function isValidGameIdentifier(input: string): boolean {
  return isCanonicalPackageName(input) || /^[a-fA-F0-9]{24}$/.test(input);
}

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  const targets = new Set<string>();
  const response = await trackedApiFetch(
    `/seo/audit/games?page=1&pageSize=${STATIC_PARAMS_LIMIT}`,
    {
      cache: 'force-cache',
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
      timeoutMs: 8000,
      logKey: 'game-static-params',
    },
  );
  if (!response.ok) {
    throw new Error(`游戏静态参数接口失败: status=${response.status}`);
  }

  const payload = await response.json();
  if (payload?.code !== undefined && payload.code !== 0) {
    throw new Error(`游戏静态参数接口返回错误: code=${payload.code}`);
  }

  const data = payload?.data;
  const list: StaticGameItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.list)
      ? data.list
      : [];

  // 审计接口按更新时间倒序；只预生成其中可索引的近期页面，其余页面继续由 ISR 按需生成。
  for (const item of list) {
    const pkg = String(item?.pkg || '').trim();
    if (item?.quality?.indexable !== true) continue;
    if (!isCanonicalPackageName(pkg)) {
      if (STRICT_STATIC_BUILD && pkg) {
        throw new Error(`游戏静态参数包含非法包名: ${pkg}`);
      }
      continue;
    }
    targets.add(pkg);
    if (targets.size >= STATIC_PARAMS_LIMIT) break;
  }

  if (STRICT_STATIC_BUILD && targets.size === 0) {
    throw new Error('没有可预生成的高质量游戏页面，终止构建');
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

function toIsoDate(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
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
      gameName: resolveGameName(game),
    });
    return posts
      .map(toRelatedNewsItem)
      .filter((item): item is RelatedNewsItem => Boolean(item))
      .slice(0, 4);
  } catch {
    return [];
  }
}

function mergeRelatedNewsItems(...groups: RelatedNewsItem[][]): RelatedNewsItem[] {
  const byId = new Map<string, RelatedNewsItem>();
  for (const group of groups) {
    for (const item of group) {
      if (!item?.id || byId.has(item.id)) continue;
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

// 部分游戏在社区里没有多少帖子，相关讨论不足 3 条时用全站最新讨论补位，
// 保证详情页始终有可爬取的 /community/post/ 内链。
async function getLatestCommunityDiscussions(limit: number): Promise<RelatedNewsItem[]> {
  try {
    const feed = await getCommunityFeed('latest', { page: 1, pageSize: limit * 3 });
    return feed.list
      .filter((post) => Boolean(String(post.title || '').trim()))
      .map(toRelatedNewsItem)
      .filter((item): item is RelatedNewsItem => Boolean(item))
      .slice(0, limit);
  } catch {
    return [];
  }
}

async function resolveDetailRelatedNews(
  game: GameDetailData['app'],
  rawRelatedNews: unknown,
): Promise<RelatedNewsItem[]> {
  const snapshotItems = Array.isArray(rawRelatedNews)
    ? normalizeRelatedNewsPayload(rawRelatedNews)
    : [];
  let items = snapshotItems;
  if (items.length < MIN_DETAIL_RELATED_NEWS) {
    items = mergeRelatedNewsItems(items, await getRelatedNews(game));
  }
  if (items.length < MIN_DETAIL_RELATED_NEWS) {
    items = mergeRelatedNewsItems(items, await getLatestCommunityDiscussions(MAX_DETAIL_RELATED_NEWS));
  }
  return items.slice(0, MAX_DETAIL_RELATED_NEWS);
}

function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

// GameSeoContent 类型尚未声明 aliases，但后台写入与快照都会原样下发该字段。
// 数据侧存在两代来源：seo.aliases（人工/后台写入）与 metadata.chs|cht|en（采集时
// 抓到的多语言名称）。后者在中文游戏上就是用户实际搜索的别名，这里合并兜底，
// 避免「有中文名但标题里看不到」的情况。
function readGameSeoAliases(game: GameDetailData['app']): string[] | null {
  const stored = (
    game.seo as (typeof game.seo & { aliases?: string[] | null }) | undefined
  )?.aliases;
  const candidates: string[] = Array.isArray(stored) ? [...stored] : [];
  const metadata = game.metadata as
    | { chs?: unknown; cht?: unknown; en?: unknown }
    | undefined;
  for (const value of [metadata?.chs, metadata?.cht, metadata?.en]) {
    if (typeof value === 'string') candidates.push(value);
  }
  const aliases = candidates
    .map((value) =>
      value
        .replace(/\s*[(（][A-Za-z0-9 .,:'"&!\-]+[)）]\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((value) => value && value !== (game.name || '').trim());
  const unique = [...new Set(aliases)];
  return unique.length ? unique : null;
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

async function getSiteConfig(): Promise<SiteConfig | null> {
  return getPublicSiteConfig(300);
}

const getGamePageSnapshot = cache(async (id: string): Promise<GamePageSnapshot | null> => {
  try {
    const response = await trackedApiFetch(
      `/seo/game-page?pkg=${encodeURIComponent(id)}&qualityVersion=${SEO_SNAPSHOT_VERSION}`,
      {
      cache: 'force-cache',
      next: {
        revalidate: DETAIL_REVALIDATE_SECONDS,
        tags: [gamePageCacheTag(id)],
      },
      timeoutMs: 8000,
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
            userAverage: rawReview.userAverage ?? rawReview.user_average ?? rawReview.user_avg ?? null,
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

const getGameDetails = cache(async (id: string): Promise<{ status: number; payload?: unknown }> => {
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
    next: {
      revalidate: DETAIL_REVALIDATE_SECONDS,
      tags: [gamePageCacheTag(id)],
    },
    timeoutMs: DETAIL_API_TIMEOUT_MS,
  });
  // 非 2xx 也返回给降级判定，由它统一打 degraded 日志（不再在这里静默吞掉）。
  if (!res.ok) return { status: res.status };
  return { status: res.status, payload: await res.json() };
});

/**
 * 页面数据的判定结果：
 * - `ok`：正常数据（SEO 快照优先，缺了就回退 /game/details）；
 * - `missing`：上游明确「不存在」→ 404，不能被降级逻辑吞掉；
 * - `degraded`：上游故障但有最近成功快照 → 渲染快照 + 顶部标注；
 * - `unavailable`：上游故障且没有快照 → 抛错走 5xx，不伪装成 404。
 */
type GamePageDataResult =
  | { kind: 'ok'; data: GamePageSnapshot }
  | { kind: 'missing' }
  | { kind: 'degraded'; data: GamePageSnapshot; savedAt: string | null; reason: GameDetailFailureReason }
  | { kind: 'unavailable'; reason: GameDetailFailureReason };

const getPageData = cache(async (id: string): Promise<GamePageDataResult> => {
  const snapshot = await getGamePageSnapshot(id);
  if (snapshot) {
    // SEO 快照是 GameDetailData 的超集，同样是有用的降级快照。
    // 只在这个端点落快照的话，绝大多数页面在 SEO 快照一直正常时根本没有快照可回退，
    // 上游一挂就会全站 5xx，降级等于没做。
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      await saveGameDetailSnapshot(id, snapshot).catch(() => {});
    }
    return { kind: 'ok', data: snapshot };
  }

  // 单条快照缺失时回退详情接口，避免生产构建被脏数据阻断。
  const outcome = await loadGameDetailWithFallback({
    pkg: id,
    load: () => getGameDetails(id),
    // 构建期会预生成上百页，不为构建过程写快照文件。
    persistSnapshot: process.env.NEXT_PHASE !== 'phase-production-build',
  });

  if (outcome.result === 'ok') return { kind: 'ok', data: outcome.data };
  if (outcome.result === 'missing') return { kind: 'missing' };
  if (outcome.data) {
    return { kind: 'degraded', data: outcome.data, savedAt: outcome.savedAt, reason: outcome.reason };
  }
  return { kind: 'unavailable', reason: outcome.reason };
});

function unavailableError(id: string, reason: GameDetailFailureReason) {
  const error = new Error(`[game-detail] 详情接口不可用且无快照: pkg=${id} reason=${reason}`);
  error.name = 'GameDetailUnavailableError';
  return error;
}

const getRecommendedGames = cache(async (
  currentGame: GameDetailData['app'],
): Promise<ApiRecommendedGame[]> => {
  const param = normalizeText(currentGame.pkg || currentGame._id);
  if (!param) return [];

  // 推荐内容不参与详情页 SEO；静态构建阶段跳过外部推荐请求，避免 4853 个页面被非关键超时拖慢。
  if (process.env.NEXT_PHASE === 'phase-production-build') return [];

  try {
    const res = await trackedApiFetch(`/game/recommendedApp?param=${encodeURIComponent(param)}`, {
      cache: 'force-cache',
      next: {
        revalidate: DETAIL_REVALIDATE_SECONDS,
        tags: [gamePageCacheTag(param)],
      },
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isValidGameIdentifier(id)) {
    notFound();
  }
  const [siteConfig, pageData] = await Promise.all([getSiteConfig(), getPageData(id)]);

  if (pageData.kind === 'missing') {
    notFound();
  }
  if (pageData.kind === 'unavailable') {
    // 上游故障且无快照：走 5xx，不伪装成 404。
    throw unavailableError(id, pageData.reason);
  }

  // 与页面主体共用同一次 getPageData（cache() 保证），降级标记与 metadata 不会两边各判一次。
  const gameData = pageData.data;
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
  const normalizedName = resolveGameName(game);
  const detailSeo = buildGameDetailSeo({
    name: normalizedName,
    pkg: game.pkg,
    type: game.type,
    region: game.metadata?.region,
    version: game.version,
    summary: game.summary,
    latestAt: game.latest_at,
    manualTitle: game.seo?.title,
    manualDescription: game.seo?.description,
    manualKeywords: game.seo?.keywords,
    aliases: readGameSeoAliases(game),
    genre: Array.isArray(game.tags) ? game.tags[0] : '',
    titleTemplate: siteConfig?.app_seo?.app_title_template,
    descriptionTemplate: siteConfig?.app_seo?.app_description_template,
    titleSuffix: siteConfig?.seo?.title_suffix,
  }, siteName);
  const title = detailSeo.title;
  const description = detailSeo.description;

  const heroImage = resolveGameSeoImage(game, basic.share_image);
  const keywords = detailSeo.keywords;
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
              alt: resolveGameName(game),
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

  if (!isValidGameIdentifier(id)) {
    notFound();
  }

  const pageData = await getPageData(id);
  if (pageData.kind === 'missing') {
    notFound();
  }
  if (pageData.kind === 'unavailable') {
    // 上游故障且没有可用快照：抛错让 Next 返回 5xx，绝不用 404 冒充。
    throw unavailableError(id, pageData.reason);
  }

  const initialGameData = pageData.data;
  const degradedSavedAt = pageData.kind === 'degraded' ? pageData.savedAt : null;
  const game = initialGameData.app;
  const isWebGame = isWebGameType(game.type);
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const heroImage = resolveGameSeoImage(game, getSiteShareImageUrl());
  const detailSeo = buildGameDetailSeo({
    name: resolveGameName(game),
    pkg: game.pkg,
    type: game.type,
    region: game.metadata?.region,
    manualTitle: game.seo?.title,
    manualDescription: game.seo?.description,
    manualKeywords: game.seo?.keywords,
    aliases: readGameSeoAliases(game),
  });
  const description = detailSeo.description;
  const aliases = detailSeo.aliases;

  const [relatedNews, recommendedGames] = await Promise.all([
    resolveDetailRelatedNews(game, initialGameData.relatedNews),
    Array.isArray(initialGameData.recommendedGames)
      ? normalizeRecommendedGamesPayload(initialGameData.recommendedGames, game)
      : getRecommendedGames(game),
  ]);
  const ratingCount = Math.max(0, Number(initialGameData.reviewSummary?.ratingCount || 0));
  // 评分结构化数据只使用站点真实评价数据；来源评分（app.star）仅作为展示参考，不进 JSON-LD。
  const siteRatingAverage = Number(initialGameData.reviewSummary?.userAverage || 0);
  const genre = normalizeText(Array.isArray(game.tags) ? game.tags[0] : '');
  const screenshots = (Array.isArray(game.detail_images) ? game.detail_images : [])
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .slice(0, 5);

  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: resolveGameName(game),
    alternateName: aliases.length > 0 ? aliases : undefined,
    applicationCategory: schemaApplicationCategory(game.type),
    operatingSystem: isWebGame ? 'Web Browser' : 'Android',
    inLanguage: 'zh-CN',
    image: heroImage || undefined,
    description: description || undefined,
    url: canonicalUrl,
    genre: genre || undefined,
    screenshot: screenshots.length > 0 ? screenshots : undefined,
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
    ...(!isWebGame && Array.isArray(initialGameData.resources) && initialGameData.resources.length > 0
      ? {
          offers: {
            '@type': 'Offer',
            url: canonicalUrl,
            price: '0',
            priceCurrency: 'CNY',
            availability: 'https://schema.org/InStock',
          },
          potentialAction: {
            '@type': 'InstallAction',
            target: canonicalUrl,
            platform: ['https://schema.org/AndroidPlatform'],
          },
        }
      : {}),
    aggregateRating: ratingCount > 0 && siteRatingAverage > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: Math.round(siteRatingAverage * 10) / 10,
          ratingCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };

  const dedicatedFaqItems = selectDedicatedGameFaqItems(initialGameData.faq);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dedicatedFaqItems.map((item) => ({
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
    name: `${resolveGameName(game)} 相似推荐`,
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
      {dedicatedFaqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {recommendedGames.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedAppsJsonLd) }} />
      )}
      <GameDetailView
        gameData={initialGameData}
        recommendedGames={recommendedGames}
        relatedNews={relatedNews}
        snapshotSavedAt={degradedSavedAt}
      />
    </>
  );
}
