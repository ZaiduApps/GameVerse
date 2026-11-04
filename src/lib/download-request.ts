import { trackedApiFetch } from '@/lib/api';

/**
 * 弹窗渠道下载的请求与结果归一（待决策 #119）。
 *
 * 把「发请求 → 判 HTTP/业务码 → 转成可展示的失败原因」从组件里抽出来，
 * 组件只负责状态与 UI，单测可以直接验证成功路径与三类失败文案。
 * 这里的 catch 是契约的一部分：下载失败必须变成可见结果，而不是冒泡成
 * 组件崩溃；调用方一定会把它渲染给用户（见 DownloadFailureAlert）。
 */

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
}

export type DownloadUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string; reasonCode: string | number };

export async function requestDownloadUrl(
  input: DownloadUrlRequest,
  send: typeof trackedApiFetch = trackedApiFetch,
): Promise<DownloadUrlResult> {
  const channelLabel = String(input.channelName || '').trim() || '当前渠道';
  const dedupeKey = String(input.dedupeKey || '').trim();

  try {
    const response = await send('/game/getAppDownload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 来源位：让 interface 能把「弹窗直下」与「服务端直出 302」分开统计。
        'x-ac-surface': 'detail_dialog',
        ...(dedupeKey ? { 'x-ac-dedupe-key': dedupeKey } : {}),
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
        message: `「${channelLabel}」请求失败（HTTP ${response.status}），请换一个渠道重试`,
        reasonCode: `http_${response.status}`,
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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '');
    return {
      ok: false,
      message: `「${channelLabel}」下载失败：${message || '发生未知错误'}`,
      reasonCode: 'exception',
    };
  }
}
