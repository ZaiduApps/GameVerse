'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CenterFilterBar from '../CenterFilterBar';
import { useAuth } from '@/context/auth-context';
import type { Game } from '@/types';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import { followReservationByAppId, getMyReservationGames, unfollowReservationByAppId } from '@/lib/profile-dashboard-api';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import CenterAuthRequired from '../CenterAuthRequired';
import CenterPageHeader from '../CenterPageHeader';

export default function ProfileCenterReservationsPage() {
  const PAGE_SIZE = 12;
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [list, setList] = useState<Game[]>([]);
  const [keyword, setKeyword] = useState(() => String(searchParams.get('q') || ''));
  const [sort, setSort] = useState(() => String(searchParams.get('sort') || 'latest'));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page') || 1)));
  const [pageSize, setPageSize] = useState(() => Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE)));
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function load() {
      if (!token) return;
      setLoading(true);
      const pageFromUrl = Math.max(1, Number(searchParams.get('page') || 1));
      const pageSizeFromUrl = Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE));
      const res = await getMyReservationGames({ token, page: pageFromUrl, pageSize: pageSizeFromUrl });
      setList(res.list || []);
      setPage(pageFromUrl);
      setPageSize(pageSizeFromUrl);
      setTotal(Number(res.total || 0));
      setLoading(false);
    }
    if (isAuthenticated && token) {
      void load();
    }
  }, [isAuthLoading, isAuthenticated, searchParams, token]);

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

  const canLoadMore = list.length < total;
  const filtered = list.filter((game) => {
    const text = `${game.title || ''} ${game.description || ''}`.toLowerCase();
    return !keyword.trim() || text.includes(keyword.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
    return String(b.updateDate || '').localeCompare(String(a.updateDate || ''));
  });

  async function loadMore() {
    if (!token || loadingMore || !canLoadMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const res = await getMyReservationGames({ token, page: next, pageSize });
    setList((prev) => [...prev, ...res.list]);
    setPage(next);
    setTotal(Number(res.total || total));
    setLoadingMore(false);
  }

  async function unfollow(game: Game) {
    const appId = String(game.id || game.pkg || '').trim();
    if (!appId || !token) return;
    const confirmed = window.confirm(`确认取消预约游戏「${game.title || '未命名游戏'}」吗？`);
    if (!confirmed) return;
    const result = await unfollowReservationByAppId({ token, appId });
    if (!result.ok) {
      toast({ title: '取消预约失败', description: result.message, variant: 'destructive' });
      return;
    }
    const removed = game;
    const previousIndex = list.findIndex((item) => String(item.id || '').trim() === appId);
    setList((prev) => prev.filter((item) => String(item.id || '').trim() !== appId));
    setTotal((prev) => Math.max(0, prev - 1));
    toast({
      title: '已取消预约',
      description: `你已取消预约「${game.title || '未命名游戏'}」`,
      action: (
        <ToastAction
          altText="撤销"
          onClick={async () => {
            const rollback = await followReservationByAppId({ token, appId });
            if (!rollback.ok) {
              toast({ title: '撤销失败', description: rollback.message, variant: 'destructive' });
              return;
            }
            setList((prev) => {
              const next = [...prev];
              const insertAt = previousIndex >= 0 ? Math.min(previousIndex, next.length) : next.length;
              next.splice(insertAt, 0, removed);
              return next;
            });
            setTotal((prev) => prev + 1);
            toast({ title: '已恢复预约' });
          }}
        >
          撤销
        </ToastAction>
      ),
    });
  }

  if (isAuthLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <CenterAuthRequired
        title="我的预约游戏"
        description="查看并管理你关注的预约应用。"
        containerClassName="max-w-4xl"
      />
    );
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 py-4 md:py-8">
      <CenterPageHeader title="我的预约游戏" description="查看并管理你关注的预约应用。" />
      <Card>
        <CardHeader>
          <CardTitle>我的预约游戏</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
              { label: '最近更新', value: 'latest' },
              { label: '评分最高', value: 'rating' },
            ]}
            onSortChange={setSort}
            placeholder="搜索预约游戏"
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
          <p className="text-xs text-muted-foreground">已加载 {list.length} / {total}</p>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{list.length === 0 ? '你还没有预约任何游戏。' : '没有符合当前筛选条件的预约游戏。'}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {filtered.map((game) => (
                <div key={game.id} className="space-y-2">
                  <PreregistrationGameCard game={game} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => void unfollow(game)}
                    data-acbox-action="profile_center_reservation_unfollow"
                    data-acbox-label={game.title || '取消预约'}
                  >
                    取消预约
                  </Button>
                </div>
              ))}
            </div>
          )}
          {canLoadMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              data-acbox-action="profile_center_reservations_load_more"
              data-acbox-label="加载更多预约游戏"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
