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
    avatarUrl: 'https://placehold.co/40x40.png?text=Y',
    timestamp: '3 小时前',
    text: '感谢分享，期待更多内容。',
  },
];

interface NewsArticleViewProps {
  article: NewsArticle;
}

export default function NewsArticleView({ article }: NewsArticleViewProps) {
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
        avatarUrl: 'https://placehold.co/40x40.png?text=ME',
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

      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="outline">{article.category}</Badge>
            {article.isTop && <Badge variant="destructive">置顶</Badge>}
            {article.isRecommended && <Badge variant="secondary">推荐</Badge>}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <UserCircle size={16} className="mr-1.5" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-1.5" />
              <span>{article.date}</span>
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

          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            onClick={handleMarkdownContainerClick}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
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

      <AppDownloadGuideDialog open={appGuideOpen} onOpenChange={setAppGuideOpen} />

      <div className="pt-2">
        <Link href="/news" className="text-sm text-primary hover:underline">
          返回资讯列表
        </Link>
      </div>
    </div>
  );
}
