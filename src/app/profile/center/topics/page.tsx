'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CenterFilterBar from '../CenterFilterBar';
import { useAuth } from '@/context/auth-context';
import { followTopicById, getMyFollowedGameTopics, unfollowTopicById } from '@/lib/profile-dashboard-api';
import type { CommunityTopicItem } from '@/lib/community-api';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import CenterAuthRequired from '../CenterAuthRequired';
import CenterPageHeader from '../CenterPageHeader';

export default function ProfileCenterTopicsPage() {
  const PAGE_SIZE = 12;
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [list, setList] = useState<CommunityTopicItem[]>([]);
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
      const res = await getMyFollowedGameTopics({ token, page: pageFromUrl, pageSize: pageSizeFromUrl });
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
  const filtered = list.filter((topic) => {
    const text = `${topic.name || ''} ${topic.app_info?.name || ''} ${topic.app_info?.summary || ''}`.toLowerCase();
    return !keyword.trim() || text.includes(keyword.trim().toLowerCase());
  }).sort((a, b) => {
    if (sort === 'followers') return Number(b.followers_count || 0) - Number(a.followers_count || 0);
    return String(b.last_activity_at || '').localeCompare(String(a.last_activity_at || ''));
  });

  async function loadMore() {
    if (!token || loadingMore || !canLoadMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const res = await getMyFollowedGameTopics({ token, page: next, pageSize });
    setList((prev) => [...prev, ...res.list]);
    setPage(next);
    setTotal(Number(res.total || total));
    setLoadingMore(false);
  }

  async function unfollow(topic: CommunityTopicItem) {
    const topicId = String(topic._id || '').trim();
    if (!topicId || !token) return;
    const confirmed = window.confirm(`确认取消关注社区「${topic.name || '未命名话题'}」吗？`);
    if (!confirmed) return;
    const result = await unfollowTopicById({ token, topicId });
    if (!result.ok) {
      toast({ title: '取消关注失败', description: result.message, variant: 'destructive' });
      return;
    }
    const removed = topic;
    const previousIndex = list.findIndex((item) => String(item._id || '').trim() === topicId);
    setList((prev) => prev.filter((item) => String(item._id || '').trim() !== topicId));
    setTotal((prev) => Math.max(0, prev - 1));
    toast({
      title: '已取消关注社区',
      description: `你已取消关注「${topic.name || '未命名话题'}」`,
      action: (
        <ToastAction
          altText="撤销"
          onClick={async () => {
            const rollback = await followTopicById({ token, topicId });
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
            toast({ title: '已恢复关注' });
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
        title="我关注的游戏社区"
        description="管理你关注的话题社区与关联游戏。"
        containerClassName="max-w-4xl"
      />
    );
  }

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 py-4 md:py-8">
      <CenterPageHeader title="我关注的游戏社区" description="管理你关注的话题社区与关联游戏。" />
      <Card>
        <CardHeader>
          <CardTitle>我关注的游戏社区</CardTitle>
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
              { label: '最近活跃', value: 'latest' },
              { label: '关注最多', value: 'followers' },
            ]}
            onSortChange={setSort}
            placeholder="搜索社区/游戏名"
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
            <p className="text-sm text-muted-foreground">{list.length === 0 ? '你还没有关注任何游戏社区。' : '没有符合当前筛选条件的游戏社区。'}</p>
          ) : (
            filtered.map((topic) => {
              const topicId = String(topic._id || '').trim();
              const href = topicId ? `/community/topic/${encodeURIComponent(topic.slug || topicId)}` : '/community';
              return (
                <div key={topicId} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={href}
                      className="line-clamp-1 text-sm font-semibold hover:text-primary"
                      data-acbox-action="profile_center_topic_detail"
                      data-acbox-label={topic.name || '未命名话题'}
                    >
                      {topic.name || '未命名话题'}
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void unfollow(topic)}
                      data-acbox-action="profile_center_topic_unfollow"
                      data-acbox-label={topic.name || '取消关注'}
                    >
                      取消关注
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{topic.app_info?.name || '游戏社区'} · 帖子 {Number(topic.post_count || 0)} · 关注 {Number(topic.followers_count || 0)}</p>
                </div>
              );
            })
          )}
          {canLoadMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              data-acbox-action="profile_center_topics_load_more"
              data-acbox-label="加载更多游戏社区"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
