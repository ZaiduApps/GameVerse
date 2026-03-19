const DEVICE_ID_STORAGE_KEY = 'auth_device_id';

function generateDeviceId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `web-${now}-${rand}`;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'web-server';

  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;

  const deviceId = generateDeviceId();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Web Browser';

  const ua = navigator.userAgent || 'Unknown Browser';
  const platform = navigator.platform || 'Unknown Platform';
  return `Web-${platform}-${ua.slice(0, 60)}`;
}

export function getDeviceHeaders(): Record<string, string> {
  return {
    'x-device-id': getDeviceId(),
    'x-device-name': getDeviceName(),
  };
}
