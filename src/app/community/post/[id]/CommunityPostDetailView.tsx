'use client';

import type { CommunityPost } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, Eye, MessageSquare, Send, Share2, ThumbsUp } from 'lucide-react';

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
  const [previewImage, setPreviewImage] = useState<{ url: string; alt?: string } | null>(null);
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

  const reloadComments = async () => {
    const latest = await getCommunityCommentThreads(post.id, 30);
    setComments(latest);
  };

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

  const handleMarkdownContainerClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;

    const imageEl = target?.closest('img') as HTMLImageElement | null;
    if (imageEl?.src) {
      event.preventDefault();
      setPreviewImage({
        url: imageEl.src,
        alt: imageEl.alt || post.title || '帖子图片',
      });
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
                  <div className="mt-2">
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
                        <div className="mt-1.5">
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

  return (
    <div className="mx-auto w-full max-w-[1680px] space-y-6 py-8 fade-in">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 self-start btn-interactive">
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
                      onClick={() => setPreviewImage({ url: post.imageUrl || '', alt: post.title || 'Post image' })}
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 ml-auto">
                  <Share2 size={18} className="mr-1.5" /> 分享
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="xl:hidden">{commentsCard}</div>
        </div>

        <aside className="hidden xl:block">{commentsCard}</aside>
      </div>

      {previewImage?.url && (
        <div className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[92vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
              <Button asChild type="button" variant="ghost" size="sm" className="bg-black/50 text-white hover:bg-black/70">
                <a href={previewImage.url} target="_blank" rel="noopener noreferrer" download>
                  下载图片
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="bg-black/40 text-white hover:bg-black/60"
                onClick={() => setPreviewImage(null)}
              >关闭</Button>
            </div>
            <Image
              src={previewImage.url}
              alt={previewImage.alt || '帖子图片'}
              width={1400}
              height={900}
              className="max-h-[92vh] w-auto rounded-md object-contain"
            />
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

