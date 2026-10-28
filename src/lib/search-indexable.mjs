/**
 * `/search` 页可收录白名单（派发单 2026-10-28「搜索可收录」）。
 *
 * 为什么是白名单而不是全量放开：`/search?q=` 的 URL 空间无界，任何一个 `?q=` 都能被抓，
 * 而 `/search` 是 force-dynamic（每次渲染打一次后端 API）。放开即批量上线 0 结果页
 * （软 404），还会用「下载意图」的搜索页抢详情页的曝光。
 *
 * 规则只有一条：**新增词只能来自 Bing 查询词报告里 games.total≥3 的词**。
 * 白名单只是「允许收录」的候选池，最终还要过 result 闸门（games.total≥3 且 total≥5），
 * 结果变薄了就自动退回 noindex，不必手改清单。
 */

/**
 * 白名单（小写、单词间单空格）。上限 20 条，来源与实测一并记在这里，别凭感觉加词：
 *   - `pubg mobile`：Bing 30 天 31 次曝光，本地 API games=5 / total=779。
 *   - `ragnarok the new world`：Bing 查询 `ragnarok the new world下载`（7 次曝光）剥掉
 *     意图后缀后的主体词，games=20 / total=20。
 */
export const SEARCH_INDEXABLE_QUERIES = Object.freeze([
  'pubg mobile',
  'ragnarok the new world',
]);

/** 可收录闸门：游戏 ≥3 且四节合计 ≥5，低于这个量级就是薄内容页。 */
export const SEARCH_INDEXABLE_MIN_GAMES = 3;
export const SEARCH_INDEXABLE_MIN_TOTAL = 5;

/** 单实体：唯一答案就是那个游戏，搜索页没有存在价值，把信号让给详情页。 */
export const SEARCH_SINGLE_ENTITY_MAX_GAMES = 1;

/** sitemap 里 `/search?q=` 的条数上限。 */
export const SEARCH_INDEXABLE_MAX_SITEMAP_ENTRIES = 50;

export const SEARCH_PAGE_TIER = Object.freeze({
  /** 白名单 + 结果够厚：index,follow，canonical 自指，进 sitemap。 */
  INDEXABLE: 'indexable',
  /** 单实体：noindex,follow，canonical 指向该游戏详情页。 */
  SINGLE_ENTITY: 'single',
  /** 其余（0 结果、1–2 结果、白名单外、上游失败）：noindex,follow，canonical 自指。 */
  EXCLUDED: 'excluded',
});

export function normalizeSearchIndexableQuery(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function isWhitelistedSearchQuery(value) {
  const q = normalizeSearchIndexableQuery(value);
  return Boolean(q) && SEARCH_INDEXABLE_QUERIES.includes(q);
}

/**
 * 命中白名单时返回白名单里的规范写法（小写、单空格），否则 null。
 * 大小写/空白变体共用同一个 canonical，避免同一结果集在索引里散成多个 URL。
 */
export function findWhitelistedSearchQuery(value) {
  const q = normalizeSearchIndexableQuery(value);
  return SEARCH_INDEXABLE_QUERIES.includes(q) ? q : null;
}

/**
 * 收录分级。入参是「这次渲染真实拿到的结果量」，所以同一 URL 会随数据变厚/变薄自动
 * 在 index 与 noindex 之间切换——这就是我们想要的有界收录。
 *
 * 单实体只看「游戏恰好 1 条」，不看内容条数：`极乐事件簿` 这类查询即使带出若干帖子，
 * 唯一正确答案仍是那一个游戏详情页，canonical 必须让出去（派发单「蚕食详情页」风险）。
 */
export function resolveSearchPageTier(query, gamesTotal, total) {
  const games = Number(gamesTotal || 0);
  const sum = Number(total || 0);
  if (isWhitelistedSearchQuery(query) && games >= SEARCH_INDEXABLE_MIN_GAMES && sum >= SEARCH_INDEXABLE_MIN_TOTAL) {
    return SEARCH_PAGE_TIER.INDEXABLE;
  }
  if (games === SEARCH_SINGLE_ENTITY_MAX_GAMES) {
    return SEARCH_PAGE_TIER.SINGLE_ENTITY;
  }
  return SEARCH_PAGE_TIER.EXCLUDED;
}

/** `/search?q=` 路径。canonical、站内链接与 sitemap 都走这里，别各自拼字符串。 */
export function buildSearchQueryPath(query) {
  const q = String(query ?? '').trim();
  return q ? `/search?q=${encodeURIComponent(q)}` : '/search';
}
