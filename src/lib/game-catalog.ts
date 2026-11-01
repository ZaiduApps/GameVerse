import { cache } from 'react';

import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';
import {
  normalizeCatalogRows,
  sliceCatalogPage,
  type CatalogGame,
} from './game-catalog-core.mjs';

/**
 * 全量已发布游戏目录（`/seo/sitemap/games`）。`/app` 的「全部游戏索引」用它兜住
 * 分类页与关键词浏览都覆盖不到的作品：
 *
 * - 标签不在 23 个 `/category/<slug>` 里（娱乐 / 社交 / 工具 / 效率提升 …）；
 * - 标签命中分类但没有下载资源 —— `/game/category` 只返回有资源的应用；
 * - 包名/关键词不命中 `/app` 浏览模式的 6 个词（国际服 / 日服 / 韩服 / 动作 / 卡牌 / 冒险）。
 *
 * 这三类此前在全站没有任何可抓取入口。用 sitemap 自己的目录源（status=1）做索引，
 * 保证「索引集合 = sitemap 详情页集合」，不多不少。
 */

const CATALOG_PATH = '/seo/sitemap/games';
const CATALOG_PAGE_SIZE = 1000;
const CATALOG_REVALIDATE_SECONDS = 900;
/** 5118 条 / 1000 ≈ 6 页；上限只防上游分页失控。 */
const CATALOG_MAX_PAGES = 30;

export const GAME_CATALOG_INDEX_PAGE_SIZE = 48;

export type { CatalogGame };
export { sliceCatalogPage };

type SitemapGameRow = { pkg?: unknown; name?: unknown; status?: unknown };

type CatalogPage = { rows: SitemapGameRow[]; total: number };

async function requestCatalogPage(page: number, bypassCache: boolean): Promise<CatalogPage | null> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(CATALOG_PAGE_SIZE),
  });
  // 补取时换 URL 且 no-store：上游把部分失败包在 HTTP 200 + code≠0 里，这类响应
  // 会被 Next 的 fetch 缓存当成正常结果留下，用同一个 URL 重试只会读回同一份坏数据。
  if (bypassCache) params.set('_retry', String(Date.now()));
  const path = `${CATALOG_PATH}?${params.toString()}`;

  const init: TrackedFetchInit = bypassCache
    ? { cache: 'no-store', logKey: 'game-catalog' }
    : { cache: 'force-cache', next: { revalidate: CATALOG_REVALIDATE_SECONDS }, logKey: 'game-catalog' };

  try {
    const res = await trackedApiFetch(path, init);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      code?: number;
      data?: { list?: unknown; total?: number };
    } | null;
    if (!json || Number(json.code ?? -1) !== 0) return null;
    const data = json.data ?? {};
    const total = Number(data.total);
    return {
      // 上游只保证「数组」，字段逐个在 normalizeCatalogRows 里做运行时校验，这里不做结构假设。
      rows: Array.isArray(data.list) ? (data.list as SitemapGameRow[]) : [],
      total: Number.isFinite(total) && total > 0 ? total : 0,
    };
  } catch {
    return null;
  }
}

async function loadCatalog(bypassCache: boolean): Promise<CatalogGame[] | null> {
  const first = await requestCatalogPage(1, bypassCache);
  if (!first) return null;

  const pageCount = Math.min(
    CATALOG_MAX_PAGES,
    Math.max(1, Math.ceil(first.total / CATALOG_PAGE_SIZE)),
  );
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => requestCatalogPage(index + 2, bypassCache)),
  );
  if (rest.some((page) => page === null)) return null;

  const restPages = rest.filter((page): page is CatalogPage => page !== null);
  const rows = [first, ...restPages].flatMap((page) => page.rows);
  const games = normalizeCatalogRows(rows);
  if (games.length === 0) return null;

  // 上游按 updated_at 分页，抓取期间有更新会让条目在页边界漂移（重复或漏一条）。
  // 不因此整体放弃——排序与去重后仍然是当前可得的最全集合；只记录以便排查。
  if (rows.length !== first.total) {
    console.warn('[game-catalog] 目录行数与上游 total 不一致，可能有页边界漂移', {
      rows: rows.length,
      total: first.total,
    });
  }
  return games;
}

/**
 * 取不到目录时返回 null（页面不渲染索引，而不是渲染半份索引）。先走带缓存的请求，
 * 失败再补取一次 no-store；两次都失败才放弃。
 */
export const getPublishedGameCatalog = cache(async (): Promise<CatalogGame[] | null> => {
  const cached = await loadCatalog(false);
  if (cached) return cached;

  const fresh = await loadCatalog(true);
  if (!fresh) {
    console.error('[game-catalog] 全量游戏目录加载失败，本次不渲染全部游戏索引');
  }
  return fresh;
});
