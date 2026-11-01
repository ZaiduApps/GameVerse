import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Star } from 'lucide-react';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { trackedApiFetch } from '@/lib/api';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';
import {
  CATEGORY_PAGES,
  buildCategoryPath,
  categoryDisplayName,
  isCategoryQualified,
  resolveCategoryBySlug,
  type CategoryGame,
  type CategoryPagePayload,
} from '@/lib/category-pages';
import { resolveGameName } from '@/lib/game-display-name';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { absoluteUrl, buildSeoDescription } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

export const revalidate = 900;

const CATEGORY_REVALIDATE_SECONDS = 900;
const CATEGORY_PAGE_SIZE = 24;
const CATEGORY_API_TIMEOUT_MS = 6000;
const RELATED_CATEGORY_LIMIT = 12;
const PAGINATION_WINDOW_RADIUS = 3;
const FALLBACK_SITE_NAME = 'APKScc';

type CategorySearchParams = {
  page?: string;
};

type CategoryPageData = {
  /** 接口原样返回的分页体。 */
  payload: CategoryPagePayload;
  /** 有资源条数决定翻页范围。 */
  totalPages: number;
};

/**
 * 与 `/app` 同一口径：只做合法性归一，不设固定上限；真实的页面上限由结果集决定，
 * 越界页由调用方 404，不能让 501 页之后共用同一页正文和 canonical。
 */
function parsePageParam(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function getPaginationWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [];
  const windowSize = PAGINATION_WINDOW_RADIUS * 2 + 1;
  let start = Math.max(1, currentPage - PAGINATION_WINDOW_RADIUS);
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function formatDateText(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 列表里最近一次更新时间；后端按更新时间倒序，但历史数据不保证，取最大值。 */
function resolveLatestUpdate(list: CategoryGame[]): string {
  let newest = 0;
  for (const game of list) {
    const raw = game.latest_at || game.updated_at;
    if (!raw) continue;
    const time = new Date(raw).getTime();
    if (Number.isFinite(time) && time > newest) newest = time;
  }
  return newest > 0 ? formatDateText(new Date(newest).toISOString()) : '';
}

function getGameHref(game: CategoryGame): string {
  const target = String(game.pkg || game._id || '').trim();
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

/**
 * 分类落地页的数据判定：
 * - `missing`：未知 slug / 接口 code 400（分类不存在）/ 未达收录阈值 / 页码越界 → 404；
 * - 其它任何失败（code 502、非 2xx、超时、网络异常）→ 抛错进 error boundary（5xx）。
 *
 * 「暂时失败」绝不能写成 404：上游抖一下就把整个分类从索引里摘掉，恢复后还要等爬虫重来。
 */
type CategoryLoadResult = { kind: 'ok'; data: CategoryPageData } | { kind: 'missing' };

const loadCategoryPage = cache(async (slug: string, page: number): Promise<CategoryLoadResult> => {
  const category = resolveCategoryBySlug(slug);
  if (!category) return { kind: 'missing' };

  const params = new URLSearchParams({
    name: category.name,
    page: String(page),
    pageSize: String(CATEGORY_PAGE_SIZE),
  });

  let json: unknown;
  try {
    const response = await trackedApiFetch(`/game/category?${params.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: CATEGORY_REVALIDATE_SECONDS },
      timeoutMs: CATEGORY_API_TIMEOUT_MS,
      logKey: 'category-page',
    });
    if (!response.ok) {
      throw new Error(`分类列表接口失败: status=${response.status}`);
    }
    json = await response.json();
  } catch (error) {
    console.error('[category-page] 分类列表请求失败', {
      slug,
      name: category.name,
      page,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  const payload = json as { code?: number; message?: string; data?: Partial<CategoryPagePayload> } | null;
  const code = payload?.code;
  if (code === 400) return { kind: 'missing' };
  if (code !== undefined && code !== 0) {
    throw new Error(`分类列表接口返回错误: code=${code} message=${payload?.message || ''}`);
  }

  const raw = payload?.data;
  if (!raw || typeof raw !== 'object') {
    throw new Error(`分类列表接口返回结构异常: slug=${slug}`);
  }

  const list = Array.isArray(raw.list) ? raw.list : [];
  const withResources = Number(raw.total ?? list.length);
  const publishedTotal = Number(raw.publishedTotal ?? 0);
  const responsePage = Math.max(1, Number(raw.page ?? page));
  const pageSize = Math.max(1, Number(raw.pageSize ?? CATEGORY_PAGE_SIZE));

  // 阈值判定只认这一份规则（与 sitemap 共用），不在这里另写数字。
  if (!isCategoryQualified({ published: publishedTotal, withResources })) {
    return { kind: 'missing' };
  }

  const totalPages = Math.max(1, Math.ceil(withResources / pageSize));
  if (responsePage > totalPages) return { kind: 'missing' };
  // 空页在阈值达标时只可能是越界（后端已按 page 返回），同样 404 而不是渲染空网格。
  if (list.length === 0 && responsePage > 1) return { kind: 'missing' };

  return {
    kind: 'ok',
    data: {
      payload: {
        list,
        total: withResources,
        page: responsePage,
        pageSize,
        publishedTotal,
      },
      totalPages,
    },
  };
});

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePageParam((await searchParams)?.page);
  const category = resolveCategoryBySlug(slug);
  if (!category) notFound();

  const result = await loadCategoryPage(slug, page);
  if (result.kind === 'missing') notFound();

  const [config, { payload }] = [await getPublicSiteConfig(300), result.data];
  const siteName = String(config?.basic?.site_name || FALLBACK_SITE_NAME).trim() || FALLBACK_SITE_NAME;
  const published = Number(payload.publishedTotal || payload.total || payload.list.length);
  const latestUpdate = resolveLatestUpdate(payload.list);
  const pageSuffix = page > 1 ? `（第 ${page} 页）` : '';

  const title = `${categoryDisplayName(category.name)}推荐（${published} 款）- ${siteName}${pageSuffix}`;
  const description = buildSeoDescription(
    `${category.name}分类共收录 ${published} 款已发布安卓游戏，其中 ${payload.total} 款提供可下载资源`,
    [
      latestUpdate ? `最近更新于 ${latestUpdate}` : null,
      `可按游戏名、版本与更新时间进入详情页查看下载渠道、截图与玩家评价`,
      `${siteName} ${category.name}游戏榜`,
    ],
  );

  // 第 1 页归一到 /category/<slug>；从第 2 页起内容已不同，canonical 自引用。
  const canonicalPath = buildCategoryPath(category.slug, page);

  return {
    title: { absolute: title },
    description,
    // 第 1 页是真正的分类入口，第 2 页起只是同一批游戏的翻页：跟进链接、不进索引。
    robots:
      page > 1
        ? { index: false, follow: true }
        : {
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
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

function CategoryGameCard({ game }: { game: CategoryGame }) {
  const name = resolveGameName(game);
  const summary = String(game.summary || '').trim();
  const icon = getPreviewImageUrl(game.icon, 160);
  const score = Number(game.star);

  return (
    <Link
      href={getGameHref(game)}
      className="flex min-h-[104px] gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-colors [@media(hover:hover)]:hover:border-primary/40"
    >
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
        {icon ? (
          <Image src={icon} alt={`${name} 图标`} width={64} height={64} className="h-full w-full object-cover" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {summary || '查看游戏详情与下载渠道'}
        </span>
        {Number.isFinite(score) && score > 0 ? (
          <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 text-tone-amber" aria-hidden="true" />
            {score.toFixed(1)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function CategoryPagination({
  slug,
  currentPage,
  totalPages,
}: {
  slug: string;
  currentPage: number;
  totalPages: number;
}) {
  const pages = getPaginationWindow(currentPage, totalPages);
  if (pages.length <= 1) return null;

  const itemClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary';
  const activeClass = 'border-primary bg-primary text-white hover:text-white';
  const disabledClass = 'cursor-not-allowed opacity-40 hover:border-border/70 hover:text-muted-foreground';

  return (
    <nav aria-label="分类分页" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 ? (
        <a href={buildCategoryPath(slug, currentPage - 1)} rel="prev" className={itemClass}>
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
          href={buildCategoryPath(slug, pageNumber)}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          className={`${itemClass} ${pageNumber === currentPage ? activeClass : ''}`}
        >
          {pageNumber}
        </a>
      ))}
      {currentPage < totalPages ? (
        <a href={buildCategoryPath(slug, currentPage + 1)} rel="next" className={itemClass}>
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CategorySearchParams>;
}) {
  const { slug } = await params;
  const page = parsePageParam((await searchParams)?.page);
  const category = resolveCategoryBySlug(slug);
  if (!category) notFound();

  const result = await loadCategoryPage(slug, page);
  if (result.kind === 'missing') notFound();

  const { payload, totalPages } = result.data;
  const published = Number(payload.publishedTotal || payload.total || payload.list.length);
  const latestUpdate = resolveLatestUpdate(payload.list);
  const prevHref = payload.page > 1 ? buildCategoryPath(slug, payload.page - 1) : '';
  const nextHref = payload.page < totalPages ? buildCategoryPath(slug, payload.page + 1) : '';
  const otherCategories = CATEGORY_PAGES.filter((item) => item.slug !== slug).slice(0, RELATED_CATEGORY_LIMIT);

  return (
    <div className="container mx-auto px-4 py-6">
      {prevHref ? <link rel="prev" href={absoluteUrl(prevHref)} /> : null}
      {nextHref ? <link rel="next" href={absoluteUrl(nextHref)} /> : null}

      <Breadcrumbs
        items={[BREADCRUMB_ROOT, { name: '游戏库', href: '/app' }, { name: category.name }]}
        className="mb-4"
      />

      <section className="mb-8 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          {categoryDisplayName(category.name)}推荐{payload.page > 1 ? `（第 ${payload.page} 页）` : ''}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {category.name}分类共收录 {published} 款已发布安卓游戏，其中 {payload.total} 款提供可下载资源
          {latestUpdate ? `，最近更新于 ${latestUpdate}` : ''}
          。列表按评分与更新时间排列，点进详情页可以核对版本、安装包大小、下载渠道与玩家评价，再决定是否安装。
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          想看其它题材可以回到
          <Link href="/app" className="mx-1 font-semibold text-primary hover:underline">
            游戏库
          </Link>
          按关键词或分类筛选，也可以直接看
          <Link href="/rankings" className="mx-1 font-semibold text-primary hover:underline">
            排行榜
          </Link>
          。
        </p>
      </section>

      {payload.list.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {payload.list.map((game) => (
            <CategoryGameCard key={String(game._id || game.pkg)} game={game} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          这个分类暂时没有可展示的游戏，可以先回到
          <Link href="/app" className="mx-1 font-semibold text-primary hover:underline">
            游戏库
          </Link>
          看看其它作品。
        </p>
      )}

      <CategoryPagination slug={slug} currentPage={payload.page} totalPages={totalPages} />

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-foreground">其它热门分类</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherCategories.map((item) => (
            <Link
              key={item.slug}
              href={buildCategoryPath(item.slug)}
              className="inline-flex min-h-9 items-center rounded-full border border-border/70 bg-card px-3 text-sm text-muted-foreground transition-colors [@media(hover:hover)]:hover:border-primary/40 [@media(hover:hover)]:hover:text-primary"
            >
              {categoryDisplayName(item.name)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
