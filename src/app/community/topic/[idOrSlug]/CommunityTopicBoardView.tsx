'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import CommunityPostCard from '@/components/community/CommunityPostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  adminDeleteCommunityPost,
  adminSetCommunityPostStatus,
  followTopic,
  deleteMyCommunityPost,
  type CommunityFeedResult,
  getCommunityFeed,
  getCommunityTopicDetail,
  getTopicFollowStatus,
  moderatorDeleteTopicPost,
  moderatorSetTopicPostStatus,
  moderatorUpdateTopic,
  setMyCommunityPostStatus,
  type CommunityTopicItem,
  unfollowTopic,
} from '@/lib/community-api';
import type { CommunityPost } from '@/types';
import { ArrowLeft, Hash, Loader2, Megaphone, MoreHorizontal, PenSquare, Share2, Users } from 'lucide-react';

interface CommunityTopicBoardViewProps {
  idOrSlug: string;
  initialData?: {
    topic: CommunityTopicItem;
    latestFeed: CommunityFeedResult;
    hotFeed: CommunityFeedResult;
  } | null;
}

const FALLBACK_TOPIC_ICON = '/favicon.ico';

function extractAnnouncementText(post: CommunityPost): string {
  const source = String(post.title || post.content || '').trim();
  if (!source) return '查看帖子详情';
  const normalized = source
    .replace(/[#*_`>\-\[\]\(\)!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return '查看帖子详情';
  return normalized.length > 54 ? `${normalized.slice(0, 54)}...` : normalized;
}

async function copyTextToClipboard(value: string) {
  if (!value) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const input = document.createElement('input');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(input);
    return copied;
  } catch {
    return false;
  }
}

export default function CommunityTopicBoardView({
  idOrSlug,
  initialData,
}: CommunityTopicBoardViewProps) {
  const FEED_PAGE_SIZE = 10;
  const hasInitialData = Boolean(initialData?.topic?._id);
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [topic, setTopic] = useState<CommunityTopicItem | null>(() => initialData?.topic || null);
  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>(() => initialData?.latestFeed.list || []);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>(() => initialData?.hotFeed.list || []);
  const [latestPage, setLatestPage] = useState(() => Math.max(1, Number(initialData?.latestFeed.page || 1)));
  const [hotPage, setHotPage] = useState(() => Math.max(1, Number(initialData?.hotFeed.page || 1)));
  const [latestTotal, setLatestTotal] = useState(() => Math.max(0, Number(initialData?.latestFeed.total || 0)));
  const [hotTotal, setHotTotal] = useState(() => Math.max(0, Number(initialData?.hotFeed.total || 0)));
  const [latestPageSize, setLatestPageSize] = useState(() => Math.max(1, Number(initialData?.latestFeed.pageSize || FEED_PAGE_SIZE)));
  const [hotPageSize, setHotPageSize] = useState(() => Math.max(1, Number(initialData?.hotFeed.pageSize || FEED_PAGE_SIZE)));
  const [latestHasMore, setLatestHasMore] = useState(() => Boolean(initialData?.latestFeed.hasMore));
  const [hotHasMore, setHotHasMore] = useState(() => Boolean(initialData?.hotFeed.hasMore));
  const [latestLoadingMore, setLatestLoadingMore] = useState(false);
  const [hotLoadingMore, setHotLoadingMore] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<'latest' | 'hot'>('latest');
  const [loading, setLoading] = useState(!hasInitialData);
  const [followed, setFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [moderationPostId, setModerationPostId] = useState('');
  const [moderationAnnouncement, setModerationAnnouncement] = useState('');
  const [moderationPinnedPostId, setModerationPinnedPostId] = useState('');
  const [moderationIsLocked, setModerationIsLocked] = useState(false);
  const [moderationIsRecommended, setModerationIsRecommended] = useState(false);
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderatorDialogOpen, setModeratorDialogOpen] = useState(false);
  const [topicIconFailed, setTopicIconFailed] = useState(false);
  const [topicBackdropFailed, setTopicBackdropFailed] = useState(false);
  const shouldSkipInitialLoadRef = useRef(hasInitialData);
  const latestLoadMoreAnchorRef = useRef<HTMLDivElement | null>(null);
  const hotLoadMoreAnchorRef = useRef<HTMLDivElement | null>(null);

  const safeIdOrSlug = useMemo(
    () => decodeURIComponent(String(idOrSlug || '').trim()),
    [idOrSlug],
  );
  const topicId = useMemo(() => String(topic?._id || '').trim(), [topic]);
  const currentUserId = useMemo(() => String(user?._id || '').trim(), [user]);
  const isAdminUser = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return roles.some((role) => {
      if (typeof role === 'string') {
        const code = role.trim().toLowerCase();
        return code === 'admin' || code === 'super_admin';
      }
      const code = String(role?.code || role?.name || '').trim().toLowerCase();
      return code === 'admin' || code === 'super_admin';
    });
  }, [user?.roles]);
  const canModerateTopic = useMemo(() => {
    if (!topicId || !currentUserId) return false;
    const moderatorIds = Array.isArray(topic?.moderator_ids)
      ? topic.moderator_ids.map((id) => String(id || '').trim()).filter(Boolean)
      : [];
    return moderatorIds.includes(currentUserId);
  }, [currentUserId, topic?.moderator_ids, topicId]);
  const topicSharePath = useMemo(() => {
    const target = String(topic?.slug || topic?._id || '').trim();
    if (!target) return '/community';
    return `/community/topic/${encodeURIComponent(target)}`;
  }, [topic]);
  const canModerateTopicSettings = useMemo(
    () => Boolean(topicId && (canModerateTopic || isAdminUser)),
    [canModerateTopic, isAdminUser, topicId],
  );

  const buildAnnouncementPosts = useCallback(
    (posts: CommunityPost[]) => {
      const pinnedId = String(topic?.pinned_post_id || '').trim();
      const pinned = posts.filter(
        (post) => pinnedId && String(post.id || '').trim() === pinnedId,
      );
      const featured = posts.filter(
        (post) =>
          Boolean(post.isTop || post.isRecommended) &&
          (!pinnedId || String(post.id || '').trim() !== pinnedId),
      );
      const announcementPosts = [...pinned, ...featured].slice(0, 5);
      const announcementIds = new Set(
        announcementPosts.map((post) => String(post.id || '').trim()),
      );
      const regularPosts = posts.filter(
        (post) => !announcementIds.has(String(post.id || '').trim()),
      );
      return {
        announcementPosts,
        regularPosts,
      };
    },
    [topic],
  );

  const loadTopicBoard = useCallback(async (options?: { latestPage?: number; hotPage?: number }) => {
    if (!safeIdOrSlug) {
      setTopic(null);
      setLatestPosts([]);
      setHotPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const topicDetail = await getCommunityTopicDetail(safeIdOrSlug);
    if (!topicDetail?._id) {
      setTopic(null);
      setLatestPosts([]);
      setHotPosts([]);
      setLoading(false);
      return;
    }

    const safeTopicId = String(topicDetail._id || '').trim();
    const targetLatestPage = Math.max(1, Number(options?.latestPage || 1));
    const targetHotPage = Math.max(1, Number(options?.hotPage || 1));
    const [latest, hot] = await Promise.all([
      getCommunityFeed('latest', { topicId: safeTopicId, page: targetLatestPage, pageSize: FEED_PAGE_SIZE }),
      getCommunityFeed('hot', { topicId: safeTopicId, page: targetHotPage, pageSize: FEED_PAGE_SIZE }),
    ]);

    setTopic(topicDetail);
    setLatestPosts(latest.list);
    setHotPosts(hot.list);
    setLatestPage(latest.page);
    setHotPage(hot.page);
    setLatestTotal(latest.total);
    setHotTotal(hot.total);
    setLatestPageSize(latest.pageSize);
    setHotPageSize(hot.pageSize);
    setLatestHasMore(Boolean(latest.hasMore));
    setHotHasMore(Boolean(hot.hasMore));
    setLoading(false);
  }, [FEED_PAGE_SIZE, safeIdOrSlug]);

  const loadMoreByTab = useCallback(async (targetTab: 'latest' | 'hot') => {
    if (loading || !topicId) return;

    if (targetTab === 'latest') {
      if (latestLoadingMore || !latestHasMore) return;
      const nextPage = Math.max(1, latestPage + 1);
      setLatestLoadingMore(true);
      const result = await getCommunityFeed('latest', { topicId, page: nextPage, pageSize: FEED_PAGE_SIZE });
      setLatestLoadingMore(false);
      if (result.page < nextPage) {
        toast({ title: '加载失败', description: '接口返回页码未前进，请稍后重试。', variant: 'destructive' });
        return;
      }
      setLatestPosts((prev) => {
        const seen = new Set(prev.map((item) => String(item.id || '').trim()).filter(Boolean));
        const merged = [...prev];
        for (const item of result.list) {
          const id = String(item.id || '').trim();
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push(item);
        }
        return merged;
      });
      setLatestPage(result.page);
      setLatestTotal(result.total);
      setLatestPageSize(result.pageSize);
      setLatestHasMore(Boolean(result.hasMore));
      return;
    }

    if (hotLoadingMore || !hotHasMore) return;
    const nextPage = Math.max(1, hotPage + 1);
    setHotLoadingMore(true);
    const result = await getCommunityFeed('hot', { topicId, page: nextPage, pageSize: FEED_PAGE_SIZE });
    setHotLoadingMore(false);
    if (result.page < nextPage) {
      toast({ title: '加载失败', description: '接口返回页码未前进，请稍后重试。', variant: 'destructive' });
      return;
    }
    setHotPosts((prev) => {
      const seen = new Set(prev.map((item) => String(item.id || '').trim()).filter(Boolean));
      const merged = [...prev];
      for (const item of result.list) {
        const id = String(item.id || '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        merged.push(item);
      }
      return merged;
    });
    setHotPage(result.page);
    setHotTotal(result.total);
    setHotPageSize(result.pageSize);
    setHotHasMore(Boolean(result.hasMore));
  }, [FEED_PAGE_SIZE, hotHasMore, hotLoadingMore, hotPage, latestHasMore, latestLoadingMore, latestPage, loading, toast, topicId]);

  const syncFollowStatus = useCallback(async () => {
    if (!isAuthenticated || !token || !topicId) {
      setFollowed(false);
      return;
    }
    const status = await getTopicFollowStatus({ token, topicId });
    if (!status) return;
    setFollowed(Boolean(status.followed));
    setTopic((prev) => {
      if (!prev || String(prev._id || '').trim() !== topicId) return prev;
      return {
        ...prev,
        followers_count: Number(status.followers_count || 0),
      };
    });
  }, [isAuthenticated, token, topicId]);

  const handleToggleFollow = useCallback(async () => {
    if (!topicId) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再关注话题',
        variant: 'destructive',
      });
      return;
    }

    setFollowBusy(true);
    const result = followed
      ? await unfollowTopic({ token, topicId })
      : await followTopic({ token, topicId });
    setFollowBusy(false);

    if (!result.ok || !result.data) {
      toast({
        title: followed ? '取消关注失败' : '关注失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    setFollowed(Boolean(result.data.followed));
    setTopic((prev) => {
      if (!prev || String(prev._id || '').trim() !== topicId) return prev;
      return {
        ...prev,
        followers_count: Number(result.data?.followers_count || 0),
      };
    });
    toast({
      title: result.data.followed ? '关注成功' : '已取消关注',
      description: result.message,
    });
  }, [followed, isAuthenticated, toast, token, topicId]);

  const handleShareTopic = useCallback(async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}${topicSharePath}`
        : topicSharePath;

    try {
      const copied = await copyTextToClipboard(shareUrl);
      if (!copied) throw new Error('copy failed');
      toast({
        title: '复制成功',
        description: '话题链接已复制，可直接分享。',
      });
    } catch {
      toast({
        title: '复制失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  }, [toast, topicSharePath]);

  const handleCopyTopicId = useCallback(async () => {
    if (!topicId) return;
    const copied = await copyTextToClipboard(topicId);
    if (copied) {
      toast({
        title: '复制成功',
        description: '话题 ID 已复制。',
      });
      return;
    }
    toast({
      title: '复制失败',
      description: '请稍后重试',
      variant: 'destructive',
    });
  }, [toast, topicId]);

  const handleCreatePost = useCallback(() => {
    if (!topicId) return;
    if (!isAuthenticated) {
      toast({
        title: '需要登录',
        description: '请先登录后再发布帖子',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/community?topic=${encodeURIComponent(topicId)}&compose=1`);
  }, [isAuthenticated, router, toast, topicId]);

  const handleHidePost = useCallback(async (post: CommunityPost) => {
    const postId = String(post?.id || '').trim();
    const postAuthorId = String(post?.authorId || '').trim();
    const postAuthorType = String(post?.authorType || '').trim().toLowerCase();
    const isOwner = Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId && postAuthorType === 'user');
    const canUseTopicModeration = Boolean(topicId && canModerateTopic);
    const canUseAdminApi = Boolean(isAdminUser && !canUseTopicModeration);
    const canUseMyPostApi = isOwner && !isAdminUser;
    if (!postId || !token || (!canUseTopicModeration && !canUseAdminApi && !canUseMyPostApi)) return;

    const confirmed = window.confirm('确认隐藏该帖子？隐藏后将不再在社区流中展示。');
    if (!confirmed) return;

    setModerationPostId(postId);
    const result = canUseTopicModeration
      ? await moderatorSetTopicPostStatus({ token, topicId: topicId!, postId, status: 0 })
      : canUseAdminApi
      ? await adminSetCommunityPostStatus({ token, postId, status: 0 })
      : await setMyCommunityPostStatus({ token, postId, status: 0 });
    setModerationPostId('');

    if (!result.ok) {
      toast({
        title: '隐藏失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    setLatestPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== postId));
    setHotPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== postId));
    toast({ title: '已隐藏', description: result.message });
    void loadTopicBoard();
  }, [canModerateTopic, currentUserId, isAdminUser, loadTopicBoard, token, toast, topicId]);

  const handleDeletePost = useCallback(async (post: CommunityPost) => {
    const postId = String(post?.id || '').trim();
    const postAuthorId = String(post?.authorId || '').trim();
    const postAuthorType = String(post?.authorType || '').trim().toLowerCase();
    const isOwner = Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId && postAuthorType === 'user');
    const canUseTopicModeration = Boolean(topicId && canModerateTopic);
    const canUseAdminApi = Boolean(isAdminUser && !canUseTopicModeration);
    const canUseMyPostApi = isOwner && !isAdminUser;
    if (!postId || !token || (!canUseTopicModeration && !canUseAdminApi && !canUseMyPostApi)) return;

    const confirmed = window.confirm('确认删除该帖子？此操作会软删除并从列表移除。');
    if (!confirmed) return;

    setModerationPostId(postId);
    const result = canUseTopicModeration
      ? await moderatorDeleteTopicPost({ token, topicId: topicId!, postId })
      : canUseAdminApi
      ? await adminDeleteCommunityPost({ token, postId })
      : await deleteMyCommunityPost({ token, postId });
    setModerationPostId('');

    if (!result.ok) {
      toast({
        title: '删除失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    setLatestPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== postId));
    setHotPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== postId));
    toast({ title: '删除成功', description: result.message });
    void loadTopicBoard();
  }, [canModerateTopic, currentUserId, isAdminUser, loadTopicBoard, token, toast, topicId]);

  const handleModeratorSave = useCallback(async () => {
    if (!canModerateTopicSettings || !token || !topicId) return;

    setModerationSaving(true);
    const result = await moderatorUpdateTopic({
      token,
      topicId,
      patch: {
        announcement: moderationAnnouncement,
        is_locked: moderationIsLocked,
        is_recommended: moderationIsRecommended,
        pinned_post_id: moderationPinnedPostId.trim() || null,
      },
    });
    setModerationSaving(false);

    if (!result.ok || !result.topic) {
      toast({
        title: '保存失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    setTopic((prev) => {
      if (!prev) return result.topic;
      return {
        ...prev,
        ...result.topic,
      };
    });
    toast({
      title: '保存成功',
      description: result.message,
    });
  }, [canModerateTopicSettings, moderationAnnouncement, moderationIsLocked, moderationIsRecommended, moderationPinnedPostId, toast, token, topicId]);

  useEffect(() => {
    if (shouldSkipInitialLoadRef.current) {
      shouldSkipInitialLoadRef.current = false;
      return;
    }
    void loadTopicBoard({ latestPage: 1, hotPage: 1 });
  }, [loadTopicBoard]);

  useEffect(() => {
    void syncFollowStatus();
  }, [syncFollowStatus]);

  useEffect(() => {
    setModerationAnnouncement(String(topic?.announcement || ''));
    setModerationPinnedPostId(String(topic?.pinned_post_id || ''));
    setModerationIsLocked(Boolean(topic?.is_locked));
    setModerationIsRecommended(Boolean(topic?.is_recommended));
  }, [topic?._id, topic?.announcement, topic?.pinned_post_id, topic?.is_locked, topic?.is_recommended]);

  useEffect(() => {
    setTopicIconFailed(false);
    setTopicBackdropFailed(false);
  }, [topic?.app_info?.icon, topic?.cover, topic?.icon, topic?._id]);

  useEffect(() => {
    const target = activeFeedTab === 'hot' ? hotLoadMoreAnchorRef.current : latestLoadMoreAnchorRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        void loadMoreByTab(activeFeedTab);
      },
      { rootMargin: '320px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [activeFeedTab, loadMoreByTab]);

  const renderPostStream = (
    posts: CommunityPost[],
    options: {
      tab: 'latest' | 'hot';
      hasMore: boolean;
      loadingMore: boolean;
      anchorRef: React.RefObject<HTMLDivElement>;
    },
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center rounded-lg border bg-card py-14 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          正在加载话题内容...
        </div>
      );
    }

    if (!posts.length) {
      return (
        <div className="rounded-lg border bg-card py-14 text-center text-sm text-muted-foreground">
          暂无帖子，稍后再来看看。
        </div>
      );
    }

    const { announcementPosts, regularPosts } = buildAnnouncementPosts(posts);

    return (
      <div className="space-y-4">
        {announcementPosts.length ? (
          <Card className="overflow-hidden border-orange-500/35 bg-orange-50/70 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base font-semibold">
                <Megaphone className="mr-2 h-4 w-4 text-orange-600" />
                话题公告
              </CardTitle>
              <CardDescription>置顶或推荐帖子将以公告形式优先展示。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {announcementPosts.map((post) => {
                const postId = String(post.id || '').trim();
                const isPinned =
                  postId && postId === String(topic?.pinned_post_id || '').trim();
                return (
                  <Link
                    key={`topic-announcement-${postId}`}
                    href={`/community/post/${postId}`}
                    data-acbox-action="topic_announcement_click"
                    data-acbox-label={extractAnnouncementText(post)}
                    className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/35 hover:bg-primary/5"
                  >
                    <Badge variant={isPinned ? 'default' : 'secondary'}>
                      {isPinned ? '置顶' : '推荐'}
                    </Badge>
                    <span className="line-clamp-1 text-foreground/90">
                      {extractAnnouncementText(post)}
                    </span>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        ) : null}

        {regularPosts.length ? (
          regularPosts.map((post, index) => {
            const postAuthorId = String(post.authorId || '').trim();
            const postAuthorType = String(post.authorType || '').trim().toLowerCase();
            const isOwner = Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId && postAuthorType === 'user');
            const canManage = Boolean(isOwner || isAdminUser || canModerateTopic);
            return (
              <CommunityPostCard
                key={post.id}
                post={post}
                index={index}
                canManage={canManage}
                moderationBusy={moderationPostId === String(post.id || '').trim()}
                onHide={handleHidePost}
                onDelete={handleDeletePost}
              />
            );
          })
        ) : (
          <div className="rounded-lg border bg-card py-14 text-center text-sm text-muted-foreground">
            当前仅有公告帖子，暂无普通帖子。
          </div>
        )}
        <div className="rounded-md border bg-card px-3 py-3 text-xs text-muted-foreground sm:text-sm">
          <div className="flex items-center justify-between">
            <span>已加载 {posts.length} 条</span>
            {options.loadingMore ? (
              <span className="inline-flex items-center gap-1"><Loader2 className="h-3.5 w-3.5 animate-spin" />加载中</span>
            ) : null}
          </div>
          <div ref={options.anchorRef} className="h-1 w-full" />
          {options.hasMore ? (
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || options.loadingMore}
                data-acbox-action={`topic_${options.tab}_load_more`}
                data-acbox-label={options.tab === 'hot' ? '加载更多热门帖子' : '加载更多最新帖子'}
                onClick={() => void loadMoreByTab(options.tab)}
              >
                {options.loadingMore ? '加载中...' : '加载更多'}
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-right text-[11px] text-muted-foreground">没有更多内容了</p>
          )}
        </div>
      </div>
    );
  };

  if (!loading && !topic) {
    return (
      <div className="container mx-auto px-2 py-6 sm:px-4 lg:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">话题不存在或已下线</CardTitle>
            <CardDescription>请返回社区页面重新选择话题。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link
                href="/community"
                data-acbox-action="topic_back_community"
                data-acbox-label="话题不存在返回社区"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回社区
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topicIcon = topicIconFailed
    ? FALLBACK_TOPIC_ICON
    : topic?.app_info?.icon || topic?.icon || FALLBACK_TOPIC_ICON;
  const topicBackdrop = topicBackdropFailed
    ? ''
    : topic?.cover || topic?.app_info?.icon || topic?.icon || '';
  const moderators = Array.isArray(topic?.moderator_infos)
    ? topic!.moderator_infos!
    : [];
  const previewModerators = moderators.slice(0, 2);
  const hasModerators = moderators.length > 0;

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-4">
        <Button variant="ghost" asChild className="px-2">
          <Link
            href="/community"
            data-acbox-action="topic_back_community"
            data-acbox-label={topic?.name || safeIdOrSlug}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回社区
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <Card className="group relative overflow-hidden rounded-xl border border-border/35 bg-card text-card-foreground shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
            {topicBackdrop ? (
              <>
                <Image
                  src={topicBackdrop}
                  alt={topic?.name || 'topic cover'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 960px"
                  onError={() => setTopicBackdropFailed(true)}
                />
                <div className="absolute inset-0 bg-background/65 backdrop-blur-xl" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
            )}

            <CardHeader className="relative z-10 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Image
                    src={topicIcon}
                    alt={topic?.name || 'topic'}
                    width={72}
                    height={72}
                    className="rounded-xl border border-white/45 object-cover shadow-sm"
                    onError={() => setTopicIconFailed(true)}
                  />
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-2 text-xl">
                      #{topic?.name || '话题'}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-3 text-foreground/70">
                      {topic?.description?.trim() || '该话题暂无简介。'}
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        热度 {Number(topic?.heat_score || 0)}
                      </Badge>
                      <Badge variant="outline">
                        帖子 {Number(topic?.post_count || 0)}
                      </Badge>
                      <Badge variant="outline">
                        关注 {Number(topic?.followers_count || 0)}
                      </Badge>
                      {topic?.is_locked ? (
                        <Badge variant="secondary">已锁定</Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground lg:hidden">
                      <Users className="h-3.5 w-3.5 shrink-0" />
                      <span className="shrink-0">版主：</span>
                      {hasModerators ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <div className="flex items-center -space-x-2">
                            {previewModerators.map((moderator) => {
                              const moderatorName = String(moderator?.name || moderator?.username || '版主').trim();
                              const avatar = String(moderator?.avatar || '').trim();
                              return (
                                <Avatar
                                  key={`topic-mobile-moderator-${String(moderator?._id || moderatorName)}`}
                                  className="h-5 w-5 border border-background"
                                >
                                  <AvatarImage src={avatar} alt={moderatorName} />
                                  <AvatarFallback className="text-[10px]">
                                    {moderatorName.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              );
                            })}
                          </div>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs leading-none"
                            data-acbox-action="topic_open_moderators"
                            data-acbox-label={topic?.name || safeIdOrSlug}
                            onClick={() => setModeratorDialogOpen(true)}
                          >
                            更多&gt;&gt;
                          </Button>
                        </div>
                      ) : (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate">暂未设置</span>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs leading-none"
                            data-acbox-action="topic_open_moderators"
                            data-acbox-label={topic?.name || safeIdOrSlug}
                            onClick={() => setModeratorDialogOpen(true)}
                          >
                            更多&gt;&gt;
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="lg"
                    className="min-w-[124px]"
                    disabled={!topicId}
                    data-acbox-action="topic_create_post"
                    data-acbox-label={topic?.name || safeIdOrSlug}
                    onClick={handleCreatePost}
                  >
                    <PenSquare className="mr-1.5 h-4 w-4" />
                    发布帖子
                  </Button>
                  <Button
                    type="button"
                    variant={followed ? 'outline' : 'default'}
                    disabled={followBusy || !topicId}
                    data-acbox-action={followed ? 'topic_unfollow' : 'topic_follow'}
                    data-acbox-label={topic?.name || safeIdOrSlug}
                    onClick={() => void handleToggleFollow()}
                  >
                    {followBusy ? '处理中...' : followed ? '已关注' : '关注话题'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-acbox-action="topic_share"
                    data-acbox-label={topic?.name || safeIdOrSlug}
                    onClick={() => void handleShareTopic()}
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    分享
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {topic?.announcement?.trim() ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base">
                  <Hash className="mr-2 h-4 w-4 text-primary" />
                  板块公告
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground/90">
                {topic.announcement}
              </CardContent>
            </Card>
          ) : null}

          {canModerateTopicSettings ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">话题治理面板</CardTitle>
                <CardDescription>版主和管理员可直接调整公告、锁定、推荐与置顶设置。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <Label htmlFor="topic-lock" className="text-sm">锁定话题</Label>
                      <p className="text-xs text-muted-foreground">锁定后，普通用户不可在此话题发帖。</p>
                    </div>
                    <Switch
                      id="topic-lock"
                      checked={moderationIsLocked}
                      onCheckedChange={setModerationIsLocked}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <Label htmlFor="topic-recommend" className="text-sm">推荐话题</Label>
                      <p className="text-xs text-muted-foreground">推荐后，话题可在前端优先曝光。</p>
                    </div>
                    <Switch
                      id="topic-recommend"
                      checked={moderationIsRecommended}
                      onCheckedChange={setModerationIsRecommended}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic-announcement">话题公告</Label>
                  <Textarea
                    id="topic-announcement"
                    placeholder="输入公告内容，展示在话题顶部。"
                    rows={3}
                    maxLength={300}
                    value={moderationAnnouncement}
                    onChange={(event) => setModerationAnnouncement(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic-pinned-post-id">置顶帖子 ID（可选）</Label>
                  <Input
                    id="topic-pinned-post-id"
                    placeholder="填写帖子 ID，留空表示取消置顶"
                    value={moderationPinnedPostId}
                    onChange={(event) => setModerationPinnedPostId(event.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={moderationSaving}
                    data-acbox-action="topic_moderation_reset"
                    data-acbox-label={topic?.name || safeIdOrSlug}
                    onClick={() => {
                      setModerationAnnouncement(String(topic?.announcement || ''));
                      setModerationPinnedPostId(String(topic?.pinned_post_id || ''));
                      setModerationIsLocked(Boolean(topic?.is_locked));
                      setModerationIsRecommended(Boolean(topic?.is_recommended));
                    }}
                  >
                    重置
                  </Button>
                  <Button
                    type="button"
                    disabled={moderationSaving}
                    data-acbox-action="topic_moderation_save"
                    data-acbox-label={topic?.name || safeIdOrSlug}
                    onClick={() => void handleModeratorSave()}
                  >
                    {moderationSaving ? '保存中...' : '保存治理设置'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Tabs
            value={activeFeedTab}
            onValueChange={(value) => setActiveFeedTab(value === 'hot' ? 'hot' : 'latest')}
          >
            <TabsList className="mb-4 border bg-card">
              <TabsTrigger
                value="latest"
                data-acbox-action="topic_tab_latest"
                data-acbox-label={topic?.name || safeIdOrSlug}
              >
                最新帖子
              </TabsTrigger>
              <TabsTrigger
                value="hot"
                data-acbox-action="topic_tab_hot"
                data-acbox-label={topic?.name || safeIdOrSlug}
              >
                热门帖子
              </TabsTrigger>
            </TabsList>
            <TabsContent value="latest">
              {renderPostStream(latestPosts, {
                tab: 'latest',
                hasMore: latestHasMore,
                loadingMore: latestLoadingMore,
                anchorRef: latestLoadMoreAnchorRef,
              })}
            </TabsContent>
            <TabsContent value="hot">
              {renderPostStream(hotPosts, {
                tab: 'hot',
                hasMore: hotHasMore,
                loadingMore: hotLoadingMore,
                anchorRef: hotLoadMoreAnchorRef,
              })}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="hidden space-y-4 lg:block">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center text-base">
                    <Users className="mr-2 h-4 w-4" />
                    版主团队
                  </CardTitle>
                  <CardDescription>负责本话题管理与内容治理。</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-[-4px] h-8 w-8 shrink-0 text-muted-foreground/70"
                      aria-label="话题操作"
                      data-acbox-action="topic_more_actions"
                      data-acbox-label={topic?.name || safeIdOrSlug}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      disabled={!topicId}
                      data-acbox-action="topic_copy_id"
                      data-acbox-label={topic?.name || safeIdOrSlug}
                      onClick={() => void handleCopyTopicId()}
                    >
                      复制话题 ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasModerators ? (
                moderators.map((moderator) => {
                  const moderatorName = String(
                    moderator?.name || moderator?.username || '版主',
                  ).trim();
                  const moderatorUsername = String(
                    moderator?.username || '',
                  ).trim();
                  const avatar = String(moderator?.avatar || '').trim();
                  return (
                    <div
                      key={String(moderator?._id || moderatorName)}
                      className="flex items-center gap-3 rounded-md border px-3 py-2"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatar} alt={moderatorName} />
                        <AvatarFallback>
                          {moderatorName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium">
                          {moderatorName}
                        </p>
                        {moderatorUsername ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            @{moderatorUsername}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">暂未设置版主。</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={moderatorDialogOpen} onOpenChange={setModeratorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-base">
              <Users className="mr-2 h-4 w-4" />
              版主团队
            </DialogTitle>
            <DialogDescription>负责本话题管理与内容治理。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!topicId}
                data-acbox-action="topic_copy_id_dialog"
                data-acbox-label={topic?.name || safeIdOrSlug}
                onClick={() => void handleCopyTopicId()}
              >
                复制话题 ID
              </Button>
            </div>
            {hasModerators ? (
              moderators.map((moderator) => {
                const moderatorName = String(
                  moderator?.name || moderator?.username || '版主',
                ).trim();
                const moderatorUsername = String(
                  moderator?.username || '',
                ).trim();
                const avatar = String(moderator?.avatar || '').trim();
                return (
                  <div
                    key={`topic-dialog-moderator-${String(moderator?._id || moderatorName)}`}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatar} alt={moderatorName} />
                      <AvatarFallback>
                        {moderatorName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-medium">
                        {moderatorName}
                      </p>
                      {moderatorUsername ? (
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          @{moderatorUsername}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">暂未设置版主。</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
