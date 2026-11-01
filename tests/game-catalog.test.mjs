/**
 * `/app` 全量游戏索引的纯逻辑（src/lib/game-catalog-core.mjs）。
 *
 * 这份索引是分类页与关键词浏览之外的唯一兜底入口：一旦归一丢条、排序不稳定或切页
 * 漏页，对应详情页就会重新变成零内链的孤岛。所以这里锁死三件事：
 * - 只收 status=1（与 sitemap 同口径），预约/下线不进索引；
 * - 按 pkg 去重并按码位序排序，页边界不随上游 updated_at 顺序漂移；
 * - 切页恰好一次覆盖全集，不重不漏。
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeCatalogRows, sliceCatalogPage } from '../src/lib/game-catalog-core.mjs';

test('归一：只保留已发布、去重、按包名码位序排序', () => {
  const games = normalizeCatalogRows([
    { pkg: 'com.zeta.game', name: 'Zeta', status: 1 },
    { pkg: 'com.alpha.game', name: 'Alpha', status: 1 },
    { pkg: 'com.alpha.game', name: 'Alpha duplicated', status: 1 },
    { pkg: 'com.beta.game', name: 'Beta', status: 0 },
    { pkg: 'com.beta.game', name: 'Beta', status: 2 },
    { pkg: '  ', name: 'Blank pkg', status: 1 },
  ]);

  assert.deepEqual(
    games.map((game) => game.pkg),
    ['com.alpha.game', 'com.zeta.game'],
  );
  assert.equal(games[0].name, 'Alpha');
});

test('归一：空名称回退到包名，非数组输入得到空目录', () => {
  assert.deepEqual(normalizeCatalogRows([{ pkg: 'com.a.b', name: '  ', status: 1 }]), [
    { pkg: 'com.a.b', name: 'com.a.b' },
  ]);
  assert.deepEqual(normalizeCatalogRows(null), []);
});

test('切页：每页 48 条时全集恰好被覆盖一次', () => {
  const games = Array.from({ length: 100 }, (_, index) => ({
    pkg: `com.example.app${String(index).padStart(3, '0')}`,
    name: `App ${index}`,
  }));
  const seen = [];
  const first = sliceCatalogPage(games, 1, 48);
  assert.equal(first.total, 100);
  assert.equal(first.totalPages, 3);
  for (let page = 1; page <= first.totalPages; page += 1) {
    seen.push(...sliceCatalogPage(games, page, 48).games.map((game) => game.pkg));
  }
  assert.equal(seen.length, games.length);
  assert.equal(new Set(seen).size, games.length);
});

test('切页：越界页与空目录返回空数组，但总页数仍为真实值', () => {
  const games = Array.from({ length: 10 }, (_, index) => ({ pkg: `com.a.b${index}`, name: `G${index}` }));
  assert.deepEqual(sliceCatalogPage(games, 3, 48).games, []);
  assert.equal(sliceCatalogPage(games, 3, 48).totalPages, 1);
  assert.deepEqual(sliceCatalogPage([], 1, 48), { games: [], totalPages: 1, total: 0 });
});
