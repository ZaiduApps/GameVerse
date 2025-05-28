
'use client';

import type { NewsArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, UserCircle, Tag, ThumbsUp, Eye, Share2, MessageCircle as CommentIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useEffect } from 'react';
// Note: MOCK_NEWS_ARTICLES is not directly used here anymore for the main article,
// but kept for potential related articles or if needed later.
// For comments, we use a local mock.

interface MockComment {
  id: string;
  username: string;
  avatarFallback: string;
  avatarUrl?: string;
  dataAiHint?: string;
  timestamp: string;
  text: string;
}

const initialMockComments: MockComment[] = [
  { id: 'c1', username: '资讯爱好者', avatarFallback: 'ZX', timestamp: '1 小时前', text: '这篇文章分析得很到位，学到了很多！' },
  { id: 'c2', username: '游戏小萌新', avatarFallback: 'XM', avatarUrl: 'https://placehold.co/40x40.png?text=XM', dataAiHint: "avatar user", timestamp: '3 小时前', text: '感谢分享，期待更多此类内容。' },
];

interface NewsArticleViewProps {
  article: NewsArticle;
}

export default function NewsArticleView({ article }: NewsArticleViewProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100) + 5); // Random initial likes
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 1000) + 50); // Random initial views
  const [mockComments, setMockComments] = useState<MockComment[]>(initialMockComments);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    // Simulate fetching initial like state or view count if needed
    // For now, random numbers are generated on each load for demo purposes.
    // If these were real, they'd likely come from the article prop or an API call.
    setLikeCount(Math.floor(Math.random() * 100) + 5);
    setViewCount(Math.floor(Math.random() * 1000) + 50);
  }, [article.id]); // Rerun if article ID changes, to reset mock counts for demo

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
  };

  const handleShare = () => {
    alert('分享功能模拟：链接已复制到剪贴板（假装的）。');
  };

  const handleCommentSubmit = () => {
    if (newComment.trim() === '') return;
    const newCommentObj: MockComment = {
      id: `c${mockComments.length + 1}`,
      username: '当前用户', // Or a dynamic username if authentication existed
      avatarFallback: '我',
      avatarUrl: 'https://placehold.co/40x40.png?text=ME',
      dataAiHint: "avatar user",
      timestamp: '刚刚',
      text: newComment,
    };
    setMockComments(prevComments => [newCommentObj, ...prevComments]);
    setNewComment('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in">
      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-8">
          <Badge variant="outline" className="mb-3">{article.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-1.5" />
              <span>发布于 {article.date}</span>
            </div>
            <div className="flex items-center">
              <UserCircle size={16} className="mr-1.5" />
              <span>作者：{article.author}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 py-3 my-4 border-y">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-muted-foreground hover:text-primary btn-interactive">
              <ThumbsUp size={18} className={`mr-2 ${isLiked ? 'fill-primary text-primary' : ''}`} />
              {likeCount}
            </Button>
            <div className="flex items-center text-muted-foreground">
              <Eye size={18} className="mr-2" />
              {viewCount} 次浏览
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center text-muted-foreground hover:text-primary btn-interactive">
              <Share2 size={18} className="mr-2" />
              分享
            </Button>
          </div>

          <article className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
          
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                <Tag size={16} className="mr-2" />
                相关标签:
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link key={tag} href={`/news?tag=${encodeURIComponent(tag.toLowerCase())}`}>
                    <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer">{tag}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CommentIcon size={24} className="mr-2 text-primary" />
            玩家评论 ({mockComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Input Area */}
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src="https://placehold.co/40x40.png?text=ME" alt="当前用户" data-ai-hint="avatar user" />
              <AvatarFallback>我</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Textarea
                placeholder="发表你的看法..."
                rows={3}
                className="text-sm"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleCommentSubmit} className="btn-interactive">发表评论</Button>
              </div>
            </div>
          </div>

          {/* Display Existing Comments */}
          <div className="space-y-4">
            {mockComments.map((comment) => (
              <Card key={comment.id} className="shadow-sm bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      {comment.avatarUrl ? (
                         <AvatarImage src={comment.avatarUrl} alt={comment.username} data-ai-hint={comment.dataAiHint || "avatar user"} />
                      ) : (
                         <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.avatarFallback}`} alt={comment.username} data-ai-hint="avatar user" />
                      )}
                      <AvatarFallback>{comment.avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{comment.username}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {mockComments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无评论，快来发表第一条评论吧！</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

