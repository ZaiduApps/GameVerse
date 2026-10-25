import { trackedApiFetch } from '@/lib/api';
import type { ApiDynamicPost } from '@/types';

// 与 `src/lib/community-api.ts` 的 COMMUNITY_FEED_REVALIDATE_SECONDS 保持一致，
// 不另造第二个 feed 缓存周期。
const HOME_COMMUNITY_FEED_REVALIDATE_SECONDS = 120;
const HOME_COMMUNITY_FEED_TIMEOUT_MS = 8000;
const HOME_COMMUNITY_POSTS_MAX = 20;

// 闸门逻辑在 `home-post-author-cap.ts`（纯函数、零 import，可直接被 node --test 加载），
// 这里只做转出，保持调用点 `@/lib/home-community-posts` 不变。
export { capByAuthor } from '@/lib/home-post-author-cap';

function toSortTime(post: ApiDynamicPost): number {
  // feed 还会带 created_at，但 ApiDynamicPost 未声明，按需兜底读取。
  const createdAt = (post as { created_at?: string }).created_at;
  const ms = Date.parse(String(post.publish_at || createdAt || post.last_commented_at || ''));
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * 首页「社区动态」的最新帖子。
 *
 * `/home` 返回的 dynamic_posts 是后端「热门池 + 最新回复池」随机抽样，不是时间倒序；
 * 这里改走 `/content/feed?sort=latest` 拿真正的最新 N 条。
 * 任何失败都返回空数组，首页不能因为这块 500。
 */
export async function getHomeLatestCommunityPosts(limit = HOME_COMMUNITY_POSTS_MAX): Promise<ApiDynamicPost[]> {
  const take = Math.min(HOME_COMMUNITY_POSTS_MAX, Math.max(1, Math.floor(Number(limit) || HOME_COMMUNITY_POSTS_MAX)));
  try {
    const query = new URLSearchParams({
      page: '1',
      pageSize: String(take),
      sort: 'latest',
      post_type: 'post',
      view: 'card',
    });
    const res = await trackedApiFetch(`/content/feed?${query.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: HOME_COMMUNITY_FEED_REVALIDATE_SECONDS },
      timeoutMs: HOME_COMMUNITY_FEED_TIMEOUT_MS,
      logKey: 'home-community-posts',
    });
    if (!res.ok) {
      console.error('[home-community-posts] non-200 response', { status: res.status, statusText: res.statusText });
      return [];
    }
    const json = await res.json().catch(() => null);
    if (!json || json.code !== 0) {
      console.error('[home-community-posts] invalid payload', {
        code: json && typeof json === 'object' ? json.code ?? null : null,
      });
      return [];
    }
    const list = Array.isArray(json?.data?.list) ? (json.data.list as ApiDynamicPost[]) : [];
    return list
      .filter((post): post is ApiDynamicPost => Boolean(post && post._id))
      .sort((a, b) => toSortTime(b) - toSortTime(a))
      .slice(0, take);
  } catch (error) {
    console.error('[home-community-posts] request failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
