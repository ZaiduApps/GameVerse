import type { Metadata } from 'next';

import NotFoundView from '@/components/not-found-view';
import { trackedApiFetch } from '@/lib/api';
import { normalizeRecoveryGames, type RecoveryGame } from '@/lib/not-found-recovery';

/**
 * 404 页面元数据。
 *
 * 动态路由对不存在的 ID 会调用 notFound()，此前根布局的 title.default
 * （站点 slogan）被继承下来，软 404 页因此带着首页标题。这里显式声明
 * 404 语义：标题自指「页面不存在」并强制 noindex，避免与首页争夺同一 query。
 *
 * 状态码由 notFound() / Next 的 not-found 边界保证是 404；本文件只负责正文，
 * 禁止在这里改 200、自动跳转或输出 JSON-LD（待决策 #203）。
 */
export const metadata: Metadata = {
  title: '页面不存在 | APKScc',
  description: '该页面已下线或地址有误，请返回首页或重新搜索。',
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

/** 热门下载榜按 ISR 缓存，避免每次 404 都打一次后端。 */
export const revalidate = 900;

const HOT_GAMES_LIMIT = 5;

/**
 * 热门下载 Top 5（待决策 #203）：复用 `/game/rankings` 的下载榜，服务端取数。
 * 接口失败、超时或返回空时返回空数组，正文整块不渲染；404 本身不受影响。
 */
async function getHotDownloads(): Promise<RecoveryGame[]> {
  try {
    const res = await trackedApiFetch(`/game/rankings?limit=${HOT_GAMES_LIMIT}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
      timeoutMs: 2000,
      logKey: 'not-found-hot-games',
    });
    if (!res.ok) return [];
    return normalizeRecoveryGames(await res.json(), HOT_GAMES_LIMIT);
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const hotGames = await getHotDownloads();
  return <NotFoundView hotGames={hotGames} />;
}
