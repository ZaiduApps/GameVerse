'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, PencilLine, Trash2 } from 'lucide-react';

import CreatePostForm from '@/components/community/CreatePostForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { deleteMyCommunityPost, setMyCommunityPostStatus, updateMyCommunityPost } from '@/lib/community-api';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { getMyDashboardPosts, type DashboardPostItem } from '@/lib/profile-dashboard-api';
import CenterAuthRequired from '../CenterAuthRequired';
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
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionPostId, setActionPostId] = useState('');
  const [actionType, setActionType] = useState<'delete' | 'status' | ''>('');
  const [editingPost, setEditingPost] = useState<DashboardPostItem | null>(null);
  const [list, setList] = useState<DashboardPostItem[]>([]);
  const [keyword, setKeyword] = useState(() => String(searchParams.get('q') || ''));
  const [reviewStatus, setReviewStatus] = useState(() => String(searchParams.get('status') || 'all'));
  const [sort, setSort] = useState(() => String(searchParams.get('sort') || 'latest'));
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page') || 1)));
  const [pageSize, setPageSize] = useState(() => Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE)));
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const listRef = React.useRef<DashboardPostItem[]>([]);

  useEffect(() => {
    listRef.current = list;
  }, [list]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      setLoading(true);
      const pageFromUrl = Math.max(1, Number(searchParams.get('page') || 1));
      const pageSizeFromUrl = Math.max(1, Number(searchParams.get('pageSize') || PAGE_SIZE));
      const qFromUrl = String(searchParams.get('q') || '').trim();
      const reviewStatusFromUrl = String(searchParams.get('status') || '').trim();
      const res = await getMyDashboardPosts({
        token,
        page: pageFromUrl,
        pageSize: pageSizeFromUrl,
        q: qFromUrl,
        sort: String(searchParams.get('sort') || 'latest').trim() || 'latest',
        reviewStatus:
          reviewStatusFromUrl && reviewStatusFromUrl !== 'all'
            ? reviewStatusFromUrl
            : undefined,
      });
      if (cancelled) return;
      if (!res.ok) {
        const message = res.message || '动态列表加载失败，请稍后重试';
        if (listRef.current.length > 0) {
          setLoadError('');
          toast({
            title: '动态列表更新失败',
            description: message,
            variant: 'destructive',
          });
        } else {
          setLoadError(message);
        }
        setLoading(false);
        return;
      }
      setLoadError('');
      setList(res.list || []);
      setPage(pageFromUrl);
      setPageSize(pageSizeFromUrl);
      setTotal(Number(res.total || 0));
      setLoading(false);
    }
    if (isAuthenticated && token) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, reloadKey, searchParams, toast, token]);

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

  const hasActiveFilter = Boolean(keyword.trim()) || reviewStatus !== 'all';
  const canLoadMore = list.length < total;
  const filtered = [...list].sort((a, b) => {
    if (sort === 'likes') return Number(b.post.likesCount || 0) - Number(a.post.likesCount || 0);
    if (sort === 'comments') return Number(b.post.commentsCount || 0) - Number(a.post.commentsCount || 0);
    return String(b.updatedAt || b.post.timestamp || '').localeCompare(String(a.updatedAt || a.post.timestamp || ''));
  });

  async function loadMore() {
    if (!token || loadingMore || !canLoadMore) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await getMyDashboardPosts({
        token,
        page: next,
        pageSize,
        q: keyword.trim() || undefined,
        sort,
        reviewStatus: reviewStatus !== 'all' ? reviewStatus : undefined,
      });
      if (!res.ok) {
        toast({
          title: '加载更多失败',
          description: res.message || '动态列表加载失败，请稍后重试',
          variant: 'destructive',
        });
        return;
      }
      setList((prev) => [...prev, ...res.list]);
      setPage(next);
      setTotal(Number(res.total || total));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleToggleStatus(item: DashboardPostItem) {
    const postId = String(item.post.id || '').trim();
    if (!token || !postId || actionPostId) return;

    const currentStatus = Number(item.status || 0) === 1 ? 1 : 0;
    const nextStatus: 0 | 1 = currentStatus === 1 ? 0 : 1;
    const actionText = nextStatus === 0 ? '隐藏' : '显示';
    const confirmed = window.confirm(
      nextStatus === 0
        ? '确认隐藏该动态？隐藏后将不再对外公开展示。'
        : '确认显示该动态？显示后会重新按已发布状态对外展示。',
    );
    if (!confirmed) return;

    setActionPostId(postId);
    setActionType('status');
    try {
      const result = await setMyCommunityPostStatus({
        token,
        postId,
        status: nextStatus,
      });
      if (!result.ok) {
        toast({
          title: `${actionText}失败`,
          description: result.message,
          variant: 'destructive',
        });
        return;
      }

      setList((prev) =>
        prev.map((entry) =>
          String(entry.post.id || '').trim() === postId
            ? { ...entry, status: nextStatus }
            : entry,
        ),
      );
      toast({
        title: `${actionText}成功`,
        description: result.message,
      });
    } finally {
      setActionPostId('');
      setActionType('');
    }
  }

  async function handleDelete(item: DashboardPostItem) {
    const postId = String(item.post.id || '').trim();
    if (!token || !postId || actionPostId) return;

    const confirmed = window.confirm('确认删除该动态？删除后会从你的列表中移除。');
    if (!confirmed) return;

    setActionPostId(postId);
    setActionType('delete');
    try {
      const result = await deleteMyCommunityPost({ token, postId });
      if (!result.ok) {
        toast({
          title: '删除失败',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }

      setList((prev) =>
        prev.filter((entry) => String(entry.post.id || '').trim() !== postId),
      );
      setTotal((prev) => Math.max(0, prev - 1));
      toast({
        title: '删除成功',
        description: result.message,
      });
    } finally {
      setActionPostId('');
      setActionType('');
    }
  }

  function handleStartEdit(item: DashboardPostItem) {
    if (String(item.reviewStatus || '').trim() === 'published') return;
    setEditingPost(item);
  }

  async function handleSubmitEdit(payload: {
    appId?: string;
    content: string;
    source: string;
    title?: string;
    topicIds?: string[];
    topicNames?: string[];
  }) {
    const postId = String(editingPost?.post.id || '').trim();
    if (!token || !postId) {
      return { ok: false, message: '帖子信息已失效，请刷新后重试' };
    }

    const result = await updateMyCommunityPost({
      token,
      postId,
      ...payload,
    });
    if (!result.ok || !result.post) {
      return result;
    }

    setList((prev) =>
      prev.map((entry) =>
        String(entry.post.id || '').trim() === postId
          ? {
              ...entry,
              post: result.post || entry.post,
              topicItems: result.topicItems || entry.topicItems,
              reviewReason: result.reviewReason,
              reviewStatus: result.reviewStatus || entry.reviewStatus,
              status:
                typeof result.status === 'number' ? result.status : entry.status,
              updatedAt: result.updatedAt || entry.updatedAt,
            }
          : entry,
      ),
    );
    return result;
  }

  if (isAuthLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <CenterAuthRequired
        title="我的动态"
        description="查看你发布的动态与审核状态。"
        containerClassName="max-w-4xl"
      />
    );
  }

  if (loading) {
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
            onKeywordChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
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
            onStatusChange={(value) => {
              setReviewStatus(value);
              setPage(1);
            }}
            sort={sort}
            sortOptions={[
              { label: '最新', value: 'latest' },
              { label: '点赞最多', value: 'likes' },
              { label: '评论最多', value: 'comments' },
            ]}
            onSortChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            placeholder="搜索动态关键词"
            onClear={() => {
              setKeyword('');
              setReviewStatus('all');
              setSort('latest');
              setPage(1);
              setPageSize(PAGE_SIZE);
            }}
          />
          {loadError && filtered.length === 0 ? (
            <div className="rounded-lg bg-destructive/5 px-4 py-5 text-sm text-destructive">
              <p>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setLoadError('');
                  setReloadKey((value) => value + 1);
                }}
                data-acbox-action="profile_center_posts_reload"
                data-acbox-label="重新加载动态"
              >
                重新加载
              </Button>
            </div>
          ) : null}
          {(hasActiveFilter || page > 1) ? (
            <p className="text-xs text-primary">筛选已生效：关键词“{keyword.trim() || '空'}”，状态 {reviewStatus === 'all' ? '全部' : reviewStatus}，排序 {sort}，页码 {page}，每页 {pageSize}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">已加载 {list.length} / {total}</p>
          {filtered.length === 0 && !loadError ? (
            <p className="text-sm text-muted-foreground">{hasActiveFilter ? '没有符合当前筛选条件的动态。' : '你还没有发布任何动态。'}</p>
          ) : (
            filtered.map((item) => {
              const title = String(item.post.title || '').trim() || String(item.post.summary || '').trim() || '未命名动态';
              const postId = String(item.post.id || '').trim();
              const hasPendingAction = Boolean(actionPostId);
              const isPendingAction = actionPostId === postId;
              const canEdit = String(item.reviewStatus || '').trim() !== 'published';
              const isPubliclyViewable =
                String(item.reviewStatus || '').trim() === 'published' &&
                Number(item.status || 0) === 1;
              const canToggleStatus = String(item.reviewStatus || '').trim() === 'published';
              const previewText = getCommunityPostPreviewText(item.post, 80, '暂无内容');
              const hiddenReason =
                String(item.reviewStatus || '').trim() === 'published' && Number(item.status || 0) === 0
                  ? '当前动态已隐藏，重新显示后可查看详情。'
                  : String(item.reviewStatus || '').trim() === 'pending'
                    ? '当前动态正在审核中，审核通过后可公开查看。'
                    : String(item.reviewStatus || '').trim() === 'draft'
                      ? '当前动态仍是草稿状态，发布后可查看详情。'
                      : String(item.reviewStatus || '').trim() === 'rejected' && item.reviewReason
                        ? `驳回原因：${item.reviewReason}`
                        : String(item.reviewStatus || '').trim() === 'rejected'
                          ? '当前动态未通过审核，可调整内容后重新发布。'
                          : '当前内容尚未公开，发布后可查看详情。';
              return (
                <div key={item.post.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    {isPubliclyViewable ? (
                      <Link
                        href={`/community/post/${encodeURIComponent(item.post.id)}`}
                        className="line-clamp-1 text-sm font-semibold hover:text-primary"
                        data-acbox-action="profile_center_post_detail"
                        data-acbox-label={title}
                      >
                        {title}
                      </Link>
                    ) : (
                      <span className="line-clamp-1 text-sm font-semibold text-foreground">{title}</span>
                    )}
                    <Badge variant={statusTone(item.reviewStatus, item.status)} className="text-[10px]">{statusText(item.reviewStatus, item.status)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{previewText}</p>
                  {!isPubliclyViewable ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">{hiddenReason}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                        disabled={hasPendingAction}
                        onClick={() => handleStartEdit(item)}
                        data-acbox-action="profile_center_post_edit"
                        data-acbox-label={title}
                      >
                        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                        编辑
                      </Button>
                    ) : null}
                    {canToggleStatus ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                        disabled={hasPendingAction}
                        onClick={() => void handleToggleStatus(item)}
                        data-acbox-action="profile_center_post_toggle_status"
                        data-acbox-label={title}
                      >
                        {Number(item.status || 0) === 1 ? (
                          <>
                            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                            {isPendingAction && actionType === 'status' ? '隐藏中...' : '隐藏'}
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            {isPendingAction && actionType === 'status' ? '显示中...' : '显示'}
                          </>
                        )}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                      disabled={hasPendingAction}
                      onClick={() => void handleDelete(item)}
                      data-acbox-action="profile_center_post_delete"
                      data-acbox-label={title}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {isPendingAction && actionType === 'delete' ? '删除中...' : '删除'}
                    </Button>
                  </div>
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
              data-acbox-action="profile_center_posts_load_more"
              data-acbox-label="加载更多动态"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => { if (!open) setEditingPost(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>编辑动态</DialogTitle>
            <DialogDescription>
              草稿、待审核和未通过内容可在这里修改并重新提交。
            </DialogDescription>
          </DialogHeader>
          {editingPost ? (
            <CreatePostForm
              key={editingPost.post.id}
              mode="edit"
              surface="plain"
              initialTitle={editingPost.post.title || ''}
              initialContent={editingPost.post.content || ''}
              initialTopics={editingPost.topicItems || []}
              forcedAppId={editingPost.post.relatedApp?.id}
              submitLabel="保存修改"
              submittingLabel="保存中..."
              onCancel={() => setEditingPost(null)}
              onSubmitPost={handleSubmitEdit}
              onPosted={() => setEditingPost(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
