
'use client';

import type { CommunityPost } from '@/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { MessageSquare, ThumbsUp, MoreHorizontal, Bookmark, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link'; // Added Link
import { cn, renderMarkdown } from '@/lib/utils';
import { useState } from 'react';

interface CommunityPostCardProps {
  post: CommunityPost;
  index?: number;
}

export default function CommunityPostCard({ post, index = 0 }: CommunityPostCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.user.avatarUrl} alt={post.user.name} data-ai-hint={post.user.dataAiHint || "user avatar"} />
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreHorizontal size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-3">
        {post.title && (
          <Link href={`/community/post/${post.id}`} className="block hover:text-primary transition-colors">
            <h3 className="text-lg font-semibold text-foreground leading-tight group-hover:text-primary">{post.title}</h3>
          </Link>
        )}
        <Link href={`/community/post/${post.id}`} className="block">
          <article
            className="text-sm text-foreground/90 leading-relaxed line-clamp-5 hover:text-foreground prose prose-sm max-w-none"
            dangerouslySetInnerHTML={renderMarkdown(post.content)}
          />
        </Link>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {post.tags.map((tag, index) => (
              <Badge key={`${post.id}-tag-${index}-${tag}`} variant="outline" className="text-xs font-normal">{tag}</Badge>
            ))}
          </div>
        )}
        {post.imageUrl && (
          <Link href={`/community/post/${post.id}`} className="block mt-3 rounded-lg overflow-hidden aspect-video relative bg-muted">
            {!isImageLoaded && !isImageError && (
              <div className="absolute inset-0 animate-pulse bg-muted/70" />
            )}
            {!isImageError ? (
              <Image
                src={post.imageUrl}
                alt={post.title || "Post image"}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  isImageLoaded ? "opacity-100" : "opacity-0",
                )}
                data-ai-hint={post.imageAiHint || "community post image"}
                priority={index === 0}
                loading={index === 0 ? 'eager' : 'lazy'}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setIsImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                图片加载失败
              </div>
            )}
          </Link>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex items-center justify-start gap-2 sm:gap-4 border-t">
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
          <Bookmark size={18} className="mr-1.5" /> 收藏
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
          <MessageSquare size={18} className="mr-1.5" /> {post.commentsCount}
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2">
          <ThumbsUp size={18} className="mr-1.5" /> {post.likesCount}
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 ml-auto">
          <Share2 size={18} className="mr-1.5" /> 分享
        </Button>
      </CardFooter>
    </Card>
  );
}
