import type { ApiDownloadResource } from '@/types';

/**
 * 渠道判定：客户端下载弹窗使用。
 */

export function resolveDownloadChannelId(resource?: ApiDownloadResource | null): string {
  return String(resource?.channel?._id || resource?.channel_id || '').trim();
}

/**
 * Web 侧对 APKPure / Android 定向渠道统一先做本地拦截，引导使用 AC 盒子，
 * 避免先发起 getAppDownload 请求后再发现该渠道并不适合当前 Web 端直下。
 */
export function shouldGuideToApp(resource?: ApiDownloadResource | null): boolean {
  if (!resource) return false;

  const metadataCandidates = [
    resource.channel?.code,
    resource.channel?.name,
    resource.channel?.description,
    resource.platform_range,
    resource.platform_ranges,
    resource.channel?.platform_range,
    resource.channel?.platform_ranges,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  const combinedMetadata = metadataCandidates.join(' | ');
  const isApkPureChannel = combinedMetadata.includes('apkpure');
  const isAndroidScoped =
    combinedMetadata.includes('android') ||
    combinedMetadata.includes('安卓') ||
    combinedMetadata.includes('apk');

  return isApkPureChannel || isAndroidScoped;
}
