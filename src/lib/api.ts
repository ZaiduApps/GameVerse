import { buildTrackingHeaders } from '@/lib/tracking-headers';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const serverBaseUrl = (
  process.env.API_BASE_URL ||
  (appEnv === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
).replace(/\/+$/, '');

// Browser-side requests always go through Next.js /api rewrite to avoid CORS.
export const API_BASE_URL =
  typeof window === 'undefined' ? serverBaseUrl : '/api';

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

export function trackedApiFetch(path: string, init: RequestInit = {}) {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...buildTrackingHeaders(),
      ...(init.headers || {}),
    },
  });
}
