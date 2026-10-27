import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  readStoredSession,
  refreshSession,
  subscribeStoredSession,
} from '../src/lib/auth-session.ts';

const realFetch = globalThis.fetch;
const realStorage = globalThis.localStorage;

const USER_A = { id: 'u-a', username: 'alice', name: 'Alice' };
const USER_B = { id: 'u-a', username: 'alice', name: 'Alice (verified)' };

let calls = [];

function installStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: {
      get length() {
        return map.size;
      },
      clear: () => map.clear(),
      getItem: (key) => (map.has(key) ? map.get(key) : null),
      key: (index) => [...map.keys()][index] ?? null,
      removeItem: (key) => {
        map.delete(key);
      },
      setItem: (key, value) => {
        map.set(key, String(value));
      },
    },
  });
  return map;
}

function installFetch(handler) {
  calls = [];
  globalThis.fetch = async (path, init) => {
    calls.push({ path, init });
    return handler(path, init);
  };
  // tests/helpers/alias-loader.mjs 把 '@/lib/api' 换成桩，桩转发到这里。
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: (path, init) => globalThis.fetch(path, init),
  };
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  installStorage({
    [AUTH_TOKEN_STORAGE_KEY]: 'token-a',
    [AUTH_USER_STORAGE_KEY]: JSON.stringify(USER_A),
  });
  installFetch(() => json({ code: 0, data: USER_A }));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
  if (realStorage === undefined) {
    delete globalThis.localStorage;
  } else {
    globalThis.localStorage = realStorage;
  }
});

test('并发刷新合并为一次 /auth/me，结果广播给所有调用方', async () => {
  let notified = 0;
  const unsubscribe = subscribeStoredSession(() => {
    notified += 1;
  });

  const results = await Promise.all([
    refreshSession('token-a'),
    refreshSession('token-a'),
    refreshSession('token-a'),
  ]);
  unsubscribe();

  assert.equal(calls.length, 1, '三个并发调用只应发一次请求');
  assert.match(calls[0].path, /\/auth\/me$/);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer token-a');
  for (const result of results) {
    assert.equal(result.status, 'refreshed');
    assert.equal(result.session.token, 'token-a');
  }
  assert.equal(results[0], results[1], '并发调用共享同一个结果对象');
  assert.equal(notified, 1, '刷新成功后只广播一次');
  assert.equal(readStoredSession()?.user.name, USER_A.name);
});

test('单飞结束后新的调用会重新发请求', async () => {
  await refreshSession('token-a');
  await refreshSession('token-a');
  assert.equal(calls.length, 2);
});

test('401 → /auth/refresh 换 token → 用新 token 重试 /auth/me', async () => {
  installFetch((path, init) => {
    if (path.endsWith('/auth/me')) {
      const authorization = init?.headers?.Authorization || '';
      if (authorization === 'Bearer token-b') return json({ code: 0, data: USER_B });
      return json({ code: 401, message: 'token expired' }, 401);
    }
    if (path.endsWith('/auth/refresh')) {
      return json({ code: 0, data: { token: 'token-b' } });
    }
    throw new Error(`unexpected path ${path}`);
  });

  const result = await refreshSession('token-a');

  assert.equal(result.status, 'refreshed');
  assert.equal(result.session.token, 'token-b');
  assert.equal(result.session.user.name, USER_B.name);
  assert.deepEqual(
    calls.map((call) => call.path.replace(/^\/api/, '')),
    ['/auth/me', '/auth/refresh', '/auth/me'],
  );
  assert.equal(readStoredSession()?.token, 'token-b', '新 token 必须落盘，供多标签页同步');
});

test('refresh 也被拒绝时返回 unauthorized，不改写存储', async () => {
  installFetch((path) => {
    if (path.endsWith('/auth/me')) return json({ code: 401, message: 'expired' }, 401);
    if (path.endsWith('/auth/refresh')) return json({ code: 401, message: 'refresh expired' }, 401);
    throw new Error(`unexpected path ${path}`);
  });

  const result = await refreshSession('token-a');

  assert.equal(result.status, 'unauthorized');
  assert.equal(readStoredSession()?.token, 'token-a');
});

test('超时返回可重试的 failed，不静默', async () => {
  installFetch(() => {
    throw Object.assign(new Error('aborted'), { name: 'TimeoutError' });
  });

  const result = await refreshSession('token-a');

  assert.equal(result.status, 'failed');
  assert.equal(result.failure.kind, 'timeout');
  assert.equal(result.failure.retryable, true);
  assert.match(result.failure.message, /超时/);
});

test('刷新期间登出：结果作废，不把旧会话写回存储', async () => {
  let releaseMe;
  installFetch((path) => {
    if (path.endsWith('/auth/me')) {
      return new Promise((resolve) => {
        releaseMe = () => resolve(json({ code: 0, data: USER_B }));
      });
    }
    throw new Error(`unexpected path ${path}`);
  });

  const pending = refreshSession('token-a');
  // 等 /me 发出后清空存储（模拟另一个标签页登出）
  await new Promise((resolve) => setTimeout(resolve, 0));
  globalThis.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  globalThis.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  releaseMe();

  const result = await pending;

  assert.equal(result.status, 'skipped');
  assert.equal(readStoredSession(), null);
  assert.equal(calls.length, 1);
});

test('无 token 直接 skipped，不发请求', async () => {
  const result = await refreshSession('   ');
  assert.equal(result.status, 'skipped');
  assert.equal(calls.length, 0);
});
