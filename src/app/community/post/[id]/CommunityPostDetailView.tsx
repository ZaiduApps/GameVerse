
'use client';

import type { CommunityPost } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ThumbsUp, MessageSquare, Share2, Bookmark, Send, Eye, CalendarDays, UserCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface PostComment {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
    dataAiHint?: string;
  };
  timestamp: string;
  text: string;
}

const initialMockComments: PostComment[] = [
  { 
    id: 'comment1', 
    user: { name: '评论家1号', avatarUrl: 'https://placehold.co/40x40.png?text=C1', dataAiHint: 'user avatar' }, 
    timestamp: '2小时前', 
    text: '这个帖子太棒了，说出了我的心声！' 
  },
  { 
    id: 'comment2', 
    user: { name: '路人甲', avatarUrl: 'https://placehold.co/40x40.png?text=LJ', dataAiHint: 'user avatar' }, 
    timestamp: '1小时前', 
    text: '楼主分析得很有道理，学习了。' 
  },
];

interface CommunityPostDetailViewProps {
  post: CommunityPost;
}

export default function CommunityPostDetailView({ post }: CommunityPostDetailViewProps) {
  const [comments, setComments] = useState<PostComment[]>(initialMockComments);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
    // In a real app, this would also trigger an API call
  };

  const handleCommentSubmit = () => {
    if (newComment.trim() === '') return;
    const newCommentObj: PostComment = {
      id: `comment${comments.length + 1}`,
      user: { name: '当前用户', avatarUrl: 'https://placehold.co/40x40.png?text=ME', dataAiHint: 'current user avatar' },
      timestamp: '刚刚',
      text: newComment,
    };
    setComments(prevComments => [newCommentObj, ...prevComments]);
    setNewComment('');
    // In a real app, this would also trigger an API call
  };
  
  // Simulate view count increment
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 200) + post.commentsCount + post.likesCount + 50);
  useEffect(() => {
    setViewCount(v => v + 1);
  }, []);


  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 fade-in">
      {/* Main Post Content */}
      <Card className="shadow-lg">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start space-x-3">
            <Avatar className="w-11 h-11">
              <AvatarImage src={post.user.avatarUrl} alt={post.user.name} data-ai-hint={post.user.dataAiHint || "user avatar"} />
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
          {post.title && <CardTitle className="text-xl md:text-2xl font-bold mt-3">{post.title}</CardTitle>}
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-3">
          <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
             {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {post.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
              ))}
            </div>
          )}

          {post.imageUrl && (
            <div className="rounded-lg overflow-hidden aspect-video relative bg-muted mt-4">
              <Image src={post.imageUrl} alt={post.title || "Post image"} fill className="object-contain" data-ai-hint={post.imageAiHint || "community post image detail"} />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-3 flex flex-col items-start space-y-3">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                    <Eye size={16} className="mr-1.5" /> {viewCount} 次浏览
                </div>
            </div>
          <div className="w-full flex items-center justify-start gap-2 sm:gap-3 border-t pt-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2" onClick={handleLike}>
              <ThumbsUp size={18} className={`mr-1.5 ${isLiked ? 'fill-primary text-primary' : ''}`} /> {likeCount}
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
              <MessageSquare size={18} className="mr-1.5" /> {comments.length}
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

      {/* Comments Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <MessageSquare size={20} className="mr-2 text-primary" />
            评论区 ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Input Area */}
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src="https://placehold.co/40x40.png?text=ME" alt="当前用户" data-ai-hint="current user avatar" />
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
                <Button onClick={handleCommentSubmit} className="btn-interactive" size="sm">
                  <Send size={16} className="mr-2" /> 发表评论
                </Button>
              </div>
            </div>
          </div>

          {/* Display Existing Comments */}
          <div className="space-y-4 pt-4 border-t">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3">
                <Avatar>
                  <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} data-ai-hint={comment.user.dataAiHint || "user avatar"} />
                  <AvatarFallback>{comment.user.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow bg-muted/30 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无评论，快来发表第一条评论吧！</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
