import { trackedApiFetch } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';

/**
 * 下载点击上报（待决策 #65）。
 *
 * 口径：`download_click` = **客户端声明的用户点击意图**，必须带 `event_id`，
 * 服务端按 id 去重。服务端不再把「getAppDownload 被调用一次」记成点击。
 *
 * 只在用户真正发起下载动作时调用（「获取游戏」打开下载弹窗、弹窗里的渠道按钮、
 * 服务端直出直链）；`surface` 用来区分这三种位置。
 *
 * 不阻塞跳转：失败静默，下载可用性永远优先。
 */

export type DownloadClickSurface = 'detail_open' | 'detail_dialog' | 'detail_ssr';

export interface DownloadClickInput {
  appId?: string | null;
  pkg?: string | null;
  channelId?: string | null;
  surface: DownloadClickSurface;
}

function createEventId(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `dl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function reportDownloadClick(input: DownloadClickInput): void {
  if (typeof window === 'undefined') return;

  try {
    const body = {
      event_name: 'download_click',
      event_id: createEventId(),
      occurred_at: new Date().toISOString(),
      app_id: String(input.appId || '').trim() || undefined,
      pkg: String(input.pkg || '').trim() || undefined,
      channel_id: String(input.channelId || '').trim() || undefined,
      props: { surface: input.surface },
    };

    // keepalive：跳转到 302 入口后请求仍然送达；失败静默，不重试、不排队。
    void trackedApiFetch('/tracking/event', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...buildTrackingHeaders() },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
    // 序列化失败、隐私模式等一律静默。
  }
}
