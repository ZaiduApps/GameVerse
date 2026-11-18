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
 * @property {readonly string[]} [aliases] 抓取源下发的英文分类别名（大小写 / 空格 / 连字符不敏感）
 */

/**
 * 中文分类名 → slug。顺序即展示顺序（页脚取前 10、榜单页取前 12），
 * 大致按库内资源量从多到少排列，新增分类请插到对应位置而不是追加到末尾。
 *
 * @type {readonly CategoryPageDef[]}
 */
export const CATEGORY_PAGES = [
  { name: '角色扮演', slug: 'rpg', aliases: ['Role Playing', 'Role-Playing', 'RPG'] },
  { name: '休闲', slug: 'casual', aliases: ['Casual'] },
  { name: '多人竞技', slug: 'multiplayer-arena', aliases: ['Multiplayer'] },
  { name: '动漫', slug: 'anime', aliases: ['Anime'] },
  { name: '模拟', slug: 'simulation', aliases: ['Simulation'] },
  { name: '动作', slug: 'action', aliases: ['Action'] },
  { name: '策略', slug: 'strategy', aliases: ['Strategy'] },
  { name: '对战', slug: 'versus', aliases: ['Versus'] },
  { name: '射击游戏', slug: 'shooter', aliases: ['Shooter', 'Shooting'] },
  { name: '冒险', slug: 'adventure', aliases: ['Adventure'] },
  { name: '体育', slug: 'sports', aliases: ['Sports'] },
  { name: '益智', slug: 'puzzle', aliases: ['Puzzle'] },
  { name: '回合制角色扮演', slug: 'turn-based-rpg', aliases: ['Turn-based RPG', 'Turn Based RPG'] },
  { name: '动作角色扮演', slug: 'action-rpg', aliases: ['Action RPG'] },
  { name: '动作冒险', slug: 'action-adventure', aliases: ['Action Adventure'] },
  { name: '动作策略', slug: 'action-strategy', aliases: ['Action Strategy'] },
  { name: '街机', slug: 'arcade', aliases: ['Arcade'] },
  { name: '战术射击游戏', slug: 'tactical-shooter', aliases: ['Tactical Shooter'] },
  { name: '赛车', slug: 'racing', aliases: ['Racing'] },
  { name: '纸牌', slug: 'card', aliases: ['Card', 'Cards'] },
  { name: '音乐', slug: 'music', aliases: ['Music'] },
  { name: '塔防游戏', slug: 'tower-defense', aliases: ['Tower Defense'] },
  { name: 'MOBA', slug: 'moba', aliases: ['Multiplayer Online Battle Arena'] },
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
 * 抓取源（GP / APKPure）的英文分类名归一：`Adventure`、`role playing`、`Action-RPG`
 * 都应按 `adventure` / `roleplaying` 这类键比对，命中后返回**中文分类名**。
 * 只做归一比对，不改写调用方传入的原值；未命中返回空串（真标签照旧展示原值）。
 *
 * @param {string} name
 * @returns {string}
 */
export function resolveCategoryNameByAlias(name) {
  const key = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  if (!key) return '';
  const hit = CATEGORY_PAGES.find((item) =>
    (item.aliases ?? []).some((alias) => alias.toLowerCase().replace(/[^a-z0-9]+/g, '') === key),
  );
  return hit ? hit.name : '';
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
