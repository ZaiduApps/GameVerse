import { buildTrackingHeaders } from '@/lib/tracking-headers';

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const serverBaseUrl = (
  process.env.API_BASE_URL ||
  (appEnv === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://localhost:9527')
).replace(/\/+$/, '');

const rawBrowserBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
const useBrowserProxy = (process.env.NEXT_PUBLIC_API_USE_PROXY || 'true').toLowerCase() !== 'false';
const browserBaseUrl = (
  useBrowserProxy
    ? '/api'
    : rawBrowserBaseUrl || '/api'
).replace(/\/+$/, '');

// SSR uses API_BASE_URL*, browser uses NEXT_PUBLIC_API_BASE_URL (or env defaults).
export const API_BASE_URL =
  typeof window === 'undefined' ? serverBaseUrl : browserBaseUrl;

/**
 * 业务请求的默认超时。不传 `timeoutMs` 时必须仍然有界：上游卡住时请求悬挂到浏览器
 * 默认超时（可达数分钟），用户看到的是「转圈不动」，`auth-errors` 的超时分类也永远
 * 走不到。个别跑得更久的调用点显式传更大的值，不要为了迁就它们抬高这个默认。
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export interface TrackedFetchInit extends RequestInit {
  /** 不传用 `DEFAULT_REQUEST_TIMEOUT_MS`；传 0 或负数表示显式不限时。 */
  timeoutMs?: number;
  logKey?: string;
}

export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) return `${API_BASE_URL}/${path}`;
  return `${API_BASE_URL}${path}`;
}

function createAbortError(message: string) {
  try {
    return new DOMException(message, 'TimeoutError');
  } catch {
    const error = new Error(message);
    error.name = 'TimeoutError';
    return error;
  }
}

function createTimeoutError(timeoutMs: number, path: string) {
  return createAbortError(`The operation was aborted due to timeout after ${timeoutMs}ms: ${path}`);
}

function isAbortLikeError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name || '') : '';
  return name === 'AbortError' || name === 'TimeoutError';
}

function isConnectionRefusedError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const message = error instanceof Error ? error.message : String(error);
  if (/ECONNREFUSED/i.test(message)) return true;
  const cause = (error as { cause?: unknown }).cause;
  if (cause && typeof cause === 'object' && 'code' in cause) {
    const code = String((cause as { code?: unknown }).code || '');
    if (code.toUpperCase() === 'ECONNREFUSED') return true;
  }
  return false;
}

function resolveFallbackRequestUrl(requestUrl: string) {
  if (typeof window !== 'undefined') return '';
  try {
    const parsed = new URL(requestUrl);
    if (parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'localhost';
      return parsed.toString();
    }
    if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1';
      return parsed.toString();
    }
    return '';
  } catch {
    return '';
  }
}

function withTimeoutSignal(signal: AbortSignal | null | undefined, timeoutMs?: number) {
  if (!timeoutMs || timeoutMs <= 0) {
    return {
      signal,
      cleanup: () => {},
      didTimeOut: () => false,
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => {
    controller.abort(signal?.reason || createAbortError('The operation was aborted.'));
  };

  if (signal?.aborted) {
    forwardAbort();
  } else if (signal) {
    signal.addEventListener('abort', forwardAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(createAbortError('The operation was aborted due to timeout'));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener('abort', forwardAbort);
      }
    },
  };
}

export async function trackedApiFetch(path: string, init: TrackedFetchInit = {}) {
  const { timeoutMs: requestedTimeoutMs, logKey, signal, ...fetchInit } = init;
  const timeoutMs = requestedTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const trackingHeaders =
    typeof window === 'undefined'
      ? {
          'x-tracking-skip': '1',
          'x-client-platform': 'web',
          'x-app-version': process.env.NEXT_PUBLIC_APP_VERSION || process.env.NEXT_PUBLIC_GIT_SHA || 'web-server',
        }
      : buildTrackingHeaders();
  const requestUrl = apiUrl(path);
  const fallbackRequestUrl = resolveFallbackRequestUrl(requestUrl);
  const { signal: timeoutSignal, cleanup, didTimeOut } = withTimeoutSignal(signal, timeoutMs);

  try {
    return await fetch(requestUrl, {
      ...fetchInit,
      signal: timeoutSignal || undefined,
      headers: {
        ...trackingHeaders,
        ...(fetchInit.headers || {}),
      },
    });
  } catch (error) {
    // 运行时决定 fetch 被 abort 时抛 AbortError 还是 signal.reason（Node 18 与浏览器的
    // 行为并不一致），这里统一归一成 TimeoutError，让 classify 不依赖运行时。
    const failure = didTimeOut() ? createTimeoutError(timeoutMs, path) : error;
    if (
      fallbackRequestUrl &&
      fallbackRequestUrl !== requestUrl &&
      !isAbortLikeError(failure) &&
      isConnectionRefusedError(failure)
    ) {
      try {
        return await fetch(fallbackRequestUrl, {
          ...fetchInit,
          signal: timeoutSignal || undefined,
          headers: {
            ...trackingHeaders,
            ...(fetchInit.headers || {}),
          },
        });
      } catch (fallbackError) {
        const fallbackFailure = didTimeOut() ? createTimeoutError(timeoutMs, path) : fallbackError;
        if (logKey) {
          console.error(`[${logKey}] fallback request exception`, {
            path,
            requestUrl: fallbackRequestUrl,
            timeoutMs,
            timedOut: didTimeOut(),
            aborted: isAbortLikeError(fallbackFailure),
            error: fallbackFailure instanceof Error ? fallbackFailure.message : String(fallbackFailure),
          });
        }
        throw fallbackFailure;
      }
    }
    if (logKey) {
      console.error(`[${logKey}] request exception`, {
        path,
        requestUrl,
        timeoutMs,
        timedOut: didTimeOut(),
        aborted: isAbortLikeError(failure),
        error: failure instanceof Error ? failure.message : String(failure),
      });
    }
    throw failure;
  } finally {
    cleanup();
  }
}
