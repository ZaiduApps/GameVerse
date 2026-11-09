import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildDownloadLandingMetadata,
  buildDownloadLandingView,
  buildInstallTroubleshootingLinks,
  selectLandingResource,
} from '@/lib/download-landing';

// 派发单 #179 T179-2：落地页的资源匹配、缺项隐藏、canonical / robots 输出。
// 展示口径复用 #180 的 buildGameTrustItems，这里只锁「页面怎么选、怎么隐藏」。

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const PKG = 'com.demo.game';
const CHANNEL = '67f000000000000000000333';
const CHANNEL_OTHER = '67f000000000000000000444';

function resource(overrides = {}) {
  return {
    _id: overrides._id || `res-${overrides.channelId || CHANNEL}`,
    channel_id: overrides.channelId || CHANNEL,
    channel: {
      _id: overrides.channelId || CHANNEL,
      name: overrides.channelName || '官网下载',
      icon: '',
      code: 'official',
    },
    version: overrides.version,
    size: overrides.size,
    signature: overrides.signature,
    status: overrides.status,
    is_latest_version: overrides.isLatest,
  };
}

function app(overrides = {}) {
  return {
    _id: '67f000000000000000000222',
    name: 'Demo Game',
    pkg: PKG,
    type: 'game',
    icon: 'https://cdn.example.com/icon.png',
    version: '4.6.0',
    file_size: 1291815457,
    latest_at: '2026-11-01T02:00:01.253Z',
    source_type: 'GP',
    metadata: { chs: '演示游戏' },
    ...overrides,
  };
}

test('资源匹配：命中目标渠道，未命中返回 null', () => {
  const resources = [
    resource({ channelId: CHANNEL_OTHER, channelName: '123云盘' }),
    resource({ channelId: CHANNEL, channelName: '官网下载' }),
  ];

  assert.equal(selectLandingResource(resources, CHANNEL)?.channel?.name, '官网下载');
  assert.equal(selectLandingResource(resources, '67f000000000000000000999'), null);
  assert.equal(selectLandingResource([], CHANNEL), null);
  assert.equal(selectLandingResource(null, CHANNEL), null);
});

test('多资源同渠道：优先 is_latest_version，其次 status=1，再次第一条', () => {
  const oldLatest = resource({ _id: 'a', version: '1.0.0', isLatest: false, status: 1 });
  const current = resource({ _id: 'b', version: '2.0.0', isLatest: true, status: 1 });
  assert.equal(selectLandingResource([oldLatest, current], CHANNEL)?.version, '2.0.0');

  const active = resource({ _id: 'c', version: '3.0.0', status: 1 });
  const inactive = resource({ _id: 'd', version: '0.9.0', status: 0 });
  assert.equal(selectLandingResource([inactive, active], CHANNEL)?.version, '3.0.0');

  const first = resource({ _id: 'e', version: '9.9.9' });
  const second = resource({ _id: 'f', version: '8.8.8' });
  assert.equal(selectLandingResource([first, second], CHANNEL)?.version, '9.9.9');
});

test('完整字段：展示名取 metadata.chs，版本/大小/日期/来源复用信任条口径', () => {
  const view = buildDownloadLandingView({
    app: app(),
    resources: [
      resource({
        version: '4.6.1',
        size: 52428800,
        signature: 'a'.repeat(64),
        isLatest: true,
        status: 1,
      }),
    ],
    channelId: CHANNEL,
    fallbackId: PKG,
  });

  assert.ok(view);
  assert.equal(view.gameName, '演示游戏');
  assert.equal(view.channelName, '官网下载');
  assert.equal(view.pkg, PKG);
  assert.equal(view.version, '4.6.1');
  assert.equal(view.sizeText, '50.00 MB');
  assert.equal(view.updatedText, '2026-11-01');
  assert.equal(view.sourceLabel, 'Google Play');
  assert.equal(view.signatureShort, 'a'.repeat(12));
  assert.equal(view.signature, 'a'.repeat(64));
  assert.deepEqual(
    view.trustItems.map((item) => item.key),
    ['version', 'size', 'updated', 'source', 'checksum'],
  );
  assert.equal(view.continueHref, `/app/${PKG}/download/${CHANNEL}?confirm=1`);
  assert.equal(view.detailHref, `/app/${PKG}`);
});

test('缺字段隐藏：没有大小/校验值/更新日期时不生成占位条目', () => {
  const view = buildDownloadLandingView({
    app: app({ file_size: null, latest_at: '', source_type: null }),
    resources: [resource({ version: '1.0.0', isLatest: true, status: 1 })],
    channelId: CHANNEL,
    fallbackId: PKG,
  });

  assert.ok(view);
  assert.equal(view.sizeText, '');
  assert.equal(view.updatedText, '');
  assert.equal(view.sourceLabel, '');
  assert.equal(view.signatureShort, '');
  assert.equal(view.signature, '');
  assert.deepEqual(
    view.trustItems.map((item) => item.key),
    ['version'],
  );
  for (const item of view.trustItems) {
    assert.doesNotMatch(item.value, /未知|暂无|—/);
  }
});

test('资源版本优先于应用版本；应用 pkg 缺失时用 URL 原始标识兜底', () => {
  const view = buildDownloadLandingView({
    app: app({ pkg: '' }),
    resources: [resource({ version: '7.0.0', isLatest: true, status: 1 })],
    channelId: CHANNEL,
    fallbackId: 'com.fallback.game',
  });

  assert.ok(view);
  assert.equal(view.version, '7.0.0');
  assert.equal(view.pkg, 'com.fallback.game');
  assert.equal(view.canonicalPath, '/app/com.fallback.game');
  assert.equal(view.continueHref, `/app/com.fallback.game/download/${CHANNEL}?confirm=1`);
});

test('渠道匹配不到：返回 null（页面据此渲染「该渠道暂不可用」而不是空壳）', () => {
  assert.equal(
    buildDownloadLandingView({
      app: app(),
      resources: [resource({ channelId: CHANNEL_OTHER })],
      channelId: CHANNEL,
      fallbackId: PKG,
    }),
    null,
  );
  assert.equal(buildDownloadLandingView({ app: null, channelId: CHANNEL }), null);
});

test('metadata：noindex + follow，canonical 指回详情页', () => {
  const metadata = buildDownloadLandingMetadata({
    pkg: PKG,
    gameName: '演示游戏',
    channelName: '官网下载',
  });

  assert.equal(metadata.title, '演示游戏 下载（官网下载）');
  assert.equal(metadata.alternates.canonical, `/app/${PKG}`);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.doesNotMatch(metadata.description, /未知|暂无/);
});

test('排障入口覆盖五类，权限一节指向 #permission', () => {
  const links = buildInstallTroubleshootingLinks();
  assert.equal(links.length, 5);
  assert.deepEqual(
    links.map((item) => item.href),
    [
      '/help/install#parse_error',
      '/help/install#storage_full',
      '/help/install#install_failed',
      '/help/install#permission',
      '/submit-resource',
    ],
  );
});

test('落地页源码：动态渲染、复用信任条与 metadata 口径', async () => {
  const source = await readSource('../src/app/download/[pkg]/[channelId]/page.tsx');

  assert.match(source, /export const dynamic = 'force-dynamic'/);
  assert.match(source, /<GameTrustStrip items=\{view\.trustItems\}/);
  assert.match(source, /buildDownloadLandingMetadata\(/);
  assert.match(source, /continueHref/);
  assert.match(source, /该渠道暂不可用/);
  // 落地页不自己拼版本/大小文案，避免与 #180 出现两套口径。
  assert.doesNotMatch(source, /formatFileSize|resolveGameSourceLabel/);
});
