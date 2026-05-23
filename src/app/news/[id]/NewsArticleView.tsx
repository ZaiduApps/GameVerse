'use client';

import type { NewsArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  MessageCircle as CommentIcon,
  Share2,
  ThumbsUp,
  UserCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { renderMarkdown } from '@/lib/utils';
import AppDownloadGuideDialog from '@/components/app-download-guide-dialog';

interface MockComment {
  id: string;
  username: string;
  avatarFallback: string;
  avatarUrl?: string;
  timestamp: string;
  text: string;
}

const initialMockComments: MockComment[] = [
  {
    id: 'c1',
    username: '资讯爱好者',
    avatarFallback: '资',
    timestamp: '1 小时前',
    text: '文章分析很有帮助。',
  },
  {
    id: 'c2',
    username: '游戏玩家',
    avatarFallback: '游',
    avatarUrl: '/favicon.ico',
    timestamp: '3 小时前',
    text: '感谢分享，期待更多内容。',
  },
];

interface NewsArticleViewProps {
  article: NewsArticle;
  relatedArticles: NewsArticle[];
  sourceLinks: string[];
  sourceLabel: string;
  relatedGameHref: string;
}

export default function NewsArticleView({ article, relatedArticles, sourceLinks, sourceLabel, relatedGameHref }: NewsArticleViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount ?? 0);
  const [viewCount, setViewCount] = useState(article.viewCount ?? 0);
  const [comments, setComments] = useState<MockComment[]>(initialMockComments);
  const [newComment, setNewComment] = useState('');
  const [appGuideOpen, setAppGuideOpen] = useState(false);

  useEffect(() => {
    setViewCount((prev) => prev + 1);
  }, [article.id]);

  function handleLike() {
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    toast({ title: isLiked ? '已取消点赞' : '点赞成功' });
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: '链接已复制' });
  }

  function handleCommentSubmit() {
    const text = newComment.trim();
    if (!text) {
      return;
    }

    setComments((prev) => [
      {
        id: `c${prev.length + 1}`,
        username: '当前用户',
        avatarFallback: '我',
        avatarUrl: '/favicon.ico',
        timestamp: '刚刚',
        text,
      },
      ...prev,
    ]);

    setNewComment('');
    toast({ title: '评论已提交' });
  }

  function handleMarkdownContainerClick(event: React.MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement | null;
    const appLinkEl = target?.closest('[data-app-link], [data-acbox-url]') as HTMLElement | null;
    if (!appLinkEl) return;

    event.preventDefault();
    setAppGuideOpen(true);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in py-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="self-start btn-interactive"
      >
        <ArrowLeft size={16} className="mr-2" />
        返回
      </Button>

      <Card className="shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">{article.category}</Badge>
            {article.isTop && <Badge variant="destructive">置顶</Badge>}
            {article.isRecommended && <Badge variant="secondary">推荐</Badge>}
          </div>

          <h1 className="mb-4 text-xl font-bold text-foreground md:text-2xl">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <UserCircle size={16} className="mr-1.5" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-1.5" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center">
              <span>{sourceLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          <Separator className="mb-6" />

          {article.excerpt ? (
            <div className="mb-6 rounded-xl border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              <strong className="mr-2 text-foreground">摘要：</strong>
              {article.excerpt}
            </div>
          ) : null}

          <div
            className="prose prose-sm max-w-none dark:prose-invert md:prose-base"
            onClick={handleMarkdownContainerClick}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">来源与延伸阅读</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{sourceLabel}</p>
                {sourceLinks.length > 0 ? (
                  sourceLinks.map((link) => (
                    <a key={link} href={link} target="_blank" rel="noopener noreferrer" className="block truncate text-primary hover:underline">
                      {link}
                    </a>
                  ))
                ) : (
                  <p>当前页面未附带外部来源链接，建议结合正文时间与标签继续查看站内相关文章。</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">相关游戏入口</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>如果你想继续查看与本文相关的游戏、版本更新或下载入口，可以前往游戏库继续筛选。</p>
                <Link href={relatedGameHref} className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  查看相关游戏
                </Link>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant={isLiked ? 'default' : 'outline'} size="sm" onClick={handleLike}>
              <ThumbsUp size={14} className="mr-1" />
              {likeCount}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 size={14} className="mr-1" />
              分享
            </Button>
            <div className="text-xs text-muted-foreground flex items-center ml-2">
              <Eye size={14} className="mr-1" />
              {viewCount}
            </div>
            <div className="text-xs text-muted-foreground flex items-center ml-2">
              <CommentIcon size={14} className="mr-1" />
              {comments.length}
            </div>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>评论区</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
          />
          <Button onClick={handleCommentSubmit}>发布评论</Button>
          <Separator />
          <div className="space-y-4">
            {comments.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.avatarUrl} alt={item.username} />
                  <AvatarFallback>{item.avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.username}</div>
                  <div className="text-xs text-muted-foreground">{item.timestamp}</div>
                  <p className="text-sm mt-1">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>相关文章</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {relatedArticles.length > 0 ? (
            relatedArticles.map((item) => (
              <Link key={item.id} href={`/community/post/${item.id}`} className="block rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.excerpt || '查看这篇相关资讯的完整内容。'}</p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂时没有可展示的相关文章。</p>
          )}
        </CardContent>
      </Card>

      <AppDownloadGuideDialog open={appGuideOpen} onOpenChange={setAppGuideOpen} />

      <div className="pt-2">
        <Link href="/community" className="text-sm text-primary hover:underline">
          返回资讯列表
        </Link>
      </div>
    </div>
  );
}
