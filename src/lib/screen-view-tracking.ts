import { apiUrl } from '@/lib/api';
import { resolveRouteTemplate } from '@/lib/route-template';
import { buildTrackingHeaders, getTrackingAppVersion } from '@/lib/tracking-headers';

const SCREEN_VIEW_EVENT = 'screen_view';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

function readUtmProps(search: string): Record<string, string> {
  const props: Record<string, string> = {};
  if (!search) return props;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return props;
  }

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) props[key] = value;
  }
  return props;
}

/** 从 /app/<seg> 取包名；解码失败就退回原始段，宁可埋点难看也不抛错。 */
function extractPkgFromPath(pathname: string): string | undefined {
  const segments = pathname.split(/[?#]/, 1)[0].split('/').filter(Boolean);
  const raw = segments[segments.length - 1];
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw) || undefined;
  } catch {
    return raw;
  }
}

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
    const routeTemplate = resolveRouteTemplate(pathname);
    const props: Record<string, string> = {
      route_template: routeTemplate,
      path: pathname,
      referer: document.referrer || '',
      ...readUtmProps(window.location.search),
    };

    const pkg = routeTemplate === '/app/[id]' ? extractPkgFromPath(pathname) : undefined;
    if (pkg) props.pkg = pkg;

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
