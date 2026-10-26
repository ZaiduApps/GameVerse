import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAuthFailureToast,
  describeAuthFailure,
  describeFetchException,
  formatRateLimitMessage,
  parseRetryAfterSeconds,
} from '../src/lib/auth-errors.ts';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

test('429 带 Retry-After 秒数：给出倒计时文案并可重试', () => {
  const res = jsonResponse({ code: 429, message: 'too many requests' }, {
    status: 429,
    headers: { 'Retry-After': '30' },
  });
  const failure = describeAuthFailure(res, { code: 429, message: 'too many requests' });

  assert.equal(failure.kind, 'rate_limited');
  assert.equal(failure.retryable, true);
  assert.equal(failure.retryAfterSeconds, 30);
  assert.equal(failure.message, '操作太频繁，请在 30 秒后重试');
});

test('429 带 HTTP 日期：换算出剩余秒数', () => {
  const fixedNow = Date.parse('2026-10-26T12:00:00Z');
  const fixedHeader = new Date(fixedNow + 45_000).toUTCString();
  assert.equal(parseRetryAfterSeconds(fixedHeader, fixedNow), 45);

  // describeAuthFailure 用的是真实时钟，这里按真实时间构造日期头并留 1s 容差。
  const header = new Date(Date.now() + 45_000).toUTCString();
  const res = jsonResponse({ code: 429 }, { status: 429, headers: { 'Retry-After': header } });
  const failure = describeAuthFailure(res, { code: 429 });
  assert.ok(
    failure.retryAfterSeconds >= 44 && failure.retryAfterSeconds <= 45,
    `重试秒数应按日期头换算，实际 ${failure.retryAfterSeconds}`,
  );
  assert.match(failure.message, /请在 4[45] 秒后重试/);
});

test('429 无 Retry-After：通用可读文案', () => {
  const res = jsonResponse({}, { status: 429 });
  const failure = describeAuthFailure(res, null);

  assert.equal(failure.kind, 'rate_limited');
  assert.equal(failure.message, '操作太频繁，请稍后重试');
  assert.equal(failure.retryAfterSeconds, undefined);
  assert.equal(formatRateLimitMessage(null), '操作太频繁，请稍后重试');
});

test('HTTP 200 但业务 code=429 同样按限流处理', () => {
  const res = jsonResponse({ code: 429, message: 'slow down' });
  const failure = describeAuthFailure(res, { code: 429, message: 'slow down' });
  assert.equal(failure.kind, 'rate_limited');
});

test('5xx 视为可重试的服务端失败，不透出后端内部文案', () => {
  const res = jsonResponse({ code: 502, message: 'upstream exploded' }, { status: 502 });
  const failure = describeAuthFailure(res, { code: 502, message: 'upstream exploded' });

  assert.equal(failure.kind, 'server');
  assert.equal(failure.retryable, true);
  assert.equal(failure.message, '服务暂时不可用，请稍后重试');
});

test('业务拒绝保留后端文案且不可盲目重试', () => {
  const res = jsonResponse({ code: 1001, message: '用户名或密码错误' }, { status: 400 });
  const failure = describeAuthFailure(res, { code: 1001, message: '用户名或密码错误' }, '登录失败');

  assert.equal(failure.kind, 'business');
  assert.equal(failure.retryable, false);
  assert.equal(failure.message, '用户名或密码错误');

  const empty = describeAuthFailure(res, { code: 1001 }, '登录失败');
  assert.equal(empty.message, '登录失败');
});

test('超时与网络异常分类', () => {
  const timeoutError = Object.assign(new Error('aborted'), { name: 'TimeoutError' });
  const timeout = describeFetchException(timeoutError);
  assert.equal(timeout.kind, 'timeout');
  assert.equal(timeout.retryable, true);
  assert.match(timeout.message, /超时/);

  const network = describeFetchException(new TypeError('Failed to fetch'));
  assert.equal(network.kind, 'network');
  assert.equal(network.retryable, true);
  assert.match(network.message, /网络/);

  const aborted = describeFetchException(Object.assign(new Error('aborted'), { name: 'AbortError' }));
  assert.equal(aborted.kind, 'network');
  assert.equal(aborted.retryable, true);
});

test('Retry-After 非法值不会污染倒计时', () => {
  assert.equal(parseRetryAfterSeconds(null), null);
  assert.equal(parseRetryAfterSeconds(''), null);
  assert.equal(parseRetryAfterSeconds('soon'), null);
  assert.equal(parseRetryAfterSeconds('-5'), null);
  assert.equal(parseRetryAfterSeconds('999999'), 3600);
});

test('429 在验证码/登录/注册三处的提示文案', () => {
  const limited = {
    kind: 'rate_limited',
    message: '操作太频繁，请在 30 秒后重试',
    retryable: true,
    retryAfterSeconds: 30,
  };
  assert.deepEqual(buildAuthFailureToast('send-code', limited), {
    title: '发送太频繁',
    description: '操作太频繁，请在 30 秒后重试',
  });
  assert.deepEqual(buildAuthFailureToast('login', limited), {
    title: '登录太频繁',
    description: '操作太频繁，请在 30 秒后重试',
  });
  assert.deepEqual(buildAuthFailureToast('register', limited), {
    title: '注册太频繁',
    description: '操作太频繁，请在 30 秒后重试',
  });

  const business = { kind: 'business', message: '用户名或密码错误', retryable: false };
  assert.deepEqual(buildAuthFailureToast('login', business), {
    title: '登录失败',
    description: '用户名或密码错误',
  });
});
