import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  resolveDownloadChannelId,
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
import {
  resolveDownloadLandingMode,
  resolveDownloadPagePath,
  shouldShowLanding,
} from '../src/lib/download-landing.ts';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const PKG = 'com.demo.game';
const APP_ID = '67f000000000000000000222';
const CHANNEL_OFFICIAL = '67f000000000000000000333';

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

test('JSON-LD InstallAction.target 恒等于页面 canonical URL', async () => {
  // 组装逻辑已抽到纯函数模块（#80 抽测可直接解析 JSON），源码断言跟着搬。
  const jsonLdSource = await readSource('../src/lib/game-detail-jsonld.ts');
  assert.match(jsonLdSource, /target: canonicalUrl/);
  const pageSource = await readSource('../src/app/app/[id]/page.tsx');
  assert.match(pageSource, /buildDetailJsonLd\(/);
  assert.doesNotMatch(pageSource, /installActionTarget/);
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

/**
 * 直链下载（#107）的两条分支。
 *
 * 开关判定在 interface 的 resolveDownloadUrl 里（勾选且已上传成功才下发 R2
 * 直链，否则下发原有 123 地址），GameVerse 只负责把 interface 给的地址原样
 * 302 出去——所以这里锁的是「不重写、不拼接」：直链像普通地址一样被跟随，
 * 关闭时仍是原来的 123 分享地址。
 */
test('302 路由：直链开关开启时跟随 R2 直链，关闭时跟随 123 分享地址', async () => {
  const directLink = 'https://cdn.apkscc.com/apk/com.demo.game/com.demo.game_1.0.0.apk';
  const shareUrl = 'https://www.123684.com/s/4H3LVv-riSP';

  const on = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { url: directLink } }),
  });
  assert.deepEqual(on, { kind: 'redirect', location: directLink });

  const off = await decideDownloadRedirect({
    id: PKG,
    channelId: CHANNEL_OFFICIAL,
    requestIssuedUrl: async () => ({ ok: true, payload: { url: shareUrl } }),
  });
  assert.deepEqual(off, { kind: 'redirect', location: shareUrl });
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

/**
 * 落地页分流（#179 T179-1）。
 *
 * `off` 是线上默认档，必须恒 false——否则「默认行为与改动前一致」无从保证。
 * `external` 只接外部浏览器顶层导航；`all` 连站内详情页点击也先落页。
 * `confirm=1` 永远不落页（否则落地页的「继续下载」会打回自己）。
 */
function landingRequest(headers = {}, url = 'https://apks.cc/app/com.demo.game/download/67f000000000000000000333') {
  return { headers: new Headers(headers), url };
}

const BROWSER_NAV = {
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'sec-fetch-dest': 'document',
};
const DETAIL_REFERER = 'https://apks.cc/app/com.demo.game';

test('落地页开关：三档解析，未知值一律回落 off', () => {
  assert.equal(resolveDownloadLandingMode('off'), 'off');
  assert.equal(resolveDownloadLandingMode('external'), 'external');
  assert.equal(resolveDownloadLandingMode(' ALL '), 'all');
  assert.equal(resolveDownloadLandingMode(undefined), 'off');
  assert.equal(resolveDownloadLandingMode(''), 'off');
  assert.equal(resolveDownloadLandingMode('yes'), 'off');
});

test('落地页分流：off 恒 false（默认档不改线上行为）', () => {
  const combos = [
    landingRequest(BROWSER_NAV),
    landingRequest({ ...BROWSER_NAV, referer: DETAIL_REFERER }),
    landingRequest({ ...BROWSER_NAV, 'sec-fetch-dest': '' }),
    landingRequest({ ...BROWSER_NAV, accept: 'application/json' }),
  ];
  for (const request of combos) {
    assert.equal(shouldShowLanding(request, 'off'), false);
  }
});

test('落地页分流：external 只接外部浏览器顶层导航', () => {
  // ① 标准浏览器导航、无 Referer → 落页
  assert.equal(shouldShowLanding(landingRequest(BROWSER_NAV), 'external'), true);
  // ② Sec-Fetch-Dest 缺失按浏览器导航处理
  assert.equal(
    shouldShowLanding(landingRequest({ accept: 'text/html' }), 'external'),
    true,
  );
  // ③ 非顶层导航（下载器/子资源）不落页
  assert.equal(
    shouldShowLanding(landingRequest({ ...BROWSER_NAV, 'sec-fetch-dest': 'empty' }), 'external'),
    false,
  );
  // ④ 非 HTML 客户端（下载器、爬虫、API 调用）不落页
  assert.equal(
    shouldShowLanding(landingRequest({ accept: 'application/octet-stream' }), 'external'),
    false,
  );
  assert.equal(shouldShowLanding(landingRequest({}), 'external'), false);
  // ⑤ 站内详情页点击不落页
  assert.equal(
    shouldShowLanding(landingRequest({ ...BROWSER_NAV, referer: DETAIL_REFERER }), 'external'),
    false,
  );
  // ⑥ confirm=1 恒不落页（落地页「继续下载」）
  assert.equal(
    shouldShowLanding(
      landingRequest(BROWSER_NAV, 'https://apks.cc/app/com.demo.game/download/67f000000000000000000333?confirm=1'),
      'external',
    ),
    false,
  );
});

test('落地页分流：反代后站内 Referer 仍判为站内（request.url 是内网地址）', () => {
  const referer = 'https://apks.cc/app/com.demo.game';

  // ① 生产形态：反代/隧道后 request.url 是内网地址，真实 host 在 x-forwarded-host。
  assert.equal(
    shouldShowLanding(
      landingRequest(
        { ...BROWSER_NAV, 'x-forwarded-host': 'apks.cc', referer },
        'http://127.0.0.1:3002/app/com.demo.game/download/67f000000000000000000333',
      ),
      'external',
    ),
    false,
  );
  // ② x-forwarded-host 带端口、带代理链时取第一段并去端口。
  assert.equal(
    shouldShowLanding(
      landingRequest(
        { ...BROWSER_NAV, 'x-forwarded-host': 'apks.cc:443, 127.0.0.1:3002', referer },
        'http://127.0.0.1:3002/app/com.demo.game/download/67f000000000000000000333',
      ),
      'external',
    ),
    false,
  );
  // ③ 无 x-forwarded-host 时退回 host 头。
  assert.equal(
    shouldShowLanding(
      landingRequest(
        { ...BROWSER_NAV, host: 'apks.cc', referer },
        'http://127.0.0.1:3002/app/com.demo.game/download/67f000000000000000000333',
      ),
      'external',
    ),
    false,
  );
  // ④ 无任何 host 头时退回 request.url（本地/单测兜底）。
  assert.equal(
    shouldShowLanding(
      landingRequest({ ...BROWSER_NAV, referer }, 'https://apks.cc/app/com.demo.game/download/67f000000000000000000333'),
      'external',
    ),
    false,
  );
  // ⑤ 同 host 但不在 /app/ 下（社区页）→ 按外部处理。
  assert.equal(
    shouldShowLanding(
      landingRequest({ ...BROWSER_NAV, 'x-forwarded-host': 'apks.cc', referer: 'https://apks.cc/community' }, 'http://127.0.0.1:3002/app/com.demo.game/download/67f000000000000000000333'),
      'external',
    ),
    true,
  );
  // ⑥ 跨 host 的 /app/ Referer → 按外部处理。
  assert.equal(
    shouldShowLanding(
      landingRequest({ ...BROWSER_NAV, 'x-forwarded-host': 'apks.cc', referer: 'https://evil.example/app/com.demo.game' }, 'http://127.0.0.1:3002/app/com.demo.game/download/67f000000000000000000333'),
      'external',
    ),
    true,
  );
});

test('落地页分流：all 连站内详情页点击也落页，但 confirm=1 仍排除', () => {
  assert.equal(
    shouldShowLanding(landingRequest({ ...BROWSER_NAV, referer: DETAIL_REFERER }), 'all'),
    true,
  );
  assert.equal(
    shouldShowLanding(
      landingRequest(BROWSER_NAV, 'https://apks.cc/app/com.demo.game/download/67f000000000000000000333?confirm=1'),
      'all',
    ),
    false,
  );
  assert.equal(shouldShowLanding(landingRequest({ accept: 'application/json' }), 'all'), false);
});

test('落地页路径与 x-ac-path：站内入口仍记详情页，落地页来源记落地页', () => {
  const id = 'com.demo.game';
  const channelId = CHANNEL_OFFICIAL;
  const path = `/download/${id}/${channelId}`;

  const fromDetail = resolveDownloadPagePath(
    id,
    channelId,
    landingRequest({ ...BROWSER_NAV, referer: DETAIL_REFERER }),
  );
  assert.deepEqual(fromDetail, { path, pagePath: `/app/${id}` });

  const external = resolveDownloadPagePath(id, channelId, landingRequest(BROWSER_NAV));
  assert.deepEqual(external, { path, pagePath: `/app/${id}` });

  const fromLanding = resolveDownloadPagePath(
    id,
    channelId,
    landingRequest(BROWSER_NAV, `https://apks.cc${path}?confirm=1`),
  );
  assert.deepEqual(fromLanding, { path, pagePath: path });

  const landingReferer = resolveDownloadPagePath(
    id,
    channelId,
    landingRequest({ ...BROWSER_NAV, referer: `https://apks.cc${path}` }),
  );
  assert.deepEqual(landingReferer, { path, pagePath: path });

  // 非法 id / channelId 继续走原 302 的 400 错误页，不产出落地路径。
  assert.equal(resolveDownloadPagePath('a/b', channelId, landingRequest(BROWSER_NAV)), null);
  assert.equal(resolveDownloadPagePath(id, 'channel-1', landingRequest(BROWSER_NAV)), null);
  assert.equal(resolveDownloadPagePath('', channelId, landingRequest(BROWSER_NAV)), null);
});

test('route handler 与详情页接线符合派发单约束（源码级）', async () => {
  const [routeSource, viewSource, dialogSource, requestSource] = await Promise.all([
    readSource('../src/app/app/[id]/download/[channelId]/route.ts'),
    readSource('../src/app/app/[id]/GameDetailView.tsx'),
    readSource('../src/components/game-download-dialog.tsx'),
    readSource('../src/lib/download-request.ts'),
  ]);

  // 302 链路：force-dynamic + no-store + 带着来源位与访客 UA 去调现有 POST 接口
  assert.match(routeSource, /export const dynamic = 'force-dynamic'/);
  assert.match(routeSource, /'cache-control': 'no-store'/);
  assert.match(routeSource, /status: 302/);
  assert.match(routeSource, /'x-ac-surface': 'detail_ssr'/);
  assert.match(routeSource, /'x-ac-visitor-ua'/);
  // 页面路径维度（#140）：SSR 下载入口也要把详情页 pathname 带给 interface。
  assert.match(routeSource, /'x-ac-path'/);
  assert.match(routeSource, /normalizeDownloadPagePath/);
  // 来源维度（#145）：302 入口由详情页直链渲染，签发事件带 detail。
  assert.match(routeSource, /'x-ac-click-source': 'detail'/);
  // 3 秒内失败可见（#140）：与弹窗共用同一个请求上限（2500ms + 渲染余量）。
  assert.match(routeSource, /const DOWNLOAD_API_TIMEOUT_MS = DOWNLOAD_REQUEST_TIMEOUT_MS/);
  assert.match(routeSource, /AbortController/);
  assert.match(routeSource, /apiUrl\('\/game\/getAppDownload'\)/);
  assert.doesNotMatch(routeSource, /NextResponse\.redirect/);
  // 落地页分流（#179）：307 只在开关非 off 且判定为浏览器导航时触发，默认档不生效。
  assert.match(routeSource, /process\.env\.DOWNLOAD_LANDING_MODE/);
  assert.match(routeSource, /shouldShowLanding\(request, landingMode\)/);
  assert.match(routeSource, /status: 307/);

  // 详情页不再渲染直链渠道块：302 入口既不在页面上露出，也不在 JSON-LD 里声明
  assert.doesNotMatch(viewSource, /game-detail-channels/);
  assert.doesNotMatch(viewSource, /GameDirectDownloadLinks/);

  // 客户端打点：渠道按钮上报 download_click，服务端不再代记
  assert.match(dialogSource, /reportDownloadClick\(\{[\s\S]*?surface: 'detail_dialog'[\s\S]*?source: 'detail'/);
  assert.match(dialogSource, /from '@\/lib\/game-download-channel'/);
  assert.match(dialogSource, /from '@\/lib\/download-request'/);
  assert.doesNotMatch(dialogSource, /const shouldGuideToApp = \(resource/);
  // 请求体与来源位在抽出的请求层：仍必须是弹窗来源位。
  assert.match(requestSource, /'x-ac-surface': 'detail_dialog'/);
  // 来源维度（#145）在请求层下发，值来自调用点。
  assert.match(requestSource, /'x-ac-click-source'/);
  assert.match(requestSource, /'\/game\/getAppDownload'/);
});
