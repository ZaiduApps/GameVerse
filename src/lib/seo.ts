const FALLBACK_SITE_URL = 'https://apks.cc';

const DEFAULT_SITE_SHARE_IMAGE = '/opengraph-image.png';
const FIRST_PARTY_FAVICON = '/favicon.ico';

export type GameDetailSeoInput = {
  name?: string | null;
  pkg?: string | null;
  type?: string | null;
  region?: string | null;
  manualTitle?: string | null;
  manualDescription?: string | null;
  manualKeywords?: Array<string | null | undefined> | null;
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

/** 详情页使用稳定下载意图文案，版本、日期、大小等易过期字段不进入主描述。 */
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
  const titleCore = manualTitle || (
    isWebGame
      ? `${name} 网页游戏${region ? ` ${region}` : ''} - 在线游玩`
      : `${name} APK下载${region ? ` - ${region}下载` : ''}`
  );
  const titleWithSite = titleCore.includes(normalizedSiteName)
    ? titleCore
    : `${titleCore} | ${normalizedSiteName}`;
  const title = clampSeoText(titleWithSite, 68);
  const description = manualDescription || (
    isWebGame
      ? `获取${name}网页游戏入口，查看游戏介绍、玩法特色和社区资讯${regionPhrase}。通过 APKScc 快速找到${name}并开始游玩。`
      : `下载${name}安卓版 APK，获取安全可靠的游戏下载入口${regionPhrase}。在 APKScc 查看游戏介绍、玩法特色和可用资源，快速安装并开始游玩。`
  );
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
  return { title, description: clampSeoText(description, 160), keywords };
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

export function normalizeSeoAssetUrl(input?: string | null): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  return absoluteUrl(raw.startsWith('/') ? raw : `/${raw}`);
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
