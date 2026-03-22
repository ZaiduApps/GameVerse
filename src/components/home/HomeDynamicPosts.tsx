'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Heart, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { apiUrl, trackedApiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { ApiDynamicPost } from '@/types';

interface HomeDynamicPostsProps {
  posts: ApiDynamicPost[];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知时间';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '未知时间';
  return d.toLocaleDateString('zh-CN');
}

function extractFirstImage(post: ApiDynamicPost): string | null {
  if (post.cover && /^https?:\/\//i.test(post.cover)) return post.cover;

  const rawContent = String((post as any).content || (post as any).body || post.summary || '');
  const markdownMatch = rawContent.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];

  const htmlMatch = rawContent.match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) return htmlMatch[1];

  const mediaUrls = (post as any).media_urls;
  if (Array.isArray(mediaUrls)) {
    const first = mediaUrls.find((url) => typeof url === 'string' && /^https?:\/\//i.test(url));
    if (first) return first;
  }

  return null;
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

  const postImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    posts.forEach((post) => {
      if (!post._id) return;
      const cover = extractFirstImage(post);
      if (cover) map[post._id] = cover;
    });
    return map;
  }, [posts]);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3">
      {posts.map((post, index) => {
        const postId = post._id || `dynamic-${index}`;
        const cover = postImageMap[postId];
        const likeCount = likeCountMap[postId] ?? Number(post.like_count || 0);
        const liked = Boolean(likedMap[postId]);
        const viewCount = Number((post as any).view_count || 0) || likeCount + Number(post.comment_count || 0);
        const leadText = (post.title || post.summary || '').trim() || '点击查看完整内容';

        return (
          <article
            key={postId}
            className="group rounded-lg border border-border/60 bg-card px-3.5 py-3 md:px-4 md:py-3.5 transition-all duration-200 hover:border-primary/35 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
            style={{ animationDelay: `${0.45 + index * 0.05}s` }}
          >
            <div className="flex items-start gap-3">
              <Avatar className="mt-0.5 h-9 w-9 border border-border/60">
                <AvatarImage src={post.author_avatar || ''} alt={post.author_name || '用户'} />
                <AvatarFallback>{(post.author_name || '用').slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[12px]">
                  <p className="max-w-[45%] truncate text-sm font-semibold text-foreground">{post.author_name || '匿名用户'}</p>
                  <span className="text-muted-foreground">·</span>
                  <p className="text-muted-foreground">{formatDate(post.last_commented_at || post.publish_at)}</p>
                </div>

                <p className="mt-1.5 text-[13px] font-normal leading-relaxed text-foreground/85 line-clamp-2">
                  <Link href={`/community/post/${postId}`} className="hover:text-primary transition-colors">
                    {leadText}
                  </Link>
                </p>

                {cover && (
                  <Link href={`/community/post/${postId}`} className="mt-2 block">
                    <div className="relative h-24 w-full overflow-hidden rounded-md bg-muted/30 md:h-20">
                      <Image
                        src={cover}
                        alt={post.title || post.summary || '动态首图'}
                        fill
                        className="object-contain object-left"
                        data-ai-hint="community post"
                      />
                    </div>
                  </Link>
                )}

                <div className="mt-2.5 flex items-center gap-3 border-t border-border/35 pt-2 text-[11px] text-muted-foreground/80">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn('h-auto p-0 text-[11px] hover:text-primary', liked && 'text-primary')}
                    onClick={() => handleLike(postId)}
                    disabled={Boolean(likePendingMap[postId])}
                  >
                    <Heart className={cn('mr-1 h-3 w-3', liked && 'fill-primary')} />
                    {likeCount}
                  </Button>
                  <Link href={`/community/post/${postId}#comments`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                    <MessageCircle className="h-3 w-3" />
                    {post.comment_count || 0}
                  </Link>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {viewCount}
                  </span>
                  {post.app_info?.pkg && (
                    <div className="ml-auto inline-flex rotate-[-2deg]">
                      <div className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-md border border-white/35 px-2 py-1 shadow-sm">
                        {(post.app_info.icon || cover) && (
                          <>
                            <div className="absolute inset-0">
                              <Image
                                src={post.app_info.icon || cover || 'https://placehold.co/64x64.png'}
                                alt=""
                                fill
                                className="scale-150 object-cover blur-lg opacity-95 saturate-150"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-md dark:bg-black/40" />
                          </>
                        )}
                        {(post.app_info.icon || cover) && (
                          <div className="relative z-10 h-5 w-5 overflow-hidden rounded-sm border border-white/40 bg-black/20">
                            <Image
                              src={post.app_info.icon || cover || 'https://placehold.co/64x64.png'}
                              alt={post.app_info.name || post.app_info.pkg || '关联游戏'}
                              fill
                              className="object-cover"
                              data-ai-hint="game icon"
                            />
                          </div>
                        )}
                        <span className="relative z-10 max-w-[140px] truncate text-[11px] font-semibold text-white">
                          {post.app_info.name || post.app_info.pkg}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

