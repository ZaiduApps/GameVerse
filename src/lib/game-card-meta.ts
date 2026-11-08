import { formatFileSize } from '@/lib/game-detail-jsonld';
import { resolveDisplayVersion } from '@/lib/game-version';

/**
 * 列表卡片「直下信息」（版本 / 包大小 / 更新时间 / 下载来源）的纯函数组装。
 *
 * 背景（#125）：下载点击 258 对详情浏览 92，列表卡片才是真实主路径，但卡片此前
 * 只有图/标题/下载按钮。数据来自列表接口（/game/q、/game/category、/home 专辑、
 * /search/global）的 version / file_size / latest_at / source_type 字段；
 * 任何一项缺失就缺省渲染，绝不写「未知」占位。
 *
 * source_type 口径与详情页一致（interface canonicalImportSourceType）：
 * GP / APKPURE / QOO / GITHUB / 工口实验室；展示上归并为
 * Google Play / APKPure / GitHub，其余渠道一律「第三方」。
 */

export interface GameCardMetaInput {
  version?: string | number | null;
  fileSize?: number | null;
  updatedAt?: string | null;
  sourceType?: string | null;
}

export interface GameCardMeta {
  version: string;
  sizeText: string;
  updatedText: string;
  sourceLabel: string;
}

export function resolveGameSourceLabel(sourceType: unknown): string {
  const normalized = String(sourceType ?? '')
    .trim()
    .toUpperCase();
  if (!normalized) return '';
  if (normalized === 'GP') return 'Google Play';
  if (normalized === 'APKPURE') return 'APKPure';
  if (normalized === 'GITHUB') return 'GitHub';
  return '第三方';
}

/** 卡片上的更新时间只到日；固定 YYYY-MM-DD，避免 SSR/客户端各算各的 locale。 */
export function formatCardUpdateDate(value?: string | null): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function buildGameCardMeta(input: GameCardMetaInput): GameCardMeta {
  const version = resolveDisplayVersion(input?.version);
  return {
    // 库里混有 VARY 占位符与「因设备而异」这类非版本号文本，卡片只认「数字开头」的版本串。
    version: /^\d[\w.\-+ ]{0,29}$/.test(version) ? version : '',
    // 格式化失败（负数/非数值）返回 undefined，按缺失处理。
    sizeText: formatFileSize(Number(input?.fileSize) || undefined) || '',
    updatedText: formatCardUpdateDate(input?.updatedAt),
    sourceLabel: resolveGameSourceLabel(input?.sourceType),
  };
}

/** meta 里至少有一项可展示时才渲染整行，避免孤零零一条分隔线。 */
export function hasGameCardMeta(meta: GameCardMeta): boolean {
  return Boolean(meta.version || meta.sizeText || meta.updatedText || meta.sourceLabel);
}
