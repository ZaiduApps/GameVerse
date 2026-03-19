const DEVICE_ID_KEY = 'tracking_device_id';
const SESSION_ID_KEY = 'tracking_session_id';

function randId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateStorageValue(key: string, prefix: string): string {
  if (typeof window === 'undefined') {
    return `${prefix}-server`;
  }
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const created = randId(prefix);
  localStorage.setItem(key, created);
  return created;
}

export function buildTrackingHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const appVersion =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    'web';

  const headers: Record<string, string> = {
    'x-client-platform': 'web',
    'x-app-version': appVersion,
    'x-device-id': getOrCreateStorageValue(DEVICE_ID_KEY, 'web'),
    'x-session-id': getOrCreateStorageValue(SESSION_ID_KEY, 'sess'),
    'x-request-id': randId('req'),
    ...extra,
  };

  Object.keys(headers).forEach((key) => {
    if (!headers[key]) {
      delete headers[key];
    }
  });

  return headers;
}
