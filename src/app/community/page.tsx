'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import CommunityInfoPanel from '@/components/community/CommunityInfoPanel';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import CommunitySidebar from '@/components/community/CommunitySidebar';
import CreatePostForm from '@/components/community/CreatePostForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  followTopic,
  getCommunityFeed,
  getCommunityTopics,
  getMyFollowedTopics,
  getTopicFollowStatus,
  moderatorDeleteTopicPost,
  moderatorSetTopicPostStatus,
  moderatorUpdateTopic,
  unfollowTopic,
  type CommunityTopicItem,
} from '@/lib/community-api';
import type { CommunityPost } from '@/types';
import { Loader2, X } from 'lucide-react';

function CommunityLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={`community-skeleton-${index}`} className="animate-pulse rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-3 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-11/12 rounded bg-muted" />
            <div className="h-3 w-9/12 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const FEED_PAGE_SIZE = 10;
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>([]);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>([]);
  const [topicList, setTopicList] = useState<CommunityTopicItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopicItem | null>(null);
  const [followedTopicIds, setFollowedTopicIds] = useState<string[]>([]);
  const [followLoadingTopicId, setFollowLoadingTopicId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [latestPage, setLatestPage] = useState(1);
  const [hotPage, setHotPage] = useState(1);
  const [latestTotal, setLatestTotal] = useState(0);
  const [hotTotal, setHotTotal] = useState(0);
  const [latestPageSize, setLatestPageSize] = useState(FEED_PAGE_SIZE);
  const [hotPageSize, setHotPageSize] = useState(FEED_PAGE_SIZE);
  const [activeFeedTab, setActiveFeedTab] = useState<'latest' | 'hot'>('latest');
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [moderationAnnouncement, setModerationAnnouncement] = useState('');
  const [moderationPinnedPostId, setModerationPinnedPostId] = useState('');
  const [moderationIsLocked, setModerationIsLocked] = useState(false);
  const [moderationIsRecommended, setModerationIsRecommended] = useState(false);
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationPostId, setModerationPostId] = useState('');

  const requestIdRef = useRef(0);

  const selectedTopicId = useMemo(() => String(selectedTopic?._id || '').trim(), [selectedTopic]);
  const currentUserId = useMemo(() => String(user?._id || '').trim(), [user]);
  const canModerateSelectedTopic = useMemo(() => {
    if (!selectedTopicId || !currentUserId) return false;
    const moderatorIds = Array.isArray(selectedTopic?.moderator_ids)
      ? selectedTopic.moderator_ids
          .map((id) => String(id || '').trim())
          .filter(Boolean)
      : [];
    return moderatorIds.includes(currentUserId);
  }, [currentUserId, selectedTopic, selectedTopicId]);
  const selectedTopicFollowed = useMemo(
    () => Boolean(selectedTopicId && followedTopicIds.includes(selectedTopicId)),
    [followedTopicIds, selectedTopicId],
  );

  const resetModerationForm = useCallback((topic: CommunityTopicItem | null) => {
    setModerationAnnouncement(String(topic?.announcement || ''));
    setModerationPinnedPostId(String(topic?.pinned_post_id || ''));
    setModerationIsLocked(Boolean(topic?.is_locked));
    setModerationIsRecommended(Boolean(topic?.is_recommended));
  }, []);

  const patchTopicInState = useCallback((topic: CommunityTopicItem) => {
    const topicId = String(topic?._id || '').trim();
    if (!topicId) return;

    setTopicList((prev) =>
      prev.map((item) =>
        String(item._id || '').trim() === topicId
          ? {
              ...item,
              ...topic,
            }
          : item,
      ),
    );

    setSelectedTopic((prev) => {
      if (!prev) return prev;
      if (String(prev._id || '').trim() !== topicId) return prev;
      return {
        ...prev,
        ...topic,
      };
    });
  }, []);

  const removePostFromFeeds = useCallback((postId: string) => {
    const safePostId = String(postId || '').trim();
    if (!safePostId) return;
    setLatestPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== safePostId));
    setHotPosts((prev) => prev.filter((item) => String(item.id || '').trim() !== safePostId));
  }, []);

  const patchTopicFollowersCount = useCallback((topicId: string, followersCount: number) => {
    const safeTopicId = String(topicId || '').trim();
    if (!safeTopicId) return;
    const safeCount = Math.max(0, Number(followersCount || 0));

    setTopicList((prev) =>
      prev.map((topic) =>
        String(topic._id || '').trim() === safeTopicId
          ? {
              ...topic,
              followers_count: safeCount,
            }
          : topic,
      ),
    );

    setSelectedTopic((prev) => {
      if (!prev) return prev;
      if (String(prev._id || '').trim() !== safeTopicId) return prev;
      return {
        ...prev,
        followers_count: safeCount,
      };
    });
  }, []);

  const loadTopics = useCallback(async () => {
    setTopicsLoading(true);
    const data = await getCommunityTopics({
      page: 1,
      pageSize: 30,
      sort: 'hot',
    });
    setTopicList(data.list || []);
    setTopicsLoading(false);
  }, []);

  const loadMyFollowedTopics = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setFollowedTopicIds([]);
      return;
    }
    const list = await getMyFollowedTopics({ token, page: 1, pageSize: 200 });
    const ids = list
      .map((item) => String(item?._id || '').trim())
      .filter(Boolean);
    setFollowedTopicIds(Array.from(new Set(ids)));
  }, [isAuthenticated, token]);

  const syncTopicFollowStatus = useCallback(
    async (topicId: string) => {
      const safeTopicId = String(topicId || '').trim();
      if (!safeTopicId || !isAuthenticated || !token) return;
      const status = await getTopicFollowStatus({ token, topicId: safeTopicId });
      if (!status) return;

      patchTopicFollowersCount(safeTopicId, status.followers_count);
      setFollowedTopicIds((prev) => {
        const set = new Set(prev);
        if (status.followed) {
          set.add(safeTopicId);
        } else {
          set.delete(safeTopicId);
        }
        return Array.from(set);
      });
    },
    [isAuthenticated, token, patchTopicFollowersCount],
  );

  const loadCommunityFeeds = useCallback(
    async (
      showLoading = true,
      topicId?: string,
      options?: {
        latestPage?: number;
        hotPage?: number;
      },
    ) => {
      const requestId = ++requestIdRef.current;
      if (showLoading) setIsLoading(true);
      const targetLatestPage = Math.max(1, Number(options?.latestPage || latestPage || 1));
      const targetHotPage = Math.max(1, Number(options?.hotPage || hotPage || 1));

      const [latest, hot] = await Promise.all([
        getCommunityFeed('latest', { page: targetLatestPage, pageSize: FEED_PAGE_SIZE, topicId }),
        getCommunityFeed('hot', { page: targetHotPage, pageSize: FEED_PAGE_SIZE, topicId }),
      ]);

      if (requestId !== requestIdRef.current) return;

      setLatestPosts(latest.list);
      setHotPosts(hot.list);
      setLatestPage(latest.page);
      setHotPage(hot.page);
      setLatestTotal(latest.total);
      setHotTotal(hot.total);
      setLatestPageSize(latest.pageSize);
      setHotPageSize(hot.pageSize);
      setIsLoading(false);
    },
    [FEED_PAGE_SIZE, hotPage, latestPage],
  );

  const handleToggleFollow = useCallback(
    async (topic: CommunityTopicItem) => {
      const topicId = String(topic?._id || '').trim();
      if (!topicId) return;

      if (!isAuthenticated || !token) {
        toast({ title: '需要登录', description: '请先登录后再关注话题', variant: 'destructive' });
        return;
      }

      const followed = followedTopicIds.includes(topicId);
      setFollowLoadingTopicId(topicId);
      const result = followed
        ? await unfollowTopic({ token, topicId })
        : await followTopic({ token, topicId });
      setFollowLoadingTopicId('');

      if (!result.ok || !result.data) {
        toast({ title: followed ? '取消关注失败' : '关注失败', description: result.message, variant: 'destructive' });
        return;
      }

      setFollowedTopicIds((prev) => {
        const set = new Set(prev);
        if (result.data?.followed) {
          set.add(topicId);
        } else {
          set.delete(topicId);
        }
        return Array.from(set);
      });

      patchTopicFollowersCount(topicId, result.data.followers_count);

      toast({
        title: result.data.followed ? '关注成功' : '已取消关注',
        description: result.message,
      });
    },
    [followedTopicIds, isAuthenticated, patchTopicFollowersCount, toast, token],
  );

  const handleModeratorSave = useCallback(async () => {
    if (!selectedTopicId || !canModerateSelectedTopic || !token) return;

    setModerationSaving(true);
    const result = await moderatorUpdateTopic({
      token,
      topicId: selectedTopicId,
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

    patchTopicInState(result.topic);
    resetModerationForm(result.topic);
    toast({
      title: '保存成功',
      description: result.message,
    });
    void loadCommunityFeeds(false, selectedTopicId);
  }, [
    canModerateSelectedTopic,
    loadCommunityFeeds,
    moderationAnnouncement,
    moderationIsLocked,
    moderationIsRecommended,
    moderationPinnedPostId,
    patchTopicInState,
    resetModerationForm,
    selectedTopicId,
    toast,
    token,
  ]);

  const handleModeratorOfflinePost = useCallback(async (post: CommunityPost) => {
    const topicId = selectedTopicId;
    const postId = String(post?.id || '').trim();
    if (!topicId || !postId || !token) return;

    const ok = window.confirm('确认下线该帖子？下线后将不再在社区流中展示。');
    if (!ok) return;

    setModerationPostId(postId);
    const result = await moderatorSetTopicPostStatus({
      token,
      topicId,
      postId,
      status: 0,
    });
    setModerationPostId('');

    if (!result.ok) {
      toast({
        title: '下线失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    removePostFromFeeds(postId);
    toast({
      title: '已下线',
      description: result.message,
    });
    void loadCommunityFeeds(false, topicId);
  }, [loadCommunityFeeds, removePostFromFeeds, selectedTopicId, toast, token]);

  const handleModeratorDeletePost = useCallback(async (post: CommunityPost) => {
    const topicId = selectedTopicId;
    const postId = String(post?.id || '').trim();
    if (!topicId || !postId || !token) return;

    const ok = window.confirm('确认删除该帖子？此操作会软删除并从列表移除。');
    if (!ok) return;

    setModerationPostId(postId);
    const result = await moderatorDeleteTopicPost({
      token,
      topicId,
      postId,
    });
    setModerationPostId('');

    if (!result.ok) {
      toast({
        title: '删除失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    removePostFromFeeds(postId);
    toast({
      title: '删除成功',
      description: result.message,
    });
    void loadCommunityFeeds(false, topicId);
  }, [loadCommunityFeeds, removePostFromFeeds, selectedTopicId, toast, token]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    void loadMyFollowedTopics();
  }, [loadMyFollowedTopics]);

  useEffect(() => {
    void loadCommunityFeeds(true, selectedTopicId || undefined, { latestPage: 1, hotPage: 1 });
    if (selectedTopicId) {
      void syncTopicFollowStatus(selectedTopicId);
    }
  }, [loadCommunityFeeds, selectedTopicId, syncTopicFollowStatus]);

  useEffect(() => {
    resetModerationForm(selectedTopic);
  }, [resetModerationForm, selectedTopic]);

  useEffect(() => {
    const handlePageShow = () => {
      void loadCommunityFeeds(true, selectedTopicId || undefined);
      if (selectedTopicId) {
        void syncTopicFollowStatus(selectedTopicId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadCommunityFeeds(false, selectedTopicId || undefined);
        if (selectedTopicId) {
          void syncTopicFollowStatus(selectedTopicId);
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCommunityFeeds, selectedTopicId, syncTopicFollowStatus]);

  const handlePosted = useCallback(() => {
    void loadCommunityFeeds(false, selectedTopicId || undefined, { latestPage: 1, hotPage: 1 });
    void loadTopics();
    void loadMyFollowedTopics();
  }, [loadCommunityFeeds, loadMyFollowedTopics, loadTopics, selectedTopicId]);

  const handleSelectTopic = useCallback(
    (topic: CommunityTopicItem | null) => {
      if (!topic) {
        setSelectedTopic(null);
        return;
      }
      const target = String(topic.slug || topic._id || '').trim();
      if (!target) return;
      router.push(`/community/topic/${encodeURIComponent(target)}`);
    },
    [router],
  );

  const latestTotalPages = Math.max(1, Math.ceil(latestTotal / Math.max(1, latestPageSize)));
  const hotTotalPages = Math.max(1, Math.ceil(hotTotal / Math.max(1, hotPageSize)));

  const handleChangePage = useCallback(
    (targetTab: 'latest' | 'hot', targetPage: number) => {
      const normalizedPage = Math.max(1, targetPage);
      if (targetTab === 'latest') {
        if (normalizedPage === latestPage) return;
        void loadCommunityFeeds(true, selectedTopicId || undefined, { latestPage: normalizedPage, hotPage });
        return;
      }
      if (normalizedPage === hotPage) return;
      void loadCommunityFeeds(true, selectedTopicId || undefined, { latestPage, hotPage: normalizedPage });
    },
    [hotPage, latestPage, loadCommunityFeeds, selectedTopicId],
  );

  const renderPostList = (
    posts: CommunityPost[],
    options: {
      tab: 'latest' | 'hot';
      page: number;
      totalPages: number;
      total: number;
    },
  ) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在加载社区内容...
          </div>
          <CommunityLoadingSkeleton />
        </div>
      );
    }

    if (posts.length === 0) {
      return <p className="py-8 text-center text-sm text-muted-foreground">暂无帖子，稍后再试。</p>;
    }

    return (
      <div className="space-y-4">
        {posts.map((post, index) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            index={index}
            canModerate={Boolean(selectedTopicId && canModerateSelectedTopic)}
            moderationBusy={moderationPostId === String(post.id || '').trim()}
            onModerateOffline={handleModeratorOfflinePost}
            onModerateDelete={handleModeratorDeletePost}
          />
        ))}
        <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground sm:text-sm">
          <span>
            第 {options.page} / {options.totalPages} 页 · 共 {options.total} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || options.page <= 1}
              onClick={() => handleChangePage(options.tab, options.page - 1)}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || options.page >= options.totalPages}
              onClick={() => handleChangePage(options.tab, options.page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:gap-x-6">
        <div className="mb-6 w-full lg:mb-0 lg:w-1/4 xl:w-1/5">
          <CommunitySidebar
            topics={topicList}
            loading={topicsLoading}
            selectedTopicId={selectedTopicId}
            followedTopicIds={followedTopicIds}
            followLoadingTopicId={followLoadingTopicId}
            onToggleFollow={handleToggleFollow}
            onSelectTopic={handleSelectTopic}
          />
        </div>

        <div className="w-full lg:min-w-0 lg:w-1/2 xl:flex-grow">
          <CreatePostForm onPosted={handlePosted} selectedTopic={selectedTopic} />

          {selectedTopic && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant="secondary">#{selectedTopic.name}</Badge>
                  <span className="truncate text-muted-foreground">
                    热度 {Number(selectedTopic.heat_score || 0)} · 帖子 {Number(selectedTopic.post_count || 0)} · 关注 {Number(selectedTopic.followers_count || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={selectedTopicFollowed ? 'outline' : 'default'}
                    size="sm"
                    disabled={followLoadingTopicId === selectedTopicId}
                    onClick={() => void handleToggleFollow(selectedTopic)}
                  >
                    {followLoadingTopicId === selectedTopicId
                      ? '处理中...'
                      : selectedTopicFollowed
                        ? '已关注'
                        : '关注'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedTopic.announcement ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">话题公告：{selectedTopic.announcement}</p>
              ) : null}
            </div>
          )}

          {selectedTopic && canModerateSelectedTopic ? (
            <div className="mt-3 rounded-lg border bg-card px-3 py-2.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">版主治理面板</p>
                  <p className="text-xs text-muted-foreground">可控制话题锁定、推荐、公告与置顶帖子。</p>
                </div>
                <Badge variant="outline">版主</Badge>
              </div>

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

              <div className="mt-3 space-y-2">
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

              <div className="mt-3 space-y-2">
                <Label htmlFor="topic-pinned-post-id">置顶帖子 ID（可选）</Label>
                <Input
                  id="topic-pinned-post-id"
                  placeholder="填写帖子 ID，留空表示取消置顶"
                  value={moderationPinnedPostId}
                  onChange={(event) => setModerationPinnedPostId(event.target.value)}
                />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={moderationSaving}
                  onClick={() => resetModerationForm(selectedTopic)}
                >
                  重置
                </Button>
                <Button
                  type="button"
                  disabled={moderationSaving}
                  onClick={() => void handleModeratorSave()}
                >
                  {moderationSaving ? '保存中...' : '保存治理设置'}
                </Button>
              </div>
            </div>
          ) : null}

          <Separator className="my-6" />

          <Tabs
            value={activeFeedTab}
            onValueChange={(value) => setActiveFeedTab(value === 'hot' ? 'hot' : 'latest')}
            className="w-full"
          >
            <TabsList className="mb-4 border bg-card">
              <TabsTrigger value="latest" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                最新
              </TabsTrigger>
              <TabsTrigger value="hot" className="text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                热门
              </TabsTrigger>
            </TabsList>
            <TabsContent value="latest" className="space-y-4">
              {renderPostList(latestPosts, {
                tab: 'latest',
                page: latestPage,
                totalPages: latestTotalPages,
                total: latestTotal,
              })}
            </TabsContent>
            <TabsContent value="hot" className="space-y-4">
              {renderPostList(hotPosts, {
                tab: 'hot',
                page: hotPage,
                totalPages: hotTotalPages,
                total: hotTotal,
              })}
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 hidden xl:block xl:w-1/4 lg:mt-0">
          <CommunityInfoPanel posts={selectedTopicId ? latestPosts : hotPosts} />
        </div>
      </div>
    </div>
  );
}
