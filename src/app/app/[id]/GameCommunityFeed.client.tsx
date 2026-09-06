'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, Users } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCompactCount, type CommunityFeedItem } from './game-detail-presenter';

interface GameCommunityFeedProps {
  gameName: string;
  latest: CommunityFeedItem[];
  hot: CommunityFeedItem[];
}

export default function GameCommunityFeed({ gameName, latest, hot }: GameCommunityFeedProps) {
  const [sort, setSort] = useState<'latest' | 'hot'>('latest');
  const posts = sort === 'hot' ? hot : latest;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="inline-flex items-center gap-2 text-base font-bold text-[#2c2f30] dark:text-foreground lg:text-lg">
          <MessageSquare className="h-5 w-5 text-[#005e9f]" />
          社区热议
        </h3>
        <div className="inline-flex rounded-full bg-white/80 p-1 dark:bg-card/80" aria-label="社区动态排序">
          {(['latest', 'hot'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              data-acbox-action={`game_detail_posts_sort_${value}`}
              data-acbox-label={gameName}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold transition-colors lg:px-4 lg:py-2 lg:text-sm',
                sort === value ? 'bg-[#b71211] text-white' : 'text-[#595c5d] dark:text-muted-foreground',
              )}
              onClick={() => setSort(value)}
            >
              {value === 'latest' ? '最新' : '热门'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid max-w-3xl grid-cols-1 gap-4 lg:gap-6">
        {posts.length > 0 ? posts.map((post) => (
          <Card
            key={`${sort}-${post.id}`}
            className="overflow-hidden rounded-2xl border border-[#abadae]/15 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-border/45 dark:bg-card/75"
          >
            <CardContent className="p-4 lg:p-5">
              <div className="mb-3 flex items-center gap-3 lg:mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.userAvatarUrl} alt={post.userName} />
                  <AvatarFallback>{post.userName.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{post.userName}</p>
                  <p className="text-[10px] text-[#757778] lg:text-xs">{post.timestamp}</p>
                </div>
              </div>
              {post.title ? <p className="mb-2 line-clamp-2 text-sm font-bold">{post.title}</p> : null}
              <p className="line-clamp-3 text-sm leading-relaxed text-[#595c5d] dark:text-muted-foreground">
                {post.excerpt}
              </p>
              {post.imageUrl ? (
                <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl">
                  <Image
                    src={post.imageUrl}
                    alt={post.title || `${gameName} 社区帖子配图`}
                    fill
                    sizes="(min-width: 1024px) 620px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="mt-4 flex items-center gap-5 text-xs text-[#595c5d] dark:text-muted-foreground lg:mt-5 lg:gap-6">
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4" />
                  {formatCompactCount(post.likesCount)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  {formatCompactCount(post.commentsCount)}
                </span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Users className="h-4 w-4" />
                  {formatCompactCount(post.viewsCount)}
                </span>
                <Link
                  href={`/community/post/${encodeURIComponent(post.id)}`}
                  className="ml-auto text-xs font-bold text-[#005e9f] hover:underline lg:text-sm"
                >
                  查看详情
                </Link>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="rounded-[1.75rem] border-[#abadae]/10 bg-white/85 dark:border-border/45 dark:bg-card/75">
            <CardContent className="p-5 text-sm text-[#595c5d] dark:text-muted-foreground lg:p-6">
              暂无关联社区动态。
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
