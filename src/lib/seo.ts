const FALLBACK_SITE_URL = 'https://apks.cc';

const DEFAULT_SITE_SHARE_IMAGE = '/opengraph-image.png';
const FIRST_PARTY_FAVICON = '/favicon.ico';

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 160;

export type GameDetailSeoInput = {
  name?: string | null;
  pkg?: string | null;
  type?: string | null;
  region?: string | null;
  version?: string | null;
  summary?: string | null;
  latestAt?: string | null;
  manualTitle?: string | null;
  manualDescription?: string | null;
  manualKeywords?: Array<string | null | undefined> | null;
  aliases?: string[] | null;
  /** 详情页首个标签，用作别名标题里的“题材”。 */
  genre?: string | null;
  titleTemplate?: string | null;
  descriptionTemplate?: string | null;
  titleSuffix?: string | null;
};

const SEO_MARKUP_NOISE_PATTERN =
  /!\[[^\]]*\]\(|\[[^\]]+\]\(|\b(?:https?|acbox|uu-mobile):\/\/|<[^>]+>|[`*_~]/i;

export function hasSeoMarkupNoise(input?: string | null): boolean {
  return SEO_MARKUP_NOISE_PATTERN.test(String(input || '').trim());
}

export function sanitizeSeoText(input?: string | null): string {
  const raw = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';

  return raw
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, ' $1 ')
    .replace(
      /<p[^>]*class=["'][^"']*defined-image[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      ' ',
    )
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/!\[[^\]]*\]\((?:[^)]+)\)/g, ' ')
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, ' $1 ')
    .replace(/!\[[^\]]*\]\(/g, ' ')
    .replace(/\[([^\]]+)\]\(/g, ' $1 ')
    .replace(/^>+\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^---+$/gm, ' ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\b(?:https?|acbox|uu-mobile):\/\/[^\s<>"')\]]+/gi, ' ')
    .replace(
      /<\/?(?:p|div|section|article|blockquote|li|ul|ol|h[1-6]|span|strong|em|code|pre|table|thead|tbody|tr|th|td)[^>]*>/gi,
      ' ',
    )
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .replace(/([《「『（【〈“‘])\s+/g, '$1')
    .replace(/\s+([》」』）】〉”’、，。！？；：])/g, '$1')
    .trim();
}

export function clampSeoDescription(input?: string | null, max = 155): string {
  const text = sanitizeSeoText(input);
  if (!text || text.length <= max) return text;

  const sliced = text
    .slice(0, Math.max(1, max - 3))
    .replace(/[，。；、\s]+$/u, '')
    .trim();
  return `${sliced || text.slice(0, Math.max(1, max - 3)).trim()}...`;
}

function trimSeoDescriptionPart(input?: string | null): string {
  return sanitizeSeoText(input)
    .replace(/^[\s,，、。；;：:]+/u, '')
    .replace(/[\s,，、。；;：:]+$/u, '')
    .trim();
}

function appendSeoDescriptionPart(source: string, addition: string): string {
  const current = trimSeoDescriptionPart(source);
  const next = trimSeoDescriptionPart(addition);
  if (!current) return next;
  if (!next || current.includes(next)) return current;
  const separator = /[。！？]$/u.test(current) ? '' : /[.!?]$/u.test(current) ? ' ' : '。';
  return `${current}${separator}${next}`;
}

export function buildSeoDescription(
  input?: string | null,
  additions: Array<string | null | undefined> = [],
  options: { min?: number; max?: number } = {},
): string {
  const min = Math.max(0, options.min ?? 120);
  const max = Math.max(1, options.max ?? 155);
  const parts = [input, ...additions].map(trimSeoDescriptionPart).filter(Boolean);
  let description = '';

  for (const part of parts) {
    description = appendSeoDescriptionPart(description, part);
    if (description.length >= min) break;
  }

  return clampSeoDescription(description, max);
}

/**
 * 站点配置模板占位符渲染：{name} {pkg} {version} {alias} {region} {summary} {site_name} {title_suffix} {date}。
 *
 * - 未传值的占位渲染成空串；
 * - 空 alias 留下的空括号（`（）`/`()`/`【】`/`[]`）和由此产生的多余空格会被清理；
 * - 模板已带 `v` 前缀时不会拼出 `vv1.2`。
 */
export function renderSeoTemplate(
  template: string | null | undefined,
  vars: Record<string, string>,
): string {
  let out = String(template || '').trim();
  if (!out) return '';
  // 版本被丢弃时（构建号/空值），模板里自带的 `v` 会变成孤立的 "v"（"… v Download …"），一并去掉。
  if (!String(vars.version ?? '').trim()) {
    out = out.replace(/[vV]\s*\{version\}/g, '');
  }
  for (const key of SEO_TEMPLATE_PLACEHOLDERS) {
    out = out.split(`{${key}}`).join(String(vars[key] ?? ''));
  }
  out = out
    .replace(EMPTY_BRACKET_PATTERN, ' ')
    .replace(/\bv\s*v+(?=[\d.])/gi, 'v');
  return sanitizeSeoText(out);
}

const SEO_TEMPLATE_PLACEHOLDERS = [
  'name',
  'pkg',
  'version',
  'alias',
  'region',
  'summary',
  'site_name',
  'title_suffix',
  'date',
] as const;

/** 空占位留下的成对括号，连同两侧空白一起清掉（避免 `Name（）APK` / `Name () APK`）。 */
const EMPTY_BRACKET_PATTERN = /\s*[（(【\[]\s*[）)】\]]\s*/g;

const PURE_BUILD_NUMBER_VERSION = /^\d{6,}$/;

/**
 * 模板版本号归一化：
 * - 纯数字构建号（Android versionCode，如 `160402020`）不是用户可读版本，丢弃；
 * - 去掉重复的 `v` 前缀，统一成 `v1.2.3` 风格（模板自带 `v` 时不会拼成 `vv1.2`）。
 */
export function normalizeSeoTemplateVersion(input?: string | null): string {
  const raw = sanitizeSeoText(input);
  if (!raw) return '';
  const bare = raw.replace(/^[vV]+/, '').trim();
  if (!bare || PURE_BUILD_NUMBER_VERSION.test(bare)) return '';
  return `v${bare}`;
}

function formatSeoDate(input?: string | null): string {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

const CJK_PATTERN = /[㐀-鿿]/;

/** 别名尾部的英文括注（如 `部落冲突:皇室战争(Clash Royale)` 的括号部分）对中文用户没有信息量，展示前剥掉。 */
const TRAILING_LATIN_ALIAS_SUFFIX = /\s*[(（][A-Za-z0-9 .,:'"&!\-]+[)）]\s*$/;

function normalizeSeoAliases(input?: string[] | null): string[] {
  return Array.from(
    new Set(
      (Array.isArray(input) ? input : [])
        .map((item) => sanitizeSeoText(item))
        .filter((item) => item && item.length <= 40),
    ),
  ).slice(0, 10);
}

/**
 * 从别名列表里取第一个中文别名（繁体也算），且不能与页面主名称重复。
 * 详情页的可见副标题 / meta 描述 / 正文首段都以此为准，保证口径一致。
 * 标题只在站点模板显式写了 `{alias}` 时才使用别名，不会自动把别名拼进标题。
 */
export function resolveChineseAlias(aliases: unknown, name?: string | null): string {
  const list = Array.isArray(aliases) ? aliases : [];
  const normalizedName = sanitizeSeoText(name).toLowerCase();
  for (const item of list) {
    const alias = sanitizeSeoText(item)
      .replace(TRAILING_LATIN_ALIAS_SUFFIX, '')
      .trim();
    if (!alias || !CJK_PATTERN.test(alias)) continue;
    if (normalizedName && alias.toLowerCase() === normalizedName) continue;
    return alias;
  }
  return '';
}

/** 正文首段只在开头引入一次别名，原文已经提到别名时不再重复。 */
export function prependAliasToDescription(
  description?: string | null,
  alias?: string | null,
): string {
  const text = String(description || '').trim();
  const aliasText = sanitizeSeoText(alias);
  if (!text || !aliasText || text.includes(aliasText)) return text;
  return `中文名「${aliasText}」。${text}`;
}

/** 详情页使用稳定下载意图文案，版本、日期、大小等易过期字段不进入主描述。优先级：人工 SEO > 站点模板 > 内置模板。 */
export function buildGameDetailSeo(input: GameDetailSeoInput, siteName = 'APKScc') {
  const name = sanitizeSeoText(input.name) || sanitizeSeoText(input.pkg) || '安卓游戏';
  const pkg = sanitizeSeoText(input.pkg);
  const type = sanitizeSeoText(input.type).toLowerCase();
  const region = sanitizeSeoText(input.region);
  const isWebGame = type === 'web';
  const manualTitle = sanitizeSeoText(input.manualTitle);
  const manualDescription = sanitizeSeoText(input.manualDescription);
  const normalizedSiteName = sanitizeSeoText(siteName) || 'APKScc';
  const regionPhrase = region ? `，提供${region}相关下载信息` : '';
  const aliases = normalizeSeoAliases(input.aliases);
  const chineseAlias = resolveChineseAlias(aliases, name);
  const version = normalizeSeoTemplateVersion(input.version);
  const templateVars = {
    name,
    pkg,
    version,
    alias: chineseAlias,
    region,
    summary: sanitizeSeoText(input.summary),
    site_name: normalizedSiteName,
    title_suffix: String(input.titleSuffix || '').replace(/\s+/g, ' '),
    date: formatSeoDate(input.latestAt),
  };
  const titleCore = manualTitle || renderSeoTemplate(input.titleTemplate, templateVars) || (
    isWebGame
      ? `${name} 网页游戏${region ? ` ${region}` : ''} - 在线游玩`
      : `${name} APK下载${region ? ` - ${region}下载` : ''}`
  );
  // 标题先截主体再挂站点后缀，保证整条 ≤ SEO_TITLE_MAX 且后缀不被截掉；
  // 构建号版本已在模板变量里归一化成空串，不会出现 v160402020。
  const title = buildSeoTitle(titleCore, normalizedSiteName, SEO_TITLE_MAX);
  const baseDescription = manualDescription || renderSeoTemplate(input.descriptionTemplate, templateVars) || (
    isWebGame
      ? `获取${name}网页游戏入口，查看游戏介绍、玩法特色和社区资讯${regionPhrase}。通过${normalizedSiteName}快速找到${name}并开始游玩。`
      : `下载${name}安卓版 APK，获取安全可靠的游戏下载入口${regionPhrase}。在${normalizedSiteName}查看游戏介绍、玩法特色和可用资源，快速安装并开始游玩。`
  );
  // 中文别名必须出现在 meta description 里（别名是用户实际搜索词）；已包含则不重复前置，最后统一截到 155。
  const description = prependAliasToDescription(baseDescription, chineseAlias);
  const keywordCandidates = [
    name,
    pkg,
    isWebGame ? `${name}网页游戏` : `${name}游戏下载`,
    isWebGame ? `${name}在线游玩` : `${name} APK下载`,
    isWebGame ? '网页游戏' : '安卓游戏下载',
    isWebGame ? '在线游玩' : '安卓APK',
    region,
    ...(Array.isArray(input.manualKeywords) ? input.manualKeywords : []),
  ];
  const keywords = Array.from(new Set(keywordCandidates.map((item) => sanitizeSeoText(item)).filter(Boolean))).slice(0, 20);
  return { title, description: clampSeoDescription(description), keywords, aliases };
}

/**
 * 标题定稿：主体截到预算内，站点后缀始终保留。
 *
 * 模板里已经写了站点名（`... | APKScc`）时，把结尾的「分隔符 + 站点名」当固定后缀，
 * 只截主体；否则自动补 ` | 站点名`。整条标题不会超过 maxLength。
 */
export function buildSeoTitle(
  coreInput: string,
  siteName = 'APKScc',
  maxLength = SEO_TITLE_MAX,
): string {
  const core = sanitizeSeoText(coreInput);
  const site = sanitizeSeoText(siteName) || 'APKScc';
  if (!core) return site;

  const suffix = ` | ${site}`;
  const escapedSite = site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trailingSuffix = core.match(
    new RegExp(`\\s*[|｜\\-–—·]\\s*${escapedSite}\\s*$`, 'i'),
  );
  if (trailingSuffix?.index !== undefined) {
    const body = core.slice(0, trailingSuffix.index).trim();
    if (!body) return site;
    const tail = suffix.length <= maxLength ? suffix : trailingSuffix[0].trim();
    return `${clampSeoText(body, Math.max(1, maxLength - tail.length))}${tail}`.trim();
  }

  if (core.toLowerCase().includes(site.toLowerCase())) {
    return clampSeoText(core, maxLength);
  }
  return `${clampSeoText(core, Math.max(1, maxLength - suffix.length))}${suffix}`;
}

function clampSeoText(input: string, maxLength: number): string {
  const text = sanitizeSeoText(input);
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 3)).trim()}...`;
}

export function getSiteUrl(): string {
  const raw = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL;
  const normalized = raw.trim().replace(/\/+$/, '');
  return normalized || FALLBACK_SITE_URL;
}

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const siteUrl = getSiteUrl();
  if (!path.startsWith('/')) return `${siteUrl}/${path}`;
  return `${siteUrl}${path}`;
}

/** 运营占位假图专用域（如 `https://example.com/covers/x.jpg`，线上 404），任何 SEO/分享图位置都不得采用。 */
const PLACEHOLDER_ASSET_HOSTS = new Set(['example.com', 'www.example.com']);

function getUrlHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function normalizeSeoAssetUrl(input?: string | null): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  const absolute = /^https?:\/\//i.test(raw)
    ? raw
    : raw.startsWith('//')
      ? `https:${raw}`
      : absoluteUrl(raw.startsWith('/') ? raw : `/${raw}`);

  // 占位假图护栏：判空后调用方自动回退到下一级真实图（游戏图 → 站点默认分享图）。
  if (PLACEHOLDER_ASSET_HOSTS.has(getUrlHost(absolute))) return '';
  return absolute;
}

export function getSiteShareImageUrl(input?: string | null): string {
  const candidate = normalizeSeoAssetUrl(input);
  if (candidate) return candidate;
  return absoluteUrl(DEFAULT_SITE_SHARE_IMAGE);
}

export function getFirstPartyIconUrls() {
  return {
    shortcut: absoluteUrl(FIRST_PARTY_FAVICON),
    icon: absoluteUrl(FIRST_PARTY_FAVICON),
    apple: absoluteUrl(FIRST_PARTY_FAVICON),
  };
}

export function getLayoutIconMetadata(remoteFavicon?: string | null) {
  const firstPartyIcons = getFirstPartyIconUrls();
  const remote = normalizeSeoAssetUrl(remoteFavicon);

  return {
    shortcut: [firstPartyIcons.shortcut, ...(remote ? [remote] : [])],
    icon: [
      { url: firstPartyIcons.shortcut, sizes: 'any' as const },
      ...(remote ? [{ url: remote }] : []),
    ],
    apple: [firstPartyIcons.apple, ...(remote ? [remote] : [])],
  };
}

type SeoImageSource = {
  seo_image?: string | null;
  header_image?: string | null;
  detail_images?: Array<string | null | undefined> | null;
};

export function resolveGameSeoImage(game: SeoImageSource, siteShareImage?: string | null): string {
  const candidates = [
    game.seo_image,
    game.header_image,
    Array.isArray(game.detail_images) ? game.detail_images.find((item) => String(item || '').trim()) : '',
    siteShareImage,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeSeoAssetUrl(candidate);
    if (normalized) return normalized;
  }

  return absoluteUrl(DEFAULT_SITE_SHARE_IMAGE);
}
