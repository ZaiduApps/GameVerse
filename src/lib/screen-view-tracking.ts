import { buildScreenViewProps } from '@/lib/screen-view-props';
import { reportTrackEvent } from '@/lib/tracking-event';

const SCREEN_VIEW_EVENT = 'screen_view';

/**
 * 页面浏览上报：同步返回，不阻塞渲染，任何失败都静默。
 * 事件发送与身份头统一由 reportTrackEvent 负责。
 */
export function reportScreenView(pathname: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    reportTrackEvent(
      SCREEN_VIEW_EVENT,
      buildScreenViewProps(pathname, window.location.search, document.referrer || ''),
    );
  } catch {
    // 广告拦截、隐私模式、序列化失败等一律静默，不重试、不排队。
  }
}
