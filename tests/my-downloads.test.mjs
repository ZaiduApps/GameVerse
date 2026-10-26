import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import { getMyDownloadHistory, mapMyDownloadRow } from '../src/lib/profile-dashboard-api.ts';

const realFetch = globalThis.fetch;
let calls = [];

function installFetch(handler) {
  calls = [];
  globalThis.fetch = async (path, init) => {
    calls.push({ path, init });
    return handler(path, init);
  };
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: (path, init) => globalThis.fetch(path, init),
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  installFetch(() => jsonResponse({ code: 0, message: 'ok', data: { list: [], total: 0, page: 1, pageSize: 20 } }));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
});

test('下载历史行映射：缺 app_id 的脏数据被丢弃', () => {
  assert.equal(mapMyDownloadRow(null), null);
  assert.equal(mapMyDownloadRow({ _id: 'x' }), null);
  assert.equal(mapMyDownloadRow({ app_id: '   ' }), null);
  assert.deepEqual(
    mapMyDownloadRow({
      _id: 'row-1',
      app_id: '67f000000000000000000222',
      resource_id: 'r1',
      channel_id: 'c1',
      version: '1.2.3',
      created_at: '2026-10-26T10:00:00.000Z',
    }),
    {
      id: 'row-1',
      appId: '67f000000000000000000222',
      resourceId: 'r1',
      channelId: 'c1',
      version: '1.2.3',
      createdAt: '2026-10-26T10:00:00.000Z',
    },
  );
});

test('接口未上线（404）标成 unavailable 而不是报错', async () => {
  installFetch(() => jsonResponse({ code: 404, message: 'Not Found' }, 404));

  const result = await getMyDownloadHistory({ token: 'token-1', page: 1, pageSize: 20 });

  assert.equal(result.ok, false);
  assert.equal(result.unavailable, true);
  assert.deepEqual(result.list, []);
  assert.equal(result.message, '功能即将上线');
  assert.match(String(calls[0].path), /^\/users\/me\/downloads\?page=1&pageSize=20$/);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token-1');
});

test('正常返回时按接口分页结构透出列表与总数', async () => {
  installFetch(() =>
    jsonResponse({
      code: 0,
      message: 'ok',
      data: {
        list: [
          { _id: 'row-1', app_id: 'app-1', resource_id: 'r1', channel_id: 'c1', version: '2.0.0', created_at: '2026-10-26T10:00:00.000Z' },
          { _id: 'row-2', resource_id: 'r2' },
        ],
        total: 21,
        page: 2,
        pageSize: 20,
      },
    }),
  );

  const result = await getMyDownloadHistory({ token: 'token-1', page: 2, pageSize: 20 });

  assert.equal(result.ok, true);
  assert.equal(result.unavailable, false);
  assert.equal(result.list.length, 1);
  assert.equal(result.list[0].appId, 'app-1');
  assert.equal(result.total, 21);
  assert.equal(result.page, 2);
});

test('业务失败与网络异常都保留可读错误信息', async () => {
  installFetch(() => jsonResponse({ code: 5001, message: '服务器繁忙' }, 500));
  const failed = await getMyDownloadHistory({ token: 'token-1' });
  assert.equal(failed.ok, false);
  assert.equal(failed.unavailable, false);
  assert.equal(failed.message, '服务器繁忙');

  installFetch(() => {
    throw new Error('network down');
  });
  const thrown = await getMyDownloadHistory({ token: 'token-1' });
  assert.equal(thrown.ok, false);
  assert.equal(thrown.message, '下载记录加载失败，请稍后重试');
});

test('缺少 token 时不发请求，直接返回登录失效', async () => {
  const result = await getMyDownloadHistory({ token: '  ' });

  assert.equal(result.ok, false);
  assert.equal(result.message, '登录状态已失效');
  assert.equal(calls.length, 0);
});
