/**
 * 分类落地页（`/category/<slug>`）的 slug 映射与收录阈值。
 *
 * 为什么写死：slug 一旦上线就是外链与 sitemap 的一部分，改成拼音库/运行时生成会让
 * 已有 URL 在库内改名或依赖升级时静默漂移。名字与库内 `apps.tags` 逐字一致，
 * 后端 `/game/category?name=` 正是按该字段精确匹配，写错一个字就是空页。
 *
 * 为什么是 .mjs：这份数据被三个运行时同时使用——Next 页面（TS）、路由与构建脚本
 * （`scripts/generate-sitemap.mjs` 裸 node 直接执行）、以及 node:test。裸 node 只有
 * 新版本才认 `.ts` 导入，`.mjs` 与仓内 `search-indexable.mjs` 是同一套做法；
 * TS 侧的类型与再导出见 `src/lib/category-pages.ts`。
 *
 * 阈值只在这里定义一份：页面（要不要 404）、sitemap（要不要收录）、后续任何调用方
 * 都走 `isCategoryQualified`，避免「页面能开、sitemap 不收」这类两份口径。
 */

/**
 * @typedef {object} CategoryPageDef
 * @property {string} name 库内 `apps.tags` 里的中文分类名（精确匹配）
 * @property {string} slug URL 段：`/category/<slug>`
 */

/**
 * 中文分类名 → slug。顺序即展示顺序（页脚取前 10、榜单页取前 12），
 * 大致按库内资源量从多到少排列，新增分类请插到对应位置而不是追加到末尾。
 *
 * @type {readonly CategoryPageDef[]}
 */
export const CATEGORY_PAGES = [
  { name: '角色扮演', slug: 'rpg' },
  { name: '休闲', slug: 'casual' },
  { name: '多人竞技', slug: 'multiplayer-arena' },
  { name: '动漫', slug: 'anime' },
  { name: '模拟', slug: 'simulation' },
  { name: '动作', slug: 'action' },
  { name: '策略', slug: 'strategy' },
  { name: '对战', slug: 'versus' },
  { name: '射击游戏', slug: 'shooter' },
  { name: '冒险', slug: 'adventure' },
  { name: '体育', slug: 'sports' },
  { name: '益智', slug: 'puzzle' },
  { name: '回合制角色扮演', slug: 'turn-based-rpg' },
  { name: '动作角色扮演', slug: 'action-rpg' },
  { name: '动作冒险', slug: 'action-adventure' },
  { name: '动作策略', slug: 'action-strategy' },
  { name: '街机', slug: 'arcade' },
  { name: '战术射击游戏', slug: 'tactical-shooter' },
  { name: '赛车', slug: 'racing' },
  { name: '纸牌', slug: 'card' },
  { name: '音乐', slug: 'music' },
  { name: '塔防游戏', slug: 'tower-defense' },
  { name: 'MOBA', slug: 'moba' },
];

/** 收录阈值：已发布条数与「有下载资源」条数必须同时达标，否则页面 404、sitemap 不收。 */
export const CATEGORY_MIN_PUBLISHED = 12;
export const CATEGORY_MIN_WITH_RESOURCES = 8;

/** 全部分类名，供 `/seo/category-pages?names=` 一次请求用。 @type {readonly string[]} */
export const CATEGORY_PAGE_NAMES = CATEGORY_PAGES.map((item) => item.name);

/**
 * 展示用的分类名：「射击游戏」这类自身已带「游戏」的名字不再拼成「射击游戏游戏」。
 * 标题、H1、页脚与榜单页入口统一走这里，避免各处各拼一遍。
 *
 * @param {string} name
 * @returns {string}
 */
export function categoryDisplayName(name) {
  const value = String(name || '').trim();
  if (!value) return '安卓游戏';
  return value.endsWith('游戏') ? value : `${value}游戏`;
}

/**
 * @param {string} slug
 * @returns {CategoryPageDef | null}
 */
export function resolveCategoryBySlug(slug) {
  const value = String(slug || '').trim();
  if (!value) return null;
  return CATEGORY_PAGES.find((item) => item.slug === value) ?? null;
}

/**
 * @param {string} name
 * @returns {CategoryPageDef | null}
 */
export function resolveCategoryByName(name) {
  const value = String(name || '').trim();
  if (!value) return null;
  return CATEGORY_PAGES.find((item) => item.name === value) ?? null;
}

/**
 * 第 1 页归一到 `/category/<slug>`，从第 2 页起带 `?page=`（与 `/app` 的分页口径一致）。
 *
 * @param {string} slug
 * @param {number} [page]
 * @returns {string}
 */
export function buildCategoryPath(slug, page = 1) {
  const base = `/category/${encodeURIComponent(slug)}`;
  const pageNumber = Number.isFinite(page) ? Math.floor(page) : 1;
  return pageNumber > 1 ? `${base}?page=${pageNumber}` : base;
}

/**
 * 是否达到收录阈值。参数名与 `/seo/category-pages` 的字段名对齐。
 *
 * @param {{ published?: number | null, withResources?: number | null }} input
 * @returns {boolean}
 */
export function isCategoryQualified(input) {
  const published = Number(input?.published ?? 0);
  const withResources = Number(input?.withResources ?? 0);
  if (!Number.isFinite(published) || !Number.isFinite(withResources)) return false;
  return published >= CATEGORY_MIN_PUBLISHED && withResources >= CATEGORY_MIN_WITH_RESOURCES;
}
