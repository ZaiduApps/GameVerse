import { buildTrackingHeaders } from '@/lib/tracking-headers';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const serverBaseUrl = (
  process.env.API_BASE_URL ||
  (appEnv === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
).replace(/\/+$/, '');

const browserBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.hk.apks.cc' : '/api')
).replace(/\/+$/, '');

// SSR uses API_BASE_URL*, browser uses NEXT_PUBLIC_API_BASE_URL (or env defaults).
export const API_BASE_URL =
  typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl;

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

export function trackedApiFetch(path: string, init: RequestInit = {}) {
  const trackingHeaders =
    typeof window === 'undefined'
      ? { 'x-tracking-skip': '1' }
      : buildTrackingHeaders();

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...trackingHeaders,
      ...(init.headers || {}),
    },
  });
}
