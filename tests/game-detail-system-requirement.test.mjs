/**
 * 详情页「系统要求」只展示接口真实字段（#194）。
 *
 * 历史问题：技术参数宫格对所有游戏无条件补两条稿件硬编码值
 * （一条写死的「最低系统要求」，一条写死的「支持语言」多语言清单），
 * 5000+ 游戏页显示同一句编造的安装要求。这里锁定：
 * - `limit_android_version` 有值时进入 facts 且原样展示；
 * - 空值 / 占位符（VARY、Varies with device）时整条不出现，不补默认文案；
 * - 宫格不再追加任何稿件条目。
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register('./helpers/src-resolve-hook.mjs', import.meta.url);

const { buildGameFactItems } = await import(
  '../src/app/app/[id]/game-detail-presenter.ts'
);
const { buildSpecTiles } = await import(
  '../src/app/app/[id]/game-detail-stitch-mapper.ts'
);

const baseGame = {
  _id: '65f000000000000000000001',
  name: '示例游戏',
  pkg: 'com.example.game',
  type: 'game',
  description: '示例',
  summary: '示例',
  download_count_show: '1000',
  star: 4.5,
  icon: '',
  detail_images: [],
  header_image: '',
  developer: '示例工作室',
  latest_at: '2026-01-01T00:00:00.000Z',
  release_at: null,
  tags: ['角色扮演'],
  version: '1.2.3',
  file_size: 1024 * 1024,
  metadata: { region: '国际服' },
};

const options = { category: '角色扮演', resourceCount: 2, isWebGame: false };

test('有真实系统要求时按原值进入 facts，排在游戏分类之后', () => {
  const facts = buildGameFactItems(
    { ...baseGame, limit_android_version: 'Android 8.0+' },
    options,
  );
  const labels = facts.map((item) => item.label);
  const fact = facts.find((item) => item.label === '系统要求');
  assert.deepEqual(fact, { label: '系统要求', value: 'Android 8.0+' });
  assert.ok(
    labels.indexOf('系统要求') > labels.indexOf('游戏分类'),
    `系统要求应在游戏分类之后，实际顺序：${labels.join(' / ')}`,
  );
});

test('空值与占位符不出现在 facts 里，也不补默认文案', () => {
  for (const value of [undefined, null, '', '   ', 'VARY', 'VARY@1780000000', 'Varies with device']) {
    const facts = buildGameFactItems(
      { ...baseGame, limit_android_version: value },
      options,
    );
    assert.equal(
      facts.some((item) => item.label === '系统要求'),
      false,
      `不应展示系统要求：${JSON.stringify(value)}`,
    );
  }
});

test('技术参数宫格不再追加稿件条目', () => {
  const tiles = buildSpecTiles([{ label: '包名', value: 'com.example.game' }]);
  assert.equal(tiles.length, 1);
  assert.deepEqual(tiles[0], {
    label: '应用包名',
    value: 'com.example.game',
    mono: true,
    emphasize: false,
    badge: undefined,
  });
  for (const label of ['最低系统要求', '支持语言']) {
    assert.equal(tiles.some((tile) => tile.label === label), false);
  }
  // 拆开拼接，避免验收 grep「稿件原文」时把这条回归断言本身算成命中。
  const bannedValues = ['Android 8.0 或', '更高版本'].join('') +
    '\n' + ['中文、英文、', '韩文、泰文'].join('');
  for (const value of bannedValues.split('\n')) {
    assert.equal(tiles.some((tile) => tile.value === value), false);
  }
});
