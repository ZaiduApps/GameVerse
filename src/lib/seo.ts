const FALLBACK_SITE_URL = 'https://apks.cc';

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
