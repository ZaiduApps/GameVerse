const GOOGLE_PLAY_IMAGE_HOST = 'play-lh.googleusercontent.com';
const GOOGLE_PLAY_RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;
const WEBP_VARIANT_HOSTS = new Set([
  'tc-new.z.wiki',
  'img.pagehost.cn',
]);

export interface ResponsiveImageAttributes {
  src: string;
  srcSet?: string;
}

function normalizePreviewWidth(input: number): number | null {
  if (!Number.isFinite(input) || input <= 0) return null;
  return Math.min(2560, Math.max(32, Math.round(input)));
}

function getGooglePlaySourceWidth(url: URL): number | null {
  const variant = url.pathname.match(/=([^/]+)$/)?.[1] || '';
  const sourceWidth = Number(variant.match(/(?:^|-)w(\d+)(?:-|$)/i)?.[1] || 0);
  if (!Number.isFinite(sourceWidth) || sourceWidth < GOOGLE_PLAY_RESPONSIVE_WIDTHS[0]) {
    return null;
  }
  return normalizePreviewWidth(sourceWidth);
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

export function getResponsiveImageAttributes(
  input: string | null | undefined,
): ResponsiveImageAttributes {
  const src = String(input || '').trim();
  if (!src) return { src: '' };

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return { src };
  }

  if (url.protocol !== 'https:' || url.hostname !== GOOGLE_PLAY_IMAGE_HOST) {
    return { src };
  }

  const sourceWidth = getGooglePlaySourceWidth(url);
  if (!sourceWidth) return { src };

  const responsiveWidths = Array.from(new Set([
    ...GOOGLE_PLAY_RESPONSIVE_WIDTHS.filter((width) => width <= sourceWidth),
    sourceWidth,
  ])).sort((left, right) => left - right);

  return {
    src,
    srcSet: responsiveWidths
      .map((width) => `${getPreviewImageUrl(src, width)} ${width}w`)
      .join(', '),
  };
}
