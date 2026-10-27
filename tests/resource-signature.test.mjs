import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildResourceChecksumItems,
  normalizeResourceSignature,
  shortenResourceSignature,
} from '../src/lib/game-resource-signature.ts';
import { renderTsx } from './helpers/render-tsx.mjs';

const CHECKSUMS_VIEW = new URL('../src/app/app/[id]/GameResourceChecksums.client.tsx', import.meta.url).pathname;

const SHA256 = 'a3f1b2c4d5e60718293a4b5c6d7e8f9012345678abcdef0123456789abcdef01';

function resource(overrides = {}) {
  return {
    _id: overrides._id || 'res-1',
    channel: { _id: 'c1', name: overrides.channelName || '本地 CDN', icon: '', code: 'local' },
    version: overrides.version,
    signature: overrides.signature,
  };
}

test('有校验值时归一化为小写并保留完整值', () => {
  assert.equal(normalizeResourceSignature(SHA256.toUpperCase()), SHA256);
  assert.equal(normalizeResourceSignature(`  sha256:${SHA256}  `), SHA256);
  assert.equal(normalizeResourceSignature(`SHA-256 = ${SHA256}`), SHA256);
});

test('空值与非哈希内容一律视为无校验值', () => {
  assert.equal(normalizeResourceSignature(''), '');
  assert.equal(normalizeResourceSignature(null), '');
  assert.equal(normalizeResourceSignature(undefined), '');
  assert.equal(normalizeResourceSignature('暂无'), '');
  assert.equal(normalizeResourceSignature('https://example.com/file.apk'), '');
  assert.equal(normalizeResourceSignature('not-a-hash-value'), '');
});

test('截断显示保留首尾且短值原样返回', () => {
  assert.equal(shortenResourceSignature(SHA256), `${SHA256.slice(0, 12)}…${SHA256.slice(-8)}`);
  assert.equal(shortenResourceSignature('abcd1234'), 'abcd1234');
  assert.equal(shortenResourceSignature(''), '');
});

test('每个有校验值的渠道生成一条记录，无值的渠道不占位', () => {
  const items = buildResourceChecksumItems([
    resource({ _id: 'r1', channelName: '本地 CDN', signature: SHA256, version: '1.2.3' }),
    resource({ _id: 'r2', channelName: '官方站点', signature: '' }),
    resource({ _id: 'r3', channelName: '备用渠道', signature: SHA256.slice(0, 32) }),
  ]);

  assert.equal(items.length, 2);
  assert.deepEqual(
    items.map((item) => [item.resourceId, item.channelName, item.version, item.signature]),
    [
      ['r1', '本地 CDN', '1.2.3', SHA256],
      ['r3', '备用渠道', '', SHA256.slice(0, 32)],
    ],
  );
  assert.equal(items[0].signatureShort, `${SHA256.slice(0, 12)}…${SHA256.slice(-8)}`);
});

test('资源列表为空或缺省时返回空数组', () => {
  assert.deepEqual(buildResourceChecksumItems(undefined), []);
  assert.deepEqual(buildResourceChecksumItems(null), []);
  assert.deepEqual(buildResourceChecksumItems([]), []);
});

test('有值态渲染渠道名、截断值与复制按钮', async () => {
  const items = buildResourceChecksumItems([resource({ channelName: '本地 CDN', signature: SHA256, version: '1.2.3' })]);
  const html = await renderTsx(CHECKSUMS_VIEW, { items });

  assert.match(html, /本地 CDN/);
  assert.match(html, /v1\.2\.3/);
  assert.match(html, /SHA-256：/);
  assert.match(html, new RegExp(`${SHA256.slice(0, 12)}…${SHA256.slice(-8)}`));
  assert.match(html, /复制完整校验值/);
  assert.match(html, /aria-label="复制 本地 CDN 的 SHA-256 校验值"/);
  assert.doesNotMatch(html, /暂无校验值/);
});

test('无值态渲染「暂无校验值」且没有复制入口', async () => {
  const html = await renderTsx(CHECKSUMS_VIEW, { items: [] });

  assert.match(html, /暂无校验值/);
  assert.doesNotMatch(html, /复制完整校验值/);
});
