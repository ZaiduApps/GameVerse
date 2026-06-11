'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsDown,
  Trash2,
  EyeOff,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import { getCommunityAuthorProfileHref } from '@/lib/community-profile';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { cn } from '@/lib/utils';
import type { CommunityPost } from '@/types';

const BOOKMARK_STORAGE_KEY = 'community:bookmarked-posts:v1';
const DISLIKE_STORAGE_KEY = 'community:disliked-posts:v1';

interface CommunityFeedPostCardProps {
  post: CommunityPost;
  index?: number;
  canManage?: boolean;
  className?: string;
  density?: 'default' | 'compact';
  hideAuthor?: boolean;
  hideLinkShortcuts?: boolean;
  moderationBusy?: boolean;
  onDelete?: (post: CommunityPost) => void;
  onHide?: (post: CommunityPost) => void;
  onOpenPost?: (postId: string) => void;
}

function readStoredIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function writeStoredIds(key: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {}
}

function formatCount(value?: number): string {
  const count = Math.max(0, Number(value || 0));
  if (count >= 10000) return `${(count / 10000).toFixed(count >= 100000 ? 0 : 1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

function extractPostLinks(post: CommunityPost) {
  const byUrl = new Map<string, NonNullable<CommunityPost['linkPreviews']>[number]>();
  (post.linkPreviews || []).forEach((preview) => {
    const url = String(preview.url || '').trim();
    if (!/^https?:\/\//i.test(url)) return;
    byUrl.set(url, preview);
  });

  const source = String(post.content || '');
  const matches = source.match(/\bhttps?:\/\/[^\s<>"')\]]+/gi) || [];
  matches.forEach((raw) => {
    const url = raw.replace(/[.,;!?，。；！？]+$/g, '');
    if (byUrl.has(url)) return;
    let host = '';
    try {
      host = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
    byUrl.set(url, {
      url,
      title: host || url,
      description: url,
      site_name: host,
    });
  });

  return Array.from(byUrl.values()).slice(0, 3);
}

function getImageCellClass(count: number, index: number) {
  if (count === 1) return 'aspect-[4/3] max-h-[360px] sm:max-w-[560px]';
  if (count === 2) return 'aspect-[4/3]';
  if (count === 3 && index === 0) return 'aspect-[4/3] row-span-2';
  return 'aspect-square';
}

export default function CommunityFeedPostCard({
  post,
  index = 0,
  canManage = false,
  className,
  density = 'default',
  hideAuthor = false,
  hideLinkShortcuts = false,
  moderationBusy = false,
  onDelete,
  onHide,
  onOpenPost,
}: CommunityFeedPostCardProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.max(0, Number(post.likesCount || 0)));
  const [likePending, setLikePending] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(Math.max(0, Number(post.dislikesCount || 0)));
  const [dislikePending, setDislikePending] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [previewState, setPreviewState] = useState<{ images: string[]; index: number } | null>(null);
  const touchStartX = useRef<number | null>(null);

  const postId = String(post.id || '').trim();
  const postHref = postId ? `/community/post/${encodeURIComponent(postId)}` : '/community';
  const authorHref = getCommunityAuthorProfileHref(post);
  const previewText = getCommunityPostPreviewText(post, density === 'compact' ? 110 : 220, '暂无内容');
  const images = useMemo(
    () => Array.from(new Set([...(post.previewImages || []), post.imageUrl].map((url) => String(url || '').trim()).filter(Boolean))).slice(0, 9),
    [post.imageUrl, post.previewImages],
  );
  const links = useMemo(() => extractPostLinks(post), [post]);
  const topics = useMemo(
    () => Array.from(new Set([...(post.topicNames || []), ...(post.tags || [])].map((tag) => String(tag || '').trim()).filter(Boolean))).slice(0, 4),
    [post.tags, post.topicNames],
  );

  useEffect(() => {
    setLikeCount(Math.max(0, Number(post.likesCount || 0)));
    setDislikeCount(Math.max(0, Number(post.dislikesCount || 0)));
  }, [post.dislikesCount, post.id, post.likesCount]);

  useEffect(() => {
    if (!postId) return;
    setBookmarked(readStoredIds(BOOKMARK_STORAGE_KEY).includes(postId));
    setDisliked(readStoredIds(DISLIKE_STORAGE_KEY).includes(postId));
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    if (!postId || !isAuthenticated || !token) {
      setLiked(false);
      return () => {
        cancelled = true;
      };
    }
    void trackedApiFetch(`/content/${encodeURIComponent(postId)}/like-status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => res.json().catch(() => null).then((json) => ({ res, json })))
      .then(({ res, json }) => {
        if (cancelled || !res.ok || json?.code !== 0) return;
        setLiked(Boolean(json?.data?.liked));
      })
      .catch(() => {});

    void trackedApiFetch(`/content/${encodeURIComponent(postId)}/dislike-status`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => res.json().catch(() => null).then((json) => ({ res, json })))
      .then(({ res, json }) => {
        if (cancelled || !res.ok || json?.code !== 0) return;
        setDisliked(Boolean(json?.data?.disliked));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, postId, token]);

  useEffect(() => {
    if (!previewState) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewState(null);
      if (event.key === 'ArrowLeft') {
        setPreviewState((prev) =>
          prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null,
        );
      }
      if (event.key === 'ArrowRight') {
        setPreviewState((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewState]);

  const persistReturnAndOpen = () => {
    if (!postId) return;
    onOpenPost?.(postId);
  };

  const handleToggleBookmark = () => {
    if (!postId) return;
    const ids = new Set(readStoredIds(BOOKMARK_STORAGE_KEY));
    const next = !ids.has(postId);
    if (next) ids.add(postId);
    else ids.delete(postId);
    writeStoredIds(BOOKMARK_STORAGE_KEY, Array.from(ids));
    setBookmarked(next);
    toast({ title: next ? '收藏成功' : '已取消收藏' });
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${postHref}` : postHref;
    try {
      await navigator.clipboard?.writeText(url);
      toast({ title: '复制链接成功' });
    } catch {
      toast({ title: '复制失败', variant: 'destructive' });
    }
  };

  const handleLike = async () => {
    if (!postId || likePending) return;
    if (!isAuthenticated || !token) {
      toast({ title: '需要登录', description: '请先登录后再点赞。', variant: 'destructive' });
      return;
    }
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => (nextLiked ? count + 1 : Math.max(0, count - 1)));
    if (nextLiked && disliked) {
      setDisliked(false);
      setDislikeCount((count) => Math.max(0, count - 1));
    }
    setLikePending(true);
    try {
      const res = await trackedApiFetch(`/content/${encodeURIComponent(postId)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) throw new Error(json?.message || 'like failed');
      setLiked(Boolean(json?.data?.liked));
      setLikeCount(Math.max(0, Number(json?.data?.like_count ?? prevLikeCount)));
      if (json?.data?.disliked !== undefined) setDisliked(Boolean(json.data.disliked));
      if (json?.data?.dislike_count !== undefined) setDislikeCount(Math.max(0, Number(json.data.dislike_count)));
    } catch {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikeCount(prevLikeCount);
      setDislikeCount(prevDislikeCount);
      toast({ title: '点赞失败', description: '请稍后重试。', variant: 'destructive' });
    } finally {
      setLikePending(false);
    }
  };

  const handleDislike = async () => {
    if (!postId || dislikePending) return;
    if (!isAuthenticated || !token) {
      toast({ title: '需要登录', description: '请先登录后再操作。', variant: 'destructive' });
      return;
    }
    const prevLiked = liked;
    const prevDisliked = disliked;
    const prevLikeCount = likeCount;
    const prevDislikeCount = dislikeCount;
    const nextDisliked = !disliked;
    setDisliked(nextDisliked);
    setDislikeCount((count) => (nextDisliked ? count + 1 : Math.max(0, count - 1)));
    if (nextDisliked && liked) {
      setLiked(false);
      setLikeCount((count) => Math.max(0, count - 1));
    }
    const ids = new Set(readStoredIds(DISLIKE_STORAGE_KEY));
    if (nextDisliked) ids.add(postId);
    else ids.delete(postId);
    writeStoredIds(DISLIKE_STORAGE_KEY, Array.from(ids));
    setDislikePending(true);
    try {
      const res = await trackedApiFetch(`/content/${encodeURIComponent(postId)}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) return;
      setDisliked(Boolean(json?.data?.disliked));
      setDislikeCount(Math.max(0, Number(json?.data?.dislike_count ?? dislikeCount)));
      if (json?.data?.liked !== undefined) setLiked(Boolean(json.data.liked));
      if (json?.data?.like_count !== undefined) setLikeCount(Math.max(0, Number(json.data.like_count)));
    } catch {
      setDisliked(prevDisliked);
      setLiked(prevLiked);
      setDislikeCount(prevDislikeCount);
      setLikeCount(prevLikeCount);
      const rollbackIds = new Set(readStoredIds(DISLIKE_STORAGE_KEY));
      if (prevDisliked) rollbackIds.add(postId);
      else rollbackIds.delete(postId);
      writeStoredIds(DISLIKE_STORAGE_KEY, Array.from(rollbackIds));
      toast({ title: '操作失败', description: '请稍后重试。', variant: 'destructive' });
    } finally {
      setDislikePending(false);
    }
  };

  return (
    <article
      className={cn(
        'group relative rounded-lg bg-card px-4 py-4 shadow-sm transition-colors hover:bg-muted/20 sm:px-5',
        density === 'compact' && 'px-3 py-3 sm:px-4',
        className,
      )}
    >
      <div className="flex gap-3">
        {!hideAuthor ? (
          <Link
            href={authorHref || postHref}
            onClick={(event) => {
              if (!authorHref) event.preventDefault();
            }}
            className="mt-0.5 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
              <AvatarFallback>{post.user.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {!hideAuthor ? (
                <div className="flex flex-wrap items-center gap-1.5 text-sm leading-5">
                  <Link href={authorHref || postHref} className="font-semibold text-foreground hover:text-primary">
                    {post.user.name}
                  </Link>
                  {post.authorUsername ? (
                    <span className="text-muted-foreground">@{post.authorUsername}</span>
                  ) : null}
                  {post.isTop ? <Badge className="h-5 px-1.5 text-[10px]">置顶</Badge> : null}
                  {post.isRecommended ? <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">推荐</Badge> : null}
                </div>
              ) : null}
              <div className="mt-0.5 text-xs text-muted-foreground">
                {post.source ? `${post.source} · ` : ''}{post.timestamp}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>帖子操作</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={postHref} onClick={persistReturnAndOpen}>查看详情</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleShare()}>复制链接</DropdownMenuItem>
                {canManage ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={moderationBusy} onClick={() => onHide?.(post)}>
                      <EyeOff className="mr-2 h-4 w-4" />
                      隐藏
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={moderationBusy} className="text-red-600 focus:text-red-600" onClick={() => onDelete?.(post)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={postHref} onClick={persistReturnAndOpen} className="mt-2 block min-w-0">
            {post.title ? (
              <h3 className="mb-1 line-clamp-2 text-[15px] font-semibold leading-6 text-foreground group-hover:text-primary">
                {post.title}
              </h3>
            ) : null}
            <p
              className={cn(
                'whitespace-pre-line break-words text-[15px] leading-7 text-foreground/90',
                density === 'compact' ? 'line-clamp-3' : 'line-clamp-6',
              )}
            >
              {previewText}
            </p>
          </Link>

          {topics.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <Link
                  key={`${postId}-topic-${topic}`}
                  href={`/community?topicName=${encodeURIComponent(topic)}`}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/15"
                >
                  #{topic}
                </Link>
              ))}
            </div>
          ) : null}

          {images.length > 0 ? (
            <div
              className={cn(
                'mt-3 grid gap-1.5 overflow-hidden',
                images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'max-w-[520px] grid-cols-2' : 'max-w-[520px] grid-cols-3',
              )}
            >
              {images.map((image, imageIndex) => {
                const overflow = images.length > 9 && imageIndex === 8 ? images.length - 9 : 0;
                const visible = imageIndex < 9;
                if (!visible) return null;
                return (
                  <button
                    key={`${postId}-image-${imageIndex}-${image}`}
                    type="button"
                    className={cn(
                      'relative overflow-hidden rounded-md bg-muted text-muted-foreground',
                      getImageCellClass(images.length, imageIndex),
                    )}
                    onClick={() => setPreviewState({ images, index: imageIndex })}
                  >
                    <Image
                      src={image}
                      alt={post.title || '帖子图片'}
                      fill
                      sizes={images.length === 1 ? '(max-width: 768px) 92vw, 560px' : '180px'}
                      priority={index < 2 && imageIndex === 0}
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                    {overflow > 0 ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                        +{overflow}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {!hideLinkShortcuts && links.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {links.map((link) => (
                <a
                  key={`${postId}-link-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="flex min-w-0 items-center gap-2 rounded-md bg-muted/45 px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{link.title || link.site_name || link.url}</span>
                </a>
              ))}
            </div>
          ) : null}

          {post.relatedApp ? (
            <Link
              href={post.relatedApp.pkg ? `/app/${encodeURIComponent(post.relatedApp.pkg)}` : postHref}
              className="mt-3 flex items-center gap-2 rounded-md bg-primary/5 px-2.5 py-2 text-xs text-muted-foreground hover:bg-primary/10"
            >
              {post.relatedApp.icon ? (
                <Image src={post.relatedApp.icon} alt={post.relatedApp.name} width={24} height={24} className="rounded object-cover" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              <span className="min-w-0 flex-1 truncate">{post.relatedApp.name}</span>
              <span className="text-primary">查看</span>
            </Link>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-1 border-t pt-2 text-muted-foreground">
            <Button type="button" variant="ghost" size="sm" className={cn('h-8 px-2 text-xs', liked && 'text-primary')} onClick={() => void handleLike()} disabled={likePending}>
              <Heart className={cn('mr-1.5 h-4 w-4', liked && 'fill-current')} />
              {formatCount(likeCount)}
            </Button>
            <Button type="button" variant="ghost" size="sm" className={cn('h-8 px-2 text-xs', disliked && 'text-primary')} onClick={() => void handleDislike()} disabled={dislikePending}>
              <ThumbsDown className={cn('mr-1.5 h-4 w-4', disliked && 'fill-current')} />
              {formatCount(dislikeCount)}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                persistReturnAndOpen();
                router.push(`${postHref}#comments`);
              }}
            >
              <MessageCircle className="mr-1.5 h-4 w-4" />
              {formatCount(post.commentsCount)}
            </Button>
            <Button type="button" variant="ghost" size="sm" className={cn('h-8 px-2 text-xs', bookmarked && 'text-primary')} onClick={handleToggleBookmark}>
              <Bookmark className={cn('mr-1.5 h-4 w-4', bookmarked && 'fill-current')} />
              收藏
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => void handleShare()}>
              <Share2 className="mr-1.5 h-4 w-4" />
              分享
            </Button>
          </div>
        </div>
      </div>

      {previewState && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 px-3"
              role="dialog"
              aria-modal="true"
              onClick={() => setPreviewState(null)}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                onClick={() => setPreviewState(null)}
              >
                ×
              </Button>
              {previewState.images.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewState((prev) =>
                      prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null,
                    );
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              ) : null}
              <div
                className="relative h-[78vh] w-full max-w-5xl"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => {
                  touchStartX.current = event.clientX;
                }}
                onPointerUp={(event) => {
                  if (touchStartX.current === null || previewState.images.length <= 1) return;
                  const delta = event.clientX - touchStartX.current;
                  if (delta > 40) {
                    setPreviewState((prev) =>
                      prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null,
                    );
                  }
                  if (delta < -40) {
                    setPreviewState((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null));
                  }
                  touchStartX.current = null;
                }}
              >
                <Image
                  src={previewState.images[previewState.index]}
                  alt="预览图片"
                  fill
                  className="object-contain"
                  sizes="95vw"
                />
              </div>
              {previewState.images.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreviewState((prev) => (prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null));
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : null}
              <div className="absolute bottom-4 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
                {previewState.index + 1} / {previewState.images.length}
              </div>
            </div>,
            document.body,
          )
        : null}
    </article>
  );
}
