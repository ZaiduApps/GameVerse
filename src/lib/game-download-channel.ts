import type { ApiDownloadResource } from '@/types';

/**
 * 下载渠道判定的唯一来源：客户端下载弹窗与结构化数据共用这一份，
 * 避免「弹窗拦截了 APKPure，JSON-LD 却把它声明成直下入口」这类两处口径漂移。
 */

export interface DownloadChannelLink {
  channelId: string;
  resourceId: string;
  channelName: string;
  /** 服务端直出的 302 入口，形如 /app/{pkg}/download/{channelId} */
  href: string;
}

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

/**
 * 可直下渠道的 302 入口清单：只服务于结构化数据（JSON-LD `InstallAction.target`），
 * 详情页不再把这些链接渲染成可见按钮。
 *
 * `gameId` 用与页面 URL 一致的标识（包名优先），同一个渠道只出一份链接。
 */
export function buildDirectDownloadLinks(
  resources: ApiDownloadResource[] | undefined | null,
  gameId: string | undefined | null,
): DownloadChannelLink[] {
  const encodedGameId = encodeURIComponent(String(gameId || '').trim());
  if (!encodedGameId) return [];

  const seen = new Set<string>();
  const links: DownloadChannelLink[] = [];

  for (const resource of Array.isArray(resources) ? resources : []) {
    const channelId = resolveDownloadChannelId(resource);
    if (!channelId || seen.has(channelId)) continue;
    if (shouldGuideToApp(resource)) continue;
    seen.add(channelId);
    links.push({
      channelId,
      resourceId: String(resource?._id || ''),
      channelName: String(resource?.channel?.name || '').trim() || '下载渠道',
      href: `/app/${encodedGameId}/download/${encodeURIComponent(channelId)}`,
    });
  }

  return links;
}

/**
 * 结构化数据（JSON-LD `InstallAction.target`）里「下载」动作的落点：
 * 优先第一个可直接下载渠道的 302 入口（`/app/{pkg}/download/{channelId}`），
 * 没有直下渠道时回退到详情页自身。
 *
 * 渠道筛选必须复用 `buildDirectDownloadLinks`——结构化数据的声明与下载弹窗的
 * 渠道口径必须同源，否则会出现「JSON-LD 说能直下、弹窗只给引导」的漂移。
 */
export function resolveInstallActionTarget(
  resources: ApiDownloadResource[] | undefined | null,
  gameId: string | undefined | null,
  canonicalUrl: string,
): string {
  const [first] = buildDirectDownloadLinks(resources, gameId);
  if (!first) return canonicalUrl;
  try {
    return new URL(first.href, canonicalUrl).href;
  } catch {
    // canonicalUrl 不是合法绝对 URL 时不做拼接，保持详情页自身。
    return canonicalUrl;
  }
}
