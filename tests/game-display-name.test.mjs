import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  GAME_NAME_LOCALES,
  resolveGameName,
} from '../src/lib/game-display-name.ts';

const readSource = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8');

test('默认按后台维护的简体名渲染，不再直接用 Google Play 原名', () => {
  const game = {
    name: 'プロジェクトセカイ：feat.初音ミク',
    pkg: 'com.sega.pjsekai',
    metadata: { chs: '世界计划：初音未来日服', cht: '', en: '' },
  };
  assert.equal(resolveGameName(game), '世界计划：初音未来日服');
});

test('繁体与英文语种各自取对应字段', () => {
  const game = {
    name: 'Project SEKAI',
    pkg: 'com.sega.pjsekai',
    metadata: {
      chs: '世界计划：初音未来日服',
      cht: '世界計畫：初音未來日服',
      en: 'Project SEKAI: Colorful Stage',
    },
  };
  assert.equal(resolveGameName(game, 'zh-TW'), '世界計畫：初音未來日服');
  assert.equal(resolveGameName(game, 'en'), 'Project SEKAI: Colorful Stage');
});

test('目标语种缺失时逐级回退，最终退到原名与包名', () => {
  assert.equal(
    resolveGameName({ name: '原名', pkg: 'a.b', metadata: { chs: '中文名' } }, 'zh-TW'),
    '中文名',
  );
  assert.equal(resolveGameName({ name: '原名', pkg: 'a.b', metadata: {} }), '原名');
  assert.equal(resolveGameName({ name: '', pkg: 'a.b' }), 'a.b');
});

test('metadata 缺失或字段为空白时安全退化，不渲染空白', () => {
  assert.equal(resolveGameName(null), '');
  assert.equal(resolveGameName(undefined), '');
  assert.equal(resolveGameName({ name: '原名' }), '原名');
  assert.equal(
    resolveGameName({ name: '原名', metadata: { chs: '   ', cht: '', en: '' } }),
    '原名',
  );
});

test('语种表与回退表一一对应', () => {
  assert.deepEqual([...GAME_NAME_LOCALES], ['zh-CN', 'zh-TW', 'en']);
});

test('首页、搜索、游戏库、详情页都走统一名称解析', async () => {
  const targets = {
    home: '../src/app/page.tsx',
    search: '../src/lib/search-api.ts',
    library: '../src/app/app/AppLibraryView.tsx',
    detailPage: '../src/app/app/[id]/page.tsx',
    detailView: '../src/app/app/[id]/GameDetailView.tsx',
    detailActions: '../src/app/app/[id]/GameDetailActions.client.tsx',
    detailPresenter: '../src/app/app/[id]/game-detail-presenter.ts',
    rankings: '../src/app/rankings/page.tsx',
    album: '../src/components/albums/AlbumTopicView.tsx',
    recentUpdates: '../src/components/home/RecentUpdatesSection.tsx',
  };
  for (const [name, path] of Object.entries(targets)) {
    const source = await readSource(path);
    assert.match(source, /resolveGameName/, name + ' 未使用 resolveGameName');
  }
});

test('搜索结果把游戏条目的 Google Play 原名换成了展示名', async () => {
  const source = await readSource('../src/lib/search-api.ts');
  assert.match(source, /type === 'game'/);
  assert.match(source, /resolveGameName\(\{/);
});
