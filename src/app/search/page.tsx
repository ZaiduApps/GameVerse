import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { cache } from 'react';
import { FileText, Gamepad2, Hash, MessageSquare, Search as SearchIcon } from 'lucide-react';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';
import { searchGlobal, type GlobalSearchResult, type GlobalSearchSection } from '@/lib/search-api';
import { SEARCH_PAGE_TIER, buildSearchQueryPath, findWhitelistedSearchQuery, resolveSearchPageTier } from '@/lib/search-indexable.mjs';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { SearchResult } from '@/types';

// 搜索结果取决于 query，不能静态化；爬虫页与用户页都要拿到真实 SSR HTML。
export const dynamic = 'force-dynamic';

const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_LENGTH = 60;
const SEARCH_LIMIT_PER_TYPE = 12;
const FALLBACK_ICON = '/favicon.ico';

const RESULT_GROUPS = [
  { key: 'games', label: '游戏', icon: Gamepad2, tone: 'text-tone-blue' },
  { key: 'articles', label: '资讯', icon: FileText, tone: 'text-tone-amber' },
  { key: 'posts', label: '帖子', icon: MessageSquare, tone: 'text-tone-green' },
  { key: 'topics', label: '话题', icon: Hash, tone: 'text-tone-cyan' },
] as const;

function normalizeKeyword(input: string | undefined): string {
  return String(input || '')
    .trim()
    .slice(0, SEARCH_MAX_LENGTH);
}

function getResultHref(item: SearchResult): string {
  if (item.href) return item.href;
  if (item.type === 'game') {
    const target = String(item.pkg || item.id || '').trim();
    return target ? `/app/${encodeURIComponent(target)}` : '/app';
  }
  if (item.type === 'topic') return `/community/topic/${encodeURIComponent(item.id)}`;
  return `/community/post/${encodeURIComponent(item.id)}`;
}

function getSection(result: GlobalSearchResult | null, key: (typeof RESULT_GROUPS)[number]['key']): GlobalSearchSection {
  return result?.[key] ?? { list: [], total: 0 };
}

/**
 * 同一个请求里 generateMetadata 与页面本体都要结果量（决定收录分级），
 * 用 React cache 去重，别让一次搜索渲染打两次后端。
 */
const loadSearchResult = cache(async (keyword: string): Promise<GlobalSearchResult | null> => {
  try {
    return await searchGlobal({ q: keyword, limitPerType: SEARCH_LIMIT_PER_TYPE });
  } catch {
    // 搜索是自助入口，上游抖动时退化成本页空态 + 明确提示，不把整页打成 500。
    return null;
  }
});

/**
 * 收录分级（规则见 src/lib/search-indexable.mjs）：
 *  - 白名单词且结果够厚 → index,follow + canonical 自指；
 *  - 单实体 → noindex,follow + canonical 指向详情页，把信号让给详情页；
 *  - 其余 → noindex,follow + canonical 自指。
 */
function resolveSearchPageMetadata(keyword: string, result: GlobalSearchResult | null) {
  const tier = resolveSearchPageTier(keyword, result?.games.total ?? 0, result?.total ?? 0);
  const singleEntity = tier === SEARCH_PAGE_TIER.SINGLE_ENTITY ? result?.games.list[0] : undefined;
  // 可收录页统一指向白名单里的规范写法，大小写/空白变体不各自成一个 URL。
  const whitelisted = tier === SEARCH_PAGE_TIER.INDEXABLE ? findWhitelistedSearchQuery(keyword) : null;
  return {
    tier,
    indexable: tier === SEARCH_PAGE_TIER.INDEXABLE,
    canonicalPath: singleEntity
      ? getResultHref(singleEntity)
      : buildSearchQueryPath(whitelisted || keyword),
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const keyword = normalizeKeyword(params?.q);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = keyword ? `在 ${siteName} 搜索「${keyword}」` : `站内搜索 - ${siteName}`;
  const description = keyword
    ? `在 ${siteName} 站内搜索「${keyword}」，查看相关的安卓游戏、资讯、帖子与话题。`
    : `在 ${siteName} 站内搜索安卓游戏、资讯、帖子与话题。`;
  const result = keyword.length >= SEARCH_MIN_LENGTH ? await loadSearchResult(keyword) : null;
  const { indexable, canonicalPath } = resolveSearchPageMetadata(keyword, result);

  return {
    title: { absolute: title },
    description,
    // 白名单 + 结果够厚才放 index；其余一律 noindex，但保留 follow 让爬虫顺着结果继续发现内容。
    robots: {
      index: indexable,
      follow: true,
    },
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const keyword = normalizeKeyword(params?.q);
  const shouldQuery = keyword.length >= SEARCH_MIN_LENGTH;

  const result = shouldQuery ? await loadSearchResult(keyword) : null;
  const failed = shouldQuery && result === null;

  const totalCount = RESULT_GROUPS.reduce((sum, group) => sum + getSection(result, group.key).total, 0);

  return (
    <div className="fade-in space-y-6">
      <Breadcrumbs items={[BREADCRUMB_ROOT, { name: '搜索', href: '/search' }]} />

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center">
          <SearchIcon className="mr-3 h-6 w-6 text-tone-blue" />
          <h1 className="text-xl font-semibold text-foreground">
            {keyword ? `搜索「${keyword}」` : '站内搜索'}
          </h1>
        </div>
        <form action="/search" method="get" className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="search-page-keyword" className="sr-only">
            搜索关键词
          </label>
          <Input
            id="search-page-keyword"
            type="search"
            name="q"
            defaultValue={keyword}
            placeholder="搜索游戏、资讯、帖子、话题"
            autoComplete="off"
            maxLength={SEARCH_MAX_LENGTH}
            className="h-10 sm:flex-1"
          />
          <Button type="submit" className="btn-interactive h-10">
            搜索
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">至少输入 {SEARCH_MIN_LENGTH} 个字符开始搜索。</p>
      </section>

      {!shouldQuery ? (
        <section className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          {keyword ? '关键词太短，请输入至少 2 个字符。' : '输入关键词后即可查看站内游戏、资讯、帖子与话题的搜索结果。'}
        </section>
      ) : failed ? (
        <section className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground shadow-sm">
          搜索服务暂时不可用，请稍后重试。
        </section>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                「{keyword}」共 {totalCount} 条结果
              </>
            ) : (
              <>
                「{keyword}」未找到相关结果，可以换一个关键词，或到{' '}
                <Link href="/submit-resource" prefetch={false} className="font-semibold text-primary hover:underline">
                  提交资源
                </Link>{' '}
                告诉我们。
              </>
            )}
          </p>

          {RESULT_GROUPS.map((group) => {
            const section = getSection(result, group.key);
            if (section.list.length === 0) return null;
            const Icon = group.icon;

            return (
              <div key={group.key} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
                <h2 className="mb-3 flex items-center text-base font-semibold text-foreground">
                  <Icon className={`mr-2 h-4 w-4 ${group.tone}`} />
                  {group.label}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{section.total} 条</span>
                </h2>
                <ul className="space-y-1">
                  {section.list.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={getResultHref(item)}
                        prefetch={false}
                        className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
                      >
                        <Image
                          src={item.imageUrl || FALLBACK_ICON}
                          alt={item.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-md object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-semibold text-foreground">{item.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {item.subtitle || item.category}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
