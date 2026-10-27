/**
 * 认证请求的失败语义：把「限流 / 超时 / 网络 / 服务端 / 业务拒绝」分开，
 * 让 UI 能给出可读且可操作的提示，而不是统一「网络请求失败」。
 *
 * 429 的文案与重试秒数同时供登录、注册、验证码三处复用；重试秒数优先取
 * `Retry-After`（秒数或 HTTP 日期），缺失时给通用文案。
 */

export type AuthFailureKind = 'rate_limited' | 'timeout' | 'network' | 'server' | 'business';

export interface AuthFailure {
  kind: AuthFailureKind;
  message: string;
  /** 同一请求直接重试是否有意义（限流/超时/网络/5xx 为 true）。 */
  retryable: boolean;
  /** 仅 429 且服务端给了 Retry-After 时存在。 */
  retryAfterSeconds?: number;
}

export interface ApiErrorEnvelope {
  code?: number;
  message?: string;
}

const MAX_RETRY_AFTER_SECONDS = 3600;
const DEFAULT_FALLBACK_MESSAGE = '操作失败，请稍后重试';

export function parseRetryAfterSeconds(header: string | null | undefined, now = Date.now()): number | null {
  const value = String(header || '').trim();
  if (!value) return null;

  // 纯数字（含负数写法的非法值）不走 Date.parse：'-5' 会被解析成离谱的日期。
  if (/^[-+]?\d+(?:\.\d+)?$/.test(value)) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    return Math.min(Math.ceil(seconds), MAX_RETRY_AFTER_SECONDS);
  }

  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    const seconds = Math.ceil((asDate - now) / 1000);
    return seconds > 0 ? Math.min(seconds, MAX_RETRY_AFTER_SECONDS) : 0;
  }

  return null;
}

export function formatRateLimitMessage(retryAfterSeconds?: number | null): string {
  return retryAfterSeconds && retryAfterSeconds > 0
    ? `操作太频繁，请在 ${Math.ceil(retryAfterSeconds)} 秒后重试`
    : '操作太频繁，请稍后重试';
}

export function describeAuthFailure(
  response: Pick<Response, 'status' | 'headers'> | null,
  payload: ApiErrorEnvelope | null,
  fallback = DEFAULT_FALLBACK_MESSAGE,
): AuthFailure {
  const status = Number(response?.status || 0);
  const code = Number(payload?.code || 0);

  if (status === 429 || code === 429) {
    const retryAfterSeconds = response ? parseRetryAfterSeconds(response.headers.get('retry-after')) : null;
    return {
      kind: 'rate_limited',
      message: formatRateLimitMessage(retryAfterSeconds),
      retryable: true,
      ...(retryAfterSeconds !== null ? { retryAfterSeconds } : {}),
    };
  }

  // 业务 code 可能远大于 500（如 1001），只有 500~599 才是服务端故障。
  if (status >= 500 || (code >= 500 && code < 600)) {
    return { kind: 'server', message: '服务暂时不可用，请稍后重试', retryable: true };
  }

  const message = String(payload?.message || '').trim();
  return { kind: 'business', message: message || fallback, retryable: false };
}

export type AuthAction = 'send-code' | 'login' | 'register';

const AUTH_ACTION_TITLES: Record<AuthAction, { failure: string; rateLimited: string }> = {
  'send-code': { failure: '发送失败', rateLimited: '发送太频繁' },
  login: { failure: '登录失败', rateLimited: '登录太频繁' },
  register: { failure: '注册失败', rateLimited: '注册太频繁' },
};

/**
 * 认证失败时 toast 的标题与正文（登录 / 注册 / 验证码三处共用）。
 * 限流用独立的标题，避免被用户当成账号密码错误。
 */
export function buildAuthFailureToast(
  action: AuthAction,
  failure: AuthFailure,
): { title: string; description: string } {
  const titles = AUTH_ACTION_TITLES[action];
  return {
    title: failure.kind === 'rate_limited' ? titles.rateLimited : titles.failure,
    description: failure.message,
  };
}

export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name || '') : '';
  return name === 'TimeoutError';
}

export function describeFetchException(
  error: unknown,
  fallback = '网络连接失败，请检查网络后重试',
): AuthFailure {
  if (isTimeoutError(error)) {
    return { kind: 'timeout', message: '请求超时，请检查网络后重试', retryable: true };
  }
  // AbortError 视为请求被中断：可能与超时同源，按可重试处理并给出网络提示。
  const name = error && typeof error === 'object' && 'name' in error
    ? String((error as { name?: unknown }).name || '')
    : '';
  if (name === 'AbortError') {
    return { kind: 'network', message: '请求已中断，请重试', retryable: true };
  }
  return { kind: 'network', message: fallback, retryable: true };
}
