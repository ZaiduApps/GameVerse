'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Eye, MessageSquare, ThumbsUp } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { cn } from '@/lib/utils';
import GameDetailSection from './GameDetailSection';
import { formatCompactCount, type CommunityFeedItem } from './game-detail-presenter';

interface GameCommunityFeedProps {
  gameName: string;
  latest: CommunityFeedItem[];
  hot: CommunityFeedItem[];
}

const SORT_OPTIONS = [
  { value: 'latest', label: '最新' },
  { value: 'hot', label: '热门' },
] as const;

// 「最新/热门」切换控件：PC 端与「进入完整专区」同处标题行；移动端标题行被标题和链接占满，
// 单独占一行右对齐渲染，否则标题会被挤成两行。
function SortToggle({
  gameName,
  sort,
  onSortChange,
  className,
}: {
  gameName: string;
  sort: 'latest' | 'hot';
  onSortChange: (value: 'latest' | 'hot') => void;
  className?: string;
}) {
  return (
    <div
      className={cn('rounded-full bg-[#eff1f2]/80 p-0.5 dark:bg-muted/60', className)}
      aria-label="社区动态排序"
    >
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={sort === option.value}
          data-acbox-action={'game_detail_posts_sort_' + option.value}
          data-acbox-label={gameName}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors lg:px-3 lg:text-xs',
            sort === option.value ? 'bg-primary text-white' : 'text-[#595c5d] dark:text-muted-foreground',
          )}
          onClick={() => onSortChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function GameCommunityFeed({ gameName, latest, hot }: GameCommunityFeedProps) {
  const [sort, setSort] = useState<'latest' | 'hot'>('latest');
  const posts = sort === 'hot' ? hot : latest;

  return (
    <GameDetailSection
      title="社区动态与玩家讨论"
      subtitle={<span className="hidden lg:inline">参与 {gameName} 专区讨论，结识同服战友</span>}
      action={
        <>
          {/* 视觉稿是静态图，没有排序入口；保留既有「最新/热门」能力，PC 端收敛到标题行，不做第二层小标题。 */}
          <SortToggle className="hidden lg:inline-flex" gameName={gameName} sort={sort} onSortChange={setSort} />
          <Link
            href={'/community/topics?q=' + encodeURIComponent(gameName)}
            prefetch={false}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary transition-colors [@media(hover:hover)]:hover:underline"
          >
            进入完整专区
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </>
      }
    >
      <div className="mb-2.5 flex justify-end lg:hidden">
        <SortToggle className="inline-flex" gameName={gameName} sort={sort} onSortChange={setSort} />
      </div>
      <div className="space-y-2.5 lg:space-y-3">
        {posts.length > 0 ? (
          posts.map((post) => <CommunityPostRow key={sort + '-' + post.id} gameName={gameName} post={post} />)
        ) : (
          <div className="rounded-xl border border-[#abadae]/15 bg-[#f7f8f9]/70 p-3 text-xs text-[#595c5d] lg:p-4 lg:text-sm dark:border-border/45 dark:bg-card/50 dark:text-muted-foreground">
            暂无关联社区动态。
          </div>
        )}
      </div>
    </GameDetailSection>
  );
}

// 单条帖子：移动端紧凑横排（64×64 缩略图），PC 端按视觉稿放大（192×112 缩略图 + 摘要 + 阅读全文）。
function CommunityPostRow({ post, gameName }: { post: CommunityFeedItem; gameName: string }) {
  const href = '/community/post/' + encodeURIComponent(post.id);

  return (
    <article className="group flex items-start gap-3 rounded-xl border border-[#abadae]/15 bg-[#f7f8f9]/70 p-3 transition-colors lg:gap-4 lg:p-4 dark:border-border/40 dark:bg-card/50 [@media(hover:hover)]:hover:bg-[#eff1f2]/80 dark:[@media(hover:hover)]:hover:bg-muted/60">
      <div className="min-w-0 flex-1 lg:space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-[#757778] lg:gap-2.5 lg:text-xs dark:text-muted-foreground">
          {post.tag ? (
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary lg:order-last">
              {post.tag}
            </span>
          ) : null}
          <Avatar className="hidden h-6 w-6 lg:flex">
            <AvatarImage
              src={getPreviewImageUrl(post.userAvatarUrl, 80)}
              alt={post.userName}
              loading="lazy"
              decoding="async"
            />
            <AvatarFallback className="text-[10px]">{post.userName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="hidden truncate font-semibold text-[#2c2f30] lg:inline dark:text-foreground">{post.userName}</span>
          <span className="hidden text-[#abadae] lg:inline" aria-hidden="true">
            •
          </span>
          <span className="shrink-0">{post.timestamp}</span>
          <span className="truncate lg:hidden">· {post.userName}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-[#2c2f30] lg:mt-0 lg:line-clamp-1 lg:text-sm dark:text-foreground">
          <Link href={href} className="transition-colors [@media(hover:hover)]:hover:text-primary">
            {post.title}
          </Link>
        </h3>

        {/* line-clamp-2 与 lg:block 落在同一元素上时，变体生成的 display:block 会覆盖 -webkit-box 使截断失效，
            因此外层只管响应式显隐，内层单独负责行数截断。 */}
        <div className="hidden lg:block">
          <p className="line-clamp-2 text-xs leading-relaxed text-[#595c5d] dark:text-muted-foreground">{post.excerpt}</p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#757778] lg:mt-0 lg:gap-4 lg:pt-1 lg:text-xs dark:text-muted-foreground">
          <div className="flex items-center gap-3 lg:gap-4">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCompactCount(post.viewsCount)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCompactCount(post.commentsCount)}
            </span>
            <span className="hidden items-center gap-1 lg:inline-flex">
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCompactCount(post.likesCount)}
            </span>
          </div>
          <Link
            href={href}
            className="hidden shrink-0 text-xs font-semibold text-primary transition-colors lg:inline [@media(hover:hover)]:hover:underline"
          >
            阅读全文
          </Link>
        </div>
      </div>

      {post.imageUrl ? (
        <Link
          href={href}
          aria-label={post.title || gameName}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#abadae]/15 bg-[#eff1f2] lg:h-28 lg:w-32 xl:w-48 dark:border-border/40 dark:bg-muted/60"
        >
          <Image
            src={getPreviewImageUrl(post.imageUrl, 480)}
            alt={post.title || gameName + ' 社区帖子配图'}
            fill
            sizes="(min-width: 1280px) 192px, (min-width: 1024px) 128px, 64px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
      ) : null}
    </article>
  );
}
