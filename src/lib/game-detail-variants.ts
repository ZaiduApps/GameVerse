import { formatFileSize } from '@/lib/game-detail-jsonld';
import { resolveDownloadChannelId } from '@/lib/game-download-channel';
import type { ApiDownloadResource } from '@/types';

/**
 * 「版本 / 渠道变体表」的行模型：只保留接口真实返回的渠道数据。
 *
 * 派发单 #80 口径：只渲染数据里真实存在的渠道，缺渠道 ID / 渠道名的资源整行丢弃；
 * 版本 / 包大小缺失时留空单元格，不写「未知」、不造占位数据。
 */
export interface GameVariantRow {
  key: string;
  channelId: string;
  channelName: string;
  /** 渠道资源的真实版本号；接口未返回时为空串。 */
  version: string;
  /** 人类可读的包大小；接口未返回或非正数时为空串。 */
  sizeLabel: string;
  /** 可抓取的下载 302 入口（不依赖 JS）。 */
  href: string;
}

export function buildGameVariantRows(
  resources: unknown,
  pkg?: string | null,
): GameVariantRow[] {
  const canonicalPkg = String(pkg || '').trim();
  if (!canonicalPkg || !Array.isArray(resources)) return [];

  const rows: GameVariantRow[] = [];
  const seen = new Set<string>();
  for (const resource of resources as ApiDownloadResource[]) {
    const channelId = resolveDownloadChannelId(resource);
    const channelName = String(resource?.channel?.name || '').trim();
    if (!channelId || !channelName) continue;
    const version = String(resource?.version || '').trim();
    // 同渠道同版本只出一行；同渠道不同版本（多 ABI / 历史包）各自成行。
    const dedupeKey = `${channelId}|${version}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    rows.push({
      key: dedupeKey,
      channelId,
      channelName,
      version,
      sizeLabel: formatFileSize(resource?.size) || '',
      href: `/app/${encodeURIComponent(canonicalPkg)}/download/${encodeURIComponent(channelId)}`,
    });
  }
  return rows;
}
