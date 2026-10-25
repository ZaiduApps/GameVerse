import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';
import { buildTrackingHeaders } from '@/lib/tracking-headers';

/** 需要登录的请求在拿不到 token 时抛出，避免把未鉴权请求发出去。 */
export class MissingAuthTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingAuthTokenError';
  }
}

/**
 * 校验并归一化 token：trim 后为空即抛出，绝不返回 null 或静默降级。
 * `action` 用于异常信息里定位调用点（函数名或 logKey）。
 */
export function requireToken(token: string | undefined | null, action: string): string {
  const normalized = typeof token === 'string' ? token.trim() : '';
  if (!normalized) {
    throw new MissingAuthTokenError(`[${action}] 缺少登录 token，请求未发出`);
  }
  return normalized;
}

export interface AuthedFetchAuth {
  token: string;
  method?: string;
  body?: BodyInit | null;
  timeoutMs?: number;
  logKey?: string;
}

/**
 * 带 Bearer token 的 trackedApiFetch 薄封装。
 * - token 为空时在校验阶段抛 MissingAuthTokenError，不发请求；
 * - 非 2xx 响应原样返回，错误分支仍由调用方判断；
 * - 请求头以 buildTrackingHeaders() 打底，字符串 body（JSON）默认补 Content-Type，
 *   `init.headers` 放最后以便覆盖单个头。
 */
export async function authedFetch(
  path: string,
  init: TrackedFetchInit = {},
  auth: AuthedFetchAuth,
): Promise<Response> {
  const action = auth.logKey || 'authedFetch';
  const token = requireToken(auth.token, action);
  const body = auth.body ?? init.body;
  const bodyHeaders: Record<string, string> =
    typeof body === 'string' ? { 'Content-Type': 'application/json' } : {};
  return trackedApiFetch(path, {
    ...init,
    method: auth.method ?? init.method,
    body,
    timeoutMs: auth.timeoutMs ?? init.timeoutMs,
    logKey: auth.logKey ?? init.logKey,
    headers: {
      ...buildTrackingHeaders(),
      ...bodyHeaders,
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
}
