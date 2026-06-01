'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import GameCard from '@/components/game-card';
import type { CommunityTopicItem } from '@/lib/community-api';
import type { Game } from '@/types';
import {
  extractFollowedGamesFromTopics,
  getMyDashboardPosts,
  getMyFollowedGameTopics,
  getMyReservationGames,
  unfollowReservationByAppId,
  unfollowTopicById,
  type DashboardPostItem,
} from '@/lib/profile-dashboard-api';
import { useToast } from '@/hooks/use-toast';

function statusText(reviewStatus: string, status: number) {
  const review = String(reviewStatus || '').trim();
  if (review === 'published' && status === 1) return '已发布';
  if (review === 'pending') return '审核中';
  if (review === 'rejected') return '未通过';
  if (review === 'draft') return '草稿';
  return status === 1 ? '已上线' : '未上线';
}

function formatTime(input?: string) {
  if (!input) return '刚刚';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '刚刚';
  return date.toLocaleString('zh-CN');
}

function formatLatestLabel(input?: string) {
  if (!input) return '暂无更新';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '暂无更新';
  return `更新于 ${date.toLocaleString('zh-CN')}`;
}

function DashboardPostCard({ item }: { item: DashboardPostItem }) {
  const post = item.post;
  const title = String(post.title || '').trim() || String(post.summary || '').trim() || '未命名动态';
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/community/post/${encodeURIComponent(post.id)}`} className="line-clamp-1 text-sm font-semibold hover:text-primary">
          {title}
        </Link>
        <Badge variant="outline" className="text-[10px]">{statusText(item.reviewStatus, item.status)}</Badge>
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.summary || post.content || '暂无内容'}</p>
      <div className="mt-2 text-[11px] text-muted-foreground">
        {formatTime(item.updatedAt || post.timestamp)} · 点赞 {post.likesCount} · 评论 {post.commentsCount}
      </div>
    </div>
  );
}

function DashboardTopicCard({ topic }: { topic: CommunityTopicItem }) {
  const topicId = String(topic._id || '').trim();
  const slug = String(topic.slug || '').trim();
  const href = topicId ? `/community/topic/${encodeURIComponent(slug || topicId)}` : '/community';
  const appPkg = String(topic.app_info?.pkg || '').trim();
  const appHref = appPkg ? `/app/${encodeURIComponent(appPkg)}` : null;
  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <Link href={href} className="line-clamp-1 text-sm font-semibold hover:text-primary">
          {topic.name || '未命名话题'}
        </Link>
        {topic.is_official ? <Badge variant="secondary" className="text-[10px]">官方</Badge> : null}
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {topic.app_info?.name || '游戏社区'} · 帖子 {Number(topic.post_count || 0)} · 关注 {Number(topic.followers_count || 0)}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>热度 {Number(topic.heat_score || 0)}</span>
        {appHref ? (
          <Link href={appHref} className="text-primary hover:underline">
            查看游戏
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default function ProfileDashboard({ token }: { token: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [postItems, setPostItems] = useState<DashboardPostItem[]>([]);
  const [followedTopics, setFollowedTopics] = useState<CommunityTopicItem[]>([]);
  const [reservationGames, setReservationGames] = useState<Game[]>([]);
  const [postPage, setPostPage] = useState(1);
  const [topicPage, setTopicPage] = useState(1);
  const [reservationPage, setReservationPage] = useState(1);
  const [postTotal, setPostTotal] = useState(0);
  const [topicTotal, setTopicTotal] = useState(0);
  const [reservationTotal, setReservationTotal] = useState(0);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [loadingMoreTopics, setLoadingMoreTopics] = useState(false);
  const [loadingMoreReservations, setLoadingMoreReservations] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!token) return;
      setLoading(true);
      setErrorText('');
      try {
        const [postsRes, topicsRes, reservationsRes] = await Promise.all([
          getMyDashboardPosts({ token, page: 1, pageSize: 6 }),
          getMyFollowedGameTopics({ token, page: 1, pageSize: 6 }),
          getMyReservationGames({ token, page: 1, pageSize: 6 }),
        ]);
        if (!mounted) return;
        if (postsRes.ok) {
          setPostItems(postsRes.list || []);
          setPostTotal(Number(postsRes.total || 0));
          setPostPage(Number(postsRes.page || 1));
        }
        setFollowedTopics(topicsRes.list || []);
        setTopicTotal(Number(topicsRes.total || 0));
        setTopicPage(Number(topicsRes.page || 1));
        if (reservationsRes.ok) {
          setReservationGames(reservationsRes.list || []);
          setReservationTotal(Number(reservationsRes.total || 0));
          setReservationPage(Number(reservationsRes.page || 1));
        }
        const errorMessages = [postsRes, reservationsRes]
          .filter((result) => !result.ok)
          .map((result) => String(result.message || '').trim())
          .filter(Boolean);
        if (errorMessages.length > 0) {
          setErrorText(errorMessages.join(' '));
        }
      } catch {
        if (!mounted) return;
        setErrorText('个人中心数据加载失败，请稍后重试。');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const followedGames = useMemo(
    () => extractFollowedGamesFromTopics(followedTopics).slice(0, 6),
    [followedTopics],
  );

  const postsLatest = useMemo(() => {
    const dates = postItems
      .map((item) => String(item.updatedAt || item.post.timestamp || '').trim())
      .filter(Boolean)
      .map((text) => new Date(text))
      .filter((d) => Number.isFinite(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toISOString() : '';
  }, [postItems]);

  const topicsLatest = useMemo(() => {
    const dates = followedTopics
      .map((topic) => String(topic.last_activity_at || topic.last_post_at || '').trim())
      .filter(Boolean)
      .map((text) => new Date(text))
      .filter((d) => Number.isFinite(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toISOString() : '';
  }, [followedTopics]);

  const reservationsLatest = useMemo(() => {
    const dates = reservationGames
      .map((game) => String(game.updateDate || '').trim())
      .filter(Boolean)
      .map((text) => new Date(text))
      .filter((d) => Number.isFinite(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toISOString() : '';
  }, [reservationGames]);

  const followedGamesLatest = useMemo(() => {
    const dates = followedGames
      .map((game) => String(game.updateDate || '').trim())
      .filter(Boolean)
      .map((text) => new Date(text))
      .filter((d) => Number.isFinite(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    return dates.length > 0 ? dates[0].toISOString() : '';
  }, [followedGames]);

  const recentActivityText = useMemo(() => {
    const candidates: string[] = [];
    postItems.forEach((item) => {
      if (item.updatedAt) candidates.push(item.updatedAt);
      if (item.post.timestamp) candidates.push(item.post.timestamp);
    });
    followedTopics.forEach((topic) => {
      if (topic.last_activity_at) candidates.push(String(topic.last_activity_at));
      if (topic.last_post_at) candidates.push(String(topic.last_post_at));
    });
    reservationGames.forEach((game) => {
      if (game.updateDate) candidates.push(String(game.updateDate));
    });
    const parsed = candidates
      .map((text) => new Date(String(text || '').trim()))
      .filter((date) => Number.isFinite(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    if (parsed.length === 0) return '暂无活跃记录';
    return `最近活跃：${parsed[0].toLocaleString('zh-CN')}`;
  }, [followedTopics, postItems, reservationGames]);

  const dashboardHint = useMemo(() => {
    const pendingCount = postItems.filter((item) => String(item.reviewStatus || '') === 'pending').length;
    const rejectedCount = postItems.filter((item) => String(item.reviewStatus || '') === 'rejected').length;
    if (rejectedCount > 0) return `你有 ${rejectedCount} 条动态未通过审核，建议检查内容规范后重发。`;
    if (pendingCount > 0) return `你有 ${pendingCount} 条动态正在审核中。`;
    if (reservationGames.length === 0 && followedTopics.length === 0) return '建议先关注游戏社区或预约游戏，方便后续接收更新。';
    return '个人中心状态良好。';
  }, [followedTopics.length, postItems, reservationGames.length]);

  const canLoadMorePosts = postItems.length < postTotal;
  const canLoadMoreTopics = followedTopics.length < topicTotal;
  const canLoadMoreReservations = reservationGames.length < reservationTotal;

  async function loadMorePosts() {
    if (!token || loadingMorePosts || !canLoadMorePosts) return;
    const nextPage = postPage + 1;
    setLoadingMorePosts(true);
    try {
      const res = await getMyDashboardPosts({ token, page: nextPage, pageSize: 6 });
      if (!res.ok) {
        toast({
          title: '加载更多动态失败',
          description: res.message || '动态列表加载失败，请稍后重试',
          variant: 'destructive',
        });
        return;
      }
      setPostItems((prev) => [...prev, ...res.list]);
      setPostPage(nextPage);
      setPostTotal(Number(res.total || postTotal));
    } finally {
      setLoadingMorePosts(false);
    }
  }

  async function loadMoreTopics() {
    if (!token || loadingMoreTopics || !canLoadMoreTopics) return;
    const nextPage = topicPage + 1;
    setLoadingMoreTopics(true);
    try {
      const res = await getMyFollowedGameTopics({ token, page: nextPage, pageSize: 6 });
      setFollowedTopics((prev) => [...prev, ...res.list]);
      setTopicPage(nextPage);
      setTopicTotal(Number(res.total || topicTotal));
    } finally {
      setLoadingMoreTopics(false);
    }
  }

  async function loadMoreReservations() {
    if (!token || loadingMoreReservations || !canLoadMoreReservations) return;
    const nextPage = reservationPage + 1;
    setLoadingMoreReservations(true);
    try {
      const res = await getMyReservationGames({ token, page: nextPage, pageSize: 6 });
      if (!res.ok) {
        toast({
          title: '加载更多预约失败',
          description: res.message || '预约列表加载失败，请稍后重试',
          variant: 'destructive',
        });
        return;
      }
      setReservationGames((prev) => [...prev, ...res.list]);
      setReservationPage(nextPage);
      setReservationTotal(Number(res.total || reservationTotal));
    } finally {
      setLoadingMoreReservations(false);
    }
  }

  async function handleUnfollowTopic(topic: CommunityTopicItem) {
    const topicId = String(topic._id || '').trim();
    if (!topicId) return;
    const confirmed = window.confirm(`确认取消关注社区「${topic.name || '未命名话题'}」吗？`);
    if (!confirmed) return;
    const result = await unfollowTopicById({ token, topicId });
    if (!result.ok) {
      toast({ title: '取消关注失败', description: result.message, variant: 'destructive' });
      return;
    }
    setFollowedTopics((prev) => prev.filter((item) => String(item._id || '').trim() !== topicId));
    setTopicTotal((prev) => Math.max(0, prev - 1));
    toast({ title: '已取消关注社区' });
  }

  async function handleUnfollowReservation(game: Game) {
    const appId = String(game.id || game.pkg || '').trim();
    if (!appId) return;
    const confirmed = window.confirm(`确认取消预约游戏「${game.title || '未命名游戏'}」吗？`);
    if (!confirmed) return;
    const result = await unfollowReservationByAppId({ token, appId });
    if (!result.ok) {
      toast({ title: '取消预约失败', description: result.message, variant: 'destructive' });
      return;
    }
    setReservationGames((prev) => prev.filter((item) => String(item.id || '').trim() !== appId));
    setReservationTotal((prev) => Math.max(0, prev - 1));
    toast({ title: '已取消预约' });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorText ? (
        <Card>
          <CardContent className="py-4 text-sm text-destructive">{errorText}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">我的动态</p><p className="text-xl font-bold">{postItems.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">关注社区</p><p className="text-xl font-bold">{followedTopics.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">预约游戏</p><p className="text-xl font-bold">{reservationGames.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">关注游戏</p><p className="text-xl font-bold">{followedGames.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm text-muted-foreground">{recentActivityText}</p>
          <p className="text-sm">{dashboardHint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>我的动态</CardTitle>
            <Link href="/profile/center/posts" className="inline-flex items-center text-xs text-primary hover:underline">
              查看更多
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <CardDescription>最近发布的帖子与状态。</CardDescription>
          <p className="text-xs text-muted-foreground">{formatLatestLabel(postsLatest)}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {postItems.length === 0 ? <p className="text-sm text-muted-foreground">你还没有发布任何动态。</p> : postItems.map((item) => <DashboardPostCard key={item.post.id} item={item} />)}
          {canLoadMorePosts ? (
            <button
              className="w-full rounded border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                void loadMorePosts();
              }}
              disabled={loadingMorePosts}
            >
              {loadingMorePosts ? '加载中...' : '加载更多动态'}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>我关注的游戏社区</CardTitle>
            <Link href="/profile/center/topics" className="inline-flex items-center text-xs text-primary hover:underline">
              查看更多
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <CardDescription>已关注且绑定游戏的话题社区。</CardDescription>
          <p className="text-xs text-muted-foreground">{formatLatestLabel(topicsLatest)}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {followedTopics.length === 0 ? <p className="text-sm text-muted-foreground">你还没有关注任何游戏社区。</p> : followedTopics.map((topic) => (
            <div key={topic._id} className="rounded-lg border p-3">
              <DashboardTopicCard topic={topic} />
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handleUnfollowTopic(topic);
                  }}
                >
                  取消关注
                </Button>
              </div>
            </div>
          ))}
          {canLoadMoreTopics ? (
            <button
              className="w-full rounded border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                void loadMoreTopics();
              }}
              disabled={loadingMoreTopics}
            >
              {loadingMoreTopics ? '加载中...' : '加载更多社区'}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>我的预约游戏</CardTitle>
            <Link href="/profile/center/reservations" className="inline-flex items-center text-xs text-primary hover:underline">
              查看更多
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <CardDescription>你关注的预约应用。</CardDescription>
          <p className="text-xs text-muted-foreground">{formatLatestLabel(reservationsLatest)}</p>
        </CardHeader>
        <CardContent>
          {reservationGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">你还没有预约任何游戏。</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {reservationGames.map((game) => (
                <div key={game.id} className="space-y-2">
                  <PreregistrationGameCard game={game} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      void handleUnfollowReservation(game);
                    }}
                  >
                    取消预约
                  </Button>
                </div>
              ))}
            </div>
          )}
          {canLoadMoreReservations ? (
            <button
              className="mt-3 w-full rounded border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                void loadMoreReservations();
              }}
              disabled={loadingMoreReservations}
            >
              {loadingMoreReservations ? '加载中...' : '加载更多预约游戏'}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>我关注的游戏</CardTitle>
            <Link href="/profile/center/games" className="inline-flex items-center text-xs text-primary hover:underline">
              查看更多
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <CardDescription>从你关注的游戏社区自动聚合。</CardDescription>
          <p className="text-xs text-muted-foreground">{formatLatestLabel(followedGamesLatest)}</p>
        </CardHeader>
        <CardContent>
          {followedGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">你还没有关注任何游戏。</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {followedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
