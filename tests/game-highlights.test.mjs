/**
 * 详情页「游戏特色」版本号渲染口径（#171）。
 *
 * 历史问题：`seo.highlights` 里存的是写死的「当前版本 vX」，版本推进后页面仍挂旧版本号。
 * 这里锁定：渲染时用实时 app.version 覆盖；VARY / 无版本回落中性文案；非版本文案不动。
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import test from 'node:test';

register('./helpers/src-resolve-hook.mjs', import.meta.url);

const { applyLiveVersionHighlights, HIGHLIGHT_FALLBACK_VERSION_TEXT } = await import(
  '../src/app/app/[id]/game-detail-highlights.ts'
);

const fixture = [
  '支持离线游玩',
  '当前版本 v0.30.25.0.2828873',
  '提供国际服版本信息',
];

test('普通版本：存量旧版本号被实时版本覆盖，其它条目原样保留', () => {
  const result = applyLiveVersionHighlights(fixture, '1.4.2');
  assert.deepEqual(result, [
    '支持离线游玩',
    '当前版本 v1.4.2',
    '提供国际服版本信息',
  ]);
  assert.ok(!result.join(' ').includes('0.30.25.0.2828873'));
});

test('保留原条目的冒号与 v 前缀写法', () => {
  assert.deepEqual(applyLiveVersionHighlights(['当前版本：0.9.9'], '2.0.0'), [
    '当前版本：2.0.0',
  ]);
  assert.deepEqual(applyLiveVersionHighlights(['当前版本: v0.9.9'], '2.0.0'), [
    '当前版本:v2.0.0',
  ]);
});

test('VARY 多分轨：不渲染 vVARY，回落中性文案', () => {
  const result = applyLiveVersionHighlights(['当前版本 v0.30.25.0'], 'VARY');
  assert.deepEqual(result, [HIGHLIGHT_FALLBACK_VERSION_TEXT]);
  assert.doesNotMatch(result.join(' '), /VARY/i);

  const proxy = applyLiveVersionHighlights(['版本 v0.30.25.0'], 'VARY@1780000000');
  assert.deepEqual(proxy, [HIGHLIGHT_FALLBACK_VERSION_TEXT]);
  assert.doesNotMatch(proxy.join(' '), /VARY/i);
});

test('无版本：空值 / 占位符都回落中性文案', () => {
  for (const liveVersion of ['', null, undefined, '   ', 'vVARY']) {
    assert.deepEqual(
      applyLiveVersionHighlights(['当前版本 v1.0.0'], liveVersion),
      [HIGHLIGHT_FALLBACK_VERSION_TEXT],
      `实时版本为 ${String(liveVersion)} 时应回落中性文案`,
    );
  }
});

test('非版本条目与空输入不被改写', () => {
  assert.deepEqual(applyLiveVersionHighlights(['版本更新：修复闪退'], '1.2.3'), [
    '版本更新：修复闪退',
  ]);
  assert.deepEqual(applyLiveVersionHighlights([], '1.2.3'), []);
  assert.deepEqual(applyLiveVersionHighlights(undefined, '1.2.3'), []);
});

test('详情页渲染链路实际调用实时版本覆盖', async () => {
  const viewSource = await readFile(
    new URL('../src/app/app/[id]/GameDetailView.tsx', import.meta.url),
    'utf8',
  );
  assert.match(
    viewSource,
    /applyLiveVersionHighlights\(game\.seo\?\.highlights, game\.version\)/,
    'GameDetailView 必须用实时 game.version 重写 highlights 版本号',
  );
  assert.doesNotMatch(
    viewSource,
    /game\.seo\.highlights\.map\(cleanText\)/,
    '不得退回直接渲染存量 highlights 文案',
  );
});
