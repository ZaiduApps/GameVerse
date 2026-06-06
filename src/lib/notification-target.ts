export interface NotificationTargetSource {
  target_type?: string;
  target_id?: string;
  target_url?: string;
}

export interface NotificationTarget {
  href: string;
  isExternal: boolean;
}

const INTERNAL_TARGET_PREFIXES = [
  'app',
  'category',
  'community',
  'download',
  'messages',
  'profile',
  'search',
  'tag',
  'u',
];

function cleanTargetUrl(input?: string) {
  return String(input || '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function isKnownInternalPath(input: string) {
  const firstSegment = input.split(/[/?#]/)[0]?.toLowerCase();
  return INTERNAL_TARGET_PREFIXES.includes(firstSegment);
}

function getCurrentOrigin() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export function normalizeNotificationTarget(input?: string, currentOrigin = getCurrentOrigin()): NotificationTarget | null {
  const raw = cleanTargetUrl(input);
  if (!raw) return null;

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return { href: raw, isExternal: false };
  }

  if (isKnownInternalPath(raw)) {
    return { href: `/${raw.replace(/^\/+/, '')}`, isExternal: false };
  }

  try {
    const parsed = raw.startsWith('//') ? new URL(`https:${raw}`) : new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

    const normalizedHref = parsed.toString();
    if (currentOrigin && parsed.origin === currentOrigin) {
      return {
        href: `${parsed.pathname}${parsed.search}${parsed.hash}`,
        isExternal: false,
      };
    }

    return { href: normalizedHref, isExternal: true };
  } catch {
    return null;
  }
}

export function resolveNotificationTarget(
  item: NotificationTargetSource,
  currentOrigin = getCurrentOrigin(),
): NotificationTarget | null {
  const directTarget = normalizeNotificationTarget(item.target_url, currentOrigin);
  if (directTarget) return directTarget;

  const targetType = String(item.target_type || '').trim().toLowerCase();
  const targetId = String(item.target_id || '').trim();

  if (targetType === 'url' || targetType === 'link') {
    return normalizeNotificationTarget(targetId, currentOrigin);
  }

  if (!targetId && targetType !== 'feedback') return null;

  const encodedId = encodeURIComponent(targetId);
  if (targetType === 'post' || targetType === 'community_post') {
    return { href: `/community/post/${encodedId}`, isExternal: false };
  }
  if (targetType === 'app' || targetType === 'game' || targetType === 'resource') {
    return { href: `/app/${encodedId}`, isExternal: false };
  }
  if (targetType === 'user' || targetType === 'profile') {
    return { href: `/u/${encodedId}`, isExternal: false };
  }
  if (targetType === 'feedback') {
    return { href: '/profile', isExternal: false };
  }

  return null;
}
