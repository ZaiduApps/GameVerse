/**
 * 下载 302 入口的全部判定逻辑。
 *
 * 逻辑与 Next Runtime 解耦：`route.ts` 只负责「取参数 → 发一个 POST → 按判定返回」，
 * 这样三条分支（成功 302 / 参数非法 400 / 上游失败降级 302 回详情页）都能被纯函数单测覆盖。
 */

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** 详情页的失败回跳标记：`?download_error=1` */
export const DOWNLOAD_ERROR_QUERY = 'download_error=1';

/** 失败原因参数：区分「渠道不可用」与「资源失效」，两条文案不一样。 */
export const DOWNLOAD_ERROR_REASON_KEY = 'download_error_reason';

export type DownloadFailureReason = 'channel' | 'resource';

/** 包名长度上限，与 interface 侧 DownloadInfo DTO 对齐 */
const MAX_ID_LENGTH = 160;

export type DownloadRedirectIdField = 'app_id' | 'pkg';

export interface DownloadRedirectId {
  field: DownloadRedirectIdField;
  value: string;
}

export interface DownloadIssueResult {
  ok: boolean;
  payload?: unknown;
}

export type DownloadRedirectDecision =
  | { kind: 'redirect'; location: string }
  | { kind: 'bad_request'; message: string };

/**
 * 24 位 ObjectId 当 app_id 传，否则当包名传（与详情页 URL 的两种形态一致）。
 * 空值、超长、带空白的一律判非法，不做「尽力而为」的猜测。
 */
export function resolveDownloadRedirectId(rawId: unknown): DownloadRedirectId | null {
  const value = String(rawId ?? '').trim();
  if (!value || value.length > MAX_ID_LENGTH) return null;
  if (value.includes('/') || value.includes('\\') || value.includes('?')) return null;
  return OBJECT_ID_PATTERN.test(value) ? { field: 'app_id', value } : { field: 'pkg', value };
}

export function isDownloadChannelId(rawChannelId: unknown): boolean {
  return OBJECT_ID_PATTERN.test(String(rawChannelId ?? '').trim());
}

/** 只接受 http/https 的绝对地址；任何其它形态（javascript:、相对路径、空值）都不放行。 */
export function normalizeIssuedDownloadUrl(rawUrl: unknown): string | null {
  const text = String(rawUrl ?? '').trim();
  if (!text) return null;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * 从 interface 的返回体里取下载地址。
 * 该接口成功时返回 `{ url }`（无 code），失败时返回 `{ code, message }`。
 */
export function resolveIssuedDownloadUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { code?: unknown; data?: unknown; url?: unknown };
  if (record.code !== undefined && Number(record.code) !== 0) return null;
  const data = record.data as { url?: unknown } | null | undefined;
  const candidate = data && typeof data === 'object' ? data.url : record.url;
  return normalizeIssuedDownloadUrl(candidate);
}

/**
 * 失败一律回详情页：用户看到的是页面，不是 JSON 错误。
 * reason 可选：老链接（只有 download_error=1）继续可用，页面按「渠道不可用」兜底。
 */
export function buildDownloadFailureLocation(
  id: string,
  reason?: DownloadFailureReason,
): string {
  const base = `/app/${encodeURIComponent(String(id).trim())}?${DOWNLOAD_ERROR_QUERY}`;
  return reason ? `${base}&${DOWNLOAD_ERROR_REASON_KEY}=${reason}` : base;
}

/**
 * 判定一次 `/app/[id]/download/[channelId]` 请求的最终去向。
 *
 * 入参里的 `requestIssuedUrl` 由调用方注入（真实实现是 fetch interface），
 * 抛出任何异常都按「上游失败」降级——下载入口不能因为统计或上游抖动变成错误页。
 */
export async function decideDownloadRedirect(input: {
  id: unknown;
  channelId: unknown;
  requestIssuedUrl: (body: Record<string, string>) => Promise<DownloadIssueResult>;
}): Promise<DownloadRedirectDecision> {
  const resolvedId = resolveDownloadRedirectId(input.id);
  if (!resolvedId) {
    return { kind: 'bad_request', message: 'invalid app id' };
  }

  const channelId = String(input.channelId ?? '').trim();
  if (!isDownloadChannelId(channelId)) {
    return { kind: 'bad_request', message: 'invalid channel id' };
  }

  try {
    const result = await input.requestIssuedUrl({
      [resolvedId.field]: resolvedId.value,
      channel_id: channelId,
    });
    if (!result?.ok) {
      // 上游请求本身失败：渠道可能临时故障/限流，引导换渠道。
      return { kind: 'redirect', location: buildDownloadFailureLocation(resolvedId.value, 'channel') };
    }
    const url = resolveIssuedDownloadUrl(result.payload);
    if (url) {
      return { kind: 'redirect', location: url };
    }
    // 请求成功但没有可用地址：资源本身失效，引导反馈与查其它版本。
    return { kind: 'redirect', location: buildDownloadFailureLocation(resolvedId.value, 'resource') };
  } catch {
    return { kind: 'redirect', location: buildDownloadFailureLocation(resolvedId.value, 'channel') };
  }
}
