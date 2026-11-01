/**
 * 全量游戏目录的纯逻辑（`/app` 的「全部游戏索引」用）。
 *
 * 为什么单独放 `.mjs`：`game-catalog.ts` 依赖 `react` 的 `cache` 与运行时 fetch，
 * node:test 直接导入会连带拉起整条渲染依赖；这里只留「归一 + 切页」两段纯函数，
 * 让测试像 `category-pages.test.mjs` 一样裸跑。
 *
 * 归一规则与 sitemap 同口径：
 * - 只收 `status === 1`（已发布）。预约（0）在 sitemap 里也是软 404，不能拿来凑内链；
 * - 按 pkg 去重；
 * - 排序固定为 pkg 码位序。上游按 updated_at 倒序分页，条目会随更新在页间漂移，
 *   直接按上游顺序切片会让爬虫跨页抓取时「同一条出现两次 / 一条都不出现」。
 */

/**
 * @typedef {object} CatalogRow
 * @property {unknown} [pkg]
 * @property {unknown} [name]
 * @property {unknown} [status]
 */

/**
 * @typedef {object} CatalogGame
 * @property {string} pkg
 * @property {string} name
 */

/**
 * @param {CatalogRow[]} rows
 * @returns {CatalogGame[]}
 */
export function normalizeCatalogRows(rows) {
	const seen = new Set();
	const games = [];
	for (const row of Array.isArray(rows) ? rows : []) {
		if (Number(row?.status) !== 1) continue;
		const pkg = String(row?.pkg ?? '').trim();
		if (!pkg || seen.has(pkg)) continue;
		seen.add(pkg);
		const name = String(row?.name ?? '').trim();
		games.push({ pkg, name: name || pkg });
	}
	// 码位序而不是 localeCompare：结果不能随 ICU/运行环境变化。
	games.sort((a, b) => (a.pkg < b.pkg ? -1 : a.pkg > b.pkg ? 1 : 0));
	return games;
}

/**
 * 切出索引的第 `page` 页。越界返回空数组与真实总页数，调用方据此决定是否渲染。
 *
 * @param {CatalogGame[]} games
 * @param {number} page
 * @param {number} pageSize
 * @returns {{ games: CatalogGame[], totalPages: number, total: number }}
 */
export function sliceCatalogPage(games, page, pageSize) {
	const list = Array.isArray(games) ? games : [];
	const size = Math.max(1, Math.floor(Number(pageSize) || 1));
	const totalPages = Math.max(1, Math.ceil(list.length / size));
	const current = Math.max(1, Math.floor(Number(page) || 1));
	if (list.length === 0 || current > totalPages) {
		return { games: [], totalPages, total: list.length };
	}
	const start = (current - 1) * size;
	return {
		games: list.slice(start, start + size),
		totalPages,
		total: list.length,
	};
}
