import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';

import { DEFAULT_REQUEST_TIMEOUT_MS, trackedApiFetch } from '../src/lib/api.ts';
import { describeFetchException, isTimeoutError } from '../src/lib/auth-errors.ts';

const realFetch = globalThis.fetch;

/** 真实 fetch 被 abort 时抛什么取决于运行时：这里两种形态都能模拟。 */
function abortError() {
  return Object.assign(new Error('This operation was aborted'), { name: 'AbortError' });
}

/**
 * 装一个「永远不回包」的假服务器；只有请求被 abort 才结束。
 * `rejectWith === 'abort'` 模拟只抛 AbortError（忽略 signal.reason）的运行时。
 */
function installHangingFetch(options = {}) {
  const calls = [];
  let release = () => {};

  globalThis.fetch = (url, init = {}) => {
    calls.push({ url, init });
    return new Promise((resolve, reject) => {
      release = () => resolve(new Response('{"code":0}', { status: 200 }));
      const signal = init.signal;
      if (!signal) return;
      const onAbort = () => {
        if (options.rejectWith === 'abort') return reject(abortError());
        reject(signal.reason ?? abortError());
      };
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort, { once: true });
    });
  };

  return { calls, release: () => release() };
}

/** 让挂起的微任务都跑完（setImmediate 不受 mock 的 setTimeout 影响）。 */
function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

/** 起一个请求并记录它最终是 resolve 还是 reject，不抛未处理拒绝。 */
function track(promise) {
  const state = { outcome: null };
  promise.then(
    (value) => {
      state.outcome = { value };
    },
    (error) => {
      state.outcome = { error };
    },
  );
  return state;
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

test('不传 timeoutMs 时按默认 15s 超时，并抛可被分类的 TimeoutError', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const server = installHangingFetch();
  const state = track(trackedApiFetch('/slow', { logKey: '' }));

  await flush();
  t.mock.timers.tick(DEFAULT_REQUEST_TIMEOUT_MS - 1);
  await flush();
  assert.equal(state.outcome, null, '14.999s 时不应超时');
  assert.equal(server.calls.length, 1);

  t.mock.timers.tick(1);
  await flush();

  assert.ok(state.outcome?.error, '15s 时必须抛错，不能一直悬挂');
  assert.equal(isTimeoutError(state.outcome.error), true);
  assert.equal(describeFetchException(state.outcome.error).kind, 'timeout');
  assert.match(state.outcome.error.message, /timeout/i);
});

test('显式传 timeoutMs: 60000 时不会被默认 15s 掐断', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  installHangingFetch();
  const state = track(trackedApiFetch('/export', { timeoutMs: 60_000 }));

  await flush();
  t.mock.timers.tick(DEFAULT_REQUEST_TIMEOUT_MS);
  await flush();
  assert.equal(state.outcome, null, '显式 60s 的调用点不应在 15s 被中断');

  t.mock.timers.tick(45_000);
  await flush();
  assert.equal(isTimeoutError(state.outcome?.error), true);
});

test('运行时只抛 AbortError 时，超时仍被归一为 timeout 分类', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  installHangingFetch({ rejectWith: 'abort' });
  const state = track(trackedApiFetch('/slow-legacy-runtime'));

  await flush();
  t.mock.timers.tick(DEFAULT_REQUEST_TIMEOUT_MS);
  await flush();

  assert.ok(state.outcome?.error);
  assert.equal(isTimeoutError(state.outcome.error), true, '不能被当成 network');
  assert.equal(describeFetchException(state.outcome.error).kind, 'timeout');
});

test('调用方自己 abort 不算超时，仍是可重试的 network 中断', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  installHangingFetch();
  const controller = new AbortController();
  const state = track(trackedApiFetch('/cancelled', { signal: controller.signal }));

  await flush();
  controller.abort();
  await flush();

  assert.ok(state.outcome?.error);
  assert.equal(isTimeoutError(state.outcome.error), false);
  assert.equal(describeFetchException(state.outcome.error).kind, 'network');
});

test('timeoutMs: 0 表示显式不限时', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const server = installHangingFetch();
  const state = track(trackedApiFetch('/no-limit', { timeoutMs: 0 }));

  await flush();
  t.mock.timers.tick(DEFAULT_REQUEST_TIMEOUT_MS * 10);
  await flush();
  assert.equal(state.outcome, null, '不限时的请求不应被默认值掐断');

  server.release();
  await flush();
  assert.equal(state.outcome?.value?.status, 200);
});

test('普通网络错误仍归类为 network，不会被误报成超时', async () => {
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  const state = track(trackedApiFetch('/offline'));
  await flush();

  assert.equal(isTimeoutError(state.outcome?.error), false);
  assert.equal(describeFetchException(state.outcome.error).kind, 'network');
});
