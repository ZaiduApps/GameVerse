import type { CardConfigItem, GameDetailData } from '@/types';

export interface GameFactItem {
  label: string;
  value: string;
}

export interface RelatedNewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
}

export interface CommunityFeedItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  userName: string;
  userAvatarUrl: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
}

export const TAG_STYLE_PALETTES = [
  'border-[#fdc003]/35 bg-[#fff7d6] text-[#6f4c00] shadow-[0_10px_24px_rgba(253,192,3,0.14)]',
  'border-[#7fb3ff]/35 bg-[#eaf3ff] text-[#0d4e8f] shadow-[0_10px_24px_rgba(127,179,255,0.18)]',
  'border-[#ff8f82]/35 bg-[#fff0ed] text-[#8f2018] shadow-[0_10px_24px_rgba(255,119,103,0.16)]',
  'border-[#83d3af]/35 bg-[#ecfbf4] text-[#166247] shadow-[0_10px_24px_rgba(131,211,175,0.16)]',
  'border-[#c7a6ff]/35 bg-[#f5efff] text-[#59358c] shadow-[0_10px_24px_rgba(199,166,255,0.16)]',
  'border-[#8fd7df]/35 bg-[#edf9fb] text-[#155f69] shadow-[0_10px_24px_rgba(143,215,223,0.16)]',
] as const;

export function cleanText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toPlainTextWithBreaks(input?: string | null): string {
  const raw = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|section|article|blockquote|li|ul|ol|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeRichHtml(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(?:script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}

export function formatDescriptionHtml(input?: string | null): string {
  const raw = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';
  if (/<\/?[a-z][^>]*>/i.test(raw)) {
    return sanitizeRichHtml(raw).replace(/\n/g, '<br />');
  }
  return escapeHtml(raw)
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />');
}

export function formatBytes(size?: number | null): string {
  if (!size || size <= 0) return '未知';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export function formatDateText(value?: string | null): string {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatCompactCount(input?: number | string | null): string {
  const value = Number(input || 0);
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function normalizeScore(raw?: number | string | null, fallback = 9.2): string {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback.toFixed(1);
  return value.toFixed(1);
}

export function isPreregGameLike(game: GameDetailData['app']): boolean {
  const typeText = String(game.type || '').toLowerCase();
  if (/pre[-_ ]?reg|预约|事前|预注册/.test(typeText)) return true;
  const tagText = (Array.isArray(game.tags) ? game.tags : []).join(' ').toLowerCase();
  return /pre[-_ ]?reg|预约|事前|预注册|即将上线|coming soon/.test(tagText);
}

export function getGameTags(game: GameDetailData['app']): string[] {
  const tags = (Array.isArray(game.tags) ? game.tags : [])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  if (tags.length > 0) return Array.from(new Set(tags)).slice(0, 8);
  const fallback = [String(game.type || '').trim(), String(game.metadata?.region || '').trim()].filter(Boolean);
  return fallback.length > 0 ? Array.from(new Set(fallback)).slice(0, 4) : ['安卓游戏'];
}

export function getPrimaryCategory(game: GameDetailData['app'], tags: string[]): string {
  const preferredTag = tags.find((tag) => {
    const value = String(tag || '').trim();
    return Boolean(value) && !value.startsWith('#') && !/创收最高|热门免费|人气推荐/i.test(value);
  });
  return preferredTag || String(game.type || '').trim() || '安卓游戏';
}

export function buildTagFilterHref(tag: string): string {
  const safeTag = String(tag || '').trim();
  if (!safeTag) return '/app';
  const params = new URLSearchParams();
  params.set('category', safeTag);
  return `/app?${params.toString()}`;
}

export function resolveSupportItems(
  cardConfig: Record<string, CardConfigItem[] | undefined>,
): CardConfigItem[] {
  const priorityKeys = ['contact', 'partner', 'top', 'middle', 'bottom'];
  const items: CardConfigItem[] = [];
  const pushItems = (list?: CardConfigItem[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (item?.content) items.push(item);
    });
  };

  priorityKeys.forEach((key) => pushItems(cardConfig[key]));
  Object.entries(cardConfig).forEach(([key, list]) => {
    if (!priorityKeys.includes(key) && key !== 'download_notice') pushItems(list);
  });

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item._id}-${item.content?.title || ''}-${item.content?.link || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

export function buildGameFactItems(
  game: GameDetailData['app'],
  options: { category: string; resourceCount: number; isWebGame: boolean },
): GameFactItem[] {
  const facts: GameFactItem[] = [];
  const pushFact = (label: string, value?: string | number | null) => {
    const text = cleanText(String(value || ''));
    if (text && text !== '未知') facts.push({ label, value: text });
  };

  if (!options.isWebGame) {
    pushFact('包名', game.pkg);
    pushFact('当前版本', game.version);
  }
  pushFact('更新日期', formatDateText(game.latest_at));
  if (!options.isWebGame) pushFact('安装包大小', formatBytes(game.file_size));
  pushFact('开发者', game.developer);
  pushFact('区服/地区', game.metadata?.region);
  pushFact('游戏分类', options.category);
  if (!options.isWebGame && options.resourceCount > 0) {
    pushFact('可用下载渠道', `${options.resourceCount} 个`);
  }
  return facts.slice(0, 8);
}

export function buildInstallSteps(game: GameDetailData['app']): string[] {
  const name = String(game.name || '该应用').trim() || '该应用';
  return [
    '点击页面中的“立即下载”，优先选择更新日期较新的渠道资源。',
    `下载完成后，确认安装包大小与页面展示信息基本一致，再开始安装 ${name}。`,
    '首次安装第三方 APK 时，请根据设备系统提示授权安装权限。',
  ];
}

export function buildRiskNotes(game: GameDetailData['app']): string[] {
  const packageName = String(game.pkg || '').trim() || '未知包名';
  return [
    `安装前请核对包名 ${packageName} 与目标应用是否一致，避免误装非目标版本。`,
    '若设备已安装同名旧版本，建议先确认版本兼容性，再决定覆盖安装或重新安装。',
    '如下载来源异常或安装后行为异常，请暂停使用并重新核对下载渠道。',
  ];
}
