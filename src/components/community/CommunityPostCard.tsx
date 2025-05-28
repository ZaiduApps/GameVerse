
'use client';

import type { CommunityPost } from '@/types';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, ThumbsUp, MoreHorizontal, Bookmark, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommunityPostCardProps {
  post: CommunityPost;
}

export default function CommunityPostCard({ post }: CommunityPostCardProps) {
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
        {post.title && <h3 className="text-lg font-semibold text-foreground leading-tight">{post.title}</h3>}
        <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1"> {/* Adjusted pt-1 for spacing */}
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">{tag}</Badge>
            ))}
          </div>
        )}
        {post.imageUrl && (
          <div className="rounded-lg overflow-hidden aspect-video relative bg-muted mt-3">
            <Image src={post.imageUrl} alt={post.title || "Post image"} fill className="object-cover" data-ai-hint={post.imageAiHint || "community post image"} />
          </div>
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
