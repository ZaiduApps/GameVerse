/**
 * 版本占位符（Google Play 对分轨发布的包返回字面 `VARY`）的展示口径。
 *
 * 历史缺陷：`VARY` 被原样存进 app.version，GameVerse 无条件下拼 `v` 前缀，
 * 详情页渲染出 `vVARY`。这里锁定：
 * - 占位符识别收敛到 `isPlaceholderVersion` / `resolveDisplayVersion`；
 * - 详情页主按钮、最新更新、卡片、SEO 模板都不再输出占位符；
 * - 真实版本号仍正常带 `v` 前缀。
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register('./helpers/src-resolve-hook.mjs', import.meta.url);

const { buildLatestUpdate, buildPrimaryActionMeta } = await import(
  '../src/app/app/[id]/game-detail-stitch-mapper.ts'
);
const { buildGameCardMeta } = await import('../src/lib/game-card-meta.ts');
const { buildGameVariantRows } = await import('../src/lib/game-detail-variants.ts');
const { isPlaceholderVersion, resolveDisplayVersion } = await import(
  '../src/lib/game-version.ts'
);
const { normalizeSeoTemplateVersion } = await import('../src/lib/seo.ts');

test('isPlaceholderVersion 同时认裸 VARY 与代理版本 VARY@<epoch>', () => {
  for (const value of ['VARY', 'vary', ' VARY ', 'vVARY', 'VARY@1780000000']) {
    assert.equal(isPlaceholderVersion(value), true, `应识别为占位符：${String(value)}`);
  }
  for (const value of ['1.2.3', 'v1.2.3', '160402020', 'VAR', '', null, undefined]) {
    assert.equal(isPlaceholderVersion(value), false, `不应识别为占位符：${String(value)}`);
  }
});

test('resolveDisplayVersion 把占位符和空值统一成空串', () => {
  assert.equal(resolveDisplayVersion('VARY'), '');
  assert.equal(resolveDisplayVersion('vVARY'), '');
  assert.equal(resolveDisplayVersion('VARY@1780000000'), '');
  assert.equal(resolveDisplayVersion(''), '');
  assert.equal(resolveDisplayVersion(' 1.2.3 '), '1.2.3');
});

test('详情页主按钮不再出现 vVARY，真实版本仍带 v 前缀', () => {
  assert.equal(buildPrimaryActionMeta({ version: 'VARY' }), '版本信息待补充');
  assert.equal(buildPrimaryActionMeta({ version: 'VARY@1780000000' }), '版本信息待补充');
  assert.equal(
    buildPrimaryActionMeta({ version: 'VARY@1780000000', file_size: 188743680 }),
    '180.00 MB',
  );
  assert.equal(
    buildPrimaryActionMeta({ version: '1.2.3', file_size: 188743680 }),
    'v1.2.3 · 180.00 MB',
  );
});

test('最新更新标题回落到既有「版本信息待补充」文案', () => {
  const placeholder = buildLatestUpdate({ version: 'VARY', latest_at: null }, '');
  assert.doesNotMatch(placeholder.versionLabel, /VARY/i);
  assert.equal(placeholder.versionLabel, '版本信息待补充');

  const real = buildLatestUpdate({ version: '1.2.3', latest_at: null }, '');
  assert.equal(real.versionLabel, '版本 v1.2.3');
});

test('卡片与渠道变体表把占位符当空值，不展示 VARY', () => {
  assert.equal(buildGameCardMeta({ version: 'VARY' }).version, '');

  const rows = buildGameVariantRows(
    [{ channel: { _id: 'channel-gp', name: 'Google Play' }, version: 'VARY' }],
    'com.example.placeholder',
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].version, '');
});

test('SEO 模板版本号把占位符当空值，不拼成 vVARY / vARY', () => {
  assert.equal(normalizeSeoTemplateVersion('VARY'), '');
  assert.equal(normalizeSeoTemplateVersion('vVARY'), '');
  assert.equal(normalizeSeoTemplateVersion('VARY@1780000000'), '');
  assert.equal(normalizeSeoTemplateVersion('1.2.3'), 'v1.2.3');
});
