'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Search as SearchIcon } from 'lucide-react';

import { trackedApiFetch } from '@/lib/api';
import {
  extractGameIdentifierFromPath,
  normalizeRecoveryGames,
  type RecoveryGame,
} from '@/lib/not-found-recovery';

const SIMILAR_REQUEST_TIMEOUT_MS = 3000;

/**
 * 404 的「同类游戏」入口（待决策 #203）。
 *
 * 失效的详情页 URL 里只有游戏标识，没有品类；这里复用详情页同一个
 * `/game/recommendedApp` 推荐接口（后端本身带同分类/热门兜底）。接口
 * 取不到、返回空或请求失败时整块不渲染，不占 404 版面。
 *
 * 必须放在客户端：App Router 的 not-found 拿不到 params，只能用
 * `usePathname()` 读回原始 URL。
 */
export default function NotFoundSimilarGames() {
  const pathname = usePathname();
  const gameId = extractGameIdentifierFromPath(pathname);
  const [games, setGames] = useState<RecoveryGame[]>([]);

  useEffect(() => {
    if (!gameId) {
      setGames([]);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    void trackedApiFetch(
      `/game/recommendedApp?param=${encodeURIComponent(gameId)}`,
      {
        cache: 'no-store',
        signal: controller.signal,
        timeoutMs: SIMILAR_REQUEST_TIMEOUT_MS,
      },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!cancelled) setGames(normalizeRecoveryGames(payload, 4));
      })
      .catch(() => {
        if (!cancelled) setGames([]);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [gameId]);

  if (games.length === 0) return null;

  return (
    <section aria-labelledby="not-found-similar-title" className="mt-6">
      <h2
        id="not-found-similar-title"
        className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
      >
        <Gamepad2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        同类游戏
      </h2>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {games.map((game) => (
          <li key={game.pkg}>
            <Link
              href={`/app/${encodeURIComponent(game.pkg)}`}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60"
            >
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{game.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
