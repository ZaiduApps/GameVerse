import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  buildDirectDownloadLinks,
  resolveDownloadChannelId,
  resolveInstallActionTarget,
  shouldGuideToApp,
} from '../src/lib/game-download-channel.ts';
import {
  buildDownloadFailureLocation,
  classifyDownloadIssueFailure,
  decideDownloadRedirect,
  isDownloadChannelId,
  normalizeIssuedDownloadUrl,
  resolveDownloadRedirectId,
  resolveIssuedDownloadUrl,
} from '../src/lib/game-download-redirect.ts';
import {
  describeDownloadErrorPage,
  renderDownloadErrorPage,
  resolveDownloadErrorAppPath,
} from '../src/lib/download-error-page.ts';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const PKG = 'com.demo.game';
const APP_ID = '67f000000000000000000222';
const CHANNEL_OFFICIAL = '67f000000000000000000333';
const CHANNEL_APKPURE = '67f000000000000000000444';

function resource(overrides = {}) {
  return {
    _id: `res-${overrides.channelId || 'x'}`,
    channel: {
      _id: overrides.channelId || CHANNEL_OFFICIAL,
      name: overrides.name || '官方渠道',
      icon: '',
      code: overrides.code || 'official',
      ...(overrides.channel || {}),
    },
    ...(overrides.extra || {}),
  };
}

test('直链只包含可直接下载的渠道，href 指向 302 入口', () => {
  const links = buildDirectDownloadLinks(
    [
      resource({ channelId: CHANNEL_OFFICIAL, name: '官方渠道', code: 'official' }),
      resource({
        channelId: CHANNEL_APKPURE,
        name: 'APKPure',
        code: 'apkpure',
        channel: { description: 'APKPure 第三方' },
      }),
      resource({
        channelId: '67f000000000000000000555',
        name: '安卓专区',
        code: 'third_party',
        channel: { platform_range: ['android'] },
      }),
    ],
    PKG,
  );

  assert.equal(links.length, 1);
  assert.equal(links[0].channelId, CHANNEL_OFFICIAL);
  assert.equal(links[0].channelName, '官方渠道');
  assert.equal(links[0].href, `/app/${PKG}/download/${CHANNEL_OFFICIAL}`);
  assert.ok(links[0].href.includes('/download/'));
});

test('直链去重、无渠道 id 或空游戏 id 时不出链接', () => {
  const duplicated = buildDirectDownloadLinks(
    [
      resource({ channelId: CHANNEL_OFFICIAL }),
      resource({ channelId: CHANNEL_OFFICIAL, name: '官方渠道（重复）' }),
      resource({ channelId: '', name: '无 id' }),
    ],
    PKG,
  );

  assert.equal(duplicated.length, 1);
  assert.deepEqual(buildDirectDownloadLinks([resource()], ''), []);
  assert.deepEqual(buildDirectDownloadLinks(undefined, PKG), []);
});

test('JSON-LD InstallAction.target 指向直下入口，无直下渠道时回退 canonical', async () => {
  const canonical = `https://apks.cc/app/${PKG}`;

  // 有直下渠道：落点是 302 入口，不是详情页自身
  const withDirect = resolveInstallActionTarget(
    [resource({ channelId: CHANNEL_OFFICIAL, code: 'official' })],
    PKG,
    canonical,
  );
  assert.equal(withDirect, `https://apks.cc/app/${PKG}/download/${CHANNEL_OFFICIAL}`);
  assert.ok(withDirect.includes('/download/'));

  // 只有引导型渠道（APKPure）或没有资源时：回退详情页自身
  assert.equal(
    resolveInstallActionTarget([resource({ channelId: CHANNEL_APKPURE, code: 'apkpure' })], PKG, canonical),
    canonical,
  );
  assert.equal(resolveInstallActionTarget(undefined, PKG, canonical), canonical);
  assert.equal(resolveInstallActionTarget([], PKG, canonical), canonical);

  // 详情页接线：JSON-LD 用同一个函数取落点，不自己再拼一套渠道筛选
  const pageSource = await readSource('../src/app/app/[id]/page.tsx');
  assert.match(pageSource, /resolveInstallActionTarget\(initialGameData\.resources, game\.pkg \|\| game\._id, canonicalUrl\)/);
  assert.match(pageSource, /target: installActionTarget/);
});

test('渠道判定与弹窗共用同一份实现（APKPure / Android 定向都引导去 App）', () => {
  assert.equal(shouldGuideToApp(resource({ code: 'apkpure', channel: { name: 'APKPure' } })), true);
  assert.equal(shouldGuideToApp(resource({ channel: { platform_ranges: 'android-arm64' } })), true);
  assert.equal(shouldGuideToApp(resource({ channel: { description: '安卓专用' } })), true);
  assert.equal(shouldGuideToApp(resource({ code: 'official', name: '官方渠道' })), false);
  assert.equal(shouldGuideToApp(undefined), false);
  assert.equal(resolveDownloadChannelId(undefined), '');
});

test('302 路由：参数校验把非法 id / channelId 判成 400', async () => {
  assert.equal(resolveDownloadRedirectId(''), null);
  assert.equal(resolveDownloadRedirectId('   '), null);
  assert.equal(resolveDownloadRedirectId('a/b'), null);
  assert.equal(resolveDownloadRedirectId('pkg?x=1'), null);
  assert.equal(isDownloadChannelId(CHANNEL_OFFICIAL), true);
  assert.equal(isDownloadChannelId('not-an-object-id'), false);

  const neverCalled = () => {
    throw new Error('upstream should not be called');
  };
  const badId = await decideDownloadRedirect({
    id: 'a/b',
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: neverCalled,
  });
  assert.deepEqual(badId, { kind: 'error_page', status: 400, failure: 'invalid' });

  const badChannel = await decideDownloadRedirect({
    id: PKG,
    channelId: 'channel-1',
    requestIssuedUrl: neverCalled,
  });
  assert.deepEqual(badChannel, { kind: 'error_page', status: 400, failure: 'invalid' });
});

test('302 路由：24 位 id 当 app_id 传，包名当 pkg 传', async () => {
  const seen = [];
  const ok = (payload) => async (body) => {
    seen.push(body);
    return { ok: true, payload };
  };

  await decideDownloadRedirect({
    id: APP_ID,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: ok({ url: 'https://cdn.example.com/a.apk' }),
  });
  await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: ok({ url: 'https://cdn.example.com/a.apk' }),
  });

  assert.deepEqual(seen[0], { app_id: APP_ID, channel_id: CHANNEL_OFFICIAL });
  assert.deepEqual(seen[1], { pkg: PKG, channel_id: CHANNEL_OFFICIAL });
});

test('302 路由：上游成功时 302 到 interface 返回的地址', async () => {
  const decision = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({
      ok: true,
      payload: { url: 'https://cdn.example.com/files/demo.apk?sig=abc' },
    }),
  });

  assert.equal(decision.kind, 'redirect');
  assert.equal(decision.location, 'https://cdn.example.com/files/demo.apk?sig=abc');
});

test('302 路由：上游失败与资源失效分别降级回详情页并带上原因', async () => {
  const fallback = `/app/${PKG}?download_error=1`;
  const channelFailure = `/app/${PKG}?download_error=1&download_error_reason=channel`;
  const resourceFailure = `/app/${PKG}?download_error=1&download_error_reason=resource`;
  // 不带原因的老形态保持兼容。
  assert.equal(buildDownloadFailureLocation(PKG), fallback);
  assert.equal(buildDownloadFailureLocation(PKG, 'channel'), channelFailure);
  assert.equal(buildDownloadFailureLocation(PKG, 'resource'), resourceFailure);

  const upstreamError = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: false }),
  });
  assert.deepEqual(upstreamError, { kind: 'redirect', location: channelFailure });

  const timeout = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => {
      throw new Error('TimeoutError');
    },
  });
  assert.deepEqual(timeout, { kind: 'redirect', location: channelFailure });

  const businessCode = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { code: 404, message: '资源不存在' } }),
  });
  assert.deepEqual(businessCode, { kind: 'redirect', location: resourceFailure });

  const emptyUrl = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { url: '   ' } }),
  });
  assert.deepEqual(emptyUrl, { kind: 'redirect', location: resourceFailure });
});

test('302 路由：失败按 interface body 的 code/message 分类（待决策 #74）', async () => {
  // interface 的下载接口失败也回 2xx，原因只在 body 里
  assert.equal(classifyDownloadIssueFailure({ ok: true, payload: { code: 404, message: '应用不存在' } }), 'app_missing');
  assert.equal(classifyDownloadIssueFailure({ ok: true, payload: { code: 404, message: '渠道不存在' } }), 'channel');
  assert.equal(classifyDownloadIssueFailure({ ok: true, payload: { code: 404, message: '资源不存在' } }), 'resource');
  assert.equal(classifyDownloadIssueFailure({ ok: true, payload: { code: 400, message: '页游不支持 APK 下载资源' } }), 'resource');
  assert.equal(classifyDownloadIssueFailure({ ok: true, payload: { code: 500, message: 'download url is empty' } }), 'upstream');
  assert.equal(classifyDownloadIssueFailure({ ok: false }), 'upstream');
  assert.equal(classifyDownloadIssueFailure(null), 'upstream');

  const missingApp = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { code: 404, message: '应用不存在' } }),
  });
  // 游戏不存在时回详情页只会二次 404 → 直接停在原地给 404 错误页
  assert.deepEqual(missingApp, { kind: 'error_page', status: 404, failure: 'app_missing' });

  const missingResource = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { code: 404, message: '资源不存在' } }),
  });
  assert.deepEqual(missingResource, {
    kind: 'redirect',
    location: `/app/${PKG}?download_error=1&download_error_reason=resource`,
  });
});

test('错误页：noindex、转义、不拿脏 id 拼跳转', () => {
  const copy = describeDownloadErrorPage('app_missing');
  assert.equal(copy.status, 404);
  const html = renderDownloadErrorPage({ ...copy, requestId: 'dl-1' });

  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /请求号：dl-1/);
  // 404 页不给「返回游戏页」按钮：那里只会二次 404
  assert.doesNotMatch(html, /返回游戏页/);

  const invalid = renderDownloadErrorPage({
    ...describeDownloadErrorPage('invalid'),
    appId: '<script>alert(1)</script>',
  });
  assert.match(invalid, /回到首页/);
  assert.doesNotMatch(invalid, /<script>alert\(1\)<\/script>/);
  assert.doesNotMatch(invalid, /返回游戏页/);

  assert.equal(resolveDownloadErrorAppPath(PKG), `/app/${PKG}`);
  assert.equal(resolveDownloadErrorAppPath('a/b'), null);
  assert.equal(resolveDownloadErrorAppPath('https://evil.example.com'), null);
  assert.equal(resolveDownloadErrorAppPath('  '), null);

  const withApp = renderDownloadErrorPage({ ...describeDownloadErrorPage('invalid'), appId: PKG });
  assert.match(withApp, new RegExp(`href="/app/${PKG}"`));
});

test('302 路由：Location 只接受 http/https，不接受开放重定向', () => {
  assert.equal(normalizeIssuedDownloadUrl('https://cdn.example.com/a.apk'), 'https://cdn.example.com/a.apk');
  assert.equal(normalizeIssuedDownloadUrl('http://cdn.example.com/a.apk'), 'http://cdn.example.com/a.apk');
  assert.equal(normalizeIssuedDownloadUrl('javascript:alert(1)'), null);
  assert.equal(normalizeIssuedDownloadUrl('//evil.example.com/x'), null);
  assert.equal(normalizeIssuedDownloadUrl('/relative/path'), null);
  assert.equal(normalizeIssuedDownloadUrl(''), null);
  assert.equal(resolveIssuedDownloadUrl({ data: { url: 'https://cdn.example.com/b.apk' } }), 'https://cdn.example.com/b.apk');
  assert.equal(resolveIssuedDownloadUrl({ code: 0, data: { url: 'https://cdn.example.com/b.apk' } }), 'https://cdn.example.com/b.apk');
  assert.equal(resolveIssuedDownloadUrl(null), null);
});

test('route handler 与详情页接线符合派发单约束（源码级）', async () => {
  const [routeSource, viewSource, dialogSource] = await Promise.all([
    readSource('../src/app/app/[id]/download/[channelId]/route.ts'),
    readSource('../src/app/app/[id]/GameDetailView.tsx'),
    readSource('../src/components/game-download-dialog.tsx'),
  ]);

  // 302 链路：force-dynamic + no-store + 带着来源位与访客 UA 去调现有 POST 接口
  assert.match(routeSource, /export const dynamic = 'force-dynamic'/);
  assert.match(routeSource, /'cache-control': 'no-store'/);
  assert.match(routeSource, /status: 302/);
  assert.match(routeSource, /'x-ac-surface': 'detail_ssr'/);
  assert.match(routeSource, /'x-ac-visitor-ua'/);
  assert.match(routeSource, /AbortController/);
  assert.match(routeSource, /apiUrl\('\/game\/getAppDownload'\)/);
  assert.doesNotMatch(routeSource, /NextResponse\.redirect/);

  // 详情页不再渲染直链渠道块：302 入口只保留在 JSON-LD 的 InstallAction 声明里
  assert.doesNotMatch(viewSource, /game-detail-channels/);
  assert.doesNotMatch(viewSource, /GameDirectDownloadLinks/);

  // 客户端打点：渠道按钮上报 download_click，服务端不再代记
  assert.match(dialogSource, /reportDownloadClick\(\{ appId, pkg, channelId, surface: 'detail_dialog' \}\)/);
  assert.match(dialogSource, /'x-ac-surface': 'detail_dialog'/);
  assert.match(dialogSource, /from '@\/lib\/game-download-channel'/);
  assert.doesNotMatch(dialogSource, /const shouldGuideToApp = \(resource/);
});
