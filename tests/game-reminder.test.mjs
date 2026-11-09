import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { resolveReminderIntent } from '@/lib/game-reminder';

// 派发单 #181 T181-4：更新提醒三态（已关注 / 未关注 / 未登录）+ 不再走 localStorage。
// 点击意图是纯函数，组件只负责弹登录、乐观更新与失败回滚。

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('未登录：跳登录，不发请求', () => {
  assert.equal(resolveReminderIntent({ hasSession: false, followed: false }), 'login');
  assert.equal(resolveReminderIntent({ hasSession: false, followed: true }), 'login');
});

test('已登录未关注：订阅', () => {
  assert.equal(resolveReminderIntent({ hasSession: true, followed: false }), 'follow');
});

test('已登录已关注：取消订阅', () => {
  assert.equal(resolveReminderIntent({ hasSession: true, followed: true }), 'unfollow');
});

test('详情页提醒已删除 localStorage 的 game-remind:* 路径', async () => {
  const source = await readSource('../src/app/app/[id]/GameDetailActions.client.tsx');
  assert.equal(source.includes('game-remind:'), false);
  assert.equal(source.includes('window.localStorage'), false);
  // 订阅/取关必须打到真实接口。
  assert.ok(source.includes('followReservationByAppId'));
  assert.ok(source.includes('unfollowReservationByAppId'));
  assert.ok(source.includes('fetchReservationFollowStatus'));
});

test('消息页加载时触发一次 GET /game/reservations/my 惰性同步', async () => {
  const [pageSource, reminderSource] = await Promise.all([
    readSource('../src/app/messages/page.tsx'),
    readSource('../src/lib/game-reminder.ts'),
  ]);
  assert.ok(pageSource.includes('triggerReservationFollowSync'));
  assert.ok(reminderSource.includes('/game/reservations/my?page=1&pageSize=1'));
});

test('新文案不承诺推送 / 短信 / 邮件', async () => {
  const source = await readSource('../src/app/app/[id]/GameDetailActions.client.tsx');
  assert.ok(source.includes('已订阅更新提醒'));
  assert.equal(/推送|短信|邮件/.test(source), false);
});
