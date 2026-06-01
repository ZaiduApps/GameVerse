'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, ShieldCheck, Star, ThumbsUp } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getGameReviewAdminEmailSwitch,
  getGameReviewCommentLikeStatuses,
  getGameReviewCommentReplies,
  getGameReviewCommentThreads,
  getGameReviewEmailPreference,
  getGameReviewSummary,
  submitGameRating,
  submitGameReviewComment,
  toggleGameReviewCommentLike,
  updateGameReviewAdminEmailSwitch,
  updateGameReviewEmailPreference,
  type GameReviewCommentThread,
  type GameReviewIdentity,
  type GameReviewSummary,
} from '@/lib/game-review-api';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { ApiGameDetail } from '@/types';

interface GameReviewPanelProps {
  game: Pick<ApiGameDetail, '_id' | 'pkg' | 'name' | 'star'>;
  className?: string;
  compact?: boolean;
}

function normalizeNonNegativeCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function hasAdminRole(roles: unknown): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => {
    if (typeof role === 'string') {
      return /(admin|administrator|super|ops|moderator|manage)/i.test(role);
    }
    if (!role || typeof role !== 'object') return false;
    const code = String((role as { code?: unknown }).code || '').trim();
    const name = String((role as { name?: unknown }).name || '').trim();
    return /(admin|administrator|super|ops|moderator|manage)/i.test(`${code} ${name}`);
  });
}

function formatCompactCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function buildIdentity(game: Pick<ApiGameDetail, '_id' | 'pkg' | 'name' | 'star'>): GameReviewIdentity {
  return {
    appId: game._id,
    pkg: game.pkg,
    gameName: game.name,
    manualScore: game.star,
  };
}

export default function GameReviewPanel({ game, className, compact = false }: GameReviewPanelProps) {
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const identity = useMemo(() => buildIdentity(game), [game._id, game.pkg, game.name, game.star]);
  const canManageAdminSwitch = useMemo(() => hasAdminRole(user?.roles), [user?.roles]);

  const [summary, setSummary] = useState<GameReviewSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);

  const [commentSort, setCommentSort] = useState<'latest' | 'hot'>('latest');
  const [comments, setComments] = useState<GameReviewCommentThread[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyPageMap, setReplyPageMap] = useState<Record<string, number>>({});
  const [replyLoadingMap, setReplyLoadingMap] = useState<Record<string, boolean>>({});

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [pendingCommentLikeIds, setPendingCommentLikeIds] = useState<Record<string, boolean>>({});

  const [emailNotifyEnabled, setEmailNotifyEnabled] = useState(false);
  const [isSavingEmailNotify, setIsSavingEmailNotify] = useState(false);

  const [adminEmailSwitchEnabled, setAdminEmailSwitchEnabled] = useState(true);
  const [isSavingAdminSwitch, setIsSavingAdminSwitch] = useState(false);

  const totalCommentCount = useMemo(
    () =>
      comments.reduce(
        (acc, item) =>
          acc +
          1 +
          Math.max(
            normalizeNonNegativeCount(item.replyTotal),
            normalizeNonNegativeCount(item.replies?.length || 0),
          ),
        0,
      ),
    [comments],
  );

  const commentStatusIds = useMemo(
    () =>
      Array.from(
        new Set(
          comments.flatMap((comment) => [
            String(comment.id || '').trim(),
            ...(comment.replies || [])
              .map((reply) => String(reply.id || '').trim())
              .filter(Boolean),
          ]),
        ),
      ).filter(Boolean),
    [comments],
  );

  const effectiveEmailNotifyEnabled = adminEmailSwitchEnabled && emailNotifyEnabled;

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setIsLoadingSummary(true);
      try {
        const data = await getGameReviewSummary(identity);
        if (!cancelled) {
          setSummary(data);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      }
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, [identity]);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setIsLoadingComments(true);
      try {
        const list = await getGameReviewCommentThreads(identity, compact ? 12 : 20, 20, commentSort);
        if (!cancelled) {
          setComments(list);
          setExpandedReplies({});
        }
      } finally {
        if (!cancelled) {
          setIsLoadingComments(false);
        }
      }
    }

    void loadComments();
    return () => {
      cancelled = true;
    };
  }, [commentSort, compact, identity]);

  useEffect(() => {
    const next: Record<string, number> = {};
    comments.forEach((thread) => {
      const loaded = normalizeNonNegativeCount(thread.replies?.length || 0);
      const pageSize = Math.max(1, normalizeNonNegativeCount(thread.replyPageSize) || loaded || 20);
      next[thread.id] = Math.max(1, Math.ceil(loaded / pageSize));
    });
    setReplyPageMap(next);
    setReplyLoadingMap({});
  }, [comments]);

  useEffect(() => {
    setCommentLikeCounts((prev) => {
      const next: Record<string, number> = {};
      comments.forEach((comment) => {
        const commentId = String(comment.id || '').trim();
        if (commentId) {
          next[commentId] = pendingCommentLikeIds[commentId]
            ? normalizeNonNegativeCount(prev[commentId] ?? comment.likeCount)
            : normalizeNonNegativeCount(comment.likeCount);
        }
        (comment.replies || []).forEach((reply) => {
          const replyId = String(reply.id || '').trim();
          if (!replyId) return;
          next[replyId] = pendingCommentLikeIds[replyId]
            ? normalizeNonNegativeCount(prev[replyId] ?? reply.likeCount)
            : normalizeNonNegativeCount(reply.likeCount);
        });
      });
      return next;
    });
  }, [comments, pendingCommentLikeIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadLikeStatuses() {
      if (!isAuthenticated || !token || commentStatusIds.length === 0) {
        if (!cancelled) {
          setLikedCommentIds({});
        }
        return;
      }
      const statusMap = await getGameReviewCommentLikeStatuses({
        token,
        commentIds: commentStatusIds,
      });
      if (!cancelled) {
        setLikedCommentIds(statusMap);
      }
    }

    void loadLikeStatuses();
    return () => {
      cancelled = true;
    };
  }, [commentStatusIds, isAuthenticated, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadEmailPreferences() {
      if (!token) {
        if (!cancelled) {
          setEmailNotifyEnabled(false);
          setAdminEmailSwitchEnabled(true);
        }
        return;
      }
      const [pref, admin] = await Promise.all([
        getGameReviewEmailPreference(token),
        canManageAdminSwitch
          ? getGameReviewAdminEmailSwitch(token)
          : Promise.resolve({ enabled: true, source: 'local' as const }),
      ]);

      if (!cancelled) {
        setEmailNotifyEnabled(Boolean(pref.enabled));
        setAdminEmailSwitchEnabled(admin.enabled === null ? true : Boolean(admin.enabled));
      }
    }

    void loadEmailPreferences();
    return () => {
      cancelled = true;
    };
  }, [canManageAdminSwitch, token]);

  const reloadSummary = async () => {
    const data = await getGameReviewSummary(identity);
    setSummary(data);
  };

  const reloadComments = async () => {
    const list = await getGameReviewCommentThreads(identity, compact ? 12 : 20, 20, commentSort);
    setComments(list);
    setExpandedReplies({});
  };

  const handleSubmitRating = async (score: number) => {
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再评分。',
        variant: 'destructive',
      });
      return;
    }
    if (isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      const result = await submitGameRating({
        token,
        identity,
        rating: score,
      });
      if (!result.ok) {
        toast({
          title: '评分失败',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }
      if (result.summary) {
        setSummary(result.summary);
      } else {
        await reloadSummary();
      }
      toast({
        title: '评分成功',
        description: `你已为 ${game.name} 打 ${score} 星。`,
      });
    } finally {
      setIsSubmittingRating(false);
      setRatingHover(null);
    }
  };

  const handleCommentSubmit = async () => {
    const content = newComment.trim();
    if (!content || isSubmittingComment) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再评论或回复。',
        variant: 'destructive',
      });
      return;
    }

    const optimistic: GameReviewCommentThread = {
      id: `tmp-${Date.now()}`,
      user: {
        name: user?.name || user?.username || '当前用户',
        avatarUrl: user?.avatar || '/favicon.ico',
        dataAiHint: 'user avatar',
      },
      timestamp: '刚刚',
      text: content,
      likeCount: 0,
      replies: [],
      replyTotal: 0,
      replyHasMore: false,
      replyPageSize: 20,
    };

    setComments((prev) => {
      if (!replyTarget?.id) return [optimistic, ...prev];
      return prev.map((thread) => {
        if (thread.id !== replyTarget.id) return thread;
        return {
          ...thread,
          replies: [...thread.replies, { ...optimistic, text: `回复 @${replyTarget.name}：${content}` }],
          replyTotal: Math.max(
            normalizeNonNegativeCount(thread.replyTotal) + 1,
            thread.replies.length + 1,
          ),
        };
      });
    });

    setIsSubmittingComment(true);
    try {
      const result = await submitGameReviewComment({
        token,
        identity,
        content,
        parentId: replyTarget?.id,
        emailNotify: effectiveEmailNotifyEnabled,
        userName: user?.name || user?.username || '当前用户',
        userAvatar: user?.avatar || '/favicon.ico',
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      setNewComment('');
      setReplyTarget(null);
      await reloadComments();
      toast({
        title: '评论成功',
        description: result.message || '评论已提交。',
      });
    } catch (error) {
      await reloadComments();
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLoadMoreReplies = async (commentId: string) => {
    const thread = comments.find((item) => item.id === commentId);
    if (!thread || !thread.replyHasMore || replyLoadingMap[commentId]) return;
    const nextPage = Math.max(1, Number(replyPageMap[commentId] || 1)) + 1;
    const requestPageSize = Math.max(1, Number(thread.replyPageSize || 20));
    setReplyLoadingMap((prev) => ({ ...prev, [commentId]: true }));

    try {
      const result = await getGameReviewCommentReplies(
        identity,
        commentId,
        nextPage,
        requestPageSize,
        commentSort,
      );
      setComments((prev) =>
        prev.map((item) => {
          if (item.id !== commentId) return item;
          const mergedMap = new Map<string, GameReviewCommentThread['replies'][number]>();
          item.replies.forEach((reply) => mergedMap.set(reply.id, reply));
          result.list.forEach((reply) => mergedMap.set(reply.id, reply));
          const mergedReplies = Array.from(mergedMap.values());
          const total = Math.max(Number(result.total || 0), mergedReplies.length);
          return {
            ...item,
            replies: mergedReplies,
            replyTotal: total,
            replyHasMore: mergedReplies.length < total,
            replyPageSize: Number(result.pageSize || requestPageSize),
          };
        }),
      );
      setReplyPageMap((prev) => ({ ...prev, [commentId]: Number(result.page || nextPage) }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch {
      toast({
        title: '加载失败',
        description: '更多回复加载失败，请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setReplyLoadingMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (pendingCommentLikeIds[commentId]) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞评论。',
        variant: 'destructive',
      });
      return;
    }
    const wasLiked = Boolean(likedCommentIds[commentId]);
    const previousCount = commentLikeCounts[commentId] ?? 0;
    const nextLiked = !wasLiked;

    setLikedCommentIds((prev) => ({ ...prev, [commentId]: nextLiked }));
    setCommentLikeCounts((prev) => ({
      ...prev,
      [commentId]: nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1),
    }));
    setPendingCommentLikeIds((prev) => ({ ...prev, [commentId]: true }));

    try {
      const result = await toggleGameReviewCommentLike({ token, commentId });
      if (!result.ok) {
        throw new Error(result.message);
      }
      const serverLiked = typeof result.liked === 'boolean' ? result.liked : nextLiked;
      const parsedServerCount = Number(result.likeCount);
      const serverCount = Number.isFinite(parsedServerCount)
        ? parsedServerCount
        : nextLiked
          ? previousCount + 1
          : Math.max(0, previousCount - 1);
      setLikedCommentIds((prev) => ({ ...prev, [commentId]: serverLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: serverCount }));
    } catch (error) {
      setLikedCommentIds((prev) => ({ ...prev, [commentId]: wasLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: previousCount }));
      toast({
        title: '点赞失败',
        description: error instanceof Error ? error.message : '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setPendingCommentLikeIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleEmailNotifySwitch = async (checked: boolean) => {
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再修改提醒设置。',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingEmailNotify(true);
    try {
      const result = await updateGameReviewEmailPreference({
        token,
        enabled: checked,
      });
      if (!result.ok) {
        toast({
          title: '保存失败',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }
      setEmailNotifyEnabled(result.enabled);
      toast({
        title: checked ? '已开启邮件提醒' : '已关闭邮件提醒',
        description: result.message,
      });
    } finally {
      setIsSavingEmailNotify(false);
    }
  };

  const handleAdminEmailSwitch = async (checked: boolean) => {
    if (!token || !canManageAdminSwitch) return;
    setIsSavingAdminSwitch(true);
    try {
      const result = await updateGameReviewAdminEmailSwitch({
        token,
        enabled: checked,
      });
      if (!result.ok) {
        toast({
          title: '保存失败',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }
      setAdminEmailSwitchEnabled(result.enabled);
      toast({
        title: checked ? '已开启全站邮件提醒' : '已关闭全站邮件提醒',
        description: result.message,
      });
    } finally {
      setIsSavingAdminSwitch(false);
    }
  };

  const activeScore = ratingHover ?? summary?.myRating ?? 0;

  return (
    <Card className={cn('border-[#abadae]/10 bg-white', className)}>
      <CardHeader className={cn(compact ? 'pb-3' : 'pb-4')}>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <MessageSquare className="h-5 w-5 text-[#005e9f]" />
          玩家评分与评论
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('space-y-6', compact && 'space-y-4')}>
        <section className="rounded-2xl border border-[#abadae]/15 bg-[#f7f8f9] p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#595c5d]">综合评分</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-3xl font-black text-[#b71211]">
                  {isLoadingSummary ? '...' : (summary?.displayScore ?? 0).toFixed(1)}
                </span>
                <span className="pb-1 text-xs text-[#757778]">
                  / 5.0 · {isLoadingSummary ? '...' : formatCompactCount(summary?.ratingCount ?? 0)} 人评分
                </span>
              </div>
              {summary ? (
                <p className="mt-1 text-xs text-[#757778]">
                  贝叶斯分 {summary.bayesianScore.toFixed(1)} · 置信分 {summary.confidenceScore.toFixed(1)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#595c5d]">你的评分</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={`rate-${score}`}
                    type="button"
                    disabled={isSubmittingRating}
                    onMouseEnter={() => setRatingHover(score)}
                    onMouseLeave={() => setRatingHover(null)}
                    onClick={() => void handleSubmitRating(score)}
                    className="rounded-md p-1 transition-colors hover:bg-[#f0f2f3]"
                    aria-label={`评分 ${score} 星`}
                  >
                    <Star
                      className={cn(
                        'h-5 w-5',
                        activeScore >= score
                          ? 'fill-[#fdc003] text-[#fdc003]'
                          : 'text-[#abadae]',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {summary ? (
            <div className="mt-4 space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.breakdown[star as 1 | 2 | 3 | 4 | 5] || 0;
                const percent = summary.ratingCount > 0 ? Math.round((count / summary.ratingCount) * 100) : 0;
                return (
                  <div key={`distribution-${star}`} className="flex items-center gap-2 text-xs text-[#595c5d]">
                    <span className="w-8">{star}星</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7eaed]">
                      <div className="h-full rounded-full bg-[#fdc003]" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-14 text-right">{percent}%</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[#abadae]/15 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={effectiveEmailNotifyEnabled}
                disabled={!isAuthenticated || !adminEmailSwitchEnabled || isSavingEmailNotify}
                onCheckedChange={(checked) => {
                  void handleEmailNotifySwitch(Boolean(checked));
                }}
              />
              <p className="text-sm text-[#2c2f30]">有人回复我时发送邮件提醒</p>
            </div>
            {!adminEmailSwitchEnabled ? (
              <Badge variant="outline" className="text-[10px]">
                管理员已关闭
              </Badge>
            ) : null}
          </div>
          {canManageAdminSwitch ? (
            <div className="mt-3 rounded-xl border border-dashed border-[#abadae]/35 bg-[#fafbfc] p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4f5357]">
                <ShieldCheck className="h-3.5 w-3.5" />
                管理员开关
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#595c5d]">全站游戏评论邮件提醒</span>
                <Switch
                  checked={adminEmailSwitchEnabled}
                  disabled={isSavingAdminSwitch}
                  onCheckedChange={(checked) => {
                    void handleAdminEmailSwitch(Boolean(checked));
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#2c2f30]">
              评论 ({formatCompactCount(totalCommentCount)})
            </h3>
            <div className="inline-flex rounded-full bg-[#f2f4f5] p-1">
              <button
                type="button"
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold',
                  commentSort === 'latest' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]',
                )}
                onClick={() => setCommentSort('latest')}
              >
                最新
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold',
                  commentSort === 'hot' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]',
                )}
                onClick={() => setCommentSort('hot')}
              >
                热门
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Avatar className="mt-1 h-8 w-8">
              <AvatarImage src={user?.avatar || '/favicon.ico'} alt={user?.name || user?.username || '当前用户'} />
              <AvatarFallback>
                {String(user?.name || user?.username || '我').slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <Textarea
                placeholder={replyTarget ? `回复 @${replyTarget.name}...` : '写下你的评论...'}
                rows={compact ? 2 : 3}
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
              />
              {replyTarget ? (
                <div className="text-xs text-[#757778]">
                  正在回复 @{replyTarget.name}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="ml-1 h-auto p-0 text-xs"
                    onClick={() => setReplyTarget(null)}
                  >
                    取消
                  </Button>
                </div>
              ) : null}
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  className="btn-interactive"
                  disabled={!newComment.trim() || isSubmittingComment}
                  onClick={() => void handleCommentSubmit()}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  发布
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-[#abadae]/15 pt-4">
            {isLoadingComments ? (
              <p className="py-2 text-center text-sm text-[#757778]">评论加载中...</p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                      <AvatarFallback>{comment.user.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 rounded-xl bg-[#f7f8f9] p-3">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-[#2c2f30]">{comment.user.name}</span>
                        <span className="shrink-0 text-[11px] text-[#757778]">{comment.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6 text-[#2c2f30]">{comment.text}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#595c5d]"
                          disabled={pendingCommentLikeIds[comment.id]}
                          onClick={() => void handleCommentLike(comment.id)}
                        >
                          <ThumbsUp
                            className={cn(
                              'mr-1 h-3.5 w-3.5',
                              likedCommentIds[comment.id] && 'fill-[#005e9f] text-[#005e9f]',
                            )}
                          />
                          {commentLikeCounts[comment.id] ?? comment.likeCount ?? 0}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-[#595c5d]"
                          onClick={() => setReplyTarget({ id: comment.id, name: comment.user.name })}
                        >
                          回复
                        </Button>
                      </div>
                    </div>
                  </div>

                  {(comment.replies.length > 0 || comment.replyHasMore) ? (
                    <div className="ml-11 space-y-2">
                      {(expandedReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                            <AvatarFallback>{reply.user.name.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 rounded-lg bg-[#f4f6f7] p-2.5">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-[#2c2f30]">{reply.user.name}</span>
                              <span className="shrink-0 text-[11px] text-[#757778]">{reply.timestamp}</span>
                            </div>
                            <p className="whitespace-pre-line text-xs leading-5 text-[#2c2f30]">{reply.text}</p>
                            <div className="mt-1.5 flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[11px] text-[#595c5d]"
                                disabled={pendingCommentLikeIds[reply.id]}
                                onClick={() => void handleCommentLike(reply.id)}
                              >
                                <ThumbsUp
                                  className={cn(
                                    'mr-1 h-3 w-3',
                                    likedCommentIds[reply.id] && 'fill-[#005e9f] text-[#005e9f]',
                                  )}
                                />
                                {commentLikeCounts[reply.id] ?? reply.likeCount ?? 0}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[11px] text-[#595c5d]"
                                onClick={() => setReplyTarget({ id: comment.id, name: reply.user.name })}
                              >
                                回复
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {comment.replies.length > 2 ? (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() =>
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [comment.id]: !prev[comment.id],
                            }))
                          }
                        >
                          {expandedReplies[comment.id]
                            ? '收起回复'
                            : `展开更多回复 (${comment.replies.length - 2})`}
                        </Button>
                      ) : null}

                      {comment.replyHasMore ? (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          disabled={replyLoadingMap[comment.id]}
                          onClick={() => void handleLoadMoreReplies(comment.id)}
                        >
                          {replyLoadingMap[comment.id]
                            ? '加载中...'
                            : `查看更多回复 (${Math.max(comment.replyTotal - comment.replies.length, 0)})`}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="py-2 text-center text-sm text-[#757778]">暂无评论，欢迎抢沙发。</p>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
