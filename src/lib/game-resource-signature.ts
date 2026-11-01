import type { ApiDownloadResource } from '@/types';

/**
 * 资源校验值（SHA-256）的取数与展示口径。
 *
 * 后端的字段名是 `signature`（不是 sha256/checksum），GET /game/details 的
 * resources 项会带上它；缺失或不是合法哈希时一律按「无校验值」处理，绝不猜值。
 */
// 只认 64 位 sha256；32 位是同一字段里的历史 md5（123 盘导入脏数据），算法不同，展示就是错的。
const HEX_HASH_PATTERN = /^[0-9a-f]{64}$/i;

export interface ResourceChecksumItem {
  resourceId: string;
  channelName: string;
  version: string;
  /** 完整校验值，复制与比对都用它 */
  signature: string;
  /** 列表里展示的截断形态 */
  signatureShort: string;
}

/**
 * 归一化：去掉空白与可选算法前缀，只认十六进制串。
 * 返回空字符串代表「没有可展示的校验值」（含空值、说明文字、URL 等）。
 */
export function normalizeResourceSignature(raw: unknown): string {
  let value = String(raw ?? '').trim();
  if (!value) return '';
  value = value.replace(/^sha-?256\s*[:=]\s*/i, '').trim();
  return HEX_HASH_PATTERN.test(value) ? value.toLowerCase() : '';
}

/** 截断显示：保留首尾，中间省略；短于阈值时原样返回。 */
export function shortenResourceSignature(signature: string, head = 12, tail = 8): string {
  const value = String(signature || '').trim();
  if (!value) return '';
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/**
 * 每个渠道（资源项）一条；没有校验值的资源不占位，
 * 让页面能区分「这个渠道没给校验值」与「整个资源列表都没给」。
 */
export function buildResourceChecksumItems(
  resources?: ApiDownloadResource[] | null,
): ResourceChecksumItem[] {
  const items: ResourceChecksumItem[] = [];
  for (const resource of Array.isArray(resources) ? resources : []) {
    const signature = normalizeResourceSignature(resource?.signature);
    if (!signature) continue;
    items.push({
      resourceId: String(resource?._id || ''),
      channelName: String(resource?.channel?.name || '').trim() || '下载渠道',
      version: String(resource?.version || '').trim(),
      signature,
      signatureShort: shortenResourceSignature(signature),
    });
  }
  return items;
}
