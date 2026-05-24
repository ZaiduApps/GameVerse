'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CenterFilterBar from '../CenterFilterBar';
import { useAuth } from '@/context/auth-context';
import GameCard from '@/components/game-card';
import type { CommunityTopicItem } from '@/lib/community-api';
import { extractFollowedGamesFromTopics, getMyFollowedGameTopics } from '@/lib/profile-dashboard-api';
import CenterPageHeader from '../CenterPageHeader';

export default function ProfileCenterGamesPage() {
  const PAGE_SIZE = 12;
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topics, setTopics] = useState<CommunityTopicItem[]>([]);
  const [keyword, setKeyword] = useState(() => String(searchParams.get('q') || ''));
  const [sort, setSort] = useState(() => String(searchParams.get('sort') || 'latest'));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page') || 1)));
  const [pageSize, setPageSize] = useState(() => Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE)));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    async function load() {
      if (!token) return;
      setLoading(true);
      const pageFromUrl = Math.max(1, Number(searchParams.get('page') || 1));
      const pageSizeFromUrl = Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE));
      const res = await getMyFollowedGameTopics({ token, page: pageFromUrl, pageSize: pageSizeFromUrl });
      setTopics(res.list || []);
      setPage(pageFromUrl);
      setPageSize(pageSizeFromUrl);
      setTotal(Number(res.total || 0));
      setLoading(false);
    }
    if (isAuthenticated && token) {
      void load();
    }
  }, [isAuthLoading, isAuthenticated, router, searchParams, token]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const q = keyword.trim();
    if (q) params.set('q', q); else params.delete('q');
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (sort && sort !== 'latest') params.set('sort', sort); else params.delete('sort');
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname);
    }
  }, [keyword, page, pageSize, pathname, router, searchParams, sort]);

  const games = useMemo(() => {
    const list = extractFollowedGamesFromTopics(topics);
    const sorted = [...list].sort((a, b) => {
      if (sort === 'name') return String(a.title || '').localeCompare(String(b.title || ''));
      return String(b.updateDate || '').localeCompare(String(a.updateDate || ''));
    });
    if (!keyword.trim()) return sorted;
    const q = keyword.trim().toLowerCase();
    return sorted.filter((game) => `${game.title || ''} ${game.description || ''}`.toLowerCase().includes(q));
  }, [keyword, sort, topics]);
  const canLoadMore = topics.length < total;

  async function loadMore() {
    if (!token || loadingMore || !canLoadMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const res = await getMyFollowedGameTopics({ token, page: next, pageSize });
    setTopics((prev) => [...prev, ...res.list]);
    setPage(next);
    setTotal(Number(res.total || total));
    setLoadingMore(false);
  }

  if (isAuthLoading || loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-4 md:py-8">
      <CenterPageHeader title="我关注的游戏" description="从你关注的游戏社区自动聚合。" />
      <Card>
        <CardHeader>
          <CardTitle>我关注的游戏</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CenterFilterBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            pageSize={pageSize}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            sort={sort}
            sortOptions={[
              { label: '默认排序', value: 'latest' },
              { label: '名称排序', value: 'name' },
            ]}
            onSortChange={setSort}
            placeholder="搜索关注游戏"
            onClear={() => {
              setKeyword('');
              setSort('latest');
              setPage(1);
              setPageSize(PAGE_SIZE);
            }}
          />
          {(keyword.trim() || sort !== 'latest' || page > 1) ? (
            <p className="text-xs text-primary">筛选已生效：关键词“{keyword.trim() || '空'}”，排序 {sort}，页码 {page}，每页 {pageSize}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">已加载社区 {topics.length} / {total}（聚合后游戏 {games.length}）</p>
          {games.length === 0 ? (
            <p className="text-sm text-muted-foreground">{topics.length === 0 ? '你还没有关注任何游戏。' : '没有符合当前筛选条件的关注游戏。'}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
          {canLoadMore ? (
            <button
              className="w-full rounded border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                void loadMore();
              }}
              disabled={loadingMore}
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
