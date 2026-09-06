import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { getCommunityPostPreviewText } from '@/lib/community-post-preview';
import { getCommunityPostsByGame } from '@/lib/community-api';
import type { CommunityPost, GameDetailData } from '@/types';
import GameCommunityFeed from './GameCommunityFeed.client';
import type { CommunityFeedItem } from './game-detail-presenter';

interface GameCommunitySectionProps {
  game: Pick<GameDetailData['app'], '_id' | 'pkg' | 'name'>;
}

const COMMUNITY_FEED_REVALIDATE_SECONDS = 300;

function extractPostImage(post: CommunityPost): string {
  if (post.imageUrl) return post.imageUrl;
  const markdownMatch = String(post.content || '').match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const htmlMatch = String(post.content || '').match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  return htmlMatch?.[1] || '';
}

function toFeedItem(post: CommunityPost): CommunityFeedItem {
  return {
    id: String(post.id || '').trim(),
    title: String(post.title || '').trim(),
    excerpt: getCommunityPostPreviewText(post, 180, '暂无内容'),
    imageUrl: extractPostImage(post),
    userName: String(post.user?.name || '社区用户').trim() || '社区用户',
    userAvatarUrl: String(post.user?.avatarUrl || '').trim(),
    timestamp: String(post.timestamp || '最近更新').trim() || '最近更新',
    likesCount: Math.max(0, Number(post.likesCount || 0)),
    commentsCount: Math.max(0, Number(post.commentsCount || 0)),
    viewsCount: Math.max(0, Number(post.viewsCount || 0)),
  };
}

async function fetchFeed(game: GameCommunitySectionProps['game'], sort: 'latest' | 'hot') {
  return getCommunityPostsByGame({
    sort,
    pageSize: 12,
    appId: game._id,
    pkg: game.pkg || undefined,
    gameName: game.name,
    maxQueryCandidates: 2,
    fetchOptions: {
      cache: 'force-cache',
      // 与根布局站点配置的刷新周期一致，避免可选社区流把整页 ISR 缩短为两分钟。
      next: { revalidate: COMMUNITY_FEED_REVALIDATE_SECONDS },
      timeoutMs: 2500,
      retries: 0,
      logKey: `game-community-${sort}`,
      warnOnFailure: true,
    },
  });
}

export default async function GameCommunitySection({ game }: GameCommunitySectionProps) {
  let latest: CommunityFeedItem[] = [];
  let hot: CommunityFeedItem[] = [];

  // 社区流不参与 SEO；批量构建详情页时跳过，避免可选查询挤占核心快照容量。
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    const [latestResult, hotResult] = await Promise.allSettled([
      fetchFeed(game, 'latest'),
      fetchFeed(game, 'hot'),
    ]);
    latest = latestResult.status === 'fulfilled' ? latestResult.value.slice(0, 6).map(toFeedItem) : [];
    hot = hotResult.status === 'fulfilled' ? hotResult.value.slice(0, 6).map(toFeedItem) : [];
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between lg:mb-6">
        <h2 className="flex items-center gap-2 text-xl font-black lg:gap-3 lg:font-bold">
          <span className="h-6 w-1.5 rounded-full bg-[#fdc003] lg:h-8 lg:w-2" aria-hidden="true" />
          社区动态
        </h2>
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#005e9f] lg:gap-2 lg:text-sm lg:font-medium lg:text-[#595c5d] lg:hover:text-[#b71211]"
        >
          发现更多精彩
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <GameCommunityFeed gameName={game.name} latest={latest} hot={hot.length > 0 ? hot : latest} />
    </section>
  );
}

export function GameCommunitySkeleton() {
  return (
    <section aria-busy="true" aria-label="正在加载社区动态">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-[#dadddf]/70" />
      <div className="space-y-4">
        {[0, 1].map((index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/70 dark:bg-card/70" />
        ))}
      </div>
    </section>
  );
}
