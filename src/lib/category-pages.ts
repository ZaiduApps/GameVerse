/**
 * 分类落地页（`/category/<slug>`）的 TS 侧入口。
 *
 * 数据与规则（slug 映射、收录阈值、slug 解析/路径拼接/阈值判定）只有一份，放在
 * `category-pages.mjs`：构建脚本 `scripts/generate-sitemap.mjs` 用裸 node 执行，
 * 只有 `.mjs` 能保证被 sitemap 与 Next 两侧共用（与仓内 `search-indexable.mjs` 同做法）。
 * 这里只补 TS 类型与再导出，不重复任何常量或判定逻辑。
 */

import type { CategoryPageDef } from './category-pages.mjs';

export {
  CATEGORY_PAGES,
  CATEGORY_MIN_PUBLISHED,
  CATEGORY_MIN_WITH_RESOURCES,
  CATEGORY_PAGE_NAMES,
  buildCategoryPath,
  categoryDisplayName,
  isCategoryQualified,
  resolveCategoryByName,
  resolveCategoryBySlug,
} from './category-pages.mjs';

export type { CategoryPageDef };

/** 分类列表接口（`/game/category`）的单个游戏条目。 */
export interface CategoryGame {
  _id: string;
  name: string;
  pkg: string;
  type?: string;
  icon?: string;
  header_image?: string;
  summary?: string;
  star?: number | string | null;
  tags?: string[];
  latest_at?: string;
  updated_at?: string;
}

/** 分类列表接口的分页响应体。total = 有资源条数，publishedTotal = 已发布条数。 */
export interface CategoryPagePayload {
  list: CategoryGame[];
  total: number;
  page: number;
  pageSize: number;
  publishedTotal?: number;
}
