'use client';

import type { CommunityPost } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Eye, MessageSquare, RotateCcw, Send, Share2, ThumbsUp, X, ZoomIn, ZoomOut } from 'lucide-react';

import { renderMarkdown } from '@/lib/utils';
import { apiUrl, trackedApiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCommunityCommentThreads, type CommunityCommentThread } from '@/lib/community-api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const initialMockComments: CommunityCommentThread[] = [
  {
    id: 'comment1',
    user: { name: '评论用户A', avatarUrl: 'https://placehold.co/40x40.png?text=C1', dataAiHint: 'user avatar' },
    timestamp: '2小时前',
    text: '内容很有帮助，感谢分享。',
    likeCount: 0,
    replies: [],
  },
  {
    id: 'comment2',
    user: { name: '用户B', avatarUrl: 'https://placehold.co/40x40.png?text=U2', dataAiHint: 'user avatar' },
    timestamp: '1小时前',
    text: '建议补充一下复现步骤。',
    likeCount: 0,
    replies: [],
  },
];

interface CommunityPostDetailViewProps {
  post: CommunityPost;
  initialComments?: CommunityCommentThread[];
}

export default function CommunityPostDetailView({
  post,
  initialComments = initialMockComments,
}: CommunityPostDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, token, isAuthenticated } = useAuth();

  const [comments, setComments] = useState<CommunityCommentThread[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSyncingLike, setIsSyncingLike] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [imageRetry, setImageRetry] = useState(0);
  const [detailImageError, setDetailImageError] = useState(false);
  const [activePreviewImages, setActivePreviewImages] = useState<string[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [isPreviewDragging, setIsPreviewDragging] = useState(false);
  const [isPreviewImageError, setIsPreviewImageError] = useState(false);
  const previewDragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({});
  const [pendingCommentLikeIds, setPendingCommentLikeIds] = useState<Record<string, boolean>>({});
  const [appPromptDialog, setAppPromptDialog] = useState<{ open: boolean; url?: string }>({ open: false });

  useEffect(() => {
    if (typeof post.viewsCount === 'number' && post.viewsCount >= 0) {
      setViewCount(post.viewsCount);
      return;
    }
    setViewCount(Math.floor(Math.random() * 200) + post.commentsCount + post.likesCount + 51);
  }, [post.commentsCount, post.likesCount, post.viewsCount]);

  const totalCommentCount = useMemo(
    () => comments.reduce((acc, thread) => acc + 1 + (thread.replies?.length || 0), 0),
    [comments],
  );

  const previewImages = useMemo(() => {
    const urls: string[] = [];
    const pushUnique = (value?: string) => {
      const url = (value || '').trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) return;
      if (urls.includes(url)) return;
      urls.push(url);
    };

    pushUnique(post.imageUrl);

    const markdownImageRegex = /!\[[^\]]*]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/gi;
    const htmlImageRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;

    let match: RegExpExecArray | null;
    while ((match = markdownImageRegex.exec(post.content || '')) !== null) {
      pushUnique(match[1]);
    }
    while ((match = htmlImageRegex.exec(post.content || '')) !== null) {
      pushUnique(match[1]);
    }

    return urls;
  }, [post.content, post.imageUrl]);

  const reloadComments = async () => {
    const latest = await getCommunityCommentThreads(post.id, 30);
    setComments(latest);
  };

  useEffect(() => {
    setCommentLikeCounts((prev) => {
      const next = { ...prev };
      comments.forEach((comment) => {
        if (typeof next[comment.id] !== 'number') next[comment.id] = comment.likeCount || 0;
        (comment.replies || []).forEach((reply) => {
          if (typeof next[reply.id] !== 'number') next[reply.id] = reply.likeCount || 0;
        });
      });
      return next;
    });
  }, [comments]);

  const handleLike = async () => {
    if (isSyncingLike) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞。',
        variant: 'destructive',
      });
      return;
    }

    const nextLiked = !isLiked;
    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
    setIsSyncingLike(true);

    try {
      const res = await trackedApiFetch(`/content/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0 || !json?.data) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }
      setIsLiked(Boolean(json.data.liked));
      setLikeCount(Number(json.data.like_count ?? 0));
    } catch {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingLike(false);
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

    const optimistic = {
      id: `tmp-${Date.now()}`,
      user: {
        name: user?.name || user?.username || 'Current User',
        avatarUrl: user?.avatar || 'https://placehold.co/40x40.png?text=ME',
        dataAiHint: 'user avatar',
      },
      timestamp: '刚刚',
      text: content,
      likeCount: 0,
      replies: [] as CommunityCommentThread['replies'],
    };

    setComments((prev) => {
      if (!replyTarget?.id) return [optimistic, ...prev];
      return prev.map((thread) => {
        if (thread.id !== replyTarget.id) return thread;
        return {
          ...thread,
          replies: [...thread.replies, { ...optimistic, text: `回复 @${replyTarget.name}：${content}` }],
        };
      });
    });

    setIsSubmittingComment(true);
    try {
      const res = await trackedApiFetch(`/content/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          ...(replyTarget?.id ? { parent_id: replyTarget.id } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);

      setNewComment('');
      setReplyTarget(null);
      await reloadComments();
      toast({ title: '评论成功', description: '已提交。' });
    } catch {
      await reloadComments();
      toast({
        title: '提交失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const openPreviewImage = (url: string) => {
    const normalizePreviewUrl = (input: string) => {
      const raw = (input || '').trim();
      if (!raw) return '';
      try {
        const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        if (parsed.pathname === '/_next/image') {
          const original = parsed.searchParams.get('url');
          if (original) return decodeURIComponent(original);
        }
        return parsed.toString();
      } catch {
        return raw;
      }
    };

    const normalizedUrl = normalizePreviewUrl(url);
    if (!normalizedUrl) return;

    const baseList = previewImages.length > 0 ? previewImages : [normalizedUrl];
    const nextList = baseList.includes(normalizedUrl)
      ? baseList
      : [normalizedUrl, ...baseList.filter((item) => item !== normalizedUrl)];
    const index = nextList.findIndex((item) => item === normalizedUrl);

    setActivePreviewImages(nextList);
    setSelectedPreviewIndex(index >= 0 ? index : 0);
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewDragging(false);
    setIsPreviewImageError(false);
  };

  const closePreviewImage = () => {
    setSelectedPreviewIndex(null);
    setActivePreviewImages([]);
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewDragging(false);
    setIsPreviewImageError(false);
  };

  const handlePrevPreviewImage = () => {
    if (activePreviewImages.length <= 1) return;
    setSelectedPreviewIndex((prev) => {
      if (prev === null) return 0;
      return (prev - 1 + activePreviewImages.length) % activePreviewImages.length;
    });
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewImageError(false);
  };

  const handleNextPreviewImage = () => {
    if (activePreviewImages.length <= 1) return;
    setSelectedPreviewIndex((prev) => {
      if (prev === null) return 0;
      return (prev + 1) % activePreviewImages.length;
    });
    setPreviewZoom(1);
    setPreviewPosition({ x: 0, y: 0 });
    setIsPreviewImageError(false);
  };

  const handlePreviewZoom = (next: number) => {
    const clamped = Math.max(0.5, Math.min(next, 3));
    setPreviewZoom(clamped);
    if (clamped <= 1) {
      setPreviewPosition({ x: 0, y: 0 });
    }
  };

  const handlePreviewImagePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
    if (previewZoom <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    previewDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: previewPosition.x,
      originY: previewPosition.y,
    };
    setIsPreviewDragging(true);
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

    const candidateEndpoints = [
      `/content/comments/${commentId}/like`,
      `/content/comment/${commentId}/like`,
      `/content/comments/${commentId}/likes`,
    ];

    try {
      let synced = false;
      let serverLiked = nextLiked;
      let serverCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

      for (const endpoint of candidateEndpoints) {
        const res = await trackedApiFetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'toggle' }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.code !== 0) continue;

        serverLiked = Boolean(json?.data?.liked ?? nextLiked);
        const parsedCount = Number(json?.data?.like_count);
        if (Number.isFinite(parsedCount)) serverCount = parsedCount;
        synced = true;
        break;
      }

      if (!synced) throw new Error('like endpoint failed');

      setLikedCommentIds((prev) => ({ ...prev, [commentId]: serverLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: serverCount }));
    } catch {
      setLikedCommentIds((prev) => ({ ...prev, [commentId]: wasLiked }));
      setCommentLikeCounts((prev) => ({ ...prev, [commentId]: previousCount }));
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setPendingCommentLikeIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSharePost = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `/community/post/${post.id}`;
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
      toast({ title: '复制链接成功', description: '已复制帖子链接，可直接分享。' });
    } catch {
      toast({ title: '复制失败', description: '请稍后重试。', variant: 'destructive' });
    }
  };

  const handleMarkdownContainerClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;

    const imageEl = target?.closest('img') as HTMLImageElement | null;
    if (imageEl?.src) {
      event.preventDefault();
      openPreviewImage(imageEl.src);
      return;
    }

    const appLinkEl = target?.closest('[data-app-link], [data-acbox-url]') as HTMLElement | null;
    if (!appLinkEl) return;
    event.preventDefault();
    setAppPromptDialog({
      open: true,
      url: appLinkEl.getAttribute('data-app-link') || appLinkEl.getAttribute('data-acbox-url') || '',
    });
  };

  const relatedApp = post.relatedApp;
  const relatedAppHref = relatedApp?.pkg ? `/app/${relatedApp.pkg}` : undefined;
  const relatedAppPrimaryTag = relatedApp?.regionTag || relatedApp?.tags?.[0] || (relatedApp?.pkg ? '国际服' : '');

  useEffect(() => {
    if (selectedPreviewIndex === null) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPreviewIndex]);

  useEffect(() => {
    if (!isPreviewDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = previewDragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      event.preventDefault();
      setPreviewPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      const dragState = previewDragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      previewDragStateRef.current = null;
      setIsPreviewDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isPreviewDragging]);

  useEffect(() => {
    if (selectedPreviewIndex === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreviewImage();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevPreviewImage();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextPreviewImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPreviewIndex, activePreviewImages.length]);

  const commentsCard = (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <MessageSquare size={20} className="mr-2 text-primary" />
          评论 ({totalCommentCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <Avatar className="mt-1">
            <AvatarImage src="https://placehold.co/40x40.png?text=ME" alt="当前用户" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="flex-grow space-y-2">
            <Textarea
              placeholder={replyTarget ? `回复 @${replyTarget.name}...` : '写下你的评论...'}
              rows={3}
              className="text-sm"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            {replyTarget && (
              <div className="text-xs text-muted-foreground">
                正在回复 @{replyTarget.name}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 ml-2"
                  onClick={() => setReplyTarget(null)}
                >
                  取消
                </Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleCommentSubmit}
                className="btn-interactive"
                size="sm"
                disabled={!newComment.trim() || isSubmittingComment}
              >
                <Send size={16} className="mr-2" /> 发送
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
                  <AvatarFallback>{comment.user.name.substring(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                      disabled={pendingCommentLikeIds[comment.id]}
                      onClick={() => handleCommentLike(comment.id)}
                    >
                      <ThumbsUp size={14} className={`mr-1 ${likedCommentIds[comment.id] ? 'fill-primary text-primary' : ''}`} />
                      {commentLikeCounts[comment.id] ?? comment.likeCount ?? 0}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setReplyTarget({ id: comment.id, name: comment.user.name })}
                    >
                      回复
                    </Button>
                  </div>
                </div>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-12 space-y-2">
                  {(expandedReplies[comment.id] ? comment.replies : comment.replies.slice(0, 2)).map((reply) => (
                    <div key={reply.id} className="flex items-start space-x-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} />
                        <AvatarFallback>{reply.user.name.substring(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow rounded-md bg-muted/20 p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-foreground">{reply.user.name}</span>
                          <span className="text-[11px] text-muted-foreground">{reply.timestamp}</span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-line">{reply.text}</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-primary"
                            disabled={pendingCommentLikeIds[reply.id]}
                            onClick={() => handleCommentLike(reply.id)}
                          >
                            <ThumbsUp
                              size={12}
                              className={`mr-1 ${likedCommentIds[reply.id] ? 'fill-primary text-primary' : ''}`}
                            />
                            {commentLikeCounts[reply.id] ?? reply.likeCount ?? 0}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-primary"
                            onClick={() => setReplyTarget({ id: comment.id, name: reply.user.name })}
                          >
                            回复
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {comment.replies.length > 2 && (
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
                  )}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无评论</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const currentPreviewUrl =
    selectedPreviewIndex !== null ? activePreviewImages[selectedPreviewIndex] || '' : '';

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 py-8 fade-in">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2 h-8 px-3 py-1 self-start btn-interactive">
        <ArrowLeft size={16} className="mr-2" />
        返回社区
      </Button>

      <div className="xl:grid xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:gap-6">
        <aside className="hidden xl:block">
          {relatedApp ? (
            <Card className="sticky top-24 overflow-hidden border border-white/20 shadow-xl">
              {relatedApp.icon && (
                <div className="absolute inset-0">
                  <Image src={relatedApp.icon} alt={relatedApp.name} fill className="scale-125 object-cover blur-2xl" />
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-xl" />
                </div>
              )}
              <CardContent className="relative z-10 p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/30 bg-white/10">
                    {relatedApp.icon ? (
                      <Image src={relatedApp.icon} alt={relatedApp.name} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-base font-semibold text-white">{relatedApp.name}</p>
                    {relatedAppPrimaryTag && (
                      <Badge className="mt-1 border-white/30 bg-white/20 text-[11px] text-white">{relatedAppPrimaryTag}</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/90">
                  {relatedApp.summary || '查看关联游戏详情与资源信息。'}
                </p>
                {relatedAppHref && (
                  <Button asChild size="sm" className="mt-3 w-full bg-white/20 text-white hover:bg-white/30">
                    <Link href={relatedAppHref}>查看游戏详情</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div />
          )}
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start space-x-3">
                <Avatar className="w-11 h-11">
                  <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                  <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-foreground">{post.user.name}</p>
                    {post.user.level && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 font-normal bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                        Lv.{post.user.level}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.timestamp}
                    {post.source && ` · ${post.source}`}
                    {post.user.location && ` · ${post.user.location}`}
                  </p>
                </div>
              </div>
              {post.title && <h1 className="text-xl md:text-2xl font-bold mt-3">{post.title}</h1>}
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <article
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                dangerouslySetInnerHTML={renderMarkdown(post.content)}
                onClick={handleMarkdownContainerClick}
              />

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {post.tags.map((tag, index) => (
                    <Badge key={`${post.id}-detail-tag-${index}-${tag}`} variant="outline" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {post.imageUrl && (
                <div className="rounded-lg overflow-hidden aspect-video relative bg-muted mt-4">
                  {!detailImageError ? (
                    <Image
                      key={imageRetry}
                      src={post.imageUrl}
                      alt={post.title || '帖子图片'}
                      fill
                      className="object-contain cursor-zoom-in"
                      data-ai-hint={post.imageAiHint || 'community post image detail'}
                      onError={() => setDetailImageError(true)}
                      onClick={() => openPreviewImage(post.imageUrl || '')}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                      onClick={() => {
                        setDetailImageError(false);
                        setImageRetry((v) => v + 1);
                      }}
                    >
                        图片加载失败，点击重试
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-4 pt-3 flex flex-col items-start space-y-3">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Eye size={16} className="mr-1.5" />
                  {viewCount !== null ? `${viewCount} 次浏览` : '...'}
                </div>
              </div>
              <div className="w-full flex items-center justify-start gap-2 sm:gap-3 border-t pt-3">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2" onClick={handleLike}>
                  <ThumbsUp size={18} className={`mr-1.5 ${isLiked ? 'fill-primary text-primary' : ''}`} /> {likeCount}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
                  <MessageSquare size={18} className="mr-1.5" /> {totalCommentCount}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
                  <Bookmark size={18} className="mr-1.5" /> 收藏
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 ml-auto" onClick={handleSharePost}>
                  <Share2 size={18} className="mr-1.5" /> 分享
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="xl:hidden">{commentsCard}</div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            {commentsCard}
          </div>
        </aside>
      </div>

      {selectedPreviewIndex !== null && currentPreviewUrl && (
        <div className="fixed inset-0 z-[10000] bg-black/90" onClick={closePreviewImage}>
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4" onClick={(e) => e.stopPropagation()}>
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={() => handlePreviewZoom(previewZoom - 0.2)}
              >
                <ZoomOut size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={() => {
                  setPreviewPosition({ x: 0, y: 0 });
                  setPreviewZoom(1);
                }}
              >
                <RotateCcw size={18} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={() => handlePreviewZoom(previewZoom + 0.2)}
              >
                <ZoomIn size={18} />
              </Button>
              <Button asChild type="button" variant="ghost" size="sm" className="bg-black/50 text-white hover:bg-black/70">
                <a href={currentPreviewUrl} target="_blank" rel="noopener noreferrer" download>
                  下载
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-black/50 text-white hover:bg-black/70"
                onClick={closePreviewImage}
              >
                <X size={18} />
              </Button>
            </div>
            {activePreviewImages.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65"
                  onClick={handlePrevPreviewImage}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 bg-black/45 text-white hover:bg-black/65"
                  onClick={handleNextPreviewImage}
                >
                  <ChevronRight size={20} />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
              {selectedPreviewIndex + 1} / {activePreviewImages.length || 1}
            </div>

            <img
              src={currentPreviewUrl}
              alt={post.title || '帖子图片'}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
              onWheel={(event) => {
                event.preventDefault();
                handlePreviewZoom(previewZoom + (event.deltaY > 0 ? -0.1 : 0.1));
              }}
              onPointerDown={handlePreviewImagePointerDown}
              className="max-h-[92vh] max-w-[92vw] select-none object-contain"
              style={{
                transform: `translate(${previewPosition.x}px, ${previewPosition.y}px) scale(${previewZoom})`,
                transformOrigin: 'center center',
                touchAction: previewZoom > 1 ? 'none' : 'manipulation',
                cursor: previewZoom > 1 ? (isPreviewDragging ? 'grabbing' : 'grab') : 'zoom-in',
              }}
              onError={() => setIsPreviewImageError(true)}
            />
            {isPreviewImageError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="rounded-md bg-black/55 px-3 py-2 text-sm text-white">
                  图片加载失败，请切换下一张或重试
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {appPromptDialog.open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setAppPromptDialog({ open: false })}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-lg">请在 App 中打开</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>该链接需要使用 ACBOX App 打开。</p>
              {appPromptDialog.url && <p className="break-all text-xs">{appPromptDialog.url}</p>}
              <div className="mx-auto relative h-44 w-44 overflow-hidden rounded-md border">
                <Image
                  src="https://cdn.apks.cc/blinko/ACBOX_QR.png"
                  alt="ACBOX QR"
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="button" onClick={() => setAppPromptDialog({ open: false })}>
                关闭
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

