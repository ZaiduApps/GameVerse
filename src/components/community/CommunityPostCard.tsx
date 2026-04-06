'use client';

import type { CommunityPost } from '@/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, ThumbsUp, MoreHorizontal, Bookmark, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { trackedApiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface CommunityPostCardProps {
  post: CommunityPost;
  index?: number;
  canModerate?: boolean;
  moderationBusy?: boolean;
  onModerateDelete?: (post: CommunityPost) => void;
  onModerateOffline?: (post: CommunityPost) => void;
}

const BOOKMARK_STORAGE_KEY = 'community:bookmarked-posts:v1';
const LIKE_BURST_DURATION_MS = 680;
const LIKE_BURST_SPARKS: Array<{ x: number; y: number; color: string; delay: number }> = [
  { x: 0, y: -16, color: '#fdc003', delay: 0 },
  { x: 13, y: -11, color: '#ff7767', delay: 20 },
  { x: 16, y: 0, color: '#00c3e3', delay: 40 },
  { x: 12, y: 12, color: '#fdc003', delay: 60 },
  { x: 0, y: 16, color: '#ff7767', delay: 80 },
  { x: -12, y: 12, color: '#00c3e3', delay: 100 },
  { x: -16, y: 0, color: '#fdc003', delay: 120 },
  { x: -13, y: -11, color: '#ff7767', delay: 140 },
];

function readBookmarkedPostIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item || '').trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function writeBookmarkedPostIds(postIds: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(postIds));
  } catch {
    // ignore localStorage failures
  }
}

function toPostExcerpt(post: CommunityPost, maxLength = 140): string {
  const source = String(post.summary || post.content || '').trim();
  if (!source) return '暂无摘要';

  const plain = source
    .replace(/\r\n?/g, '\n')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/!\[([^\]]*)\]\((?:[^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/\b(?:https?|acbox|uu-mobile):\/\/[^\s<>"')\]]+/gi, ' ')
    .replace(/^>+\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^---+$/gm, ' ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/<\/?(?:p|div|section|article|blockquote|li|ul|ol|h[1-6]|span|strong|em|code|pre)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return '暂无摘要';
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}...` : plain;
}

export default function CommunityPostCard({
  post,
  index = 0,
  canModerate = false,
  moderationBusy = false,
  onModerateDelete,
  onModerateOffline,
}: CommunityPostCardProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.max(0, Number(post.likesCount || 0)));
  const [likePending, setLikePending] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const likeBurstTimerRef = useRef<number | null>(null);
  const { toast } = useToast();
  const excerpt = toPostExcerpt(post);
  const relatedApp = post.relatedApp;
  const relatedAppHref = relatedApp?.pkg ? `/app/${relatedApp.pkg}` : undefined;
  const relatedAppPrimaryTag =
    relatedApp?.regionTag || relatedApp?.tags?.[0] || (relatedApp?.pkg ? '国际服' : '');
  const postId = String(post.id || '').trim();

  useEffect(() => {
    setLikeCount(Math.max(0, Number(post.likesCount || 0)));
  }, [post.id, post.likesCount]);

  useEffect(() => {
    if (!postId) {
      setBookmarked(false);
      return;
    }
    const ids = readBookmarkedPostIds();
    setBookmarked(ids.includes(postId));
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    if (!postId || !isAuthenticated || !token) {
      setLiked(false);
      return () => {
        cancelled = true;
      };
    }

    const loadLikeStatus = async () => {
      try {
        const res = await trackedApiFetch(`/content/${encodeURIComponent(postId)}/like-status`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.code === 0) {
          setLiked(Boolean(json?.data?.liked));
        }
      } catch {
        // ignore like status failures
      }
    };

    void loadLikeStatus();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, postId, token]);

  useEffect(() => {
    return () => {
      if (likeBurstTimerRef.current) {
        window.clearTimeout(likeBurstTimerRef.current);
        likeBurstTimerRef.current = null;
      }
    };
  }, []);

  const triggerLikeBurst = () => {
    setShowLikeBurst(false);
    if (likeBurstTimerRef.current) {
      window.clearTimeout(likeBurstTimerRef.current);
      likeBurstTimerRef.current = null;
    }
    window.requestAnimationFrame(() => setShowLikeBurst(true));
    likeBurstTimerRef.current = window.setTimeout(() => {
      setShowLikeBurst(false);
      likeBurstTimerRef.current = null;
    }, LIKE_BURST_DURATION_MS);
  };

  const handleShare = async () => {
    const path = `/community/post/${post.id}`;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path;

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

  const handleCopyPostId = async () => {
    if (!postId) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postId);
      }
      toast({ title: '复制成功', description: '帖子 ID 已复制。' });
    } catch {
      toast({ title: '复制失败', description: '请稍后重试。', variant: 'destructive' });
    }
  };

  const handleComment = () => {
    if (!postId) return;
    router.push(`/community/post/${encodeURIComponent(postId)}#comments`);
  };

  const handleToggleBookmark = () => {
    if (!postId || bookmarkPending) return;
    setBookmarkPending(true);

    const ids = new Set(readBookmarkedPostIds());
    const next = !ids.has(postId);
    if (next) {
      ids.add(postId);
    } else {
      ids.delete(postId);
    }
    writeBookmarkedPostIds(Array.from(ids));
    setBookmarked(next);

    toast({
      title: next ? '收藏成功' : '已取消收藏',
      description: next ? '已加入本地收藏列表。' : '已从本地收藏列表移除。',
    });

    setBookmarkPending(false);
  };

  const handleToggleLike = async () => {
    if (!postId || likePending) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞。',
        variant: 'destructive',
      });
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !prevLiked;

    setLiked(nextLiked);
    setLikeCount(nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    if (nextLiked) triggerLikeBurst();
    setLikePending(true);

    try {
      const res = await trackedApiFetch(`/content/${encodeURIComponent(postId)}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      const serverLiked = Boolean(json?.data?.liked);
      const serverCount = Number(json?.data?.like_count);
      setLiked(serverLiked);
      setLikeCount(Number.isFinite(serverCount) ? Math.max(0, serverCount) : Math.max(0, prevCount));
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setLikePending(false);
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.user.avatarUrl} alt={post.user.name} data-ai-hint={post.user.dataAiHint || 'user avatar'} />
              <AvatarFallback>{post.user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground">{post.user.name}</p>
                {post.user.level && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 font-normal bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                    Lv.{post.user.level}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {post.timestamp}
                {post.source && ` ${post.source}`}
                {post.user.location && ` · ${post.user.location}`}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>帖子操作</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/community/post/${post.id}`}>查看详情</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleCopyPostId()}>复制 ID</DropdownMenuItem>
              {canModerate ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={moderationBusy}
                    onClick={() => onModerateOffline?.(post)}
                  >
                    下线帖子
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={moderationBusy}
                    onClick={() => onModerateDelete?.(post)}
                    className="text-red-600 focus:text-red-600"
                  >
                    删除帖子
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {post.title && (
          <Link href={`/community/post/${post.id}`} className="block hover:text-primary transition-colors">
            <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary">{post.title}</h3>
          </Link>
        )}
        <Link href={`/community/post/${post.id}`} className="block min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3 hover:text-foreground transition-colors">
            {excerpt}
          </p>
        </Link>
        {post.imageUrl && (
          <Link
            href={`/community/post/${post.id}`}
            className="relative block h-36 w-52 overflow-hidden rounded-lg bg-muted sm:h-40 sm:w-56"
          >
            {!isImageLoaded && !isImageError && <div className="absolute inset-0 animate-pulse bg-muted/70" />}
            {!isImageError ? (
              <Image
                src={post.imageUrl}
                alt={post.title || 'Post image'}
                fill
                className={cn('object-cover transition-opacity duration-300', isImageLoaded ? 'opacity-100' : 'opacity-0')}
                data-ai-hint={post.imageAiHint || 'community post image'}
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setIsImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                图片失败
              </div>
            )}
          </Link>
        )}
        {relatedApp ? (
          <div className="relative mt-1 overflow-hidden rounded-lg border border-black/10 shadow-sm">
            {relatedApp.icon && (
              <div className="absolute inset-0">
                <Image
                  src={relatedApp.icon}
                  alt={relatedApp.name}
                  fill
                  className="scale-125 object-cover blur-2xl"
                />
                <div className="absolute inset-0 bg-black/45 backdrop-blur-xl" />
              </div>
            )}
            <div className="relative z-10 p-3">
              <div className="flex items-start gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/30 bg-white/10">
                  {relatedApp.icon ? (
                    <Image src={relatedApp.icon} alt={relatedApp.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="line-clamp-1 text-xs font-semibold text-white">{relatedApp.name}</p>
                    {relatedAppPrimaryTag ? (
                      <Badge className="shrink-0 border-white/30 bg-white/20 text-[11px] text-white">
                        {relatedAppPrimaryTag}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/90">
                    {relatedApp.summary || '查看关联游戏详情与资源信息。'}
                  </p>
                </div>
                {relatedAppHref ? (
                  <Button
                    asChild
                    size="sm"
                    className="h-7 shrink-0 bg-white/20 px-2.5 text-xs text-white hover:bg-white/30"
                  >
                    <Link href={relatedAppHref}>查看游戏详情</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-start gap-2 sm:gap-4 border-t">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('px-2 text-muted-foreground hover:text-primary', bookmarked && 'text-primary')}
          onClick={handleToggleBookmark}
          disabled={bookmarkPending}
        >
          <Bookmark size={18} className={cn('mr-1.5', bookmarked && 'fill-current')} /> {bookmarked ? '已收藏' : '收藏'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="px-2 text-muted-foreground hover:text-primary" onClick={handleComment}>
          <MessageSquare size={18} className="mr-1.5" /> {post.commentsCount}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('relative overflow-visible px-2 text-muted-foreground hover:text-primary', liked && 'text-primary')}
          onClick={() => void handleToggleLike()}
          disabled={likePending}
        >
          <span className="relative inline-flex items-center">
            <ThumbsUp size={18} className={cn('mr-1.5', liked && 'fill-current')} />
            {showLikeBurst && (
              <span className="pointer-events-none absolute left-0 top-0 z-10 h-0 w-0">
                {LIKE_BURST_SPARKS.map((spark, idx) => (
                  <span
                    key={`spark-${postId}-${idx}`}
                    className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full animate-ping"
                    style={{
                      backgroundColor: spark.color,
                      transform: `translate(${spark.x}px, ${spark.y}px)`,
                      animationDelay: `${spark.delay}ms`,
                      animationDuration: '560ms',
                    }}
                  />
                ))}
              </span>
            )}
          </span>
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 ml-auto" onClick={handleShare}>
          <Share2 size={18} className="mr-1.5" /> 分享
        </Button>
      </CardFooter>
    </Card>
  );
}
