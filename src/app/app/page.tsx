import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';

import AppLibraryView from './AppLibraryView';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';
import { trackedApiFetch } from '@/lib/api';
import { resolveGameName } from '@/lib/game-display-name';
import {
  GAME_LIBRARY_BROWSE_PAGE_SIZE,
  GAME_LIBRARY_BROWSE_QUERIES,
  GAME_LIBRARY_PAGE_SIZE,
} from '@/lib/game-library';
import { absoluteUrl, buildSeoDescription } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiGame } from '@/types';

const GAME_JSONLD_PAGE_SIZE = 12;
const PAGINATION_WINDOW_RADIUS = 3;

type GameQueryPayload = {
  code?: number;
  data?: {
    list?: ApiGame[];
    total?: number;
    page?: number;
    pageSize?: number;
  };
};

type LibraryQueryResult = {
  list: ApiGame[];
  total: number;
  page: number;
  pageSize: number;
};

type InitialLibraryData = {
  games: ApiGame[];
  hasMorePages: boolean;
  ready: boolean;
  page: number;
  totalPages: number;
};

type HomeFallbackPayload = {
  code?: number;
  data?: {
    albums?: Array<{
      games?: ApiGame[];
    }>;
  };
};

function getGameHref(game: ApiGame): string {
  const target = String(game.pkg || game._id || '').trim();
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

async function getHomeFallbackGames(): Promise<ApiGame[]> {
  try {
    const res = await trackedApiFetch('/home', {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as HomeFallbackPayload;
    if (Number(json?.code ?? -1) !== 0) return [];

    const albums = Array.isArray(json?.data?.albums) ? json.data.albums : [];
    const deduped = new Map<string, ApiGame>();
    for (const album of albums) {
      const games = Array.isArray(album?.games) ? album.games : [];
      for (const game of games) {
        const key = String(game?.pkg || game?._id || '').trim();
        if (!key) continue;
        if (!deduped.has(key)) {
          deduped.set(key, game);
        }
        if (deduped.size >= GAME_JSONLD_PAGE_SIZE) {
          return Array.from(deduped.values());
        }
      }
    }
    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

// 只做合法性归一，不设固定上限：真正的页面上限由后端结果集决定（见 getLibraryPageOneBounds）。
// 过去这里 clamp 到 500，导致 501 页以后共用「第 500 页」的正文和 canonical。
function parsePageParam(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

async function fetchLibraryQuery(
  query: string,
  pageSize: number,
  page: number,
  cacheable: boolean,
): Promise<LibraryQueryResult | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await trackedApiFetch(`/game/q?${params.toString()}`, cacheable
      ? { cache: 'force-cache', next: { revalidate: 900 } }
      : { cache: 'no-store' });
    if (!res.ok) return null;

    const json = (await res.json()) as GameQueryPayload;
    if (Number(json?.code ?? -1) !== 0) return null;
    const list = Array.isArray(json?.data?.list) ? json.data.list : [];
    const total = Number(json?.data?.total ?? 0);
    const responsePage = Math.max(1, Number(json?.data?.page ?? page));
    const responsePageSize = Math.max(1, Number(json?.data?.pageSize ?? pageSize));
    return {
      list,
      total: Number.isFinite(total) ? total : 0,
      page: responsePage,
      pageSize: responsePageSize,
    };
  } catch {
    return null;
  }
}

type LibraryBounds = {
  browseMode: boolean;
  pageSize: number;
  /** 每个查询词的第 1 页结果；请求失败为 null。 */
  firstPages: Array<{ query: string; result: LibraryQueryResult | null }>;
  /** 各查询词结果集的真实最大有效页；超出即无内容可翻。 */
  maxPage: number;
  /** 至少有一个查询词拿到了第 1 页数据。 */
  ready: boolean;
};

// 页面是否越界必须在任何 Suspense 边界之前判定，否则响应已经按 200 流式发出，
// notFound() 只能改渲染内容、改不了状态码。第 1 页永远有效，不需要探测；
// 深页先取各词第 1 页拿 total，再用 cache() 与正文渲染共享这批请求。
const getLibraryBounds = cache(async (keyword: string): Promise<LibraryBounds> => {
  const normalizedKeyword = String(keyword || '').trim();
  const browseMode = !normalizedKeyword;
  const queries = browseMode ? [...GAME_LIBRARY_BROWSE_QUERIES] : [normalizedKeyword];
  const pageSize = browseMode ? GAME_LIBRARY_BROWSE_PAGE_SIZE : GAME_LIBRARY_PAGE_SIZE;
  const firstPages = await Promise.all(
    queries.map(async (query) => ({
      query,
      result: await fetchLibraryQuery(query, pageSize, 1, browseMode),
    })),
  );
  const successful = firstPages
    .map((entry) => entry.result)
    .filter((result): result is LibraryQueryResult => result !== null);
  const maxPage = successful.reduce(
    (max, result) => Math.max(max, Math.ceil(result.total / result.pageSize)),
    1,
  );
  return { browseMode, pageSize, firstPages, maxPage, ready: successful.length > 0 };
});

async function getInitialLibraryData(
  keyword: string,
  requestedPage: number,
): Promise<InitialLibraryData> {
  const normalizedKeyword = String(keyword || '').trim();
  const { browseMode, pageSize, firstPages, maxPage } = await getLibraryBounds(normalizedKeyword);
  // 第 2 页起要按第 1 页集合去重：多个浏览词并发时，同一款游戏可能在第 1 页
  // 从 A 词进入、在第 2 页从 B 词再次出现，否则分页链接集合与首页高度重叠，
  // 分页对爬虫没有增量价值。第 1 页结果来自 getLibraryBounds，不重复请求。
  const resultGroups = await Promise.all(
    firstPages.map(async ({ query, result: firstPage }) => {
      if (requestedPage === 1) {
        return firstPage ? [firstPage] : [];
      }
      const [first, current] = await Promise.all([
        firstPage
          ? Promise.resolve(firstPage)
          : fetchLibraryQuery(query, pageSize, 1, browseMode),
        fetchLibraryQuery(query, pageSize, requestedPage, browseMode),
      ]);
      return [first, current].filter(
        (result): result is LibraryQueryResult => result !== null,
      );
    }),
  );
  const results = resultGroups.map((group) => group[group.length - 1] ?? null);
  const successfulResults = results.filter((result): result is LibraryQueryResult => result !== null);

  if (successfulResults.length === 0) {
    const fallbackGames = browseMode ? await getHomeFallbackGames() : [];
    return {
      games: fallbackGames,
      hasMorePages: false,
      ready: fallbackGames.length > 0,
      page: 1,
      totalPages: 1,
    };
  }

  const firstPageKeys = new Set<string>();
  if (requestedPage > 1) {
    resultGroups.forEach((group) => {
      const firstPageResult = group[0];
      if (!firstPageResult) return;
      firstPageResult.list.forEach((game) => {
        const key = String(game.pkg || game._id || '').trim();
        if (key) firstPageKeys.add(key);
      });
    });
  }

  const gamesByKey = new Map<string, ApiGame>();
  successfulResults.forEach((result) => {
    result.list.forEach((game) => {
      const key = String(game.pkg || game._id || '').trim();
      if (!key || firstPageKeys.has(key) || gamesByKey.has(key)) return;
      gamesByKey.set(key, game);
    });
  });

  // 浏览模式会并发查询多个词，每个词的分页进度独立；可翻页数取各词的最大页数。
  const responsePage = successfulResults.reduce(
    (max, result) => Math.max(max, result.page),
    requestedPage,
  );

  return {
    games: Array.from(gamesByKey.values()),
    hasMorePages: successfulResults.some(
      (result) => result.total > result.page * result.pageSize,
    ),
    ready: true,
    page: Math.max(1, responsePage),
    totalPages: Math.max(1, maxPage),
  };
}

function buildLibraryPageHref(page: number, keyword: string, category: string): string {
  const params = new URLSearchParams();
  if (keyword) params.set('q', keyword);
  if (category && category !== 'all') params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const queryString = params.toString();
  return queryString ? `/app?${queryString}` : '/app';
}

function getPaginationWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [];
  const windowSize = PAGINATION_WINDOW_RADIUS * 2 + 1;
  let start = Math.max(1, currentPage - PAGINATION_WINDOW_RADIUS);
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function LibraryPagination({
  currentPage,
  totalPages,
  keyword,
  category,
}: {
  currentPage: number;
  totalPages: number;
  keyword: string;
  category: string;
}) {
  const pages = getPaginationWindow(currentPage, totalPages);
  if (pages.length <= 1) return null;

  const itemClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary';
  const activeClass = 'border-primary bg-primary text-white hover:text-white';
  const disabledClass = 'cursor-not-allowed opacity-40 hover:border-border/70 hover:text-muted-foreground';

  return (
    <nav aria-label="游戏库分页" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 ? (
        <a href={buildLibraryPageHref(currentPage - 1, keyword, category)} rel="prev" className={itemClass}>
          上一页
        </a>
      ) : (
        <span aria-disabled="true" className={`${itemClass} ${disabledClass}`}>
          上一页
        </span>
      )}
      {pages.map((pageNumber) => (
        <a
          key={pageNumber}
          href={buildLibraryPageHref(pageNumber, keyword, category)}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          className={`${itemClass} ${pageNumber === currentPage ? activeClass : ''}`}
        >
          {pageNumber}
        </a>
      ))}
      {currentPage < totalPages ? (
        <a href={buildLibraryPageHref(currentPage + 1, keyword, category)} rel="next" className={itemClass}>
          下一页
        </a>
      ) : (
        <span aria-disabled="true" className={`${itemClass} ${disabledClass}`}>
          下一页
        </span>
      )}
    </nav>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<GamesPageSearchParams>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const page = parsePageParam(params?.page);
  const pageTitleSuffix = page > 1 ? `（第 ${page} 页）` : '';
  const title = `${siteName} 游戏库 - 热门安卓游戏与应用下载${pageTitleSuffix}`;
  const description = buildSeoDescription(
    '浏览 APKScc 游戏库，发现热门国际服与精品安卓游戏、应用下载资源',
    [
      '支持按分类、评分、关键词和热度快速筛选作品',
      '每个详情页提供 APK 版本、更新时间、截图素材、资源入口和社区反馈，方便比较近期值得安装与持续关注的内容',
      '适合查找国际服手游、热门应用、二次元 RPG、射击竞技、MMO、休闲益智和更新活跃的安卓资源',
    ],
  );
  const shareImage = String(config?.basic?.share_image || '').trim();
  const hasQuery = Boolean(
    String(params?.q || '').trim() ||
    String(params?.category || '').trim(),
  );
  // 第 1 页归一到 /app；从第 2 页起内容已经不同，canonical 自引用。
  const canonicalPath = page > 1 ? `/app?page=${page}` : '/app';

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

const APP_TOPIC_CLUSTERS = [
  {
    title: '国际服手游推荐',
    description: '适合关注海外服、国际区版本和跨区体验的玩家，快速发现近期讨论度较高的热门作品。',
    href: '/app?q=国际服',
  },
  {
    title: '二次元手游合集',
    description: '围绕角色养成、剧情冒险和视觉风格整理，适合偏好二次元题材的用户继续深入筛选。',
    href: '/app?q=二次元',
  },
  {
    title: 'MMO 与多人联机',
    description: '聚焦大型多人在线、组队开荒和长期养成玩法，适合作为高黏性题材的搜索入口。',
    href: '/app?q=MMO',
  },
];

type GamesPageSearchParams = {
  q?: string;
  category?: string;
  page?: string;
};

function GameLibraryLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="游戏库内容加载中">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />

      <section className="animate-pulse rounded-2xl border bg-card p-6 shadow-sm">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="mt-4 max-w-3xl space-y-2.5">
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-11/12 rounded bg-muted" />
          <div className="h-3.5 w-4/5 rounded bg-muted" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-xl border bg-background/60 p-4">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[132px] animate-pulse gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="h-24 w-24 shrink-0 rounded-xl bg-muted" />
            <div className="min-w-0 flex-1 py-1">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-5 w-14 rounded-full bg-muted" />
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function GameLibraryContent({
  searchParams,
}: {
  searchParams: Promise<GamesPageSearchParams>;
}) {
  const params = await searchParams;
  const initialKeyword = String(params?.q || '').trim();
  const initialCategory = String(params?.category || '').trim() || 'all';
  const currentPage = parsePageParam(params?.page);
  const [config, initialLibraryData] = await Promise.all([
    getPublicSiteConfig(300),
    getInitialLibraryData(initialKeyword, currentPage),
  ]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const games = initialLibraryData.games.slice(0, GAME_JSONLD_PAGE_SIZE);
  const totalPages = initialLibraryData.totalPages;
  const canonicalPath = initialLibraryData.page > 1 ? `/app?page=${initialLibraryData.page}` : '/app';
  const prevPageHref =
    currentPage > 1 ? buildLibraryPageHref(currentPage - 1, initialKeyword, initialCategory) : '';
  const nextPageHref =
    currentPage < totalPages ? buildLibraryPageHref(currentPage + 1, initialKeyword, initialCategory) : '';

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 游戏库`,
    description: '热门安卓游戏与应用下载列表',
    inLanguage: 'zh-CN',
    url: absoluteUrl(canonicalPath),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 热门游戏列表`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(getGameHref(game)),
      // 结构化数据必须与页面可见内容一致：卡片渲染的是后台维护的中文名，
      // 这里再写 Google Play 原名会被判为「结构化数据与页面内容不符」。
      name: resolveGameName(game) || '热门游戏',
      image: String(game.header_image || game.icon || '').trim() || undefined,
    })),
  };

  return (
    <>
      {prevPageHref ? <link rel="prev" href={absoluteUrl(prevPageHref)} /> : null}
      {nextPageHref ? <link rel="next" href={absoluteUrl(nextPageHref)} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {games.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      ) : null}
      <Breadcrumbs items={[BREADCRUMB_ROOT, { name: '游戏库', href: '/app' }]} className="mb-4" />
      <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">{siteName} 游戏库</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {siteName} 游戏库收录热门安卓游戏、国际服手游、精品应用和高关注度资源，覆盖二次元、MMO、多人联机等常见题材。你可以按分类、关键词和评分筛选目标作品，再进入详情页查看版本信息、游戏截图、安装说明、下载入口与社区讨论。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {APP_TOPIC_CLUSTERS.map((item) => (
            <a key={item.title} href={item.href} className="rounded-xl border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </div>
      </section>
      <AppLibraryView
        key={`${initialKeyword}:${initialCategory}:${initialLibraryData.page}`}
        initialKeyword={initialKeyword}
        initialCategory={initialCategory}
        initialGames={initialLibraryData.games}
        initialHasMorePages={initialLibraryData.hasMorePages}
        initialDataReady={initialLibraryData.ready}
        initialPage={initialLibraryData.page}
      />
      <LibraryPagination
        currentPage={initialLibraryData.page}
        totalPages={totalPages}
        keyword={initialKeyword}
        category={initialCategory}
      />
    </>
  );
}

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<GamesPageSearchParams>;
}) {
  const params = await searchParams;
  const currentPage = parsePageParam(params?.page);
  // 越界页返回真实 404：页面上限取各浏览词结果集的真实最大页，不再用固定 500 兜底。
  // 判定放在 Suspense 之外，响应尚未开始流式输出，状态码才改得掉。
  if (currentPage > 1) {
    const bounds = await getLibraryBounds(String(params?.q || '').trim());
    if (bounds.ready && currentPage > bounds.maxPage) {
      notFound();
    }
  }
  return (
    <Suspense fallback={<GameLibraryLoading />}>
      <GameLibraryContent searchParams={searchParams} />
    </Suspense>
  );
}
