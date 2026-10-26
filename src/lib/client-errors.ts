import { trackedApiFetch } from '@/lib/api';

/**
 * 前端错误上报统一入口。
 *
 * 契约（由 interface 批次 II 提供）：`POST /tracking/admin-client-error`，
 * 浏览器侧走 `/api` 反代即 `/api/tracking/admin-client-error`。接口未上线时
 * 请求会 404/失败，这里静默吞掉——上报永远不能影响页面本身。
 *
 * 采样与去重：20% 采样（随机），同一 message 在 60s 内只报一次，避免单个
 * 循环渲染刷爆上报通道。
 */

export const CLIENT_ERROR_REPORT_PATH = '/tracking/admin-client-error';
export const CLIENT_ERROR_SAMPLE_RATE = 0.2;
export const CLIENT_ERROR_DEDUPE_WINDOW_MS = 60_000;
export const CLIENT_ERROR_REPORT_TIMEOUT_MS = 5_000;

const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 4_000;
const MAX_CONTEXT_VALUE_LENGTH = 200;
const MAX_UA_LENGTH = 300;

export interface ClientErrorReport {
  source: 'gameverse-web';
  message: string;
  name: string;
  stack: string;
  digest: string;
  url: string;
  user_agent: string;
  context: Record<string, string>;
  occurred_at: string;
}

export type ClientErrorContext = Record<string, string | number | boolean | null | undefined>;

const reportedAt = new Map<string, number>();

function truncate(input: string, max: number): string {
  return input.length > max ? `${input.slice(0, max)}…` : input;
}

/** 去掉 URL 的 query/hash，只保留 origin + pathname。 */
export function sanitizeUrlForReport(href: string): string {
  const value = String(href || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return truncate(value.split('#')[0].split('?')[0], 300);
  }
}

/**
 * 脱敏一段文本：邮箱、Bearer、常见敏感 query/参数、URL 查询串、超长不透明串。
 * 顺序有依赖：先处理 `user:pass@` 与 Bearer，再处理 key=value，最后处理长 token。
 */
export function redactSensitiveText(input: string): string {
  if (!input) return '';

  return input
    // URL 里的 userinfo
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, '$1[redacted]@')
    // Authorization: Bearer xxx
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    // 邮箱
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    // 常见敏感参数（query / JSON / header 风格）
    .replace(
      /\b(password|passwd|pwd|token|access_token|refresh_token|auth|authorization|api_key|apikey|api-key|secret|signature|sig)=([^&\s"'<>]+)/gi,
      '$1=[redacted]',
    )
    // URL 查询串整体脱敏（保留路径，避免把搜索词/邮箱带出去）
    .replace(/(https?:\/\/[^\s?#]+)\?[^\s]*/gi, '$1?[redacted]')
    // 超长不透明串（JWT、hash、base64 token）
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]');
}

function normalizeContext(context: ClientErrorContext | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!context) return result;
  for (const [key, value] of Object.entries(context)) {
    if (value === null || value === undefined) continue;
    const safeKey = truncate(String(key), 60);
    if (!safeKey) continue;
    const raw = String(value);
    // 路径/URL 类 context 统一去掉查询串，避免把搜索词、邮箱带进上报。
    const cleaned = /^(?:https?:\/\/|\/)/i.test(raw.trim()) ? sanitizeUrlForReport(raw) : raw;
    result[safeKey] = truncate(redactSensitiveText(cleaned), MAX_CONTEXT_VALUE_LENGTH);
  }
  return result;
}

export function buildClientErrorReport(
  error: unknown,
  context?: ClientErrorContext,
  options: { now?: Date; href?: string; userAgent?: string } = {},
): ClientErrorReport {
  const now = options.now ?? new Date();
  const href = options.href ?? (typeof window !== 'undefined' ? String(window.location?.href || '') : '');
  const userAgent = options.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');

  const rawMessage = error instanceof Error ? error.message : String(error ?? '');
  const rawStack = error instanceof Error ? String(error.stack || '') : '';
  const rawName = error instanceof Error ? String(error.name || 'Error') : 'Error';
  const rawDigest = error && typeof error === 'object' && 'digest' in error
    ? String((error as { digest?: unknown }).digest || '')
    : '';

  return {
    source: 'gameverse-web',
    message: truncate(redactSensitiveText(rawMessage || 'unknown client error'), MAX_MESSAGE_LENGTH),
    name: truncate(redactSensitiveText(rawName), 120),
    stack: truncate(redactSensitiveText(rawStack), MAX_STACK_LENGTH),
    digest: truncate(redactSensitiveText(rawDigest), 120),
    url: sanitizeUrlForReport(href),
    user_agent: truncate(String(userAgent || ''), MAX_UA_LENGTH),
    context: normalizeContext(context),
    occurred_at: now.toISOString(),
  };
}

/** 测试可注入时钟与随机源；生产走真实值。 */
export function shouldReportClientError(
  message: string,
  options: { now?: number; random?: () => number } = {},
): boolean {
  const key = String(message || '').trim();
  if (!key) return false;

  const now = options.now ?? Date.now();
  const random = options.random ?? Math.random;

  // 先去重：窗口内同一条 message 不再重复上报，也不消耗采样机会。
  for (const [seenKey, seenAt] of reportedAt) {
    if (now - seenAt >= CLIENT_ERROR_DEDUPE_WINDOW_MS) reportedAt.delete(seenKey);
  }
  if (reportedAt.has(key)) return false;

  if (random() >= CLIENT_ERROR_SAMPLE_RATE) return false;

  reportedAt.set(key, now);
  return true;
}

/** 仅供测试重置去重状态。 */
export function resetClientErrorReportState(): void {
  reportedAt.clear();
}

/**
 * 上报客户端错误。绝不抛错、不阻塞调用方：上报失败（含接口未上线）静默丢弃。
 * `options.random` 仅用于测试注入采样随机源。
 */
export async function reportClientError(
  error: unknown,
  context?: ClientErrorContext,
  options: { random?: () => number } = {},
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const report = buildClientErrorReport(error, context);
    if (!shouldReportClientError(report.message, { random: options.random })) return;

    await trackedApiFetch(CLIENT_ERROR_REPORT_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      timeoutMs: CLIENT_ERROR_REPORT_TIMEOUT_MS,
      keepalive: true,
      logKey: 'client-error.report',
    });
  } catch {
    // 静默：接口未上线 / 网络异常都不应影响页面。
  }
}
