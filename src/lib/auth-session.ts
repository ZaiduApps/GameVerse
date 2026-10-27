import { trackedApiFetch } from '@/lib/api';
import { getDeviceHeaders } from '@/lib/auth-device';
import { describeAuthFailure, describeFetchException, type AuthFailure } from '@/lib/auth-errors';
import type { User } from '@/types';

/**
 * 登录会话的存储、广播与刷新。
 *
 * - 单飞：并发 401 只发一次 `/auth/refresh`，所有调用方拿到同一份结果；
 * - 广播：持久化后通知本页订阅者；其它标签页靠 localStorage 的 `storage` 事件同步；
 * - 过期保护：刷新返回时若存储里的 token 已经变了（用户期间登出/换号），丢弃结果，
 *   不把已退出的会话写回去。
 */

export const AUTH_TOKEN_STORAGE_KEY = 'auth_token';
export const AUTH_USER_STORAGE_KEY = 'auth_user';
export const AUTH_STORAGE_KEYS: readonly string[] = [AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY];

/** 认证类请求统一 15s 超时：挂死的 /me 不能拖住整个站点。 */
export const AUTH_REQUEST_TIMEOUT_MS = 15_000;

export interface StoredSession {
  token: string;
  user: User;
}

export type SessionRefreshResult =
  | { status: 'refreshed'; session: StoredSession }
  | { status: 'unauthorized' }
  | { status: 'skipped' }
  | { status: 'failed'; failure: AuthFailure };

type SessionListener = (session: StoredSession | null) => void;

const listeners = new Set<SessionListener>();
let refreshInFlight: { token: string; promise: Promise<SessionRefreshResult> } | null = null;

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return null;
    return globalThis.localStorage ?? null;
  } catch {
    // 隐私模式下访问 localStorage 可能直接抛错，按「无存储」处理。
    return null;
  }
}

export function readStoredSession(): StoredSession | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const token = String(storage.getItem(AUTH_TOKEN_STORAGE_KEY) || '').trim();
    const rawUser = storage.getItem(AUTH_USER_STORAGE_KEY);
    if (!token || !rawUser || rawUser === 'undefined') return null;
    const user = JSON.parse(rawUser) as User | null;
    if (!user) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export function persistSession(session: StoredSession): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token);
      storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
    } catch {
      // 写入失败（配额/隐私模式）不阻断内存中的登录态。
    }
  }
  notify(session);
}

export function clearStoredSession(): void {
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      storage.removeItem(AUTH_USER_STORAGE_KEY);
    } catch {
      // 同上：清理失败不影响内存态。
    }
  }
  notify(null);
}

export function subscribeStoredSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(session: StoredSession | null): void {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch {
      // 单个订阅者抛错不影响其它订阅者。
    }
  });
}

function persistIfCurrent(session: StoredSession, expectedToken: string): boolean {
  const current = readStoredSession();
  if (!current || current.token !== expectedToken) return false;
  persistSession(session);
  return true;
}

async function readJsonEnvelope(response: Response): Promise<{ code?: number; message?: string; data?: unknown } | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isUnauthorized(response: Response, payload: { code?: number } | null): boolean {
  return response.status === 401 || Number(payload?.code || 0) === 401;
}

function fetchMe(token: string): Promise<Response> {
  return trackedApiFetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
    logKey: 'auth.me',
  });
}

async function requestTokenRefresh(token: string): Promise<SessionRefreshResult> {
  try {
    const response = await trackedApiFetch('/auth/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...getDeviceHeaders(),
      },
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
      logKey: 'auth.refresh',
    });
    const payload = await readJsonEnvelope(response);
    const nextToken = String((payload?.data as { token?: string } | null)?.token || '').trim();
    if (Number(payload?.code || 0) === 0 && nextToken) {
      const user = readStoredSession()?.user;
      if (!user) return { status: 'unauthorized' };
      const session: StoredSession = { token: nextToken, user };
      // 先落盘换 token，user 随后由 /me 刷新；这样并发/其它标签页立刻拿到新 token。
      if (!persistIfCurrent(session, token)) return { status: 'skipped' };
      return { status: 'refreshed', session };
    }
    if (isUnauthorized(response, payload)) return { status: 'unauthorized' };
    return { status: 'failed', failure: describeAuthFailure(response, payload, '登录状态刷新失败，请重新登录') };
  } catch (error) {
    return { status: 'failed', failure: describeFetchException(error) };
  }
}

async function runSessionRefresh(token: string): Promise<SessionRefreshResult> {
  try {
    const meResponse = await fetchMe(token);
    const mePayload = await readJsonEnvelope(meResponse);
    const meData = mePayload?.data as User | null | undefined;

    if (Number(mePayload?.code || 0) === 0 && meData) {
      const session: StoredSession = { token, user: meData };
      if (!persistIfCurrent(session, token)) return { status: 'skipped' };
      return { status: 'refreshed', session };
    }

    if (isUnauthorized(meResponse, mePayload)) {
      const refreshResult = await requestTokenRefresh(token);
      if (refreshResult.status !== 'refreshed') return refreshResult;

      // 刷新期间用户可能已登出或换了账号：不要拿旧会话的结果覆盖新状态。
      const currentToken = readStoredSession()?.token;
      if (currentToken && currentToken !== refreshResult.session.token) return { status: 'skipped' };

      const retryResponse = await fetchMe(refreshResult.session.token);
      const retryPayload = await readJsonEnvelope(retryResponse);
      const retryData = retryPayload?.data as User | null | undefined;
      if (Number(retryPayload?.code || 0) === 0 && retryData) {
        const session: StoredSession = { token: refreshResult.session.token, user: retryData };
        if (!persistIfCurrent(session, refreshResult.session.token)) return { status: 'skipped' };
        return { status: 'refreshed', session };
      }
      if (isUnauthorized(retryResponse, retryPayload)) return { status: 'unauthorized' };
      return { status: 'failed', failure: describeAuthFailure(retryResponse, retryPayload, '登录状态刷新失败，请重新登录') };
    }

    return { status: 'failed', failure: describeAuthFailure(meResponse, mePayload, '登录状态校验失败，请重新登录') };
  } catch (error) {
    return { status: 'failed', failure: describeFetchException(error) };
  }
}

/**
 * 单飞刷新：同一时刻只允许一个刷新在飞，并发调用共享同一个 Promise。
 * 无 token 时直接返回 skipped，不发请求。
 */
export function refreshSession(token: string): Promise<SessionRefreshResult> {
  const normalized = String(token || '').trim();
  if (!normalized) return Promise.resolve({ status: 'skipped' });
  if (!refreshInFlight || refreshInFlight.token !== normalized) {
    const promise = runSessionRefresh(normalized).finally(() => {
      if (refreshInFlight?.promise === promise) refreshInFlight = null;
    });
    refreshInFlight = { token: normalized, promise };
  }
  return refreshInFlight.promise;
}
