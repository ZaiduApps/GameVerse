const FALLBACK_SITE_URL = 'https://apks.cc';

const DEFAULT_SITE_SHARE_IMAGE = '/opengraph-image.png';
const FIRST_PARTY_FAVICON = '/favicon.ico';

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
