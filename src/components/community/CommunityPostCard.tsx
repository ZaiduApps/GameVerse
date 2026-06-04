'use client';

import type { CommunityPost } from '@/types';
import Image from 'next/image';
import { createPortal } from 'react-dom';
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
import { MessageSquare, ThumbsUp, MoreHorizontal, Bookmark, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { trackedApiFetch } from '@/lib/api';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { useRouter } from 'next/navigation';

interface CommunityPostCardProps {
  post: CommunityPost;
  index?: number;
  canManage?: boolean;
  moderationBusy?: boolean;
  onDelete?: (post: CommunityPost) => void;
  onHide?: (post: CommunityPost) => void;
  onOpenPost?: (postId: string) => void;
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
const LIKE_STATUS_CACHE = new Map<string, boolean>();
const LIKE_STATUS_INFLIGHT = new Map<string, Promise<boolean | null>>();

function buildLikeStatusCacheKey(postId: string, token: string): string {
  return `${token}::${postId}`;
}

function setLikeStatusCache(cacheKey: string, liked: boolean) {
  if (!LIKE_STATUS_CACHE.has(cacheKey) && LIKE_STATUS_CACHE.size >= 400) {
    const oldestKey = LIKE_STATUS_CACHE.keys().next().value;
    if (oldestKey) {
      LIKE_STATUS_CACHE.delete(oldestKey);
    }
  }
  LIKE_STATUS_CACHE.set(cacheKey, liked);
}

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

interface MultiCellLayout {
  aspectClass: string;
  rowSpan?: boolean;
  orderFirst?: boolean;
}

function resolveMultiImageLayout(
  count: number,
  getCat: (index: number) => string | null | undefined,
): MultiCellLayout[] {
  const result: MultiCellLayout[] = Array.from({ length: count }, () => ({ aspectClass: '' }));

  if (count === 2) {
    const c0 = getCat(0);
    const c1 = getCat(1);
    const bothPortrait = c0 === 'portrait' && c1 === 'portrait';
    const anyWide = (c0 === 'wide' || c0 === 'ultraWide') || (c1 === 'wide' || c1 === 'ultraWide');
    const a = bothPortrait ? 'aspect-[3/4]' : anyWide ? 'aspect-video' : 'aspect-[4/3]';
    result[0].aspectClass = a;
    result[1].aspectClass = a;
    return result;
  }

  if (count === 3) {
    const cats = [getCat(0), getCat(1), getCat(2)];
    const known: number[] = [];
    for (let i = 0; i < 3; i++) if (cats[i]) known.push(i);
    let heroIdx = 0;
    if (known.length > 0) {
      let bestScore = -1;
      for (const idx of known) {
        const sc = cats[idx] === 'ultraWide' ? 3 : cats[idx] === 'wide' ? 2 : cats[idx] === 'normal' ? 1 : 0;
        if (sc > bestScore) { bestScore = sc; heroIdx = idx; }
      }
    }
    const heroWide = cats[heroIdx] === 'ultraWide' || cats[heroIdx] === 'wide';
    for (let i = 0; i < 3; i++) {
      if (i === heroIdx) {
        result[i].aspectClass = heroWide ? 'aspect-video' : 'aspect-[4/3]';
        result[i].rowSpan = true;
        result[i].orderFirst = true;
      } else {
        result[i].aspectClass = 'aspect-[4/3]';
      }
    }
    return result;
  }

  if (count === 4) {
    const portraitCount = [getCat(0), getCat(1), getCat(2), getCat(3)].filter(c => c === 'portrait').length;
    const wideCount = [getCat(0), getCat(1), getCat(2), getCat(3)].filter(c => c === 'wide' || c === 'ultraWide').length;
    const a = portraitCount >= 3 ? 'aspect-[3/4]' : wideCount >= 2 ? 'aspect-video' : 'aspect-[4/3]';
    for (let i = 0; i < 4; i++) result[i].aspectClass = a;
    return result;
  }

  for (let i = 0; i < count; i++) result[i].aspectClass = 'aspect-square';
  return result;
}

function isWideCategory(category: string | null | undefined): boolean {
  return category === 'wide' || category === 'ultraWide';
}

export default function CommunityPostCard({
  post,
  index = 0,
  canManage = false,
  moderationBusy = false,
  onDelete,
  onHide,
  onOpenPost,
}: CommunityPostCardProps) {
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.max(0, Number(post.likesCount || 0)));
  const [likePending, setLikePending] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [showLikeBurst, setShowLikeBurst] = useState(false);
  const likeBurstTimerRef = useRef<number | null>(null);
  const { toast } = useToast();
  const excerpt = getCommunityPostPreviewText(post, 140, '暂无摘要');
  const [previewState, setPreviewState] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [aspectCat, setAspectCat] = useState<Record<string, string>>({});
  const [imageAspectMap, setImageAspectMap] = useState<Record<string, string>>({});
  const touchStartX = useRef<number | null>(null);

  const allImages = post.previewImages?.filter(Boolean) || (post.imageUrl ? [post.imageUrl] : []);
  const relatedApp = post.relatedApp;
  const relatedAppHref = relatedApp?.pkg ? `/app/${relatedApp.pkg}` : undefined;
  const relatedAppPrimaryTag =
    relatedApp?.regionTag || relatedApp?.tags?.[0] || (relatedApp?.pkg ? '国际服' : '');
  const postId = String(post.id || '').trim();
  const postHref = postId ? `/community/post/${encodeURIComponent(postId)}` : '/community';
  const handleOpenPost = () => {
    if (!postId) return;
    onOpenPost?.(postId);
  };

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

    const cacheKey = buildLikeStatusCacheKey(postId, token);
    const cachedLiked = LIKE_STATUS_CACHE.get(cacheKey);
    if (typeof cachedLiked === 'boolean') {
      setLiked(cachedLiked);
      return () => {
        cancelled = true;
      };
    }

    const inFlightRequest = LIKE_STATUS_INFLIGHT.get(cacheKey);
    if (inFlightRequest) {
      void inFlightRequest.then((resolvedLiked) => {
        if (cancelled || resolvedLiked === null) return;
        setLiked(resolvedLiked);
      });
      return () => {
        cancelled = true;
      };
    }

    const request = (async (): Promise<boolean | null> => {
      try {
        const res = await trackedApiFetch(`/content/${encodeURIComponent(postId)}/like-status`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.code !== 0) return null;
        return Boolean(json?.data?.liked);
      } catch {
        return null;
      }
    })();

    LIKE_STATUS_INFLIGHT.set(cacheKey, request);
    void request.then((resolvedLiked) => {
      LIKE_STATUS_INFLIGHT.delete(cacheKey);
      if (resolvedLiked === null) return;
      setLikeStatusCache(cacheKey, resolvedLiked);
      if (!cancelled) {
        setLiked(resolvedLiked);
      }
    });

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

  useEffect(() => {
    if (!previewState) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewState(null);
      if (event.key === 'ArrowLeft') setPreviewState((prev) =>
        prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null,
      );
      if (event.key === 'ArrowRight') setPreviewState((prev) =>
        prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null,
      );
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewState]);

  useEffect(() => {
    if (!previewState || typeof document === 'undefined') return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [previewState]);

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
    handleOpenPost();
    router.push(`${postHref}#comments`);
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
    const cacheKey = buildLikeStatusCacheKey(postId, token);

    setLiked(nextLiked);
    setLikeCount(nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    setLikeStatusCache(cacheKey, nextLiked);
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
      setLikeStatusCache(cacheKey, serverLiked);
      setLikeCount(Number.isFinite(serverCount) ? Math.max(0, serverCount) : Math.max(0, prevCount));
    } catch {
      setLiked(prevLiked);
      setLikeStatusCache(cacheKey, prevLiked);
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
                <Link href={postHref} onClick={handleOpenPost} onAuxClick={handleOpenPost}>查看详情</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleCopyPostId()}>复制 ID</DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={moderationBusy}
                    onClick={() => onHide?.(post)}
                  >
                    隐藏
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={moderationBusy}
                    onClick={() => onDelete?.(post)}
                    className="text-red-600 focus:text-red-600"
                  >
                    删除
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {post.title && (
          <Link href={postHref} onClick={handleOpenPost} onAuxClick={handleOpenPost} className="block hover:text-primary transition-colors">
            <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary">{post.title}</h3>
          </Link>
        )}
        <Link href={postHref} onClick={handleOpenPost} onAuxClick={handleOpenPost} className="block min-w-0">
          <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3 hover:text-foreground transition-colors">
            {excerpt}
          </p>
        </Link>
        {allImages.length > 0 && (
          <div className={cn(
            'mr-auto',
            allImages.length === 1
              ? (aspectCat[post.id] === 'ultraWide' || aspectCat[post.id] === 'wide' ? 'max-w-[420px]' : 'max-w-[560px]')
              : 'max-w-[560px]',
          )}>
            {(() => {
              const isSingle = allImages.length === 1;
              const firstImageCategory = imageAspectMap[`${post.id}-0`] || null;
              const useFeaturedThreeLayout = allImages.length === 3 && isWideCategory(firstImageCategory);
              const multiLayout = isSingle ? null : resolveMultiImageLayout(
                allImages.length,
                (idx) => imageAspectMap[`${post.id}-${idx}`] || null,
              );
              const visibleImages = useFeaturedThreeLayout ? allImages.slice(0, 1) : allImages.slice(0, 9);
              const featuredSideImages = useFeaturedThreeLayout ? allImages.slice(1, 3) : [];
              return (
                <div
                  className={cn(
                    useFeaturedThreeLayout
                      ? 'flex flex-col gap-2'
                      : isSingle
                      ? cn('relative overflow-hidden rounded-lg bg-muted w-full',
                        aspectCat[post.id] === 'ultraWide' || aspectCat[post.id] === 'wide' ? 'aspect-video' :
                        aspectCat[post.id] === 'normal' ? 'aspect-[4/3]' :
                        aspectCat[post.id] === 'portrait' ? 'aspect-[3/4]' :
                        'aspect-[4/3]')
                      : cn('gap-2',
                        allImages.length === 3 ? 'grid grid-cols-2' :
                        allImages.length <= 4 ? 'grid grid-cols-2' :
                        'grid grid-cols-3 gap-1.5'),
                  )}
                >
                  {visibleImages.map((img, imageIndex) => {
                    const overflowCount = allImages.length - 9;
                    const isLastVisible = imageIndex === 8 && overflowCount > 0;
                    const key = `${post.id}-${imageIndex}`;
                    const cat = isSingle ? (aspectCat[post.id] || 'normal') : (imageAspectMap[key] || null);
                    const cell = isSingle ? null : multiLayout?.[imageIndex];
                    const aspectClass = isSingle ? '' : (
                      cell?.aspectClass || 'aspect-[4/3]'
                    );
                    const spanClass = cell?.rowSpan ? 'row-span-2' : '';
                    const orderClass = cell?.orderFirst ? 'order-first' : '';
                    const isFeaturedHero = useFeaturedThreeLayout && imageIndex === 0;
                    return isSingle ? (
                      <Link
                        key={`${post.id}-img-${imageIndex}`}
                        href={postHref}
                        onClick={handleOpenPost}
                        onAuxClick={handleOpenPost}
                        className="absolute inset-0 block"
                      >
                        <Image
                          src={img}
                          alt={post.title || 'Post image'}
                          fill
                          className="object-cover"
                          data-ai-hint={post.imageAiHint || 'community post image'}
                          priority={post.id === '0'}
                          loading="eager"
                          onLoad={(event) => {
                            const imgEl = event.currentTarget;
                            const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
                            if (!Number.isFinite(ratio)) return;
                            const c = ratio >= 1.9 ? 'ultraWide' : ratio >= 1.45 ? 'wide' : ratio >= 0.9 ? 'normal' : 'portrait';
                            setAspectCat(prev => prev[post.id] === c ? prev : { ...prev, [post.id]: c });
                          }}
                        />
                      </Link>
                    ) : (
                      <button
                        key={`${post.id}-img-${imageIndex}`}
                        type="button"
                        onClick={() => setPreviewState({ images: allImages, index: imageIndex })}
                        className={cn(
                          'relative overflow-hidden rounded-lg bg-muted transition-[filter] hover:brightness-[0.98]',
                          isFeaturedHero ? 'aspect-video w-full' : aspectClass,
                          spanClass,
                          orderClass,
                        )}
                      >
                        <Image
                          src={img}
                          alt={post.title || '图片'}
                          fill
                          className="object-cover"
                          sizes="220px"
                          onLoad={(event) => {
                            const imgEl = event.currentTarget;
                            const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
                            if (!Number.isFinite(ratio)) return;
                            const c = ratio >= 1.9 ? 'ultraWide' : ratio >= 1.45 ? 'wide' : ratio >= 0.9 ? 'normal' : 'portrait';
                            setImageAspectMap(prev => prev[key] === c ? prev : { ...prev, [key]: c });
                          }}
                        />
                        {isLastVisible && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                            +{overflowCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {useFeaturedThreeLayout ? (
                    <div className="grid grid-cols-2 gap-2">
                      {featuredSideImages.map((img, sideIndex) => {
                        const imageIndex = sideIndex + 1;
                        const key = `${post.id}-${imageIndex}`;
                        return (
                          <button
                            key={`${post.id}-img-featured-${imageIndex}`}
                            type="button"
                            onClick={() => setPreviewState({ images: allImages, index: imageIndex })}
                            className="relative aspect-square overflow-hidden rounded-lg bg-muted transition-[filter] hover:brightness-[0.98]"
                          >
                            <Image
                              src={img}
                              alt={post.title || '图片'}
                              fill
                              className="object-cover"
                              sizes="220px"
                              onLoad={(event) => {
                                const imgEl = event.currentTarget;
                                const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
                                if (!Number.isFinite(ratio)) return;
                                const c = ratio >= 1.9 ? 'ultraWide' : ratio >= 1.45 ? 'wide' : ratio >= 0.9 ? 'normal' : 'portrait';
                                setImageAspectMap(prev => prev[key] === c ? prev : { ...prev, [key]: c });
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
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
      {previewState && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-3"
          onClick={() => setPreviewState(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            onClick={() => setPreviewState(null)}
            aria-label="关闭预览"
          >
            <X className="h-5 w-5" />
          </button>
          {previewState.images.length > 1 && (
            <button
              type="button"
              className="absolute left-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewState((prev) =>
                  prev
                    ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }
                    : null,
                );
              }}
              aria-label="上一张"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div
            className="relative h-[72vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => { touchStartX.current = e.clientX; }}
            onPointerUp={(e) => {
              if (touchStartX.current === null || previewState.images.length <= 1) return;
              const delta = e.clientX - touchStartX.current;
              if (delta > 40) setPreviewState((prev) =>
                prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null,
              );
              if (delta < -40) setPreviewState((prev) =>
                prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null,
              );
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
          {previewState.images.length > 1 && (
            <button
              type="button"
              className="absolute right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewState((prev) =>
                  prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null,
                );
              }}
              aria-label="下一张"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="absolute bottom-4 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
            {previewState.index + 1} / {previewState.images.length}
          </div>
        </div>,
        document.body,
      ) : null}
    </Card>
  );
}
