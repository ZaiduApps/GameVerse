'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CommunityTopicItem } from '@/lib/community-api';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Hash, Search, Sparkles, Star } from 'lucide-react';

type TopicSort = 'hot' | 'new';

interface TopicPageResult {
  list: CommunityTopicItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface TopicSection {
  id: 'hot' | 'official' | 'new';
  title: string;
  description: string;
  icon: 'hot' | 'official' | 'new';
  result: TopicPageResult;
  pageParam: 'hotPage' | 'officialPage' | 'newPage';
}

interface CommunityTopicsPageViewProps {
  q: string;
  sort: TopicSort;
  searchResult: TopicPageResult | null;
  sections: TopicSection[];
}

const TOPIC_PAGE_SIZE = 16;

function getTopicHref(topic: CommunityTopicItem): string {
  const target = String(topic.slug || topic._id || '').trim();
  return target ? `/community/topic/${encodeURIComponent(target)}` : '/community/topics';
}

function getTopicIcon(topic: CommunityTopicItem): string {
  return String(topic.icon || topic.app_info?.icon || '').trim();
}

function buildQuery(
  base: Record<string, string | number | undefined>,
  patch: Record<string, string | number | undefined>,
): string {
  const merged = { ...base, ...patch };
  const hasKeyword = Boolean(String(merged.q ?? '').trim());
  const params = new URLSearchParams();
  Object.entries(merged).forEach(([key, value]) => {
    const raw = String(value ?? '').trim();
    if (!raw) return;
    if ((key === 'page' || key.endsWith('Page')) && raw === '1') return;
    if (key === 'sort' && raw === 'hot' && !hasKeyword) return;
    params.set(key, raw);
  });
  const query = params.toString();
  return query ? `/community/topics?${query}` : '/community/topics';
}

function SectionIcon({ type }: { type: TopicSection['icon'] }) {
  if (type === 'official') return <Star className="h-4 w-4 text-sky-600" />;
  if (type === 'new') return <Sparkles className="h-4 w-4 text-emerald-600" />;
  return <Flame className="h-4 w-4 text-orange-500" />;
}

function TopicIcon({
  topic,
  failed,
  onError,
}: {
  topic: CommunityTopicItem;
  failed: boolean;
  onError: () => void;
}) {
  const icon = getTopicIcon(topic);
  if (icon && !failed) {
    return (
      <Image
        src={icon}
        alt={topic.name}
        width={64}
        height={64}
        className="h-14 w-14 rounded-lg object-cover shadow-sm sm:h-16 sm:w-16"
        onError={onError}
      />
    );
  }

  return (
    <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground sm:h-16 sm:w-16">
      <Hash className="h-6 w-6" />
    </span>
  );
}

function TopicGrid({
  topics,
  emptyText,
}: {
  topics: CommunityTopicItem[];
  emptyText: string;
}) {
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedIcons({});
  }, [topics]);

  if (!topics.length) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {topics.slice(0, TOPIC_PAGE_SIZE).map((topic) => {
        const topicId = String(topic._id || '').trim();
        const topicKey = topicId || String(topic.slug || topic.name || '').trim();
        return (
          <Link
            key={topicKey}
            href={getTopicHref(topic)}
            className="group flex min-h-[132px] flex-col items-center justify-between rounded-lg border bg-card px-2 py-3 text-center transition hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[148px] sm:px-3"
          >
            <TopicIcon
              topic={topic}
              failed={Boolean(failedIcons[topicKey])}
              onError={() => setFailedIcons((prev) => ({ ...prev, [topicKey]: true }))}
            />
            <span className="mt-2 line-clamp-2 h-10 w-full text-xs font-semibold leading-5 text-foreground group-hover:text-primary sm:text-sm">
              {topic.name || '社区话题'}
            </span>
            <span className="mt-1 flex w-full items-center justify-center gap-1 truncate text-[10px] text-muted-foreground sm:text-[11px]">
              <span>热度 {Number(topic.heat_score || 0)}</span>
              <span>·</span>
              <span>{Number(topic.post_count || 0)} 帖</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function Pager({
  page,
  total,
  pageSize,
  previousHref,
  nextHref,
}: {
  page: number;
  total: number;
  pageSize: number;
  previousHref: string;
  nextHref: string;
}) {
  const safePage = Math.max(1, Number(page || 1));
  const safePageSize = Math.max(1, Number(pageSize || TOPIC_PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(Math.max(0, Number(total || 0)) / safePageSize));
  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        第 {safePage} / {totalPages} 页 · 共 {Math.max(0, Number(total || 0))} 个话题
      </span>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className={cn(!hasPrevious && 'pointer-events-none opacity-50')}>
          <Link href={previousHref} aria-disabled={!hasPrevious}>
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className={cn(!hasNext && 'pointer-events-none opacity-50')}>
          <Link href={nextHref} aria-disabled={!hasNext}>
            下一页
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TopicSectionCard({
  section,
  baseQuery,
}: {
  section: TopicSection;
  baseQuery: Record<string, string | number | undefined>;
}) {
  const page = Math.max(1, Number(section.result.page || 1));
  return (
    <section className="min-w-0">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-semibold sm:text-lg">
              <SectionIcon type={section.icon} />
              {section.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{section.description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {section.result.total}
          </Badge>
        </div>
      </div>
      <TopicGrid topics={section.result.list} emptyText={`暂无${section.title}`} />
      <Pager
        page={page}
        total={section.result.total}
        pageSize={section.result.pageSize}
        previousHref={buildQuery(baseQuery, { [section.pageParam]: Math.max(1, page - 1) })}
        nextHref={buildQuery(baseQuery, { [section.pageParam]: page + 1 })}
      />
    </section>
  );
}

export default function CommunityTopicsPageView({
  q,
  sort,
  searchResult,
  sections,
}: CommunityTopicsPageViewProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(q);
  const searchPage = Math.max(1, Number(searchResult?.page || 1));
  const hasSearch = Boolean(q);
  const baseModuleQuery = {
    hotPage: sections.find((item) => item.id === 'hot')?.result.page || 1,
    officialPage: sections.find((item) => item.id === 'official')?.result.page || 1,
    newPage: sections.find((item) => item.id === 'new')?.result.page || 1,
  };

  useEffect(() => {
    setKeyword(q);
  }, [q]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextKeyword = keyword.trim();
    router.push(buildQuery({}, { q: nextKeyword, sort, page: 1 }));
  }

  return (
    <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 overflow-x-hidden px-4 py-4 sm:py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[1180px]">
      <div className="mb-5 flex flex-col gap-4 rounded-lg border bg-card px-4 py-4 shadow-sm sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
              <Link href="/community">
                <ArrowLeft className="h-4 w-4" />
                返回社区
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">社区话题</h1>
            <p className="mt-1 text-sm text-muted-foreground">按热度、官方推荐和最新创建浏览玩家专题。</p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full min-w-0 flex-col gap-2 sm:max-w-md sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索话题"
                className="pl-9"
                maxLength={40}
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">搜索</Button>
          </form>
        </div>

        {hasSearch ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>搜索：#{q}</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/community/topics">清除搜索</Link>
            </Button>
          </div>
        ) : null}
      </div>

      {hasSearch && searchResult ? (
        <section className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold sm:text-lg">搜索结果</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">每页展示 16 个匹配话题。</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant={sort === 'hot' ? 'default' : 'outline'} size="sm">
                <Link href={buildQuery({}, { q, sort: 'hot', page: 1 })}>热门</Link>
              </Button>
              <Button asChild variant={sort === 'new' ? 'default' : 'outline'} size="sm">
                <Link href={buildQuery({}, { q, sort: 'new', page: 1 })}>最新</Link>
              </Button>
            </div>
          </div>
          <TopicGrid topics={searchResult.list} emptyText="暂无匹配话题" />
          <Pager
            page={searchPage}
            total={searchResult.total}
            pageSize={searchResult.pageSize}
            previousHref={buildQuery({}, { q, sort, page: Math.max(1, searchPage - 1) })}
            nextHref={buildQuery({}, { q, sort, page: searchPage + 1 })}
          />
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {sections.map((section) => (
            <TopicSectionCard key={section.id} section={section} baseQuery={baseModuleQuery} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
