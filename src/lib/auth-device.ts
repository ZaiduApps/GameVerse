const DEVICE_ID_STORAGE_KEY = 'auth_device_id';
const TRACKING_DEVICE_ID_STORAGE_KEY = 'tracking_device_id';

function generateDeviceId(): string {
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `web-${now}-${rand}`;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'web-server';

  const existingTracking = localStorage.getItem(TRACKING_DEVICE_ID_STORAGE_KEY);
  if (existingTracking) {
    if (!localStorage.getItem(DEVICE_ID_STORAGE_KEY)) {
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, existingTracking);
    }
    return existingTracking;
  }

  const existingAuth = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingAuth) {
    localStorage.setItem(TRACKING_DEVICE_ID_STORAGE_KEY, existingAuth);
    return existingAuth;
  }

  const deviceId = generateDeviceId();
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  localStorage.setItem(TRACKING_DEVICE_ID_STORAGE_KEY, deviceId);
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
