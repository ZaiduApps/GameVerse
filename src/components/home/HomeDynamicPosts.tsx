'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, Heart, MessageCircle, MoreHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { trackedApiFetch } from '@/lib/api';
import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { ApiDynamicPost } from '@/types';

const SITE_BASE_URL = 'https://apks.cc';

interface HomeDynamicPostsProps {
  posts: ApiDynamicPost[];
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '刚刚';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '刚刚';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${dayNum} ${hour}:${minute}`;
}

function normalizeComparableText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '')
    .replace(/[，。！？、；：,.!?;:'"“”‘’（）()【】\[\]《》<>~`|/\\_-]+/g, '');
}

function isDuplicateText(text: string, base: string): boolean {
  const normalizedText = normalizeComparableText(text);
  const normalizedBase = normalizeComparableText(base);
  if (!normalizedText || !normalizedBase) return false;
  return (
    normalizedText === normalizedBase ||
    normalizedText.startsWith(normalizedBase) ||
    normalizedBase.startsWith(normalizedText)
  );
}

function isMeaningfulTitle(value?: string): boolean {
  const title = String(value || '').trim();
  if (title.length < 6) return false;
  return normalizeComparableText(title).length >= 6;
}

function extractHashtags(post: ApiDynamicPost): string[] {
  const text = `${post.summary || ''}\n${post.content || ''}\n${post.body || ''}`;
  const matches = text.match(/#[^#\s]{1,24}/g) || [];
  return Array.from(new Set(matches)).slice(0, 6);
}

function extractAllImages(post: ApiDynamicPost): string[] {
  if (Array.isArray(post.preview_images) && post.preview_images.length > 0) {
    return post.preview_images.slice(0, 9);
  }

  const candidates: string[] = [];

  const push = (value: unknown) => {
    if (typeof value !== 'string') return;
    const normalized = normalizeImageUrl(value);
    if (!normalized) return;
    if (/example\.com|placehold\.co|favicon\.ico/i.test(normalized)) return;
    candidates.push(normalized);
  };

  push(post.display_cover);
  push(post.cover);
  push(post.image_url);
  push(post.imageUrl);

  const mediaUrls = post.media_urls;
  if (Array.isArray(mediaUrls)) {
    mediaUrls.forEach((item) => {
      if (typeof item === 'string') {
        push(item);
      }
    });
  }

  const images = post.images;
  if (Array.isArray(images)) {
    images.forEach((item) => {
      if (typeof item === 'string') {
        push(item);
      } else if (item && typeof item === 'object' && 'url' in item) {
        push((item as { url: string }).url);
      }
    });
  }

  const rawContent = String(post.content || post.body || '');
  const markdownImages = rawContent.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/gi);
  for (const match of markdownImages) {
    if (match?.[1]) push(match[1]);
  }
  const htmlImages = rawContent.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
  for (const match of htmlImages) {
    if (match?.[1]) push(match[1]);
  }

  return Array.from(new Set(candidates)).slice(0, 9);
}

function normalizeImageUrl(url: string): string | null {
  const raw = String(url || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/')) return `${SITE_BASE_URL}${raw}`;
  return null;
}

function extractFirstImage(post: ApiDynamicPost): string | null {
  const candidates: string[] = [];

  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      candidates.push(value.trim());
    }
  };

  push(post.display_cover);
  push(post.cover);
  push(post.image_url);
  push(post.imageUrl);

  const mediaUrls = post.media_urls;
  if (Array.isArray(mediaUrls)) {
    for (const item of mediaUrls) {
      if (typeof item === 'string') {
        candidates.push(item.trim());
      }
    }
  }

  const images = post.images;
  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === 'string') {
        candidates.push(item.trim());
      } else if (item && typeof item === 'object' && 'url' in item) {
        const url = String((item as { url: string }).url || '').trim();
        if (url) candidates.push(url);
      }
    }
  }

  const rawContent = String(post.content || post.body || post.summary || '');
  const markdownMatch = rawContent.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) candidates.push(markdownMatch[1]);

  const htmlMatch = rawContent.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) candidates.push(htmlMatch[1]);

  for (const raw of candidates) {
    const normalized = normalizeImageUrl(raw);
    if (normalized && !/example\.com|placehold\.co|favicon\.ico/i.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

function formatCompactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 10000) {
    const scaled = value / 10000;
    return `${scaled >= 10 ? scaled.toFixed(0) : scaled.toFixed(1)}w`;
  }
  return String(value);
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

export default function HomeDynamicPosts({ posts }: HomeDynamicPostsProps) {
  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likePendingMap, setLikePendingMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    posts.forEach((post) => {
      if (post._id) initial[post._id] = Number(post.like_count || 0);
    });
    return initial;
  });

  const postImagesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    posts.forEach((post) => {
      if (!post._id) return;
      const images = extractAllImages(post);
      if (images.length > 0) map[post._id] = images;
    });
    return map;
  }, [posts]);

  const [previewState, setPreviewState] = useState<{
    postId: string;
    index: number;
  } | null>(null);
  const [aspectCategories, setAspectCategories] = useState<Record<string, string>>({});
  const [imageAspectMap, setImageAspectMap] = useState<Record<string, string>>({});
  const touchStartX = useRef<number | null>(null);

  const previewImages = previewState ? (postImagesMap[previewState.postId] || []) : [];
  const previewCurrent =
    previewState && previewImages.length > 0
      ? previewImages[Math.min(Math.max(previewState.index, 0), previewImages.length - 1)]
      : '';

  const closePreview = () => setPreviewState(null);
  const prevPreview = () => {
    if (!previewState || previewImages.length === 0) return;
    setPreviewState({
      ...previewState,
      index: (previewState.index - 1 + previewImages.length) % previewImages.length,
    });
  };
  const nextPreview = () => {
    if (!previewState || previewImages.length === 0) return;
    setPreviewState({
      ...previewState,
      index: (previewState.index + 1) % previewImages.length,
    });
  };

  useEffect(() => {
    if (!previewState) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePreview();
      if (event.key === 'ArrowLeft') prevPreview();
      if (event.key === 'ArrowRight') nextPreview();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewState, previewImages.length]);

  const handleLike = async (postId: string) => {
    if (likePendingMap[postId]) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞。',
        variant: 'destructive',
      });
      return;
    }

    const wasLiked = Boolean(likedMap[postId]);
    const previousCount = likeCountMap[postId] ?? 0;
    const nextLiked = !wasLiked;

    setLikedMap((prev) => ({ ...prev, [postId]: nextLiked }));
    setLikeCountMap((prev) => ({
      ...prev,
      [postId]: nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1),
    }));
    setLikePendingMap((prev) => ({ ...prev, [postId]: true }));

    try {
      const res = await trackedApiFetch(`/content/${postId}/like`, {
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
      setLikedMap((prev) => ({ ...prev, [postId]: serverLiked }));
      setLikeCountMap((prev) => ({
        ...prev,
        [postId]: Number.isFinite(serverCount) ? serverCount : prev[postId] ?? 0,
      }));
    } catch {
      setLikedMap((prev) => ({ ...prev, [postId]: wasLiked }));
      setLikeCountMap((prev) => ({ ...prev, [postId]: previousCount }));
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setLikePendingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (posts.length === 0) return null;

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white dark:border-[#2a3442] dark:bg-[#111824]">
      {posts.map((post, index) => {
        const postId = post._id || `dynamic-${index}`;
        const images = postImagesMap[postId] || [];
        const cover = images[0] || extractFirstImage(post);
        const likeCount = likeCountMap[postId] ?? Number(post.like_count || 0);
        const liked = Boolean(likedMap[postId]);
        const viewCount = Number(post.view_count || 0) || likeCount + Number(post.comment_count || 0);
        const previewText = getCommunityPostPreviewText(post, 520, '分享了一条动态');
        const hashtags = extractHashtags(post);
        const titleText = String(post.title || '').trim();
        const hasMeaningfulTitle = isMeaningfulTitle(titleText);

        const appHref = post.app_info?.pkg
          ? `/app/${encodeURIComponent(post.app_info.pkg)}`
          : post.app_id
            ? `/app/${encodeURIComponent(post.app_id)}`
            : null;

        return (
          <article
            key={postId}
            className={cn(
              'px-4 py-4 transition-colors hover:bg-[#fafbfd] dark:hover:bg-[#162132] sm:px-5 sm:py-5',
              index !== posts.length - 1 && 'border-b border-[#eef1f4] dark:border-[#223043]',
            )}
          >
            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-[#eff2f5] dark:border-[#2a3442]">
                  <Image
                    src={post.author_avatar || '/favicon.ico'}
                    alt={post.author_name || '用户'}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[#1f2329] dark:text-[#edf2fb]">{post.author_name || '匿名用户'}</p>
                  <p className="mt-0.5 text-[12px] text-[#98a2b3] dark:text-[#7f8da3]">{formatRelativeTime(post.last_commented_at || post.publish_at)}</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#b4bcc8] transition-colors hover:bg-[#f3f4f7] hover:text-[#8a93a0] dark:text-[#7f8da3] dark:hover:bg-[#223043] dark:hover:text-[#a9b7ca]"
                aria-label="更多操作"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <Link href={`/community/post/${postId}`} className="block">
              {hasMeaningfulTitle ? <p className="line-clamp-2 text-[16px] font-semibold leading-[1.45] text-[#2a3038] dark:text-[#edf2fb]">{titleText}</p> : null}
              <p
                className={cn(
                  'text-[14px] leading-[1.62] text-[#5a6270] dark:text-[#9ca6b8] sm:text-[15px] sm:line-clamp-8',
                  hasMeaningfulTitle ? 'mt-1 line-clamp-6' : 'line-clamp-8',
                )}
              >
                {previewText}
              </p>
              {hashtags.length > 0 ? (
                <p className="mt-2 line-clamp-1 text-[12px] text-[#3578e5] dark:text-[#7fc1ff]">
                  {hashtags.join(' ')}
                </p>
              ) : null}
              <span className="mt-1.5 inline-block text-[12px] text-[#9aa3af] dark:text-[#7f8da3]">全文</span>
            </Link>

            {images.length > 0 && (
              <div className={cn(
                'mt-3 mr-auto',
                images.length === 1 && (aspectCategories[postId] === 'ultraWide' || aspectCategories[postId] === 'wide') ? 'max-w-[420px]' : 'max-w-[560px]',
              )}>
                {(() => {
                  const isSingle = images.length === 1;
                  const firstImageCategory = imageAspectMap[`${postId}-0`] || null;
                  const useFeaturedThreeLayout = images.length === 3 && isWideCategory(firstImageCategory);
                  const multiLayout = isSingle ? null : resolveMultiImageLayout(
                    images.length,
                    (idx) => imageAspectMap[`${postId}-${idx}`] || null,
                  );
                  const visibleImages = useFeaturedThreeLayout ? images.slice(0, 1) : images.slice(0, 9);
                  const featuredSideImages = useFeaturedThreeLayout ? images.slice(1, 3) : [];
                  return (
                    <div className={cn(
                      useFeaturedThreeLayout ? 'flex flex-col gap-2' :
                      isSingle ? 'grid grid-cols-1 gap-2' :
                      images.length === 3 ? 'grid grid-cols-2 gap-2' :
                      images.length <= 4 ? 'grid grid-cols-2 gap-2' :
                      'grid grid-cols-3 gap-1.5',
                    )}>
                      {visibleImages.map((img, imageIndex) => {
                        const overflowCount = images.length - 9;
                        const isLastVisible = imageIndex === 8 && overflowCount > 0;
                        const key = `${postId}-${imageIndex}`;
                        const cat = isSingle ? (aspectCategories[postId] || 'normal') : (imageAspectMap[key] || null);
                        const cell = multiLayout?.[imageIndex];
                        const aspectClass = isSingle ? (
                          cat === 'ultraWide' || cat === 'wide' ? 'aspect-video' :
                          cat === 'normal' ? 'aspect-[4/3]' :
                          cat === 'portrait' ? 'aspect-[3/4]' :
                          'aspect-[4/3]'
                        ) : (
                          cell?.aspectClass || 'aspect-[4/3]'
                        );
                        const spanClass = cell?.rowSpan ? 'row-span-2' : '';
                        const orderClass = cell?.orderFirst ? 'order-first' : '';
                        const isFeaturedHero = useFeaturedThreeLayout && imageIndex === 0;
                        return (
                          <button
                            key={`${postId}-img-${imageIndex}`}
                            type="button"
                            onClick={() => setPreviewState({ postId, index: imageIndex })}
                            className={cn(
                              'relative overflow-hidden rounded-lg text-left transition-[filter] hover:brightness-[0.98]',
                              isFeaturedHero ? 'aspect-video w-full' :
                              isSingle ? `${aspectClass} w-full` : aspectClass,
                              spanClass,
                              orderClass,
                            )}
                          >
                          <Image
                            src={img || cover || '/favicon.ico'}
                            alt={post.title || post.summary || '动态图片'}
                            fill
                            className="object-cover"
                            sizes={isSingle ? '(max-width: 640px) 100vw, 560px' : '220px'}
                            onLoad={(event) => {
                              const imgEl = event.currentTarget;
                              const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
                              if (!Number.isFinite(ratio)) return;
                              const c = ratio >= 1.9 ? 'ultraWide' : ratio >= 1.45 ? 'wide' : ratio >= 0.9 ? 'normal' : 'portrait';
                              if (isSingle) {
                                setAspectCategories(prev => prev[postId] === c ? prev : { ...prev, [postId]: c });
                                } else {
                                  setImageAspectMap(prev => prev[key] === c ? prev : { ...prev, [key]: c });
                                }
                              }}
                            />
                            {isLastVisible ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                                +{overflowCount}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                      {useFeaturedThreeLayout ? (
                        <div className="grid grid-cols-2 gap-2">
                          {featuredSideImages.map((img, sideIndex) => {
                            const imageIndex = sideIndex + 1;
                            const key = `${postId}-${imageIndex}`;
                            return (
                              <button
                                key={`${postId}-img-featured-${imageIndex}`}
                                type="button"
                                onClick={() => setPreviewState({ postId, index: imageIndex })}
                                className="relative aspect-square overflow-hidden rounded-lg text-left transition-[filter] hover:brightness-[0.98]"
                              >
                                <Image
                                  src={img || cover || '/favicon.ico'}
                                  alt={post.title || post.summary || '动态图片'}
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

            {post.app_info?.name && appHref ? (
              <Link
                href={appHref}
                className="mt-3 mr-auto inline-flex max-w-[420px] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[#f7f9fc] dark:hover:bg-[#223043]"
              >
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                  {post.app_info.icon ? (
                    <Image
                      src={post.app_info.icon}
                      alt={post.app_info.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#e6e9ed] dark:bg-[#1a2433]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#2c323a] dark:text-[#edf2fb]">{post.app_info.name}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#b0b7c3] dark:text-[#7f8da3]" />
              </Link>
            ) : null}

            <div className="mt-3 flex items-center justify-end gap-5 border-t border-[#f3f4f6] pt-2 text-[12px] font-normal text-[#98a2b3] dark:border-[#223043] dark:text-[#7f8da3]">
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1 transition-colors hover:text-[#6b7789] dark:hover:text-[#a9b7ca] disabled:cursor-not-allowed disabled:opacity-60',
                  liked && 'text-[#64748b] dark:text-[#7fc1ff]',
                )}
                onClick={() => handleLike(postId)}
                disabled={Boolean(likePendingMap[postId])}
                aria-label="点赞"
                aria-pressed={liked}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-[#64748b] dark:fill-[#7fc1ff]')} />
                <span>{formatCompactCount(likeCount)}</span>
              </button>
              <Link
                href={`/community/post/${postId}#comments`}
                className="inline-flex items-center gap-1 transition-colors hover:text-[#6b7789] dark:hover:text-[#a9b7ca]"
                aria-label="评论"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{formatCompactCount(Number(post.comment_count || 0))}</span>
              </Link>
              <span className="inline-flex items-center gap-1" aria-label="浏览量">
                <Eye className="h-4 w-4" />
                <span>{formatCompactCount(viewCount)}</span>
              </span>
            </div>
          </article>
        );
      })}
    </div>
    {previewState && previewImages.length > 0 && previewCurrent ? (
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 px-3"
        onClick={closePreview}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
          onClick={(event) => {
            event.stopPropagation();
            closePreview();
          }}
          aria-label="关闭预览"
        >
          <X className="h-5 w-5" />
        </button>
        {previewImages.length > 1 ? (
          <button
            type="button"
            className="absolute left-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              prevPreview();
            }}
            aria-label="上一张"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div
          className="relative h-[72vh] w-full max-w-5xl"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => {
            touchStartX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (touchStartX.current === null || previewImages.length <= 1) return;
            const delta = event.clientX - touchStartX.current;
            if (delta > 40) prevPreview();
            if (delta < -40) nextPreview();
            touchStartX.current = null;
          }}
        >
          <Image
            src={previewCurrent}
            alt="预览图片"
            fill
            className="object-contain"
            sizes="95vw"
          />
        </div>
        {previewImages.length > 1 ? (
          <button
            type="button"
            className="absolute right-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              nextPreview();
            }}
            aria-label="下一张"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : null}
        <div className="absolute bottom-4 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
          {previewState.index + 1} / {previewImages.length}
        </div>
      </div>
    ) : null}
    </>
  );
}
