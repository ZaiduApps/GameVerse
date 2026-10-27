import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  CommunityReadError,
  getCommunityFeed,
  getCommunityFeedOrThrow,
} from '../src/lib/community-api.ts';

const realFetch = globalThis.fetch;
const realConsole = { error: console.error, warn: console.warn };
let calls = [];

function installFetch(handler) {
  calls = [];
  globalThis.fetch = async (path, init) => {
    calls.push({ path: String(path), init: init || {} });
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
  console.error = () => {};
  console.warn = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
  console.error = realConsole.error;
  console.warn = realConsole.warn;
});

test('社区列表：上游 500 抛错，不再折叠成 total: 0 空页', async () => {
  installFetch(() => jsonResponse({ code: 500, message: 'boom', data: null }, 500));

  await assert.rejects(
    () => getCommunityFeedOrThrow('latest', { page: 1 }, { retries: 0 }),
    (error) => {
      assert.ok(error instanceof CommunityReadError);
      assert.equal(error.kind, 'httpError');
      assert.equal(error.status, 500);
      return true;
    },
  );
});

test('社区列表：上游 404 返回 null，交给调用方 notFound()', async () => {
  installFetch(() => jsonResponse({ code: 404, message: 'Not Found', data: null }, 404));

  assert.equal(await getCommunityFeedOrThrow('latest', { page: 2 }, { retries: 0 }), null);
  assert.equal(calls.length, 1);
});

test('社区列表：超时 / 网络异常同样抛错', async () => {
  installFetch(() => {
    throw new Error('fetch failed');
  });

  await assert.rejects(
    () => getCommunityFeedOrThrow('latest', { page: 1 }),
    (error) => error instanceof CommunityReadError && error.kind === 'networkError',
  );
});

test('客户端刷新路径 getCommunityFeed 保持「失败即空列表」的既有行为', async () => {
  installFetch(() => jsonResponse({ code: 500, message: 'boom', data: null }, 500));

  const feed = await getCommunityFeed('latest', { page: 1 });
  assert.equal(feed.total, 0);
  assert.deepEqual(feed.list, []);
  // 5xx 重试口径不变：默认 retries=1 → 共 2 次请求。
  assert.equal(calls.length, 2);
});
