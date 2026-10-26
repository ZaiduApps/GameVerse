import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import {
  buildClientErrorReport,
  redactSensitiveText,
  reportClientError,
  resetClientErrorReportState,
  sanitizeUrlForReport,
  shouldReportClientError,
  CLIENT_ERROR_DEDUPE_WINDOW_MS,
} from '../src/lib/client-errors.ts';

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

beforeEach(() => {
  resetClientErrorReportState();
  installFetch(() => new Response(null, { status: 204 }));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
  delete globalThis.window;
});

test('脱敏：邮箱、Bearer、敏感参数、URL 查询串、超长不透明串', () => {
  const input = [
    'user alice@example.com failed',
    'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig',
    'https://apks.cc/community/post/1?token=secret-token&q=alice%40example.com',
    'password=hunter2&api_key=abcdef',
    'id=0123456789abcdef0123456789abcdef01234567',
    'postgres://user:pa55@db.internal:5432/x',
  ].join(' | ');

  const redacted = redactSensitiveText(input);

  assert.equal(redacted.includes('alice@example.com'), false, '邮箱必须脱敏');
  assert.equal(redacted.includes('hunter2'), false, 'password 值必须脱敏');
  assert.equal(redacted.includes('abcdef'), false, 'api_key 值必须脱敏');
  assert.equal(redacted.includes('secret-token'), false, 'URL query 必须脱敏');
  assert.equal(redacted.includes('eyJhbGciOiJIUzI1NiJ9'), false, 'Bearer token 必须脱敏');
  assert.equal(redacted.includes('0123456789abcdef0123456789abcdef01234567'), false, '长不透明串必须脱敏');
  assert.equal(redacted.includes('pa55'), false, 'URL userinfo 密码必须脱敏');
  assert.match(redacted, /\[email\]/);
  assert.match(redacted, /\[redacted\]/);
});

test('上报 URL 只保留 origin + pathname', () => {
  assert.equal(
    sanitizeUrlForReport('https://apks.cc/community/post/1?token=abc&email=a%40b.com#x'),
    'https://apks.cc/community/post/1',
  );
  assert.equal(sanitizeUrlForReport(''), '');
  assert.equal(sanitizeUrlForReport('/relative/path?q=1'), '/relative/path');
});

test('上报体字段齐全、脱敏且截断', () => {
  const error = Object.assign(new Error(`boom at https://apks.cc/x?token=leak`), {
    name: 'TypeError',
    digest: 'digest-123',
    stack: `Error: boom\n    at https://apks.cc/x?token=leak alice@example.com ${'a'.repeat(5000)}`,
  });

  const report = buildClientErrorReport(
    error,
    { boundary: 'app-error', route: '/community/post/1?email=a%40b.com' },
    {
      now: new Date('2026-10-26T12:00:00Z'),
      href: 'https://apks.cc/community/post/1?token=abc',
      userAgent: 'Mozilla/5.0',
    },
  );

  assert.equal(report.source, 'gameverse-web');
  assert.equal(report.name, 'TypeError');
  assert.equal(report.digest, 'digest-123');
  assert.equal(report.url, 'https://apks.cc/community/post/1');
  assert.equal(report.occurred_at, '2026-10-26T12:00:00.000Z');
  assert.equal(report.message.includes('leak'), false, 'message 里的 query 必须脱敏');
  assert.equal(report.stack.includes('alice@example.com'), false, 'stack 里的邮箱必须脱敏');
  assert.ok(report.stack.length <= 4_001, `stack 应截断，实际 ${report.stack.length}`);
  assert.equal(report.context.route.includes('a%40b.com'), false, 'context 也必须脱敏');
});

test('20% 采样 + 同 message 60s 去重', () => {
  const now = 1_000_000;

  assert.equal(shouldReportClientError('boom', { now, random: () => 0.05 }), true, '5% 随机值应命中采样');
  assert.equal(shouldReportClientError('boom', { now, random: () => 0.99 }), false, '窗口内重复 message 不再上报');
  assert.equal(
    shouldReportClientError('boom', { now: now + CLIENT_ERROR_DEDUPE_WINDOW_MS - 1, random: () => 0.05 }),
    false,
    '窗口内重复 message 不再上报',
  );
  assert.equal(
    shouldReportClientError('boom', { now: now + CLIENT_ERROR_DEDUPE_WINDOW_MS, random: () => 0.05 }),
    true,
    '过了去重窗口可以再次上报',
  );
  assert.equal(shouldReportClientError('another', { now, random: () => 0.2 }), false, '随机值等于采样率不命中');
  assert.equal(shouldReportClientError('another', { now, random: () => 0.19 }), true);
  assert.equal(shouldReportClientError('', { now, random: () => 0 }), false, '空 message 不上报');
});

test('reportClientError 走约定路径，接口失败时不抛错', async () => {
  globalThis.window = { location: { href: 'https://apks.cc/x?token=abc' } };

  await reportClientError(new Error('boom'), { boundary: 'app-error' }, { random: () => 0.01 });

  assert.equal(calls.length, 1);
  assert.match(calls[0].path, /\/tracking\/admin-client-error$/);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.keepalive, true);
  const payload = JSON.parse(calls[0].init.body);
  assert.equal(payload.source, 'gameverse-web');
  assert.equal(payload.url, 'https://apks.cc/x');
  assert.equal(payload.context.boundary, 'app-error');

  // 接口未上线（404）/网络异常：静默
  installFetch(() => {
    throw new TypeError('Failed to fetch');
  });
  await reportClientError(new Error('boom-2'), undefined, { random: () => 0.01 });
});

test('服务端（无 window）不触发上报', async () => {
  await reportClientError(new Error('server side'));
  assert.equal(calls.length, 0);
});
