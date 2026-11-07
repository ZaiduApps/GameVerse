import { trackedApiFetch } from '@/lib/api';
import { currentDownloadPagePath, normalizeDownloadPagePath } from '@/lib/download-path';

/**
 * 弹窗渠道下载的请求与结果归一（待决策 #119 / #140）。
 *
 * 把「发请求 → 判 HTTP/业务码 → 转成可展示的失败原因」从组件里抽出来，
 * 组件只负责状态与 UI，单测可以直接验证成功路径与各类失败文案。
 * 这里的 catch 是契约的一部分：下载失败必须变成可见结果，而不是冒泡成
 * 组件崩溃；调用方一定会把它渲染给用户（见 DownloadFailureAlert）。
 */

/**
 * 3 秒失败可见（待决策 #140）：渠道请求超过这个时限即按超时处理，页面给出
 * 可见失败态与重试/备用渠道。默认的 15s 对「点了没反应」太久了。
 *
 * 取 2500ms 而不是 3000ms：超时判定后还有 React 状态更新、浏览器绘制与
 * 用户可感知的一小段延迟，留 500ms 余量才能保证「3 秒内看到失败态」。
 */
export const DOWNLOAD_REQUEST_TIMEOUT_MS = 2500;

/**
 * 失败原因分类（待决策 #140）：与 #131 的 fail_reason 事件共用一套口径，
 * `http_status` = 非 2xx，`timeout` = 请求超时，`network` = 请求异常/断网，
 * `no_channel` = 渠道不可用（业务码失败、无地址、参数缺失或没有可用渠道）。
 */
export type DownloadFailureReasonKind =
  | 'http_status'
  | 'timeout'
  | 'network'
  | 'no_channel';

export interface DownloadUrlRequest {
  appId?: string | null;
  pkg?: string | null;
  channelId: string;
  channelName?: string | null;
  /**
   * 本次终态意图的 dedupe_key（待决策 #131）：与 download_click / fail_reason
   * 同值，服务端据此把签发事件归到同一次意图并做顺序去重。老调用方不传时
   * 不发送该头，行为与之前一致。
   */
  dedupeKey?: string | null;
  /** 页面 pathname（待决策 #140）；不传时浏览器环境自动取当前页面。 */
  path?: string | null;
}

export type DownloadUrlResult =
  | { ok: true; url: string }
  | {
      ok: false;
      message: string;
      reasonCode: string | number;
      reasonKind: DownloadFailureReasonKind;
    };

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = String((error as { name?: unknown }).name || '');
  const message = error instanceof Error ? error.message : String(error);
  return name === 'TimeoutError' || /\btimeout\b/i.test(message);
}

/**
 * 失败文案只描述症状，不写死机型/系统版本，也不承诺「换源一定能下」；
 * 备用渠道是动作选项，不是承诺（待决策 #144）。
 */
export async function requestDownloadUrl(
  input: DownloadUrlRequest,
  send: typeof trackedApiFetch = trackedApiFetch,
): Promise<DownloadUrlResult> {
  const channelLabel = String(input.channelName || '').trim() || '当前渠道';
  const dedupeKey = String(input.dedupeKey || '').trim();
  const pagePath =
    normalizeDownloadPagePath(input.path) || currentDownloadPagePath();

  try {
    const response = await send('/game/getAppDownload', {
      method: 'POST',
      timeoutMs: DOWNLOAD_REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        // 来源位：让 interface 能把「弹窗直下」与「服务端直出 302」分开统计。
        'x-ac-surface': 'detail_dialog',
        ...(dedupeKey ? { 'x-ac-dedupe-key': dedupeKey } : {}),
        ...(pagePath ? { 'x-ac-path': pagePath } : {}),
      },
      body: JSON.stringify({
        app_id: input.appId,
        pkg: input.pkg,
        channel_id: input.channelId,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `「${channelLabel}」暂时没有响应（HTTP ${response.status}），可以重试或稍后再试`,
        reasonCode: `http_${response.status}`,
        reasonKind: 'http_status',
      };
    }

    const result = await response.json();
    if (result.code === 0 && result.data?.url) {
      return { ok: true, url: String(result.data.url) };
    }

    return {
      ok: false,
      message: `「${channelLabel}」暂时不可用：${result.message || '无法获取下载链接'}`,
      reasonCode: result.code || 'no_url',
      reasonKind: 'no_channel',
    };
  } catch (error) {
    if (isTimeoutError(error)) {
      return {
        ok: false,
        message: `「${channelLabel}」响应超时，可以重试或稍后再试`,
        reasonCode: 'timeout',
        reasonKind: 'timeout',
      };
    }
    const message = error instanceof Error ? error.message : String(error || '');
    return {
      ok: false,
      message: `「${channelLabel}」连接失败：${message || '网络异常'}`,
      reasonCode: 'exception',
      reasonKind: 'network',
    };
  }
}
