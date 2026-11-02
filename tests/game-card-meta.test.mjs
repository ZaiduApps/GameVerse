import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGameCardMeta, formatCardUpdateDate, resolveGameSourceLabel } from '@/lib/game-card-meta';

// 派发单 #125 验收 3：卡片直下信息（版本/大小/更新时间/来源）的纯函数断言。
// 缺字段一律空串（渲染层条件跳过），绝不产生「未知」占位。

test('来源标签映射与详情页 source_type 口径一致', () => {
  assert.equal(resolveGameSourceLabel('GP'), 'Google Play');
  assert.equal(resolveGameSourceLabel('APKPURE'), 'APKPure');
  assert.equal(resolveGameSourceLabel('GITHUB'), 'GitHub');
  assert.equal(resolveGameSourceLabel('QOO'), '第三方');
  assert.equal(resolveGameSourceLabel('工口实验室'), '第三方');
  assert.equal(resolveGameSourceLabel(''), '');
  assert.equal(resolveGameSourceLabel(null), '');
  assert.equal(resolveGameSourceLabel(undefined), '');
});

test('更新时间格式化为固定 YYYY-MM-DD，非法值返回空串', () => {
  assert.equal(formatCardUpdateDate('2026-10-23T10:41:15.000Z'), '2026-10-23');
  assert.equal(formatCardUpdateDate('2026-10-23'), '2026-10-23');
  assert.equal(formatCardUpdateDate('not-a-date'), '');
  assert.equal(formatCardUpdateDate(''), '');
  assert.equal(formatCardUpdateDate(null), '');
});

test('版本/大小齐全时全部展示', () => {
  const meta = buildGameCardMeta({
    version: '4.6.0',
    fileSize: 52428800,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'GP',
  });
  assert.equal(meta.version, '4.6.0');
  assert.equal(meta.sizeText, '50.00 MB');
  assert.equal(meta.updatedText, '2026-10-23');
  assert.equal(meta.sourceLabel, 'Google Play');
});

test('缺字段的卡片不产生占位：单项缺失为空串', () => {
  const noVersionNoSize = buildGameCardMeta({
    version: '',
    fileSize: null,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'APKPURE',
  });
  assert.equal(noVersionNoSize.version, '');
  assert.equal(noVersionNoSize.sizeText, '');
  assert.equal(noVersionNoSize.updatedText, '2026-10-23');
  assert.equal(noVersionNoSize.sourceLabel, 'APKPure');

  const nothing = buildGameCardMeta({});
  assert.deepEqual(nothing, { version: '', sizeText: '', updatedText: '', sourceLabel: '' });
});

test('file_size 为 0 或负数按缺失处理，不渲染 0 B', () => {
  assert.equal(buildGameCardMeta({ fileSize: 0 }).sizeText, '');
  assert.equal(buildGameCardMeta({ fileSize: -1 }).sizeText, '');
});

test('非版本号文本（如「因设备而异」）不渲染版本', () => {
  assert.equal(buildGameCardMeta({ version: '因设备而异' }).version, '');
  assert.equal(buildGameCardMeta({ version: '1.20.5' }).version, '1.20.5');
  assert.equal(buildGameCardMeta({ version: '18.5-5722094' }).version, '18.5-5722094');
});
