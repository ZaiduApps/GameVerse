'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  adminDeleteCommunityPost,
  adminSetCommunityPostStatus,
  deleteMyCommunityPost,
  followTopic,
  type CommunityFeedResult,
  getCommunityFeed,
  getCommunityTopics,
  getMyFollowedTopics,
  getTopicFollowStatus,
  moderatorDeleteTopicPost,
  moderatorSetTopicPostStatus,
  moderatorUpdateTopic,
  setMyCommunityPostStatus,
  unfollowTopic,
  type CommunityTopicItem,
} from '@/lib/community-api';
import {
  readCommunityReturnSnapshotForRestore,
  writeCommunityReturnSnapshot,
  type CommunityFeedTab,
  type CommunityReturnSnapshot,
} from '@/lib/community-return';
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

export interface CommunityPageInitialData {
  latestFeed: CommunityFeedResult;
  hotFeed: CommunityFeedResult;
  topics: CommunityTopicItem[];
}

interface CommunityPageViewProps {
  initialData?: CommunityPageInitialData;
}

export default function CommunityPageView({ initialData }: CommunityPageViewProps) {
  const FEED_PAGE_SIZE = 10;
  const HOT_TOPICS_LIMIT = 10;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();

  const initialLatestFeed = initialData?.latestFeed;
  const initialHotFeed = initialData?.hotFeed;
  const initialTopics = initialData?.topics || [];
  const hasInitialFeedData = Boolean(initialLatestFeed && initialHotFeed);

  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>(() => initialLatestFeed?.list || []);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>(() => initialHotFeed?.list || []);
  const [topicList, setTopicList] = useState<CommunityTopicItem[]>(() => initialTopics);
  const [selectedTopic, setSelectedTopic] = useState<CommunityTopicItem | null>(null);
  const [followedTopicIds, setFollowedTopicIds] = useState<string[]>([]);
  const [followLoadingTopicId, setFollowLoadingTopicId] = useState('');
  const [isLoading, setIsLoading] = useState(!hasInitialFeedData);
  const [latestPage, setLatestPage] = useState(() => Math.max(1, Number(initialLatestFeed?.page || 1)));
  const [hotPage, setHotPage] = useState(() => Math.max(1, Number(initialHotFeed?.page || 1)));
  const [latestTotal, setLatestTotal] = useState(() => Math.max(0, Number(initialLatestFeed?.total || 0)));
  const [hotTotal, setHotTotal] = useState(() => Math.max(0, Number(initialHotFeed?.total || 0)));
  const [latestPageSize, setLatestPageSize] = useState(() => Math.max(1, Number(initialLatestFeed?.pageSize || FEED_PAGE_SIZE)));
  const [hotPageSize, setHotPageSize] = useState(() => Math.max(1, Number(initialHotFeed?.pageSize || FEED_PAGE_SIZE)));
  const [latestHasMore, setLatestHasMore] = useState(() => Boolean(initialLatestFeed?.hasMore));
  const [hotHasMore, setHotHasMore] = useState(() => Boolean(initialHotFeed?.hasMore));
  const [latestLoadingMore, setLatestLoadingMore] = useState(false);
  const [hotLoadingMore, setHotLoadingMore] = useState(false);
  const [activeFeedTab, setActiveFeedTab] = useState<CommunityFeedTab>('latest');
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [showAllFollowedTopics, setShowAllFollowedTopics] = useState(false);
  const [composeFocusPending, setComposeFocusPending] = useState(false);
  const [moderationAnnouncement, setModerationAnnouncement] = useState('');
  const [moderationPinnedPostId, setModerationPinnedPostId] = useState('');
  const [moderationIsLocked, setModerationIsLocked] = useState(false);
  const [moderationIsRecommended, setModerationIsRecommended] = useState(false);
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationPostId, setModerationPostId] = useState('');

  const requestIdRef = useRef(0);
  const shouldSkipInitialFeedRequestRef = useRef(hasInitialFeedData);
  const latestLoadMoreAnchorRef = useRef<HTMLDivElement | null>(null);
  const hotLoadMoreAnchorRef = useRef<HTMLDivElement | null>(null);
  const pendingRestoredTopicIdRef = useRef<string | null>(null);
  const suppressNextResumeRefreshRef = useRef(false);

  const getPostListSignature = useCallback((posts: CommunityPost[]) => {
    return posts.map((item) => String(item.id || '').trim()).filter(Boolean).join('|');
  }, []);

  const selectedTopicId = useMemo(() => String(selectedTopic?._id || '').trim(), [selectedTopic]);
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
  const moderatedTopicIds = useMemo(() => {
    if (!currentUserId) return [] as string[];
    return topicList
      .map((topic) => {
        const topicId = String(topic?._id || '').trim();
        if (!topicId) return '';
        const moderatorIds = Array.isArray(topic?.moderator_ids)
          ? topic.moderator_ids
              .map((id) => String(id || '').trim())
              .filter(Boolean)
          : [];
        if (moderatorIds.includes(currentUserId)) return topicId;
        return '';
      })
      .filter(Boolean);
  }, [currentUserId, topicList]);
  const isTopicModeratorById = useCallback(
    (topicId?: string | null) => {
      const safeTopicId = String(topicId || '').trim();
      if (!safeTopicId) return false;
      return moderatedTopicIds.includes(safeTopicId);
    },
    [moderatedTopicIds],
  );
  const canModerateTopicId = useCallback(
    (topicId?: string | null) => {
      const safeTopicId = String(topicId || '').trim();
      if (!safeTopicId) return false;
      if (isAdminUser) return true;
      return isTopicModeratorById(safeTopicId);
    },
    [isAdminUser, isTopicModeratorById],
  );
  const canModerateSelectedTopic = useMemo(() => {
    if (!selectedTopicId) return false;
    return canModerateTopicId(selectedTopicId);
  }, [canModerateTopicId, selectedTopicId]);
  const selectedTopicFollowed = useMemo(
    () => Boolean(selectedTopicId && followedTopicIds.includes(selectedTopicId)),
    [followedTopicIds, selectedTopicId],
  );

  const restoreCommunityReturnSnapshot = useCallback((snapshot: CommunityReturnSnapshot) => {
    const restoredTopic = snapshot.selectedTopic || null;
    const restoredTopicId = String(restoredTopic?._id || snapshot.selectedTopicId || '').trim();
    requestIdRef.current += 1;
    pendingRestoredTopicIdRef.current = restoredTopic && restoredTopicId ? restoredTopicId : '';
    suppressNextResumeRefreshRef.current = true;

    setLatestPosts(snapshot.latest.posts);
    setHotPosts(snapshot.hot.posts);
    setLatestPage(Math.max(1, Number(snapshot.latest.page || 1)));
    setHotPage(Math.max(1, Number(snapshot.hot.page || 1)));
    setLatestTotal(Math.max(0, Number(snapshot.latest.total || 0)));
    setHotTotal(Math.max(0, Number(snapshot.hot.total || 0)));
    setLatestPageSize(Math.max(1, Number(snapshot.latest.pageSize || FEED_PAGE_SIZE)));
    setHotPageSize(Math.max(1, Number(snapshot.hot.pageSize || FEED_PAGE_SIZE)));
    setLatestHasMore(Boolean(snapshot.latest.hasMore));
    setHotHasMore(Boolean(snapshot.hot.hasMore));
    setLatestLoadingMore(false);
    setHotLoadingMore(false);
    setActiveFeedTab(snapshot.activeFeedTab === 'hot' ? 'hot' : 'latest');
    setSelectedTopic(restoredTopic);
    setIsLoading(false);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: Math.max(0, Number(snapshot.scrollY || 0)), behavior: 'auto' });
      });
    });
  }, [FEED_PAGE_SIZE]);

  const { followedTopics, officialTopics, hotTopics } = useMemo(() => {
    const topicMap = new Map<string, CommunityTopicItem>();
    for (const item of topicList) {
      const id = String(item?._id || '').trim();
      if (!id) continue;
      if (!topicMap.has(id)) {
        topicMap.set(id, item);
        continue;
      }
      const prev = topicMap.get(id)!;
      const prevScore = Number(prev.heat_score || 0);
      const currScore = Number(item.heat_score || 0);
      if (currScore >= prevScore) topicMap.set(id, item);
    }

    const deduped = Array.from(topicMap.values());
    const followedSet = new Set(followedTopicIds.map((id) => String(id || '').trim()).filter(Boolean));

    const followed = deduped
      .filter((topic) => followedSet.has(String(topic._id || '').trim()))
      .sort((a, b) => Number(b.heat_score || 0) - Number(a.heat_score || 0));

    const official = deduped
      .filter((topic) => Boolean(topic.is_official))
      .sort((a, b) => Number(b.heat_score || 0) - Number(a.heat_score || 0));

    const hot = deduped
      .filter((topic) => {
        const id = String(topic._id || '').trim();
        if (!id) return false;
        if (followedSet.has(id)) return false;
        if (topic.is_official) return false;
        return true;
      })
      .sort((a, b) => Number(b.heat_score || 0) - Number(a.heat_score || 0))
      .slice(0, HOT_TOPICS_LIMIT);

    return {
      followedTopics: followed,
      officialTopics: official,
      hotTopics: hot,
    };
  }, [HOT_TOPICS_LIMIT, topicList, followedTopicIds]);

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

  const getPostTopicIds = useCallback(
    (post: CommunityPost) => {
      const candidates = [
        selectedTopicId,
        ...(Array.isArray(post.topicIds) ? post.topicIds : []),
      ]
        .map((id) => String(id || '').trim())
        .filter(Boolean);
      return Array.from(new Set(candidates));
    },
    [selectedTopicId],
  );
  const resolveModerationTopicId = useCallback(
    (post: CommunityPost) => {
      const candidates = getPostTopicIds(post);
      if (!candidates.length) return '';
      if (isAdminUser) return candidates[0];
      return candidates.find((topicId) => canModerateTopicId(topicId)) || '';
    },
    [canModerateTopicId, getPostTopicIds, isAdminUser],
  );

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
      pageSize: 10,
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
    ): Promise<{
      latestPage: number;
      hotPage: number;
      latestSignature: string;
      hotSignature: string;
    } | null> => {
      const requestId = ++requestIdRef.current;
      if (showLoading) setIsLoading(true);
      const targetLatestPage = Math.max(1, Number(options?.latestPage || 1));
      const targetHotPage = Math.max(1, Number(options?.hotPage || 1));

      const [latest, hot] = await Promise.all([
        getCommunityFeed('latest', { page: targetLatestPage, pageSize: FEED_PAGE_SIZE, topicId }),
        getCommunityFeed('hot', { page: targetHotPage, pageSize: FEED_PAGE_SIZE, topicId }),
      ]);

      if (requestId !== requestIdRef.current) return null;

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
      setIsLoading(false);

      return {
        latestPage: latest.page,
        hotPage: hot.page,
        latestSignature: latest.list.map((item) => String(item.id || '').trim()).filter(Boolean).join('|'),
        hotSignature: hot.list.map((item) => String(item.id || '').trim()).filter(Boolean).join('|'),
      };
    },
    [FEED_PAGE_SIZE],
  );

  const loadMoreByTab = useCallback(
    async (targetTab: CommunityFeedTab) => {
      if (isLoading) return;
      if (targetTab === 'latest') {
        if (latestLoadingMore || !latestHasMore) return;
        const nextPage = Math.max(1, latestPage + 1);
        setLatestLoadingMore(true);
        const result = await getCommunityFeed('latest', {
          page: nextPage,
          pageSize: FEED_PAGE_SIZE,
          topicId: selectedTopicId || undefined,
        });
        setLatestLoadingMore(false);
        if (result.page < nextPage) {
          toast({
            title: '加载失败',
            description: '接口返回页码未前进，请稍后重试。',
            variant: 'destructive',
          });
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
      const result = await getCommunityFeed('hot', {
        page: nextPage,
        pageSize: FEED_PAGE_SIZE,
        topicId: selectedTopicId || undefined,
      });
      setHotLoadingMore(false);
      if (result.page < nextPage) {
        toast({
          title: '加载失败',
          description: '接口返回页码未前进，请稍后重试。',
          variant: 'destructive',
        });
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
    },
    [
      FEED_PAGE_SIZE,
      hotHasMore,
      hotLoadingMore,
      hotPage,
      isLoading,
      latestHasMore,
      latestLoadingMore,
      latestPage,
      selectedTopicId,
      toast,
    ],
  );

  const persistCommunityPostReturn = useCallback(
    (targetPostId: string) => {
      const safePostId = String(targetPostId || '').trim();
      if (!safePostId) return;

      writeCommunityReturnSnapshot({
        targetPostId: safePostId,
        activeFeedTab,
        selectedTopic,
        selectedTopicId,
        latest: {
          posts: latestPosts,
          page: latestPage,
          total: latestTotal,
          pageSize: latestPageSize,
          hasMore: latestHasMore,
        },
        hot: {
          posts: hotPosts,
          page: hotPage,
          total: hotTotal,
          pageSize: hotPageSize,
          hasMore: hotHasMore,
        },
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      });
    },
    [
      activeFeedTab,
      hotHasMore,
      hotPage,
      hotPageSize,
      hotPosts,
      hotTotal,
      latestHasMore,
      latestPage,
      latestPageSize,
      latestPosts,
      latestTotal,
      selectedTopic,
      selectedTopicId,
    ],
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

  const handleHidePost = useCallback(async (post: CommunityPost) => {
    const topicId = resolveModerationTopicId(post);
    const postId = String(post?.id || '').trim();
    const isOwner = Boolean(
      currentUserId &&
      String(post.authorId || '').trim() === currentUserId &&
      String(post.authorType || '').trim().toLowerCase() === 'user',
    );
    const canUseTopicModeration = Boolean(topicId && isTopicModeratorById(topicId));
    const canUseAdminApi = Boolean(isAdminUser);
    const canUseMyPostApi = isOwner && !canUseTopicModeration && !canUseAdminApi;
    if (!postId || !token || (!canUseTopicModeration && !canUseAdminApi && !canUseMyPostApi)) return;

    const ok = window.confirm('确认隐藏该帖子？隐藏后将不再在社区流中展示。');
    if (!ok) return;

    setModerationPostId(postId);
    const result = canUseTopicModeration
      ? await moderatorSetTopicPostStatus({
          token,
          topicId: topicId!,
          postId,
          status: 0,
        })
      : canUseAdminApi
      ? await adminSetCommunityPostStatus({
          token,
          postId,
          status: 0,
        })
      : await setMyCommunityPostStatus({
          token,
          postId,
          status: 0,
        });
    setModerationPostId('');

    if (!result.ok) {
      toast({
        title: '隐藏失败',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    removePostFromFeeds(postId);
    toast({
      title: '已隐藏',
      description: result.message,
    });
    void loadCommunityFeeds(false, selectedTopicId || undefined);
  }, [currentUserId, isAdminUser, isTopicModeratorById, loadCommunityFeeds, removePostFromFeeds, resolveModerationTopicId, selectedTopicId, toast, token]);

  const handleDeletePost = useCallback(async (post: CommunityPost) => {
    const topicId = resolveModerationTopicId(post);
    const postId = String(post?.id || '').trim();
    const isOwner = Boolean(
      currentUserId &&
      String(post.authorId || '').trim() === currentUserId &&
      String(post.authorType || '').trim().toLowerCase() === 'user',
    );
    const canUseTopicModeration = Boolean(topicId && isTopicModeratorById(topicId));
    const canUseAdminApi = Boolean(isAdminUser);
    const canUseMyPostApi = isOwner && !canUseTopicModeration && !canUseAdminApi;
    if (!postId || !token || (!canUseTopicModeration && !canUseAdminApi && !canUseMyPostApi)) return;

    const ok = window.confirm('确认删除该帖子？此操作会软删除并从列表移除。');
    if (!ok) return;

    setModerationPostId(postId);
    const result = canUseTopicModeration
      ? await moderatorDeleteTopicPost({
          token,
          topicId: topicId!,
          postId,
        })
      : canUseAdminApi
      ? await adminDeleteCommunityPost({
          token,
          postId,
        })
      : await deleteMyCommunityPost({
          token,
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
    void loadCommunityFeeds(false, selectedTopicId || undefined);
  }, [currentUserId, isAdminUser, isTopicModeratorById, loadCommunityFeeds, removePostFromFeeds, resolveModerationTopicId, selectedTopicId, toast, token]);

  useEffect(() => {
    const snapshot = readCommunityReturnSnapshotForRestore();
    if (!snapshot) return;
    restoreCommunityReturnSnapshot(snapshot);
  }, [restoreCommunityReturnSnapshot]);

  useEffect(() => {
    if (initialTopics.length > 0) return;
    void loadTopics();
  }, [initialTopics.length, loadTopics]);

  useEffect(() => {
    void loadMyFollowedTopics();
  }, [loadMyFollowedTopics]);

  useEffect(() => {
    const topicQuery = String(searchParams.get('topic') || '').trim();
    if (!topicQuery || topicList.length === 0) return;
    const matched = topicList.find((item) => String(item?._id || '').trim() === topicQuery) || null;
    if (!matched) return;
    setSelectedTopic(matched);

    const shouldCompose = String(searchParams.get('compose') || '').trim() === '1';
    if (shouldCompose) {
      setComposeFocusPending(true);
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }, [searchParams, topicList]);

  useEffect(() => {
    const restoredTopicId = pendingRestoredTopicIdRef.current;
    if (restoredTopicId !== null) {
      if (selectedTopicId === restoredTopicId) {
        pendingRestoredTopicIdRef.current = null;
        if (selectedTopicId) {
          void syncTopicFollowStatus(selectedTopicId);
        }
        return;
      }
      if (!selectedTopicId && restoredTopicId) return;
    }

    if (shouldSkipInitialFeedRequestRef.current && !selectedTopicId) {
      shouldSkipInitialFeedRequestRef.current = false;
      return;
    }

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
      if (suppressNextResumeRefreshRef.current) {
        suppressNextResumeRefreshRef.current = false;
        return;
      }
      void loadCommunityFeeds(true, selectedTopicId || undefined, { latestPage: 1, hotPage: 1 });
      if (selectedTopicId) {
        void syncTopicFollowStatus(selectedTopicId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        if (suppressNextResumeRefreshRef.current) {
          suppressNextResumeRefreshRef.current = false;
          return;
        }
        void loadCommunityFeeds(false, selectedTopicId || undefined, { latestPage: 1, hotPage: 1 });
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

  const renderPostList = (
    posts: CommunityPost[],
    options: {
      tab: CommunityFeedTab;
      hasMore: boolean;
      loadingMore: boolean;
      anchorRef: React.RefObject<HTMLDivElement>;
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
        {posts.map((post, index) => {
          const postAuthorId = String(post.authorId || '').trim();
          const postAuthorType = String(post.authorType || '').trim().toLowerCase();
          const isOwner = Boolean(currentUserId && postAuthorId && postAuthorId === currentUserId && postAuthorType === 'user');
          const postTopicIds = getPostTopicIds(post);
          const canManage = Boolean(
            isOwner ||
            isAdminUser ||
            postTopicIds.some((topicId) => canModerateTopicId(topicId)),
          );
          return (
            <CommunityPostCard
              key={post.id}
              post={post}
              index={index}
              canManage={canManage}
              moderationBusy={moderationPostId === String(post.id || '').trim()}
              onHide={handleHidePost}
              onDelete={handleDeletePost}
              onOpenPost={persistCommunityPostReturn}
            />
          );
        })}
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
                disabled={isLoading || options.loadingMore}
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

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="flex flex-col lg:flex-row lg:gap-x-6">
        <div className="mb-6 hidden w-full lg:mb-0 lg:block lg:w-1/4 xl:w-1/5">
          <CommunitySidebar
            hotTopics={hotTopics}
            officialTopics={officialTopics}
            followedTopics={followedTopics}
            loading={topicsLoading}
            selectedTopicId={selectedTopicId}
            followedTopicIds={followedTopicIds}
            followLoadingTopicId={followLoadingTopicId}
            onToggleFollow={handleToggleFollow}
            onSelectTopic={handleSelectTopic}
            followedCollapsedCount={6}
            showAllFollowed={showAllFollowedTopics}
            onToggleFollowedExpand={() => setShowAllFollowedTopics((prev) => !prev)}
          />
        </div>

        <div className="w-full lg:min-w-0 lg:w-1/2 xl:flex-grow">
          <CreatePostForm
            onPosted={handlePosted}
            selectedTopic={selectedTopic}
            shouldAutoFocus={composeFocusPending}
            onAutoFocusHandled={() => setComposeFocusPending(false)}
          />

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
                <Badge variant="outline">版主 / 管理员</Badge>
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
                hasMore: latestHasMore,
                loadingMore: latestLoadingMore,
                anchorRef: latestLoadMoreAnchorRef,
              })}
            </TabsContent>
            <TabsContent value="hot" className="space-y-4">
              {renderPostList(hotPosts, {
                tab: 'hot',
                hasMore: hotHasMore,
                loadingMore: hotLoadingMore,
                anchorRef: hotLoadMoreAnchorRef,
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
