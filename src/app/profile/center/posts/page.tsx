'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { getMyDashboardPosts, type DashboardPostItem } from '@/lib/profile-dashboard-api';
import CenterPageHeader from '../CenterPageHeader';
import CenterFilterBar from '../CenterFilterBar';

function statusText(reviewStatus: string, status: number) {
  const review = String(reviewStatus || '').trim();
  if (review === 'published' && status === 1) return '已发布';
  if (review === 'pending') return '审核中';
  if (review === 'rejected') return '未通过';
  if (review === 'draft') return '草稿';
  return status === 1 ? '已上线' : '未上线';
}

function statusTone(reviewStatus: string, status: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  const review = String(reviewStatus || '').trim();
  if (review === 'published' && status === 1) return 'secondary';
  if (review === 'pending') return 'outline';
  if (review === 'rejected') return 'destructive';
  if (review === 'draft') return 'default';
  return status === 1 ? 'secondary' : 'outline';
}

export default function ProfileCenterPostsPage() {
  const PAGE_SIZE = 12;
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [list, setList] = useState<DashboardPostItem[]>([]);
  const [keyword, setKeyword] = useState(() => String(searchParams.get('q') || ''));
  const [reviewStatus, setReviewStatus] = useState(() => String(searchParams.get('status') || 'all'));
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
      const res = await getMyDashboardPosts({ token, page: pageFromUrl, pageSize: pageSizeFromUrl });
      setList(res.list || []);
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
    if (reviewStatus && reviewStatus !== 'all') params.set('status', reviewStatus); else params.delete('status');
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (sort && sort !== 'latest') params.set('sort', sort); else params.delete('sort');
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname);
    }
  }, [keyword, pathname, page, pageSize, reviewStatus, router, searchParams, sort]);

  const canLoadMore = list.length < total;
  const filtered = list.filter((item) => {
    const text = `${item.post.title || ''} ${item.post.summary || ''} ${item.post.content || ''}`.toLowerCase();
    const passKeyword = !keyword.trim() || text.includes(keyword.trim().toLowerCase());
    const passStatus = reviewStatus === 'all' || String(item.reviewStatus || '') === reviewStatus;
    return passKeyword && passStatus;
  }).sort((a, b) => {
    if (sort === 'likes') return Number(b.post.likesCount || 0) - Number(a.post.likesCount || 0);
    if (sort === 'comments') return Number(b.post.commentsCount || 0) - Number(a.post.commentsCount || 0);
    return String(b.updatedAt || b.post.timestamp || '').localeCompare(String(a.updatedAt || a.post.timestamp || ''));
  });

  async function loadMore() {
    if (!token || loadingMore || !canLoadMore) return;
    const next = page + 1;
    setLoadingMore(true);
    const res = await getMyDashboardPosts({ token, page: next, pageSize });
    setList((prev) => [...prev, ...res.list]);
    setPage(next);
    setTotal(Number(res.total || total));
    setLoadingMore(false);
  }

  if (isAuthLoading || loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 py-4 md:py-8">
      <CenterPageHeader title="我的动态" description="查看你发布的动态与审核状态。" />
      <Card>
        <CardHeader>
          <CardTitle>我的动态</CardTitle>
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
            status={reviewStatus}
            statusOptions={[
              { label: '全部状态', value: 'all' },
              { label: '已发布', value: 'published' },
              { label: '审核中', value: 'pending' },
              { label: '未通过', value: 'rejected' },
              { label: '草稿', value: 'draft' },
            ]}
            onStatusChange={setReviewStatus}
            sort={sort}
            sortOptions={[
              { label: '最新', value: 'latest' },
              { label: '点赞最多', value: 'likes' },
              { label: '评论最多', value: 'comments' },
            ]}
            onSortChange={setSort}
            placeholder="搜索动态关键词"
            onClear={() => {
              setKeyword('');
              setReviewStatus('all');
              setSort('latest');
              setPage(1);
              setPageSize(PAGE_SIZE);
            }}
          />
          {(keyword.trim() || reviewStatus !== 'all' || page > 1) ? (
            <p className="text-xs text-primary">筛选已生效：关键词“{keyword.trim() || '空'}”，状态 {reviewStatus === 'all' ? '全部' : reviewStatus}，排序 {sort}，页码 {page}，每页 {pageSize}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">已加载 {list.length} / {total}</p>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{list.length === 0 ? '你还没有发布任何动态。' : '没有符合当前筛选条件的动态。'}</p>
          ) : (
            filtered.map((item) => {
              const title = String(item.post.title || '').trim() || String(item.post.summary || '').trim() || '未命名动态';
              return (
                <div key={item.post.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/community/post/${encodeURIComponent(item.post.id)}`} className="line-clamp-1 text-sm font-semibold hover:text-primary">{title}</Link>
                    <Badge variant={statusTone(item.reviewStatus, item.status)} className="text-[10px]">{statusText(item.reviewStatus, item.status)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.post.summary || item.post.content || '暂无内容'}</p>
                </div>
              );
            })
          )}
          {canLoadMore ? (
            <Button variant="outline" className="w-full" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? '加载中...' : '加载更多'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
