'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  followTopic,
  getCommunityFeed,
  getCommunityTopicDetail,
  getTopicFollowStatus,
  type CommunityTopicItem,
  unfollowTopic,
} from '@/lib/community-api';
import type { CommunityPost } from '@/types';
import { ArrowLeft, Hash, Loader2, Megaphone, Share2, Users } from 'lucide-react';

interface CommunityTopicBoardViewProps {
  idOrSlug: string;
}

const FALLBACK_TOPIC_ICON = 'https://placehold.co/96x96.png?text=%23';

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

export default function CommunityTopicBoardView({
  idOrSlug,
}: CommunityTopicBoardViewProps) {
  const FEED_PAGE_SIZE = 10;
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  const [topic, setTopic] = useState<CommunityTopicItem | null>(null);
  const [latestPosts, setLatestPosts] = useState<CommunityPost[]>([]);
  const [hotPosts, setHotPosts] = useState<CommunityPost[]>([]);
  const [latestPage, setLatestPage] = useState(1);
  const [hotPage, setHotPage] = useState(1);
  const [latestTotal, setLatestTotal] = useState(0);
  const [hotTotal, setHotTotal] = useState(0);
  const [latestPageSize, setLatestPageSize] = useState(FEED_PAGE_SIZE);
  const [hotPageSize, setHotPageSize] = useState(FEED_PAGE_SIZE);
  const [activeFeedTab, setActiveFeedTab] = useState<'latest' | 'hot'>('latest');
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const safeIdOrSlug = useMemo(
    () => decodeURIComponent(String(idOrSlug || '').trim()),
    [idOrSlug],
  );
  const topicId = useMemo(() => String(topic?._id || '').trim(), [topic]);
  const topicSharePath = useMemo(() => {
    const target = String(topic?.slug || topic?._id || '').trim();
    if (!target) return '/community';
    return `/community/topic/${encodeURIComponent(target)}`;
  }, [topic]);

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
    const targetLatestPage = Math.max(1, Number(options?.latestPage || latestPage || 1));
    const targetHotPage = Math.max(1, Number(options?.hotPage || hotPage || 1));
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
    setLoading(false);
  }, [FEED_PAGE_SIZE, hotPage, latestPage, safeIdOrSlug]);

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
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
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

  useEffect(() => {
    void loadTopicBoard({ latestPage: 1, hotPage: 1 });
  }, [loadTopicBoard]);

  useEffect(() => {
    void syncFollowStatus();
  }, [syncFollowStatus]);

  const latestTotalPages = Math.max(1, Math.ceil(latestTotal / Math.max(1, latestPageSize)));
  const hotTotalPages = Math.max(1, Math.ceil(hotTotal / Math.max(1, hotPageSize)));

  const handlePageChange = useCallback(
    (targetTab: 'latest' | 'hot', targetPage: number) => {
      const normalizedPage = Math.max(1, targetPage);
      if (targetTab === 'latest') {
        if (normalizedPage === latestPage) return;
        void loadTopicBoard({ latestPage: normalizedPage, hotPage });
        return;
      }
      if (normalizedPage === hotPage) return;
      void loadTopicBoard({ latestPage, hotPage: normalizedPage });
    },
    [hotPage, latestPage, loadTopicBoard],
  );

  const renderPostStream = (
    posts: CommunityPost[],
    options: {
      tab: 'latest' | 'hot';
      page: number;
      totalPages: number;
      total: number;
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
          regularPosts.map((post, index) => (
            <CommunityPostCard key={post.id} post={post} index={index} />
          ))
        ) : (
          <div className="rounded-lg border bg-card py-14 text-center text-sm text-muted-foreground">
            当前仅有公告帖子，暂无普通帖子。
          </div>
        )}
        <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground sm:text-sm">
          <span>
            第 {options.page} / {options.totalPages} 页 · 共 {options.total} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || options.page <= 1}
              onClick={() => handlePageChange(options.tab, options.page - 1)}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || options.page >= options.totalPages}
              onClick={() => handlePageChange(options.tab, options.page + 1)}
            >
              下一页
            </Button>
          </div>
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
              <Link href="/community">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回社区
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topicIcon = topic?.icon || topic?.app_info?.icon || FALLBACK_TOPIC_ICON;
  const moderators = Array.isArray(topic?.moderator_infos)
    ? topic!.moderator_infos!
    : [];

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6 lg:py-8">
      <div className="mb-4">
        <Button variant="ghost" asChild className="px-2">
          <Link href="/community">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回社区
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Image
                    src={topicIcon}
                    alt={topic?.name || 'topic'}
                    width={68}
                    height={68}
                    className="rounded-lg border object-cover"
                  />
                  <div className="min-w-0">
                    <CardTitle className="line-clamp-2 text-xl">
                      #{topic?.name || '话题'}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-3">
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
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant={followed ? 'outline' : 'default'}
                    disabled={followBusy || !topicId}
                    onClick={() => void handleToggleFollow()}
                  >
                    {followBusy ? '处理中...' : followed ? '已关注' : '关注话题'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
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

          <Tabs
            value={activeFeedTab}
            onValueChange={(value) => setActiveFeedTab(value === 'hot' ? 'hot' : 'latest')}
          >
            <TabsList className="mb-4 border bg-card">
              <TabsTrigger value="latest">最新帖子</TabsTrigger>
              <TabsTrigger value="hot">热门帖子</TabsTrigger>
            </TabsList>
            <TabsContent value="latest">
              {renderPostStream(latestPosts, {
                tab: 'latest',
                page: latestPage,
                totalPages: latestTotalPages,
                total: latestTotal,
              })}
            </TabsContent>
            <TabsContent value="hot">
              {renderPostStream(hotPosts, {
                tab: 'hot',
                page: hotPage,
                totalPages: hotTotalPages,
                total: hotTotal,
              })}
            </TabsContent>
          </Tabs>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Users className="mr-2 h-4 w-4" />
                版主团队
              </CardTitle>
              <CardDescription>负责本话题管理与内容治理。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {moderators.length ? (
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
    </div>
  );
}
