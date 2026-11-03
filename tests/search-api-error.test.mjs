import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import { SearchApiError, searchGlobal } from '../src/lib/search-api.ts';
import { resolveSearchEmptyState } from '../src/lib/search-empty-state.ts';

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

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  installFetch(() => jsonResponse({ code: 0, data: { total: 0 } }));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
});

test('非 2xx 响应抛 SearchApiError，status 保留 HTTP 状态', async () => {
  installFetch(() => new Response('', { status: 429 }));

  await assert.rejects(
    () => searchGlobal({ q: '飞机大厨' }),
    (error) => {
      assert.ok(error instanceof SearchApiError, '应抛 SearchApiError');
      assert.ok(error instanceof Error);
      assert.equal(error.status, 429);
      assert.match(error.message, /429/);
      return true;
    },
  );
});

test('业务 code 非 0 也抛 SearchApiError，并保留后端 message', async () => {
  installFetch(() => jsonResponse({ code: 5001, message: 'too many requests' }));

  await assert.rejects(
    () => searchGlobal({ q: '飞机大厨' }),
    (error) => {
      assert.ok(error instanceof SearchApiError);
      assert.equal(error.status, 200);
      assert.equal(error.message, 'too many requests');
      return true;
    },
  );
});

test('forwardedFor 写进请求头，缺省/空白时不写', async () => {
  await searchGlobal({ q: '飞机大厨', forwardedFor: ' 203.0.113.7 ' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers?.['x-forwarded-for'], '203.0.113.7');

  installFetch(() => jsonResponse({ code: 0, data: { total: 0 } }));
  await searchGlobal({ q: '飞机大厨' });
  assert.equal(calls[0].init.headers, undefined, '没有访客 IP 时不得凭空造头');

  installFetch(() => jsonResponse({ code: 0, data: { total: 0 } }));
  await searchGlobal({ q: '飞机大厨', forwardedFor: '   ' });
  assert.equal(calls[0].init.headers, undefined, '空白访客 IP 视为没有');
});

test('错误态与空结果态返回不同文案 key', () => {
  const errorKey = resolveSearchEmptyState({
    isLoading: false,
    error: new Error('429'),
    totalResultCount: 0,
  });
  const emptyKey = resolveSearchEmptyState({
    isLoading: false,
    error: null,
    totalResultCount: 0,
  });

  assert.equal(errorKey, 'error');
  assert.equal(emptyKey, 'empty');
  assert.notEqual(errorKey, emptyKey);

  assert.equal(
    resolveSearchEmptyState({ isLoading: true, error: new Error('429'), totalResultCount: 0 }),
    'loading',
  );
  assert.equal(
    resolveSearchEmptyState({ isLoading: false, error: null, totalResultCount: 3 }),
    'filter-empty',
  );
});
