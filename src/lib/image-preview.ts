const GOOGLE_PLAY_IMAGE_HOST = 'play-lh.googleusercontent.com';
const WEBP_VARIANT_HOSTS = new Set([
  'tc-new.z.wiki',
  'img.pagehost.cn',
]);

function normalizePreviewWidth(input: number): number | null {
  if (!Number.isFinite(input) || input <= 0) return null;
  return Math.min(2560, Math.max(32, Math.round(input)));
}

export function getPreviewImageUrl(input: string | null | undefined, width: number): string {
  const raw = String(input || '').trim();
  if (!raw) return '';

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (url.protocol !== 'https:') return raw;

  if (url.hostname === GOOGLE_PLAY_IMAGE_HOST) {
    const previewWidth = normalizePreviewWidth(width);
    if (!previewWidth) return raw;
    url.pathname = `${url.pathname.replace(/=[^/]+$/, '')}=w${previewWidth}-rw`;
    return url.toString();
  }

  if (
    WEBP_VARIANT_HOSTS.has(url.hostname)
    && !url.pathname.endsWith('/webp')
    && /\.(?:jpe?g|png)$/i.test(url.pathname)
  ) {
    url.pathname = `${url.pathname}/webp`;
    return url.toString();
  }

  return raw;
}
