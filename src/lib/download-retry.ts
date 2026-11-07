import type { ApiDownloadResource } from '@/types';
import { resolveDownloadChannelId } from '@/lib/game-download-channel';

/**
 * 下载失败后的两个动作（待决策 #140）：原渠道「重试」与「备用渠道」。
 *
 * 口径：
 * - 重试 = 回到刚失败的那个渠道，不承诺会成功；
 * - 备用渠道 = 与刚失败渠道不同的任意渠道，有则给，没有就不给——
 *   文案不承诺「换源就能下」，只把可选项摆出来（#144）。
 * - 没有失败渠道（参数缺失等）时两个都不给：再点一次只会以同样原因失败。
 */

export interface DownloadRetryTarget {
  resource: ApiDownloadResource;
  /** 按钮文案：重试永远是「重试」，不冒充成换渠道。 */
  label: string;
}

function findResource(
  resources: ApiDownloadResource[] | undefined,
  channelId: string,
): ApiDownloadResource | null {
  const list = Array.isArray(resources) ? resources : [];
  return list.find((resource) => resolveDownloadChannelId(resource) === channelId) || null;
}

/** 原渠道重试目标：失败渠道仍在资源列表里时才给。 */
export function pickDownloadRetryTarget(
  resources: ApiDownloadResource[] | undefined,
  failedChannelId: string | null | undefined,
): DownloadRetryTarget | null {
  const failedId = String(failedChannelId || '').trim();
  if (!failedId) return null;

  const resource = findResource(resources, failedId);
  return resource ? { resource, label: '重试' } : null;
}

/** 备用渠道目标：优先第一个与失败渠道不同的渠道；没有则返回 null。 */
export function pickDownloadBackupTarget(
  resources: ApiDownloadResource[] | undefined,
  failedChannelId: string | null | undefined,
): DownloadRetryTarget | null {
  const failedId = String(failedChannelId || '').trim();
  if (!failedId) return null;

  const list = Array.isArray(resources) ? resources : [];
  const resource = list.find(
    (item) => resolveDownloadChannelId(item) !== failedId,
  );
  if (!resource) return null;

  const channelName = String(resource.channel?.name || '').trim();
  return {
    resource,
    label: channelName ? `备用渠道「${channelName}」` : '备用渠道',
  };
}
