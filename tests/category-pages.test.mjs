/**
 * 分类落地页的 slug 映射与收录阈值（src/lib/category-pages.ts）。
 *
 * 这份映射同时被页面路由、详情页面包屑/标签 chip、页脚、榜单页和 sitemap 使用：
 * 任何一处名字写错都会得到「接口查不到的分类」→ 页面 404。所以这里锁死
 * 「名字与 slug 一一对应、顺序稳定、阈值边界包含等号」。
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATEGORY_MIN_PUBLISHED,
  CATEGORY_MIN_WITH_RESOURCES,
  CATEGORY_PAGES,
  CATEGORY_PAGE_NAMES,
  buildCategoryPath,
  categoryDisplayName,
  isCategoryQualified,
  resolveCategoryByName,
  resolveCategoryBySlug,
} from '../src/lib/category-pages.ts';

test('映射表：23 个分类，名字与 slug 唯一且非空', () => {
  assert.equal(CATEGORY_PAGES.length, 23);
  assert.equal(new Set(CATEGORY_PAGES.map((item) => item.name)).size, 23);
  assert.equal(new Set(CATEGORY_PAGES.map((item) => item.slug)).size, 23);
  for (const item of CATEGORY_PAGES) {
    assert.ok(item.name.trim(), `分类名不能为空：${JSON.stringify(item)}`);
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.deepEqual(CATEGORY_PAGE_NAMES, CATEGORY_PAGES.map((item) => item.name));
});

test('映射表：关键分类的 slug 与页面地址约定一致', () => {
  const expected = {
    角色扮演: 'rpg',
    休闲: 'casual',
    多人竞技: 'multiplayer-arena',
    射击游戏: 'shooter',
    回合制角色扮演: 'turn-based-rpg',
    战术射击游戏: 'tactical-shooter',
    塔防游戏: 'tower-defense',
    MOBA: 'moba',
  };
  for (const [name, slug] of Object.entries(expected)) {
    assert.equal(resolveCategoryByName(name)?.slug, slug, `${name} 应映射到 ${slug}`);
    assert.equal(resolveCategoryBySlug(slug)?.name, name, `${slug} 应反查回 ${name}`);
  }
});

test('resolveCategoryBySlug: 未知 / 空值返回 null，不做模糊匹配', () => {
  assert.equal(resolveCategoryBySlug('not-a-category'), null);
  assert.equal(resolveCategoryBySlug(''), null);
  assert.equal(resolveCategoryBySlug('  '), null);
  // slug 区分大小写：/category/RPG 是不同 URL，不能悄悄落到同一页
  assert.equal(resolveCategoryBySlug('RPG'), null);
});

test('buildCategoryPath: 第 1 页不带参数，其余页带 ?page=', () => {
  assert.equal(buildCategoryPath('rpg'), '/category/rpg');
  assert.equal(buildCategoryPath('rpg', 1), '/category/rpg');
  assert.equal(buildCategoryPath('rpg', 3), '/category/rpg?page=3');
  // 非法页码按第 1 页处理，不生成 ?page=NaN
  assert.equal(buildCategoryPath('rpg', Number.NaN), '/category/rpg');
});

test('isCategoryQualified: 已发布≥12 且 有资源≥8，边界含等号', () => {
  assert.equal(CATEGORY_MIN_PUBLISHED, 12);
  assert.equal(CATEGORY_MIN_WITH_RESOURCES, 8);
  assert.equal(isCategoryQualified({ published: 12, withResources: 8 }), true);
  assert.equal(isCategoryQualified({ published: 11, withResources: 100 }), false);
  assert.equal(isCategoryQualified({ published: 100, withResources: 7 }), false);
  assert.equal(isCategoryQualified({ published: 1400, withResources: 1341 }), true);
  // 接口缺字段 / 传 null 一律按不达标处理，不能把 undefined 当 0 以上
  assert.equal(isCategoryQualified({}), false);
  assert.equal(isCategoryQualified({ published: null, withResources: null }), false);
});

test('categoryDisplayName: 自身已带「游戏」的分类名不再重复拼接', () => {
  assert.equal(categoryDisplayName('休闲'), '休闲游戏');
  assert.equal(categoryDisplayName('射击游戏'), '射击游戏');
  assert.equal(categoryDisplayName('塔防游戏'), '塔防游戏');
  assert.equal(categoryDisplayName('MOBA'), 'MOBA游戏');
  assert.equal(categoryDisplayName(''), '安卓游戏');
  // 全表都不该出现「游戏游戏」
  for (const item of CATEGORY_PAGES) {
    assert.doesNotMatch(categoryDisplayName(item.name), /游戏游戏/);
  }
});
