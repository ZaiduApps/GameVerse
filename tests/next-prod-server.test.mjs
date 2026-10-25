import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, test } from 'node:test';
import zlib from 'node:zlib';

import { patchResponse } from '../scripts/lib/next-prod-server.mjs';

const RSC_VARY =
  'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch';
const HTML_BODY = `<html><body><h1>详情页</h1>${'<p>占位内容</p>'.repeat(120)}</body></html>`;
const HOME_BODY = `<html><body>${'<p>首页</p>'.repeat(160)}</body></html>`;
const RSC_BODY = '0:["$","div",null,{}]';

let server;
let port;

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on('error', reject);
  });
}

before(async () => {
  server = http.createServer((req, res) => {
    patchResponse(req, res);
    const pathname = (req.url || '/').split('?')[0];

    // 模拟 Next：先 setHeader 若干次（包含重复写 Vary），再走 res.end / writeHead。
    if (pathname === '/app/legacy-write-head') {
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        Vary: `${RSC_VARY}, Accept-Encoding`,
      });
      res.end(HTML_BODY);
      return;
    }
    if (pathname === '/app/unavailable-marked') {
      // 模拟页面层「无快照 + 上游故障」时登记标记后正常渲染兜底壳（不抛错）。
      globalThis.__APKSCC_GAME_DETAIL_UNAVAILABLE__.set('unavailable-marked', Date.now());
      res.setHeader('vary', `${RSC_VARY}, Accept-Encoding`);
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('content-length', Buffer.byteLength(HTML_BODY));
      res.end(HTML_BODY);
      return;
    }
    if (pathname === '/app/stale-marker') {
      globalThis.__APKSCC_GAME_DETAIL_UNAVAILABLE__.set('stale-marker', Date.now() - 6000);
      res.setHeader('vary', `${RSC_VARY}, Accept-Encoding`);
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('content-length', Buffer.byteLength(HTML_BODY));
      res.end(HTML_BODY);
      return;
    }
    if (pathname === '/app/not-modified') {
      // 模拟 Next 的 sendEtagResponse：先 setHeader 再直接 304 + end()，此时还没有 content-type。
      res.setHeader('vary', RSC_VARY);
      res.setHeader('etag', '"abc123"');
      res.statusCode = 304;
      res.end();
      return;
    }
    if (pathname === '/app/rsc-payload') {
      res.setHeader('content-type', 'text/x-component');
      res.setHeader('vary', RSC_VARY);
      res.end(RSC_BODY);
      return;
    }
    if (pathname.startsWith('/app/')) {
      res.setHeader('vary', RSC_VARY);
      res.setHeader('vary', `${RSC_VARY}, Accept-Encoding`);
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.setHeader('content-length', Buffer.byteLength(HTML_BODY));
      res.end(HTML_BODY);
      return;
    }
    res.setHeader('vary', `${RSC_VARY}, Accept-Encoding`);
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('content-length', Buffer.byteLength(HOME_BODY));
    res.end(HOME_BODY);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('详情页 HTML：Vary 只剩 Accept-Encoding，body 走 gzip', async () => {
  const res = await request('/app/com.tencent.ig', {
    accept: 'text/html',
    'accept-encoding': 'gzip',
  });

  assert.equal(res.status, 200);
  assert.equal(res.headers.vary, 'Accept-Encoding');
  assert.equal(res.headers['content-encoding'], 'gzip');
  assert.equal(res.headers['content-length'], undefined);
  assert.equal(zlib.gunzipSync(res.body).toString('utf8'), HTML_BODY);
});

test('详情页带尾斜杠同样收口', async () => {
  const res = await request('/app/com.tencent.ig/', {
    accept: 'text/html',
    'accept-encoding': 'gzip',
  });
  assert.equal(res.headers.vary, 'Accept-Encoding');
});

test('详情页不支持 gzip 时保留 Content-Length 并仍收口 Vary', async () => {
  const res = await request('/app/com.tencent.ig', { accept: 'text/html' });

  assert.equal(res.headers.vary, 'Accept-Encoding');
  assert.equal(res.headers['content-encoding'], undefined);
  assert.equal(Number(res.headers['content-length']), Buffer.byteLength(HTML_BODY));
  assert.equal(res.body.toString('utf8'), HTML_BODY);
});

test('RSC 请求（RSC 头 / _rsc 查询串）原样放行', async () => {
  for (const { path, headers } of [
    { path: '/app/com.tencent.ig', headers: { rsc: '1', 'accept-encoding': 'gzip' } },
    { path: '/app/com.tencent.ig?_rsc=1abc', headers: { 'accept-encoding': 'gzip' } },
  ]) {
    const res = await request(path, headers);
    assert.equal(res.headers.vary, `${RSC_VARY}, Accept-Encoding`);
    assert.equal(zlib.gunzipSync(res.body).toString('utf8'), HTML_BODY);
  }
});

test('非详情页路由的 Vary 不动', async () => {
  const res = await request('/', { accept: 'text/html', 'accept-encoding': 'gzip' });
  assert.equal(res.headers.vary, `${RSC_VARY}, Accept-Encoding`);
  assert.equal(res.headers['content-encoding'], 'gzip');
});

test('res.writeHead(status, headers) 这条写出路径也收口且不重复写 Vary', async () => {
  const res = await request('/app/legacy-write-head', {
    accept: 'text/html',
    'accept-encoding': 'gzip',
  });

  assert.equal(res.status, 404);
  assert.equal(res.headers.vary, 'Accept-Encoding');
  assert.equal(res.headers['content-encoding'], 'gzip');
  assert.equal(zlib.gunzipSync(res.body).toString('utf8'), HTML_BODY);
});

test('详情页 304 的 Vary 与 200 保持一致', async () => {
  const res = await request('/app/not-modified', { accept: 'text/html', 'accept-encoding': 'gzip' });

  assert.equal(res.status, 304);
  assert.equal(res.headers.vary, 'Accept-Encoding');
  assert.equal(res.headers['content-encoding'], undefined);
});

test('详情页上的 RSC 负载（text/x-component）不收口 Vary', async () => {
  const res = await request('/app/rsc-payload', { accept: 'text/x-component' });

  assert.equal(res.headers.vary, RSC_VARY);
  assert.equal(res.headers['content-encoding'], undefined);
  assert.equal(res.body.toString('utf8'), RSC_BODY);
});

test('非 GET/HEAD 请求不接管', async () => {
  const res = await new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/app/com.tencent.ig', method: 'POST' }, (r) => {
      const chunks = [];
      r.on('data', (chunk) => chunks.push(chunk));
      r.on('end', () => resolve({ headers: r.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });

  assert.equal(res.headers.vary, `${RSC_VARY}, Accept-Encoding`);
  assert.equal(res.headers['content-encoding'], undefined);
});

test('页面登记「无快照 + 上游故障」标记后，server 把响应翻成 503', async () => {
  const res = await request('/app/unavailable-marked', {
    accept: 'text/html',
    'accept-encoding': 'gzip',
  });

  assert.equal(res.status, 503);
  assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.headers['retry-after'], '60');
  assert.equal(res.headers.vary, 'Accept-Encoding');
  assert.equal(res.headers['content-encoding'], undefined);
  assert.equal(Number(res.headers['content-length']), Buffer.byteLength(res.body.toString('utf8')));
  const body = res.body.toString('utf8');
  assert.match(body, /服务暂时不可用/);
  assert.doesNotMatch(body, /占位内容/, '不能把 Next 原本的页面正文带出来');
});

test('过期标记（>5s）不触发 503', async () => {
  const res = await request('/app/stale-marker', { accept: 'text/html' });

  assert.equal(res.status, 200);
  assert.equal(res.body.toString('utf8'), HTML_BODY);
  assert.equal(res.headers.vary, 'Accept-Encoding');
});

test('RSC 请求即便有失败标记也不改写（数据路由不动）', async () => {
  globalThis.__APKSCC_GAME_DETAIL_UNAVAILABLE__.set('unavailable-marked', Date.now());
  const res = await request('/app/unavailable-marked?_rsc=abc123', { rsc: '1' });

  assert.equal(res.status, 200);
  assert.equal(res.headers.vary, `${RSC_VARY}, Accept-Encoding`);
  assert.equal(res.body.toString('utf8'), HTML_BODY);
});
