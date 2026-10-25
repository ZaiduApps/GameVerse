import { resolveGameName } from '@/lib/game-display-name';
import { buildRenderedMarkdownDocument } from '@/lib/utils';
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
  tag: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
}

export const TAG_STYLE_PALETTES = [
  'border-tone-amber/40 bg-tone-amber/10 text-tone-amber',
  'border-tone-blue/40 bg-tone-blue/10 text-tone-blue',
  'border-tone-red/40 bg-tone-red/10 text-tone-red',
  'border-tone-green/40 bg-tone-green/10 text-tone-green',
  'border-tone-violet/40 bg-tone-violet/10 text-tone-violet',
  'border-tone-cyan/40 bg-tone-cyan/10 text-tone-cyan',
] as const;

// 同一份原始描述同时喂给「游戏介绍」富文本和标题下的 hero 摘要、highlights、
// latest_content 等纯文本字段。formatDescriptionHtml 只负责富文本那一侧；纯文本
// 入口 cleanText 过去只剥 HTML 标签，于是从 GitHub Release 导入的 `### Features`、
// `**加粗**`、`[#642](url)` 会以字面量留在摘要行里。下面这层只删 Markdown 标记
// 本身，正文和换行结构原样保留，最后的空白折叠仍由 cleanText 统一收口。
const MARKDOWN_LINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  // 单行的 ***、---、___ 是分隔线，APKPure 的描述正文里直接当分隔符用；纯文本里
  // 没有意义，且必须先于行内 `**`/`*` 规则处理，否则 `***` 会被当成粗体残片留下。
  // 整行删掉（不换成空行），只认「整行只有这些符号和空白」，正文里的 `2*3`、
  // `a--b`、`file_name_x` 不受影响。
  [/^[ \t]*(?:\*[ \t]*){3,}$/gm, ''],
  [/^[ \t]*(?:-[ \t]*){3,}$/gm, ''],
  [/^[ \t]*(?:_[ \t]*){3,}$/gm, ''],
  // 行首标题/无序列表/有序列表：只去掉标记本身，不吞正文。
  [/^[ \t]*#{1,6}[ \t]+/gm, ''],
  [/^[ \t]*[-*+][ \t]+/gm, ''],
  [/^[ \t]*\d+\.[ \t]+/gm, ''],
];

// 顺序有依赖：图片先于链接，加粗/删除线先于单星号斜体。
// 边界条件（`2*3`、`game_name_field`）是为了不改动正常文案里的孤立星号和下划线；
// 括号类正则允许 `)` 缺失，因为后台会把超长描述在 8000 字符处截断，最后一条链接
// 常常没有闭合括号。
const MARKDOWN_INLINE_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/!\[([^\]\n]*)\]\([^)\n]*(?:\)|$)/g, '$1'],
  [/\[([^\]\n]+)\]\([^)\n]*(?:\)|$)/g, '$1'],
  [/`([^`\n]+)`/g, '$1'],
  // 删除线在发行说明里表示「已废弃/已删除」，摘要行里连内容一起去掉，
  // 免得 hero 摘要出现「old new」这种自相矛盾的读法；完整介绍仍由富文本保留原文。
  [/~~[^~\n]+~~/g, ''],
  [/\*\*([^*\n]+)\*\*/g, '$1'],
  [/(^|[^A-Za-z0-9_])__([^_\n]+)__(?![A-Za-z0-9_])/g, '$1$2'],
  [/(^|[^A-Za-z0-9_*])\*([^*\n]+)\*(?![A-Za-z0-9_*])/g, '$1$2'],
  [/(^|[^A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g, '$1$2'],
];

const HTML_ENTITY_PATTERN = /&(nbsp|amp|lt|gt|quot|#39|apos);/g;
const HTML_ENTITY_REPLACEMENTS: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
};

function stripMarkdownText(input: string): string {
  const stripped = MARKDOWN_LINE_RULES.concat(MARKDOWN_INLINE_RULES).reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    input,
  );
  return stripped.replace(
    HTML_ENTITY_PATTERN,
    (match, name: string) => HTML_ENTITY_REPLACEMENTS[name] ?? match,
  );
}

export function cleanText(input?: string | null): string {
  if (!input) return '';
  const withoutTags = input.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  return stripMarkdownText(withoutTags).replace(/\s+/g, ' ').trim();
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
    // 归一标题层级：游戏详情页本身已经有一个 h1（游戏名），DB 描述里再带
    // <h1> 会让页面出现多个 h1，稀释主题语义。这里降级为 h2 而不是删除，保留
    // 作者原本的段落结构。视觉零变化——Tailwind preflight 已把 h1~h6 的
    // font-size / font-weight 重置为 inherit，标题标签本就不带字号字重差异。
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1\s*>/gi, '</h2>')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(?:script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}

// 从 GitHub Release 正文导入的描述是 HTML 与 Markdown 混排：结构是 <p>/<details>，
// 内容是 ### / ** / 列表 / 链接。只按「有没有 HTML 标签」分流会把它整段当富文本原样输出，
// 读者看到的是字面量 `### Features`。这里先认 Markdown，再决定用哪条渲染链。
const MARKDOWN_DESCRIPTION_HINT =
  /^(?:#{1,6}\s|\s*[-*+]\s|\d+\.\s|>\s|\|.*\|)|(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/m;

// 白名单不成立：线上描述里还会出现 <font color>、<b>、<u> 这类花色标签，
// 漏掉任何一个都会被 Markdown 渲染器转义成可见的 `&lt;font&gt;` 文本。
// 这里通用暂存所有剩余标签，安全性由还原后的 sanitizeRichHtml 兜底。
const HTML_TAG_PATTERN = /<[^>]+>/g;

function renderMixedMarkdownDescription(raw: string): string {
  const inlineTags: string[] = [];
  const normalized = raw
    // 换行与块级结束标签先还原成真实换行，Markdown 的行结构才成立。
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|h[1-6]|li|tr|ul|ol|details|summary)>/gi, '\n')
    // 块级开标签直接删掉：段落、列表、表格的骨架改由 Markdown 渲染器生成，
    // 留着会让块级标签嵌进 Markdown 段落里。
    .replace(
      /<(?:p|div|ul|ol|table|thead|tbody|tr|td|th|details|summary)\b[^>]*>/gi,
      '',
    )
    // 原来的 HTML 标题统一转成 Markdown 标题，输出后与正文里的 `###` 是同一套样式。
    .replace(/<h([1-6])\b[^>]*>/gi, (_match, level: string) => `\n${'#'.repeat(Number(level))} `)
    // 剩余标签（行内标签、花色标签）统一交给占位符托管：Markdown 渲染器会把
    // 正文里剩下的 `<`/`>` 转义，不暂存的话 <a>/<img>/<font> 会变成可见的标签文本。
    .replace(HTML_TAG_PATTERN, (tag) => {
      const index = inlineTags.length;
      inlineTags.push(tag);
      return `\u0000${index}\u0000`;
    });

  const rendered = buildRenderedMarkdownDocument(normalized, {
    preset: 'detail',
    demoteLevelOneHeadings: true,
  }).html;
  const restored = rendered.replace(
    /\u0000(\d+)\u0000/g,
    (_match, index: string) => inlineTags[Number(index)] ?? '',
  );
  return sanitizeRichHtml(restored);
}

export function formatDescriptionHtml(input?: string | null): string {
  const raw = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';
  if (MARKDOWN_DESCRIPTION_HINT.test(raw)) {
    return renderMixedMarkdownDescription(raw);
  }
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
  const name = resolveGameName(game) || '该应用';
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
