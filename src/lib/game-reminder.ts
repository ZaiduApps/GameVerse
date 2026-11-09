/**
 * 详情页「更新提醒」（#181 T181-4）的纯逻辑与服务端状态读取。
 *
 * 订阅状态以服务端 `GET /game/reservations/follow-status` 为准，不再写 localStorage：
 * 同一账号换设备/换浏览器都应看到一致状态。关注/取关复用 profile-dashboard-api 的
 * `POST/DELETE /game/reservations/follow`（失败会回滚乐观更新）。
 */

import { trackedApiFetch } from '@/lib/api';

export type ReminderIntent = 'login' | 'follow' | 'unfollow';

/**
 * 点击「更新提醒」时该做什么：
 * - 未登录 → 弹登录，不发请求（不静默失败）；
 * - 已登录且已关注 → 取消；
 * - 已登录且未关注 → 订阅。
 */
export function resolveReminderIntent(input: {
  hasSession: boolean;
  followed: boolean;
}): ReminderIntent {
  if (!input.hasSession) return 'login';
  return input.followed ? 'unfollow' : 'follow';
}

export interface FollowStatusResult {
  ok: boolean;
  followed: boolean;
  message?: string;
}

/** 读取当前用户对某应用的关注状态；失败时 ok=false，由调用方保持原状态。 */
export async function fetchReservationFollowStatus(params: {
  token: string;
  appId: string;
}): Promise<FollowStatusResult> {
  const token = String(params.token || '').trim();
  const appId = String(params.appId || '').trim();
  if (!token || !appId) {
    return { ok: false, followed: false, message: '参数不完整' };
  }

  try {
    const res = await trackedApiFetch(
      `/game/reservations/follow-status?app_id=${encodeURIComponent(appId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const json: { code?: number; message?: string; data?: { followed?: boolean } } = await res
      .json()
      .catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) {
      return { ok: false, followed: false, message: String(json.message || '查询订阅状态失败') };
    }
    return { ok: true, followed: Boolean(json.data?.followed) };
  } catch {
    return { ok: false, followed: false, message: '查询订阅状态失败，请稍后重试' };
  }
}

/**
 * 消息页加载时触发一次惰性同步：`GET /game/reservations/my` 会在服务端
 * `syncReservationFollowNotification` 里把版本/更新时间变化转成站内通知。
 * 失败不阻断消息列表，也不向用户报错。
 */
export async function triggerReservationFollowSync(token: string | null | undefined): Promise<void> {
  const normalized = String(token || '').trim();
  if (!normalized) return;
  try {
    await trackedApiFetch('/game/reservations/my?page=1&pageSize=1', {
      headers: { Authorization: `Bearer ${normalized}` },
      cache: 'no-store',
    });
  } catch {
    // 惰性同步是尽力而为：下一次进入消息页会重新触发。
  }
}
