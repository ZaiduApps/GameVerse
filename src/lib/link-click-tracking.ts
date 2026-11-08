import { buildLinkClickProps, type CommunityLinkClick } from '@/lib/community-entry';
import { reportTrackEvent } from '@/lib/tracking-event';

/**
 * 社区入口点击上报（link_click）。
 *
 * 只包一层「纯 props → 上报」，字段口径在 community-entry.ts 里固定；
 * 任何失败都静默，点击照常导航。
 */
export function reportCommunityLinkClick(click: CommunityLinkClick): void {
  if (typeof window === 'undefined') return;
  try {
    reportTrackEvent('link_click', buildLinkClickProps(click));
  } catch {
    // 埋点失败不影响导航。
  }
}
