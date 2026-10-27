import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense, cache } from 'react';

import CommunityPageView, { type CommunityPageInitialData } from './CommunityPageView';
import { absoluteUrl, buildSeoDescription } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getCommunityFeedOrThrow, getCommunityTopics, type CommunityFeedResult } from '@/lib/community-api';

const COMMUNITY_JSONLD_LIMIT = 12;
// 首屏要在 SSR HTML 里带出足够多的帖子内链：20 条帖子每条至少输出一个详情链接，
// 满足搜索引擎对列表页可发现性的最低要求；JSON-LD 仍只取前 12 条。
// 后端会过滤掉一部分帖子（本地实测 24 条里返回 20–22 条），所以请求 24 条、
// 保证每页 SSR 出的真实帖子数仍 ≥20。分页大小必须与前端「加载更多」一致。
const COMMUNITY_SSR_FEED_PAGE_SIZE = 24;
const COMMUNITY_PAGINATION_WINDOW_RADIUS = 3;
const COMMUNITY_PAGE_DESCRIPTION = buildSeoDescription(
  '浏览 APKScc 社区最新帖子、热门话题、安卓游戏讨论、攻略分享、资源反馈、版本体验和玩家互动动态',
  [
    '查看玩家围绕游戏下载、安装更新、账号登录、机型兼容、网络稳定性和资源可用性的真实反馈',
    '持续发现值得关注的游戏内容、实用经验、评论回复、外部链接、图片线索和社区交流记录，便于跟踪资源变化与玩家反馈',
  ],
);

function clamp(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, Math.max(1, max - 3)).trim()}...`;
}

// 这个 Suspense 边界不能删。背景：b7d3686 为修「notFound() 遇到段级 Suspense 会把
// 响应 flush 成 200」的软 404 缺陷，故意删掉了 src/app/community/loading.tsx，
// 而 loading.tsx 提供的隐式边界正是本页 useSearchParams() 过去能通过预渲染的原因。
// 边界删掉后 next build 会在预渲染阶段直接失败（missing-suspense-with-csr-bailout）。
// 现在页面读取 searchParams 后按请求动态渲染，首屏 feed 会真实输出帖子链接；
// 边界继续保留，既兜住 useSearchParams 的 CSR 回退，也不把 loading.tsx 加回来。
// 骨架按 CommunityPageView 的三栏栅格 1:1 复刻以避免 hydration 位移。
function CommunityPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="正在加载社区动态"
      className="mx-auto w-full max-w-[1440px] px-2 py-4 sm:px-4 sm:py-6 lg:py-8"
    >
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,720px)_320px]">
        <div className="hidden lg:block">
          <div className="h-96 animate-pulse rounded-2xl bg-[#dadddf]/40" />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-[#dadddf]/40" />
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-[#dadddf]/40" />
          ))}
        </div>
        <div className="hidden xl:block">
          <div className="h-80 animate-pulse rounded-2xl bg-[#dadddf]/40" />
        </div>
      </div>
    </div>
  );
}

const EMPTY_FEED: CommunityFeedResult = {
  list: [],
  total: 0,
  page: 1,
  pageSize: COMMUNITY_SSR_FEED_PAGE_SIZE,
  hasMore: false,
};

const getCommunityPageData = cache(async (feedKeyword: string, feedPage: number): Promise<{
  config: Awaited<ReturnType<typeof getPublicSiteConfig>>;
  initialData: CommunityPageInitialData;
}> => {
  const keyword = String(feedKeyword || '').trim();
  // 列表流用 OrThrow 变体：只有上游明确 404 才是「列表不存在」，5xx / 超时 / 网络异常
  // 会抛给 error.tsx / 500，不再折叠成 total: 0 的空列表——那会连带把已收录的分页 URL
  // 判成越界并打成永久 404。
  const [config, latestFeed, hotFeed, topics] = await Promise.all([
    getPublicSiteConfig(300),
    getCommunityFeedOrThrow('latest', {
      page: feedPage,
      pageSize: COMMUNITY_SSR_FEED_PAGE_SIZE,
      q: keyword || undefined,
    }),
    getCommunityFeedOrThrow('hot', {
      page: 1,
      pageSize: COMMUNITY_SSR_FEED_PAGE_SIZE,
      q: keyword || undefined,
    }),
    getCommunityTopics({ page: 1, pageSize: COMMUNITY_JSONLD_LIMIT, sort: 'hot' }),
  ]);

  // 最新流明确 404：维持 404 语义（不是故障，也不渲染空列表）。
  if (!latestFeed) {
    notFound();
  }

  return {
    config,
    initialData: {
      latestFeed,
      // 热门流 404 不影响主列表，退化成空侧栏即可。
      hotFeed: hotFeed ?? EMPTY_FEED,
      topics: topics.list || [],
    },
  };
});

type CommunityPageSearchParams = {
  q?: string;
  topicName?: string;
  page?: string;
};

/** 页面读取 searchParams 后路由按请求动态渲染，useSearchParams 才能在 SSR 阶段拿到真实值。 */
function resolveFeedKeyword(params: CommunityPageSearchParams | undefined): string {
  return String(params?.q || params?.topicName || '').trim();
}

/** 只做合法性归一；页面上限由 feed 的 total 决定，越界在页面组件里返回 404。 */
function parseFeedPageParam(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

function buildCommunityPageHref(page: number, keyword: string): string {
  const params = new URLSearchParams();
  if (keyword) params.set('q', keyword);
  if (page > 1) params.set('page', String(page));
  const queryString = params.toString();
  return queryString ? `/community?${queryString}` : '/community';
}

function getCommunityPaginationWindow(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 1) return [];
  const windowSize = COMMUNITY_PAGINATION_WINDOW_RADIUS * 2 + 1;
  let start = Math.max(1, currentPage - COMMUNITY_PAGINATION_WINDOW_RADIUS);
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

// 分页锚点必须在 SSR HTML 里：社区帖子过去只能靠 sitemap 发现，爬虫从列表页
// 走不到第 2 页以后的内容。用普通 <a>（不是 Link），第 N 页是一次完整请求，
// 保证首屏帖子、canonical 和状态码都由服务端给出。
function CommunityPagination({
  currentPage,
  totalPages,
  keyword,
}: {
  currentPage: number;
  totalPages: number;
  keyword: string;
}) {
  const pages = getCommunityPaginationWindow(currentPage, totalPages);
  if (pages.length <= 1) return null;

  const itemClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-border/70 bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary';
  const activeClass = 'border-primary bg-primary text-white hover:text-white';
  const disabledClass = 'cursor-not-allowed opacity-40 hover:border-border/70 hover:text-muted-foreground';

  return (
    <nav aria-label="社区帖子分页" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {currentPage > 1 ? (
        <a href={buildCommunityPageHref(currentPage - 1, keyword)} rel="prev" className={itemClass}>
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
          href={buildCommunityPageHref(pageNumber, keyword)}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
          className={`${itemClass} ${pageNumber === currentPage ? activeClass : ''}`}
        >
          {pageNumber}
        </a>
      ))}
      {currentPage < totalPages ? (
        <a href={buildCommunityPageHref(currentPage + 1, keyword)} rel="next" className={itemClass}>
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
  searchParams: Promise<CommunityPageSearchParams>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const feedKeyword = resolveFeedKeyword(params);
  const page = parseFeedPageParam(params?.page);
  const pageTitleSuffix = page > 1 && !feedKeyword ? `（第 ${page} 页）` : '';
  const title = `${siteName} 社区 - 安卓游戏讨论、攻略分享与资源反馈动态${pageTitleSuffix}`;
  const description = COMMUNITY_PAGE_DESCRIPTION;
  const shareImage = String(config?.basic?.share_image || '').trim();
  // 第 1 页归一到 /community；从第 2 页起内容不同，canonical 自引用。
  // 关键词检索页（?q=）是用户生成的搜索结果，不收录也不给分页页做自引用：
  // canonical 指回 /community，并整体 noindex,follow。
  const canonicalPath = page > 1 && !feedKeyword ? `/community?page=${page}` : '/community';

  return {
    title: { absolute: title },
    description,
    robots: feedKeyword
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
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: `${siteName} 社区` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<CommunityPageSearchParams>;
}) {
  const params = await searchParams;
  const feedKeyword = resolveFeedKeyword(params);
  const feedPage = parseFeedPageParam(params?.page);
  const { config, initialData } = await getCommunityPageData(feedKeyword, feedPage);

  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const postList = Array.isArray(initialData.latestFeed?.list) ? initialData.latestFeed.list : [];
  const jsonLdPosts = postList.slice(0, COMMUNITY_JSONLD_LIMIT);
  const topicList = Array.isArray(initialData.topics) ? initialData.topics : [];
  const feedTotal = Math.max(0, Number(initialData.latestFeed?.total || 0));
  const feedPageSize = Math.max(1, Number(initialData.latestFeed?.pageSize || COMMUNITY_SSR_FEED_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(feedTotal / feedPageSize));
  // 越界页没有帖子可显示，返回真实 404，而不是 200 + 空列表 + 自引用 canonical。
  // 判定写在 Suspense 之外，响应尚未开始流式输出，状态码才改得掉。
  if (feedPage > totalPages) {
    notFound();
  }
  const canonicalPath = feedPage > 1 && !feedKeyword ? `/community?page=${feedPage}` : '/community';

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 社区`,
    description: COMMUNITY_PAGE_DESCRIPTION,
    inLanguage: 'zh-CN',
    url: absoluteUrl(canonicalPath),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  const postItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 社区最新帖子`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: jsonLdPosts.length,
    itemListElement: jsonLdPosts.map((post, index) => {
      const postTitle = clamp(String(post.title || post.summary || '社区帖子').trim(), 80);
      const postSummary = clamp(String(post.summary || post.content || '').trim(), 180);
      const postUrl = absoluteUrl(`/community/post/${encodeURIComponent(post.id)}`);
      return {
        '@type': 'ListItem',
        position: index + 1,
        url: postUrl,
        name: postTitle,
        description: postSummary || undefined,
        image: post.imageUrl || undefined,
      };
    }),
  };

  const topicItemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 社区热门话题`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: topicList.length,
    itemListElement: topicList.map((topic, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/community/topic/${encodeURIComponent(String(topic.slug || topic._id || '').trim())}`),
      name: String(topic.name || '社区话题').trim(),
      description: clamp(String(topic.description || '').trim(), 140) || undefined,
      image: String(topic.icon || topic.cover || '').trim() || undefined,
    })),
  };

  return (
    <>
      {feedPage > 1 ? (
        <link rel="prev" href={absoluteUrl(buildCommunityPageHref(feedPage - 1, feedKeyword))} />
      ) : null}
      {feedPage < totalPages ? (
        <link rel="next" href={absoluteUrl(buildCommunityPageHref(feedPage + 1, feedKeyword))} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      {postList.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(postItemListJsonLd) }}
        />
      ) : null}
      {topicList.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(topicItemListJsonLd) }}
        />
      ) : null}
      <Suspense fallback={<CommunityPageSkeleton />}>
        <CommunityPageView initialData={initialData} />
      </Suspense>
      <div className="mx-auto w-full max-w-[1440px] px-2 pb-8 sm:px-4">
        <CommunityPagination currentPage={feedPage} totalPages={totalPages} keyword={feedKeyword} />
      </div>
    </>
  );
}
