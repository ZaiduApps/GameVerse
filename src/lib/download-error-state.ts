import {
  DOWNLOAD_ERROR_REASON_KEY,
  type DownloadFailureReason,
} from '@/lib/game-download-redirect';

/**
 * 下载失败回跳（`/app/{id}?download_error=1&download_error_reason=...`）的页面侧口径。
 *
 * 纯函数 + 常量，方便单测覆盖「渠道不可用 / 资源失效」两条文案与三条出口；
 * 组件只负责渲染，不自己拼 URL。
 */

/** 详情页信息卡里的渠道区（直接下载链接所在位置）。 */
export const DOWNLOAD_CHANNELS_ANCHOR = 'game-detail-channels';
/** 版本与技术参数规格区块。 */
export const DOWNLOAD_VERSIONS_ANCHOR = 'game-detail-specs';

export type DownloadErrorActionKey = 'retry' | 'report' | 'versions';

export interface DownloadErrorAction {
  key: DownloadErrorActionKey;
  label: string;
  href: string;
  /** in-page 用原生锚点，external 走站内路由 */
  target: 'in-page' | 'internal';
}

/** `download_error=1` 的取值判定：老链接不带参数时不算失败态。 */
export function isDownloadErrorFlag(raw: unknown): boolean {
  const value = String(raw ?? '').trim().toLowerCase();
  return value === '1' || value === 'true';
}

/**
 * 原因归一化：只认 resource，其它（含缺省、脏值）按渠道不可用兜底——
 * 老链接没有原因参数，渠道故障也是更常见的失败。
 */
export function parseDownloadErrorReason(raw: unknown): DownloadFailureReason {
  const value = String(raw ?? '').trim().toLowerCase();
  return value === 'resource' ? 'resource' : 'channel';
}

export function buildDownloadErrorActions(params: {
  gameName?: string;
  pageUrl?: string;
  reason?: DownloadFailureReason;
} = {}): DownloadErrorAction[] {
  const query = new URLSearchParams();
  const gameName = String(params.gameName || '').trim();
  const pageUrl = String(params.pageUrl || '').trim();
  if (gameName) query.set('resourceName', gameName);
  if (pageUrl) query.set('sourceUrl', pageUrl);
  if (params.reason) query.set('reason', params.reason);
  const reportHref = query.toString() ? `/submit-resource?${query.toString()}` : '/submit-resource';

  return [
    { key: 'retry', label: '换渠道重试', href: `#${DOWNLOAD_CHANNELS_ANCHOR}`, target: 'in-page' },
    { key: 'report', label: '反馈失效', href: reportHref, target: 'internal' },
    { key: 'versions', label: '查看其他版本', href: `#${DOWNLOAD_VERSIONS_ANCHOR}`, target: 'in-page' },
  ];
}

/** 两条失败原因的标题与说明：渠道故障可换渠道，资源失效需要补档。 */
export function describeDownloadError(reason: DownloadFailureReason): {
  title: string;
  description: string;
} {
  return reason === 'resource'
    ? {
        title: '这个资源暂时失效了',
        description: '下载地址没有成功签发，资源可能已被下架或正在更新。可以查看其它版本，或反馈给我们补档。',
      }
    : {
        title: '这个下载渠道暂时不可用',
        description: '渠道可能临时故障或限流。换一个渠道通常就能继续下载；如果所有渠道都不行，请反馈给我们。',
      };
}

/** 从 URLSearchParams 形状里读取失败态，组件与测试共用一份判定。 */
export function resolveDownloadErrorState(params: {
  get: (key: string) => string | null;
}): { failed: boolean; reason: DownloadFailureReason } {
  return {
    failed: isDownloadErrorFlag(params.get('download_error')),
    reason: parseDownloadErrorReason(params.get(DOWNLOAD_ERROR_REASON_KEY)),
  };
}
