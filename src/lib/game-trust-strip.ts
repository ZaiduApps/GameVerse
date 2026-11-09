import { buildGameCardMeta } from '@/lib/game-card-meta';
import { buildResourceChecksumItems } from '@/lib/game-resource-signature';

import type { ApiDownloadResource } from '@/types';

/**
 * 详情页首屏「可信信息条」的取数与展示口径（派发单 #180）。
 *
 * 只汇总仓库里已有真实来源的字段：版本 / 包大小 / 更新日期 / 来源（buildGameCardMeta）
 * 与 SHA-256 覆盖数（buildResourceChecksumItems / resources）。任何一项取不到就不生成
 * 该条，渲染层据此整项隐藏——不写「未知」「暂无」「—」之类的占位。
 *
 * 页游（type=web）没有可安装的包，包大小与校验值不是它的属性，一律不生成；
 * 版本 / 更新日期 / 来源仍按真实字段展示。
 */

export type GameTrustItemKey = 'version' | 'size' | 'updated' | 'source' | 'checksum';

export interface GameTrustItem {
  key: GameTrustItemKey;
  label: string;
  value: string;
}

export interface GameTrustInput {
  version?: string | number | null;
  fileSize?: number | null;
  updatedAt?: string | null;
  sourceType?: string | null;
  resources?: ApiDownloadResource[] | null;
  /** 页游：跳过只对安装包有意义的包大小与 SHA-256 覆盖。 */
  isWebGame?: boolean;
}

export function buildGameTrustItems(input: GameTrustInput = {}): GameTrustItem[] {
  const isWebGame = input.isWebGame === true;
  const meta = buildGameCardMeta({
    version: input.version,
    fileSize: isWebGame ? null : input.fileSize,
    updatedAt: input.updatedAt,
    sourceType: input.sourceType,
  });

  const items: GameTrustItem[] = [];
  if (meta.version) items.push({ key: 'version', label: '版本', value: meta.version });
  if (meta.sizeText) items.push({ key: 'size', label: '包大小', value: meta.sizeText });
  if (meta.updatedText) items.push({ key: 'updated', label: '更新日期', value: meta.updatedText });
  if (meta.sourceLabel) items.push({ key: 'source', label: '来源', value: meta.sourceLabel });

  if (!isWebGame) {
    const resources = Array.isArray(input.resources) ? input.resources : [];
    const covered = buildResourceChecksumItems(resources).length;
    // 分母是接口真实返回的渠道数；分子是其中带合法 SHA-256 的渠道数。
    if (covered > 0 && resources.length > 0) {
      items.push({ key: 'checksum', label: 'SHA-256', value: `${covered}/${resources.length} 渠道` });
    }
  }

  return items;
}
