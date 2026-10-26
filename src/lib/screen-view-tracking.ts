import { apiUrl } from '@/lib/api';
import { buildScreenViewProps } from '@/lib/screen-view-props';
import { buildTrackingHeaders, getTrackingAppVersion } from '@/lib/tracking-headers';

const SCREEN_VIEW_EVENT = 'screen_view';

/**
 * 页面浏览上报：同步返回，不阻塞渲染，任何失败都静默。
 *
 * 注意：服务端 TrackClientEventDto 开了 whitelist，body 里的 session_id /
 * platform / app_version 会被剥掉；真正的身份信息来自 x-session-id、
 * x-client-platform、x-app-version 头，body 字段只是给还没上头的端留的冗余。
 */
export function reportScreenView(pathname: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    const headers = buildTrackingHeaders();
    const props = buildScreenViewProps(
      pathname,
      window.location.search,
      document.referrer || '',
    );

    const body = {
      event_name: SCREEN_VIEW_EVENT,
      platform: 'web',
      app_version: getTrackingAppVersion(),
      session_id: headers['x-session-id'],
      props,
    };

    void fetch(apiUrl('/tracking/event'), {
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
