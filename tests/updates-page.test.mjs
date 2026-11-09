import assert from 'node:assert/strict';
import test from 'node:test';

import {
  UPDATES_LIMIT,
  UPDATES_PATH,
  UPDATES_WINDOW_DAYS,
  buildUpdateCard,
  buildUpdatesJsonLd,
  buildUpdatesMetadata,
  normalizeUpdatedGamesPayload,
} from '@/lib/updates-page';

// 派发单 #181 T181-2：/updates 卡片字段缺项隐藏、空数据 robots/canonical、JSON-LD 项数。
// 口径：字段一律复用 buildGameTrustItems，缺项不渲染；空数据不输出 ItemList。

function row(overrides = {}) {
  return {
    _id: '67f000000000000000000001',
    pkg: 'com.demo.game',
    name: 'Demo Game',
    icon: 'https://play-lh.googleusercontent.com/demo=w240',
    version: '4.6.0',
    file_size: 1291815457,
    latest_at: '2026-11-08T02:00:01.253Z',
    source_type: 'GP',
    metadata: { chs: '演示游戏', en: 'Demo Game' },
    update_note: '修复了多人模式下的闪退问题。',
    ...overrides,
  };
}

test('载荷归一：兼容 {data:{list}} 与 {list}，丢弃没有 pkg/_id 的脏行', () => {
  const wrapped = normalizeUpdatedGamesPayload({
    code: 0,
    data: { list: [row(), { name: 'No target' }, null] },
  });
  assert.equal(wrapped.length, 1);
  assert.equal(wrapped[0].pkg, 'com.demo.game');

  const direct = normalizeUpdatedGamesPayload({ list: [row({ _id: 'abc', pkg: '' })] });
  assert.equal(direct.length, 1);
  assert.equal(direct[0].pkg, '');

  assert.deepEqual(normalizeUpdatedGamesPayload(null), []);
  assert.deepEqual(normalizeUpdatedGamesPayload({ data: { list: 'nope' } }), []);
});

test('完整字段：名称取 metadata.chs，版本/大小/日期/来源复用信任条口径，摘要按原文展示', () => {
  const card = buildUpdateCard(normalizeUpdatedGamesPayload({ list: [row()] })[0]);
  assert.ok(card);
  assert.equal(card.name, '演示游戏');
  assert.equal(card.href, '/app/com.demo.game');
  assert.equal(card.updateNote, '修复了多人模式下的闪退问题。');
  assert.deepEqual(
    card.trustItems.map((item) => item.key),
    ['version', 'size', 'updated', 'source'],
  );
  assert.deepEqual(
    card.trustItems.map((item) => item.value),
    ['4.6.0', '1.20 GB', '2026-11-08', 'Google Play'],
  );
});

test('缺项隐藏：VARY 占位版本、空大小、非法日期、空来源都不生成条目', () => {
  const card = buildUpdateCard({
    _id: 'abc',
    pkg: 'com.demo.missing',
    name: '',
    version: 'VARY',
    file_size: null,
    latest_at: 'not-a-date',
    source_type: '',
    update_note: '',
  });
  assert.ok(card);
  // 名称回退到包名，不能渲染空白。
  assert.equal(card.name, 'com.demo.missing');
  assert.deepEqual(card.trustItems, []);
  assert.equal(card.updateNote, '');
});

test('没有可用目标时卡片为 null', () => {
  assert.equal(buildUpdateCard({ _id: '', pkg: '', name: 'x' }), null);
  assert.equal(buildUpdateCard(null), null);
});

test('空数据分支：noindex, follow，canonical 仍为 /updates', () => {
  const metadata = buildUpdatesMetadata({ hasItems: false, siteName: 'APKScc' });
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates.canonical, UPDATES_PATH);
});

test('有数据分支：index, follow，canonical 为 /updates', () => {
  const metadata = buildUpdatesMetadata({ hasItems: true, siteName: 'APKScc' });
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.robots.follow, true);
  assert.equal(metadata.alternates.canonical, UPDATES_PATH);
  assert.equal(metadata.alternates.languages['x-default'], UPDATES_PATH);
});

test('JSON-LD：CollectionPage 恒定输出，ItemList 项数等于卡片数', () => {
  const cards = [
    buildUpdateCard(row({ _id: 'a', pkg: 'com.a' })),
    buildUpdateCard(row({ _id: 'b', pkg: 'com.b' })),
    buildUpdateCard(row({ _id: 'c', pkg: 'com.c' })),
  ].filter(Boolean);

  const jsonLd = buildUpdatesJsonLd({ cards, siteName: 'APKScc' });
  assert.equal(jsonLd.collectionPage['@type'], 'CollectionPage');
  assert.ok(jsonLd.itemList);
  assert.equal(jsonLd.itemList['@type'], 'ItemList');
  assert.equal(jsonLd.itemList.numberOfItems, cards.length);
  assert.equal(jsonLd.itemList.itemListElement.length, cards.length);
  assert.equal(jsonLd.itemList.itemListElement[0].position, 1);
  assert.equal(jsonLd.itemList.itemListElement[2].url, 'https://apks.cc/app/com.c');
});

test('JSON-LD 空数据不输出 ItemList', () => {
  const jsonLd = buildUpdatesJsonLd({ cards: [], siteName: 'APKScc' });
  assert.equal(jsonLd.collectionPage['@type'], 'CollectionPage');
  assert.equal(jsonLd.itemList, undefined);
});

test('固定窗口与条数：7 天 / 30 条', () => {
  assert.equal(UPDATES_WINDOW_DAYS, 7);
  assert.equal(UPDATES_LIMIT, 30);
});
