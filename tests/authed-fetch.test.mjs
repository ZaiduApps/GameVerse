import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  MissingAuthTokenError,
  authedFetch,
  requireToken,
} from '../src/lib/authed-fetch.ts';

const realFetch = globalThis.fetch;
let calls = [];

function installFetch(handler) {
  calls = [];
  globalThis.fetch = async (path, init) => {
    calls.push({ path, init });
    return handler
      ? handler(path, init)
      : new Response(JSON.stringify({ code: 0, data: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
  };
  // tests/helpers/alias-loader.mjs 把 '@/lib/api' 换成桩，桩转发到这里。
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: (path, init) => globalThis.fetch(path, init),
  };
}

beforeEach(() => installFetch());

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
});

test('缺少 token 时抛出 MissingAuthTokenError，且不发请求', async () => {
  for (const token of [undefined, '', '   ']) {
    await assert.rejects(
      () => authedFetch('/content/x', {}, { token }),
      MissingAuthTokenError,
    );
  }
  assert.equal(calls.length, 0);

  assert.throws(() => requireToken('  ', 'doSomething'), /doSomething/);
  assert.equal(requireToken(' abc ', 'doSomething'), 'abc');
});

test('有 token 时带上 Authorization 与 tracking 头', async () => {
  const res = await authedFetch('/content/x', {}, { token: 'tok-1', method: 'GET' });
  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/content/x');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer tok-1');
  assert.equal(calls[0].init.headers['x-client-platform'], 'web');
  assert.ok(calls[0].init.headers['x-request-id']);
  assert.equal(calls[0].init.headers['Content-Type'], undefined);
});

test('字符串 body 走 JSON，错误响应原样返回给调用方', async () => {
  installFetch(() =>
    new Response(JSON.stringify({ code: 1, message: 'boom' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  const res = await authedFetch(
    '/content/x',
    { cache: 'no-store' },
    { token: 'tok-1', method: 'POST', body: JSON.stringify({ a: 1 }) },
  );

  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { code: 1, message: 'boom' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(calls[0].init.body, JSON.stringify({ a: 1 }));
});
