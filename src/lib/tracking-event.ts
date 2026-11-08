import { trackedApiFetch } from '@/lib/api';
import { buildTrackingHeaders, getTrackingAppVersion } from '@/lib/tracking-headers';

/**
 * 客户端埋点的统一出口：screen_view / link_click 等事件共用同一套身份头。
 * 同步返回、失败静默，不阻塞页面渲染或导航。
 *
 * 注意：服务端 TrackClientEventDto 开了 whitelist，body 里的 session_id /
 * platform / app_version 会被剥掉；真正的身份信息来自 x-session-id、
 * x-client-platform、x-app-version 头，body 字段只是给还没上头的端留的冗余。
 */
export function reportTrackEvent(eventName: string, props: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  try {
    const headers = buildTrackingHeaders();
    const body = {
      event_name: eventName,
      platform: 'web',
      app_version: getTrackingAppVersion(),
      session_id: headers['x-session-id'],
      props,
    };

    void trackedApiFetch('/tracking/event', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {
    // 广告拦截、隐私模式、序列化失败等一律静默，不重试、不排队。
  }
}
