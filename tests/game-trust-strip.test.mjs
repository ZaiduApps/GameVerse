import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { buildGameTrustItems } from '@/lib/game-trust-strip';

// 派发单 #180 验收 3：首屏可信信息条的五种输入 + 「缺项不渲染 / 无校验值不渲染角标」。
// 口径：任一项取不到就不生成该条，不写「未知」「暂无」「—」占位。

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const [viewSource, mockCopySource] = await Promise.all([
  readSource('../src/app/app/[id]/GameDetailView.tsx'),
  readSource('../src/app/app/[id]/game-detail-mock-copy.ts'),
]);

const SHA256_A = 'a'.repeat(64);
const SHA256_B = 'b'.repeat(64);

const resource = (id, name, signature) => ({
  _id: id,
  channel: { _id: id, name, icon: '', code: id },
  signature,
});

const keysOf = (items) => items.map((item) => item.key);
const valuesOf = (items) => items.map((item) => item.value);

test('全字段：版本 / 包大小 / 更新日期 / 来源 / SHA-256 覆盖按序生成', () => {
  const items = buildGameTrustItems({
    version: '4.6.0',
    fileSize: 1291815457,
    updatedAt: '2026-09-10T02:00:01.253Z',
    sourceType: 'GP',
    resources: [
      resource('r1', '官网下载', SHA256_A),
      resource('r2', 'apkpure', ''),
      resource('r3', '123云盘', SHA256_B),
    ],
  });

  assert.deepEqual(keysOf(items), ['version', 'size', 'updated', 'source', 'checksum']);
  assert.deepEqual(
    items.map((item) => item.label),
    ['版本', '包大小', '更新日期', '来源', 'SHA-256'],
  );
  assert.equal(items[0].value, '4.6.0');
  assert.equal(items[2].value, '2026-09-10');
  assert.equal(items[3].value, 'Google Play');
  assert.equal(items[4].value, '2/3 渠道');
});

test('缺包大小：只跳过包大小一项，其余照常渲染', () => {
  const items = buildGameTrustItems({
    version: '1.2.0',
    fileSize: null,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'APKPURE',
    resources: [resource('r1', '官网下载', SHA256_A)],
  });

  assert.deepEqual(keysOf(items), ['version', 'updated', 'source', 'checksum']);
  assert.equal(valuesOf(items).includes('0 B'), false);
});

test('无校验值：不生成 SHA-256 条，首屏角标也不渲染', () => {
  const withoutResources = buildGameTrustItems({
    version: '1.2.0',
    fileSize: 52428800,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'GP',
    resources: [],
  });
  assert.equal(keysOf(withoutResources).includes('checksum'), false);

  const withoutSignatures = buildGameTrustItems({
    version: '1.2.0',
    fileSize: 52428800,
    resources: [resource('r1', '官网下载', ''), resource('r2', 'apkpure', 'not-a-hash')],
  });
  assert.equal(keysOf(withoutSignatures).includes('checksum'), false);

  // 角标（图标右下角绿色小徽章）只在有合法校验值时出现。
  assert.match(viewSource, /\{checksumItems\.length > 0 \? \(/);
  assert.match(viewSource, /title="已提供 SHA-256 校验值"/);
  assert.doesNotMatch(viewSource, /已通过官方安全校验/);
});

test('非游戏（web）：不生成包大小与 SHA-256，其余真实字段保留', () => {
  const items = buildGameTrustItems({
    version: '1.2.0',
    fileSize: 52428800,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'GITHUB',
    resources: [resource('r1', '官网下载', SHA256_A)],
    isWebGame: true,
  });

  assert.deepEqual(keysOf(items), ['version', 'updated', 'source']);
  assert.equal(valuesOf(items).some((value) => /MB|GB|渠道/.test(value)), false);
});

test('VARY 占位版本：按缺失处理，不渲染版本条', () => {
  const bare = buildGameTrustItems({
    version: 'VARY',
    fileSize: 52428800,
    updatedAt: '2026-10-23T10:41:15.000Z',
    sourceType: 'GP',
  });
  assert.deepEqual(keysOf(bare), ['size', 'updated', 'source']);

  const proxied = buildGameTrustItems({ version: 'VARY@1730000000', fileSize: 52428800 });
  assert.deepEqual(keysOf(proxied), ['size']);
});

test('全部缺失时返回空数组，任何条目都不出现占位文案', () => {
  assert.deepEqual(buildGameTrustItems({}), []);
  assert.deepEqual(buildGameTrustItems(), []);

  const items = buildGameTrustItems({
    version: '4.6.0',
    fileSize: 1291815457,
    updatedAt: '2026-09-10T02:00:01.253Z',
    sourceType: 'GP',
    resources: [resource('r1', '官网下载', SHA256_A)],
  });
  for (const item of items) {
    assert.doesNotMatch(item.value, /未知|暂无|—|^-$/);
    assert.doesNotMatch(item.label, /未知|暂无|—/);
  }
});

test('详情页接入信任条，mock 文案里的无证据安全承诺已清除', () => {
  assert.match(viewSource, /<GameTrustStrip items=\{trustItems\}/);
  assert.doesNotMatch(mockCopySource, /VirusTotal|360 核心安全卫士|100% 提取自 Google Play/);
  assert.doesNotMatch(mockCopySource, /官方原包|未篡改|已通过官方安全校验/);
  assert.doesNotMatch(mockCopySource, /CERTIFICATION_CARD|SIGNATURE_VERIFY_TILE|HERO_TRUST_BADGES/);
});
