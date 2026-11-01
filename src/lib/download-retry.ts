import type { ApiDownloadResource } from '@/types';
import { resolveDownloadChannelId } from '@/lib/game-download-channel';

/**
 * 下载失败后「一键换渠道重试」的目标选择（待决策 #119）。
 *
 * 口径：优先换一个与刚失败渠道不同的渠道（这才是「换渠道」，不是原样重试）；
 * 只有一个渠道时才退回原渠道重试。没有失败渠道（参数缺失等）时不给重试按钮，
 * 因为再点一次只会以同样原因失败。
 */

export interface DownloadRetryTarget {
  resource: ApiDownloadResource;
  /** 按钮文案：换渠道时带上目标渠道名，方便用户知道会走哪条路。 */
  label: string;
}

export function pickDownloadRetryTarget(
  resources: ApiDownloadResource[] | undefined,
  failedChannelId: string | null | undefined,
): DownloadRetryTarget | null {
  const failedId = String(failedChannelId || '').trim();
  if (!failedId) return null;

  const list = Array.isArray(resources) ? resources : [];
  if (list.length === 0) return null;

  const alternative = list.find(
    (resource) => resolveDownloadChannelId(resource) !== failedId,
  );
  const target =
    alternative ||
    list.find((resource) => resolveDownloadChannelId(resource) === failedId);
  if (!target) return null;

  const channelName = String(target.channel?.name || '').trim();
  return {
    resource: target,
    label: alternative ? `换「${channelName || '其他渠道'}」重试` : '重试',
  };
}
