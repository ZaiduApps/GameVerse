import { resolveGameName } from '@/lib/game-display-name';

/**
 * 404 恢复入口的纯函数（待决策 #203）。
 *
 * 只做「把 URL / 接口返回变成可渲染的游戏条目」这一件事，便于 node:test
 * 直接断言；真正的取数在 `app/not-found.tsx`（服务端热门榜）与
 * `components/not-found-similar-games.client.tsx`（按路径取同类推荐）。
 *
 * 不输出 JSON-LD：404 页不是可收录页面，这里也不再制造第二套结构化数据。
 */

export interface RecoveryGame {
  pkg: string;
  name: string;
  icon: string;
  /** 展示用下载量文案（如 `1,000+`）；接口没给就留空。 */
  downloads?: string;
}

/**
 * 从 404 的 pathname 里取出可能指向游戏详情的标识。
 *
 * 只认 `/app/<单段>`：`/app`、`/app/download/...`、列表页或任何多段路径
 * 都不是「失效的游戏详情」，返回 null 让同类推荐整块不渲染。
 */
export function extractGameIdentifierFromPath(
  pathname: string | null | undefined,
): string | null {
  const path = String(pathname || '').trim().split(/[?#]/, 1)[0];
  const match = /^\/app\/([^/]+)\/?$/.exec(path);
  if (!match) return null;
  let id = '';
  try {
    id = decodeURIComponent(match[1] || '').trim();
  } catch {
    return null;
  }
  if (!id || id === 'download') return null;
  return id;
}

function readList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const data = (payload as { data?: unknown } | null)?.data;
  if (Array.isArray(data)) return data;
  // /game/rankings 的下载榜在 data.downloads 里。
  const downloads = (data as { downloads?: unknown } | null)?.downloads;
  return Array.isArray(downloads) ? downloads : [];
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 把推荐 / 榜单接口的返回归一成卡片条目：只保留有包名的游戏，按 pkg 去重，
 * 最多 `limit` 条。字段缺失或形状不对时返回空数组，调用方据此整块不渲染。
 */
export function normalizeRecoveryGames(
  payload: unknown,
  limit = 5,
): RecoveryGame[] {
  const seen = new Set<string>();
  const games: RecoveryGame[] = [];
  for (const raw of readList(payload)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as {
      pkg?: unknown;
      name?: unknown;
      icon?: unknown;
      download_count_show?: unknown;
      metadata?: unknown;
    };
    const pkg = readText(item.pkg);
    if (!pkg || seen.has(pkg)) continue;
    seen.add(pkg);
    const name =
      resolveGameName({
        name: readText(item.name),
        pkg,
        metadata:
          item.metadata && typeof item.metadata === 'object'
            ? (item.metadata as Record<string, unknown>)
            : null,
      }) || pkg;
    games.push({
      pkg,
      name,
      icon: readText(item.icon),
      downloads: readText(item.download_count_show) || undefined,
    });
    if (games.length >= limit) break;
  }
  return games;
}
