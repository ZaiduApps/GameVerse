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

// 帖子标签：优先用置顶/推荐标记，其次用真实分类（话题名或关联游戏名），没有就留空，不编造。
function resolvePostTag(post: CommunityPost): string {
  if (post.isTop) return '置顶';
  if (post.isRecommended) return '推荐';
  const pick = (...candidates: Array<string | undefined>) =>
    candidates.map((value) => String(value || '').trim()).find(Boolean) || '';
  // 只用话题名/标签：category 在无话题时会回落成关联游戏名，做成角标与标题重复，宁可不显示。
  return pick(post.topicNames?.[0], post.tags?.[0]);
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
    tag: resolvePostTag(post),
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

  // 卡片外壳与标题行统一由 GameCommunityFeed 渲染：排序切换和「进入完整专区」要和标题同处一行。
  return <GameCommunityFeed gameName={game.name} latest={latest} hot={hot.length > 0 ? hot : latest} />;
}

export function GameCommunitySkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="正在加载社区动态"
      className="rounded-2xl border border-[#abadae]/20 bg-white p-4 shadow-sm lg:p-6 dark:border-border/45 dark:bg-card/80"
    >
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-[#dadddf]/70 lg:mb-5 lg:h-7" />
      <div className="space-y-2.5 lg:space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-[#dadddf]/40 lg:h-36" />
        ))}
      </div>
    </section>
  );
}
