import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { afterEach } from 'node:test';

import {
  CONTENT_REPORT_REASONS,
  buildContentReportPayload,
  describeContentReportTarget,
  resolveContentReportReason,
} from '../src/lib/content-report.ts';

const DIALOG_SOURCE = new URL('../src/components/content-report-dialog.tsx', import.meta.url);

afterEach(() => {
  delete globalThis.window;
});

test('原因枚举覆盖派发单要求的五类', () => {
  assert.deepEqual(
    CONTENT_REPORT_REASONS.map((item) => item.label),
    ['违法违规', '侵权', '内容失效', '垃圾广告', '其他'],
  );
});

test('未知原因归一到「其他」', () => {
  assert.equal(resolveContentReportReason('spam').label, '垃圾广告');
  assert.equal(resolveContentReportReason('not-a-reason').label, '其他');
  assert.equal(resolveContentReportReason('').label, '其他');
});

test('举报对象的中文名', () => {
  assert.equal(describeContentReportTarget('post'), '帖子');
  assert.equal(describeContentReportTarget('comment'), '评论');
  assert.equal(describeContentReportTarget('resource'), '资源');
});

test('提交 payload 含 type=content_report / target_id / ref_url', () => {
  const payload = buildContentReportPayload({
    targetType: 'comment',
    targetId: 'comment-123',
    reason: 'spam',
    note: '评论区刷广告',
    refUrl: 'https://apks.cc/community/post/abc',
    user: { _id: 'u1', name: '测试用户', email: 'u@example.com' },
  });

  assert.equal(payload.type, 'content_report');
  assert.equal(payload.target_id, 'comment-123');
  assert.equal(payload.ref_url, 'https://apks.cc/community/post/abc');
  assert.equal(payload.title, '内容举报：评论');
  assert.match(String(payload.description), /举报原因：垃圾广告/);
  assert.match(String(payload.description), /补充说明：评论区刷广告/);
  assert.match(String(payload.description), /对象 ID：comment-123/);
  assert.equal(payload.user_id, 'u1');
  assert.equal(payload.nickname, '测试用户');
});

test('缺少 refUrl 时回落到 window.location.href', () => {
  globalThis.window = { location: { href: 'https://apks.cc/app/com.demo.game' } };

  const payload = buildContentReportPayload({
    targetType: 'post',
    targetId: 'post-1',
    reason: 'illegal',
  });

  assert.equal(payload.ref_url, 'https://apks.cc/app/com.demo.game');
});

test('没有 window 时 ref_url 仍存在（空串），不会缺字段', () => {
  const payload = buildContentReportPayload({
    targetType: 'resource',
    targetId: 'res-1',
    reason: 'invalid',
  });

  assert.equal(payload.ref_url, '');
});

test('组件只通过统一 builder 组装 payload 并复用反馈接口', async () => {
  const source = await readFile(DIALOG_SOURCE, 'utf8');

  assert.match(source, /buildContentReportPayload\(/);
  assert.match(source, /submitFeedbackTicket\(payload, token\)/);
  // 不允许组件自己另拼 type/target_id，避免和后台口径漂移。
  assert.doesNotMatch(source, /type:\s*['"]content_report['"]/);
});
