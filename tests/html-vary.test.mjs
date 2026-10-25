import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendVaryToken,
  isGameDetailHtmlRoute,
  isRscRequest,
  sanitizeVaryHeader,
} from '../scripts/lib/html-vary.mjs';
import {
  acceptsGzip,
  decideHtmlCompression,
  MIN_COMPRESS_BYTES,
} from '../scripts/lib/http-compress.mjs';

const RSC_VARY =
  'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch';
const detailOptions = { isHtmlDetailRoute: true, isRscRequest: false };

test('详情页 HTML 只保留非 RSC 的 Vary 值', () => {
  assert.equal(sanitizeVaryHeader(`${RSC_VARY}, Accept-Encoding`, detailOptions), 'Accept-Encoding');
  assert.equal(sanitizeVaryHeader(RSC_VARY, detailOptions), undefined);
  assert.equal(
    sanitizeVaryHeader('Accept-Encoding, RSC, Accept-Language', detailOptions),
    'Accept-Encoding, Accept-Language',
  );
});

test('Vary 大小写与空白不影响裁剪', () => {
  assert.equal(
    sanitizeVaryHeader(' accept-encoding ,  rsc ,NEXT-ROUTER-STATE-TREE ', detailOptions),
    'accept-encoding',
  );
});

test('数组形式的 Vary 也能裁剪成单值', () => {
  assert.equal(
    sanitizeVaryHeader(['RSC', 'Next-Router-Prefetch', 'Accept-Encoding'], detailOptions),
    'Accept-Encoding',
  );
  assert.equal(sanitizeVaryHeader([...RSC_VARY.split(', ')], detailOptions), undefined);
});

test('空值与 Vary: * 不做裁剪', () => {
  assert.equal(sanitizeVaryHeader(undefined, detailOptions), undefined);
  assert.equal(sanitizeVaryHeader(null, detailOptions), null);
  assert.equal(sanitizeVaryHeader('', detailOptions), '');
  assert.equal(sanitizeVaryHeader('*', detailOptions), '*');
  assert.equal(sanitizeVaryHeader('Accept-Encoding, *', detailOptions), '*');
});

test('非详情页或 RSC 请求原样返回（可直接用 === 判断是否改写）', () => {
  const value = `${RSC_VARY}, Accept-Encoding`;
  assert.equal(sanitizeVaryHeader(value, { isHtmlDetailRoute: false, isRscRequest: false }), value);
  assert.equal(sanitizeVaryHeader(value, { isHtmlDetailRoute: true, isRscRequest: true }), value);
  assert.equal(sanitizeVaryHeader(value), value);
  // 没有需要裁剪的 token 时保持入参本身（含类型），避免无意义改写。
  const arrayValue = ['Accept-Encoding'];
  assert.equal(sanitizeVaryHeader(arrayValue, detailOptions), arrayValue);
});

test('详情页路由只认 /app/{pkg} 与带尾斜杠的形式', () => {
  assert.ok(isGameDetailHtmlRoute('/app/com.tencent.ig'));
  assert.ok(isGameDetailHtmlRoute('/app/com.tencent.ig/'));
  assert.ok(isGameDetailHtmlRoute('/app/507f1f77bcf86cd799439011'));
  assert.ok(!isGameDetailHtmlRoute('/app'));
  assert.ok(!isGameDetailHtmlRoute('/app/'));
  assert.ok(!isGameDetailHtmlRoute('/app/com.tencent.ig/reviews'));
  assert.ok(!isGameDetailHtmlRoute('/'));
  assert.ok(!isGameDetailHtmlRoute('/community'));
  assert.ok(!isGameDetailHtmlRoute('/_next/static/chunks/main.js'));
  assert.ok(!isGameDetailHtmlRoute(undefined));
});

test('RSC 请求靠 RSC 头或 _rsc 查询串识别', () => {
  assert.ok(isRscRequest({ headers: { rsc: '1' }, url: '/app/com.tencent.ig' }));
  assert.ok(isRscRequest({ headers: {}, url: '/app/com.tencent.ig?_rsc=abc123' }));
  assert.ok(isRscRequest({ headers: {}, url: '/app/com.tencent.ig?foo=1&_rsc=abc' }));
  assert.ok(!isRscRequest({ headers: {}, url: '/app/com.tencent.ig' }));
  assert.ok(!isRscRequest({ headers: {}, url: '/app/com.tencent.ig?foo=rsc' }));
  assert.ok(!isRscRequest());
});

test('appendVaryToken 幂等且不破坏 Vary: *', () => {
  assert.equal(appendVaryToken(undefined, 'Accept-Encoding'), 'Accept-Encoding');
  assert.equal(appendVaryToken('Accept-Encoding', 'Accept-Encoding'), 'Accept-Encoding');
  assert.equal(appendVaryToken('accept-encoding', 'Accept-Encoding'), 'accept-encoding');
  assert.equal(appendVaryToken('RSC', 'Accept-Encoding'), 'RSC, Accept-Encoding');
  assert.equal(appendVaryToken('*', 'Accept-Encoding'), '*');
});

test('Accept-Encoding 判定支持 q 值与通配', () => {
  assert.ok(acceptsGzip('gzip'));
  assert.ok(acceptsGzip('gzip, deflate, br'));
  assert.ok(acceptsGzip('br;q=1.0, gzip;q=0.8'));
  assert.ok(acceptsGzip('*'));
  assert.ok(!acceptsGzip('gzip;q=0'));
  assert.ok(!acceptsGzip('br, deflate'));
  assert.ok(!acceptsGzip(''));
  assert.ok(!acceptsGzip(undefined));
});

test('HTML gzip 只作用在有实体、够大、未压缩的 GET/HEAD', () => {
  const base = {
    method: 'GET',
    requestHeaders: { 'accept-encoding': 'gzip' },
    statusCode: 200,
    responseHeaders: { 'content-type': 'text/html; charset=utf-8', 'content-length': '20480' },
  };
  assert.ok(decideHtmlCompression(base));
  assert.ok(decideHtmlCompression({ ...base, method: 'HEAD' }));
  assert.ok(decideHtmlCompression({ ...base, responseHeaders: { 'content-type': 'text/html; charset=utf-8' } }));
  assert.ok(!decideHtmlCompression({ ...base, method: 'POST' }));
  assert.ok(!decideHtmlCompression({ ...base, requestHeaders: {} }));
  assert.ok(!decideHtmlCompression({ ...base, requestHeaders: { 'accept-encoding': 'gzip', range: 'bytes=0-100' } }));
  assert.ok(!decideHtmlCompression({ ...base, statusCode: 304 }));
  assert.ok(!decideHtmlCompression({ ...base, responseHeaders: { 'content-type': 'text/html', 'content-encoding': 'br' } }));
  assert.ok(!decideHtmlCompression({ ...base, responseHeaders: { 'content-type': 'application/json' } }));
  assert.ok(
    !decideHtmlCompression({
      ...base,
      responseHeaders: { 'content-type': 'text/html', 'content-length': String(MIN_COMPRESS_BYTES - 1) },
    }),
  );
});
